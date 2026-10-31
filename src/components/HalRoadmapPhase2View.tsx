import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Compass, 
  Search, 
  Gauge, 
  Clock, 
  TrendingUp, 
  Target, 
  RefreshCw, 
  Play, 
  Sparkles, 
  Check, 
  Lock, 
  Globe, 
  Hash, 
  ExternalLink,
  ChevronRight,
  BarChart3,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { CompetitorAuditReport, SpatialQuadrantSummary } from '../lib/phase2-intelligence';

interface Phase2StatusResponse {
  success: boolean;
  phase: string;
  currentRoadmapPhase: number;
  phase2Verified: boolean;
  verification: {
    allPassed: boolean;
    pillar1: {
      name: string;
      verified: boolean;
      status: string;
      details: string;
      metrics: {
        totalLeads: number;
        nonSeedRecordCount: number;
        mockCount: number;
        encryptedCount: number;
        plaintextLeakCheck: string;
      };
    };
    pillar2: {
      name: string;
      verified: boolean;
      status: string;
      details: string;
      metrics: {
        quadrantCount: number;
        avgLatencyMins: number | null;
        quadrants: SpatialQuadrantSummary[];
      };
    };
    pillar3: {
      name: string;
      verified: boolean;
      status: string;
      details: string;
      metrics: {
        competitorsSampled: number;
        status: string;
      };
    };
  };
  quadrants: SpatialQuadrantSummary[];
  competitorAuditSample: CompetitorAuditReport | null;
  competitorAuditStatus: { status: string; message: string };
  recentIntelligenceEvents: any[];
  integrity: {
    valid: boolean;
    totalEntries: number;
    latestHash: string;
  };
}

