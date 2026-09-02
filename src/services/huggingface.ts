/**
 * Hugging Face Inference Client for Nous Research Hermes Models
 */

const HERMES_MODELS = [
  "NousResearch/Hermes-3-Llama-3.1-8B",
  "NousResearch/Hermes-2-Pro-Llama-3-8B",
  "NousResearch/Nous-Hermes-2-Mistral-7B-DPO",
  "meta-llama/Llama-3.1-8B-Instruct"
];

export async function callHuggingFaceHermes(
  messages: Array<{ role: string; content: string }>,
  temperature: number = 0.3,
  jsonMode: boolean = false
): Promise<string> {
  const token = (process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || '').trim();
  if (!token) {
    throw new Error("HUGGINGFACE_API_KEY or HF_TOKEN is not defined.");
  }

  let lastError: any = null;

  for (const model of HERMES_MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      // 1. Try modern Hugging Face Router endpoint
      const routerUrl = `https://router.huggingface.co/hf-inference/models/${model}/v1/chat/completions`;
      const response = await fetch(routerUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 3500,
          response_format: jsonMode ? { type: "json_object" } : undefined
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }

      // 2. Fallback to standard HF Inference pipeline
      const standardUrl = `https://api-inference.huggingface.co/models/${model}`;
      const prompt = messages.map(m => `<|im_start|>${m.role}\n${m.content}<|im_end|>`).join('\n') + '\n<|im_start|>assistant\n';
      
      const stdController = new AbortController();
      const stdTimeout = setTimeout(() => stdController.abort(), 35000);

      const standardResp = await fetch(standardUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 3500,
            temperature: Math.max(0.1, temperature),
            return_full_text: false
          }
        }),
        signal: stdController.signal
      });

      clearTimeout(stdTimeout);

      if (standardResp.ok) {
        const stdData = await standardResp.json();
        if (Array.isArray(stdData) && stdData[0]?.generated_text) {
          return stdData[0].generated_text;
        }
      }

      const errText = await response.text().catch(() => "");
      lastError = new Error(`HF model ${model} returned ${response.status}: ${errText}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("All Hugging Face Hermes models failed.");
}

