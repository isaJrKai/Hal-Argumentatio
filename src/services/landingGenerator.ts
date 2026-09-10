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
    audience, 
    primaryGoal, 
    coreOffer, 
    proofAvailable,
    variantArchetype = 'emergency_dispatch'
  } = params;
  const apiKey = process.env.GEMINI_API_KEY;

  const baseTemplate: LandingPageConfig = JSON.parse(
    JSON.stringify(TRADE_TEMPLATES[trade] || TRADE_TEMPLATES.plumbing)
  );

  baseTemplate.id = 'lp_' + Date.now();
  if (businessName) baseTemplate.businessName = businessName;
  if (city) baseTemplate.city = city;
  if (phone) baseTemplate.phone = phone;

  // Set directional archetype branding/tone
  if (variantArchetype === 'emergency_dispatch') {
    baseTemplate.branding.colorPreset = 'emergency_amber';
    baseTemplate.branding.primaryColor = '#f59e0b';
    baseTemplate.branding.secondaryColor = '#0f172a';
    baseTemplate.emergencyService = true;
    baseTemplate.dispatchWindow = '30-45 Minutes';
  } else if (variantArchetype === 'master_craftsman') {
    baseTemplate.branding.colorPreset = 'trust_navy';
    baseTemplate.branding.primaryColor = '#2563eb';
    baseTemplate.branding.secondaryColor = '#0f172a';
    baseTemplate.emergencyService = false;
    baseTemplate.dispatchWindow = 'Same-Day Service';
  } else if (variantArchetype === 'flat_rate') {
    baseTemplate.branding.colorPreset = 'modern_slate';
    baseTemplate.branding.primaryColor = '#10b981';
    baseTemplate.branding.secondaryColor = '#0f172a';
    baseTemplate.emergencyService = false;
    baseTemplate.dispatchWindow = 'Exact Scheduled Window';
  }

  if (!apiKey) {
    // Graceful fallback if API key is not configured in environment
    const html = generateLandingPageHtml(baseTemplate);
    return { config: baseTemplate, html };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = `You are HAL's master direct-response landing page copywriter enforcing the non-negotiable Landing Page Builder Rules.
Strict rules:
1. One primary conversion goal: ${primaryGoal || 'Emergency dispatch / fast quote'}. Competing primary CTAs are banned.
2. Anti-Slop Enforced:
   - Lead directly with the point. Zero throat-clearing openings ("In today's fast-paced world", "Here's the thing").
   - NO binary contrast theater ("It's not X. It's Y."). State the claim directly.
   - Strictly BANNED words: delve, landscape, tapestry, pivotal, showcase, leverage, robust, cutting-edge, seamless, game-changer, next-level, unlock, empower, foster, utilize, paradigm, transformative, revolutionize, elevate.
   - Be concrete: numbers, response times, upfront prices, specific local outcomes.
   - CTA language is ACTION + OUTCOME (e.g. "Book Emergency Dispatch", "Request Flat-Rate Diagnostic").
3. Facts only: Contractor phone: "${baseTemplate.phone}". City: "${city}". Business: "${baseTemplate.businessName}".
4. Tone Archetype: ${variantArchetype}. Target Audience: ${audience || 'Local Homeowners'}. Core Offer: ${coreOffer || 'Fast dispatch, upfront pricing, zero hidden fees'}.
5. Proof signals: ${proofAvailable || 'Master license, liability insurance, BBB A+ rating'}.

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
    const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash'];

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

    if (parsed) {
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

      if (Array.isArray(parsed.reviews) && parsed.reviews.length > 0) {
        baseTemplate.sections.reviews.items = parsed.reviews.map((r: any, idx: number) => ({
          ...r,
          verified: true,
          id: 'r_' + idx
        }));
      }

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

  const html = generateLandingPageHtml(cleanedConfig);
  return { config: cleanedConfig, html };
}
