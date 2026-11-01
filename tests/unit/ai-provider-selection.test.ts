import { afterEach, describe, expect, it } from 'vitest';
import { getActiveAI } from '../../src/services/nemotron';

const original = {
  active: process.env.HAL_ACTIVE_AI,
  gemini: process.env.GEMINI_API_KEY,
  nvidia: process.env.NVIDIA_API_KEY,
};

afterEach(() => {
  if (original.active === undefined) delete process.env.HAL_ACTIVE_AI;
  else process.env.HAL_ACTIVE_AI = original.active;

  if (original.gemini === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = original.gemini;

  if (original.nvidia === undefined) delete process.env.NVIDIA_API_KEY;
  else process.env.NVIDIA_API_KEY = original.nvidia;
});

describe('AI provider selection', () => {
  it('falls back to configured Nemotron when Gemini is selected but has no key', () => {
    process.env.HAL_ACTIVE_AI = 'gemini';
    delete process.env.GEMINI_API_KEY;
    process.env.NVIDIA_API_KEY = 'test-nvidia-key';

    expect(getActiveAI()).toBe('nemotron');
  });

  it('uses dual-drive only when both provider keys are configured', () => {
    process.env.HAL_ACTIVE_AI = 'dual';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.NVIDIA_API_KEY = 'test-nvidia-key';

    expect(getActiveAI()).toBe('dual');
  });

  it('falls back from dual-drive to the only configured provider', () => {
    process.env.HAL_ACTIVE_AI = 'dual';
    delete process.env.GEMINI_API_KEY;
    process.env.NVIDIA_API_KEY = 'test-nvidia-key';

    expect(getActiveAI()).toBe('nemotron');
  });

  it('falls back from unavailable Nemotron to configured Gemini', () => {
    process.env.HAL_ACTIVE_AI = 'nemotron';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    delete process.env.NVIDIA_API_KEY;

    expect(getActiveAI()).toBe('gemini');
  });

});
