export type WorkerExecutionMode = 'human' | 'context_only' | 'partial_executor' | 'provider_only' | 'unverified';

export interface WorkerCapability {
  id: string;
  label: string;
  mode: WorkerExecutionMode;
  canClaimTasks: boolean;
  supportedTaskTypes: string[];
  description: string;
  configured?: boolean;
}

/**
 * This registry describes verified execution boundaries, not marketing labels.
 * Provider configuration is reported separately from task-executor capability.
 */
export function getWorkerCapabilities(env: NodeJS.ProcessEnv = process.env): WorkerCapability[] {
  return [
    {
      id: 'human',
      label: 'Human operator',
      mode: 'human',
      canClaimTasks: true,
      supportedTaskTypes: ['human_assigned_work'],
      description: 'A person performs the work and records its outcome.'
    },
    {
      id: 'hal_assistant',
      label: 'HAL Assistant',
      mode: 'context_only',
      canClaimTasks: false,
      supportedTaskTypes: [],
      description: 'Can read shared operational context; conversational tool execution and approval orchestration are not yet connected.'
    },
    {
      id: 'hermes',
      label: 'Hermes',
      mode: 'partial_executor',
      canClaimTasks: true,
      supportedTaskTypes: ['hermes_lab_asset'],
      description: 'Verified executor for registered Hermes Lab asset-generation tasks only; not a general-purpose worker.'
    },
    {
      id: 'gemini',
      label: 'Gemini',
      mode: 'provider_only',
      canClaimTasks: false,
      supportedTaskTypes: [],
      configured: Boolean(env.GEMINI_API_KEY),
      description: 'Reasoning/generation provider; no standalone work-task executor is registered.'
    },
    {
      id: 'nemotron',
      label: 'Nemotron',
      mode: 'provider_only',
      canClaimTasks: false,
      supportedTaskTypes: [],
      configured: Boolean(env.NVIDIA_API_KEY),
      description: 'Reasoning/critique provider; no standalone work-task executor is registered.'
    }
  ];
}
