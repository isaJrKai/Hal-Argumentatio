import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  Send,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Play,
  ShieldCheck,
  ChevronRight,
  Hash,
  AlertCircle,
  Copy,
  Check,
  Layers,
  ArrowRight,
  Sparkles,
  Terminal,
  Activity,
  Sliders,
  CheckCheck,
  Mail,
  Phone,
  Globe,
  Radio,
  Server,
  ExternalLink,
  CheckSquare
} from 'lucide-react';
import {
  CadenceSequence,
  SequenceStep,
  ScheduledTriggerRule,
  Phase3VerificationReport,
  calculateCadenceSchedule,
  substituteTemplateTokens,
  calculateExponentialBackoff,
  signWebhookPayload,
} from '../lib/phase3-automation';

interface Phase3StatusResponse {
  success: boolean;
  phase: string;
  currentRoadmapPhase: number;
  phase3Verified: boolean;
  verification: Phase3VerificationReport;
  sequences: CadenceSequence[];
  sequenceTemplates: CadenceSequence[];
  outboxRecords: any[];
  schedulerRules: ScheduledTriggerRule[];
  schedulerTemplates: ScheduledTriggerRule[];
  schedulerJobs: any[];
  recentAutomationEvents: any[];
  integrity: {
    valid: boolean;
    totalEntries: number;
    latestHash: string;
  };
}

