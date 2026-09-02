// JSON-RPC 2.0 Types
export interface McpJsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, any>;
}

export interface McpJsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

// Validation helper functions
export function validateFinancialHealthInput(params: any) {
  const timeframe = ['last_7_days', 'last_30_days', 'last_90_days', 'all_time'].includes(params?.timeframe)
    ? params.timeframe
    : 'last_30_days';
  return { timeframe };
}

export function validateInspectAnomaliesInput(params: any) {
  const thresholdDropPct = typeof params?.thresholdDropPct === 'number' && params.thresholdDropPct > 0
    ? params.thresholdDropPct
    : 20;
  return { thresholdDropPct };
}

export function validateRunWhatIfSimulationInput(params: any) {
  const scenarioType = ['budget_reallocation', 'cpa_target_shift', 'bid_cap_adjustment', 'conversion_rate_stress_test'].includes(params?.scenarioType)
    ? params.scenarioType
    : 'budget_reallocation';
  const parameters = {
    fromCampaign: typeof params?.parameters?.fromCampaign === 'string' ? params.parameters.fromCampaign : 'Default A',
    toCampaign: typeof params?.parameters?.toCampaign === 'string' ? params.parameters.toCampaign : 'Default B',
    shiftAmount: typeof params?.parameters?.shiftAmount === 'number' ? params.parameters.shiftAmount : 1000,
    targetCpa: typeof params?.parameters?.targetCpa === 'number' ? params.parameters.targetCpa : undefined
  };
  return { scenarioType, parameters };
}

export function validateGetLoopContextInput(params: any) {
  if (!params?.loopId || typeof params.loopId !== 'string') {
    throw new Error('Missing required string parameter: loopId');
  }
  return { loopId: params.loopId };
}

export function validateAttachLoopIntelligenceInput(params: any) {
  if (!params?.loopId || typeof params.loopId !== 'string') {
    throw new Error('Missing required string parameter: loopId');
  }
  if (!params?.evidenceSummary || typeof params.evidenceSummary !== 'string') {
    throw new Error('Missing required string parameter: evidenceSummary');
  }
  const stage = ['gathering', 'analyzing', 'planning'].includes(params?.stage) ? params.stage : 'gathering';
  const evidenceSources = Array.isArray(params?.evidenceSources) ? params.evidenceSources : [];
  const hypotheses = Array.isArray(params?.hypotheses) ? params.hypotheses : [];
  return { loopId: params.loopId, stage, evidenceSummary: params.evidenceSummary, evidenceSources, hypotheses };
}
