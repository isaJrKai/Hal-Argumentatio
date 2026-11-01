import { GoogleGenAI } from '@google/genai';
import { LandingPageConfig, TradeType } from '../components/landing/types';
import { TRADE_TEMPLATES } from '../components/landing/templates';
import { generateLandingPageHtml } from '../components/landing/htmlGenerator';
import { safeExtractJson } from './hermesLab';
import { applyHumanizerPass } from './landingHumanizer';

export interface ContractorGeneratorParams {
  prompt: string;
  trade: TradeType;
  city: string;
  businessName?: string;
  phone?: string;
  address?: string;
  contractorId?: string;
  audience?: string;
  primaryGoal?: string;
  coreOffer?: string;
  proofAvailable?: string;
  variantArchetype?: 'emergency_dispatch' | 'master_craftsman' | 'flat_rate';
}

export async function generateContractorLandingPage(params: ContractorGeneratorParams): Promise<{ config: LandingPageConfig; html: string }> {
  const { 
    prompt, 
    trade, 
    city, 
    businessName, 
    phone, 
    address,
    contractorId,
    audience, 
    primaryGoal, 
    coreOffer, 
    proofAvailable,
    variantArchetype = 'master_craftsman'
  } = params;
  const apiKey = process.env.GEMINI_API_KEY;

  const baseTemplate: LandingPageConfig = JSON.parse(
    JSON.stringify(TRADE_TEMPLATES[trade] || TRADE_TEMPLATES.plumbing)
  );

  baseTemplate.id = 'lp_' + Date.now();
  if (businessName) baseTemplate.businessName = businessName;
  if (city) baseTemplate.city = city;
  if (phone) baseTemplate.phone = phone;
  if (address) baseTemplate.sections.footer.address = address;
  if (contractorId) baseTemplate.contractorId = contractorId;

  // Set directional archetype branding/tone
  if (variantArchetype === 'emergency_dispatch') {
    baseTemplate.branding.colorPreset = 'executive_carbon';
    baseTemplate.branding.primaryColor = '#f59e0b';
    baseTemplate.branding.secondaryColor = '#0f172a';
    baseTemplate.emergencyService = true;
    baseTemplate.dispatchWindow = '30-45 Minutes';
  } else if (variantArchetype === 'master_craftsman') {
    baseTemplate.branding.colorPreset = 'paper_ink';
    baseTemplate.branding.primaryColor = '#2563eb';
    baseTemplate.branding.secondaryColor = '#0f172a';
    baseTemplate.emergencyService = false;
    baseTemplate.dispatchWindow = 'Same-Day Service';
  } else if (variantArchetype === 'flat_rate') {
    baseTemplate.branding.colorPreset = 'modern_swiss';
    baseTemplate.branding.primaryColor = '#10b981';
    baseTemplate.branding.secondaryColor = '#0f172a';
    baseTemplate.emergencyService = false;
    baseTemplate.dispatchWindow = 'Exact Scheduled Window';
  }

  if (!apiKey) {
    // Graceful fallback if API key is not configured in environment
    const safeConfig = applyVerifiedBusinessDetails(baseTemplate, { businessName, city, phone, address, trade, prompt }, false);
    const html = generateLandingPageHtml(safeConfig);
    return { config: safeConfig, html };
  }

  let generatedCopyApplied = false;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = `You are HAL's master direct-response landing page copywriter enforcing the non-negotiable Landing Page Builder Rules.
Strict rules:
1. One primary conversion goal: ${primaryGoal || 'Emergency dispatch / fast quote'}. Competing primary CTAs are banned.
2. Anti-Slop Enforced:
   - Lead directly with the point. Zero throat-clearing openings ("In today's fast-paced world", "Here's the thing").
   - NO binary contrast theater ("It's not X. It's Y."). State the claim directly.
   - Strictly BANNED words: delve, landscape, tapestry, pivotal, showcase, leverage, robust, cutting-edge, seamless, game-changer, next-level, unlock, empower, foster, utilize, paradigm, transformative, revolutionize, elevate.
   - Be concrete only when supported by the supplied business brief. Never invent prices, response times, guarantees, credentials, review counts, statistics, locations or service commitments.
   - CTA language is ACTION + OUTCOME (e.g. "Book Emergency Dispatch", "Request Flat-Rate Diagnostic").
3. Facts only: Contractor phone: "${baseTemplate.phone}". City: "${city}". Business: "${baseTemplate.businessName}".
4. Tone Archetype: ${variantArchetype}. Target Audience: ${audience || 'Customers seeking the contractor services described in the brief'}. Core Offer: ${coreOffer || 'No special offer supplied. Use a neutral request-a-quote CTA.'}.
5. Proof signals: ${proofAvailable || 'None supplied. Do not invent credentials, ratings, insurance, reviews, guarantees, response times, prices, statistics, service areas or services not named in the contractor description.'}.

Return ONLY a JSON object matching this schema:
{
  "title": "string",
  "headline": "string",
  "subheadline": "string",
  "badgeText": "string",
  "seasonalTag": "string",
  "seasonalTitle": "string",
  "seasonalDescription": "string",
  "seasonalBullets": ["string", "string", "string"],
  "services": [
    { "id": "s1", "title": "string", "description": "string", "priceEstimate": "string", "badge": "string" },
    { "id": "s2", "title": "string", "description": "string", "priceEstimate": "string", "badge": "string" },
    { "id": "s3", "title": "string", "description": "string", "priceEstimate": "string", "badge": "string" }
  ],
  "beforeAfter": {
    "title": "string",
    "location": "string",
    "challenge": "string",
    "solution": "string"
  },
  "reviews": [
    { "id": "r1", "name": "string", "location": "string", "date": "string", "stars": 5, "text": "string" },
    { "id": "r2", "name": "string", "location": "string", "date": "string", "stars": 5, "text": "string" },
    { "id": "r3", "name": "string", "location": "string", "date": "string", "stars": 5, "text": "string" }
  ],
  "neighborhoods": ["string", "string", "string", "string", "string", "string"],
  "guaranteeTitle": "string",
  "guaranteeDescription": "string",
  "metaTitle": "string",
  "metaDescription": "string"
}`;

    let responseText: string | null = null;
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `Contractor Description: "${prompt}"\nTrade: ${trade}\nCity: ${city}\nBusiness Name: ${baseTemplate.businessName}\nPhone: ${baseTemplate.phone}`,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
            responseMimeType: 'application/json'
          }
        });
        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        // If high demand 503 or transient spike, quietly try next model
        console.info(`[Landing Page Generator] Model ${model} unavailable (${err?.status || err?.message || 'error'}), attempting next candidate...`);
      }
    }

    const parsed = safeExtractJson(responseText);

    if (parsed && typeof parsed === 'object') {
      generatedCopyApplied = Boolean(
        typeof parsed.headline === 'string' && parsed.headline.trim() &&
        typeof parsed.subheadline === 'string' && parsed.subheadline.trim() &&
        Array.isArray(parsed.services) && parsed.services.some((item: any) =>
          typeof item?.title === 'string' && item.title.trim() &&
          typeof item?.description === 'string' && item.description.trim()
        )
      );
      if (parsed.headline) baseTemplate.sections.hero.headline = parsed.headline;
      if (parsed.subheadline) baseTemplate.sections.hero.subheadline = parsed.subheadline;
      if (parsed.badgeText) baseTemplate.sections.hero.badgeText = parsed.badgeText;
      if (parsed.title) baseTemplate.title = parsed.title;

      if (parsed.seasonalTitle) {
        baseTemplate.sections.seasonal_alert.title = parsed.seasonalTitle;
        if (parsed.seasonalTag) baseTemplate.sections.seasonal_alert.tag = parsed.seasonalTag;
        if (parsed.seasonalDescription) baseTemplate.sections.seasonal_alert.description = parsed.seasonalDescription;
        if (Array.isArray(parsed.seasonalBullets)) baseTemplate.sections.seasonal_alert.bulletPoints = parsed.seasonalBullets;
      }

      if (Array.isArray(parsed.services) && parsed.services.length > 0) {
        baseTemplate.sections.services.items = parsed.services;
      }

      if (parsed.beforeAfter && baseTemplate.sections.before_after.items.length > 0) {
        baseTemplate.sections.before_after.items[0].title = parsed.beforeAfter.title || baseTemplate.sections.before_after.items[0].title;
        baseTemplate.sections.before_after.items[0].location = parsed.beforeAfter.location || baseTemplate.sections.before_after.items[0].location;
        baseTemplate.sections.before_after.items[0].challenge = parsed.beforeAfter.challenge || baseTemplate.sections.before_after.items[0].challenge;
        baseTemplate.sections.before_after.items[0].solution = parsed.beforeAfter.solution || baseTemplate.sections.before_after.items[0].solution;
      }

      // Never turn model-generated testimonial text into published reviews.
      // Reviews must be collected from real customers and verified separately.
      // Leave the template's review section unchanged when the model returns review copy.

      if (Array.isArray(parsed.neighborhoods) && parsed.neighborhoods.length > 0) {
        baseTemplate.sections.service_areas.cities = parsed.neighborhoods;
      }

      if (parsed.guaranteeDescription) {
        baseTemplate.sections.guarantee.description = parsed.guaranteeDescription;
      }
      if (parsed.guaranteeTitle) {
        baseTemplate.sections.guarantee.title = parsed.guaranteeTitle;
      }

      if (parsed.metaTitle) baseTemplate.seo.metaTitle = parsed.metaTitle;
      if (parsed.metaDescription) baseTemplate.seo.metaDescription = parsed.metaDescription;
    }
  } catch (err) {
    console.warn('[Gemini Landing Page Generation Fallback]', err);
  }

  // Mandatory Quality Gate: Pass all generated copy through the Anti-Slop Humanizer
  const { cleanedConfig } = applyHumanizerPass(baseTemplate);
  const safeConfig = applyVerifiedBusinessDetails(cleanedConfig, { businessName, city, phone, address, trade, prompt }, generatedCopyApplied);

  const html = generateLandingPageHtml(safeConfig);
  return { config: safeConfig, html };
}

