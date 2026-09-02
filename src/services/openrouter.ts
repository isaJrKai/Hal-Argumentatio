/**
 * OpenRouter Client for Nous Research Hermes 3 & Open-Weight Models
 */

const OPENROUTER_HERMES_MODELS = [
  "nousresearch/hermes-3-llama-3.1-70b",
  "nousresearch/hermes-3-llama-3.1-405b",
  "nousresearch/hermes-4-70b",
  "nousresearch/hermes-2-pro-llama-3-8b",
  "meta-llama/llama-3.3-70b-instruct:free"
];

export async function callOpenRouterHermes(
  messages: Array<{ role: string; content: string }>,
  temperature: number = 0.3,
  jsonMode: boolean = false
): Promise<string> {
  const apiKey = (process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || '').trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not defined in environment.");
  }

  let lastError: any = null;

  for (const model of OPENROUTER_HERMES_MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const requestBody: any = {
        model,
        messages,
        temperature,
        max_tokens: 4096
      };

      if (jsonMode) {
        requestBody.response_format = { type: "json_object" };
      }

      let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.APP_URL || "https://hal.ai",
          "X-Title": "HAL Hermes Intelligence Lab",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // If json_object mode was rejected by the specific provider with a 400, retry without response_format
      if (!response.ok && jsonMode && response.status === 400) {
        const retryController = new AbortController();
        const retryTimeout = setTimeout(() => retryController.abort(), 45000);
        
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": process.env.APP_URL || "https://hal.ai",
            "X-Title": "HAL Hermes Intelligence Lab",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: 4096
          }),
          signal: retryController.signal
        });
        clearTimeout(retryTimeout);
      }

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      }

      const errText = await response.text().catch(() => "");
      lastError = new Error(`OpenRouter model ${model} failed (${response.status}): ${errText}`);
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error("All OpenRouter Hermes models failed.");
}

