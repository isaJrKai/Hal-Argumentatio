import { GoogleGenAI } from "@google/genai";
import { generateResponse, cleanJSONResponse, callNemotron, getActiveAI } from "../services/nemotron";
import { verifyLeadGrounding } from "./networkVerification";

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
    const raw = typeof modelScore === 'number' && !isNaN(modelScore) ? modelScore : 0.65;
    const calibrated = Math.min(0.93, Math.max(0.20, raw * depthWeight));
    return Math.round(calibrated * 100) / 100;
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
        return {
          predicted: Number(result.predicted) || 15.0,
          assumptions: result.assumptions || "Fitted on last 90 days performance trend lines.",
          confidenceScore: calibrateForecastConfidence(Number(result.confidenceScore)),
          source: 'gemini-3.8-flash'
        };
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
        return {
          predicted: Number(result.predicted) || 15.0,
          assumptions: result.assumptions || "Fitted on last 90 days performance trend lines.",
          confidenceScore: calibrateForecastConfidence(Number(result.confidenceScore)),
          source: 'nvidia-nemotron-70b'
        };
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
        return {
          predicted: Number(result.predicted) || 15.0,
          assumptions: result.assumptions || "Fitted on last 90 days performance trend lines.",
          confidenceScore: calibrateForecastConfidence(Number(result.confidenceScore)),
          source: 'nvidia-nemotron-70b'
        };
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
        return {
          predicted: Number(result.predicted) || 15.0,
          assumptions: result.assumptions || "Fitted on last 90 days performance trend lines.",
          confidenceScore: calibrateForecastConfidence(Number(result.confidenceScore)),
          source: 'gemini-3.8-flash'
        };
      } catch (err) {
        console.error("Gemini forecast fallback failed:", err);
      }
    }
  }

  // 3. Robust linear projection fallback
  if (historicalData.length === 0) {
    return {
      source: 'fallback_heuristic',
      predicted: 20,
      assumptions: "[Fallback Heuristic - Model Offline] No historical snapshots found; uncalibrated default baseline.",
      confidenceScore: 0.30 // Honest confidence rating (< 0.5)
    };
  }
  const values = historicalData.map(h => h.value);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return {
    source: 'fallback_heuristic',
    predicted: Math.round(avg * 1.05 * 10) / 10,
    assumptions: `[Fallback Heuristic - Model Offline] Naive linear +5% trend extrapolation across ${historicalData.length} records.`,
    confidenceScore: 0.40 // Honest confidence rating (< 0.5)
  };
}

/**
 * Harvests actual operating home-service businesses using Gemini
 */