export function applyVerifiedBusinessDetails(
  config: LandingPageConfig,
  details: { businessName?: string; city?: string; phone?: string; address?: string; trade: TradeType; prompt: string },
  preserveGeneratedCopy = false
): LandingPageConfig {
  const businessName = details.businessName?.trim() || 'Business Name';
  const city = details.city?.trim() || 'Service Area';
  const phone = details.phone?.trim() || '';
  const address = details.address?.trim() || '';
  const tradeLabel = details.trade.replace(/_/g, ' ').replace(/\\b\\w/g, letter => letter.toUpperCase());
  const promptText = details.prompt.trim();
  const hasCuratedSpecialistTemplate = ['sump_pump', 'waterproofing', 'flood_restoration', 'emergency_dispatch'].includes(details.trade);

  // Verified identity fields always win. Marketing copy is preserved only when it
  // came from a successfully parsed AI response; static demo-template claims never do.
  config.businessName = businessName;
  config.city = city;
  config.phone = phone;
  config.licenseNumber = '';
  config.emergencyService = false;
  config.dispatchWindow = '';
  config.branding.logoText = businessName;
  config.title = `${businessName} — ${tradeLabel} Services in ${city}`;

  config.sections.announcement_bar.active = false;
  config.sections.header.active = true;
  config.sections.header.ctaText = phone ? `Call ${phone}` : 'Request a quote';

  config.sections.hero.active = true;
  if ((!preserveGeneratedCopy && !hasCuratedSpecialistTemplate) || !config.sections.hero.headline?.trim()) {
    config.sections.hero.headline = `${tradeLabel} Services in ${city}`;
  }
  if ((!preserveGeneratedCopy && !hasCuratedSpecialistTemplate) || !config.sections.hero.subheadline?.trim()) {
    config.sections.hero.subheadline = promptText
      ? `${businessName} provides ${tradeLabel.toLowerCase()} services in ${city}. ${promptText}`
      : `${businessName} provides ${tradeLabel.toLowerCase()} services in ${city}. Contact the business to discuss your project.`;
  }
  config.sections.hero.badgeText = `${tradeLabel} in ${city}`;

  config.sections.lead_form.active = true;
  config.sections.lead_form.title = `Request a quote from ${businessName}`;
  config.sections.lead_form.subtitle = 'Share your contact details and a short description of the work you need.';
  config.sections.lead_form.buttonText = 'Request a quote';
  config.sections.lead_form.dispatchNote = 'The business will contact you to discuss your request.';

  // The AI may describe services from the supplied contractor brief. If it did not
  // return usable copy, do not publish sample-template services as if this business
  // had confirmed those offerings.
  const generatedServices = Array.isArray(config.sections.services.items)
    ? config.sections.services.items.filter(item =>
        typeof item?.title === 'string' && item.title.trim() &&
        typeof item?.description === 'string' && item.description.trim()
      )
    : [];
  config.sections.services.active = true;
  config.sections.services.title = 'Services';
  config.sections.services.subtitle = 'Contact the business to confirm scope, availability and pricing.';
  config.sections.services.items = (preserveGeneratedCopy || hasCuratedSpecialistTemplate) && generatedServices.length > 0
    ? generatedServices.slice(0, 6).map(item => ({ ...item, priceEstimate: undefined, badge: undefined }))
    : [{
        id: 'service-enquiry',
        title: `${tradeLabel} Enquiries`,
        description: 'Contact the business to discuss the work you need and confirm the services available.'
      }];

  // Never publish sample-business proof, prices, guarantees, coverage, booking promises,
  // testimonials or project claims as facts about the prospect being demonstrated.
  config.sections.trust_bar.active = false;
  config.sections.trust_bar.badges = [];
  if (config.sections.bento_features) {
    config.sections.bento_features.active = false;
    config.sections.bento_features.items = [];
  }
  if (config.sections.pricing_packages) {
    config.sections.pricing_packages.active = false;
    config.sections.pricing_packages.items = [];
  }
  config.sections.seasonal_alert.active = false;
  config.sections.before_after.active = false;
  config.sections.before_after.items = [];
  config.sections.reviews.active = false;
  config.sections.reviews.items = [];
  config.sections.reviews.rating = 0;
  config.sections.reviews.totalReviews = 0;
  config.sections.service_areas.active = false;
  config.sections.service_areas.cities = [];
  config.sections.guarantee.active = false;
  config.sections.online_booking.active = false;
  config.sections.faq.active = false;

  config.sections.footer.address = address;
  config.sections.footer.copyright = `© ${new Date().getFullYear()} ${businessName}.`;
  config.sections.sticky_mobile_call.active = Boolean(phone);
  config.sections.sticky_mobile_call.crewStatus = `Contact ${businessName}`;
  config.sections.sticky_mobile_call.buttonText = phone ? `Call ${phone}` : 'Request a quote';

  if (!preserveGeneratedCopy || !config.seo.metaTitle?.trim()) {
    config.seo.metaTitle = `${businessName} | ${tradeLabel} in ${city}`;
  }
  if (!preserveGeneratedCopy || !config.seo.metaDescription?.trim()) {
    config.seo.metaDescription = `Contact ${businessName} in ${city} about ${tradeLabel.toLowerCase()} services.`;
  }
  config.seo.schemaType = 'LocalBusiness';

  return config;
}

