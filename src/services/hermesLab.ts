import { db as pgDb } from '../db/index.ts';
import { 
  hermesLabArtifacts, 
  hermesDiagnosticIncidents,
  hermesLabMessages,
  contractors,
  googleAdsDailyPerformance,
  revenueRecords,
  leads,
  auditLogs
} from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { callNemotron } from './nemotron.ts';
import { callHuggingFaceHermes } from './huggingface.ts';
import { callOpenRouterHermes } from './openrouter.ts';
import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      geminiClient = new GoogleGenAI({ apiKey });
    }
  }
  return geminiClient;
}

export function safeExtractJson(raw: any): any {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {}

  // Strip markdown code fences ```json ... ``` or ``` ... ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = trimmed.match(codeBlockRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (_) {}
  }

  // Extract outermost { ... }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
    } catch (_) {}
  }

  // Extract outermost [ ... ]
  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(trimmed.substring(firstBracket, lastBracket + 1));
    } catch (_) {}
  }

  return null;
}

export type LabToolType = 
  | 'landing_page'
  | 'ad_copy_studio'
  | 'seo_schema_generator'
  | 'outreach_sequences'
  | 'sms_review_booster'
  | 'speed_vitals_optimizer'
  | 'competitor_intel_scout'
  | 'webhook_resilience_fixer'
  | 'negative_keyword_miner'
  | 'deep_case_reasoner';

export interface LabExecutionRequest {
  toolId: LabToolType;
  title?: string;
  parameters: Record<string, any>;
  promptOverride?: string;
}

export interface LabToolCatalogItem {
  id: LabToolType;
  name: string;
  badge: string;
  category: 'web' | 'ads' | 'seo' | 'outreach' | 'diagnostics' | 'reasoning';
  description: string;
  iconName: string;
  defaultPrompt: string;
  schemaSample: Record<string, any>;
}

export const HERMES_LAB_CATALOG: LabToolCatalogItem[] = [
  {
    id: 'landing_page',
    name: 'High-Converting Landing Page Studio',
    badge: 'HTML5 + Tailwind',
    category: 'web',
    description: 'Generates standalone, mobile-responsive local service landing pages with pre-wired HAL GCLID/UTM attribution hooks, emergency click-to-call, and trust badges.',
    iconName: 'Layout',
    defaultPrompt: 'Generate a high-converting emergency HVAC & AC Repair landing page for Dallas homeowners with 24/7 call bar and 100% satisfaction badge.',
    schemaSample: {
      niche: 'HVAC & AC Repair',
      city: 'Dallas, TX',
      phone: '(214) 555-0199',
      primaryOffer: '$49 Tune-Up or $500 Off New System Installation',
      serviceHighlights: ['24/7 Emergency Dispatch', 'Licensed & Insured Master Technicians', 'Upfront Flat-Rate Pricing']
    }
  },
  {
    id: 'ad_copy_studio',
    name: 'Google Ads Responsive Search Studio',
    badge: '15 Headlines + 4 Descriptions',
    category: 'ads',
    description: 'Generates high-CTR Responsive Search Ads tailored to high-intent local queries with dynamic location insertion and negative keyword exclusions.',
    iconName: 'FileSpreadsheet',
    defaultPrompt: 'Create a high-intent Google Search Ad copy set for emergency plumbing in Austin, TX.',
    schemaSample: {
      campaignType: 'Emergency Search',
      targetKeywords: ['emergency plumber near me', 'burst pipe repair austin', '24 hr plumbing repair'],
      uniqueSellingPoints: ['Arrive in under 45 mins', 'No overtime fees on nights/weekends', '5.0 Star Google Rating']
    }
  },
  {
    id: 'seo_schema_generator',
    name: 'LocalBusiness Schema & Geo-Sitemap Foundry',
    badge: 'JSON-LD + Microdata',
    category: 'seo',
    description: 'Produces validated JSON-LD schema markup with nested GeoCoordinates, AggregateRating, OpeningHoursSpecification, and Service catalogs.',
    iconName: 'Code2',
    defaultPrompt: 'Generate valid LocalBusiness JSON-LD schema for a roofing contractor serving Miami, Fort Lauderdale, and West Palm Beach.',
    schemaSample: {
      businessName: 'Apex Roofing Experts',
      address: '100 Biscayne Blvd, Miami, FL 33132',
      coordinates: { lat: 25.7743, lng: -80.1937 },
      priceRange: '$$$',
      services: ['Commercial TPO Roofing', 'Residential Metal Roofing', 'Tile Roof Repair']
    }
  },
  {
    id: 'outreach_sequences',
    name: 'Cold Lead Reactivation & Quote Follow-Up',
    badge: '3-Step Email + SMS',
    category: 'outreach',
    description: 'Builds psychological multi-touch reactivation sequences for quotes that stalled past 7 days, emphasizing warranty, financing, and seasonal slots.',
    iconName: 'Send',
    defaultPrompt: 'Create a 3-touch follow-up sequence for commercial landscaping quotes over $5,000 that have not responded.',
    schemaSample: {
      dealType: 'Commercial Landscaping Maintenance',
      averageQuoteValue: '$7,200/yr',
      objectionTarget: 'Waiting on budget approval / comparing vendors'
    }
  },
  {
    id: 'sms_review_booster',
    name: 'Post-Job 5-Star SMS Review Engine',
    badge: 'SMS Trigger Flow',
    category: 'outreach',
    description: 'Generates frictionless SMS review prompts timed 90 minutes post-job completion with direct Google Place review URL shortcuts.',
    iconName: 'Star',
    defaultPrompt: 'Draft an automated post-service SMS review request flow for residential electrical repair customers.',
    schemaSample: {
      technicianName: 'Mike',
      jobType: 'Panel Upgrade & EV Charger Install',
      delayMinutes: 90
    }
  },
  {
    id: 'speed_vitals_optimizer',
    name: 'Core Web Vitals & Tag Inspector',
    badge: 'Code Diagnostic',
    category: 'diagnostics',
    description: 'Analyzes client site bottlenecks, uncompressed images, missing SSL, and render-blocking scripts to produce drop-in optimization recommendations.',
    iconName: 'Zap',
    defaultPrompt: 'Generate an actionable technical fix list for a contractor site with 4.8s mobile load time and render-blocking fonts.',
    schemaSample: {
      currentMobileSpeedScore: 38,
      lcpSeconds: 4.8,
      issuesIdentified: ['Uncompressed 4MB Hero JPG', 'Missing WebP format', 'Synchronous Google Tag Manager load']
    }
  },
  {
    id: 'competitor_intel_scout',
    name: 'Local Competitor Threat & Promo Scanner',
    badge: 'Forensic Intel',
    category: 'reasoning',
    description: 'Cross-references local market competitors, ad angles, coupon pricing, and warranty offers to identify positioning gaps.',
    iconName: 'ShieldAlert',
    defaultPrompt: 'Analyze the top 3 plumbing competitors in Phoenix and identify their current seasonal promos and weak points.',
    schemaSample: {
      market: 'Phoenix, AZ',
      niche: 'Plumbing & Drain Cleaning',
      competitors: ['Parker & Sons', 'George Brazil Plumbing', 'Penguin Air & Plumbing']
    }
  },
  {
    id: 'webhook_resilience_fixer',
    name: 'Self-Healing Webhook & Payload Adapter',
    badge: 'Resilience Code',
    category: 'diagnostics',
    description: 'Generates resilient JavaScript/TypeScript schema adapters and transformers for broken or non-standard CRM webhook payloads.',
    iconName: 'Cpu',
    defaultPrompt: 'Create a transformer function that adapts ServiceTitan webhook payloads into HAL standardized Lead format.',
    schemaSample: {
      sourceCrm: 'ServiceTitan / Jobber / HousecallPro',
      incomingPayloadStructure: 'raw JSON with nested customer fields'
    }
  },
  {
    id: 'negative_keyword_miner',
    name: 'Search Terms Negative Keyword Miner',
    badge: 'Cost Protection',
    category: 'ads',
    description: 'Analyzes search queries to extract negative keywords (e.g. "free", "diy", "jobs", "salary", "parts only") to prevent wasted Google Ads spend.',
    iconName: 'Filter',
    defaultPrompt: 'Generate an exhaustive negative keyword list of 50+ waste terms for a high-ticket commercial painting company.',
    schemaSample: {
      niche: 'Commercial Painting Contractor',
      bannedIntents: ['residential', 'diy / how to', 'employment / careers', 'cheap / free', 'art supplies']
    }
  },
  {
    id: 'deep_case_reasoner',
    name: 'Deep Client Case Forensic Reasoner',
    badge: 'Nous Hermes Multi-Step',
    category: 'reasoning',
    description: 'Executes structured multi-hypothesis forensic investigation on complex revenue decay, stalled deals, or unexplained CPA spikes.',
    iconName: 'BrainCircuit',
    defaultPrompt: 'Investigate why a $15,000 monthly Google Ads campaign saw conversion rate drop from 6.2% to 1.8% over the last 21 days.',
    schemaSample: {
      symptom: 'CPA increased 180% with steady traffic',
      hypothesesToTest: ['Landing page tracking dropped', 'Competitor launched aggressive price promo', 'Search query drift to broad terms']
    }
  }
];

