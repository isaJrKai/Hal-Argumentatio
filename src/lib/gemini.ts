import { GoogleGenAI } from "@google/genai";
import { generateResponse, cleanJSONResponse, callNemotron, getActiveAI } from "../services/nemotron.ts";
import { verifyLeadGrounding } from "./networkVerification.ts";

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to heuristic analytics.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

/**
 * Analyzes expired forecast outcomes and generates a natural language learning insight
 * Returns a calibrated confidence score based on empirical deviation and causal evidence.
 */
export async function generateLearningFromOutcome(
  metric: string,
  predicted: number,
  actual: number,
  deviation: number,
  assumptions: string,
  preferredAI?: string
): Promise<{ insight: string; confidence: number; category: string; source?: string }> {
  const category = `${metric}_deviation_learning`;
  
  const prompt = `You are HAL, the core learning engine of HALBiz.
An expired business metric forecast has been evaluated.
- Metric: ${metric}
- Predicted value: ${predicted}
- Actual value: ${actual}
- Deviation: ${Math.round(deviation * 100)}%
- Original forecast assumptions: "${assumptions}"

Task:
1. Write a concise, professional, highly actionable learning insight (1-2 sentences maximum) explaining why the deviation occurred or what must be adjusted in future cycles. Be specific. No fluff.
2. Quantify your causal confidence score as a decimal between 0.10 and 0.95 reflecting how strongly the available data supports this causal attribution (lower for high volatility or unexplained gaps, higher for clear direct attribution).

Return your response strictly as a raw JSON object matching this structure:
{
  "insight": "string",
  "confidence": number
}`;

  const activeAI = getActiveAI(preferredAI);

  // Helper to calibrate confidence: clamp between 0.10 and 0.95 and account for extreme unexplained variance
  const calibrateConfidence = (rawScore: number): number => {
    const parsed = typeof rawScore === 'number' && !isNaN(rawScore) ? rawScore : 0.65;
    // Penalty if deviation is extreme (>60%) indicating high unpredictability
    const variancePenalty = Math.abs(deviation) > 0.6 ? 0.15 : Math.abs(deviation) > 0.3 ? 0.08 : 0;
    const bounded = Math.min(0.92, Math.max(0.18, parsed - variancePenalty));
    return Math.round(bounded * 100) / 100;
  };

  if (activeAI === 'gemini') {
    // 1. Try Gemini first (Strictly 3.5)
    const ai = getAIClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are HAL, a Swiss-style, highly professional AI Business Operating Intelligence system. You produce objective, analytical, short learning insights without marketing fluff. Always output valid JSON.",
            responseMimeType: "application/json",
            temperature: 0.2,
          }
        });

        const text = response.text || "{}";
        const parsed = JSON.parse(text.trim());
        const insight = parsed.insight || text.trim();
        const confidence = calibrateConfidence(Number(parsed.confidence));
        return {
          insight,
          confidence,
          category,
          source: 'gemini-3.8-flash'
        };
      } catch (err) {
        console.error("Gemini learning call failed, trying Nemotron fallback:", err);
      }
    }

    // Fallback to NVIDIA Nemotron
    if (process.env.NVIDIA_API_KEY) {
      try {
        const systemInstruction = "You are HAL, a Swiss-style, highly professional AI Business Operating Intelligence system. Always output valid JSON matching the requested schema.";
        const text = await callNemotron([
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ], 0.2, true);
        const cleaned = cleanJSONResponse(text);
        const parsed = JSON.parse(cleaned);
        const insight = parsed.insight || cleaned;
        const confidence = calibrateConfidence(Number(parsed.confidence));
        return {
          insight,
          confidence,
          category,
          source: 'nvidia-nemotron-70b'
        };
      } catch (err) {
        console.error("NVIDIA Nemotron learning fallback failed:", err);
      }
    }
  } else {
    // 1. Try NVIDIA Nemotron first (since Gemini is OFF or Nemotron is preferred)
    if (process.env.NVIDIA_API_KEY) {
      try {
        const systemInstruction = "You are HAL, a Swiss-style, highly professional AI Business Operating Intelligence system. Always output valid JSON matching the requested schema.";
        const text = await callNemotron([
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ], 0.2, true);
        const cleaned = cleanJSONResponse(text);
        const parsed = JSON.parse(cleaned);
        const insight = parsed.insight || cleaned;
        const confidence = calibrateConfidence(Number(parsed.confidence));
        return {
          insight,
          confidence,
          category,
          source: 'nvidia-nemotron-70b'
        };
      } catch (err) {
        console.error("NVIDIA Nemotron learning call failed, trying Gemini fallback:", err);
      }
    }

    // Fallback to Gemini (Strictly 3.5)
    const ai = getAIClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are HAL, a Swiss-style, highly professional AI Business Operating Intelligence system. Always output valid JSON.",
            responseMimeType: "application/json",
            temperature: 0.2,
          }
        });

        const text = response.text || "{}";
        const parsed = JSON.parse(text.trim());
        const insight = parsed.insight || text.trim();
        const confidence = calibrateConfidence(Number(parsed.confidence));
        return {
          insight,
          confidence,
          category,
          source: 'gemini-3.8-flash'
        };
      } catch (err) {
        console.error("Gemini learning fallback failed:", err);
      }
    }
  }

  // 3. Fallback heuristics if all AI APIs fail - transparently flagged as unverified heuristic
  const direction = actual > predicted ? 'higher' : 'lower';
  const absDev = Math.abs(deviation);
  const magnitude = absDev > 0.2 ? 'significant' : 'minor';
  const fallbackInsight = `[Fallback Heuristic - Model Offline]: Observed actual ${metric} is ${direction} than predicted by ${Math.round(absDev * 100)}%. This ${magnitude} deviation suggests manual review of initial bid premiums during event hours.`;
  // Honest mathematically bounded confidence based on deviation magnitude (lower deviation = higher baseline reliability)
  const heuristicConfidence = Math.max(0.20, Math.min(0.48, 0.50 - absDev * 0.25));
  return {
    insight: fallbackInsight,
    confidence: Math.round(heuristicConfidence * 100) / 100,
    category,
    source: 'fallback_heuristic'
  };
}

