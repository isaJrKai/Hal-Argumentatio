import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestAIProvider = 'gemini' | 'nemotron';

const requestAIProvider = new AsyncLocalStorage<RequestAIProvider>();

export function runWithAIProvider<T>(provider: RequestAIProvider, callback: () => T): T {
  return requestAIProvider.run(provider, callback);
}

export function getRequestAIProvider(): RequestAIProvider | null {
  return requestAIProvider.getStore() ?? null;
}
