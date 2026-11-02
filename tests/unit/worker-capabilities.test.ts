import { describe, expect, it } from 'vitest';
import { getWorkerCapabilities } from '../../src/lib/workerCapabilities';

describe('HAL worker capability registry', () => {
  it('distinguishes model providers from task executors', () => {
    const workers = getWorkerCapabilities({ GEMINI_API_KEY: 'configured', NVIDIA_API_KEY: 'configured' } as NodeJS.ProcessEnv);
    expect(workers.find(worker => worker.id === 'gemini')).toMatchObject({ mode: 'provider_only', canClaimTasks: false, configured: true });
    expect(workers.find(worker => worker.id === 'nemotron')).toMatchObject({ mode: 'provider_only', canClaimTasks: false, configured: true });
  });

  it('limits Hermes to its two verified registered task types', () => {
    const hermes = getWorkerCapabilities({} as NodeJS.ProcessEnv).find(worker => worker.id === 'hermes');
    expect(hermes).toMatchObject({ mode: 'partial_executor', canClaimTasks: true, supportedTaskTypes: ['hermes_lab_asset', 'hermes_agent_task'] });
  });

  it('reports HAL Assistant as an orchestrator, not a queue worker', () => {
    const workers = getWorkerCapabilities({} as NodeJS.ProcessEnv);
    expect(workers.find(worker => worker.id === 'hal_assistant')).toMatchObject({ mode: 'orchestrator', canClaimTasks: false });
  });
});