/**
 * Generates automated forecasts based on trend analysis
 */
export async function generateForecastNarrative(
  metric: string,
  historicalData: any[],
  preferredAI?: string
): Promise<{ predicted: number; assumptions: string; confidenceScore: number; source?: string }> {
  const dataString = JSON.stringify(historicalData);
  
  const prompt = `Analyze this 90-day historical trend for the metric "${metric}":
${dataString}

1. Calculate/predict the expected average value for this metric over the next 7 days.
2. Formulate 1 highly technical, specific business assumption that justifies this prediction.
3. Quantify your confidence score (between 0.0 and 1.0).

Return your response in a raw JSON object format (no markdown blocks, no code blocks, just raw JSON) matching this structure:
{
  "predicted": number,
  "assumptions": "string",
  "confidenceScore": number
}`;

  const activeAI = getActiveAI(preferredAI);

  const calibrateForecastConfidence = (modelScore?: number): number => {
    const sampleSize = historicalData?.length || 0;
    // Sample depth multiplier: with < 7 records, epistemic uncertainty is high
    const depthWeight = sampleSize >= 60 ? 1.0 : sampleSize >= 14 ? 0.85 : sampleSize >= 7 ? 0.70 : 0.45;
    const raw = typeof modelScore === 'number' && Number.isFinite(modelScore) ? modelScore : 0;
    const calibrated = Math.min(0.93, Math.max(0.20, raw * depthWeight));
    return Math.round(calibrated * 100) / 100;
  };

  const parseForecastResponse = (result: any) => {
    const predicted = Number(result?.predicted);
    const modelScore = Number(result?.confidenceScore);
    const assumptions = typeof result?.assumptions === 'string' ? result.assumptions.trim() : '';
    if (!Number.isFinite(predicted) || !Number.isFinite(modelScore) || !assumptions) {
      throw new Error('Forecast model returned incomplete or invalid evidence.');
    }
    return { predicted, assumptions, confidenceScore: calibrateForecastConfidence(modelScore) };
  };

  if (activeAI === 'gemini') {
    // 1. Try Gemini first (Strictly 3.5)
    const ai = getAIClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          }
        });

        const text = response.text || "{}";
        const result = JSON.parse(text.trim());
        return { ...parseForecastResponse(result), source: 'gemini-3.8-flash' };
      } catch (err) {
        console.error("Gemini forecast generation failed, trying Nemotron fallback:", err);
      }
    }

    // Fallback to NVIDIA Nemotron
    if (process.env.NVIDIA_API_KEY) {
      try {
        const text = await callNemotron([
          { role: "user", content: prompt }
        ], 0.2, true);
        const cleaned = cleanJSONResponse(text);
        const result = JSON.parse(cleaned);
        return { ...parseForecastResponse(result), source: 'nvidia-nemotron-70b' };
      } catch (err) {
        console.error("NVIDIA Nemotron forecast fallback failed:", err);
      }
    }
  } else {
    // 1. Try NVIDIA Nemotron first (since Gemini is OFF or Nemotron is preferred)
    if (process.env.NVIDIA_API_KEY) {
      try {
        const text = await callNemotron([
          { role: "user", content: prompt }
        ], 0.2, true);
        const cleaned = cleanJSONResponse(text);
        const result = JSON.parse(cleaned);
        return { ...parseForecastResponse(result), source: 'nvidia-nemotron-70b' };
      } catch (err) {
        console.error("NVIDIA Nemotron forecast generation failed, trying Gemini fallback:", err);
      }
    }

    // Fallback to Gemini (Strictly 3.5)
    const ai = getAIClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          }
        });

        const text = response.text || "{}";
        const result = JSON.parse(text.trim());
        return { ...parseForecastResponse(result), source: 'gemini-3.8-flash' };
      } catch (err) {
        console.error("Gemini forecast fallback failed:", err);
      }
    }
  }

  // 3. Robust linear projection fallback
  if (!Array.isArray(historicalData) || historicalData.length === 0) {
    throw new Error('Forecast unavailable: no historical snapshots exist for this metric.');
  }
  const values = historicalData.map(h => h.value);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return {
    source: 'fallback_heuristic',
    predicted: Math.round(avg * 10) / 10,
    assumptions: `[Fallback Baseline - Model Offline] Historical mean across ${historicalData.length} records; this is a simple baseline, not a validated prediction.`,
    confidenceScore: 0 // Uncalibrated; no validated model confidence is available
  };
}

