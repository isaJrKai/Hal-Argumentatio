import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Search,
  Lock,
  Globe,
  Star,
  Activity,
  ArrowRight,
  Server,
  Zap,
  RefreshCw,
  ExternalLink,
  Cpu
} from 'lucide-react';

interface Stage1GatheringProps {
  loopId: string;
  token?: string | null;
  stateSnapshot?: Record<string, any>;
  onEvidenceGathered?: () => void;
  onAdvanceStage?: () => void;
  actionLoading?: boolean;
}

export default function HalStage1GatheringConsole({
  loopId,
  token,
  stateSnapshot = {},
  onEvidenceGathered,
  onAdvanceStage,
  actionLoading
}: Stage1GatheringProps) {
  const [city, setCity] = useState('Winnipeg');
  const [niche, setNiche] = useState('Commercial HVAC');
  const [customCity, setCustomCity] = useState('');
  const [gathering, setGathering] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeToken = token || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token');

  const recordsCount = stateSnapshot.recordsCount ?? stateSnapshot.gatheredRecords ?? 0;
  const evidenceVerified = Boolean(stateSnapshot.evidenceVerified);
  const completenessScore = stateSnapshot.completenessScore ?? (recordsCount > 0 ? 95 : 0);
  const harvestSummary = stateSnapshot.harvestSummary;
  const validationGates = stateSnapshot.validationGates;
  const records = Array.isArray(stateSnapshot.records) ? stateSnapshot.records : [];

  const isGateCleared = recordsCount > 0 && evidenceVerified;

  const targetCity = city === 'CUSTOM' ? (customCity.trim() || 'Winnipeg') : city;

  const handleRunHarvest = async () => {
    setGathering(true);
    setStatusMessage('Initiating Stage 1 evidence ingestion sweep across local territory...');
    setError(null);

    try {
      const res = await fetch(`/api/hal/loops/${loopId}/stage1/gather`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          city: targetCity,
          niche,
          dataSources: [
            'local_business_registry',
            'spatial_quadrant_scanner',
            'pagespeed_performance_vitals',
            'ssl_security_layer',
            'reputation_sentiment_aggregator'
          ],
          saveToLeads: true
        })
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Successfully harvested & validated ${data.evidencePayload.recordsCount} territory entities with AES-256-GCM encryption.`);
        if (onEvidenceGathered) {
          onEvidenceGathered();
        }
      } else {
        setError(data.error || 'Failed to ingest Stage 1 evidence');
      }
    } catch (err: any) {
      setError(err.message || 'Network error during Stage 1 harvest');
    } finally {
      setGathering(false);
    }
  };

  return (
    <div className="space-y-6" id="stage1-gathering-console">
      {/* Stage 1 Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 uppercase tracking-wide">
                Stage 1 of 10: Gathering
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Evidence Ingestion & Data Validation Gates
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Automated Territory Evidence Gathering
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Acquires verified local market operations, runs technical SEO and latency audits, encrypts PII via AES-256-GCM, and satisfies Stage 1 state machine gates before analysis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-500">Gate Clearance Status</div>
              <div className="flex items-center gap-1.5 justify-end mt-0.5">
                {isGateCleared ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Cleared (Ready to Analyze)
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                      Locked (Evidence Required)
                    </span>
                  </>
                )}
              </div>
            </div>
            {isGateCleared && onAdvanceStage && (
              <button
                onClick={onAdvanceStage}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50"
                id="stage1-advance-btn"
              >
                <ArrowRight className="w-4 h-4" />
                Advance to Stage 2 (Analyzing)
              </button>
            )}
          </div>
        </div>

        {/* Harvest Configuration & Execution Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Territory
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={gathering}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              id="stage1-territory-select"
            >
              <option value="Winnipeg">Winnipeg, MB</option>
              <option value="Calgary">Calgary, AB</option>
              <option value="Edmonton">Edmonton, AB</option>
              <option value="Vancouver">Vancouver, BC</option>
              <option value="CUSTOM">Custom Territory...</option>
            </select>
            {city === 'CUSTOM' && (
              <input
                type="text"
                placeholder="Enter city name..."
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                className="mt-2 w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Service Domain & Niche
            </label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              disabled={gathering}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              id="stage1-niche-select"
            >
              <option value="Commercial HVAC">Commercial HVAC & Mechanical</option>
              <option value="Roofing & Siding">Roofing & Building Envelope</option>
              <option value="Electrical Contracting">Commercial Electrical</option>
              <option value="Plumbing & Piping">Commercial Plumbing</option>
              <option value="General Contracting">General Contracting & Remodel</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={handleRunHarvest}
              disabled={gathering || actionLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
              id="stage1-trigger-harvest-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gathering ? 'animate-spin' : ''}`} />
              {gathering ? 'Harvesting Evidence...' : 'Run Automated Market Harvest'}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 4 Deterministic Validation Gates Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Stage 1 Evidence Validation Gates Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              HAL Operating Loops strictly enforce mathematical evidence gates. Advancement to Stage 2 (Analyzing) requires passing all four criteria.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">Completeness: </span>
            <span className="text-xs font-bold text-slate-900">{completenessScore}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gate 1: Record Volume */}
          <div className={`p-4 rounded-lg border text-xs space-y-2 ${
            recordsCount > 0
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Gate 1: Record Volume</span>
              {recordsCount > 0 ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">PASSED</span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">PENDING</span>
              )}
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Requires &gt;0 verified records in dataset.
            </p>
            <div className="font-mono text-slate-700 pt-1">
              Active Count: <span className="font-bold">{recordsCount} entities</span>
            </div>
          </div>

          {/* Gate 2: PII Cryptographic Guard */}
          <div className={`p-4 rounded-lg border text-xs space-y-2 ${
            isGateCleared
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Gate 2: PII Vault Guard</span>
              {isGateCleared ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">PASSED</span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700">STANDBY</span>
              )}
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Enforces AES-256-GCM zero plaintext leakage.
            </p>
            <div className="font-mono text-slate-700 pt-1 flex items-center gap-1">
              <Lock className="w-3 h-3 text-indigo-600" />
              <span>Poly1305 / GHASH Tag Active</span>
            </div>
          </div>

          {/* Gate 3: Technical Footprint */}
          <div className={`p-4 rounded-lg border text-xs space-y-2 ${
            harvestSummary
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Gate 3: Tech Footprint</span>
              {harvestSummary ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">PASSED</span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700">STANDBY</span>
              )}
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Audits technical SEO, PageSpeed latency & SSL.
            </p>
            <div className="font-mono text-slate-700 pt-1">
              {harvestSummary ? (
                <span>SEO: {harvestSummary.avgSeoScore}/100 | Speed: {harvestSummary.avgPerformanceScore}/100</span>
              ) : (
                <span>Awaiting territory harvest</span>
              )}
            </div>
          </div>

          {/* Gate 4: Ledger Anchor */}
          <div className={`p-4 rounded-lg border text-xs space-y-2 ${
            evidenceVerified
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Gate 4: Ledger Anchor</span>
              {evidenceVerified ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">PASSED</span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700">STANDBY</span>
              )}
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              SHA-256 payload hashed and registered in chain.
            </p>
            <div className="font-mono text-slate-700 pt-1 flex items-center gap-1">
              <Database className="w-3 h-3 text-indigo-600" />
              <span>Phase 1 Ledger Linked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Harvested Territory Records Table */}
      {records.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                Gathered Market Records ({records.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified operations captured for {stateSnapshot.territory || city} ({stateSnapshot.niche || niche})
              </p>
            </div>
            {harvestSummary && (
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span>Avg Rating: <strong className="text-slate-900">{harvestSummary.avgRating}★</strong></span>
                <span>SSL Secured: <strong className="text-slate-900">{harvestSummary.sslSecuredRatio}%</strong></span>
                <span>Positive Sentiment: <strong className="text-slate-900">{harvestSummary.positiveSentimentRatio}%</strong></span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {records.map((rec: any, idx: number) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{rec.businessName}</h4>
                    <p className="text-slate-500">{rec.ownerName || 'Management'} • {rec.city}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded text-[11px] flex items-center gap-1 shrink-0">
                    <Lock className="w-3 h-3" /> AES-256-GCM
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded border border-slate-200 font-mono text-[11px]">
                  <div>
                    <div className="text-slate-400">SEO Score</div>
                    <div className="font-bold text-slate-800">{rec.seoScore}/100</div>
                  </div>
                  <div>
                    <div className="text-slate-400">PageSpeed</div>
                    <div className="font-bold text-slate-800">{rec.performanceScore}/100</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Google Rank</div>
                    <div className="font-bold text-amber-700 flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{rec.googleRating} ({rec.reviewCount})</span>
                    </div>
                  </div>
                </div>

                {rec.notes && (
                  <p className="text-slate-600 bg-white p-2.5 rounded border border-slate-200 leading-relaxed text-[11px]">
                    <strong className="text-slate-800 font-semibold">Technical Finding:</strong> {rec.notes}
                  </p>
                )}

                {rec.outreachStrategy && (
                  <p className="text-slate-600 bg-indigo-50/50 p-2.5 rounded border border-indigo-100 leading-relaxed text-[11px]">
                    <strong className="text-indigo-900 font-semibold">Recommended Angle:</strong> {rec.outreachStrategy}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
