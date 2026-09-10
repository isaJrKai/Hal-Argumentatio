import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Smartphone, 
  Tablet,
  Monitor, 
  Share2, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Code, 
  Eye, 
  RefreshCw,
  Copy,
  Check,
  Zap,
  Sliders,
  ChevronDown,
  Plus,
  Layers,
  PhoneCall,
  ShieldCheck,
  Clock,
  Settings2,
  Wand2,
  Palette,
  History,
  RotateCcw,
  Save,
  CheckCircle2,
  HelpCircle,
  FileText
} from 'lucide-react';
import { useBusinessContext } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';
import { LandingPageConfig, PageVersionSnapshot, TradeType } from './landing/types';
import { TRADE_TEMPLATES } from './landing/templates';
import { generateLandingPageHtml } from './landing/htmlGenerator';
import { SectionEditor } from './landing/SectionEditor';
import { BrandingControls } from './landing/BrandingControls';
import { SeoSchemaPanel } from './landing/SeoSchemaPanel';
import { AiGeneratorModal } from './landing/AiGeneratorModal';
import { QualityGatePanel } from './landing/QualityGatePanel';

export const LandingPageStudioPanel: React.FC<{ token: string | null }> = ({ token }) => {
  const { regionalProfile, activeNiche, workspaceConfig } = useBusinessContext();
  const { showToast } = useToast();

  // Active configuration state
  const [config, setConfig] = useState<LandingPageConfig>(() => {
    const base = JSON.parse(JSON.stringify(TRADE_TEMPLATES.plumbing));
    if (workspaceConfig.agencyName) base.businessName = workspaceConfig.agencyName;
    if (regionalProfile.city) base.city = regionalProfile.city;
    if (workspaceConfig.contactPhone) base.phone = workspaceConfig.contactPhone;
    return base;
  });

  // State management
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'builder' | 'templates' | 'branding' | 'seo' | 'quality_gates' | 'code'>('builder');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versionHistory, setVersionHistory] = useState<PageVersionSnapshot[]>([]);

  // Computed rendered HTML from current configuration
  const renderedHtml = generateLandingPageHtml(config);

  // Live URL for current page
  const liveUrl = typeof window !== 'undefined' ? `${window.location.origin}/landing/${config.id}` : '';

  // Record a version snapshot
  const saveSnapshot = (label: string, snapshotConfig: LandingPageConfig) => {
    const snapshot: PageVersionSnapshot = {
      id: 'v_' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      title: label,
      config: JSON.parse(JSON.stringify(snapshotConfig))
    };
    setVersionHistory(prev => [snapshot, ...prev].slice(0, 10));
  };

  // Fetch saved landing page artifacts from DB
  const fetchArtifacts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/hermes/artifacts', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const rawList = Array.isArray(data?.artifacts) ? data.artifacts : [];
        const landers = rawList.filter((a: any) => a.toolId === 'landing_page' || a.category === 'web');
        
        if (landers.length > 0) {
          setArtifacts(landers);
          const first = landers[0];
          setSelectedArtifactId(first.id);

          // If artifact has saved pageConfig, restore it
          if (first.content?.pageConfig) {
            setConfig(first.content.pageConfig);
          } else {
            // Personalize template with artifact title
            setConfig(prev => ({
              ...prev,
              id: first.id,
              title: first.title || prev.title
            }));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load landing pages, using live template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArtifacts();
  }, [token]);

  // Handle switching artifacts
  const handleSelectArtifact = (id: string) => {
    const found = artifacts.find(a => a.id === id);
    if (found) {
      setSelectedArtifactId(found.id);
      if (found.content?.pageConfig) {
        setConfig(found.content.pageConfig);
      } else {
        setConfig(prev => ({
          ...prev,
          id: found.id,
          title: found.title || prev.title
        }));
      }
      showToast({
        title: 'Landing Page Loaded',
        message: `Switched to "${found.title}"`,
        type: 'info'
      });
    }
  };

  // Save current page to DB
  const handleSavePage = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/landing-pages/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: config.id,
          title: config.title,
          pageConfig: config,
          renderedHtml
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        saveSnapshot(`Saved: ${config.title}`, config);
        showToast({
          title: 'Landing Page Saved',
          message: `Changes published live to ${data.liveUrl}`,
          type: 'success'
        });
        fetchArtifacts();
      } else {
        throw new Error(data.error || 'Failed to save landing page');
      }
    } catch (err: any) {
      showToast({
        title: 'Save Warning',
        message: err.message || 'Stored in local memory',
        type: 'warning'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Copy live link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopiedLink(true);
    showToast({
      title: 'Public URL Copied',
      message: `Shareable link ready: ${liveUrl}`,
      type: 'success'
    });
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Download standalone HTML
  const handleDownloadHtml = () => {
    const blob = new Blob([renderedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast({
      title: 'HTML Exported',
      message: 'Standalone production file with Tailwind & schema downloaded.',
      type: 'success'
    });
  };

  // Apply a trade template
  const handleApplyTemplate = (tradeKey: string) => {
    const tmpl = TRADE_TEMPLATES[tradeKey];
    if (!tmpl) return;

    saveSnapshot(`Before Applying ${tmpl.trade.toUpperCase()} Template`, config);
    const updated: LandingPageConfig = JSON.parse(JSON.stringify(tmpl));
    updated.id = config.id; // Keep same artifact ID
    setConfig(updated);
    showToast({
      title: 'Template Applied',
      message: `Loaded ${updated.trade.toUpperCase()} layout & trust signals.`,
      type: 'success'
    });
  };

  // Handle AI generated config
  const handleAiGenerated = (newConfig: LandingPageConfig) => {
    saveSnapshot(`Before AI Generation`, config);
    newConfig.id = config.id;
    setConfig(newConfig);
    showToast({
      title: 'AI Landing Page Ready',
      message: 'Gemini synthesized complete trade copy and conversion structure.',
      type: 'success'
    });
  };

  // Rollback to previous version
  const handleRollback = (snapshot: PageVersionSnapshot) => {
    saveSnapshot(`Before Rollback to ${snapshot.timestamp}`, config);
    setConfig(snapshot.config);
    setShowHistoryModal(false);
    showToast({
      title: 'Version Restored',
      message: `Restored configuration from ${snapshot.timestamp}`,
      type: 'info'
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      
      {/* ─── TOP STUDIO TOOLBAR ─── */}
      <header className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Left: App Identity & Lander Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-white tracking-wide uppercase">
                Contractor Landing Page Studio
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/30">
                Lead-Gen Ready
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="text-xs text-slate-300 font-semibold bg-transparent border-b border-dashed border-slate-700 hover:border-amber-400 focus:outline-none focus:border-amber-400 w-48 sm:w-64 truncate"
                title="Click to rename page"
              />
            </div>
          </div>
        </div>

        {/* Center: Viewport Controls & Tab Navigation */}
        <div className="flex items-center gap-2">
          {/* Studio Tabs */}
          <div className="flex p-0.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('builder')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'builder' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Builder</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'templates' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trades</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('branding')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'branding' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Branding</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seo')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'seo' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SEO & Schema</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quality_gates')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'quality_gates' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quality Gates</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'code' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">HTML</span>
            </button>
          </div>

          {/* Viewport Width Controls */}
          <div className="hidden md:flex p-0.5 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              title="Desktop View (1200px)"
              className={`p-1.5 rounded-lg transition ${
                viewport === 'desktop' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              title="Tablet View (768px)"
              className={`p-1.5 rounded-lg transition ${
                viewport === 'tablet' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              title="Mobile First View (375px)"
              className={`p-1.5 rounded-lg transition ${
                viewport === 'mobile' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: AI Synthesis, History, Save, Share & Live Actions */}
        <div className="flex items-center gap-2">
          {/* AI Generator Button */}
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md hover:shadow-amber-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Generate</span>
          </button>

          {/* Version History Toggle */}
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            title="Rollback & Version History"
            className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Save Button */}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSavePage}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>

          {/* Copy URL */}
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy Public Landing Page Link"
            className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Download HTML */}
          <button
            type="button"
            onClick={handleDownloadHtml}
            title="Export Standalone HTML"
            className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Open Live */}
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center gap-1.5 border border-slate-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live</span>
          </a>
        </div>
      </header>

      {/* ─── MAIN STUDIO WORKSPACE: SIDEBAR + PREVIEW CANVAS ─── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Interactive Control Panel (Builder / Templates / Branding / SEO / Code) */}
        <aside className="w-full md:w-96 shrink-0 border-r border-slate-800 bg-slate-900/60 p-4 overflow-y-auto space-y-4">
          
          {/* TAB 1: SECTION BUILDER */}
          {activeTab === 'builder' && (
            <SectionEditor config={config} onChange={setConfig} />
          )}

          {/* TAB 2: TRADE TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Trade-Specific Template Library
                  </h4>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                One-click mobile-first templates engineered specifically for local home service trades with proven high-converting conversion blocks.
              </p>

              <div className="grid grid-cols-1 gap-3">
                {Object.entries(TRADE_TEMPLATES).map(([key, t]) => (
                  <div
                    key={key}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400/80 transition space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase">{t.trade}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold">
                          30-Min SLA
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-slate-200 mt-1">{t.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {t.sections.hero.headline}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {t.sectionOrder.length} Modules Included
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate(key)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
                      >
                        Apply Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BRANDING & CONTACT */}
          {activeTab === 'branding' && (
            <BrandingControls config={config} onChange={setConfig} />
          )}

          {/* TAB 4: SEO & SCHEMA */}
          {activeTab === 'seo' && (
            <SeoSchemaPanel config={config} onChange={setConfig} />
          )}

          {/* TAB 5: QUALITY GATES & ANTI-SLOP AUDIT */}
          {activeTab === 'quality_gates' && (
            <QualityGatePanel 
              config={config} 
              onChange={setConfig} 
              onNavigateToTab={(tab) => {
                if (tab === 'editor') setActiveTab('builder');
                else if (tab === 'seo') setActiveTab('seo');
                else if (tab === 'branding') setActiveTab('branding');
              }}
            />
          )}

          {/* TAB 6: HTML CODE INSPECTOR */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-sky-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Exportable HTML Source
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
              <textarea
                readOnly
                value={renderedHtml}
                rows={22}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10.5px] text-slate-300 leading-relaxed focus:outline-none"
              />
            </div>
          )}
        </aside>

        {/* Right Canvas: Live Iframe Preview With Responsive Bezel */}
        <main className="flex-1 bg-slate-950/90 flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto">
          
          {/* Top Canvas Indicator */}
          <div className="w-full max-w-5xl flex items-center justify-between pb-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-[11px]">
                Live Preview: {viewport.toUpperCase()} ({viewport === 'desktop' ? '1200px' : viewport === 'tablet' ? '768px' : '375px'})
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
              Interactive Form Submissions Direct-Route to HAL CRM
            </div>
          </div>

          {/* Viewport Frame */}
          <div
            className={`transition-all duration-300 ease-in-out bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col ${
              viewport === 'desktop'
                ? 'w-full max-w-5xl h-[820px]'
                : viewport === 'tablet'
                ? 'w-[768px] h-[820px]'
                : 'w-[375px] h-[720px] ring-8 ring-slate-800/80 rounded-[36px]'
            }`}
          >
            {/* Browser Bezel for Desktop & Tablet */}
            {viewport !== 'mobile' && (
              <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 mx-4 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 truncate text-center">
                  https://hal.ai/landing/{config.id}
                </div>
              </div>
            )}

            {/* Mobile Speaker Notch */}
            {viewport === 'mobile' && (
              <div className="pt-2 pb-1 bg-slate-950 flex justify-center shrink-0">
                <span className="w-16 h-1 rounded-full bg-slate-800" />
              </div>
            )}

            {/* Live Rendered Iframe */}
            <iframe
              key={`${config.id}-${config.branding.colorPreset}-${config.sectionOrder.join('-')}`}
              srcDoc={renderedHtml}
              title="Landing Page Preview"
              className="w-full flex-1 border-0 bg-slate-950"
            />
          </div>
        </main>
      </div>

      {/* ─── AI GENERATOR MODAL ─── */}
      <AiGeneratorModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        token={token}
        onGenerated={handleAiGenerated}
      />

      {/* ─── VERSION HISTORY & ROLLBACK MODAL ─── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Version History & Rollback
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Restore previous iterations of your landing page layout, headlines, and color presets.
            </p>

            {versionHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 rounded-xl bg-slate-950 border border-slate-800">
                No previous snapshots yet. Changes will appear here as you save.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {versionHistory.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{v.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{v.timestamp}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRollback(v)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3 h-3" /> Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