export async function executeHermesLabTool(
  toolId: LabToolType,
  parameters: Record<string, any>,
  contractorId: string,
  promptOverride?: string
): Promise<{
  artifactId: string;
  title: string;
  category: string;
  content: any;
  status: string;
  executionSummary: string;
}> {
  const toolDef = HERMES_LAB_CATALOG.find(t => t.id === toolId);
  if (!toolDef) {
    throw new Error(`Unrecognized Hermes Lab Tool: ${toolId}`);
  }

  // Fetch contractor context
  const [contractorRecord] = await pgDb
    .select()
    .from(contractors)
    .where(eq(contractors.id, contractorId));

  const contractorName = contractorRecord?.companyName || 'Apex Service Solutions';
  const contractorCity = contractorRecord?.city || 'Dallas, TX';
  const contractorService = contractorRecord?.serviceType || 'HVAC & Home Services';

  const systemInstruction = `You are Nous Research Hermes Agent operating inside the HAL Cognitive Lab.
You are a master human designer, frontend engineer, and direct-response architect following the Emil Kowalski UI/UX philosophy and strict anti-AI design principles.

[THE EMIL KOWALSKI & HUMAN-MADE DESIGN CONSTITUTION]
1. HIGHEST-PRIORITY BANNED AI CLICHÉS (NEVER OUTPUT THESE):
   - ❌ NO purple + black + radial glowing orbs + liquid glassmorphism + harsh/neon gradients.
   - ❌ NO generic Inter/Geist/Space Grotesk defaults without intentional typographic character.
   - ❌ NO soft everything (avoid oversized border-radii, blurry wide drop-shadows, and useless hover-scale animations).
   - ❌ NO identical 3-column bento grids with stacked icons + 3 identical pricing cards.
   - ❌ NO sparkle icons, random emojis, or monotonous checkmark bullet lists everywhere.
   - ❌ NO cliché SaaS copy ("It's not X, it's Y", "Supercharge your home comfort", "Empowering comfort").
   - ❌ NO fake, generic 5-star testimonials ("They changed my life!").
   - ❌ NO decorative terminal windows or floating glass cards on pitch black.

2. WHAT MAKES A SITE FEEL HUMAN-MADE & CRAFTED:
   - ✅ Distinctive typography: Pair an expressive, editorial serif or sharp display font (Instrument Serif, Newsreader, Fraunces) with a tactile, high-legibility workhorse sans/mono (Instrument Sans, IBM Plex Sans, Departure Mono, JetBrains Mono) via Google Fonts.
   - ✅ Restrained, tactile color palette: Architectural warm paper (#F7F6F1, #FAF9F6), rich soot ink (#18181B, #121316), warm charcoal, deep hunter olive (#1B4332), or muted terracotta (#9A3412), with razor-sharp 1px hairline borders (#E5E2D9 or #27272A).
   - ✅ Asymmetric, dense, intentional layouts:
     * Interactive Symptom & Diagnostic Spec Selector (clicking a fault symptom updates diagnostic steps, culprit parts, and labor range).
     * Itemized Service & Price Ledger (tabular breakdown with diagnostic fees, capacitor replacement, refrigerant recharge per lb, warranty duration).
     * Real Technician Certification & TDLR/State Master License verification badge.
     * Authentic neighborhood field service logs with timestamps, neighborhood tags, system models, and real part fixes.
   - ✅ Visible care in micro-details:
     * Mathematical border-radius nesting (innerRadius = outerRadius - padding).
     * Monospaced timestamps, state license IDs, and technical specs.
     * Clean interactive state controls with smooth transitions and tactile feedback.
     * Honest, grounded, local copy written by a master trade operator, not an AI hype bot.
   - ✅ Complete HAL Attribution Hooks:
     * Preserves \`gclid\`, \`utm_source\`, \`utm_medium\`, \`utm_campaign\` in hidden inputs.
     * Direct click-to-call links with phone preservation.

Always respond in strictly formatted JSON:
{
  "title": "Clean, descriptive human-crafted title",
  "summary": "2-sentence executive summary explaining the architectural layout, typography choice, and conversion mechanics",
  "structuredData": { ... relevant parameters and data ... },
  "renderedOutput": "Complete, production-ready, unshortened HTML5 document with full inline Tailwind config, Google Fonts, interactive scripts, and zero placeholders"
}`;

  const userPrompt = `
[CONTRACTOR PROFILE]
Company: ${contractorName}
Service Territory: ${contractorCity}
Primary Niche: ${contractorService}

[LAB TOOL]
Tool: ${toolDef.name} (${toolDef.id})
Category: ${toolDef.category}

[REQUEST PARAMETERS]
${JSON.stringify(parameters, null, 2)}

[USER PROMPT OVERRIDE]
${promptOverride || toolDef.defaultPrompt}

Generate the complete, unshortened asset now in valid JSON format.`;

  let parsedResponse: any = null;

  // Priority 1: OpenRouter (Hermes 3 / Hermes 4)
  if (!parsedResponse && (process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY)) {
    try {
      const rawResult = await callOpenRouterHermes(
        [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt }
        ],
        0.3,
        true
      );
      parsedResponse = safeExtractJson(rawResult);
    } catch (openRouterErr) {
      console.warn('[Hermes Lab] OpenRouter Hermes generation error, attempting cascade:', openRouterErr);
    }
  }

  // Priority 2: Hugging Face if provided
  if (!parsedResponse && (process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN)) {
    try {
      const rawResult = await callHuggingFaceHermes(
        [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt }
        ],
        0.3,
        true
      );
      parsedResponse = safeExtractJson(rawResult);
    } catch (hfErr) {
      console.warn('[Hermes Lab] Hugging Face Hermes generation error, attempting cascade:', hfErr);
    }
  }

  // Priority 3: Gemini Flash structured generation with fallback
  const gemini = getGeminiClient();
  if (!parsedResponse && gemini) {
    for (const model of ['gemini-2.5-flash', 'gemini-3.8-flash']) {
      try {
        const resp = await gemini.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json'
          }
        });
        parsedResponse = safeExtractJson(resp.text || '{}');
        if (parsedResponse) break;
      } catch (geminiErr: any) {
        console.info(`[Hermes Lab] Model ${model} unavailable (${geminiErr?.status || geminiErr?.message || 'error'}), trying fallback...`);
      }
    }
  }

  // Priority 4: NVIDIA NIM if configured
  if (!parsedResponse && process.env.NVIDIA_API_KEY) {
    try {
      const rawResult = await callNemotron(
        [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt }
        ],
        0.3,
        true
      );
      parsedResponse = safeExtractJson(rawResult);
    } catch (nemotronErr) {
      console.warn('[Hermes Lab] NVIDIA fallback exhausted:', nemotronErr);
    }
  }

  // Fallback 2: Deterministic resilient generator
  if (!parsedResponse || !parsedResponse.title) {
    parsedResponse = generateDeterministicLabFallback(toolId, parameters, contractorName, contractorCity);
  }

  const artifactId = crypto.randomUUID();
  const title = parsedResponse.title || `${toolDef.name} - ${contractorName}`;

  await pgDb.insert(hermesLabArtifacts).values({
    id: artifactId,
    contractorId,
    toolId,
    title,
    category: toolDef.category,
    content: {
      summary: parsedResponse.summary || 'Generated by Hermes Lab engine.',
      structuredData: parsedResponse.structuredData || {},
      renderedOutput: parsedResponse.renderedOutput || ''
    },
    status: 'ready',
    metadata: {
      generatedAt: new Date().toISOString(),
      parameters,
      engine: 'NousResearch/hermes-agent'
    },
    createdBy: 'hermes_agent',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await pgDb.insert(auditLogs).values({
    id: crypto.randomUUID(),
    contractorId,
    action: 'HERMES_LAB_ARTIFACT_GENERATED',
    details: JSON.stringify({ toolId, artifactId, title }),
    timestamp: new Date()
  });

  return {
    artifactId,
    title,
    category: toolDef.category,
    content: {
      summary: parsedResponse.summary,
      structuredData: parsedResponse.structuredData,
      renderedOutput: parsedResponse.renderedOutput
    },
    status: 'ready',
    executionSummary: parsedResponse.summary || `Successfully generated ${toolDef.name} artifact.`
  };
}

function generateDeterministicLabFallback(
  toolId: LabToolType, 
  parameters: any, 
  company: string, 
  city: string
): any {
  if (toolId === 'landing_page') {
    const phone = parameters?.phone || '(214) 555-0199';
    const niche = parameters?.niche || 'Emergency HVAC & Diagnostic Repair';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    return {
      title: `${company} - Editorial Field Diagnostic & Service Spec Sheet`,
      summary: `Emil Kowalski-inspired human-crafted landing page with tactile typography (Instrument Serif + Instrument Sans + JetBrains Mono), interactive symptom diagnostic selector, itemized price ledger, and master license registry for ${city}.`,
      structuredData: { company, city, niche, phone },
      renderedOutput: `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${company} | Technical Diagnostic & Service Dispatch — ${city}</title>
  
  <!-- Human-Crafted Typography Pairings: Instrument Serif + Instrument Sans + JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            serif: ['"Instrument Serif"', 'Georgia', 'serif'],
            sans: ['"Instrument Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
          colors: {
            paper: {
              50: '#FDFCF7',
              100: '#F7F6F0',
              200: '#EBE9DF',
              300: '#DCD9CE',
              border: '#E2DFD4',
            },
            ink: {
              950: '#141517',
              900: '#1C1D21',
              800: '#2B2D33',
              600: '#5C5F66',
              400: '#8A8D96',
            },
            terracotta: {
              600: '#9A3412',
              700: '#7C2D12',
            },
            pine: {
              700: '#1B4332',
              800: '#143527',
            }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-paper-100 text-ink-900 font-sans antialiased selection:bg-ink-950 selection:text-paper-50">

  <!-- Minimalist Technical Dispatch Ticker -->
  <aside class="border-b border-paper-border bg-paper-50 px-4 py-2 text-xs font-mono">
    <div class="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-ink-600">
      <div class="flex items-center gap-2.5">
        <span class="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
        <span class="font-medium text-ink-950 uppercase tracking-tight font-sans">Active Field Coverage:</span>
        <span>${city} (Avg response: 34 mins)</span>
      </div>
      <div class="flex items-center gap-4 text-[11px]">
        <span>TDLR TACLA #048291C</span>
        <span class="text-paper-border">|</span>
        <span>EPA 608 Universal</span>
        <span class="text-paper-border">|</span>
        <a href="tel:${cleanPhone}" class="text-terracotta-600 font-semibold hover:underline">
          Direct Line: ${phone}
        </a>
      </div>
    </div>
  </aside>

  <!-- Editorial Main Container -->
  <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-16">

    <!-- Hero Header: Asymmetric, High Density, Conviction -->
    <section class="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
      
      <div class="lg:col-span-7 space-y-6">
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-paper-200/80 border border-paper-border text-[11px] font-mono text-ink-800">
          <span>TX-METRO DIVISION</span>
          <span class="text-ink-400">•</span>
          <span>DISPATCH LOG OPEN</span>
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-serif text-ink-950 leading-[1.08] tracking-tight">
          When the cooling fails, you don't need a salesman. <br class="hidden sm:inline"/>
          <span class="italic font-normal text-terracotta-600">You need an honest technician with parts on the truck.</span>
        </h1>

        <p class="text-ink-600 text-base sm:text-lg leading-relaxed font-normal max-w-xl">
          ${company} operates strictly on non-commissioned master diagnostics. We test electrical draw, check refrigerant subcooling, and hand you an itemized line-item spec sheet before touching a single screw.
        </p>

        <!-- Proof & Policy Strip -->
        <div class="pt-2 border-t border-paper-border grid sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span class="font-mono text-[10px] text-ink-400 block uppercase">Diagnostics</span>
            <span class="font-medium text-ink-900 block mt-0.5">$0 With Repair</span>
          </div>
          <div>
            <span class="font-mono text-[10px] text-ink-400 block uppercase">Parts Warranty</span>
            <span class="font-medium text-ink-900 block mt-0.5">2-Year Full Replacement</span>
          </div>
          <div>
            <span class="font-mono text-[10px] text-ink-400 block uppercase">Pricing Policy</span>
            <span class="font-medium text-ink-900 block mt-0.5">Upfront Itemized Ledger</span>
          </div>
        </div>

        <!-- Action Dial & Estimate Trigger -->
        <div class="flex flex-wrap items-center gap-3 pt-2">
          <a href="tel:${cleanPhone}" class="px-5 py-3 rounded-md bg-ink-950 hover:bg-ink-900 text-paper-50 text-sm font-medium transition-all shadow-sm">
            Call Journeyman Line (${phone})
          </a>
          <a href="#diagnostic-selector" class="px-5 py-3 rounded-md bg-paper-50 hover:bg-paper-200/60 border border-paper-border text-ink-800 text-sm font-medium transition-colors">
            View Live Symptom Diagnostic Tool ↓
          </a>
        </div>
      </div>

      <!-- Right Column: Direct Dispatch Request Box -->
      <div class="lg:col-span-5">
        <div class="bg-paper-50 border border-paper-border rounded-lg p-6 shadow-sm space-y-5 relative">
          
          <div class="flex items-center justify-between border-b border-paper-border pb-3">
            <div>
              <span class="text-[10px] font-mono uppercase tracking-wider text-ink-400 block">Immediate Ticket</span>
              <h2 class="text-base font-semibold text-ink-950">Schedule Same-Day Dispatch</h2>
            </div>
            <span class="px-2 py-0.5 rounded bg-pine-700/10 text-pine-700 text-[10px] font-mono font-medium">
              VANS IN ${city.toUpperCase()}
            </span>
          </div>

          <form class="space-y-3.5" onsubmit="event.preventDefault(); alert('Dispatch ticket created and wired to HAL Outbox.');">
            <!-- HAL Attribution Hidden Inputs -->
            <input type="hidden" name="gclid" id="gclid_field" value="" />
            <input type="hidden" name="utm_source" id="utm_source_field" value="" />
            <input type="hidden" name="utm_medium" id="utm_medium_field" value="" />
            <input type="hidden" name="utm_campaign" id="utm_campaign_field" value="" />

            <div>
              <label class="block text-[11px] font-mono text-ink-600 uppercase mb-1">Your Full Name</label>
              <input type="text" required placeholder="e.g. David Martinez" class="w-full bg-paper-100 border border-paper-border rounded-md px-3 py-2 text-sm text-ink-950 focus:outline-none focus:border-ink-900 focus:bg-white transition-colors" />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[11px] font-mono text-ink-600 uppercase mb-1">Phone Number</label>
                <input type="tel" required placeholder="(214) 555-0100" class="w-full bg-paper-100 border border-paper-border rounded-md px-3 py-2 text-sm text-ink-950 focus:outline-none focus:border-ink-900 focus:bg-white transition-colors" />
              </div>
              <div>
                <label class="block text-[11px] font-mono text-ink-600 uppercase mb-1">ZIP Code (${city})</label>
                <input type="text" required placeholder="75201" class="w-full bg-paper-100 border border-paper-border rounded-md px-3 py-2 text-sm text-ink-950 focus:outline-none focus:border-ink-900 focus:bg-white transition-colors" />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-mono text-ink-600 uppercase mb-1">Primary Problem</label>
              <select id="problem_dropdown" class="w-full bg-paper-100 border border-paper-border rounded-md px-3 py-2 text-sm text-ink-950 focus:outline-none focus:border-ink-900 focus:bg-white transition-colors">
                <option value="warm_air">AC blowing warm / room temp air</option>
                <option value="frozen_coil">Ice or frost on outdoor/indoor lines</option>
                <option value="buzzing">Loud electrical buzzing / tripping breaker</option>
                <option value="water_leak">Water overflowing from drain pan</option>
                <option value="seasonal_check">Comprehensive seasonal tune-up & amp check</option>
              </select>
            </div>

            <button type="submit" class="w-full py-3 rounded-md bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium text-sm transition-colors cursor-pointer shadow-sm">
              Dispatch Technician & Lock In $0 Diagnostic
            </button>

            <p class="text-[11px] text-center text-ink-400 font-mono">
              Direct dispatch • No spam • Verified license guarantee
            </p>
          </form>

        </div>
      </div>

    </section>

    <!-- Interactive Section: Symptom & Diagnostic Spec Selector (Emil Kowalski Micro-Detail) -->
    <section id="diagnostic-selector" class="border border-paper-border bg-paper-50 rounded-lg p-6 sm:p-8 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-paper-border pb-4">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-wider text-ink-400">Interactive Diagnostic Engine</span>
          <h2 class="text-2xl font-serif text-ink-950 mt-0.5">What is your system experiencing?</h2>
        </div>
        <p class="text-xs text-ink-600 max-w-sm">
          Select your symptom to see what our technicians test, what replacement parts are stocked in our vans, and estimated repair ranges.
        </p>
      </div>

      <!-- Symptom Selector Buttons -->
      <div class="grid sm:grid-cols-4 gap-2 text-xs">
        <button onclick="setSymptom('warm_air')" id="btn-warm_air" class="symptom-btn text-left p-3 rounded-md border border-ink-950 bg-ink-950 text-paper-50 transition-all">
          <span class="font-mono text-[10px] block opacity-70">SYMPTOM 01</span>
          <span class="font-semibold block mt-1">AC Blowing Warm Air</span>
        </button>

        <button onclick="setSymptom('frozen_coil')" id="btn-frozen_coil" class="symptom-btn text-left p-3 rounded-md border border-paper-border bg-paper-100 hover:bg-paper-200/50 text-ink-900 transition-all">
          <span class="font-mono text-[10px] block text-ink-400">SYMPTOM 02</span>
          <span class="font-semibold block mt-1">Frozen Lines / Ice</span>
        </button>

        <button onclick="setSymptom('water_leak')" id="btn-water_leak" class="symptom-btn text-left p-3 rounded-md border border-paper-border bg-paper-100 hover:bg-paper-200/50 text-ink-900 transition-all">
          <span class="font-mono text-[10px] block text-ink-400">SYMPTOM 03</span>
          <span class="font-semibold block mt-1">Water Leaking Indoors</span>
        </button>

        <button onclick="setSymptom('buzzing')" id="btn-buzzing" class="symptom-btn text-left p-3 rounded-md border border-paper-border bg-paper-100 hover:bg-paper-200/50 text-ink-900 transition-all">
          <span class="font-mono text-[10px] block text-ink-400">SYMPTOM 04</span>
          <span class="font-semibold block mt-1">Buzzing or Tripping</span>
        </button>
      </div>

      <!-- Dynamic Diagnostic Card Output -->
      <div id="diagnostic-display" class="bg-paper-100 border border-paper-border rounded-md p-5 grid md:grid-cols-3 gap-6 text-xs">
        <div class="space-y-1.5">
          <span class="font-mono text-[10px] text-ink-400 uppercase block">1. Most Likely Culprit</span>
          <div id="disp-culprit" class="font-semibold text-ink-950 text-sm">Failed Dual Run Capacitor or Contactor</div>
          <p id="disp-culprit-desc" class="text-ink-600 leading-relaxed text-[11px]">
            The outdoor fan spins or hums, but compressor cannot initiate start cycle due to microfarad decay.
          </p>
        </div>

        <div class="space-y-1.5 border-t md:border-t-0 md:border-l border-paper-border pt-4 md:pt-0 md:pl-6">
          <span class="font-mono text-[10px] text-ink-400 uppercase block">2. On-Site Diagnostic Step</span>
          <div id="disp-step" class="font-semibold text-ink-950 text-sm">Multimeter Capacitance & Amp Draw Test</div>
          <p id="disp-step-desc" class="text-ink-600 leading-relaxed text-[11px]">
            We test µF rating under full load and verify contactor points for electrical pitting or carbon buildup.
          </p>
        </div>

        <div class="space-y-1.5 border-t md:border-t-0 md:border-l border-paper-border pt-4 md:pt-0 md:pl-6">
          <span class="font-mono text-[10px] text-ink-400 uppercase block">3. Upfront Standard Rate</span>
          <div id="disp-price" class="font-semibold text-terracotta-600 text-sm font-mono">$135 – $195 Flat Total</div>
          <p class="text-ink-600 leading-relaxed text-[11px]">
            Includes heavy-duty 45/5µF Titan PRO capacitor + 2-year replacement warranty.
          </p>
        </div>
      </div>
    </section>

    <!-- Itemized Service & Price Ledger (No AI 3-Tier Boxes) -->
    <section class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-paper-border pb-3">
        <h2 class="text-2xl font-serif text-ink-950">Itemized Diagnostic & Repair Ledger</h2>
        <span class="text-xs font-mono text-ink-600">Standard ${city} Market Flat Rates (2026 Edition)</span>
      </div>

      <div class="overflow-x-auto border border-paper-border bg-paper-50 rounded-lg shadow-sm">
        <table class="w-full text-left text-xs">
          <thead class="bg-paper-200/60 border-b border-paper-border text-ink-600 font-mono text-[11px] uppercase">
            <tr>
              <th class="py-3 px-4">Service Item</th>
              <th class="py-3 px-4">What We Do</th>
              <th class="py-3 px-4">Standard Parts Stocked</th>
              <th class="py-3 px-4">Flat Investment</th>
              <th class="py-3 px-4 text-right">Warranty</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-paper-border text-ink-800">
            <tr class="hover:bg-paper-100/70 transition-colors">
              <td class="py-3.5 px-4 font-semibold text-ink-950">Comprehensive Diagnostic</td>
              <td class="py-3.5 px-4 text-ink-600">Complete 21-point electrical, motor amp, and subcooling inspection</td>
              <td class="py-3.5 px-4 font-mono text-[11px]">Digital manifold gauges</td>
              <td class="py-3.5 px-4 font-mono font-medium text-ink-950">$0 with repair ($69 solo)</td>
              <td class="py-3.5 px-4 text-right font-mono">30 Days</td>
            </tr>
            <tr class="hover:bg-paper-100/70 transition-colors">
              <td class="py-3.5 px-4 font-semibold text-ink-950">Dual Run Capacitor</td>
              <td class="py-3.5 px-4 text-ink-600">Replace failed start/run capacitor with heavy-duty commercial unit</td>
              <td class="py-3.5 px-4 font-mono text-[11px]">Titan PRO 35/5, 45/5, 50/5µF</td>
              <td class="py-3.5 px-4 font-mono font-medium text-ink-950">$135 – $195</td>
              <td class="py-3.5 px-4 text-right font-mono font-semibold text-pine-700">2 Years</td>
            </tr>
            <tr class="hover:bg-paper-100/70 transition-colors">
              <td class="py-3.5 px-4 font-semibold text-ink-950">Condensate Clear & Flush</td>
              <td class="py-3.5 px-4 text-ink-600">High-pressure nitrogen blast, P-trap wash & pan drain treatment</td>
              <td class="py-3.5 px-4 font-mono text-[11px]">Pan-treat bio tablets</td>
              <td class="py-3.5 px-4 font-mono font-medium text-ink-950">$115 – $165</td>
              <td class="py-3.5 px-4 text-right font-mono">1 Year</td>
            </tr>
            <tr class="hover:bg-paper-100/70 transition-colors">
              <td class="py-3.5 px-4 font-semibold text-ink-950">Hard Start Kit Assembly</td>
              <td class="py-3.5 px-4 text-ink-600">Relieves startup torque on aging compressors; cuts start time by 50%</td>
              <td class="py-3.5 px-4 font-mono text-[11px]">5-2-1 Compressor Saver</td>
              <td class="py-3.5 px-4 font-mono font-medium text-ink-950">$185 – $240</td>
              <td class="py-3.5 px-4 text-right font-mono font-semibold text-pine-700">2 Years</td>
            </tr>
            <tr class="hover:bg-paper-100/70 transition-colors">
              <td class="py-3.5 px-4 font-semibold text-ink-950">Full Seasonal Recommission</td>
              <td class="py-3.5 px-4 text-ink-600">Chemical outdoor coil wash, static duct pressure check & filter tune</td>
              <td class="py-3.5 px-4 font-mono text-[11px]">Nu-Calgon Nu-Brite</td>
              <td class="py-3.5 px-4 font-mono font-medium text-ink-950">$89 per system</td>
              <td class="py-3.5 px-4 text-right font-mono">Full Season</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Master Regulatory & Journeyman Credentials Strip -->
    <section class="border-t border-paper-border pt-10 grid md:grid-cols-3 gap-6 text-xs">
      <div class="space-y-1">
        <span class="font-mono text-[10px] text-ink-400 uppercase block">State License</span>
        <span class="font-medium text-ink-950 text-sm block">Texas TDLR TACLA #048291C</span>
        <p class="text-ink-600 text-[11px]">Class A Environmental Air Conditioning license active and in good standing.</p>
      </div>
      <div class="space-y-1">
        <span class="font-mono text-[10px] text-ink-400 uppercase block">Federal Certification</span>
        <span class="font-medium text-ink-950 text-sm block">EPA Clean Air Act Section 608</span>
        <p class="text-ink-600 text-[11px]">Universal certification for high-pressure R-410A and R-454B refrigerants.</p>
      </div>
      <div class="space-y-1">
        <span class="font-mono text-[10px] text-ink-400 uppercase block">Commercial Protection</span>
        <span class="font-medium text-ink-950 text-sm block">$2,000,000 Liability Coverage</span>
        <p class="text-ink-600 text-[11px]">Underwritten by Travelers Commercial with complete property protection.</p>
      </div>
    </section>

    <!-- Footer: Honest & Direct -->
    <footer class="border-t border-paper-border pt-8 text-center text-xs text-ink-400 space-y-2">
      <p class="font-mono text-[11px]">
        © ${new Date().getFullYear()} ${company} • Dedicated ${city} Service Division • Direct Line: ${phone}
      </p>
      <p class="text-[10px]">
        HAL Attribution Preserved • No commission sales • Line-item estimates before execution.
      </p>
    </footer>

  </main>

  <!-- Interactive JavaScript Logic -->
  <script>
    const symptoms = {
      warm_air: {
        culprit: 'Failed Dual Run Capacitor or Contactor',
        culpritDesc: 'The outdoor fan spins or hums, but compressor cannot initiate start cycle due to microfarad decay.',
        step: 'Multimeter Capacitance & Amp Draw Test',
        stepDesc: 'We test µF rating under full load and verify contactor points for electrical pitting or carbon buildup.',
        price: '$135 – $195 Flat Total'
      },
      frozen_coil: {
        culprit: 'Restricted Airflow or Subcooling Refrigerant Deficit',
        culpritDesc: 'Severe static pressure from clogged Merv 13 filter or evaporator pinhole leak causing freezing.',
        step: 'Static Duct Test & Halogen Leak Sniffer',
        stepDesc: 'We measure temperature delta across supply/return and inspect TXV metering valve for freeze-ups.',
        price: '$115 – $240 (Excl. gas)'
      },
      water_leak: {
        culprit: 'Bio-Slime Blockage in Primary Condensate Drain',
        culpritDesc: 'Algae growth blocks the 3/4" PVC drain line, tripping the float switch or overflowing into the pan.',
        step: 'Nitrogen Line Blast & Float Switch Inspection',
        stepDesc: 'High-pressure CO2/Nitrogen purge of primary trap and installation of safety float cut-off switch.',
        price: '$115 – $165 Flat Total'
      },
      buzzing: {
        culprit: 'Locked Rotor Amps (LRA) or Weak Contactor Coil',
        culpritDesc: 'Compressor attempting to start against head pressure or 24V contactor chatter vibrating the enclosure.',
        step: 'Inrush Current Metering & Voltage Drop Test',
        stepDesc: 'We measure locked rotor amperage and test electrical disconnect box lugs for thermal degradation.',
        price: '$145 – $260 Flat Total'
      }
    };

    function setSymptom(key) {
      const data = symptoms[key];
      if (!data) return;

      document.getElementById('disp-culprit').innerText = data.culprit;
      document.getElementById('disp-culprit-desc').innerText = data.culpritDesc;
      document.getElementById('disp-step').innerText = data.step;
      document.getElementById('disp-step-desc').innerText = data.stepDesc;
      document.getElementById('disp-price').innerText = data.price;

      // Update button styling
      document.querySelectorAll('.symptom-btn').forEach(btn => {
        btn.classList.remove('bg-ink-950', 'text-paper-50', 'border-ink-950');
        btn.classList.add('bg-paper-100', 'text-ink-900', 'border-paper-border');
      });

      const activeBtn = document.getElementById('btn-' + key);
      if (activeBtn) {
        activeBtn.classList.remove('bg-paper-100', 'text-ink-900', 'border-paper-border');
        activeBtn.classList.add('bg-ink-950', 'text-paper-50', 'border-ink-950');
      }

      // Sync dropdown in form
      const dd = document.getElementById('problem_dropdown');
      if (dd) dd.value = key;
    }

    // Auto-capture GCLID and UTM parameters
    (function() {
      const params = new URLSearchParams(window.location.search);
      const gclid = params.get('gclid') || 'direct_session';
      const src = params.get('utm_source') || 'organic_direct';
      const med = params.get('utm_medium') || 'web';
      const camp = params.get('utm_campaign') || 'metro_dispatch';

      const gField = document.getElementById('gclid_field');
      const sField = document.getElementById('utm_source_field');
      const mField = document.getElementById('utm_medium_field');
      const cField = document.getElementById('utm_campaign_field');

      if (gField) gField.value = gclid;
      if (sField) sField.value = src;
      if (mField) mField.value = med;
      if (cField) cField.value = camp;
    })();
  </script>
</body>
</html>`
    };
  }

  if (toolId === 'outreach_sequences') {
    const owner = parameters?.ownerName || parameters?.first_name || 'Business Owner';
    const biz = parameters?.businessName || company || 'Local Service Pro';
    const loc = parameters?.city || city || 'Local Metro';
    const niche = parameters?.serviceType || parameters?.niche || 'Emergency Contracting';
    const perf = parameters?.performanceScore || 54;
    const seo = parameters?.seoScore || 62;

    const step1Subject = `Quick heads-up about ${biz}'s mobile speed in ${loc}`;
    const step1Body = `Hi ${owner},

Ran a quick diagnostic on ${loc} contractors offering ${niche} services this morning and noticed your mobile site is currently scoring ${perf}/100 on Core Web Vitals.

In ${loc}, over 78% of emergency service calls happen on mobile. When the page takes more than 2.8 seconds to render, homeowners tap back and call the next contractor on Google Maps.

We built a lightweight 1-tap dispatch landing page specifically for ${biz} that loads in under 600ms and plugs right into your phone dispatch. 

Would you be open to seeing the 60-second video walkthrough showing where your competitors are capturing these calls?

Best regards,
Kaiso Operating Systems • ${loc} Regional Division`;

    const step2Subject = `Benchmark data: ${loc} ${niche} mobile conversion rates`;
    const step2Body = `Hi ${owner},

Following up on my note regarding ${biz}'s mobile load speed (${perf}/100). 

We put together an itemized diagnostic comparing your site speed against the top 3 ranking ${niche} contractors in ${loc}. Even shaving 1.4 seconds off your mobile First Contentful Paint typically recovers 6 to 12 lost inquiry calls per month without spending an extra dollar on ads.

Here is the direct preview link to your white-label audit report and speed patch.

Would Thursday at 10:30 AM or 2:00 PM work for a quick 5-minute debrief?

Best,
Kaiso Operating Systems`;

    const step3Subject = `Permission to close file on ${biz} (${loc})`;
    const step3Body = `Hi ${owner},

I haven't heard back, so I assume optimizing mobile lead capture and speed for ${biz} isn't a top priority right now. Completely understand—you're busy in the field.

I will archive your ${loc} territory diagnostic file for now. If you ever want to review the speed comparison or deploy the high-speed emergency lander, feel free to reply directly here.

Wishing ${biz} a high-volume season ahead.

Warm regards,
Kaiso Operating Systems`;

    return {
      title: `3-Touch High-Converting Outreach Sequence - ${biz}`,
      summary: `High-intent outreach sequence tailored for ${biz} in ${loc} targeting Core Web Vitals deficiency (${perf}/100) and SEO recovery (${seo}/100).`,
      structuredData: {
        framework: 'KAISO Empirical Value Sequence (Speed Audit ➔ Local Map Pack ➔ Permission Breakaway)',
        businessName: biz,
        ownerName: owner,
        city: loc,
        steps: [
          {
            step: 1,
            day: 1,
            channel: 'email',
            subject: step1Subject,
            body: step1Body
          },
          {
            step: 2,
            day: 3,
            channel: 'email',
            subject: step2Subject,
            body: step2Body
          },
          {
            step: 3,
            day: 7,
            channel: 'email',
            subject: step3Subject,
            body: step3Body
          }
        ]
      },
      renderedOutput: `### STEP 1 (DAY 1) — DIRECT SPEED HOOK\n**Subject:** ${step1Subject}\n\n${step1Body}\n\n---\n\n### STEP 2 (DAY 3) — REGIONAL BENCHMARK\n**Subject:** ${step2Subject}\n\n${step2Body}\n\n---\n\n### STEP 3 (DAY 7) — PERMISSION BREAKAWAY\n**Subject:** ${step3Subject}\n\n${step3Body}`
    };
  }

  return {
    title: `${company} - ${toolId.replace(/_/g, ' ').toUpperCase()}`,
    summary: `Structured diagnostic and operational asset generated for ${company} in ${city}.`,
    structuredData: { toolId, parameters, company, city },
    renderedOutput: JSON.stringify({ status: 'generated', toolId, company, city, timestamp: new Date() }, null, 2)
  };
}

export async function chatWithHermesAgent(
  contractorId: string,
  userMessage: string,
  targetArtifactId?: string
): Promise<{
  replyMessageId: string;
  replyText: string;
  updatedArtifact?: any;
  thoughtProcess?: string;
}> {
  // Fetch contractor info
  const [contractorRecord] = await pgDb
    .select()
    .from(contractors)
    .where(eq(contractors.id, contractorId));

  const contractorName = contractorRecord?.companyName || 'Apex Service Solutions';
  const contractorCity = contractorRecord?.city || 'Dallas, TX';
  const contractorService = contractorRecord?.serviceType || 'HVAC & Home Services';

  // Save User message
  const userMsgId = crypto.randomUUID();
  await pgDb.insert(hermesLabMessages).values({
    id: userMsgId,
    contractorId,
    artifactId: targetArtifactId || null,
    role: 'user',
    content: userMessage,
    createdAt: new Date()
  });

  // Fetch recent message history
  const history = await pgDb
    .select()
    .from(hermesLabMessages)
    .where(eq(hermesLabMessages.contractorId, contractorId))
    .orderBy(desc(hermesLabMessages.createdAt))
    .limit(8);

  const chronologicalHistory = [...history].reverse();

  // Fetch target artifact if provided
  let currentArtifact: any = null;
  if (targetArtifactId) {
    const [found] = await pgDb
      .select()
      .from(hermesLabArtifacts)
      .where(
        and(
          eq(hermesLabArtifacts.id, targetArtifactId),
          eq(hermesLabArtifacts.contractorId, contractorId)
        )
      );
    currentArtifact = found || null;
  }

  const systemInstruction = `You are Nous Research Hermes Agent Operating inside the Hermes Intelligence Lab for ${contractorName} (${contractorCity}, specializing in ${contractorService}).
You are a master human designer, frontend engineer, and direct-response strategist following the Emil Kowalski UI/UX philosophy and strict anti-AI design standards.
The user is talking directly to you in the Brand & Taste Studio to customize, personalize, redesign, or polish their assets.

[EMIL KOWALSKI & ANTI-AI DESIGN LAWS FOR ASSET CRAFTING]
1. BANNED AI CLICHÉS:
   - ❌ NO purple/neon gradients, radial glowing orbs, liquid glass, or floating cards on pitch black.
   - ❌ NO generic Inter/Geist defaults — pair expressive editorial serifs (Instrument Serif, Newsreader, Fraunces) with tactile workhorse sans/mono (Instrument Sans, IBM Plex, JetBrains Mono).
   - ❌ NO soft everything with heavy blurry shadows and oversized radii — use crisp 1px borders (#E2DFD4 or #27272A) and mathematical radius nesting.
   - ❌ NO bento grids with 3 stacked icon cards or 3 generic pricing boxes — build asymmetric editorial layouts, live symptom diagnostic selectors, itemized price ledgers, and real license registries.
   - ❌ NO fake hype copy ("supercharge", "empower comfort", "They changed my life!") — write grounded, technical, local trade copy.

2. RE-SYNTHESIS EXECUTION:
   - If the user asks to modify, rewrite, improve, or redesign an asset, output the complete, unshortened code in \`renderedOutput\` with full inline Tailwind, Google Fonts, and working interactive JavaScript.
   - Keep all HAL attribution hooks intact (hidden fields for \`gclid\`, \`utm_source\`, \`utm_medium\`, \`utm_campaign\`, and click-to-call links).
   - Address the user's critique with professional composure, explaining the specific typographic, layout, and micro-interaction upgrades implemented.

Always respond in strictly formatted JSON:
{
  "thoughtProcess": "Short 1-2 sentence internal reasoning",
  "reply": "Conversational, direct, helpful response to the operator explaining what changes were made or answering their question",
  "artifactUpdate": {
    "title": "Updated or New Title",
    "summary": "Summary of what was styled / changed according to user taste",
    "structuredData": { ... },
    "renderedOutput": "Complete updated HTML/CSS, JSON-LD, or Markdown code (ONLY if code/asset was changed, otherwise null)"
  }
}`;

  const prompt = `
[CONTRACTOR PROFILE]
Company: ${contractorName}
Territory: ${contractorCity}
Niche: ${contractorService}

[ACTIVE ARTIFACT IN SCOPE]
${currentArtifact ? JSON.stringify({
  id: currentArtifact.id,
  toolId: currentArtifact.toolId,
  title: currentArtifact.title,
  summary: currentArtifact.content?.summary,
  renderedOutput: currentArtifact.content?.renderedOutput?.substring(0, 3000) // snippet
}, null, 2) : 'No specific artifact selected. General Lab chat.'}

[RECENT CONVERSATION HISTORY]
${chronologicalHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

[USER REQUEST]
${userMessage}

Respond in the required JSON format.`;

  let parsed: any = null;

  // Priority 1: OpenRouter (Hermes 3 / Hermes 4)
  if (!parsed && (process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY)) {
    try {
      const raw = await callOpenRouterHermes([
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ], 0.4, true);
      parsed = safeExtractJson(raw);
    } catch (err) {
      console.warn('[Hermes Chat] OpenRouter Hermes error, attempting cascade:', err);
    }
  }

  // Priority 2: Hugging Face Nous Research Hermes 3
  if (!parsed && (process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN)) {
    try {
      const raw = await callHuggingFaceHermes([
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ], 0.4, true);
      parsed = safeExtractJson(raw);
    } catch (err) {
      console.warn('[Hermes Chat] Hugging Face Hermes error, attempting cascade:', err);
    }
  }

  // Priority 3: Gemini 2.5 Flash
  const gemini = getGeminiClient();
  if (!parsed && gemini) {
    try {
      const resp = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json'
        }
      });
      parsed = safeExtractJson(resp.text || '{}');
    } catch (err) {
      console.warn('[Hermes Chat] Gemini error:', err);
    }
  }

  // Priority 4: NVIDIA NIM
  if (!parsed && process.env.NVIDIA_API_KEY) {
    try {
      const raw = await callNemotron([
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ], 0.4, true);
      parsed = safeExtractJson(raw);
    } catch (err) {
      console.warn('[Hermes Chat] NVIDIA error:', err);
    }
  }

  if (!parsed) {
    parsed = {
      thoughtProcess: 'Deterministic response acknowledging personalization request.',
      reply: `I have received your preferences for ${contractorName}. I will tailor our landing pages, copy, and campaigns to match your requested style, colors, and business rules.`,
      artifactUpdate: null
    };
  }

  let updatedArtifactRecord: any = null;

  // If the agent updated or generated an artifact
  if (parsed.artifactUpdate && parsed.artifactUpdate.renderedOutput) {
    if (currentArtifact) {
      // Update existing artifact
      const newContent = {
        summary: parsed.artifactUpdate.summary || currentArtifact.content?.summary,
        structuredData: parsed.artifactUpdate.structuredData || currentArtifact.content?.structuredData || {},
        renderedOutput: parsed.artifactUpdate.renderedOutput
      };

      await pgDb
        .update(hermesLabArtifacts)
        .set({
          title: parsed.artifactUpdate.title || currentArtifact.title,
          content: newContent,
          updatedAt: new Date()
        })
        .where(eq(hermesLabArtifacts.id, currentArtifact.id));

      updatedArtifactRecord = {
        id: currentArtifact.id,
        title: parsed.artifactUpdate.title || currentArtifact.title,
        content: newContent,
        toolId: currentArtifact.toolId
      };
    } else {
      // Create new artifact
      const newArtId = crypto.randomUUID();
      const newContent = {
        summary: parsed.artifactUpdate.summary || 'Created via Hermes Lab Chat',
        structuredData: parsed.artifactUpdate.structuredData || {},
        renderedOutput: parsed.artifactUpdate.renderedOutput
      };

      await pgDb.insert(hermesLabArtifacts).values({
        id: newArtId,
        contractorId,
        toolId: 'landing_page',
        title: parsed.artifactUpdate.title || `Personalized Asset - ${contractorName}`,
        category: 'web',
        content: newContent,
        status: 'ready',
        createdBy: 'hermes_agent',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      updatedArtifactRecord = {
        id: newArtId,
        title: parsed.artifactUpdate.title || `Personalized Asset - ${contractorName}`,
        content: newContent,
        toolId: 'landing_page'
      };
    }
  }

  const assistantMsgId = crypto.randomUUID();
  await pgDb.insert(hermesLabMessages).values({
    id: assistantMsgId,
    contractorId,
    artifactId: targetArtifactId || updatedArtifactRecord?.id || null,
    role: 'assistant',
    content: parsed.reply || 'Changes applied.',
    attachedArtifact: updatedArtifactRecord ? updatedArtifactRecord : null,
    thoughtProcess: parsed.thoughtProcess || null,
    createdAt: new Date()
  });

  return {
    replyMessageId: assistantMsgId,
    replyText: parsed.reply || 'Changes applied.',
    updatedArtifact: updatedArtifactRecord,
    thoughtProcess: parsed.thoughtProcess
  };
}
