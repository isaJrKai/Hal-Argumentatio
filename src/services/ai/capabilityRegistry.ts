import { HAL_MCP_TOOLS } from '../mcp/dispatcher';
import type { McpToolDefinition } from '../mcp/types';

export type CapabilityRisk = 'read_only' | 'draft_write' | 'bounded_execution' | 'approval_gated';
export type CapabilityStatus = 'active' | 'planned';

export interface HalCapability {
  id: string;
  name: string;
  description: string;
  category: 'workspace' | 'workflow' | 'finance' | 'marketing' | 'operating_loop' | 'web';
  risk: CapabilityRisk;
  status: CapabilityStatus;
  toolNames: string[];
  approvalRequired: boolean;
}

/**
 * Provider-neutral catalogue of HAL actions.
 *
 * Providers supply reasoning; this registry defines the actions HAL is willing
 * to expose. Tenant identity and execution callbacks remain server-owned.
 * Planned capabilities intentionally have no tool binding and are never exposed.
 */
export const HAL_CAPABILITY_REGISTRY: readonly HalCapability[] = [
  {
    id: 'workspace.context.read',
    name: 'Read business context',
    description: 'Read a bounded snapshot of the authenticated tenant workspace.',
    category: 'workspace',
    risk: 'read_only',
    status: 'active',
    toolNames: ['hal_get_operational_context'],
    approvalRequired: false
  },
  {
    id: 'workflow.tasks.manage',
    name: 'Manage work queue',
    description: 'Create and inspect tenant-owned work tasks; execution remains constrained by task policy.',
    category: 'workflow',
    risk: 'draft_write',
    status: 'active',
    toolNames: ['hal_create_work_task', 'hal_list_work_tasks', 'hal_execute_hermes_work_task'],
    approvalRequired: false
  },
  {
    id: 'finance.health.read',
    name: 'Analyze financial health',
    description: 'Calculate financial health metrics from recorded tenant data.',
    category: 'finance',
    risk: 'read_only',
    status: 'active',
    toolNames: ['hal_get_financial_health'],
    approvalRequired: false
  },
  {
    id: 'marketing.campaigns.analyze',
    name: 'Analyze campaign performance',
    description: 'Inspect recorded campaign performance and anomaly signals.',
    category: 'marketing',
    risk: 'read_only',
    status: 'active',
    toolNames: ['hal_inspect_campaign_anomalies'],
    approvalRequired: false
  },
  {
    id: 'finance.scenario.simulate',
    name: 'Simulate business scenarios',
    description: 'Run deterministic what-if simulations without changing live budgets.',
    category: 'finance',
    risk: 'bounded_execution',
    status: 'active',
    toolNames: ['hal_run_what_if_simulation'],
    approvalRequired: false
  },
  {
    id: 'operating_loop.context',
    name: 'Inspect operating loop',
    description: 'Read and attach evidence to an authenticated tenant operating loop.',
    category: 'operating_loop',
    risk: 'draft_write',
    status: 'active',
    toolNames: ['hal_get_loop_context', 'hal_attach_loop_intelligence'],
    approvalRequired: false
  },
  {
    id: 'websites.audit.connectivity',
    name: 'Check website connectivity',
    description: 'Measure public DNS resolution and pinned HTTP/TLS reachability with explicit limitations.',
    category: 'web',
    risk: 'read_only',
    status: 'active',
    toolNames: ['hal_audit_website_connectivity'],
    approvalRequired: false
  },
  {
    id: 'websites.audit.full',
    name: 'Audit a customer website',
    description: 'Run a measured website audit with explicit coverage and evidence reporting.',
    category: 'web',
    risk: 'read_only',
    status: 'planned',
    toolNames: [],
    approvalRequired: false
  },
  {
    id: 'websites.redesign',
    name: 'Design and revise a customer website',
    description: 'Review a site, generate a replacement draft, iterate on feedback, and preserve version history.',
    category: 'web',
    risk: 'draft_write',
    status: 'planned',
    toolNames: [],
    approvalRequired: false
  },
  {
    id: 'websites.publish',
    name: 'Publish an approved website',
    description: 'Publish a customer-approved website version with a durable execution receipt.',
    category: 'web',
    risk: 'approval_gated',
    status: 'planned',
    toolNames: [],
    approvalRequired: true
  }
];

const ACTIVE_TOOL_NAMES = new Set(
  HAL_CAPABILITY_REGISTRY
    .filter(capability => capability.status === 'active')
    .flatMap(capability => capability.toolNames)
);

export function getProviderCapabilityTools(
  availableTools: readonly McpToolDefinition[] = HAL_MCP_TOOLS
): McpToolDefinition[] {
  return availableTools.filter(tool => ACTIVE_TOOL_NAMES.has(tool.name));
}

export function listHalCapabilities(): HalCapability[] {
  return HAL_CAPABILITY_REGISTRY.map(capability => ({
    ...capability,
    toolNames: [...capability.toolNames]
  }));
}
