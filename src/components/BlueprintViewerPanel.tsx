import React, { useState } from 'react';
import { 
  FileText, 
  ExternalLink, 
  Copy, 
  Check, 
  Maximize2, 
  Layout, 
  Columns, 
  Cpu, 
  Share2, 
  Eye, 
  Sparkles,
  Zap,
  Terminal,
  Download
} from 'lucide-react';

interface BlueprintViewerPanelProps {
  onBackToDashboard?: () => void;
}

export const BlueprintViewerPanel: React.FC<BlueprintViewerPanelProps> = ({
  onBackToDashboard
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'audit' | 'prompt'>('preview');

  const claudeReviewPrompt = `You are reviewing the HALBiz Operating Intelligence System blueprint (attached in hal-app-overview.html).
HALBiz is an autonomous Business Operating Intelligence Platform designed for trade contractors and high-ticket service operators.

Key Areas for Your Architectural & Spatial Optimization:
1. CANVAS DENSITY & AUTO-CAD MULTI-DOCKING:
   - Audit the center canvas layouts across Mission Control, Leads Data Explorer, Campaigns, and the Hermes Agent Lab.
   - Propose an AutoCAD / Bloomberg-grade docked split-screen workspace where operators can browse 140+ prospect records on the left while simultaneously drafting KAISO cold outreach sequences or tweaking Bayesian prior weights on the right.

2. OMNI-CHANNEL CONTRACTOR COMMS HUB:
   - Detail the architecture for a unified VoIP + SMS Missed-Call Auto-Recovery engine into Zone 4 (Contextual Inspector).
   - How should Twilio webhook callbacks be bridged into the encrypted SQLite/PostgreSQL store?

3. CLIENT PORTAL & AGENCY WHITE-LABELING:
   - Provide recommendations for the client-facing delivery portal (/public/portal) with live Google PageSpeed tracking, ad ROAS, and transparent conversion logs without exposing raw backend keys.

Review hal-app-overview.html and provide:
A) Spatial layout improvements (exact grid percentages, density configurations).
B) Missing micro-workflows to maximize contractor client acquisition velocity.
C) Code-level architectural additions for React + Tailwind + Vite.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(claudeReviewPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleOpenNewWindow = () => {
    window.open('/hal-app-overview.html', '_blank');
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-[#0b0f19] border border-border-dim/80 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                HALBiz Interactive System Blueprint
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                CLAUDE DOSSIER
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live standalone interactive representation of the 5-zone architecture, AutoCAD density canvas, and Hermes Lab.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          {/* Direct open in new tab */}
          <button
            onClick={handleOpenNewWindow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-mono font-semibold transition-all cursor-pointer"
            title="Open in new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in New Tab</span>
          </button>

          {/* Copy Claude Prompt */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-mono font-semibold transition-all cursor-pointer"
            title="Copy prompt for Claude"
          >
            {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPrompt ? 'Prompt Copied!' : 'Copy Prompt for Claude'}</span>
          </button>
        </div>
      </div>

      {/* Subnav switcher */}
      <div className="flex items-center justify-between border-b border-border-dim/60 px-1 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Claude Spatial Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all cursor-pointer ${
              activeTab === 'prompt'
                ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Prompt Dossier</span>
          </button>
        </div>

        <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
          URL: /hal-app-overview.html (Single-File Self-Contained)
        </span>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 bg-[#090d16] border border-border-dim/60 rounded-xl overflow-hidden shadow-inner flex flex-col min-h-[600px]">
        {activeTab === 'preview' && (
          <div className="relative w-full h-full flex-1 flex flex-col">
            <div className="bg-[#0e1320] border-b border-border-dim/60 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white font-semibold">Embedded Blueprint View</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400 text-[10px]">Interact with tabs, density toggle, inspector, and models directly</span>
              </div>
              <a 
                href="/hal-app-overview.html" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-cyan-400 flex items-center gap-1 text-cyan-500 font-bold"
              >
                <span>Direct Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <iframe
              src="/hal-app-overview.html"
              title="HALBiz System Architecture Blueprint"
              className="w-full flex-1 h-[680px] border-none bg-[#0a0c10]"
            />
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm max-w-5xl mx-auto w-full">
            <div className="border border-cyan-500/30 bg-cyan-950/20 rounded-xl p-4">
              <h2 className="text-white font-bold text-sm flex items-center gap-2 font-mono uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Dossier Summary for Claude: High-Density Expansion
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                HALBiz already features 142 real scraped leads, PageSpeed mobile tests, SSL security inspection, and AES-GCM-256 PII encryption. 
                Below is the spatial and functional roadmap to present to Claude for next-phase buildouts.
              </p>
            </div>

            {/* Audit Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-border-dim/70 bg-[#0e1422] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold">
                  <span>1. SCREEN REAL ESTATE</span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-[10px]">ULTRAWIDE</span>
                </div>
                <h3 className="text-white font-semibold text-xs">AutoCAD Docked Split-Screen</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Currently, operators switch back and forth between the Leads list, Campaigns, and the Hermes prompt studio. Claude can optimize wide screens by docking the Lead Table and Hermes Output side-by-side (50% / 50% split) with shared synchronization.
                </p>
              </div>

              <div className="border border-border-dim/70 bg-[#0e1422] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-bold">
                  <span>2. ACTIVE TELEPHONY</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px]">TWILIO</span>
                </div>
                <h3 className="text-white font-semibold text-xs">Omni-Channel Voice & SMS Hub</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Upgrade Zone 4 (the Right Contextual Inspector) from an informational summary panel into a live telephonic dialer and SMS command center for instant missed-call lead recovery in Winnipeg, Calgary, and Edmonton.
                </p>
              </div>

              <div className="border border-border-dim/70 bg-[#0e1422] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-amber-400 font-bold">
                  <span>3. REPUTATION SHIELD</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px]">GOOGLE REVIEWS</span>
                </div>
                <h3 className="text-white font-semibold text-xs">Automated Review Sentry</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Auto-scrape new Google Business reviews every 12 hours. If a contractor drops below 4.5 stars, Hermes automatically drafts a customized review-recovery SMS blast to their past satisfied customer database.
                </p>
              </div>
            </div>

            {/* Architecture Spec */}
            <div className="border border-border-dim/70 bg-[#0e1422] rounded-xl p-5 space-y-3">
              <h3 className="text-white font-semibold text-xs font-mono uppercase tracking-wider text-slate-400">
                Current Production Stack & Constraints
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-slate-900/60 p-2.5 rounded border border-border-dim/40">
                  <div className="text-slate-500 text-[10px]">CORE RUNTIME</div>
                  <div className="text-white font-bold mt-0.5">Node 20 + TSX</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded border border-border-dim/40">
                  <div className="text-slate-500 text-[10px]">DB DUAL-DRIVE</div>
                  <div className="text-white font-bold mt-0.5">SQLite + Neon Cloud</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded border border-border-dim/40">
                  <div className="text-slate-500 text-[10px]">SECURITY</div>
                  <div className="text-emerald-400 font-bold mt-0.5">AES-GCM-256 PII</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded border border-border-dim/40">
                  <div className="text-slate-500 text-[10px]">AUTONOMOUS AI</div>
                  <div className="text-cyan-400 font-bold mt-0.5">Hermes + Gemini</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prompt' && (
          <div className="p-6 overflow-y-auto space-y-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-sm font-mono uppercase tracking-wide">
                  Ready-To-Paste Claude Prompt
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send this prompt to Claude along with <code className="text-cyan-400 bg-cyan-950/40 px-1 py-0.5 rounded">hal-app-overview.html</code>.
                </p>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold transition-all cursor-pointer shadow-md"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-[#070a12] border border-border-dim/80 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed shadow-inner selection:bg-cyan-500/30 selection:text-white">
                {claudeReviewPrompt}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