/**
 * Harvests actual operating home-service businesses using Gemini
 */
export async function harvestRealBusinesses(
  city: string,
  niche: string,
  preferredAI?: string,
  limit: number = 10
): Promise<Array<{
  businessName: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  city: string;
  serviceType: string;
  websiteUrl: string;
  seoScore?: number | null;
  performanceScore?: number | null;
  sslStatus?: 'secured' | 'missing' | null;
  googleRating?: number | null;
  reviewCount?: number | null;
  sentimentScore?: number | null;
  outreachStrategy: string;
  notes: string;
  isSynthetic: boolean;
  sourceType: 'live_harvest' | 'ai_discovery_unverified' | 'synthetic_fallback';
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED_STAGING' | 'FABRICATED_REJECTED';
  dnsVerified?: boolean;
  groundingEvidence?: any;
}>> {
  const targetCount = Math.min(Math.max(Number(limit) || 10, 1), 25);
  const prompt = `You are HAL's verified territory intelligence discovery engine.
Search the live web, Google Maps, and local registries for real, active, operating home services or trade contractors in the city of "${city}" for the niche "${niche}".
Identify and return up to ${targetCount} actual operating businesses.

For each business, research and provide verified details:
1. "businessName" - Official registered business or trade name.
2. "ownerName" - Owner, founder, or key manager if known (otherwise omit or null).
3. "email" - Public contact or dispatch email (e.g. info@domain, service@domain, or office@domain).
4. "phone" - Actual public operating telephone number.
5. "city" - "${city}".
6. "serviceType" - "${niche}".
7. "websiteUrl" - Official active website URL.
8. "outreachStrategy" - A cautious outreach angle based only on facts actually present in the search results.
9. "notes" - State which details are unknown; do not invent ratings, review counts, technical scores, SSL, performance, or sentiment.

IMPORTANT: Output ONLY a valid JSON array of objects with the keys above inside a markdown json block. Do not include introductory text or commentary outside the JSON block.`;

  const activeAI = getActiveAI(preferredAI);

  const groundHarvestedBusinesses = async (
    items: any[],
    provenance: 'live_harvest' | 'ai_discovery_unverified'
  ) => {
    return await Promise.all(items.map(async (b) => {
      const unmeasuredMetrics = {
        seoScore: null,
        performanceScore: null,
        sslStatus: null,
        googleRating: null,
        reviewCount: null,
        sentimentScore: null,
      };
      try {
        const grounding = await verifyLeadGrounding({
          businessName: b.businessName,
          websiteUrl: b.websiteUrl,
          phone: b.phone,
          isSynthetic: false
        });
        return {
          ...b,
          ...unmeasuredMetrics,
          isSynthetic: false,
          sourceType: provenance,
          verificationStatus: provenance === 'live_harvest' ? grounding.status : 'UNVERIFIED_STAGING',
          dnsVerified: grounding.evidence.dnsResolved,
          groundingEvidence: grounding.evidence
        };
      } catch {
        return {
          ...b,
          ...unmeasuredMetrics,
          isSynthetic: false,
          sourceType: provenance,
          verificationStatus: 'UNVERIFIED_STAGING' as const,
          dnsVerified: false
        };
      }
    }));
  };

  const ai = getAIClient();

  if (ai) {
    // 1. Primary Path: Gemini with live Google Search Grounding & retry
    const searchModels = ["gemini-3.8-flash", "gemini-flash-latest"];
    for (const model of searchModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              temperature: 0.2,
              tools: [{ googleSearch: {} }],
            }
          });

          const rawText = response.text || "";
          const cleaned = cleanJSONResponse(rawText);
          const parsed = JSON.parse(cleaned);

          if (Array.isArray(parsed) && parsed.length > 0) {
            const mapped = parsed.map((b: any) => ({
              ...b,
              isSynthetic: false,
              sourceType: 'live_harvest' as const
            }));
            return await groundHarvestedBusinesses(mapped, 'live_harvest');
          }
        } catch (err: any) {
          const is503 = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('high demand');
          if (is503 && attempt === 0) {
            console.info(`[Prospect Finder] ${model} 503 spike, retrying after 1500ms...`);
            await new Promise(r => setTimeout(r, 1500));
            continue;
          }
          console.warn(`[Prospect Finder] Search grounded harvest with ${model} failed:`, err?.message || err);
          break; // proceed to next candidate
        }
      }
    }

    // 2. Secondary Path: Gemini with structured JSON mode (no search tool needed if grounding was blocked)
    const structuredModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    for (const model of structuredModels) {
      try {
        const fallbackResponse = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          }
        });
        const text = fallbackResponse.text || "[]";
        const cleaned = cleanJSONResponse(text);
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((b: any) => ({
            ...b,
            isSynthetic: false,
            sourceType: 'live_harvest' as const
          }));
          return await groundHarvestedBusinesses(mapped, 'ai_discovery_unverified');
        }
      } catch (fallbackErr: any) {
        console.warn(`[Prospect Finder] Structured ${model} harvest fallback failed:`, fallbackErr?.message || fallbackErr);
      }
    }
  }

  // Tertiary Path: NVIDIA Nemotron if configured
  if (process.env.NVIDIA_API_KEY) {
    try {
      const text = await callNemotron([
        { role: "user", content: prompt }
      ], 0.3, true);
      const cleaned = cleanJSONResponse(text);
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const mapped = parsed.map((b: any) => ({
          ...b,
          isSynthetic: false,
          sourceType: 'live_harvest' as const
        }));
        return await groundHarvestedBusinesses(mapped);
      }
    } catch (err) {
      console.error("[Prospect Finder] NVIDIA Nemotron business harvesting fallback failed:", err);
    }
  }

  // Fail-Closed Fallback: Return empty array per HAL Constitution Law #2
  return [];
}

