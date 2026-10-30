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
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Columns,
  Layout
} from 'lucide-react';
import { useBusinessContext } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';
import { LandingPageConfig, PageVersionSnapshot, TradeType } from './landing/types';
import { TRADE_TEMPLATES } from './landing/templates';
import { generateLandingPageHtml } from './landing/htmlGenerator';
import { generateLandingPageTsx } from './landing/tsxGenerator';
import { SectionEditor } from './landing/SectionEditor';
import { BrandingControls } from './landing/BrandingControls';
import { SeoSchemaPanel } from './landing/SeoSchemaPanel';
import { AiGeneratorModal } from './landing/AiGeneratorModal';
import { QualityGatePanel } from './landing/QualityGatePanel';
import { useInspector } from '../context/InspectorContext';

export const LandingPageStudioPanel: React.FC<{ token: string | null }> = ({ token }) => {
  const { regionalProfile, activeNiche, workspaceConfig } = useBusinessContext();
  const { showToast } = useToast();
  const { openInspector, registerDataChangeCallback } = useInspector();

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
  const [workspaceMode, setWorkspaceMode] = useState<'split' | 'canvas' | 'editor'>('split');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'100' | '85' | '75'>('100');
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<'editor' | 'preview'>('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versionHistory, setVersionHistory] = useState<PageVersionSnapshot[]>([]);

  // Computed rendered code from current configuration
  const renderedHtml = generateLandingPageHtml(config);
  const renderedTsx = generateLandingPageTsx(config);
  const [codeFormat, setCodeFormat] = useState<'html' | 'tsx'>('html');
  const [isSimulatingLead, setIsSimulatingLead] = useState(false);

  // Listen to live updates from Inspector
  useEffect(() => {
    registerDataChangeCallback((newData: any) => {
      if (newData && newData.sectionKey && newData.sectionData) {
        setConfig(prev => {
          const next = { ...prev };
          if (next.sections) {
            next.sections = {
              ...next.sections,
              [newData.sectionKey]: {
                ...next.sections[newData.sectionKey],
                ...newData.sectionData
              }
            };
          }
          return next;
        });
      } else if (newData && newData.branding) {
        setConfig(prev => ({
          ...prev,
          ...newData
        }));
      }
    });
  }, [registerDataChangeCallback]);

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

  // Download React / Next.js TSX
  const handleDownloadTsx = () => {
    const blob = new Blob([renderedTsx], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.businessName.replace(/[^a-zA-Z0-9]/g, '') || 'LandingPage'}.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast({
      title: 'TSX Component Exported',
      message: 'Next.js / React component downloaded successfully.',
      type: 'success'
    });
  };

  // Simulate an inbound lead capture
  const handleSimulateLead = async () => {
    setIsSimulatingLead(true);
    try {
      const res = await fetch('/api/public/landing-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId: config.contractorId || '',
          landingPageId: config.id,
          name: 'Sarah M. (Live Simulator)',
          phone: '(403) 555-0199',
          serviceDetails: `Emergency priority inspection requested via ${config.title} test trigger`,
          city: config.city
        })
      });
      if (res.ok) {
        showToast({
          title: 'Lead Captured & Encrypted',
          message: 'Test lead logged to database and contractor SSE notification fired.',
          type: 'success'
        });
      } else {
        throw new Error('Simulation endpoint failed');
      }
    } catch (err) {
      showToast({
        title: 'Lead Simulation Error',
        message: 'Could not submit test lead to endpoint.',
        type: 'error'
      });
    } finally {
      setIsSimulatingLead(false);
    }
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
    <div className="flex flex-col h-full w-full bg-bg-base text-text-primary select-none overflow-hidden font-sans">
      
      {/* ─── TOP STUDIO TOOLBAR ─── */}
      <header className="px-4 py-2.5 border-b border-border-dim bg-bg-raised/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Left: App Identity & Lander Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-text-primary tracking-wide uppercase">
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
                className="text-xs text-text-secondary font-semibold bg-transparent border-b border-dashed border-border-dim hover:border-amber-400 focus:outline-none focus:border-amber-400 w-48 sm:w-64 truncate"
                title="Click to rename page"
              />
            </div>
          </div>
        </div>

        {/* Center: Workspace Layout, Viewport Controls & Tab Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Studio Tabs */}
          <div className="flex p-0.5 bg-bg-base border border-border-dim rounded-xl text-xs">
            <button
              type="button"
              onClick={() => { setActiveTab('builder'); if (workspaceMode === 'canvas') setWorkspaceMode('split'); setSidebarCollapsed(false); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'builder' ? 'bg-amber-500 text-accent-contrast font-bold shadow' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Builder</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('templates'); if (workspaceMode === 'canvas') setWorkspaceMode('split'); setSidebarCollapsed(false); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'templates' ? 'bg-amber-500 text-accent-contrast font-bold shadow' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trades</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('branding'); if (workspaceMode === 'canvas') setWorkspaceMode('split'); setSidebarCollapsed(false); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'branding' ? 'bg-amber-500 text-accent-contrast font-bold shadow' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Branding</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('seo'); if (workspaceMode === 'canvas') setWorkspaceMode('split'); setSidebarCollapsed(false); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'seo' ? 'bg-amber-500 text-accent-contrast font-bold shadow' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SEO & Schema</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('quality_gates'); if (workspaceMode === 'canvas') setWorkspaceMode('split'); setSidebarCollapsed(false); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'quality_gates' ? 'bg-amber-500 text-accent-contrast font-bold shadow' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quality Gates</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('code'); if (workspaceMode === 'canvas') setWorkspaceMode('split'); setSidebarCollapsed(false); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'code' ? 'bg-amber-500 text-accent-contrast font-bold shadow' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">HTML</span>
            </button>
          </div>

          {/* Workspace Layout Mode (Split vs Canvas Focus vs Full Editor) */}
          <div className="hidden lg:flex p-0.5 bg-bg-base border border-border-dim rounded-xl text-xs" title="Workspace Layout Mode">
            <button
              type="button"
              onClick={() => { setWorkspaceMode('split'); setSidebarCollapsed(false); }}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                workspaceMode === 'split' ? 'bg-bg-subtle text-amber-400 font-bold' : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Split View (Editor + Live Canvas)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Split</span>
            </button>
            <button
              type="button"
              onClick={() => { setWorkspaceMode('canvas'); setSidebarCollapsed(true); }}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                workspaceMode === 'canvas' ? 'bg-bg-subtle text-amber-400 font-bold' : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Maximize Live Preview Canvas (More Working Space)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => { setWorkspaceMode('editor'); setSidebarCollapsed(false); }}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                workspaceMode === 'editor' ? 'bg-bg-subtle text-amber-400 font-bold' : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Maximize Editor (Full-width Copywriting & Settings)"
            >
              <Layout className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Editor</span>
            </button>
          </div>

          {/* Viewport Width Controls */}
          <div className="hidden md:flex p-0.5 bg-bg-base border border-border-dim rounded-xl">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              title="Desktop View (1200px)"
              className={`p-1.5 rounded-lg transition ${
                viewport === 'desktop' ? 'bg-bg-subtle text-amber-400' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              title="Tablet View (768px)"
              className={`p-1.5 rounded-lg transition ${
                viewport === 'tablet' ? 'bg-bg-subtle text-amber-400' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              title="Mobile First View (375px)"
              className={`p-1.5 rounded-lg transition ${
                viewport === 'mobile' ? 'bg-bg-subtle text-amber-400' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Scale Controls */}
          <div className="hidden xl:flex p-0.5 bg-bg-base border border-border-dim rounded-xl text-[11px] font-mono">
            {(['100', '85', '75'] as const).map(z => (
              <button
                key={z}
                type="button"
                onClick={() => setZoomLevel(z)}
                className={`px-1.5 py-1 rounded-lg transition ${
                  zoomLevel === z ? 'bg-bg-subtle text-amber-400 font-bold' : 'text-text-secondary hover:text-text-primary'
                }`}
                title={`Scale Live Canvas ${z}%`}
              >
                {z}%
              </button>
            ))}
          </div>

          {/* Fullscreen Preview Trigger */}
          <button
            type="button"
            onClick={() => setShowFullscreenModal(true)}
            title="Distraction-Free Fullscreen Preview"
            className="hidden md:flex p-1.5 rounded-xl border border-border-dim bg-bg-base hover:bg-bg-subtle text-text-secondary hover:text-amber-400 transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: AI Synthesis, History, Save, Share & Live Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Theme Selector Dropdown */}
          <div className="flex items-center gap-1 bg-bg-raised border border-border-dim rounded-xl px-2 py-1">
            <Palette className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={config.branding.colorPreset || 'emergency_amber'}
              onChange={(e) => {
                const preset = e.target.value as any;
                let primary = '#0284c7';
                let secondary = '#0f172a';
                let accent = '#f59e0b';
                if (preset === 'paper_ink') {
                  primary = '#18181b'; secondary = '#f7f5f0'; accent = '#9a3412';
                } else if (preset === 'executive_carbon') {
                  primary = '#09090b'; secondary = '#18181b'; accent = '#e4e4e7';
                } else if (preset === 'modern_swiss') {
                  primary = '#ffffff'; secondary = '#0f172a'; accent = '#e11d48';
                } else if (preset === 'nordic_obsidian') {
                  primary = '#030712'; secondary = '#0b1329'; accent = '#38bdf8';
                } else if (preset === 'artisan_warmth') {
                  primary = '#292524'; secondary = '#f5f5f4'; accent = '#d97706';
                } else if (preset === 'trust_navy') {
                  primary = '#2563eb'; secondary = '#0f172a'; accent = '#38bdf8';
                }
                setConfig(prev => ({
                  ...prev,
                  branding: {
                    ...prev.branding,
                    colorPreset: preset,
                    primaryColor: primary,
                    secondaryColor: secondary,
                    accentColor: accent
                  }
                }));
                showToast({
                  title: 'Theme Applied',
                  message: `Switched preset to ${preset.replace(/_/g, ' ')}`,
                  type: 'info'
                });
              }}
              className="bg-transparent text-xs font-semibold text-text-primary focus:outline-none cursor-pointer py-0.5"
            >
              <option value="paper_ink" className="bg-bg-raised">📜 Paper & Ink</option>
              <option value="executive_carbon" className="bg-bg-raised">⬛ Executive Carbon</option>
              <option value="modern_swiss" className="bg-bg-raised">⚪ Modern Swiss</option>
              <option value="nordic_obsidian" className="bg-bg-raised">🌌 Nordic Obsidian</option>
              <option value="artisan_warmth" className="bg-bg-raised">🪵 Artisan Warmth</option>
              <option value="emergency_amber" className="bg-bg-raised">⚡ Emergency Amber</option>
              <option value="trust_navy" className="bg-bg-raised">🛡️ Trust Navy</option>
            </select>
          </div>

          {/* Simulate Inbound Lead Capture */}
          <button
            type="button"
            disabled={isSimulatingLead}
            onClick={handleSimulateLead}
            title="Simulate inbound homeowner dispatch request (validates encryption, database persistence, and SSE alert)"
            className="px-2.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isSimulatingLead ? 'animate-bounce' : ''}`} />
            <span className="hidden xl:inline">{isSimulatingLead ? 'Routing Lead...' : 'Test Lead'}</span>
          </button>

          {/* Inspector Button */}
          <button
            type="button"
            onClick={() => {
              openInspector('landing_config', `${config.businessName} (Lander Settings)`, config);
            }}
            title="Inspect in Workspace Sidebar"
            className="p-1.5 rounded-xl border border-border-dim bg-bg-raised hover:bg-bg-subtle text-text-secondary hover:text-amber-400 transition cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* AI Generator Button */}
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-accent-contrast font-black text-xs transition flex items-center gap-1.5 shadow-md hover:shadow-amber-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Generate</span>
          </button>

          {/* Version History Toggle */}
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            title="Rollback & Version History"
            className="p-1.5 rounded-xl border border-border-dim bg-bg-raised hover:bg-bg-subtle text-text-secondary transition"
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
            className="p-1.5 rounded-xl border border-border-dim bg-bg-raised hover:bg-bg-subtle text-text-secondary transition"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Download HTML */}
          <button
            type="button"
            onClick={handleDownloadHtml}
            title="Export Standalone HTML"
            className="p-1.5 rounded-xl border border-border-dim bg-bg-raised hover:bg-bg-subtle text-text-secondary transition"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Open Live */}
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-bg-subtle hover:bg-slate-700 text-text-primary font-bold text-xs transition flex items-center gap-1.5 border border-border-dim"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live</span>
          </a>
        </div>

        {/* Mobile View Toggle (Editor vs Preview) */}
        <div className="flex md:hidden p-0.5 bg-bg-base border border-border-dim rounded-xl text-xs w-full">
          <button
            type="button"
            onClick={() => setMobileActiveView('editor')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              mobileActiveView === 'editor' ? 'bg-amber-500 text-accent-contrast shadow' : 'text-text-secondary'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileActiveView('preview')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              mobileActiveView === 'preview' ? 'bg-amber-500 text-accent-contrast shadow' : 'text-text-secondary'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </header>

      {/* ─── MAIN STUDIO WORKSPACE: SIDEBAR + PREVIEW CANVAS ─── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        
        {/* Left Interactive Control Panel (Builder / Templates / Branding / SEO / Code) */}
        {workspaceMode !== 'canvas' && (
          <aside
            className={`transition-all duration-300 ease-in-out border-r border-border-dim bg-bg-raised/70 p-4 overflow-y-auto space-y-4 shrink-0 ${
              mobileActiveView === 'editor' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
            } ${
              workspaceMode === 'editor'
                ? 'w-full max-w-4xl mx-auto border-r-0 border-x border-border-dim my-2 rounded-2xl shadow-xl'
                : sidebarCollapsed
                ? 'w-14 p-2 items-center space-y-3'
                : 'w-full md:w-[420px] lg:w-[440px]'
            }`}
          >
            {/* If Collapsed in Split Mode: Show Slim Rail */}
            {workspaceMode === 'split' && sidebarCollapsed ? (
              <div className="flex flex-col items-center space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(false)}
                  title="Expand Editor Sidebar"
                  className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-accent-contrast transition shadow cursor-pointer"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
                <div className="w-6 h-px bg-bg-subtle my-1" />
                <button
                  type="button"
                  onClick={() => { setActiveTab('builder'); setSidebarCollapsed(false); }}
                  title="Builder"
                  className={`p-2 rounded-lg ${activeTab === 'builder' ? 'text-amber-400 bg-bg-subtle' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('templates'); setSidebarCollapsed(false); }}
                  title="Trades"
                  className={`p-2 rounded-lg ${activeTab === 'templates' ? 'text-amber-400 bg-bg-subtle' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <Sliders className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('branding'); setSidebarCollapsed(false); }}
                  title="Branding"
                  className={`p-2 rounded-lg ${activeTab === 'branding' ? 'text-amber-400 bg-bg-subtle' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <Palette className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('seo'); setSidebarCollapsed(false); }}
                  title="SEO"
                  className={`p-2 rounded-lg ${activeTab === 'seo' ? 'text-amber-400 bg-bg-subtle' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('quality_gates'); setSidebarCollapsed(false); }}
                  title="Quality Gates"
                  className={`p-2 rounded-lg ${activeTab === 'quality_gates' ? 'text-amber-400 bg-bg-subtle' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                {/* Header with quick collapse and focus buttons */}
                <div className="flex items-center justify-between pb-2 border-b border-border-dim">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                      {activeTab === 'builder' ? 'Modular Section Editor' :
                       activeTab === 'templates' ? 'Trade Template Library' :
                       activeTab === 'branding' ? 'Brand & Call Settings' :
                       activeTab === 'seo' ? 'Local SEO & Rich Schema' :
                       activeTab === 'quality_gates' ? 'Conversion & Quality Gates' : 'HTML Code'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {workspaceMode === 'split' && (
                      <button
                        type="button"
                        onClick={() => setSidebarCollapsed(true)}
                        title="Collapse Sidebar (Maximize Preview Workspace)"
                        className="p-1.5 rounded-lg text-text-secondary hover:text-amber-400 hover:bg-bg-subtle transition cursor-pointer"
                      >
                        <PanelLeftClose className="w-4 h-4" />
                      </button>
                    )}
                    {workspaceMode === 'editor' && (
                      <button
                        type="button"
                        onClick={() => setWorkspaceMode('split')}
                        title="Return to Split View"
                        className="px-2 py-1 rounded-lg text-xs bg-bg-subtle hover:bg-slate-700 text-text-secondary transition"
                      >
                        Split View
                      </button>
                    )}
                  </div>
                </div>

                {/* TAB 1: SECTION BUILDER */}
                {activeTab === 'builder' && (
                  <SectionEditor config={config} onChange={setConfig} />
                )}

                {/* TAB 2: TRADE TEMPLATES */}
                {activeTab === 'templates' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border-dim">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                          Trade-Specific Template Library
                        </h4>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      One-click mobile-first templates engineered specifically for local home service trades with proven high-converting conversion blocks.
                    </p>

                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(TRADE_TEMPLATES).map(([key, t]) => (
                        <div
                          key={key}
                          className="p-4 rounded-xl bg-bg-base border border-border-dim hover:border-amber-400/80 transition space-y-2 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-text-primary uppercase">{t.trade}</span>
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold">
                                30-Min SLA
                              </span>
                            </div>
                            <h5 className="text-sm font-bold text-text-primary mt-1">{t.title}</h5>
                            <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">
                              {t.sections.hero.headline}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                            <span className="text-[10px] text-text-tertiary font-mono">
                              {t.sectionOrder.length} Modules Included
                            </span>
                            <button
                              type="button"
                              onClick={() => handleApplyTemplate(key)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-accent-contrast font-black text-xs transition cursor-pointer"
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

                {/* TAB 6: CODE EXPORT & SOURCE */}
                {activeTab === 'code' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border-dim">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-sky-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                          Export Production Source
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const codeToCopy = codeFormat === 'html' ? renderedHtml : renderedTsx;
                            navigator.clipboard.writeText(codeToCopy);
                            showToast({
                              title: 'Code Copied',
                              message: `Copied ${codeFormat.toUpperCase()} to clipboard`,
                              type: 'success'
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-bg-subtle hover:bg-slate-700 text-xs text-text-primary font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={codeFormat === 'html' ? handleDownloadHtml : handleDownloadTsx}
                          className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs text-white font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .{codeFormat}</span>
                        </button>
                      </div>
                    </div>

                    {/* Format Toggle Bar */}
                    <div className="flex p-0.5 bg-bg-base border border-border-dim rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setCodeFormat('html')}
                        className={`flex-1 py-1 px-2 rounded-md font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          codeFormat === 'html' ? 'bg-amber-500 text-accent-contrast shadow' : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <span>Single-File HTML</span>
                        <span className="text-[10px] opacity-75 font-normal">Static / CDN</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCodeFormat('tsx')}
                        className={`flex-1 py-1 px-2 rounded-md font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          codeFormat === 'tsx' ? 'bg-sky-500 text-white shadow' : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <span>React / Next.js TSX</span>
                        <span className="text-[10px] opacity-75 font-normal">App Router</span>
                      </button>
                    </div>

                    <textarea
                      readOnly
                      value={codeFormat === 'html' ? renderedHtml : renderedTsx}
                      rows={21}
                      className="w-full p-3 rounded-xl bg-bg-base border border-border-dim font-mono text-[10.5px] text-text-secondary leading-relaxed focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </>
            )}
          </aside>
        )}

        {/* Right Canvas: Live Iframe Preview With Responsive Bezel */}
        {workspaceMode !== 'editor' && (
          <main className={`flex-1 flex-col items-center justify-start p-3 sm:p-6 overflow-y-auto relative transition-colors duration-200 ${
            mobileActiveView === 'preview' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
          } ${
            config.branding.colorPreset === 'paper_ink' ? 'bg-[#ede7db]' : 'bg-bg-base/90'
          }`}>
            
            {/* If sidebar is hidden/collapsed: Floating Reopen Button */}
            {(workspaceMode === 'canvas' || sidebarCollapsed) && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setWorkspaceMode('split'); setSidebarCollapsed(false); }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-accent-contrast font-bold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                  title="Open Editor Sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                  <span>Open Editor</span>
                </button>
              </div>
            )}

            {/* Top Canvas Indicator */}
            <div className="w-full max-w-5xl flex items-center justify-between pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className={`font-mono text-[11px] ${config.branding.colorPreset === 'paper_ink' ? 'text-stone-700 font-semibold' : 'text-text-secondary'}`}>
                  Live Preview: {viewport.toUpperCase()} ({viewport === 'desktop' ? '1200px' : viewport === 'tablet' ? '768px' : '375px'}) {zoomLevel !== '100' ? `• Zoom ${zoomLevel}%` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono hidden sm:inline ${config.branding.colorPreset === 'paper_ink' ? 'text-stone-500' : 'text-text-tertiary'}`}>
                  Instant Lead-Capture to HAL CRM
                </span>
                <button
                  type="button"
                  onClick={() => setShowFullscreenModal(true)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    config.branding.colorPreset === 'paper_ink'
                      ? 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                      : 'bg-bg-subtle hover:bg-slate-700 text-text-secondary'
                  }`}
                  title="Open Distraction-Free Preview"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Full View</span>
                </button>
              </div>
            </div>

            {/* Viewport Frame with Zoom Scaling */}
            <div
              style={{
                transform: zoomLevel !== '100' ? `scale(${Number(zoomLevel) / 100})` : undefined,
                transformOrigin: 'top center',
                transition: 'transform 200ms ease'
              }}
              className={`transition-all duration-300 ease-in-out rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
                config.branding.colorPreset === 'paper_ink'
                  ? 'bg-white border border-[#dcd5c7] shadow-stone-300/40'
                  : 'bg-bg-raised border border-border-dim'
              } ${
                viewport === 'desktop'
                  ? 'w-full max-w-5xl h-[860px]'
                  : viewport === 'tablet'
                  ? 'w-[768px] h-[860px]'
                  : 'w-[375px] h-[740px] ring-8 ring-slate-800/80 rounded-[36px]'
              }`}
            >
              {/* Browser Bezel for Desktop & Tablet */}
              {viewport !== 'mobile' && (
                <div className={`px-4 py-2 flex items-center gap-2 shrink-0 ${
                  config.branding.colorPreset === 'paper_ink'
                    ? 'bg-[#f7f5f0] border-b border-[#dcd5c7]'
                    : 'bg-bg-base border-b border-border-dim'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className={`flex-1 mx-4 px-3 py-1 rounded-md text-[11px] font-mono truncate text-center ${
                    config.branding.colorPreset === 'paper_ink'
                      ? 'bg-white border border-[#dcd5c7] text-stone-700'
                      : 'bg-bg-raised border border-border-dim text-text-secondary'
                  }`}>
                    https://hal.ai/landing/{config.id}
                  </div>
                </div>
              )}

              {/* Mobile Speaker Notch */}
              {viewport === 'mobile' && (
                <div className="pt-2 pb-1 bg-bg-base flex justify-center shrink-0">
                  <span className="w-16 h-1 rounded-full bg-bg-subtle" />
                </div>
              )}

              {/* Live Rendered Iframe */}
              <iframe
                key={`${config.id}-${config.branding.colorPreset}-${config.sectionOrder.join('-')}`}
                srcDoc={renderedHtml}
                title="Landing Page Preview"
                className={`w-full flex-1 border-0 ${
                  config.branding.colorPreset === 'paper_ink' ? 'bg-[#f7f5f0]' : 'bg-bg-base'
                }`}
              />
            </div>
          </main>
        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-bg-raised border border-border-dim shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border-dim pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Version History & Rollback
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-text-secondary hover:text-text-primary text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              Restore previous iterations of your landing page layout, headlines, and color presets.
            </p>

            {versionHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-tertiary rounded-xl bg-bg-base border border-border-dim">
                No previous snapshots yet. Changes will appear here as you save.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {versionHistory.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-bg-base border border-border-dim flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-text-primary">{v.title}</div>
                      <div className="text-[10px] text-text-tertiary font-mono">{v.timestamp}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRollback(v)}
                      className="px-2.5 py-1 rounded-lg bg-bg-subtle hover:bg-slate-700 text-amber-400 font-bold text-[11px] flex items-center gap-1 transition"
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

      {/* ─── FULLSCREEN DISTRACTION-FREE PREVIEW MODAL ─── */}
      {showFullscreenModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg-base">
          {/* Header */}
          <div className="px-6 py-3 border-b border-border-dim bg-bg-raised/90 backdrop-blur flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Distraction-Free Live Preview • {config.sections.hero.headline || config.title}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex p-0.5 bg-bg-base border border-border-dim rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewport('desktop')}
                  className={`p-1.5 rounded-lg transition ${viewport === 'desktop' ? 'bg-bg-subtle text-amber-400' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewport('tablet')}
                  className={`p-1.5 rounded-lg transition ${viewport === 'tablet' ? 'bg-bg-subtle text-amber-400' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewport('mobile')}
                  className={`p-1.5 rounded-lg transition ${viewport === 'mobile' ? 'bg-bg-subtle text-amber-400' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-bg-subtle hover:bg-slate-700 text-text-primary font-bold text-xs transition flex items-center gap-1.5 border border-border-dim"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>New Tab</span>
              </a>

              <button
                type="button"
                onClick={() => setShowFullscreenModal(false)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-accent-contrast font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Close Fullscreen</span>
              </button>
            </div>
          </div>

          {/* Canvas Container */}
          <div className={`flex-1 flex items-center justify-center p-4 overflow-hidden ${
            config.branding.colorPreset === 'paper_ink' ? 'bg-[#ede7db]' : 'bg-bg-base'
          }`}>
            <div className={`h-full transition-all duration-300 rounded-2xl shadow-2xl overflow-hidden border flex flex-col ${
              config.branding.colorPreset === 'paper_ink' ? 'bg-white border-[#dcd5c7]' : 'bg-bg-raised border-border-dim'
            } ${
              viewport === 'desktop'
                ? 'w-full max-w-6xl'
                : viewport === 'tablet'
                ? 'w-[768px]'
                : 'w-[375px] ring-8 ring-slate-800/80 rounded-[36px]'
            }`}>
              <iframe
                key={`fs-${config.id}-${config.branding.colorPreset}-${config.sectionOrder.join('-')}`}
                srcDoc={renderedHtml}
                title="Fullscreen Preview"
                className={`w-full flex-1 border-0 ${
                  config.branding.colorPreset === 'paper_ink' ? 'bg-[#f7f5f0]' : 'bg-bg-base'
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