export interface SectionRegenerateParams {
  sectionKey: string;
  currentData: any;
  prompt: string;
  trade?: string;
  city?: string;
  businessName?: string;
}

export async function regenerateLandingSection(params: SectionRegenerateParams): Promise<{ updatedData: any }> {
  const { sectionKey, currentData, prompt, trade, city, businessName } = params;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { updatedData: currentData };
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemPrompt = `You are HAL's master landing page copywriter.
Task: Regenerate and polish the JSON data for section "${sectionKey}" of a high-converting contractor landing page.
Business: ${businessName || 'Local Contractor'}
Trade: ${trade || 'Home Services'}
City: ${city || 'Local Metro'}
Operator Directive: "${prompt}"

STRICT RULES:
1. Anti-Slop Enforced: No fluff, no clichés ("delve", "pivotal", "seamless", "elevate", "cutting-edge").
2. State numbers, specific guarantees, transparent prices, or local neighborhoods where appropriate.
3. Return ONLY a valid JSON object matching the exact structure of this section. Do NOT wrap in conversational text.

Current Section Data:
${JSON.stringify(currentData, null, 2)}`;

  const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Polish this section based on: "${prompt}"`,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      });
      if (response && response.text) {
        const parsed = safeExtractJson(response.text);
        if (parsed && typeof parsed === 'object') {
          return { updatedData: { ...currentData, ...parsed } };
        }
      }
    } catch (err: any) {
      console.info(`[Section AI Polish] Model ${model} retry fallback:`, err?.message || err);
    }
  }

  return { updatedData: currentData };
}
