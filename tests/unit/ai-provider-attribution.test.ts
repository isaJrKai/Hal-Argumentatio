import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const nemotronSource = readFileSync('src/services/nemotron.ts', 'utf8');
const geminiSource = readFileSync('src/lib/gemini.ts', 'utf8');

describe('AI provider identity and attribution', () => {
  it('uses NVIDIA Nemotron model IDs only and avoids retired or unrelated model families', () => {
    expect(nemotronSource).not.toContain('openai/gpt-oss-20b');
    expect(nemotronSource).not.toContain('meta/llama-3.2-11b-vision-instruct');
    expect(nemotronSource).toContain('nvidia/nemotron-3.5-lightning-30b-a3b');
    expect(nemotronSource).toContain('nvidia/nemotron-3-nano-30b-a3b');
    expect(nemotronSource).not.toContain('nvidia/nemotron-3-nano-omni-30b-a3b-reasoning');
  });

  it('labels Nemotron results as Nemotron and does not claim an incorrect 70B model', () => {
    expect(geminiSource).toContain("source: 'nvidia-nemotron'");
    expect(geminiSource).not.toContain('nvidia-nemotron-70b');
  });

  it('uses current Gemini 3.8 wording for the configured Gemini 3.8 Flash model', () => {
    expect(geminiSource).toContain('Gemini 3.8 Flash');
    expect(geminiSource).not.toContain('Strictly 3.5');
  });
});