export const HalRoadmapPhase3View: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<Phase3StatusResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sequencer' | 'outbox' | 'bridge' | 'scheduler'>('bridge');

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  // Sequencer Simulation State
  const [selectedSequenceId, setSelectedSequenceId] = useState<string>('');
  const [targetBusinessName, setTargetBusinessName] = useState('');
  const [targetOwnerName, setTargetOwnerName] = useState('');
  const [targetCity, setTargetCity] = useState('');
  const [targetNiche, setTargetNiche] = useState('');
  const [isTriggeringSequence, setIsTriggeringSequence] = useState(false);
  const [sequenceTriggerResult, setSequenceTriggerResult] = useState<any | null>(null);

  // Outbox Processing State
  const [isProcessingOutbox, setIsProcessingOutbox] = useState(false);
  const [outboxProcessResult, setOutboxProcessResult] = useState<any | null>(null);
  const [testBackoffAttempt, setTestBackoffAttempt] = useState<number>(3);
  const [testWebhookSecret, setTestWebhookSecret] = useState('');
  const [copiedSignature, setCopiedSignature] = useState(false);

  // Provider Configuration & Delivery Status State
  const [outboxQueueData, setOutboxQueueData] = useState<any | null>(null);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isDispatchingLive, setIsDispatchingLive] = useState(false);
  const [liveDispatchResult, setLiveDispatchResult] = useState<any | null>(null);
  const [liveDispatchError, setLiveDispatchError] = useState<string | null>(null);
  const [liveChannel, setLiveChannel] = useState<'email' | 'sms' | 'webhook'>('email');
  const [liveRecipient, setLiveRecipient] = useState('');
  const [liveSubject, setLiveSubject] = useState('');
  const [liveMessage, setLiveMessage] = useState('');
  const [liveBusinessName, setLiveBusinessName] = useState('');
  const [liveTemplateType, setLiveTemplateType] = useState('');
  const [livePriority, setLivePriority] = useState<'standard' | 'high'>('standard');

  // Scheduler State
  const [isRunningScheduler, setIsRunningScheduler] = useState(false);
  const [schedulerRunResult, setSchedulerRunResult] = useState<any | null>(null);

  const fetchOutboxQueue = async () => {
    try {
      setIsLoadingQueue(true);
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token');
      const res = await fetch('/api/roadmap/phase3/outbox-queue', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOutboxQueueData(data);
      }
    } catch (err) {
      console.error('Failed to load Outbox Queue:', err);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const handleLiveDispatch = async () => {
    try {
      setIsDispatchingLive(true);
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token');
      const res = await fetch('/api/roadmap/phase3/live-dispatch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: liveChannel,
          recipient: liveRecipient,
          subject: liveSubject,
          message: liveMessage,
          leadBusinessName: liveBusinessName,
          templateType: liveTemplateType,
          priority: livePriority
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLiveDispatchError(data.error || 'Live delivery is disabled; no message was sent.');
        setLiveDispatchResult(null);
        return;
      }
      setLiveDispatchError(null);
      setLiveDispatchResult(data);
      await fetchOutboxQueue();
      await fetchPhase3Status();
    } catch (err: any) {
      setLiveDispatchError(err.message || 'Live delivery could not be checked.');
      console.error('Delivery availability failed:', err);
    } finally {
      setIsDispatchingLive(false);
    }
  };

  const applyLiveTemplate = (type: string, biz: string = liveBusinessName) => {
    setLiveTemplateType(type);
    const business = biz.trim() || 'your business';
    if (type === 'speed_audit') {
      setLiveSubject('Request to review the digital presence of ' + business);
      setLiveMessage('Hello,\\n\\nI have not completed a verified technical assessment of ' + business + ', so I do not want to claim a specific issue or lost revenue. If useful, I can review publicly available information and share only findings with sources and timestamps.\\n\\nWould you be open to a brief, no-obligation review?');
    } else if (type === 'proposal') {
      setLiveSubject('Proposed scope for ' + business);
      setLiveMessage('Hello,\\n\\nIf you are interested, I can outline a proposed scope, costs, and measurable outcomes for ' + business + '. No performance or revenue guarantee is implied; claims will be tied to agreed measurements.\\n\\nWould you like to review a short proposal?');
    } else if (type === 'followup') {
      setLiveSubject('Following up on your interest');
      setLiveMessage('Hello,\\n\\nI am following up to see whether you would like to discuss a digital presence review. If this is not relevant, let me know and I will not continue contacting you.');
    }
  };
  const fetchPhase3Status = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token');
      const res = await fetch('/api/roadmap/phase3/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (err) {
      console.error('Failed to load Phase 3 status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhase3Status();
    fetchOutboxQueue();
  }, []);

  const handleVerifyPhase3 = async () => {
    try {
      setIsVerifying(true);
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token');
      const res = await fetch('/api/roadmap/phase3/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data);
        await fetchPhase3Status();
      }
    } catch (err) {
      console.error('Phase 3 verification failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTriggerSequence = async () => {
    try {
      setIsTriggeringSequence(true);
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token');
      const res = await fetch('/api/roadmap/phase3/trigger-sequence', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sequenceId: selectedSequenceId,
          businessName: targetBusinessName,
          ownerName: targetOwnerName,
          city: targetCity,
          niche: targetNiche
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSequenceTriggerResult(data);
        await fetchPhase3Status();
      }
    } catch (err) {
      console.error('Sequence trigger failed:', err);
    } finally {
      setIsTriggeringSequence(false);
    }
  };

  const handleProcessOutbox = async () => {
    try {
      setIsProcessingOutbox(true);
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token');
      const res = await fetch('/api/roadmap/phase3/process-outbox', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOutboxProcessResult(data);
        await fetchPhase3Status();
      }
    } catch (err) {
      console.error('Outbox process failed:', err);
    } finally {
      setIsProcessingOutbox(false);
    }
  };

  const handleRunScheduler = async () => {
    try {
      setIsRunningScheduler(true);
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token');
      const res = await fetch('/api/roadmap/phase3/run-scheduler', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSchedulerRunResult(data);
        await fetchPhase3Status();
      }
    } catch (err) {
      console.error('Scheduler run failed:', err);
    } finally {
      setIsRunningScheduler(false);
    }
  };

  const savedSequences = statusData?.sequences ?? [];
  const sequenceTemplates = statusData?.sequenceTemplates ?? [];
  const sequences = savedSequences.length > 0 ? savedSequences : sequenceTemplates;
  const usingSequenceTemplates = savedSequences.length === 0 && sequenceTemplates.length > 0;
  const currentSequence = sequences.find(s => s.id === selectedSequenceId) || sequences[0];
  const schedulerRules = statusData?.schedulerRules ?? [];
  const schedulerTemplates = statusData?.schedulerTemplates ?? [];
  const schedulerJobs = statusData?.schedulerJobs ?? [];
  const computedSchedule = currentSequence ? calculateCadenceSchedule(new Date(), currentSequence.steps) : [];

  const backoffCalc = calculateExponentialBackoff(testBackoffAttempt);
  const samplePayload = {
    conversionAction: 'TestOnly',
    contractorId: 'test-only',
    dealValue: 0,
    timestamp: new Date().toISOString()
  };
  const sampleSignature = testWebhookSecret ? signWebhookPayload(testWebhookSecret, samplePayload) : '';

  const p1 = statusData?.verification?.pillar1;
  const p2 = statusData?.verification?.pillar2;
  const p3 = statusData?.verification?.pillar3;

  return (
    <div className="space-y-6">
      {/* ─── PHASE 3 CONTROL BANNER ─── */}
      <div className="bg-bg-raised border border-border-dim rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-dim pb-4 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold tracking-widest text-accent uppercase">
                HAL Master Plan — Architecture Roadmap
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${statusData?.phase3Verified ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : 'bg-warning-dim text-warning border-warning/30'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusData?.phase3Verified ? 'bg-emerald-500' : 'bg-warning'}`} />
                {statusData?.phase3Verified ? 'PHASE 3 VERIFIED' : 'PHASE 3 NOT VERIFIED'}
              </span>
            </div>
            <h2 className="text-lg font-bold font-display text-text-primary tracking-tight">
              Phase 3: Cadence Templates, Outbox Inspection & Scheduler Configuration
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed max-w-3xl">
              Cadence templates and configuration checks are available. Provider delivery, durable outbox processing, and autonomous scheduler execution are not enabled or verified in this deployment.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleVerifyPhase3}
              disabled={isVerifying}
              className="px-3.5 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 active:scale-98 transition-all text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Verifying Phase 3...' : 'Verify Phase 3 Invariants'}</span>
            </button>
            <button
              onClick={() => setActiveTab('sequencer')}
              className="px-3.5 py-2 rounded-lg bg-bg-overlay hover:bg-bg-subtle text-text-primary border border-border-dim hover:border-border-default transition-all text-xs font-medium flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span>Sequencer Console</span>
            </button>
          </div>
        </div>

        {/* Phase 3 Key Telemetry Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-text-tertiary uppercase">Pillar 1: Sequencer</span>
              <span className={`w-2 h-2 rounded-full ${p1?.verified ? 'bg-emerald-500' : 'bg-warning'}`} />
            </div>
            <div className="text-sm font-bold text-text-primary">
              {savedSequences.length} Saved Sequences
            </div>
            <div className="text-[10px] text-text-secondary">
              {sequences.reduce((sum, s) => sum + s.steps.length, 0)} {usingSequenceTemplates ? 'template steps (not active)' : 'saved sequence steps'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-text-tertiary uppercase">Pillar 2: Outbox</span>
              <span className={`w-2 h-2 rounded-full ${p2?.verified ? 'bg-emerald-500' : 'bg-warning'}`} />
            </div>
            <div className="text-sm font-bold text-text-primary">
              {p2?.verified ? 'Verified' : 'Not verified'}
            </div>
            <div className="text-[10px] text-text-secondary">
              2^n Exponential Backoff
            </div>
          </div>

          <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-text-tertiary uppercase">Pillar 3: Triggers</span>
              <span className={`w-2 h-2 rounded-full ${p3?.verified ? 'bg-emerald-500' : 'bg-warning'}`} />
            </div>
            <div className="text-sm font-bold text-text-primary">
              {schedulerJobs.length} Recorded Scheduler Checks
            </div>
            <div className="text-[10px] text-text-secondary">
              No active scheduler rules configured
            </div>
          </div>

          <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-text-tertiary uppercase">Cryptographic Ledger</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-sm font-bold text-text-primary truncate">
              {statusData?.integrity?.totalEntries ?? 0} Recorded Blocks
            </div>
            <div className="text-[10px] font-mono text-emerald-500 font-semibold">
              {statusData?.integrity?.valid ? 'HASH CHAIN VERIFIED' : 'HASH CHAIN NOT VERIFIED'}
            </div>
          </div>
        </div>

        {/* Verification Success Toast / Notification */}
        {verificationResult && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{verificationResult.allPassed ? 'Phase 3 verification passed all required checks.' : 'Phase 3 verification is incomplete; one or more checks failed.'}</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-500">
              BLOCK #{verificationResult.block?.sequenceNumber ?? 'NO BLOCK'}
            </span>
          </div>
        )}
      </div>

      {/* ─── TABS NAVIGATION ─── */}
      <div className="flex items-center gap-1 border-b border-border-dim pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-accent text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Overview Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('sequencer')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'sequencer'
              ? 'bg-accent text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Outreach Sequencer (Pillar 1)</span>
        </button>

        <button
          onClick={() => setActiveTab('outbox')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'outbox'
              ? 'bg-accent text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Webhook Outbox & Backoff (Pillar 2)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('bridge');
            fetchOutboxQueue();
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'bridge'
              ? 'bg-accent text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>Provider Configuration & Delivery Status</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
            LIVE
          </span>
        </button>

        <button
          onClick={() => setActiveTab('scheduler')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'scheduler'
              ? 'bg-accent text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Scheduled Triggers (Pillar 3)</span>
        </button>
      </div>

      {/* ─── TAB 1: OVERVIEW MATRIX ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1 Card */}
            <div className="p-4 rounded-xl bg-bg-raised border border-border-dim space-y-3">
              <div className="flex items-center justify-between border-b border-border-dim pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center text-accent">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-text-tertiary uppercase">Pillar 1</span>
                    <h3 className="text-xs font-bold text-text-primary">Multi-Step Outreach Sequencer</h3>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  {p1?.status || 'NOT VERIFIED'}
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Cadence records and delivery providers are shown only when returned by the runtime; no live sending is claimed by this overview.
              </p>
              <div className="pt-2 border-t border-border-dim/60 space-y-1.5 text-[11px] font-mono text-text-secondary">
                <div className="flex justify-between">
                  <span>ACTIVE CADENCES:</span>
                  <strong className="text-text-primary">{sequences.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>AVERAGE CONVERSION:</span>
                  <strong className="text-text-secondary">Not measured</strong>
                </div>
              </div>
            </div>

            {/* Pillar 2 Card */}
            <div className="p-4 rounded-xl bg-bg-raised border border-border-dim space-y-3">
              <div className="flex items-center justify-between border-b border-border-dim pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center text-accent">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-text-tertiary uppercase">Pillar 2</span>
                    <h3 className="text-xs font-bold text-text-primary">Webhook Outbox & Backoff</h3>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  {p2?.status || 'NOT VERIFIED'}
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Signing and retry helpers exist, but provider delivery and exactly-once semantics have not been verified in this deployment.
              </p>
              <div className="pt-2 border-t border-border-dim/60 space-y-1.5 text-[11px] font-mono text-text-secondary">
                <div className="flex justify-between">
                  <span>PAYLOAD SIGNING:</span>
                  <strong className="text-text-primary">HMAC-SHA256</strong>
                </div>
                <div className="flex justify-between">
                  <span>RETRY POLICY:</span>
                  <strong className="text-emerald-500">2^n (Max 1hr)</strong>
                </div>
              </div>
            </div>

            {/* Pillar 3 Card */}
            <div className="p-4 rounded-xl bg-bg-raised border border-border-dim space-y-3">
              <div className="flex items-center justify-between border-b border-border-dim pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center text-accent">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-text-tertiary uppercase">Pillar 3</span>
                    <h3 className="text-xs font-bold text-text-primary">Scheduled Calendar Triggers</h3>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  {p3?.status || 'NOT VERIFIED'}
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Scheduler and calendar integration status is unavailable until persisted job records and an external calendar provider are verified.
              </p>
              <div className="pt-2 border-t border-border-dim/60 space-y-1.5 text-[11px] font-mono text-text-secondary">
                <div className="flex justify-between">
                  <span>ACTIVE RULES:</span>
                  <strong className="text-text-primary">{schedulerRules.length} Jobs</strong>
                </div>
                <div className="flex justify-between">
                  <span>CALENDAR SYNC:</span>
                  <strong className="text-text-secondary">Unverified</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Automation Ledger Activity */}
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-3">
            <div className="flex items-center justify-between border-b border-border-dim pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">
                  Automation Engine Ledger Events
                </h3>
              </div>
              <span className="text-[10px] font-mono text-text-tertiary">
                {statusData?.integrity?.valid ? 'HASH CHAIN VERIFIED' : 'HASH CHAIN NOT VERIFIED'}
              </span>
            </div>

            <div className="space-y-2">
              {(statusData?.recentAutomationEvents ?? []).map((event, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-bg-base border border-border-dim/60 flex items-start justify-between gap-3 text-xs font-mono">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-accent uppercase">{event.eventType}</span>
                      <span className="text-[10px] text-text-tertiary">by {event.actor}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary">{event.details}</p>
                  </div>
                  <span className="text-[10px] text-text-tertiary whitespace-nowrap">
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {(!statusData?.recentAutomationEvents || statusData.recentAutomationEvents.length === 0) && <p className="p-4 text-xs text-text-tertiary border border-dashed border-border-dim rounded-lg">No persisted automation events were returned by the runtime.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: OUTREACH SEQUENCER ─── */}
      {activeTab === 'sequencer' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-dim pb-3">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Cadence Template Preview</h3>
                <p className="text-xs text-text-secondary mt-0.5">Preview a saved sequence or an example template. Previewing does not enroll a lead or send messages.</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedSequenceId}
                  onChange={(e) => setSelectedSequenceId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-bg-base border border-border-dim text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
                >
                  {sequences.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sequence Steps Timeline */}
            <div className="space-y-3">
              {computedSchedule.map((step, idx) => (
                <div key={step.id} className="p-4 rounded-lg bg-bg-base border border-border-dim space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-accent/15 text-accent font-mono font-bold text-xs flex items-center justify-center">
                        {step.stepNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-text-primary">{step.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-bg-overlay border border-border-dim text-text-secondary">
                            {step.channel.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-text-tertiary">
                          Day +{step.dayOffset} ({step.triggerCondition})
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      PREVIEW ONLY
                    </span>
                  </div>

                  {/* Template Subject & Body Preview with dynamic interpolation */}
                  <div className="p-3 rounded bg-bg-overlay border border-border-dim/50 space-y-1.5 text-xs font-mono">
                    <div className="text-[11px] text-accent font-semibold">
                      Subject: {substituteTemplateTokens(step.subject, { businessName: targetBusinessName, ownerName: targetOwnerName, city: targetCity, niche: targetNiche })}
                    </div>
                    <pre className="text-[10px] text-text-secondary whitespace-pre-wrap font-sans leading-relaxed">
                      {substituteTemplateTokens(step.template, { businessName: targetBusinessName, ownerName: targetOwnerName, city: targetCity, niche: targetNiche })}
                    </pre>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Target Simulation & Trigger Form */}
            <div className="pt-4 border-t border-border-dim space-y-3">
              <h4 className="text-xs font-mono font-bold text-accent uppercase">
                Simulate Cadence Trigger for Target Prospect
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-text-tertiary block mb-1">BUSINESS NAME</label>
                  <input
                    type="text"
                    value={targetBusinessName}
                    onChange={(e) => setTargetBusinessName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-bg-base border border-border-dim text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-text-tertiary block mb-1">DECISION MAKER</label>
                  <input
                    type="text"
                    value={targetOwnerName}
                    onChange={(e) => setTargetOwnerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-bg-base border border-border-dim text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-text-tertiary block mb-1">CITY / TERRITORY</label>
                  <input
                    type="text"
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-bg-base border border-border-dim text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-text-tertiary block mb-1">NICHE / TRADE</label>
                  <input
                    type="text"
                    value={targetNiche}
                    onChange={(e) => setTargetNiche(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-bg-base border border-border-dim text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleTriggerSequence}
                  disabled={isTriggeringSequence || !currentSequence || !targetBusinessName.trim() || !targetCity.trim() || !targetNiche.trim()}
                  className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Play className={`w-3.5 h-3.5 ${isTriggeringSequence ? 'animate-spin' : ''}`} />
                  <span>{isTriggeringSequence ? 'Generating Preview...' : 'Preview Cadence Schedule'}</span>
                </button>

                {sequenceTriggerResult && (
                  <span className="text-xs font-mono text-emerald-500 font-semibold flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4" />
                    Preview generated for {targetBusinessName}. {sequenceTriggerResult.scheduledSteps?.length ?? 0} touchpoints mapped; no enrollment or message sent.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: WEBHOOK OUTBOX & BACKOFF ─── */}
      {activeTab === 'outbox' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-dim pb-3">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Conversion Outbox Inspection</h3>
                <p className="text-xs text-text-secondary mt-0.5">Backoff and signature helpers can be previewed below. This action only inspects queued records; it does not upload conversions or send messages.</p>
              </div>

              <button
                onClick={handleProcessOutbox}
                disabled={isProcessingOutbox}
                className="px-3.5 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessingOutbox ? 'animate-spin' : ''}`} />
                <span>{isProcessingOutbox ? 'Inspecting Outbox...' : 'Inspect Outbox Queue'}</span>
              </button>
            </div>

            {/* Exponential Backoff Simulator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-bg-base border border-border-dim space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Exponential Backoff Curve</span>
                  <span className="text-[10px] font-mono font-bold text-accent">FORMULA: 2^n × 1000ms</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-text-secondary">Simulate Attempt (0 - 10):</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={testBackoffAttempt}
                      onChange={(e) => setTestBackoffAttempt(parseInt(e.target.value))}
                      className="flex-1 accent-accent"
                    />
                    <span className="font-mono text-xs font-bold text-text-primary w-6 text-right">
                      {testBackoffAttempt}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-bg-overlay border border-border-dim font-mono text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">RETRY DELAY:</span>
                      <strong className="text-emerald-500">{backoffCalc.delaySeconds} seconds ({backoffCalc.delayMs}ms)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">NEXT ATTEMPT AT:</span>
                      <span className="text-text-primary text-[10px]">{backoffCalc.nextAttemptAt}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* HMAC-SHA256 Payload Signature Inspector */}
              <div className="p-4 rounded-lg bg-bg-base border border-border-dim space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">HMAC-SHA256 Security Header</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-500">CRYPTOGRAPHIC PROOF</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-mono text-text-tertiary block mb-1">WEBHOOK SECRET</label>
                    <input
                      type="text"
                      value={testWebhookSecret}
                      onChange={(e) => setTestWebhookSecret(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-bg-overlay border border-border-dim text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="p-2.5 rounded bg-bg-overlay border border-border-dim font-mono text-[10px] space-y-1">
                    <div className="text-text-tertiary">HEADER: x-hal-signature</div>
                    <div className="text-accent break-all select-all flex items-center justify-between gap-2">
                      <span>sha256={sampleSignature}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`sha256=${sampleSignature}`);
                          setCopiedSignature(true);
                          setTimeout(() => setCopiedSignature(false), 2000);
                        }}
                        className="p-1 hover:bg-bg-subtle rounded cursor-pointer shrink-0"
                      >
                        {copiedSignature ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-text-tertiary" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Outbox Process Toast */}
            {outboxProcessResult && (
              <div className="p-3 rounded bg-warning-dim border border-warning/30 text-xs text-text-primary flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-warning" />
                  <span>{outboxProcessResult.message} Existing records: {outboxProcessResult.existingRecordCount ?? 0}; queued: {outboxProcessResult.queuedCount ?? 0}; provider uploads verified: {outboxProcessResult.providerDeliveryVerifiedCount ?? 0}.</span>
                </div>
                <span className="text-[10px] text-text-tertiary">No provider latency measured</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: LIVE OUTBOX DELIVERY BRIDGE ─── */}
      {activeTab === 'bridge' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-dim pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold tracking-wider text-accent uppercase">
                    Phase 3 Operational Instrument
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-warning-dim text-warning border border-warning/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                    DELIVERY NOT VERIFIED
                  </span>
                </div>
                <h3 className="text-sm font-bold text-text-primary">Live Outbox Delivery Bridge</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Saved credentials are shown as configured but unverified. Outbound delivery is disabled until provider adapters and webhook handling are tested.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchOutboxQueue}
                  disabled={isLoadingQueue}
                  className="px-3 py-1.5 rounded-lg bg-bg-base border border-border-dim text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? 'animate-spin' : ''}`} />
                  <span>Refresh Telemetry</span>
                </button>
              </div>
            </div>

            {/* Carrier Gateways Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(outboxQueueData?.gateways ?? []).map((gw: any) => (
                <div key={gw.id} className="p-3.5 rounded-lg bg-bg-base border border-border-dim space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {gw.type === 'email' && <Mail className="w-3.5 h-3.5 text-accent" />}
                      {gw.type === 'sms' && <Phone className="w-3.5 h-3.5 text-emerald-500" />}
                      {gw.type === 'webhook' && <Globe className="w-3.5 h-3.5 text-blue-500" />}
                      <span className="text-xs font-bold text-text-primary">{gw.name}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {gw.configured ? 'CONFIGURED · UNVERIFIED' : 'NOT CONFIGURED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-text-secondary pt-1 border-t border-border-dim/50">
                    <div>
                      <span className="text-text-tertiary block text-[9px]">PROTOCOL</span>
                      <span className="text-text-primary">{gw.encryption}</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block text-[9px]">DELIVERABILITY</span>
                      <span className="text-text-secondary">{gw.deliverability ?? 'Not measured'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Live Dispatcher Desk Instrument */}
            <div className="p-4 rounded-xl bg-bg-base border border-border-dim space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border-dim pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-accent" />
                  <span className="text-xs font-bold text-text-primary">Dispatch Preview (No Message Sent)</span>
                  <span className="text-[10px] text-text-secondary font-mono">
                    (Constrain tools, not behavior)
                  </span>
                </div>

                {/* Preset Templates */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-text-tertiary mr-1">PRESETS:</span>
                  <button
                    onClick={() => applyLiveTemplate('speed_audit')}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                      liveTemplateType === 'speed_audit'
                        ? 'bg-accent text-white'
                        : 'bg-bg-overlay text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Speed Audit
                  </button>
                  <button
                    onClick={() => applyLiveTemplate('proposal')}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                      liveTemplateType === 'proposal'
                        ? 'bg-accent text-white'
                        : 'bg-bg-overlay text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Commercial Retainer SLA
                  </button>
                  <button
                    onClick={() => applyLiveTemplate('followup')}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                      liveTemplateType === 'followup'
                        ? 'bg-accent text-white'
                        : 'bg-bg-overlay text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Follow-Up Notice
                  </button>
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Channel Selector */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-[11px] font-bold text-text-secondary block">DELIVERY CHANNEL</label>
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-bg-overlay border border-border-dim">
                    <button
                      onClick={() => {
                        setLiveChannel('email');
                        setLiveRecipient('');
                        applyLiveTemplate(liveTemplateType, liveBusinessName);
                      }}
                      className={`py-1.5 rounded text-[11px] font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        liveChannel === 'email' ? 'bg-accent text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </button>
                    <button
                      onClick={() => {
                        setLiveChannel('sms');
                        setLiveRecipient('');
                        setLiveMessage('');
                      }}
                      className={`py-1.5 rounded text-[11px] font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        liveChannel === 'sms' ? 'bg-emerald-600 text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>SMS</span>
                    </button>
                    <button
                      onClick={() => {
                        setLiveChannel('webhook');
                        setLiveRecipient('');
                        setLiveMessage('{\\n  "event": "test_only",\\n  "business": "",\\n  "estValue": 0,\\n  "urgency": "unverified"\\n}');
                      }}
                      className={`py-1.5 rounded text-[11px] font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        liveChannel === 'webhook' ? 'bg-blue-600 text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Webhook</span>
                    </button>
                  </div>
                </div>

                {/* Prospect Name */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[11px] font-bold text-text-secondary block">TARGET BUSINESS</label>
                  <input
                    type="text"
                    value={liveBusinessName}
                    onChange={(e) => {
                      setLiveBusinessName(e.target.value);
                      applyLiveTemplate(liveTemplateType, e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-bg-overlay border border-border-dim text-xs text-text-primary focus:outline-none focus:border-accent"
                    placeholder="Enter business name"
                  />
                </div>

                {/* Recipient Address */}
                <div className="md:col-span-5 space-y-1.5">
                  <label className="text-[11px] font-bold text-text-secondary block">
                    {liveChannel === 'email' && 'RECIPIENT EMAIL'}
                    {liveChannel === 'sms' && 'E.164 PHONE NUMBER'}
                    {liveChannel === 'webhook' && 'TARGET WEBHOOK ENDPOINT'}
                  </label>
                  <input
                    type="text"
                    value={liveRecipient}
                    onChange={(e) => setLiveRecipient(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-bg-overlay border border-border-dim text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                    placeholder={liveChannel === 'email' ? 'name@company.com' : liveChannel === 'sms' ? '+1 (555) 000-0000' : 'https://api.domain.com/webhook'}
                  />
                </div>
              </div>

              {/* Subject Line (if email) */}
              {liveChannel === 'email' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-text-secondary block">OUTBOX SUBJECT LINE</label>
                  <input
                    type="text"
                    value={liveSubject}
                    onChange={(e) => setLiveSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-bg-overlay border border-border-dim text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              {/* Message / Payload Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-text-secondary block">MESSAGE BODY & CONTENT</label>
                  <span className="text-[10px] font-mono text-text-tertiary">
                    {liveChannel === 'webhook' ? 'JSON PAYLOAD' : 'PLAIN TEXT / MARKDOWN'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={liveMessage}
                  onChange={(e) => setLiveMessage(e.target.value)}
                  className="w-full p-3 rounded-lg bg-bg-overlay border border-border-dim text-xs font-mono text-text-primary focus:outline-none focus:border-accent resize-y"
                />
              </div>

              {/* Footer Controls & Dispatch CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-text-secondary flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={livePriority === 'high'}
                      onChange={(e) => setLivePriority(e.target.checked ? 'high' : 'standard')}
                      className="accent-accent"
                    />
                    <span className="font-medium text-xs">High-Priority Direct Carrier Route</span>
                  </label>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold">
                    [HMAC-SHA256 SIGNED]
                  </span>
                </div>

                <button
                  onClick={handleLiveDispatch}
                  disabled={isDispatchingLive || !liveRecipient || !liveMessage}
                  className="px-5 py-2.5 rounded-lg bg-accent text-white hover:bg-accent/90 transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  <Send className={`w-3.5 h-3.5 ${isDispatchingLive ? 'animate-spin' : ''}`} />
                  <span>{isDispatchingLive ? 'Transmitting via Carrier Gateway...' : `Check ${liveChannel.toUpperCase()} Delivery Availability`}</span>
                </button>
              </div>
            </div>

            {/* Live Transmission Cryptographic Receipt */}
            {liveDispatchError && <div className="p-3 rounded-lg bg-warning-dim border border-warning/30 text-xs text-warning" role="alert">{liveDispatchError}</div>}
            {liveDispatchResult && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CARRIER DISPATCH CONFIRMED — {liveDispatchResult.deliveryStatus}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[10px] font-bold">
                    LATENCY: {liveDispatchResult.latencyMs}ms
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <span className="text-text-tertiary block text-[9px]">DISPATCH ID</span>
                    <span className="text-text-primary font-bold">{liveDispatchResult.dispatchId}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block text-[9px]">GATEWAY PROVIDER</span>
                    <span className="text-emerald-500 font-bold">{liveDispatchResult.provider}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block text-[9px]">RECIPIENT DESTINATION</span>
                    <span className="text-text-primary truncate block">{liveDispatchResult.recipient}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-bg-base/80 border border-border-dim text-[10px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">HMAC-SHA256 SIGNATURE:</span>
                    <span className="text-accent truncate max-w-md">{liveDispatchResult.signature}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border-dim/50 pt-1">
                    <span className="text-text-tertiary">LEDGER BLOCK ANCHOR:</span>
                    <span className="text-emerald-500 font-bold">
                      Block #{liveDispatchResult.block?.sequenceNumber || 'N/A'} • {liveDispatchResult.block?.entryHash?.slice(0, 16)}... [{liveDispatchResult.block?.entryHash ? 'HASH CHAIN VERIFIED' : 'HASH CHAIN NOT VERIFIED'}]
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Outbox Delivery Ledger & History Table */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">Outbox Delivery Ledger & Audit History</span>
                <span className="text-[10px] font-mono text-text-tertiary">
                  Dispatch attempts: {outboxQueueData?.stats?.totalDispatched ?? 0} • Delivery verified: {outboxQueueData?.stats?.deliveryVerifiedCount ?? 0}
                </span>
              </div>

              <div className="border border-border-dim rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-bg-base border-b border-border-dim text-[10px] text-text-tertiary uppercase">
                      <tr>
                        <th className="p-2.5">Channel</th>
                        <th className="p-2.5">Recipient</th>
                        <th className="p-2.5">Subject / Preview</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Latency</th>
                        <th className="p-2.5">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dim/50">
                      {(outboxQueueData?.recentDispatches ?? []).slice(0, 8).map((item: any, idx: number) => (
                        <tr key={item.id || idx} className="hover:bg-bg-subtle/50 transition-colors">
                          <td className="p-2.5">
                            <span className="flex items-center gap-1.5">
                              {item.channel === 'email' && <Mail className="w-3.5 h-3.5 text-accent" />}
                              {item.channel === 'sms' && <Phone className="w-3.5 h-3.5 text-emerald-500" />}
                              {item.channel === 'webhook' && <Globe className="w-3.5 h-3.5 text-blue-500" />}
                              <span className="uppercase text-[10px] font-bold text-text-secondary">{item.channel}</span>
                            </span>
                          </td>
                          <td className="p-2.5 text-text-primary max-w-xs truncate">{item.recipient}</td>
                          <td className="p-2.5 text-text-secondary max-w-xs truncate">{item.subject || item.preview}</td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              {item.mode === 'simulation' ? 'SIMULATED' : (item.status || 'UNVERIFIED').toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2.5 text-text-secondary">{typeof item.latencyMs === 'number' ? `${item.latencyMs}ms` : 'Not measured'}</td>
                          <td className="p-2.5 text-text-tertiary text-[10px]">
                            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Not recorded'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SCHEDULED TRIGGERS ─── */}
      {activeTab === 'scheduler' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-dim pb-3">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Scheduler Configuration</h3>
                <p className="text-xs text-text-secondary mt-0.5">Templates are available, but no persisted scheduler rules or background trigger worker is configured.</p>
              </div>

              <button
                onClick={handleRunScheduler}
                disabled={isRunningScheduler}
                className="px-3.5 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Play className={`w-3.5 h-3.5 ${isRunningScheduler ? 'animate-spin' : ''}`} />
                <span>{isRunningScheduler ? 'Checking Configuration...' : 'Check Scheduler Configuration'}</span>
              </button>
            </div>

            {/* Inactive Scheduler Templates */}
            <div className="space-y-3">
              {schedulerRules.length === 0 && (
                <div className="p-4 rounded-lg bg-bg-base border border-border-dim space-y-2">
                  <div className="text-xs font-semibold text-text-primary">No active scheduler rules</div>
                  <p className="text-[11px] text-text-secondary">No background triggers are configured. The following are templates only:</p>
                  {schedulerTemplates.map(template => (
                    <div key={template.id} className="flex flex-wrap items-center justify-between gap-2 text-[11px] border-t border-border-dim pt-2">
                      <span className="text-text-primary">{template.name}</span>
                      <span className="text-text-tertiary">{template.cronExpression} · inactive template</span>
                    </div>
                  ))}
                </div>
              )}
              {schedulerRules.map((rule) => (
                <div key={rule.id} className="p-3.5 rounded-lg bg-bg-base border border-border-dim flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-primary">{rule.name}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-bg-overlay border border-border-dim text-accent">
                        {rule.cronExpression}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary">{rule.targetAction}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                    <div className="text-right">
                      <span className="text-[9px] text-text-tertiary block">LAST RUN</span>
                      <span className="text-text-primary">{new Date(rule.lastRunAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-text-tertiary block">EXECUTIONS</span>
                      <span className="text-emerald-500 font-bold">{rule.executionsCount}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Scheduler Configuration Check Result */}
            {schedulerRunResult && (
              <div className="p-3 rounded bg-warning-dim border border-warning/30 text-xs text-text-primary flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-warning" />
                  <span>{schedulerRunResult.message} Templates available: {schedulerRunResult.availableTemplatesCount ?? 0}; configured rules: {schedulerRunResult.configuredRulesCount ?? 0}; triggers executed: {schedulerRunResult.triggersExecuted ?? 0}.</span>
                </div>
                <span className="text-[10px] text-warning font-bold">NO TRIGGERS EXECUTED</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
