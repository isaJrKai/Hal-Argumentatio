import { describe, expect, it } from 'vitest';
import { getWorkerCapabilities } from '../../src/lib/workerCapabilities';

describe('HAL worker capability registry', () => {
  it('distinguishes model providers from task executors', () => {
    const workers = getWorkerCapabilities({ GEMINI_API_KEY: 'configured', NVIDIA_API_KEY: 'configured' } as NodeJS.ProcessEnv);
    expect(workers.find(worker => worker.id === 'gemini')).toMatchObject({ mode: 'provider_only', canClaimTasks: false, configured: true });
    expect(workers.find(worker => worker.id === 'nemotron')).toMatchObject({ mode: 'provider_only', canClaimTasks: false, configured: true });
  });

  it('limits Hermes to its verified registered task type', () => {
    const hermes = getWorkerCapabilities({} as NodeJS.ProcessEnv).find(worker => worker.id === 'hermes');
    expect(hermes).toMatchObject({ mode: 'partial_executor', canClaimTasks: true, supportedTaskTypes: ['hermes_lab_asset'] });
  });

  it('does not pretend AMIS or HAL Assistant can execute queued work', () => {
    const workers = getWorkerCapabilities({} as NodeJS.ProcessEnv);
    expect(workers.find(worker => worker.id === 'amis')).toMatchObject({ mode: 'unverified', canClaimTasks: false });
    expect(workers.find(worker => worker.id === 'hal_assistant')).toMatchObject({ mode: 'context_only', canClaimTasks: false });
  });
});
