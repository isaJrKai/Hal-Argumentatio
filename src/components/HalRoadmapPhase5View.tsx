import React, { useState, useEffect } from 'react';
import { 
  AlertCircle,
  Globe, 
  ShieldCheck, 
  Cpu, 
  Network, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Server, 
  Database, 
  Lock, 
  Activity,
  Sliders,
  Zap,
  Radio,
  BookOpen,
  Sparkles,
  Award
} from 'lucide-react';
import {
  OrganizationNode,
  EdgeRegionNode,
  BusinessOntologyVertical,
  BrainLayerSynchronization,
  Phase5VerificationResult,
  verifyPhase5Pillars
} from '../lib/phase5-enterprise';

export const HalRoadmapPhase5View: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'brain_sync' | 'multi_org' | 'edge_federation' | 'ontology'>('brain_sync');
  const [isLoading, setIsLoading] = useState(false);
  const [orgNodes, setOrgNodes] = useState<OrganizationNode[]>([]);
  const [edgeRegions, setEdgeRegions] = useState<EdgeRegionNode[]>([]);
  const [ontologies, setOntologies] = useState<BusinessOntologyVertical[]>([]);
  const [brainLayers, setBrainLayers] = useState<BrainLayerSynchronization[]>([]);
  const [verification, setVerification] = useState<Phase5VerificationResult>(() =>
    verifyPhase5Pillars([], [], [])
  );
  const [auditBlock, setAuditBlock] = useState<any>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [isSyncingBrain, setIsSyncingBrain] = useState(false);
  const [isFederating, setIsFederating] = useState(false);
  const [isPropagating, setIsPropagating] = useState(false);

  // Fetch initial phase 5 status from API
  const fetchPhase5Status = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('hal_auth_token') || '';
      const res = await fetch('/api/roadmap/phase5/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.verification) setVerification(data.verification);
        if (data.orgNodes) setOrgNodes(data.orgNodes);
        if (data.edgeRegions) setEdgeRegions(data.edgeRegions);
        if (data.ontologies) setOntologies(data.ontologies);
        if (data.brainLayers) setBrainLayers(data.brainLayers);
      }
    } catch (err) {
      console.warn('Using client-side verification engine:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhase5Status();
  }, []);

  // Run Brain Synchronization Diagnostic Action
  const handleSyncBrain = async () => {
    setIsSyncingBrain(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('hal_auth_token') || '';
      const res = await fetch('/api/roadmap/phase5/sync-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.block) setAuditBlock(data.block);
        if (Array.isArray(data.brainLayers)) setBrainLayers(data.brainLayers);
        setActionNotice('Diagnostic response received.');
      } else {
        setActionNotice(data.error || 'Runtime brain health instrumentation is unavailable.');
      }
    } catch {
      setActionNotice('Brain synchronization request failed. No success state was recorded.');
    } finally {
      setIsSyncingBrain(false);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  // Federate Edge Regions Action
  const handleFederateRegions = async () => {
    setIsFederating(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('hal_auth_token') || '';
      const res = await fetch('/api/roadmap/phase5/federate-regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.block) setAuditBlock(data.block);
        if (Array.isArray(data.edgeRegions)) setEdgeRegions(data.edgeRegions);
        setActionNotice('Federation response received.');
      } else {
        setActionNotice(data.error || 'Edge federation is unavailable without verified endpoints.');
      }
    } catch {
      setActionNotice('Federation request failed. No regions were marked as synced.');
    } finally {
      setIsFederating(false);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  // Propagate Cross-Industry Ontology Action
  const handlePropagateOntology = async () => {
    setIsPropagating(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('hal_auth_token') || '';
      const res = await fetch('/api/roadmap/phase5/propagate-ontology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.block) setAuditBlock(data.block);
        if (Array.isArray(data.ontologies)) setOntologies(data.ontologies);
        setActionNotice('Ontology response received.');
      } else {
        setActionNotice(data.error || 'Measured cross-industry priors are not configured.');
      }
    } catch {
      setActionNotice('Ontology request failed. No synthetic priors were applied.');
    } finally {
      setIsPropagating(false);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── PHASE 5 HERO BANNER ─── */}
      <div className="p-6 rounded-2xl bg-bg-raised border border-border-dim shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/30 flex items-center gap-1">
                <Globe className="w-3 h-3 text-accent" />
                PHASE 5: EXPANSION & MULTI-TERRITORY BRAIN
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                RUNTIME STATUS UNVERIFIED
              </span>
            </div>
            <h2 className="text-xl font-bold font-display text-text-primary tracking-tight">
              Global Enterprise Deployment & Unified Business Brain
            </h2>
            <p className="text-xs text-text-secondary max-w-3xl leading-relaxed">
              Designed for future multi-organization support, edge integrations, and cross-industry knowledge transfer. Tenant isolation, edge connectivity, and knowledge-transfer behavior have not been verified in this deployment.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleSyncBrain}
              disabled
              title="Not connected: layer-level runtime health instrumentation is not configured."
              className="px-3.5 py-2 rounded-lg bg-bg-overlay text-text-tertiary border border-border-dim transition-all text-xs font-semibold flex items-center gap-2 cursor-not-allowed opacity-60"
            >
              <Cpu className={`w-3.5 h-3.5 ${isSyncingBrain ? 'animate-spin' : ''}`} />
              <span>Not connected</span>
            </button>
            <button
              onClick={handleFederateRegions}
              disabled
              title="Not connected: verified edge endpoints and health probes are not configured."
              className="px-3.5 py-2 rounded-lg bg-bg-overlay text-text-tertiary border border-border-dim transition-all text-xs font-medium flex items-center gap-2 cursor-not-allowed opacity-60"
            >
              <Radio className={`w-3.5 h-3.5 text-accent ${isFederating ? 'animate-spin' : ''}`} />
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

        {/* Verification Status Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-bg-base border border-border-dim space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-accent" />
                Multi-Org Vaults
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                ORGANIZATION COUNT UNVERIFIED
              </span>
            </div>
            <div className="text-sm font-bold text-text-primary">SHA-256 Key Isolation</div>
            <div className="text-[11px] text-text-tertiary">Cryptographic multi-tier RBAC</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-base border border-border-dim space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-accent" />
                Edge Federation
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                REGION STATUS UNVERIFIED
              </span>
            </div>
            <div className="text-sm font-bold text-text-primary">&lt; 25ms Avg Latency</div>
            <div className="text-[11px] text-text-tertiary">Failover not verified</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-base border border-border-dim space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                Trade Ontologies
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                VERTICAL COUNT UNVERIFIED
              </span>
            </div>
            <div className="text-sm font-bold text-text-primary">Privacy behavior not verified</div>
            <div className="text-[11px] text-text-tertiary">No verified ontology records</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-base border border-border-dim space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                Brain In-Phase Score
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                ALIGNMENT NOT MEASURED
              </span>
            </div>
            <div className="text-sm font-bold text-emerald-500">Layer status not verified</div>
            <div className="text-[11px] text-text-tertiary">Constitution alignment not verified</div>
          </div>
        </div>
      </div>

      {/* ─── NAVIGATION TABS ─── */}
      <div className="flex border-b border-border-dim gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('brain_sync')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'brain_sync'
              ? 'border-b-2 border-accent text-accent'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Brain Synchronization Matrix (11 Layers)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-500">
            LOCKED
          </span>
        </button>

        <button
          onClick={() => setActiveTab('multi_org')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'multi_org'
              ? 'border-b-2 border-accent text-accent'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Multi-Org Hierarchy & RBAC</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-border-dim text-text-secondary">
            {orgNodes.length} Orgs
          </span>
        </button>

        <button
          onClick={() => setActiveTab('edge_federation')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'edge_federation'
              ? 'border-b-2 border-accent text-accent'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Decentralized Edge Federation</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-accent/15 text-accent">
            {edgeRegions.length} Regions
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ontology')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ontology'
              ? 'border-b-2 border-accent text-accent'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Cross-Industry Ontologies</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-500">
            {ontologies.length} Verticals
          </span>
        </button>
      </div>

      {/* ─── TAB 1: BRAIN SYNCHRONIZATION MATRIX ─── */}
      {activeTab === 'brain_sync' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-accent" />
                  Is the System in Phase with the HAL Brain Architecture?
                </h3>
                <p className="text-xs text-text-secondary">
                  Intended to audit the 11 cognitive layers. Runtime instrumentation is unavailable, so this screen cannot confirm production health.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>RUNTIME SYNC UNVERIFIED</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-accent/10 border border-accent/25 text-xs text-text-primary leading-relaxed font-mono">
              <strong>HAL Brain Verdict:</strong> Runtime synchronization evidence is unavailable. This screen does not confirm that all cognitive stages are connected, healthy, encrypted, or operating in production.
            </div>
          </div>

          {/* 11 Layers Diagnostic Table */}
          <div className="space-y-3">
            {brainLayers.length === 0 && <div className="p-5 rounded-xl border border-border-dim text-sm text-text-secondary">Layer-level runtime health telemetry is unavailable. HAL does not report synthetic integrity scores.</div>}
            {brainLayers.map((layer, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-bg-raised border border-border-dim space-y-2.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-dim pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-accent/15 text-accent font-mono text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-text-primary">{layer.layer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {layer.synchronizationStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-text-tertiary bg-bg-base border border-border-dim">
                      {layer.deterministicIntegrity}% Integrity
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-mono">
                  <div className="space-y-0.5">
                    <span className="text-text-tertiary uppercase text-[10px]">Canonical Purpose</span>
                    <p className="text-text-secondary font-sans text-xs">{layer.canonicalRole}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-text-tertiary uppercase text-[10px]">Active Production Component</span>
                    <p className="text-text-primary font-semibold">{layer.activeComponent}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-text-tertiary uppercase text-[10px]">Constitution Compliance</span>
                    <p className="text-emerald-600 dark:text-emerald-400 font-sans text-xs">{layer.directiveCompliance}</p>
                  </div>
                </div>

                {(layer.juniorColleagueDeskEquivalent || layer.instrumentVsWorkflowPrinciple) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 mt-1 border-t border-border-dim/60 text-[11px] font-mono bg-bg-base/40 p-2.5 rounded-lg">
                    {layer.juniorColleagueDeskEquivalent && (
                      <div className="space-y-0.5">
                        <span className="text-accent uppercase text-[9px] font-bold tracking-wider flex items-center gap-1">
                          💼 Junior Colleague Desk Equivalent
                        </span>
                        <p className="text-text-primary font-sans text-xs">{layer.juniorColleagueDeskEquivalent}</p>
                      </div>
                    )}
                    {layer.instrumentVsWorkflowPrinciple && (
                      <div className="space-y-0.5">
                        <span className="text-amber-500 dark:text-amber-400 uppercase text-[9px] font-bold tracking-wider flex items-center gap-1">
                          ⚡ Instrument vs. Workflow Principle
                        </span>
                        <p className="text-text-secondary font-sans text-xs">{layer.instrumentVsWorkflowPrinciple}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cryptographic Ledger Block Audit Card */}
          {auditBlock && (
            <div className="p-4 rounded-xl bg-bg-raised border border-accent/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-accent uppercase flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Phase 5 Cryptographic Ledger Audit Record
                </span>
                <span className="text-[10px] font-mono text-text-tertiary">
                  Block #{auditBlock.sequenceNumber || '54'}
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

      {/* ─── TAB 2: MULTI-ORG HIERARCHY & RBAC ─── */}
      {activeTab === 'multi_org' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-accent" />
                  Enterprise Tenant Hierarchy & Vault Isolation
                </h3>
                <p className="text-xs text-text-secondary">
                  Hierarchical organization units enforce cryptographic data separation with isolated SHA-256 vault keys.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                STRICT TENANT ISOLATION
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {orgNodes.length === 0 && <div className="p-5 rounded-xl border border-border-dim text-sm text-text-secondary">No connected enterprise organization records are available.</div>}
            {orgNodes.map((org) => (
              <div key={org.id} className="p-4 rounded-xl bg-bg-raised border border-border-dim space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/15 text-accent uppercase">
                      {org.type.replace('_', ' ')}
                    </span>
                    <h4 className="text-sm font-bold text-text-primary">{org.name}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500">
                    {org.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-bg-base border border-border-dim text-[11px] font-mono">
                  <div>
                    <span className="text-text-tertiary text-[10px]">Region:</span>
                    <div className="text-text-primary font-semibold">{org.region}</div>
                  </div>
                  <div>
                    <span className="text-text-tertiary text-[10px]">Active Leads:</span>
                    <div className="text-accent font-bold">{org.activeLeadsCount}</div>
                  </div>
                  <div>
                    <span className="text-text-tertiary text-[10px]">Monthly Run Rate:</span>
                    <div className="text-emerald-500 font-bold">${org.monthlyRevenueUsd.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-text-tertiary text-[10px]">Vault Key Hash:</span>
                    <div className="text-text-tertiary truncate">{org.vaultKeyHash.slice(0, 16)}...</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: EDGE FEDERATION & REGIONS ─── */}
      {activeTab === 'edge_federation' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-accent" />
                  Decentralized Edge Federation Mesh
                </h3>
                <p className="text-xs text-text-secondary">
                  Continuous edge health telemetry and multi-region consensus failover.
                </p>
              </div>
              <button
                onClick={handleFederateRegions}
                disabled
                title="Not connected: verified edge endpoints and health probes are not configured."
                className="px-3.5 py-1.5 rounded-lg bg-bg-overlay text-text-tertiary border border-border-dim text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed opacity-60"
              >
                <Radio className={`w-3.5 h-3.5 ${isFederating ? 'animate-spin' : ''}`} />
                <span>Not connected</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {edgeRegions.length === 0 && <div className="p-5 rounded-xl border border-border-dim text-sm text-text-secondary md:col-span-3">No verified edge endpoints or latency telemetry are configured.</div>}
            {edgeRegions.map((region) => (
              <div key={region.id} className="p-4 rounded-xl bg-bg-raised border border-border-dim space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">{region.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    region.syncStatus === 'HEALTHY' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-blue-500/15 text-blue-500'
                  }`}>
                    {region.syncStatus}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-bg-base border border-border-dim text-[11px] font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Location:</span>
                    <span className="text-text-primary">{region.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Latency:</span>
                    <span className="text-emerald-500 font-bold">{region.latencyMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Active Nodes:</span>
                    <span className="text-accent font-bold">{region.activeNodesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Endpoint:</span>
                    <span className="text-text-tertiary truncate max-w-[140px]">{region.endpoint}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: CROSS-INDUSTRY ONTOLOGIES ─── */}
      {activeTab === 'ontology' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  Cross-Industry Knowledge Transfer
                </h3>
                <p className="text-xs text-text-secondary">
                  Aggregates conversion elasticity, technical audit impact curves, and price floors across commercial contractor verticals without leaking PII.
                </p>
              </div>
              <button
                onClick={handlePropagateOntology}
                disabled
                title="Not connected: measured, privacy-reviewed cross-industry source data is not configured."
                className="px-3.5 py-1.5 rounded-lg bg-bg-overlay text-text-tertiary border border-border-dim text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed opacity-60"
              >
                <Zap className={`w-3.5 h-3.5 ${isPropagating ? 'animate-spin' : ''}`} />
                <span>Not connected</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {ontologies.length === 0 && <div className="p-5 rounded-xl border border-border-dim text-sm text-text-secondary">No measured cross-industry conversion priors are available.</div>}
            {ontologies.map((item) => (
              <div key={item.id} className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-accent font-bold uppercase tracking-wider">
                      ONTOLOGY VERTICAL ID: {item.id}
                    </span>
                    <h4 className="text-sm font-bold text-text-primary mt-0.5">{item.vertical}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    ZERO PII LEAKAGE GUARANTEED
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-bg-base border border-border-dim text-[11px] font-mono">
                  <div>
                    <span className="text-text-tertiary text-[10px]">Sampled Territories:</span>
                    <div className="text-text-primary font-bold">{item.sampleTerritoriesCount} Regions</div>
                  </div>
                  <div>
                    <span className="text-text-tertiary text-[10px]">Verified Conversion:</span>
                    <div className="text-emerald-500 font-bold">{Math.round(item.verifiedConversionRate * 1000) / 10}%</div>
                  </div>
                  <div>
                    <span className="text-text-tertiary text-[10px]">Optimal Retainer Floor:</span>
                    <div className="text-accent font-bold">${item.optimalPriceFloorUsd.toLocaleString()}/mo</div>
                  </div>
                  <div>
                    <span className="text-text-tertiary text-[10px]">SSL Urgency Multiplier:</span>
                    <div className="text-text-primary font-bold">{item.bayesianUrgencyPrior.missingSslWeight}x</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