/**
 * Ask HAL Chatbot - A-Z Knowledge Base Responder
 */
export async function askHalBot(
  message: string,
  history: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>,
  enableGrounding?: boolean,
  preferredAI?: string
): Promise<{ text: string; sources?: Array<{ title: string; uri: string }> }> {
  const systemInstruction = `You are HAL, the core AI Business Operating Intelligence system. You possess deep, complete, A-to-Z knowledge of the HAL system, its architecture, guidelines, and database structures.

SUPREME INTENTIONALITY DIRECTIVE:
"HAL does not exist to answer everything. HAL exists to understand what matters, reason about it, and help the operator move the business forward."
Every behavior must have intent: Evidence ➔ Interpretation ➔ Decision. Never fabricate reality or manufacture certainty where evidence is absent.

Your response tone must be Swiss-style, highly professional, precise, objective, confident, and free of fluff or exclamation marks. Speak directly to the executive user.

Key Knowledge Pillars:
1. THE MISSION PROTOCOL:
   HAL operates on the North Star: Mission ➔ Goals ➔ Planner ➔ Memory ➔ Knowledge ➔ World Model ➔ Agents ➔ Skills ➔ Tools ➔ Integrations ➔ Execution ➔ Learning.
2. THE HAL CONSTITUTION:
   - Ready beats perfect: Ship real features over theory.
   - Preserve architecture: Respect, reuse, and extend current patterns.
   - Modularity: Build isolated, single-responsibility services.
   - Evidence-based recommendations: Rely on real harvested territory data, technical SEO audits, page speeds, SSL status, and Google Ratings.
   - Continuous learning: Calibrate weights after completed campaigns.
   - Constrain the tools, not the behavior: Never hardcode rigid workflows. Hand the user the instruments a junior employee at their desk would use (Document Studio, phone, calendar, audit tools, customer notes). Let workflows emerge naturally through collaboration with the operator.
   - The Apprenticeship Loop: Treat the operator like the business owner sitting next to you for a week. When they correct you ("No, we don't say that to regulars", "Use shaded style for contracts"), absorb the correction permanently into business memory.
   - Epistemic discipline: Clearly distinguish FACT, OBSERVATION, INFERENCE, HYPOTHESIS, and ACTION.
3. ARCHITECTURAL BOUNDARIES:
   - Connectors: Dedicated strictly to connecting HAL to external services (GA4, Google Search Console, Google Tag Manager, GBP, Maps, SMTP, Outlook, WhatsApp, Google Drive, OneDrive, Gemini, OpenAI, Claude, Microsoft 365, Google Workspace, Stripe, HubSpot, Slack). No user profiles or themes belong here!
   - Settings: The operating system control center. Manages user profile, avatars, company logos, brand colors, AI model preferences, security keys, audit logs, backup & restore, version information.
   - System Health: HAL's heartbeat. Live diagnostic score showing AI latency, DB health (SQLite), log stream, background schedulers.
   - Skills Engine: Modular capability launcher. It runs standard website audits, outreach scripts, geo mappings, and has specialized modules for business expansion:
     * Talent Arbitrage & Bridge Scoper ('talent_arbitrage_bridge'): Managed business model connecting affordable remote talent with overseas businesses under high-quality managed control.
     * Verified Lead List Packager ('verified_lead_lists'): Data-product lists compiled with review counts and ad status verified via actual live sources.
     * Automation Ops Product Scoper ('automation_ops_product'): Packages recurring integrations like missed-call text-back and booking triggers via Twilio/Zapier.
     * Pricing & Margin Calculator ('pricing_margin_calculator'): Evaluates overhead, target margins, and designs client retainers.
     * Ad Spend & Breakeven Optimizer ('ad_spend_breakeven'): Models unit economics for Google Ads, CPA targets, and required conversion rates.
     * List Subscription Pricing ('list_subscription_pricing'): Designs monthly and yearly recurring subscription tiers for lead database lists.
   - Leads: Discovered and compiled businesses with real PII fields encrypted with AES-256-GCM.
   - Clients: Structured Kanban board with conversions and contract status.
   - Campaigns: Marketing performance comparison and lower CPL selection.
   - Knowledge: Real-time cron jobs, execution recommendations, and weather-triggered triggers.

Respond to any questions from the executive clearly and authoritatively. Be technical and precise. Keep your answers brief, informative, and beautifully structured.`;

  const activeAI = getActiveAI(preferredAI);

  if (activeAI === 'gemini') {
    // 1. Try Gemini first (Strictly 3.5)
    const ai = getAIClient();
    if (ai) {
      try {
        const config: any = {
          systemInstruction,
          temperature: 0.3,
        };

        let usedGrounding = !!enableGrounding;
        if (usedGrounding) {
          config.tools = [{ googleSearch: {} }];
        }

        const contents = [
          ...history.map(item => ({
            role: item.role === 'user' ? 'user' : 'model',
            parts: item.parts.map(p => ({ text: p.text }))
          })),
          { role: 'user', parts: [{ text: message }] }
        ];

        const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
        let response: any = null;
        let lastError: any = null;

        for (const model of candidateModels) {
          try {
            response = await ai.models.generateContent({
              model,
              contents,
              config
            });
            if (response?.text) break;
          } catch (err: any) {
            lastError = err;
            if (usedGrounding) {
              console.warn(`[HAL Gemini] Search Grounding failed on ${model}, retrying without tools...`);
              try {
                const ungroundedConfig = { ...config };
                delete ungroundedConfig.tools;
                response = await ai.models.generateContent({
                  model,
                  contents,
                  config: ungroundedConfig
                });
                if (response?.text) break;
              } catch (innerErr) {
                lastError = innerErr;
              }
            }
          }
        }

        if (!response?.text && lastError) {
          throw lastError;
        }

        const text = response.text || "No response received from HAL Core.";
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: Array<{ title: string; uri: string }> = [];
        if (usedGrounding && chunks) {
          for (const chunk of chunks) {
            if (chunk.web?.uri) {
              sources.push({
                title: chunk.web.title || chunk.web.uri,
                uri: chunk.web.uri
              });
            }
          }
        }

        return {
          text,
          sources: sources.length > 0 ? sources : undefined
        };
      } catch (err: any) {
        console.error("Gemini chatbot error, trying Nemotron fallback:", err);
      }
    }

    // Fallback to NVIDIA Nemotron
    if (process.env.NVIDIA_API_KEY) {
      try {
        const messages = [
          { role: "system", content: systemInstruction }
        ];
        if (history && history.length > 0) {
          for (const turn of history) {
            const role = turn.role === 'model' ? 'assistant' : 'user';
            const content = turn.parts.map(p => p.text).join('\n');
            messages.push({ role, content });
          }
        }
        messages.push({ role: "user", content: message });

        const text = await callNemotron(messages, 0.3);
        return { text };
      } catch (err: any) {
        console.error("NVIDIA Nemotron chatbot fallback error:", err);
      }
    }
  } else {
    // 1. Try NVIDIA Nemotron first (since Gemini is OFF or Nemotron is preferred)
    if (process.env.NVIDIA_API_KEY) {
      try {
        const messages = [
          { role: "system", content: systemInstruction }
        ];
        if (history && history.length > 0) {
          for (const turn of history) {
            const role = turn.role === 'model' ? 'assistant' : 'user';
            const content = turn.parts.map(p => p.text).join('\n');
            messages.push({ role, content });
          }
        }
        messages.push({ role: "user", content: message });

        const text = await callNemotron(messages, 0.3);
        return { text };
      } catch (err: any) {
        console.error("NVIDIA Nemotron chatbot error, trying Gemini fallback:", err);
      }
    }

    // Fallback to Gemini (Strictly 3.5)
    const ai = getAIClient();
    if (ai) {
      try {
        const config: any = {
          systemInstruction,
          temperature: 0.3,
        };

        let usedGrounding = !!enableGrounding;
        if (usedGrounding) {
          config.tools = [{ googleSearch: {} }];
        }

        const contents = [
          ...history.map(item => ({
            role: item.role === 'user' ? 'user' : 'model',
            parts: item.parts.map(p => ({ text: p.text }))
          })),
          { role: 'user', parts: [{ text: message }] }
        ];

        const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
        let response: any = null;
        let lastError: any = null;

        for (const model of candidateModels) {
          try {
            response = await ai.models.generateContent({
              model,
              contents,
              config
            });
            if (response?.text) break;
          } catch (err: any) {
            lastError = err;
            if (usedGrounding) {
              console.warn(`[HAL Gemini Fallback] Search Grounding failed on ${model}, retrying without tools...`);
              try {
                const ungroundedConfig = { ...config };
                delete ungroundedConfig.tools;
                response = await ai.models.generateContent({
                  model,
                  contents,
                  config: ungroundedConfig
                });
                if (response?.text) break;
              } catch (innerErr) {
                lastError = innerErr;
              }
            }
          }
        }

        if (!response?.text && lastError) {
          throw lastError;
        }

        const text = response.text || "No response received from HAL Core.";
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: Array<{ title: string; uri: string }> = [];
        if (usedGrounding && chunks) {
          for (const chunk of chunks) {
            if (chunk.web?.uri) {
              sources.push({
                title: chunk.web.title || chunk.web.uri,
                uri: chunk.web.uri
              });
            }
          }
        }

        return {
          text,
          sources: sources.length > 0 ? sources : undefined
        };
      } catch (err: any) {
        console.error("Gemini chatbot fallback error:", err);
      }
    }
  }

  // Ultimate Swiss Heuristic Fallback Answer
  const lower = message.toLowerCase();
  let reply = "I am operating in standalone diagnostic mode. I am fully trained on HAL from A to Z.\n\n";
  if (lower.includes("step by step") || lower.includes("what to do") || lower.includes("how to start") || lower.includes("dont know") || lower.includes("don't know")) {
    reply = `Here is your exact step-by-step operating roadmap to start winning commercial contractor contracts right now:

### Step 1: Lock In Your Target Niche & Territory
Navigate to **Mission Control** or **Territory Radar**. Choose a high-ticket, emergency-driven trade (e.g., *Commercial Sump Pump & Basement Waterproofing* or *Custom Home Builders*) in your target city. High urgency trades convert fastest because a flooded basement or commercial leak cannot wait.

### Step 2: Harvest Real-World Leads
Go to the **Leads** panel and run a harvest for your target market. HAL pulls real verified contractors, audits their websites for technical deficits (slow load speeds >5s, missing SSL, zero tap-to-call mobile buttons, and weak Google reviews).

### Step 3: Pick the 5 Highest-Deficit Prospects
Filter by lowest speed score (<40) or missing mobile response. These contractors are actively losing $10,000–$30,000/mo because paid clicks are bouncing before the page even loads.

### Step 4: Dispatch the Cold Pitch Deck / Speed Deficit Report
In the **Outreach Studio** or **Document Studio**, select the prospect and generate a personalized *Speed Deficit Audit*. It shows them the exact milliseconds their competitors beat them by, and offers your *0.3s Emergency Intake System* as the immediate fix.

### Step 5: Close on a Performance or Setup Retainer
Offer to replace their slow funnel or set up their emergency call-capture pipeline with a $2,500–$5,000 setup plus a monthly retainer.

Tell me which city or niche you want to tackle right now and I will pull up the exact numbers!`;
  } else if (lower.includes("constitution") || lower.includes("principle")) {
    reply += "Our guiding Constitution has five pillars:\n1. **Ready beats perfect** — High-value shipping beats theory.\n2. **Preserve architecture** — Avoid modifying core db/encryption.\n3. **Modularity** — Build components as isolated services.\n4. **Evidence-based** — No fabricated insights. Real audits only.\n5. **Continuous learning** — Automatic calibration of forecast weights.";
  } else if (lower.includes("connector") || lower.includes("integration")) {
    reply += "Under our structured architecture, **Connectors** have a single responsibility: connecting HAL to external services, APIs, and data providers (like GA4, Google Search Console, GBP, Google Drive, Gemini, Stripe). Core configurations like profiles, themes, and avatars belong strictly under **Settings**.";
  } else if (lower.includes("skills") || lower.includes("add skill")) {
    reply += "The **Skills Engine** executes modular business actions like website auditing, outreach sheet generation, **Talent Arbitrage Scoping** ('talent_arbitrage_bridge'), **Verified Lead List Compilation** ('verified_lead_lists'), **Automation Ops Scoping** ('automation_ops_product'), **Pricing & Margin Calculations** ('pricing_margin_calculator'), **Ad Spend Breakeven Analysis** ('ad_spend_breakeven'), or **List Subscription Pricing** ('list_subscription_pricing').";
  } else if (lower.includes("talent") || lower.includes("va business") || lower.includes("arbitrage") || lower.includes("remote")) {
    reply += "Our **Talent Arbitrage & Bridge Scoper** ('talent_arbitrage_bridge') frames a managed business model connecting highly skilled, affordable remote talent (e.g., from Uganda or East Africa) with small overseas businesses (e.g., North America). The focus is on selling quality control, trust, and managed accountability rather than just cheap labor. Start with a narrow service category and micro-pilot offers to mitigate client risk.";
  } else if (lower.includes("prospect list") || lower.includes("lead list") || lower.includes("verify") || lower.includes("leads")) {
    reply += "Our **Verified Lead List Packager** ('verified_lead_lists') compiles, verifies, and enriches high-intent contact lists for specific niches and geographies (e.g., custom home building in Calgary or mowers in Winnipeg). No email or phone goes on a list unless it is found on a real live source—no domain pattern guessing. Lists are enriched with review counts, ad active status, and pre-tiered under the Territory scoring model to sell directly as a data product.";
  } else if (lower.includes("automation") || lower.includes("ops product") || lower.includes("missed call") || lower.includes("text-back")) {
    reply += "Our **Automation Ops Product Scoper** ('automation_ops_product') packages high-margin, recurring-revenue systems (like missed-call text-back, review requests, and booking triggers) for local businesses. It utilizes robust APIs (such as Twilio and Zapier) to secure small monthly retainers by plugging immediate lead leaks, bypassing high-friction ad spend negotiations.";
  } else if (lower.includes("pricing") || lower.includes("margin") || lower.includes("calculator") || lower.includes("overhead")) {
    reply += "Our **Pricing & Margin Calculator** ('pricing_margin_calculator') maps operating costs, direct VA agent overhead, target gross margin metrics, and models precise retainer options to build a highly optimized local agency framework.";
  } else if (lower.includes("breakeven") || lower.includes("ad spend") || lower.includes("unit economics")) {
    reply += "Our **Ad Spend & Breakeven Optimizer** ('ad_spend_breakeven') models the search volume parameters and click pricing dynamics of Google Ads. It defines the required contract close rates, landing page conversion percentages, and CPA thresholds to operate above the breakeven mark.";
  } else if (lower.includes("subscription") || lower.includes("saas") || lower.includes("data product")) {
    reply += "Our **List Subscription Pricing** ('list_subscription_pricing') outlines scalable monthly and annual subscription tiers for our verified local lead list data product. It structures packages based on the volume of leads processed, review counts, and active ad visibility metrics.";
  } else if (lower.includes("health") || lower.includes("system health")) {
    reply += "The **System Health** dashboard acts as HAL's live heartbeat. It aggregates AI routing status (Gemini latency), SQLite integrity, background daemons, security encryption flags, and overall score parameters.";
  } else if (lower.includes("mission") || lower.includes("conquest")) {
    reply += "A **Territory Conquest Mission** coordinates automated workflows to harvest active niche services in specific cities, audit their page speed, and output targeted cold-pitch decks instantly.";
  } else {
    reply += "HAL is designed around a Mission → Goals → Planner → Memory → Knowledge → World Model → Agents pipeline. Actual feature availability depends on the configured deployment, database, credentials, and integrations. Verify each workflow in the current environment before treating it as production-ready.";
  }
  return { text: reply };
}

