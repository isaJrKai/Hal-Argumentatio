export type HermesToolOutcome = 'succeeded' | 'unavailable' | 'failed';

/**
 * Classifies the business outcome returned by an MCP tool.
 *
 * A tool call that returns normally is not necessarily a successful business
 * operation: some registered tools intentionally return status=unavailable or
 * executionEnabled=false when the required model/data capability is absent.
 */
export function classifyHermesToolResult(result: unknown): HermesToolOutcome {
  if (result === null || result === undefined || typeof result !== 'object' || Array.isArray(result)) {
    return 'failed';
  }

  const value = result as Record<string, unknown>;
  if (value.success === false || value.isError === true || value.status === 'failed' || value.status === 'error') {
    return 'failed';
  }

  if (
    value.status === 'unavailable' ||
    value.executionEnabled === false ||
    value.available === false ||
    value.requiresApproval === true
  ) {
    return 'unavailable';
  }

  return 'succeeded';
}


/**
 * Stable tenant-local message identifier for a Hermes work-task attempt.
 * Retries reuse the same user/assistant message identity instead of duplicating
 * persisted conversation records when a task receipt write is interrupted.
 */
export function createHermesTaskMessageId(workTaskId: string, role: 'user' | 'assistant'): string {
  const digest = crypto.createHash('sha256').update(workTaskId).digest('hex');
  return `hermes-task-${digest}-${role}`;
}