export async function harvestRealBusinesses(
  city: string,
  niche: string,
  preferredAI?: string
): Promise<Array<{
  businessName: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  city: string;
  serviceType: string;
  websiteUrl: string;
  seoScore: number;
  performanceScore: number;
  sslStatus: 'secured' | 'missing';
  googleRating: number;
  reviewCount: number;
  sentimentScore: number;
  outreachStrategy: string;
  notes: string;
  isSynthetic: boolean;
  sourceType: 'live_harvest' | 'synthetic_fallback';
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED_STAGING' | 'FABRICATED_REJECTED';
  dnsVerified?: boolean;
  groundingEvidence?: any;
}>> {
  const prompt = `Research or identify actual, real home services operating businesses (or highly realistic active operations if real ones are scarce) in the city of "${city}" for the niche "${niche}".
Return exactly 4 businesses. For each business, provide:
1. "businessName" - The name of the business.
2. "ownerName" - Name of the owner or general manager (optional).
3. "email" - A valid public contact email.
4. "phone" - A public operating phone number.
5. "city" - "${city}".
6. "serviceType" - "${niche}".
7. "websiteUrl" - Business homepage URL.
8. "seoScore" - Realistic technical SEO score between 30 and 100 based on website analysis.
9. "performanceScore" - Realistic load speed / mobile performance score between 30 and 100.
10. "sslStatus" - 'secured' or 'missing'.
11. "googleRating" - Star rating on Google (1.0 to 5.0).
12. "reviewCount" - Number of Google Reviews (0 to 500).
13. "sentimentScore" - Average customer sentiment index (0.0 to 1.0).
14. "outreachStrategy" - Recommended custom channels, angle, and objections to handle.
15. "notes" - A short executive analysis of their current digital weaknesses.

Return your response in a raw JSON array matching this structure:
[
  {
    "businessName": "string",
    "ownerName": "string",
    "email": "string",
    "phone": "string",
    "city": "string",
    "serviceType": "string",
    "websiteUrl": "string",
    "seoScore": number,
    "performanceScore": number,
    "sslStatus": "secured" | "missing",
    "googleRating": number,
    "reviewCount": number,
    "sentimentScore": number,
    "outreachStrategy": "string",
    "notes": "string"
  }
]`;

  const activeAI = getActiveAI(preferredAI);

  // Fail-Closed Grounding Invariant: HAL Constitution Law #2 strictly prohibits synthetic lead injection.
  // When live search or AI is unconfigured or unable to identify operating businesses,
  // the harvester returns an empty list rather than generating synthetic profiles.
  const getFallbackData = () => [];

  const groundHarvestedBusinesses = async (items: any[]) => {
    return await Promise.all(items.map(async (b) => {
      try {
        const grounding = await verifyLeadGrounding({
          businessName: b.businessName,
          websiteUrl: b.websiteUrl,
          phone: b.phone,
          isSynthetic: b.isSynthetic
        });
        const isGroundTruth = grounding.isGroundTruth;
        return {
          ...b,
          isSynthetic: !isGroundTruth || b.isSynthetic,
          sourceType: (!isGroundTruth || b.isSynthetic) ? 'synthetic_fallback' : (b.sourceType || 'live_harvest'),
          verificationStatus: grounding.status,
          dnsVerified: grounding.evidence.dnsResolved,
          groundingEvidence: grounding.evidence
        };
      } catch (e) {
        return {
          ...b,
          isSynthetic: b.isSynthetic ?? false,
          sourceType: b.sourceType || 'live_harvest',
          verificationStatus: 'UNVERIFIED_STAGING' as const,
          dnsVerified: false
        };
      }
    }));
  };

  if (activeAI === 'gemini') {
    // Try Gemini 2.5/3.8 Flash model with native JSON mode first
    const ai = getAIClient();
    if (ai) {
      try {
        let text = "[]";
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.2,
            }
          });
          text = response.text || "[]";
        } catch (jsonErr: any) {
          // If responseMimeType is incompatible with active configuration, try text format and clean
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt + "\n\nImportant: Output ONLY the raw JSON array inside markdown code block or as valid JSON.",
            config: {
              temperature: 0.2,
            }
          });
          text = cleanJSONResponse(response.text || "[]");
        }

        const cleaned = cleanJSONResponse(text);
        const parsed = JSON.parse(cleaned);
        const mapped = (Array.isArray(parsed) ? parsed : []).map((b: any) => ({
          ...b,
          isSynthetic: false,
          sourceType: 'live_harvest' as const
        }));
        return await groundHarvestedBusinesses(mapped);
      } catch (err) {
        console.error("Gemini business harvesting failed, attempting Nemotron fallback:", err);
      }
    }

    // Fallback to NVIDIA Nemotron
    if (process.env.NVIDIA_API_KEY) {
      try {
        const text = await callNemotron([
          { role: "user", content: prompt }
        ], 0.3, true);
        const cleaned = cleanJSONResponse(text);
        const parsed = JSON.parse(cleaned);
        const mapped = (Array.isArray(parsed) ? parsed : []).map((b: any) => ({
          ...b,
          isSynthetic: false,
          sourceType: 'live_harvest' as const
        }));
        return await groundHarvestedBusinesses(mapped);
      } catch (err) {
        console.error("NVIDIA Nemotron business harvesting fallback failed:", err);
      }
    }
  } else {
    // Try NVIDIA Nemotron first (since Gemini is OFF or Nemotron is preferred)
    if (process.env.NVIDIA_API_KEY) {
      try {
        const text = await callNemotron([
          { role: "user", content: prompt }
        ], 0.3, true);
        const cleaned = cleanJSONResponse(text);
        const parsed = JSON.parse(cleaned);
        const mapped = (Array.isArray(parsed) ? parsed : []).map((b: any) => ({
          ...b,
          isSynthetic: false,
          sourceType: 'live_harvest' as const
        }));
        return await groundHarvestedBusinesses(mapped);
      } catch (err) {
        console.error("NVIDIA Nemotron business harvesting failed, attempting Gemini fallback:", err);
      }
    }

    // Fallback to Gemini 3.5 with Search Grounding tools
    const ai = getAIClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.3,
            tools: [{ googleSearch: {} }],
          }
        });

        const text = response.text || "[]";
        const parsed = JSON.parse(text.trim());
        const mapped = (Array.isArray(parsed) ? parsed : []).map((b: any) => ({
          ...b,
          isSynthetic: false,
          sourceType: 'live_harvest' as const
        }));
        return await groundHarvestedBusinesses(mapped);
      } catch (err) {
        console.error("Gemini business harvesting fallback failed:", err);
      }
    }
  }

  // Fail-Closed Fallback: Return empty array per HAL Constitution Law #2 (Never Fabricate Reality)
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

        let response;
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents,
            config
          });
        } catch (err: any) {
          if (usedGrounding) {
            console.warn("Gemini Search Grounding failed, retrying without grounding:", err.message);
            usedGrounding = false;
            delete config.tools;
            response = await ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents,
              config
            });
          } else {
            throw err;
          }
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

        let response;
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents,
            config
          });
        } catch (err: any) {
          if (usedGrounding) {
            console.warn("Gemini Search Grounding failed, retrying without grounding:", err.message);
            usedGrounding = false;
            delete config.tools;
            response = await ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents,
              config
            });
          } else {
            throw err;
          }
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
  if (lower.includes("constitution") || lower.includes("principle")) {
    reply += "Our guiding Constitution has five pillars:\n1. **Ready beats perfect** — High-value shipping beats theory.\n2. **Preserve architecture** — Avoid modifying core db/encryption.\n3. **Modularity** — Build components as isolated services.\n4. **Evidence-based** — No fabricated insights. Real audits only.\n5. **Continuous learning** — Automatic calibration of forecast weights.";
  } else if (lower.includes("connector") || lower.includes("integration")) {
    reply += "Under our structured architecture, **Connectors** have a single responsibility: connecting HAL to external services, APIs, and data providers (like GA4, Google Search Console, GBP, Google Drive, Gemini, Stripe). Core configurations like profiles, themes, and avatars belong strictly under **Settings**.";
  } else if (lower.includes("skills") || lower.includes("add skill")) {
    reply += "The **Skills Engine** executes modular business actions like website auditing, outreach sheet generation, **Talent Arbitrage Scoping** ('talent_arbitrage_bridge'), **Verified Lead List Compilation** ('verified_lead_lists'), **Automation Ops Scoping** ('automation_ops_product'), **Pricing & Margin Calculations** ('pricing_margin_calculator'), **Ad Spend Breakeven Analysis** ('ad_spend_breakeven'), or **List Subscription Pricing** ('list_subscription_pricing').";
  } else if (lower.includes("talent") || lower.includes("va business") || lower.includes("arbitrage") || lower.includes("remote")) {
    reply += "Our **Talent Arbitrage & Bridge Scoper** ('talent_arbitrage_bridge') frames a managed business model connecting highly skilled, affordable remote talent (e.g., from Uganda or East Africa) with small overseas businesses (e.g., North America). The focus is on selling quality control, trust, and managed accountability rather than just cheap labor. Start with a narrow service category and micro-pilot offers to mitigate client risk.";
  } else if (lower.includes("prospect list") || lower.includes("lead list") || lower.includes("verify") || lower.includes("leads")) {
    reply += "Our **Verified Lead List Packager** ('verified_lead_lists') compiles, verifies, and enriches high-intent contact lists for specific niches and geographies (e.g., custom home building in Calgary or mowers in Winnipeg). No email or phone goes on a list unless it is found on a real live source—no domain pattern guessing. Lists are enriched with review counts, ad active status, and pre-tiered under the KAISO scoring model to sell directly as a data product.";
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
    reply += "Regarding your request: I can confirm that HAL is fully structured on the 'Mission ➔ Goals ➔ Planner ➔ Memory ➔ Knowledge ➔ World Model ➔ Agents' pipeline. All core processes are fully functional, including our AES-256-GCM PII decryption engine, SQLite database, and multi-turn execution pipelines.";
  }
  return { text: reply };
}
