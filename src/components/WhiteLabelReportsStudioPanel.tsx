import React, { useState } from 'react';
import { 
  Building2, 
  Printer, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  Globe, 
  Zap, 
  Award, 
  CheckCircle2, 
  Calendar,
  Share2,
  ExternalLink,
  Download,
  ChevronDown
} from 'lucide-react';
import { useBusinessContext } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';
import { ShareToEmailModal } from './ShareToEmailModal';

export const WhiteLabelReportsStudioPanel: React.FC<{ token: string | null }> = () => {
  const { activeIndustry, activeCity, activeNiche, workspaceConfig, formatCurrency } = useBusinessContext();
  const { showToast } = useToast();

  const [businessName, setBusinessName] = useState('Premier Heating & Air');
  const [websiteUrl, setWebsiteUrl] = useState('www.premierairtx.com');
  const [seoScore, setSeoScore] = useState(62);
  const [speedScore, setSpeedScore] = useState(41);
  const [monthlyLostRevenue, setMonthlyLostRevenue] = useState(6800);
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const agencyDisplayName = workspaceConfig.agencyName || workspaceConfig.operatorName || 'HAL Business Operating Intelligence';

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-base text-text-primary select-none overflow-hidden">
      
      {/* HEADER */}
      <div className="px-5 py-3 border-b border-border-dim bg-bg-raised flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary leading-tight font-display">White-Label Report Studio</h2>
            <p className="text-[11px] text-text-secondary">Client-ready competitive website & technical SEO teardown reports</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Parameters Toggle */}
          <button
            onClick={() => setShowControlsDrawer(!showControlsDrawer)}
            className="md:hidden px-2.5 py-1.5 rounded-lg border border-border-dim bg-bg-subtle text-xs font-mono text-cyan-400 flex items-center gap-1 cursor-pointer"
          >
            <span>{showControlsDrawer ? 'Hide Parameters' : 'Audit Parameters'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showControlsDrawer ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-lg border border-border-dim bg-bg-subtle hover:bg-bg-raised text-xs font-mono text-text-primary transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Share Audit</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs font-sans transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* BODY SPLIT */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* LEFT AUDIT CONTROLS (RESPONSIVE) */}
        <div className={`${showControlsDrawer ? 'block' : 'hidden'} md:block w-full md:w-80 shrink-0 border-r border-border-dim bg-bg-raised/70 p-4 max-h-72 md:max-h-none overflow-y-auto space-y-4 print:hidden z-10`}>
          <span className="text-[11px] font-mono text-text-tertiary uppercase font-bold block">Audit Parameters</span>
          
          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">Prospect Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full bg-bg-base border border-border-dim rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-hidden focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">Target Website URL</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full bg-bg-base border border-border-dim rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-hidden focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">Mobile Speed Score ({speedScore}/100)</label>
            <input
              type="range"
              min="10"
              max="100"
              value={speedScore}
              onChange={(e) => setSpeedScore(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">Local SEO Score ({seoScore}/100)</label>
            <input
              type="range"
              min="10"
              max="100"
              value={seoScore}
              onChange={(e) => setSeoScore(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">Estimated Monthly Lost Revenue</label>
            <input
              type="number"
              value={monthlyLostRevenue}
              onChange={(e) => setMonthlyLostRevenue(Number(e.target.value))}
              className="w-full bg-bg-base border border-border-dim rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-hidden focus:border-cyan-400"
            />
          </div>
        </div>

        {/* CENTER REPORT CANVAS */}
        <div className="flex-1 bg-bg-subtle/50 p-6 overflow-y-auto flex items-center justify-center print:p-0 print:bg-white">
          <div className="w-full max-w-3xl bg-bg-raised text-text-primary rounded-xl shadow-xl p-8 sm:p-12 border border-border-dim font-sans space-y-6 print:border-none print:shadow-none print:bg-white print:text-black">
            
            {/* BRAND HEADER */}
            <div className="flex justify-between items-start border-b border-border-dim pb-6 print:border-black">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-600 print:text-black">
                  TECHNICAL OPERATING AUDIT
                </span>
                <h1 className="text-2xl font-black tracking-tight text-text-primary mt-1 font-display print:text-black">
                  {businessName}
                </h1>
                <p className="text-xs text-text-secondary mt-1 print:text-gray-600">
                  Conducted by {agencyDisplayName} for {activeCity} Territory
                </p>
              </div>

              <div className="text-right font-mono text-xs text-text-secondary print:text-gray-600">
                <p>{new Date().toLocaleDateString()}</p>
                <p className="text-rose-500 font-bold">Priority: High</p>
              </div>
            </div>

            {/* SCORE SUMMARY TILES */}
            <div className="grid grid-cols-3 gap-4 text-center font-mono">
              <div className="p-4 bg-bg-subtle rounded-xl border border-border-dim print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] text-text-tertiary uppercase font-bold block print:text-gray-500">MOBILE PERFORMANCE</span>
                <span className="text-3xl font-black text-rose-500 mt-1 block">{speedScore}/100</span>
                <span className="text-[10px] text-text-secondary print:text-gray-600">Core Web Vitals Failing</span>
              </div>
              <div className="p-4 bg-bg-subtle rounded-xl border border-border-dim print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] text-text-tertiary uppercase font-bold block print:text-gray-500">LOCAL SEO INDEX</span>
                <span className="text-3xl font-black text-amber-500 mt-1 block">{seoScore}/100</span>
                <span className="text-[10px] text-text-secondary print:text-gray-600">Map Pack Under-optimized</span>
              </div>
              <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/20 print:bg-rose-50 print:border-rose-200">
                <span className="text-[10px] text-rose-500 uppercase font-bold block print:text-rose-600">LOST REVENUE LEAKAGE</span>
                <span className="text-2xl font-black text-rose-500 mt-1 block print:text-rose-700">{formatCurrency(monthlyLostRevenue)}/mo</span>
                <span className="text-[10px] text-rose-500/80 print:text-rose-600">Uncaptured Phone Calls</span>
              </div>
            </div>

            {/* KEY FINDINGS */}
            <div className="space-y-3 text-xs text-text-secondary leading-relaxed print:text-gray-800">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide print:text-black">Critical Territory Bottlenecks</h3>
              <div className="space-y-2">
                <div className="p-3 bg-bg-subtle border border-border-dim rounded-lg flex items-start gap-3 print:bg-slate-50 print:border-slate-200">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary print:text-black">4.8s Mobile Loading Delay on 4G LTE:</strong> Over 53% of emergency homeowners in {activeCity} bounce if the page does not render click-to-call within 2.0 seconds.
                  </div>
                </div>
                <div className="p-3 bg-bg-subtle border border-border-dim rounded-lg flex items-start gap-3 print:bg-slate-50 print:border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary print:text-black">Missing Local Business Schema Markup:</strong> Google Local algorithm cannot verify emergency service radius, causing competitors to rank ahead in the 3-Pack.
                  </div>
                </div>
              </div>
            </div>

            {/* RECOMMENDED REMEDIATION */}
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs text-emerald-600 print:bg-emerald-50 print:border-emerald-200 print:text-emerald-900 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-500 print:text-emerald-700 block">Proposed Remediation</span>
              <p className="font-semibold text-text-primary print:text-black">
                Deploy 1-tap mobile emergency dispatch landing page + direct Google Ads campaign routing.
              </p>
              <p className="text-emerald-600/90 print:text-emerald-700 text-[11px]">
                Target turnaround: 48 hours. Projected recovery: 12-18 additional qualified booked jobs per month.
              </p>
            </div>

          </div>
        </div>

      </div>

      <ShareToEmailModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="White-Label Teardown & Speed Audit"
        itemType="audit"
        shareUrl={`${window.location.origin}/audit/preview`}
        businessName={businessName}
      />

    </div>
  );
};