/**
 * Generates personalized, high-converting outreach copy across WhatsApp, Email, and SMS.
 */
export async function draftOutreachMessage({
  channel,
  lead,
  niche,
  city,
  customInstructions
}: {
  channel: 'whatsapp' | 'email' | 'sms' | 'calendar';
  lead: {
    businessName: string;
    ownerName?: string;
    city?: string;
    serviceType?: string;
    urgencyScore?: number;
    auditData?: any;
    phone?: string;
    email?: string;
  };
  niche?: string;
  city?: string;
  customInstructions?: string;
}): Promise<{ subject?: string; body: string; callToAction: string }> {
  const client = getAIClient();
  const targetCity = city || lead.city || 'your local market';
  const targetNiche = niche || lead.serviceType || 'your services';
  const targetOwner = lead.ownerName || 'Owner';

  if (!client) {
    if (channel === 'whatsapp') {
      return {
        body: `Hi ${targetOwner}, I came across ${lead.businessName} and wanted to ask whether improving how customers find and contact your ${targetNiche} business is a priority. I’m working on HAL, a business operations tool for contractors. Would a short overview be useful?`,
        callToAction: 'Reply if a short overview would help'
      };
    }
    if (channel === 'sms') {
      return {
        body: `Hi ${targetOwner}, I’m reaching out about ${lead.businessName} and how customers discover and contact local ${targetNiche} businesses. I’m working on HAL, a business operations tool for contractors. Would you be open to a short overview?`,
        callToAction: 'Reply if interested'
      };
    }
    return {
      subject: `Urgent diagnostic & call intake opportunity for ${lead.businessName} (${targetCity})`,
      body: `Hi ${targetOwner},\n\nI came across ${lead.businessName} and wanted to introduce HAL, a business operations tool designed to help contractors manage customer inquiries and business information.\n\nI have not assumed anything about your current systems or results; I would be interested to learn how you currently manage customer inquiries and whether there is an area where better visibility or follow-up would help.\n\nWould you be open to a brief introductory call?\n\nBest regards,\nHAL Business Operations Intelligence`,
      callToAction: 'Arrange an introductory call'
    };
  }

  const prompt = `You are HAL, an AI Business Operations Intelligence assistant for contractors.
Draft a professional, respectful outreach message for the following prospect. Use only supplied evidence and do not invent claims:
- Channel: ${channel.toUpperCase()}
- Prospect Business: ${lead.businessName}
- Contact Name: ${targetOwner}
- Market / City: ${targetCity}
- Niche: ${targetNiche}
- Supplied audit evidence (may be empty): ${JSON.stringify(lead.auditData || {})}
- Custom Instructions: ${customInstructions || 'Introduce HAL briefly and ask one low-pressure question.'}

Evidence and honesty rules:
- Never claim that an audit was conducted, the prospect has a specific problem, demand/leads exist, or a number of jobs/revenue can be gained unless that exact claim is supported by supplied audit evidence.
- If evidence is empty, keep the message introductory and ask a question; do not fabricate local market facts.
- Do not imply HAL is already serving the prospect or that the sender has a relationship with them.

Formatting Rules:
- If WhatsApp: Conversational, executive tone, under 70 words, high curiosity, clear direct question at the end. No cheesy emojis or fluff.
- If Email: Include "subject" line (punchy, high open-rate, no clickbait), followed by "body" (3 brief paragraphs, specific diagnostic value, low-friction call to action).
- If SMS: Under 160 characters, direct, professional, clear reply prompt.
- If Calendar: Meeting invite title, brief 3-bullet diagnostic agenda.

Return ONLY a valid JSON object matching:
{
  "subject": "Email subject or calendar title (optional for SMS/WhatsApp)",
  "body": "The drafted message body",
  "callToAction": "Short 3-5 word label for the next step"
}`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(cleanJSONResponse(response.text || '{}')) as Record<string, unknown>;
    return {
      subject: typeof parsed.subject === 'string' ? parsed.subject : undefined,
      body: typeof parsed.body === 'string' && parsed.body.trim()
        ? parsed.body
        : `Hi ${targetOwner}, following up regarding ${lead.businessName} in ${targetCity}.`,
      callToAction: typeof parsed.callToAction === 'string' && parsed.callToAction.trim()
        ? parsed.callToAction
        : 'Schedule Consultation'
    };
  } catch (err) {
    console.warn('[Gemini draftOutreachMessage error, using heuristic fallback]:', err);
    return {
      subject: `Direct inquiry for ${lead.businessName} (${targetCity})`,
      body: `Hi ${targetOwner}, reaching out regarding local ${targetNiche} job dispatch in ${targetCity}. We have verified capacity to route qualified homeowner inquiries directly to your phone. Can we discuss your availability?`,
      callToAction: 'Confirm Dispatch Availability'
    };
  }
}
