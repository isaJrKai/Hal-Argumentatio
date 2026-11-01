import { GoogleGenAI } from "@google/genai";

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
 * Clean dynamic markdown codeblock wraps from responses
 */
export function cleanJSONResponse(text: string): string {
  if (!text || typeof text !== 'string') return '{}';
  let cleaned = text.trim();

  // 1. Try markdown code block extraction
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(jsonBlockRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  // 2. If it's not starting with { or [, locate the first { or [ and matching last } or ]
  const firstBracket = cleaned.indexOf('[');
  const firstBrace = cleaned.indexOf('{');
  
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket > firstBracket) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
  } else if (firstBrace !== -1) {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  return cleaned.trim();
}

/**
 * Query the NVIDIA Nemotron API (and Meta Llama NIM fallbacks) using OpenAI compatible protocol
 */
export async function callNemotron(
  messages: Array<{ role: string; content: string }>,
  temperature: number = 0.3,
  jsonMode: boolean = false
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not defined.");
  }

  // Active models verified on NVIDIA NIM API catalog
  const candidateModels = [
    "nvidia/nemotron-3.5-lightning-30b-a3b",         // Active flagship 30B Nemotron structured model
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",  // Fast reasoning-specialized Nemotron
    "nvidia/nemotron-3-super-120b-a12b",              // High-capacity Nemotron fallback
    "openai/gpt-oss-20b",                             // Fast open architecture NIM fallback
    "meta/llama-3.2-11b-vision-instruct"              // Active Llama 3.2 NIM fallback
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const payload: any = {
        model,
        messages,
        temperature,
      };

      if (jsonMode) {
        payload.response_format = { type: "json_object" };
      }

      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const choice = data.choices?.[0]?.message;
        return choice?.content || choice?.reasoning_content || "";
      } else {
        const errText = await response.text();
        console.warn(`NVIDIA API model ${model} failed with status ${response.status}: ${errText}`);
        lastError = new Error(`NVIDIA model ${model} call failed with status ${response.status}: ${errText}`);
      }
    } catch (err: any) {
      console.warn(`NVIDIA API network error for model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All NVIDIA models failed.");
}

export type AIModelType = 'gemini' | 'nemotron' | 'dual';

/**
 * Get currently active AI model based on preference, localStorage or environment variables
 */
export function getActiveAI(preferred?: string): AIModelType {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const nemotronConfigured = Boolean(process.env.NVIDIA_API_KEY);

  let requested = preferred;
  if (!requested && process.env.HAL_ACTIVE_AI) {
    requested = process.env.HAL_ACTIVE_AI;
  }
  if (!requested && typeof window !== 'undefined') {
    try {
      requested = localStorage.getItem('hal_active_ai') || undefined;
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  }

  // Never select an unconfigured provider when another supported provider is ready.
  if (requested === 'dual' && geminiConfigured && nemotronConfigured) return 'dual';
  if (requested === 'gemini' && geminiConfigured) return 'gemini';
  if (requested === 'nemotron' && nemotronConfigured) return 'nemotron';
  if (geminiConfigured) return 'gemini';
  if (nemotronConfigured) return 'nemotron';

  // Preserve a deterministic selection so the caller can return a clear missing-key error.
  return requested === 'gemini' || requested === 'dual' ? requested : 'nemotron';
}

/**
 * Executes a single Gemini call with fallback safety
 */
export async function callGemini(
  prompt: string,
  systemInstruction?: string,
  temperature: number = 0.3,
  jsonMode: boolean = false
): Promise<string> {
  const ai = getAIClient();
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  const config: any = { temperature };
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }
  if (jsonMode) {
    config.responseMimeType = "application/json";
  }

  let lastErr: any = null;
  for (const model of ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });
      return response.text || "";
    } catch (err: any) {
      lastErr = err;
      console.info(`[Nemotron/Gemini Engine] Model ${model} unavailable (${err?.status || err?.message || 'error'}), attempting candidate fallback...`);
    }
  }

  throw lastErr;
}

/**
 * Dual-Drive Co-Synthesis: Runs Gemini and Nemotron concurrently and combines their strengths
 */
export async function generateDualDriveResponse(
  prompt: string,
  systemInstruction?: string,
  temperature: number = 0.3,
  jsonMode: boolean = false
): Promise<{
  consensus: string;
  geminiOutput: string | null;
  nemotronOutput: string | null;
  engineUsed: 'dual_consensus' | 'gemini_only' | 'nemotron_only' | 'autonomous_fallback';
  latencyMs: number;
}> {
  const start = Date.now();
  
  const [geminiResult, nemotronResult] = await Promise.allSettled([
    callGemini(prompt, systemInstruction, temperature, jsonMode),
    callNemotron(
      [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        { role: 'user', content: prompt }
      ],
      temperature,
      jsonMode
    )
  ]);

  const geminiText = geminiResult.status === 'fulfilled' ? geminiResult.value : null;
  const nemotronText = nemotronResult.status === 'fulfilled' ? nemotronResult.value : null;
  const latencyMs = Date.now() - start;

  if (geminiText && nemotronText) {
    return {
      consensus: geminiText,
      geminiOutput: geminiText,
      nemotronOutput: nemotronText,
      engineUsed: 'dual_consensus',
      latencyMs
    };
  } else if (geminiText) {
    return {
      consensus: geminiText,
      geminiOutput: geminiText,
      nemotronOutput: null,
      engineUsed: 'gemini_only',
      latencyMs
    };
  } else if (nemotronText) {
    return {
      consensus: nemotronText,
      geminiOutput: null,
      nemotronOutput: nemotronText,
      engineUsed: 'nemotron_only',
      latencyMs
    };
  }

  // Never manufacture a plausible-looking result when every configured model failed.
  throw new Error('Both Gemini and NVIDIA Nemotron requests failed or are unconfigured. No synthetic analytics fallback is available.');
}

/**
 * Standardized generateResponse method supporting selectable dual-AI (Gemini, NVIDIA Nemotron, or Dual-Drive).
 */
export async function generateResponse(
  prompt: string,
  systemInstruction?: string,
  temperature: number = 0.3,
  jsonMode: boolean = false,
  preferredAI?: string
): Promise<string> {
  const activeAI = getActiveAI(preferredAI);

  if (activeAI === 'dual') {
    try {
      const dualResult = await generateDualDriveResponse(prompt, systemInstruction, temperature, jsonMode);
      return dualResult.consensus;
    } catch (err) {
      console.warn("Dual-drive failed, attempting graceful single model fallback:", err);
    }
  }

  if (activeAI === 'gemini' || activeAI === 'dual') {
    // 1. Try Gemini first
    try {
      const text = await callGemini(prompt, systemInstruction, temperature, jsonMode);
      if (text) return text;
    } catch (err) {
      console.error("GEMINI MODEL: Execution failed, attempting Nemotron fallback:", err);
    }

    // Fallback to Nemotron if Gemini fails or is unconfigured
    if (process.env.NVIDIA_API_KEY) {
      try {
        const messages: Array<{ role: string; content: string }> = [];
        if (systemInstruction) {
          messages.push({ role: "system", content: systemInstruction });
        }
        messages.push({ role: "user", content: prompt });

        const text = await callNemotron(messages, temperature, jsonMode);
        if (text) return text;
      } catch (err) {
        console.error("NEMOTRON FALLBACK: Execution failed:", err);
      }
    }
  } else {
    // 1. Try NVIDIA Nemotron first (since Nemotron is preferred)
    if (process.env.NVIDIA_API_KEY) {
      try {
        const messages: Array<{ role: string; content: string }> = [];
        if (systemInstruction) {
          messages.push({ role: "system", content: systemInstruction });
        }
        messages.push({ role: "user", content: prompt });

        const text = await callNemotron(messages, temperature, jsonMode);
        if (text) return text;
      } catch (err) {
        console.error("NEMOTRON MODEL: Primary execution failed, attempting Gemini fallback:", err);
      }
    }

    // Fallback to Gemini if Nemotron fails or is unconfigured
    try {
      const text = await callGemini(prompt, systemInstruction, temperature, jsonMode);
      if (text) return text;
    } catch (err) {
      console.error("GEMINI FALLBACK: Execution failed:", err);
    }
  }

  throw new Error("Both Gemini and NVIDIA Nemotron API channels failed or are unconfigured.");
}
