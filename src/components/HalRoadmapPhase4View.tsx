import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  AlertCircle,
  ShieldCheck, 
  Cpu, 
  Network, 
  GitMerge, 
  TrendingUp, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight, 
  DollarSign, 
  Activity, 
  Sliders, 
  Lock, 
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import {
  DualDriveConsensusResult,
  NeuralGraphNode,
  StrategyArbitrageOpportunity,
  Phase4VerificationResult,
  verifyPhase4Pillars
} from '../lib/phase4-multi-agent';

export const HalRoadmapPhase4View: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'consensus' | 'neural_graph' | 'arbitrage'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [consensusList, setConsensusList] = useState<DualDriveConsensusResult[]>([]);
  const [neuralNodes, setNeuralNodes] = useState<NeuralGraphNode[]>([]);
  const [arbitrageList, setArbitrageList] = useState<StrategyArbitrageOpportunity[]>([]);
  const [verification, setVerification] = useState<Phase4VerificationResult>(() => 
    verifyPhase4Pillars([], [], [])
  );
  const [auditBlock, setAuditBlock] = useState<any>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New Consensus State
  const [newTopic, setNewTopic] = useState('');
  const [isExecutingConsensus, setIsExecutingConsensus] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [isArbitrating, setIsArbitrating] = useState(false);

  // Fetch initial phase 4 status from API
  const fetchPhase4Status = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('hal_auth_token') || '';
      const res = await fetch('/api/roadmap/phase4/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.verification) setVerification(data.verification);
        if (data.consensusHistory) setConsensusList(data.consensusHistory);
        if (data.nodes) setNeuralNodes(data.nodes);
        if (data.arbitrageOpportunities) setArbitrageList(data.arbitrageOpportunities);
      }
    } catch (err) {
      console.warn('Using client-side verification engine:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhase4Status();
  }, []);

  // Run Dual-Drive Consensus Action
  const handleRunConsensus = async () => {
    setIsExecutingConsensus(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('hal_auth_token') || '';
      const res = await fetch('/api/roadmap/phase4/run-consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ topic: newTopic })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionNotice(data.error || 'Consensus is unavailable. No simulated result was created.');
      } else if (data.consensusResult) {
        setConsensusList(prev => [data.consensusResult, ...prev]);
        if (data.block) setAuditBlock(data.block);
        setActionNotice(`Consensus record created with ${data.consensusResult.alignmentScore ?? 'unreported'}% reported alignment.`);
        await fetchPhase4Status();
      } else {
        setActionNotice(data.error || 'No consensus result was returned.');
      }
    } catch {
      setActionNotice('Consensus request failed. No simulated result was created.');
    } finally {
      setIsExecutingConsensus(false);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  // Run Bayesian Recalibration Action
  const handleRecalibrateWeights = async () => {
    setIsRecalibrating(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('hal_auth_token') || '';
      const res = await fetch('/api/roadmap/phase4/recalibrate-weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      setActionNotice(res.ok ? 'Recalibration request completed.' : (data.error || 'Recalibration is unavailable.'));
    } catch {
      setActionNotice('Recalibration request failed. No weights were changed.');
    } finally {
      setIsRecalibrating(false);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  // Run Strategy Arbitrage Execution Action
  const handleExecuteArbitrage = async (arbId: string) => {
    setIsArbitrating(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('hal_auth_token') || '';
      const res = await fetch('/api/roadmap/phase4/execute-arbitrage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ arbitrageId: arbId })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.block) setAuditBlock(data.block);
        await fetchPhase4Status();
        setActionNotice('Arbitrage action response received. Check recorded campaign data before treating any change as complete.');
      } else {
        setActionNotice(data.error || 'Arbitrage execution was blocked.');
      }
    } catch {
      setActionNotice('Arbitrage request failed. No local execution was simulated.');
    } finally {
      setIsArbitrating(false);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  // Re-evaluate Arbitrage against live database telemetry
  const handleReevaluateArbitrage = async () => {
    setIsArbitrating(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('hal_auth_token') || '';
      const res = await fetch('/api/roadmap/phase4/arbitrage/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          maxBudgetShiftRatio: 0.30,
          minRoasHurdleRatio: 1.25,
          minCampaignLiquidityFloorUsd: 500
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionNotice(data.error || 'Arbitrage evaluation is unavailable.');
      } else if (Array.isArray(data.opportunities)) {
        setArbitrageList(data.opportunities);
        setActionNotice(`Evaluation returned ${data.opportunities.length} opportunities from stored campaign data.`);
      } else {
        setActionNotice('The evaluation response did not include opportunity records.');
      }
    } catch {
      setActionNotice('Arbitrage evaluation failed. No sample opportunities were added.');
    } finally {
      setIsArbitrating(false);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── PHASE 4 HERO BANNER ─── */}
      <div className="p-6 rounded-2xl bg-bg-raised border border-border-dim shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/30 flex items-center gap-1">
                <Bot className="w-3 h-3 text-accent" />
                PHASE 4: MULTI-AGENT INTELLIGENCE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-warning-dim text-warning border border-warning/30 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-warning" />
                RUNTIME STATUS UNVERIFIED
              </span>
            </div>
            <h2 className="text-xl font-bold font-display text-text-primary tracking-tight">
              Distributed Autonomous Optimization & Dual-Drive Consensus
            </h2>
            <p className="text-xs text-text-secondary max-w-3xl leading-relaxed">
              Designed to support multi-model consensus and campaign guardrails. Provider availability, measured model latency, and calibration history are not yet verified; no default historical records are shown.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleRunConsensus}
              disabled={true}
              className="px-3.5 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 active:scale-98 transition-all text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isExecutingConsensus ? 'animate-spin' : ''}`} />
              <span>{isExecutingConsensus ? 'Synthesizing...' : 'Run Dual-Drive Consensus'}</span>
            </button>
            <button
              onClick={handleRecalibrateWeights}
              disabled
              title="Not connected: outcome data and persisted model parameters are not configured."
              className="px-3.5 py-2 rounded-lg bg-bg-overlay text-text-tertiary border border-border-dim transition-all text-xs font-medium flex items-center gap-2 cursor-not-allowed opacity-60"
            >
              <Sliders className={`w-3.5 h-3.5 text-accent ${isRecalibrating ? 'animate-spin' : ''}`} />
              <span>Not connected</span>
            </button>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Pillar Verification Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-bg-base border border-border-dim space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-accent" />
                Parallel Consensus
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                ALIGNMENT NOT MEASURED
              </span>
            </div>
            <div className="text-sm font-bold text-text-primary">Model providers not verified</div>
            <div className="text-[11px] text-text-tertiary">Provider redundancy not verified</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-base border border-border-dim space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-accent" />
                Neural Agent Routing
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                NODES NOT VERIFIED
              </span>
            </div>
            <div className="text-sm font-bold text-text-primary">Calibration not available</div>
            <div className="text-[11px] text-text-tertiary">Calibration workflow not verified</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-base border border-border-dim space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-accent" />
                Strategy Arbitrage
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                LIFT NOT MEASURED
              </span>
            </div>
            <div className="text-sm font-bold text-text-primary">Guardrails not verified</div>
            <div className="text-[11px] text-text-tertiary">Execution not verified</div>
          </div>
        </div>
      </div>

      {/* ─── NAVIGATION TABS ─── */}
      <div className="flex border-b border-border-dim gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-b-2 border-accent text-accent'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Verification & Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('consensus')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'consensus'
              ? 'border-b-2 border-accent text-accent'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <GitMerge className="w-3.5 h-3.5" />
          <span>Dual-Drive Consensus Sandbox</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-accent/15 text-accent">
            {consensusList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('neural_graph')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'neural_graph'
              ? 'border-b-2 border-accent text-accent'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Neural Graph & Bayesian Weights</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-border-dim text-text-secondary">
            {neuralNodes.length} Nodes
          </span>
        </button>

        <button
          onClick={() => setActiveTab('arbitrage')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'arbitrage'
              ? 'border-b-2 border-accent text-accent'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Strategy & Spend Estimates</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/15 text-warning">
            {arbitrageList.length}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: OVERVIEW & PILLARS ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1 */}
            <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-accent uppercase">PILLAR 1</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-warning-dim text-warning border border-warning/30">
                  NOT VERIFIED
                </span>
              </div>
              <h3 className="text-sm font-bold text-text-primary">Dual-Drive Parallel Consensus</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Designed to request parallel model analysis. Provider connectivity, model identity, policy enforcement, and consensus quality have not been verified in this deployment.
              </p>
              <div className="p-3 rounded-lg bg-bg-base border border-border-dim text-[11px] space-y-1 font-mono">
                <div className="text-text-tertiary">Engine A: provider not verified</div>
                <div className="text-text-tertiary">Engine B: provider not verified</div>
                <div className="text-text-secondary font-semibold">Alignment: Not measured</div>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-accent uppercase">PILLAR 2</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  NOT VERIFIED
                </span>
              </div>
              <h3 className="text-sm font-bold text-text-primary">Adaptive Bayesian Weight Tuning</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Planned capability: recalibrate urgency weights from completed conversion outcomes. This is unavailable until measured outcomes and persisted model parameters are connected.
              </p>
              <div className="p-3 rounded-lg bg-bg-base border border-border-dim text-[11px] space-y-1 font-mono">
                <div className="text-text-tertiary">Calibration epoch: Not available</div>
                <div className="text-text-tertiary">Urgency weights: Not calibrated from measured outcomes</div>
                <div className="text-text-secondary font-semibold">Policy autonomy: Not verified</div>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-accent uppercase">PILLAR 3</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  NOT VERIFIED
                </span>
              </div>
              <h3 className="text-sm font-bold text-text-primary">Closed-Loop Strategy Arbitrage</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Designed to evaluate campaign performance and proposed budget shifts. This requires measured campaign data, verified guardrails, and operator approval; live automation is not verified.
              </p>
              <div className="p-3 rounded-lg bg-bg-base border border-border-dim text-[11px] space-y-1 font-mono">
                <div className="text-text-tertiary">Evaluated opportunities: None verified</div>
                <div className="text-text-tertiary">Guardrail policy: Not verified in this deployment</div>
                <div className="text-text-secondary font-semibold">Expected lift: Not estimated</div>
              </div>
            </div>
          </div>

          {/* Cryptographic Ledger Block Audit Card */}
          {auditBlock && (
            <div className="p-4 rounded-xl bg-bg-raised border border-accent/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-accent uppercase flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Cryptographic Ledger Audit Record
                </span>
                <span className="text-[10px] font-mono text-text-tertiary">
                  Block #{auditBlock.sequenceNumber ?? 'Not assigned'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-bg-base border border-border-dim font-mono text-[11px] space-y-1 overflow-x-auto">
                <div className="text-text-primary"><span className="text-text-tertiary">Event:</span> {auditBlock.eventType}</div>
                <div className="text-text-primary"><span className="text-text-tertiary">Actor:</span> {auditBlock.actor}</div>
                <div className="text-text-primary truncate"><span className="text-text-tertiary">Payload Hash:</span> {auditBlock.payloadHash}</div>
                <div className="text-text-primary truncate"><span className="text-text-tertiary">Previous Hash:</span> {auditBlock.previousHash}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: DUAL-DRIVE CONSENSUS SANDBOX ─── */}
      {activeTab === 'consensus' && (
        <div className="space-y-6">
          {/* Real-time Consensus Interactive Trigger */}
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Dual-Drive Cognitive Arbitration Sandbox
                </h3>
                <p className="text-xs text-text-secondary">
                  No live Gemini/NVIDIA inference adapters or persisted consensus store are connected. This panel is not currently able to generate a real consensus.
                </p>
              </div>
              <button
                type="button"
                disabled
                title="Unavailable: live Gemini/NVIDIA adapters and a persisted consensus store are not configured."
                className="px-4 py-2 rounded-lg bg-bg-overlay text-text-tertiary border border-border-dim transition-all text-xs font-semibold flex items-center gap-2 cursor-not-allowed opacity-60"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Unavailable · no live providers</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Enter strategy, pricing, or qualification topic..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-bg-base border border-border-dim text-xs text-text-primary focus:outline-none focus:border-accent font-mono"
              />
            </div>
          </div>

          {/* Consensus Records */}
          <div className="space-y-4">
            {consensusList.length === 0 && <div className="p-5 rounded-xl border border-border-dim text-sm text-text-secondary">No verified consensus records are stored. Live model providers are not configured; HAL will not create synthetic consensus results.</div>}
            {consensusList.map((cons) => (
              <div key={cons.id} className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-dim pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-accent font-bold uppercase tracking-wider">
                      DECISION ARBITRATION ID: {cons.id}
                    </span>
                    <h4 className="text-sm font-bold text-text-primary mt-0.5">{cons.topic}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 ${
                      cons.verdict === 'CONTRACT_VERIFIED_UNANIMOUS' || !cons.verdict
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : cons.verdict === 'BOUNDS_SATISFIED_WITH_CONDITIONS'
                        ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {cons.verdict || 'Verdict unavailable'} ({Number.isFinite(cons.alignmentScore) ? `${cons.alignmentScore}% reported alignment` : 'alignment not reported'})
                    </span>
                    <span className="px-2 py-1 rounded text-[10px] font-mono text-text-tertiary bg-bg-base border border-border-dim">
                      {new Date(cons.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Side-by-side Engines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Google Gemini 2.5 */}
                  <div className="p-4 rounded-lg bg-bg-base border border-blue-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-bold text-text-primary">{cons.geminiEngine.model}</span>
                      </div>
                      <span className="text-[10px] font-mono text-blue-500 font-semibold">
                        Latency: {cons.geminiEngine.latencyMs}ms | Conf: {Math.round(cons.geminiEngine.confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-text-tertiary">Perspective: {cons.geminiEngine.focus}</div>
                    <p className="text-xs text-text-secondary leading-relaxed bg-bg-raised/60 p-2.5 rounded border border-border-dim">
                      "{cons.geminiEngine.recommendation}"
                    </p>
                  </div>

                  {/* NVIDIA Nemotron 70B */}
                  <div className="p-4 rounded-lg bg-bg-base border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-text-primary">{cons.nemotronEngine.model}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-500 font-semibold">
                        Latency: {cons.nemotronEngine.latencyMs}ms | Conf: {Math.round(cons.nemotronEngine.confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-text-tertiary">Perspective: {cons.nemotronEngine.focus}</div>
                    <p className="text-xs text-text-secondary leading-relaxed bg-bg-raised/60 p-2.5 rounded border border-border-dim">
                      "{cons.nemotronEngine.recommendation}"
                    </p>
                  </div>
                </div>

                {/* Synthesized Directive */}
                <div className="p-3.5 rounded-lg bg-accent/10 border border-accent/25 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-accent font-bold">
                    <span className="flex items-center gap-1.5">
                      <GitMerge className="w-3.5 h-3.5" />
                      SYNTHESIZED DUAL-DRIVE DIRECTIVE
                    </span>
                    <span>Method: {cons.arbitrationMethod}</span>
                  </div>
                  <p className="text-xs text-text-primary font-medium leading-relaxed">
                    {cons.synthesizedAction}
                  </p>
                </div>

                {/* Formal Invariant Verification Proofs */}
                {cons.invariants && cons.invariants.length > 0 && (
                  <div className="p-3.5 rounded-lg bg-bg-base border border-border-dim space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                        Structured Invariant Verification Proofs (Contract Engine)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-500 font-semibold">
                        {cons.invariants.filter(inv => inv.passed).length}/{cons.invariants.length} Invariants Satisfied
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                      {cons.invariants.map((inv) => (
                        <div key={inv.ruleId} className="p-2.5 rounded bg-bg-raised/70 border border-border-dim/60 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-text-primary">{inv.ruleName}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              inv.passed ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                            }`}>
                              {inv.passed ? 'VERIFIED' : 'FAILED'}
                            </span>
                          </div>
                          <p className="text-[10px] text-text-secondary leading-normal">{inv.proof}</p>
                        </div>
                      ))}
                    </div>
                    {cons.contractVerification?.boundsIntersection && (
                      <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-border-dim/40 text-[10px] font-mono text-text-tertiary">
                        <span>ROAS Floor: <strong className="text-text-primary">{cons.contractVerification.boundsIntersection.minRoas}x</strong></span>
                        <span>Retainer SLA: <strong className="text-text-primary">${(cons.contractVerification.boundsIntersection.monthlyRetainerUsd || cons.contractVerification.boundsIntersection.pricingMonthlyUsd)?.toLocaleString()}/mo</strong></span>
                        {cons.contractVerification.boundsIntersection.monthlyAdSpendUsd && (
                          <span>Ad Spend: <strong className="text-text-primary">${cons.contractVerification.boundsIntersection.monthlyAdSpendUsd.toLocaleString()}/mo</strong></span>
                        )}
                        {cons.contractVerification.boundsIntersection.terminationNoticeDays && (
                          <span>Notice SLA: <strong className="text-text-primary">{cons.contractVerification.boundsIntersection.terminationNoticeDays} days</strong></span>
                        )}
                        <span>Parameter Overlap: <strong className="text-emerald-500">{Math.round((cons.contractVerification.boundsIntersection.overlapRatio || 0.95) * 100)}%</strong></span>
                        {cons.contractVerification.symbolicArithmeticAudit && (
                          <span className={`px-1.5 py-0.5 rounded ${cons.contractVerification.symbolicArithmeticAudit.passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            Arithmetic Invariants: {cons.contractVerification.symbolicArithmeticAudit.passed ? 'Deterministic Pass' : 'Divergence Flagged'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: NEURAL GRAPH & BAYESIAN WEIGHTS ─── */}
      {activeTab === 'neural_graph' && (
        <div className="space-y-6">
          {/* Neural Nodes Grid */}
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              <Network className="w-4 h-4 text-accent" />
              Specialized Autonomous Agent Nodes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {neuralNodes.length === 0 && <div className="p-5 rounded-xl border border-border-dim text-sm text-text-secondary md:col-span-3">Runtime node telemetry is not configured. No latency, confidence, or task counts are being reported.</div>}
              {neuralNodes.map((node) => (
                <div key={node.id} className="p-4 rounded-xl bg-bg-raised border border-border-dim space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">{node.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500">
                      {node.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {node.role}
                  </p>
                  <div className="p-2.5 rounded bg-bg-base border border-border-dim text-[10px] font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Primary Engine:</span>
                      <span className="text-text-primary font-semibold">{node.primaryEngine}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Avg Latency:</span>
                      <span className="text-text-primary">{node.avgLatencyMs} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Confidence:</span>
                      <span className="text-emerald-500 font-bold">{Math.round(node.confidenceScore * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Tasks Processed:</span>
                      <span className="text-accent font-bold">{node.tasksProcessed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calibrated Bayesian Weights Display */}
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-accent" />
                  Urgency multipliers (not calibrated)
                </h3>
                <p className="text-xs text-text-secondary">
                  Intended to use measured outcomes. No calibration dataset or verified outcome history is currently available.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-accent/15 text-accent border border-accent/30">
                MODE NOT VERIFIED
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
                <span className="text-[10px] font-mono text-text-tertiary uppercase">Missing SSL</span>
                <div className="text-lg font-bold font-mono text-text-primary">Not measured</div>
                <div className="text-[10px] text-text-secondary">Impact not measured</div>
              </div>

              <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
                <span className="text-[10px] font-mono text-text-tertiary uppercase">Mobile Speed LCP &gt; 4s</span>
                <div className="text-lg font-bold font-mono text-text-primary">Not measured</div>
                <div className="text-[10px] text-text-secondary">Impact not measured</div>
              </div>

              <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
                <span className="text-[10px] font-mono text-text-tertiary uppercase">Phone Channel Lift</span>
                <div className="text-lg font-bold font-mono text-text-primary">Not measured</div>
                <div className="text-[10px] text-text-secondary">Impact not measured</div>
              </div>

              <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
                <span className="text-[10px] font-mono text-text-tertiary uppercase">Review Deficit &lt; 4.0★</span>
                <div className="text-lg font-bold font-mono text-text-primary">Not measured</div>
                <div className="text-[10px] text-text-secondary">Impact not measured</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: STRATEGY & SPEND ARBITRAGE ─── */}
      {activeTab === 'arbitrage' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Campaign Performance Estimates (Review Only)
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  HAL derives heuristic opportunities from stored campaign and ad-performance records. These are estimates only; no provider sync or campaign-budget changes occur.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleReevaluateArbitrage}
                  disabled={isArbitrating}
                  className="px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isArbitrating ? 'animate-spin' : ''}`} />
                  <span>Re-Evaluate Telemetry</span>
                </button>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider">Modelled Monthly Lift (Estimate)</div>
                  <div className="text-base font-bold font-mono text-emerald-500">
                    +${arbitrageList.reduce((acc, item) => acc + (item.expectedNetMonthlyLiftUsd || 0), 0).toLocaleString()} / mo
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Safety Guardrails Invariant Banner */}
            <div className="p-3.5 rounded-lg bg-bg-base border border-border-dim/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold text-text-primary text-[11px]">Default 30% Shift Constraint</div>
                  <div className="text-[10px] text-text-tertiary font-mono">Max 30% source budget shift</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold text-text-primary text-[11px]">Default 1.25x ROAS Constraint</div>
                  <div className="text-[10px] text-text-tertiary font-mono">Target ROAS must exceed 1.25x source</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold text-text-primary text-[11px]">Default $500 Source Budget Constraint</div>
                  <div className="text-[10px] text-text-tertiary font-mono">Preserves source baseline ops</div>
                </div>
              </div>
            </div>
          </div>

          {/* Arbitrage Opportunities Table */}
          <div className="space-y-4">
            {arbitrageList.length === 0 && <div className="p-5 rounded-xl border border-border-dim text-sm text-text-secondary">No campaign estimates are available. Connect measured campaign performance before evaluating any budget changes.</div>}
            {arbitrageList.map((item) => (
              <div key={item.id} className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">{item.sourceChannel}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-bold text-emerald-500">{item.targetChannel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Estimated ROAS Delta: +{Math.round((item.projectedTargetRoas - item.currentSourceRoas) * 10) / 10}x
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      item.status === 'executed' ? 'bg-blue-500/15 text-blue-500' : 'bg-amber-500/15 text-amber-500'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {item.rationale}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border-dim text-[11px] font-mono">
                  <div className="flex items-center gap-4 text-text-tertiary">
                    <span>Reallocation: <strong className="text-text-primary">${item.proposedReallocationUsd.toLocaleString()}</strong></span>
                    <span>Estimated Lift: <strong className="text-text-primary">+${item.expectedNetMonthlyLiftUsd.toLocaleString()}/mo</strong></span>
                    <span>Risk Rating: <strong className="text-blue-500">{item.riskRating}</strong></span>
                    <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Heuristic guardrail calculation: {item.guardrailCompliant ? 'passed (estimate only)' : 'not passed'}
                    </span>
                  </div>

                  {item.status !== 'executed' ? (
                    <button
                      onClick={() => setActionNotice('Budget changes are disabled. These campaign outputs are estimates only and require verified ad-account sync and an approval workflow.')}
                      disabled={true}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Execution disabled · estimate only</span>
                    </button>
                  ) : (
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Reallocation Recorded on Ledger
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
