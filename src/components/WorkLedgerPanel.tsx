import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, RefreshCw, Search, Clock3, UserRound, Bot, Workflow, AlertCircle } from 'lucide-react';

type WorkEvent = {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string | null;
  actorType: string;
  actorId: string | null;
  sourceModule: string;
  correlationId: string | null;
  summary: string;
  payload: Record<string, unknown> | null;
  occurredAt: string;
};

interface WorkLedgerPanelProps {
  token: string;
}

const actorLabel = (event: WorkEvent) => {
  if (event.actorType === 'agent') return event.actorId || 'AI agent';
  if (event.actorType === 'system') return 'HAL system';
  if (event.actorType === 'integration') return event.actorId || 'Integration';
  return 'Human operator';
};

export default function WorkLedgerPanel({ token }: WorkLedgerPanelProps) {
  const [events, setEvents] = useState<WorkEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch('/api/work-ledger?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Unable to load work history (HTTP ${response.status}).`);
      }
      const data = await response.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (err: any) {
      setError(err?.message || 'Work history is unavailable.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return events;
    return events.filter(event => [
      event.eventType, event.entityType, event.entityId, event.actorType,
      event.actorId, event.sourceModule, event.summary
    ].some(value => String(value || '').toLowerCase().includes(normalized)));
  }, [events, query]);

  return (
    <div className="space-y-5 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-accent mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em]">Operational memory</span>
          </div>
          <h1 className="text-2xl font-display font-semibold text-text-primary">Work History</h1>
          <p className="text-sm text-text-secondary mt-1 max-w-2xl">A factual timeline of recorded work across HAL. Events retain their tenant, source module, actor and business-record identity.</p>
        </div>
        <button onClick={() => void loadEvents(true)} disabled={refreshing} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border-default bg-bg-raised text-text-secondary hover:text-text-primary disabled:opacity-50 text-xs font-mono">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 border border-border-default bg-bg-raised rounded-lg p-3">
        <div className="flex items-center gap-2 text-text-tertiary text-xs font-mono">
          <Workflow className="w-4 h-4" /> {events.length} recorded events
        </div>
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter events, modules, records or agents…" className="w-full pl-9 pr-3 py-2 bg-bg-base border border-border-default rounded-md text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent" />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-danger/30 bg-danger/5 text-danger text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-sm text-text-tertiary font-mono">Loading operational history…</div>
      ) : filteredEvents.length === 0 ? (
        <div className="border border-dashed border-border-default rounded-xl p-10 text-center">
          <Activity className="w-8 h-8 mx-auto text-text-tertiary mb-3" />
          <h2 className="text-sm font-semibold text-text-primary">{events.length ? 'No matching events' : 'No work has been recorded yet'}</h2>
          <p className="text-xs text-text-secondary mt-2 max-w-md mx-auto">{events.length ? 'Try a different search term.' : 'As connected HAL operations run, their verified actions will appear here. Existing historical records are not backfilled or invented.'}</p>
        </div>
      ) : (
        <div className="border border-border-default rounded-xl overflow-hidden divide-y divide-border-default">
          {filteredEvents.map(event => (
            <article key={event.id} className="p-4 flex gap-3 hover:bg-bg-subtle/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-bg-subtle border border-border-default flex items-center justify-center shrink-0">
                {event.actorType === 'agent' ? <Bot className="w-4 h-4 text-accent" /> : event.actorType === 'human' ? <UserRound className="w-4 h-4 text-text-secondary" /> : <Activity className="w-4 h-4 text-text-secondary" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-medium text-text-primary">{event.summary}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-bg-subtle border border-border-default text-text-tertiary font-mono">{event.eventType}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-text-tertiary font-mono">
                  <span>{actorLabel(event)}</span>
                  <span>{event.sourceModule}</span>
                  <span>{event.entityType}{event.entityId ? ` · ${event.entityId}` : ''}</span>
                  <span className="inline-flex items-center gap-1"><Clock3 className="w-3 h-3" />{new Date(event.occurredAt).toLocaleString()}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="text-[10px] text-text-tertiary">This timeline shows only events emitted by instrumented workflows since the ledger was introduced. It is not a complete history of all legacy activity yet.</p>
    </div>
  );
}
