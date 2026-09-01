import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Activity, 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw, 
  Cpu, 
  Layers, 
  Terminal,
  Zap
} from 'lucide-react';

interface Loop {
  id: string;
  contractorId: string;
  status: string;
  currentStage: string;
  trigger: string;
  contextData: any;
  stateSnapshot: any;
  recommendationId?: string;
  simulationId?: string;
  criticFindings?: any;
  executionReference?: string;
  verificationResult?: any;
  learningSignals?: any;
  iterationCount: number;
  createdAt: string;
  updatedAt: string;
}

interface LoopEvent {
  id: string;
  loopId: string;
  previousState?: string;
  newState: string;
  eventType: string;
  actor: string;
  metadata?: any;
  createdAt: string;
}

const STAGES = [
  'gathering',
  'analyzing',
  'planning',
  'simulating',
  'awaiting_approval',
  'approved',
  'executing',
  'verifying',
  'learning',
  'completed'
];

export default function HalLoopOperationsView({ token }: { token?: string | null }) {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [selectedLoop, setSelectedLoop] = useState<Loop | null>(null);
  const [events, setEvents] = useState<LoopEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeToken = token || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token');

  const fetchLoops = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/hal/loops', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.loops)) {
        setLoops(data.loops);
        if (data.loops.length > 0 && !selectedLoop) {
          setSelectedLoop(data.loops[0]);
          fetchLoopDetail(data.loops[0].id);
        }
      } else {
        setError(data.error || 'Failed to load business loops');
      }
    } catch (err: any) {
      setError(err.message || 'Network error loading loops');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoopDetail = async (loopId: string) => {
    try {
      const res = await fetch(`/api/hal/loops/${loopId}`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLoop(data.loop);
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch loop detail', err);
    }
  };

  useEffect(() => {
    fetchLoops();
  }, []);

  const handleInitLoop = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/hal/loops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({ trigger: 'manual_operator_init' })
      });
      const data = await res.json();
      if (data.success) {
        await fetchLoops();
        setSelectedLoop(data.loop);
        fetchLoopDetail(data.loop.id);
      } else {
        alert(data.error || 'Failed to initialize loop');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvanceLoop = async (loopId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/hal/loops/${loopId}/advance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLoop(data.loop);
        fetchLoops();
        fetchLoopDetail(loopId);
      } else {
        alert(data.error || 'Failed to advance loop');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseLoop = async (loopId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/hal/loops/${loopId}/pause`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLoop(data.loop);
        fetchLoops();
        fetchLoopDetail(loopId);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeLoop = async (loopId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/hal/loops/${loopId}/resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLoop(data.loop);
        fetchLoops();
        fetchLoopDetail(loopId);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 uppercase tracking-wide">
              Phase 7 Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">Verified Business Loop</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">HAL Operating Loop Control</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Continuous, verifiable observation-to-action feedback loops ensuring mathematically safe, gated execution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLoops}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Loops
          </button>
          <button
            onClick={handleInitLoop}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            Initialize New Loop
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loop List Sidebar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Active Loops ({loops.length})
            </h2>
          </div>

          {loops.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No operating loops found. Initialize one above to start the autonomous cycle.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {loops.map(loop => {
                const isSelected = selectedLoop?.id === loop.id;
                return (
                  <div
                    key={loop.id}
                    onClick={() => {
                      setSelectedLoop(loop);
                      fetchLoopDetail(loop.id);
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-medium text-slate-500">
                        #{loop.id.slice(0, 8)}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                        loop.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        loop.status === 'paused' ? 'bg-amber-100 text-amber-800' :
                        loop.status === 'awaiting_approval' ? 'bg-blue-100 text-blue-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {loop.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="capitalize font-medium text-slate-900">
                        Stage: {loop.currentStage.replace('_', ' ')}
                      </span>
                      <span>Iteration #{loop.iterationCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Loop Detail & Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          {selectedLoop ? (
            <>
              {/* Loop Status Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        LOOP ID: {selectedLoop.id}
                      </span>
                      <span className="text-xs text-slate-500">
                        Trigger: {selectedLoop.trigger}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1 capitalize">
                      Stage: {selectedLoop.currentStage.replace('_', ' ')}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedLoop.status === 'paused' ? (
                      <button
                        onClick={() => handleResumeLoop(selectedLoop.id)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume Loop
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePauseLoop(selectedLoop.id)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-xs"
                      >
                        <Pause className="w-3.5 h-3.5" /> Pause Loop
                      </button>
                    )}
                    <button
                      onClick={() => handleAdvanceLoop(selectedLoop.id)}
                      disabled={actionLoading || selectedLoop.status === 'completed' || selectedLoop.status === 'paused'}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50"
                    >
                      <ArrowRight className="w-3.5 h-3.5" /> Advance Stage
                    </button>
                  </div>
                </div>

                {/* Stage Pipeline Visualization */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Operating Loop Pipeline
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {STAGES.map((stage, idx) => {
                      const currentIdx = STAGES.indexOf(selectedLoop.currentStage);
                      const isPast = idx < currentIdx;
                      const isCurrent = stage === selectedLoop.currentStage;
                      return (
                        <div
                          key={stage}
                          className={`p-2.5 rounded-lg border text-center text-xs transition-all ${
                            isCurrent
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold ring-1 ring-indigo-600'
                              : isPast
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-slate-50 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            {isPast && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {isCurrent && <Activity className="w-3 h-3 text-indigo-600 animate-pulse" />}
                            <span className="capitalize">{stage.replace('_', ' ')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Critic Findings & Snapshot */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Critic Gate & Verification
                    </h4>
                    {selectedLoop.criticFindings ? (
                      <pre className="text-xs font-mono bg-white p-2.5 rounded border border-slate-200 text-slate-700 overflow-x-auto">
                        {JSON.stringify(selectedLoop.criticFindings, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        Critic gate will evaluate during simulation phase.
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-600" />
                      State Snapshot
                    </h4>
                    {selectedLoop.stateSnapshot ? (
                      <pre className="text-xs font-mono bg-white p-2.5 rounded border border-slate-200 text-slate-700 overflow-x-auto">
                        {JSON.stringify(selectedLoop.stateSnapshot, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No snapshot recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline Audit Events */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  Loop Audit Timeline & Events
                </h3>

                {events.length === 0 ? (
                  <p className="text-sm text-slate-500">No events logged for this loop yet.</p>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                    {events.map((ev, i) => (
                      <div key={ev.id || i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                        <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md shrink-0 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-900 capitalize">
                              {ev.eventType.replace('_', ' ')}: {ev.previousState ? `${ev.previousState} → ` : ''}{ev.newState}
                            </span>
                            <span className="text-slate-400">
                              {new Date(ev.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          {ev.metadata && (
                            <pre className="text-[11px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200 mt-1 overflow-x-auto">
                              {JSON.stringify(ev.metadata)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              Select a loop from the sidebar or initialize a new one to view its operational timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