export const HalRoadmapPhase2View: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<Phase2StatusResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'harvest' | 'geo' | 'competitors'>('overview');

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  // Competitor Audit State
  const [auditCity, setAuditCity] = useState('');
  const [auditNiche, setAuditNiche] = useState('');
  const [auditCompetitors, setAuditCompetitors] = useState('');
  const [isAuditingCompetitors, setIsAuditingCompetitors] = useState(false);
  const [activeAuditReport, setActiveAuditReport] = useState<CompetitorAuditReport | null>(null);
  const [auditLedgerBlock, setAuditLedgerBlock] = useState<any | null>(null);

  // Territory Harvest State
  const [harvestCity, setHarvestCity] = useState('');
  const [harvestNiche, setHarvestNiche] = useState('');
  const [purgeMockSeeds, setPurgeMockSeeds] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [harvestResult, setHarvestResult] = useState<any | null>(null);

  const fetchPhase2Status = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token');
      const res = await fetch('/api/roadmap/phase2/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        if (!activeAuditReport && data.competitorAuditSample) {
          setActiveAuditReport(data.competitorAuditSample);
        }
      }
    } catch (err) {
      console.error('Failed to load Phase 2 status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhase2Status();
  }, []);

  const handleVerifyPhase2 = async () => {
    try {
      setIsVerifying(true);
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token');
      const res = await fetch('/api/roadmap/phase2/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data);
        await fetchPhase2Status();
      }
    } catch (err) {
      console.error('Phase 2 verification failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRunCompetitorAudit = async () => {
    try {
      setIsAuditingCompetitors(true);
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token');
      const res = await fetch('/api/roadmap/phase2/audit-competitors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          city: auditCity,
          niche: auditNiche,
          competitorNames: auditCompetitors.split(',').map(s => s.trim()).filter(Boolean)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveAuditReport(data.report);
        setAuditLedgerBlock(data.block);
        await fetchPhase2Status();
      }
    } catch (err) {
      console.error('Competitor audit execution failed:', err);
    } finally {
      setIsAuditingCompetitors(false);
    }
  };

  const handleRunHarvest = async () => {
    try {
      setIsHarvesting(true);
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token');
      const res = await fetch('/api/roadmap/phase2/harvest-territory', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          city: harvestCity,
          niche: harvestNiche,
          purgeMock: purgeMockSeeds
        })
      });
      if (res.ok) {
        const data = await res.json();
        setHarvestResult(data);
        await fetchPhase2Status();
      }
    } catch (err) {
      console.error('Harvest execution failed:', err);
    } finally {
      setIsHarvesting(false);
    }
  };

  const p1 = statusData?.verification?.pillar1;
  const p2 = statusData?.verification?.pillar2;
  const p3 = statusData?.verification?.pillar3;

  return (
    <div className="space-y-6">
      {/* ─── PHASE 2 CONTROL BANNER ─── */}
      <div className="bg-bg-raised border border-border-dim rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-dim pb-4 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold tracking-widest text-accent uppercase">
                HAL Master Plan — Architecture Roadmap
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-warning-dim text-warning border border-warning/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {statusData?.phase2Verified ? 'PHASE 2 VERIFIED' : 'PHASE 2 NOT VERIFIED'}
              </span>
            </div>
            <h2 className="text-lg font-bold font-display text-text-primary tracking-tight">
              Phase 2: Intelligence (Local Harvesting, Geo Scoring & Competitor Audits)
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed max-w-3xl">
              Verification is evidence-gated. Stored records, geo-data availability, and competitor-source availability are shown below; no live-source or latency claims are made without provider evidence.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleVerifyPhase2}
              disabled={isVerifying}
              className="px-3.5 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 active:scale-98 transition-all text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Verifying Phase 2...' : 'Verify Phase 2 Invariants'}</span>
            </button>
            <button
              onClick={() => setActiveTab('competitors')}
              className="px-3.5 py-2 rounded-lg bg-bg-overlay hover:bg-bg-subtle text-text-primary border border-border-dim hover:border-border-default transition-all text-xs font-medium flex items-center gap-2 cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 text-accent" />
              <span>Competitor Footprint Console</span>
            </button>
          </div>
        </div>

        {/* Phase 2 Key Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
            <div className="text-[10px] font-mono text-text-tertiary uppercase flex items-center justify-between">
              <span>Non-seed Lead Records</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-lg font-bold font-display text-text-primary">
              {p1?.metrics.nonSeedRecordCount ?? '—'}
            </div>
            <div className="text-[10.5px] text-text-secondary">
              PII check: {p1?.metrics.plaintextLeakCheck || 'not verified'} · {p1?.metrics.encryptedCount || 0} encrypted
            </div>
          </div>

          <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
            <div className="text-[10px] font-mono text-text-tertiary uppercase flex items-center justify-between">
              <span>Spatial Quadrants</span>
              <Compass className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="text-lg font-bold font-display text-text-primary">
              {p2?.metrics.quadrantCount ?? '—'} Candidate Quadrants
            </div>
            <div className="text-[10.5px] text-text-secondary">
              Route-time latency: {p2?.metrics.avgLatencyMins == null ? 'Not available' : `${p2.metrics.avgLatencyMins} mins`}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
            <div className="text-[10px] font-mono text-text-tertiary uppercase flex items-center justify-between">
              <span>Competitor Audit Grounding</span>
              <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-lg font-bold font-display text-text-primary">
              {statusData?.competitorAuditStatus?.status === 'VERIFIED' ? 'Verified source available' : 'Not verified'}
            </div>
            <div className="text-[10.5px] text-text-secondary">
              {statusData?.competitorAuditStatus?.message || 'Competitor source not verified'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
            <div className="text-[10px] font-mono text-text-tertiary uppercase flex items-center justify-between">
              <span>Ledger Continuity</span>
              <Hash className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-lg font-bold font-display text-emerald-600 dark:text-emerald-400">
              {statusData?.integrity?.valid ? 'UNBROKEN' : 'DEGRADED'}
            </div>
            <div className="text-[10.5px] text-text-secondary">
              {statusData?.integrity.totalEntries || 0} sequenced blocks
            </div>
          </div>
        </div>
      </div>

      {/* ─── LIVE VERIFICATION BANNER (When Run) ─── */}
      {verificationResult && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-text-primary space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-xs font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">
                {verificationResult.verified ? 'Phase 2 verification passed' : 'Phase 2 checks completed · one or more pillars remain unverified'}
              </span>
            </div>
            <button 
              onClick={() => setVerificationResult(null)}
              className="text-[10px] font-mono text-text-secondary hover:text-text-primary"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-bg-raised border border-border-dim space-y-1">
              <span className="text-[10px] font-mono text-emerald-500 font-bold block uppercase">Pillar 1: Harvest & PII Vault</span>
              <p className="text-[11px] text-text-secondary leading-snug">{verificationResult.verification.pillar1.details}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-bg-raised border border-border-dim space-y-1">
              <span className="text-[10px] font-mono text-emerald-500 font-bold block uppercase">Pillar 2: Spatial Geo Scoring</span>
              <p className="text-[11px] text-text-secondary leading-snug">{verificationResult.verification.pillar2.details}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-bg-raised border border-border-dim space-y-1">
              <span className="text-[10px] font-mono text-emerald-500 font-bold block uppercase">Pillar 3: Competitor Audits</span>
              <p className="text-[11px] text-text-secondary leading-snug">{verificationResult.verification.pillar3.details}</p>
            </div>
          </div>
          <div className="pt-1 text-[10px] font-mono text-text-secondary flex items-center gap-1.5">
            <Hash className="w-3 h-3 text-accent" />
            <span>Anchored in Ledger Block ID: {verificationResult.block?.id} (Hash: {verificationResult.block?.entryHash?.slice(0, 16)}...)</span>
          </div>
        </div>
      )}

      {/* ─── NAVIGATION SUB-TABS (THE 3 PILLARS) ─── */}
      <div className="flex items-center gap-2 border-b border-border-dim pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-accent-dim text-accent font-bold border border-accent/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
          }`}
        >
          Phase 2 Overview Matrix
        </button>
        <button
          onClick={() => setActiveTab('harvest')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'harvest'
              ? 'bg-accent-dim text-accent font-bold border border-accent/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Pillar 1: Territory Candidates ({p1?.metrics.nonSeedRecordCount ?? 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('geo')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'geo'
              ? 'bg-accent-dim text-accent font-bold border border-accent/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Pillar 2: Spatial Geo Quadrants ({p2?.metrics.quadrantCount ?? '—'} candidates)</span>
        </button>
        <button
          onClick={() => setActiveTab('competitors')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'competitors'
              ? 'bg-accent-dim text-accent font-bold border border-accent/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Pillar 3: Competitor Footprint Audits</span>
        </button>
      </div>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Local Territory Harvester */}
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-warning-dim text-warning">
                {p1?.status || 'NOT VERIFIED'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-sm">Pillar 1: Local Territory Harvesting</h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Inspects stored lead records and PII fields. Non-seed records are not automatically treated as live-harvested businesses; source provenance remains unverified.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-bg-base border border-border-dim font-mono text-xs space-y-2">
              <div className="flex items-center justify-between gap-2 text-text-secondary">
                <span className="shrink-0">Non-seed records:</span>
                <span className="font-bold text-text-primary text-right">{p1?.metrics.nonSeedRecordCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-text-secondary">
                <span className="shrink-0">PII Encrypted Records:</span>
                <span className="font-bold text-emerald-500 text-right">{p1?.metrics.encryptedCount || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-text-secondary">
                <span className="shrink-0">Plaintext Leak Check:</span>
                <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] text-right ${
                  p1?.metrics.plaintextLeakCheck?.includes('FAIL')
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}>
                  {p1?.metrics.plaintextLeakCheck === 'PASSED_ZERO_LEAKAGE' ? 'PASSED (0 LEAK)' : (p1?.metrics.plaintextLeakCheck || 'NOT CHECKED')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('harvest')}
              className="w-full py-2 rounded-lg bg-bg-subtle hover:bg-bg-overlay text-text-primary border border-border-dim transition-all text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Manage Territory Harvest</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Live Geo Ranking & Latency Scoring */}
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent border border-accent/20 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-warning-dim text-warning">
                {p2?.status || 'NOT VERIFIED'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-sm">Pillar 2: Live Geo Ranking & Latency</h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Candidate spatial groupings from available lead locations. Trusted routing and geocoding are not configured, so dispatch latency and congestion are not measured.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-bg-base border border-border-dim font-mono text-xs space-y-2">
              <div className="flex items-center justify-between gap-2 text-text-secondary">
                <span className="shrink-0">Candidate quadrants:</span>
                <span className="font-bold text-text-primary text-right">{statusData?.quadrants?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-text-secondary">
                <span className="shrink-0">Route-time latency:</span>
                <span className="font-bold text-accent text-right">{p2?.metrics.avgLatencyMins == null ? 'Not available' : `${p2.metrics.avgLatencyMins} mins`}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-text-secondary">
                <span className="shrink-0">Service radius:</span>
                <span className="font-bold text-text-primary text-right">Not configured</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('geo')}
              className="w-full py-2 rounded-lg bg-bg-subtle hover:bg-bg-overlay text-text-primary border border-border-dim transition-all text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore Spatial Quadrants</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Competitor Digital Footprint Audits */}
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-warning-dim text-warning">
                {p3?.status || 'NOT VERIFIED'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-sm">Pillar 3: Competitor Digital Footprint</h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Competitor audit remains unavailable until a verified search/maps data source is configured. No competitor rankings, reviews, speed scores, or market saturation are fabricated.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-bg-base border border-border-dim font-mono text-xs space-y-2">
              <div className="flex items-center justify-between gap-2 text-text-secondary">
                <span className="shrink-0">Top Competitors Tracked:</span>
                <span className="font-bold text-text-primary text-right">{activeAuditReport?.competitors.length ?? p3?.metrics.competitorsSampled ?? 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-text-secondary">
                <span className="shrink-0">Avg Competitor Speed:</span>
                <span className="font-bold text-amber-500 text-right">{activeAuditReport?.marketAverages.avgMobileSpeed == null ? 'Not available' : `${activeAuditReport.marketAverages.avgMobileSpeed}/100`}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-text-secondary">
                <span className="shrink-0">Market Saturation:</span>
                <span className="font-bold text-indigo-400 text-right">{activeAuditReport?.saturationLevel || 'Not available'}</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('competitors')}
              className="w-full py-2 rounded-lg bg-bg-subtle hover:bg-bg-overlay text-text-primary border border-border-dim transition-all text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Run Live Competitor Audit</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 2: TERRITORY HARVESTER & MOCK PURGE ─── */}
      {activeTab === 'harvest' && (
        <div className="space-y-5">
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4">
            <div className="flex items-center justify-between border-b border-border-dim pb-3">
              <div>
                <h3 className="font-bold text-text-primary text-sm">Territory Candidate Discovery & Optional Seed Cleanup</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Finds business discovery candidates. Contact details are retained only when independently verified; unverified source claims are not treated as facts.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                CONTACT VAULT ENCRYPTION
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono text-text-secondary block mb-1">Target Market (City)</label>
                <input
                  type="text"
                  value={harvestCity}
                  onChange={(e) => setHarvestCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-bg-base border border-border-dim rounded-lg text-text-primary"
                  placeholder="Enter a city"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-text-secondary block mb-1">Contractor Niche</label>
                <input
                  type="text"
                  value={harvestNiche}
                  onChange={(e) => setHarvestNiche(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-bg-base border border-border-dim rounded-lg text-text-primary"
                  placeholder="Enter a contractor niche"
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer pb-2 text-xs text-text-secondary">
                  <input
                    type="checkbox"
                    checked={purgeMockSeeds}
                    onChange={(e) => setPurgeMockSeeds(e.target.checked)}
                    className="rounded border-border-dim text-accent focus:ring-accent"
                  />
                  <span>Purge Mock Seeds (lead_seed_*)</span>
                </label>
                <button
                  onClick={handleRunHarvest}
                  disabled={isHarvesting}
                  className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ml-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isHarvesting ? 'animate-spin' : ''}`} />
                  <span>{isHarvesting ? 'Harvesting...' : 'Run Harvest'}</span>
                </button>
              </div>
            </div>

            {harvestResult && (
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Discovery complete: {harvestResult.harvestedCount} candidates processed.</span>
                </div>
                <div className="text-[11px] text-text-secondary">
                  Independently verified: {harvestResult.verifiedCount ?? 0}. Unverified staging: {harvestResult.unverifiedCount ?? 0}. Synthetic: {harvestResult.syntheticCount ?? 0}. Mock seeds removed: {harvestResult.purgedCount ?? 0}. Ledger block ID: {harvestResult.block?.id || 'not recorded'}.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: SPATIAL GEO QUADRANTS ─── */}
      {activeTab === 'geo' && (
        <div className="space-y-5">
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4">
            <div className="flex items-center justify-between border-b border-border-dim pb-3">
              <div>
                <h3 className="font-bold text-text-primary text-sm">Spatial Quadrants & Dispatch Latency Model</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Candidate spatial groupings use the location fields currently available. No travel-time or service-radius estimate is made without a trusted routing provider.
                </p>
              </div>
              <span className="text-[10px] font-mono text-text-secondary">
                Route-time provider: Not configured
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {(statusData?.quadrants || []).map((quad) => (
                <div key={quad.quadrant} className="p-3.5 rounded-lg bg-bg-base border border-border-dim space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-accent uppercase">
                      Zone {quad.quadrant}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      quad.saturationRating === 'CONGESTED' 
                        ? 'bg-amber-500/15 text-amber-500' 
                        : quad.saturationRating === 'ACCESSIBLE'
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : 'bg-indigo-500/15 text-indigo-400'
                    }`}>
                      {quad.saturationRating}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-text-primary leading-tight">
                    {quad.label}
                  </div>
                  <div className="pt-2 border-t border-border-dim/60 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between text-text-secondary">
                      <span>Leads in Zone:</span>
                      <span className="font-bold text-text-primary">{quad.leadCount}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Distance:</span>
                      <span className="text-text-primary">{quad.avgDistanceKm} km</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Dispatch:</span>
                      <span className="font-bold text-accent">{quad.avgDispatchLatencyMins}m</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: COMPETITOR DIGITAL FOOTPRINT AUDITS ─── */}
      {activeTab === 'competitors' && activeAuditReport && (
        <div className="space-y-5">
          {/* Competitor Audit Controls */}
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4">
            <div className="flex items-center justify-between border-b border-border-dim pb-3">
              <div>
                <h3 className="font-bold text-text-primary text-sm">Grounded Google Maps 3-Pack Competitor Footprint Audit</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Real-time competitor analysis, mobile Core Web Vitals speed deficits, and tactical market penetration roadmap.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/30">
                AUDIT ID: {activeAuditReport.id}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-mono text-text-secondary block mb-1">Target Territory</label>
                <input
                  type="text"
                  value={auditCity}
                  onChange={(e) => setAuditCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-bg-base border border-border-dim rounded-lg text-text-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-text-secondary block mb-1">Industry Niche</label>
                <input
                  type="text"
                  value={auditNiche}
                  onChange={(e) => setAuditNiche(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-bg-base border border-border-dim rounded-lg text-text-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-text-secondary block mb-1">Known Competitors (Optional)</label>
                <input
                  type="text"
                  value={auditCompetitors}
                  onChange={(e) => setAuditCompetitors(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-bg-base border border-border-dim rounded-lg text-text-primary"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleRunCompetitorAudit}
                  disabled={isAuditingCompetitors}
                  className="w-full py-2 rounded-lg bg-accent text-white hover:bg-accent/90 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Target className={`w-3.5 h-3.5 ${isAuditingCompetitors ? 'animate-spin' : ''}`} />
                  <span>{isAuditingCompetitors ? 'Auditing Footprints...' : 'Execute Competitor Audit'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Competitor Benchmark Comparison Table */}
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider font-mono">
                Local 3-Pack Competitors ({activeAuditReport.territory} {activeAuditReport.niche})
              </h4>
              <div className="text-[10.5px] font-mono text-text-secondary flex items-center gap-3">
                <span>Avg Rating: <strong className="text-text-primary">{activeAuditReport.marketAverages.avgRating}★</strong></span>
                <span>Avg Speed: <strong className="text-amber-500">{activeAuditReport.marketAverages.avgMobileSpeed}/100</strong></span>
                <span>SSL Secured: <strong className="text-emerald-500">{activeAuditReport.marketAverages.sslSecuredPct}%</strong></span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border-dim text-[10px] font-mono text-text-tertiary uppercase">
                    <th className="py-2 px-3">Rank</th>
                    <th className="py-2 px-3">Competitor Entity</th>
                    <th className="py-2 px-3">Google Rating</th>
                    <th className="py-2 px-3">Review Velocity</th>
                    <th className="py-2 px-3">Mobile Speed (ESTIMATE)</th>
                    <th className="py-2 px-3">SSL Security</th>
                    <th className="py-2 px-3">Vulnerability Gap & Angle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim/60">
                  {activeAuditReport.competitors.map((c) => (
                    <tr key={c.businessName} className="hover:bg-bg-subtle/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-accent">
                        #{c.threePackRank}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-text-primary">{c.businessName}</div>
                        <div className="text-[10px] text-text-tertiary font-mono">{c.domain}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-amber-500">{c.googleRating} ★</div>
                        <div className="text-[10px] text-text-tertiary font-mono">({c.reviewCount} reviews)</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-text-secondary">
                        {c.reviewVelocity}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          c.mobileSpeedScore < 50
                            ? 'bg-rose-500/15 text-rose-500'
                            : c.mobileSpeedScore < 70
                            ? 'bg-amber-500/15 text-amber-500'
                            : 'bg-emerald-500/15 text-emerald-500'
                        }`}>
                          {c.mobileSpeedScore}/100
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          c.sslStatus === 'secured'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-rose-500/15 text-rose-500'
                        }`}>
                          {(c.sslStatus || 'missing').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <p className="text-[11px] text-text-secondary leading-snug">{c.vulnerabilityGap}</p>
                        <p className="text-[10.5px] text-accent font-medium mt-0.5">Angle: {c.attackAngle}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deficit Matrix & Tactical Penetration Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Deficit Matrix */}
            <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-3">
              <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Competitive Deficit Matrix</span>
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
                  <span className="font-mono text-[10px] font-bold text-accent uppercase block">Review Freshness Freeze</span>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{activeAuditReport.deficitMatrix.reviewVolumeGaps}</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
                  <span className="font-mono text-[10px] font-bold text-amber-500 uppercase block">Mobile Speed Leakages</span>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{activeAuditReport.deficitMatrix.speedVulnerabilities}</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
                  <span className="font-mono text-[10px] font-bold text-indigo-400 uppercase block">Schema Microdata Omission</span>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{activeAuditReport.deficitMatrix.localSchemaGaps}</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
                  <span className="font-mono text-[10px] font-bold text-emerald-500 uppercase block">Weekend Ad Budget Arbitrage</span>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{activeAuditReport.deficitMatrix.paidSearchArbitrage}</p>
                </div>
              </div>
            </div>

            {/* Tactical 4-Step Penetration Plan */}
            <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-3">
              <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Tactical Market Penetration Action Plan</span>
              </h4>
              <div className="space-y-2.5 text-xs">
                {activeAuditReport.tacticalActionPlan.map((step) => (
                  <div key={step.step} className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary text-xs">
                        Step {step.step}: {step.title}
                      </span>
                      <span className="text-[10px] font-mono text-accent font-bold">
                        {step.timeframe}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">{step.action}</p>
                    <div className="text-[10px] font-mono text-emerald-500 font-bold pt-0.5">
                      Target: {step.expectedOutcome}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
