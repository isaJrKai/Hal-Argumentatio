export type WorkerExecutionMode = 'human' | 'orchestrator' | 'context_only' | 'partial_executor' | 'provider_only' | 'unverified';

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
      mode: 'orchestrator',
      canClaimTasks: false,
      supportedTaskTypes: [],
      description: 'Central conversational orchestrator with tenant-authenticated MCP tool calling, shared workspace context, and approval-aware task creation. It coordinates tools but does not claim queue tasks as an independent worker.'
    },
    {
      id: 'hermes',
      label: 'Hermes',
      mode: 'partial_executor',
      canClaimTasks: true,
      supportedTaskTypes: ['hermes_lab_asset', 'hermes_agent_task'],
      description: 'Existing Hermes Studio specialist agent with shared workspace context and tenant-scoped read/analysis MCP tools for operational context, financial health, campaign anomalies and simulations. The durable queue executor supports all ten Hermes Lab asset tools and Hermes Studio analysis or explicitly requested artifact revisions. It does not publish externally or send communications.'
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
