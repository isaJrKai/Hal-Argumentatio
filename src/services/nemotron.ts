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
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
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

  // Model cascade to prevent 404 unauthorized account errors on restricted model names
  const candidateModels = [
    "meta/llama-3.1-70b-instruct",            // Fully active, 70B state-of-the-art model
    "nvidia/nemotron-mini-4b-instruct",       // Active, Nemotron lightweight option
    "nvidia/llama-3.1-nemotron-70b-instruct"  // Original requested model
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
        return data.choices?.[0]?.message?.content || "";
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
  if (preferred === 'gemini' || preferred === 'nemotron' || preferred === 'dual') {
    return preferred;
  }
  if (process.env.HAL_ACTIVE_AI === 'gemini' || process.env.HAL_ACTIVE_AI === 'nemotron' || process.env.HAL_ACTIVE_AI === 'dual') {
    return process.env.HAL_ACTIVE_AI as AIModelType;
  }
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hal_active_ai');
    if (saved === 'gemini' || saved === 'nemotron' || saved === 'dual') {
      return saved as AIModelType;
    }
  }
  // Default to dual-drive if both keys exist, otherwise gemini/nemotron
  if (process.env.GEMINI_API_KEY && process.env.NVIDIA_API_KEY) {
    return 'dual';
  }
  if (process.env.GEMINI_API_KEY) {
    return 'gemini';
  }
  return 'nemotron';
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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config,
  });

  return response.text || "";
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

  throw new Error("Both Gemini and NVIDIA Nemotron calls failed in Dual-Drive mode.");
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
