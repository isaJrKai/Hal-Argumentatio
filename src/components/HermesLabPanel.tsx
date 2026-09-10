import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layout, 
  Sparkles, 
  Cpu, 
  Code2, 
  FileSpreadsheet, 
  Send, 
  Star, 
  Zap, 
  ShieldAlert, 
  Filter, 
  BrainCircuit,
  Eye,
  Download,
  Copy,
  Check,
  Play,
  RefreshCw,
  FolderOpen,
  Wrench,
  Activity,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Terminal,
  Smartphone,
  Laptop,
  MessageSquare,
  Bot,
  User,
  SendHorizontal,
  ChevronRight,
  Sliders,
  Database,
  Share2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface LabMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachedArtifact?: any;
  thoughtProcess?: string;
  createdAt: string;
}

interface LabCatalogItem {
  id: string;
  name: string;
  badge: string;
  category: 'web' | 'ads' | 'seo' | 'outreach' | 'diagnostics' | 'reasoning';
  description: string;
  iconName: string;
  defaultPrompt: string;
  schemaSample: Record<string, any>;
}

interface LabArtifact {
  id: string;
  contractorId: string;
  toolId: string;
  title: string;
  category: string;
  content: {
    summary?: string;
    structuredData?: any;
    renderedOutput?: string;
  };
  status: 'draft' | 'ready' | 'deployed' | 'archived';
  metadata?: any;
  createdAt: string;
}

interface DiagnosticIncident {
  id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  rootCause: string;
  proposedFix: string;
  status: 'open' | 'resolving' | 'resolved';
  createdAt: string;
}

const ICON_MAP: Record<string, any> = {
  Layout,
  FileSpreadsheet,
  Code2,
  Send,
  Star,
  Zap,
  ShieldAlert,
  Cpu,
  Filter,
  BrainCircuit
};

interface EngineStatus {
  provider: string;
  activeEngine: string;
  activeModel: string;
  providers: {
    openrouter: boolean;
    huggingface: boolean;
    gemini: boolean;
    nvidia: boolean;
  };
}

export default function HermesLabPanel({ token }: { token: string | null }) {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'tools' | 'chat' | 'artifacts' | 'diagnostics'>('tools');
  const [catalog, setCatalog] = useState<LabCatalogItem[]>([]);
  const [artifacts, setArtifacts] = useState<LabArtifact[]>([]);
  const [incidents, setIncidents] = useState<DiagnosticIncident[]>([]);
  const [messages, setMessages] = useState<LabMessage[]>([]);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [selectedTool, setSelectedTool] = useState<LabCatalogItem | null>(null);
  const [toolParameters, setToolParameters] = useState<Record<string, any>>({});
  const [rawParamsText, setRawParamsText] = useState<string>('');
  const [promptOverride, setPromptOverride] = useState<string>('');
  const [executing, setExecuting] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<LabArtifact | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [devicePreview, setDevicePreview] = useState<'mobile' | 'desktop'>('desktop');
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Helper to extract reliable auth headers across storage & props
  const getAuthHeaders = (extraHeaders: Record<string, string> = {}): Record<string, string> => {
    const activeToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token')) : null);
    return {
      ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}),
      ...extraHeaders
    };
  };

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (activeSubTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeSubTab]);

  const fetchEngineStatus = async () => {
    try {
      const res = await fetch('/api/hermes/status', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setEngineStatus(data);
      }
    } catch (err) {
      console.warn('Failed to fetch engine status', err);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await fetch('/api/hermes/catalog', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const catalogList = Array.isArray(data.catalog) ? data.catalog : [];
        setCatalog(catalogList);
        if (catalogList.length > 0 && !selectedTool) {
          const first = catalogList[0];
          setSelectedTool(first);
          const sample = first.schemaSample || {};
          setToolParameters(sample);
          setRawParamsText(JSON.stringify(sample, null, 2));
          setPromptOverride(first.defaultPrompt || '');
        }
      }
    } catch (err: any) {
      console.warn('Hermes catalog fetch deferred:', err?.message || err);
    }
  };

  const fetchArtifacts = async () => {
    try {
      const res = await fetch('/api/hermes/artifacts', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const arts = Array.isArray(data.artifacts) ? data.artifacts : [];
        setArtifacts(arts);
        if (arts.length > 0 && !activeArtifact) {
          setActiveArtifact(arts[0]);
        }
      }
    } catch (err: any) {
      console.warn('Hermes artifacts fetch deferred:', err?.message || err);
    }
  };

  const fetchDiagnostics = async () => {
    try {
      const res = await fetch('/api/hermes/diagnostics', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setIncidents(Array.isArray(data.incidents) ? data.incidents : []);
      }
    } catch (err: any) {
      console.warn('Hermes diagnostics fetch deferred:', err?.message || err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/hermes/chat', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch (err: any) {
      console.warn('Hermes chat messages fetch deferred:', err?.message || err);
    }
  };

  const refreshAll = () => {
    setLoading(true);
    Promise.all([
      fetchEngineStatus(),
      fetchCatalog(),
      fetchArtifacts(),
      fetchDiagnostics(),
      fetchMessages()
    ]).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    const activeToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token')) : null);
    if (activeToken) {
      refreshAll();
    }
  }, [token]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    const userText = chatInput.trim();
    setChatInput('');
    setSendingChat(true);

    // Optimistically append user message
    const tempUserMsg: LabMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/hermes/chat', {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          message: userText,
          artifactId: activeArtifact?.id || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: LabMessage = {
          id: data.replyMessageId || `reply-${Date.now()}`,
          role: 'assistant',
          content: data.replyText || 'Asset successfully modified to your instructions.',
          attachedArtifact: data.updatedArtifact,
          thoughtProcess: data.thoughtProcess,
          createdAt: new Date().toISOString()
        };
        setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, assistantMsg]);

        if (data.updatedArtifact) {
          toast({
            title: 'Asset Re-Synthesized to Your Taste',
            message: data.updatedArtifact.title || 'Personalization complete',
            type: 'success'
          });
          await fetchArtifacts();
          setActiveArtifact(data.updatedArtifact);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast({
          title: 'Chat Notice',
          message: errJson.error || 'Hermes agent is adjusting weights. Please retry.',
          type: 'error'
        });
      }
    } catch (err: any) {
      toast({
        title: 'Network Error',
        message: err.message || 'Connection error with Hermes agent.',
        type: 'error'
      });
    } finally {
      setSendingChat(false);
    }
  };

  const handleSelectTool = (tool: LabCatalogItem) => {
    if (!tool) return;
    setSelectedTool(tool);
    const sample = tool.schemaSample || {};
    setToolParameters(sample);
    setRawParamsText(JSON.stringify(sample, null, 2));
    setPromptOverride(tool.defaultPrompt || '');
  };

  const handleExecuteTool = async () => {
    if (!selectedTool) return;
    setExecuting(true);

    let effectiveParams = toolParameters;
    try {
      if (rawParamsText.trim()) {
        effectiveParams = JSON.parse(rawParamsText);
      }
    } catch (_) {
      // Keep existing parameters if raw text has syntax error
    }

    try {
      const res = await fetch('/api/hermes/execute', {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          toolId: selectedTool.id,
          parameters: effectiveParams,
          promptOverride: promptOverride || selectedTool.defaultPrompt
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: 'Lab Artifact Generated',
          message: `${selectedTool.name} successfully synthesized by Hermes Agent.`,
          type: 'success'
        });
        await fetchArtifacts();
        const newArt: LabArtifact = {
          id: data.artifactId || `art-${Date.now()}`,
          contractorId: '',
          toolId: selectedTool.id,
          title: data.title || selectedTool.name,
          category: data.category || selectedTool.category,
          content: data.content || { summary: '', renderedOutput: '' },
          status: 'ready',
          createdAt: new Date().toISOString()
        };
        setActiveArtifact(newArt);
        setActiveSubTab('artifacts');
      } else {
        const err = await res.json().catch(() => ({}));
        toast({
          title: 'Synthesis Failed',
          message: err.error || 'Failed to synthesize artifact.',
          type: 'error'
        });
      }
    } catch (err: any) {
      toast({
        title: 'Network Error',
        message: err.message || 'Network error during synthesis.',
        type: 'error'
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleCopyCode = async () => {
    if (!activeArtifact?.content?.renderedOutput) return;
    const text = activeArtifact.content.renderedOutput;
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch (_) {}

    if (!copied) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (_) {}
    }

    if (copied) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast({
        title: 'Copied to Clipboard',
        message: 'Asset code ready for deployment.',
        type: 'success'
      });
    } else {
      toast({
        title: 'Copy Ready',
        message: 'You can select and copy the code in the Code tab.',
        type: 'info'
      });
    }
  };

  const handleDownloadCode = () => {
    if (!activeArtifact?.content?.renderedOutput) return;
    const isHtml = activeArtifact.toolId === 'landing_page' || activeArtifact.content.renderedOutput.includes('<html');
    const extension = isHtml ? 'html' : 'json';
    const blob = new Blob([activeArtifact.content.renderedOutput], { type: isHtml ? 'text/html' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeArtifact.title || 'asset').toLowerCase().replace(/[^a-z0-9]/g, '_')}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    if (!activeArtifact?.content?.renderedOutput) return;
    try {
      if (activeArtifact.toolId === 'landing_page' && activeArtifact.id) {
        window.open(`/landing/${activeArtifact.id}`, '_blank');
        return;
      }
      const blob = new Blob([activeArtifact.content.renderedOutput], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const newWin = window.open(url, '_blank');
      if (!newWin) {
        toast({
          title: 'Popup Notice',
          message: 'Popup was blocked by browser. You can use the inline preview.',
          type: 'info'
        });
      }
    } catch (err: any) {
      console.warn('Could not open preview in new window:', err);
    }
  };

  const handleCopyLiveLink = () => {
    if (!activeArtifact?.id) return;
    const liveUrl = `${window.location.origin}/landing/${activeArtifact.id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(liveUrl);
      toast({
        title: 'Public Live Link Copied',
        message: `Shareable URL ready: ${liveUrl}`,
        type: 'success'
      });
    }
  };

  const triggerDiagnosticScan = async () => {
    try {
      const res = await fetch('/api/hermes/diagnostics/scan', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        toast({
          title: 'Resilience Scan Complete',
          message: 'All tracking tags, webhooks, and outbox queues inspected.',
          type: 'success'
        });
        fetchDiagnostics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-bg-raised border border-border-dim rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-text-primary">Hermes Cognitive Lab</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {engineStatus?.activeEngine || 'NOUS HERMES 3.7'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {engineStatus?.provider ? `${engineStatus.provider.toUpperCase()} ACTIVE` : 'SANDBOX GATEWAY'}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Isolated creative & operational workshop for high-converting landing pages, ads, SEO schema, and self-healing diagnostics.
            </p>
          </div>
        </div>

        {/* Subtab Switcher & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={refreshAll}
            disabled={loading}
            className="p-2 bg-bg-base border border-border-dim hover:border-cyan-500 rounded-lg text-text-secondary hover:text-text-primary text-xs cursor-pointer transition-colors"
            title="Refresh Lab Artifacts & Engine Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <div className="flex items-center gap-1 bg-bg-base p-1 border border-border-dim rounded-lg text-xs">
            <button
              onClick={() => setActiveSubTab('tools')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                activeSubTab === 'tools' 
                  ? 'bg-accent text-white shadow-sm' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                Tool Foundry ({catalog.length})
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('chat')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                activeSubTab === 'chat' 
                  ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/20' 
                  : 'text-cyan-400 hover:text-cyan-300'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Brand & Taste Studio
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('artifacts')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                activeSubTab === 'artifacts' 
                  ? 'bg-accent text-white shadow-sm' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5" />
                Generated Assets ({artifacts.length})
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('diagnostics')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                activeSubTab === 'diagnostics' 
                  ? 'bg-accent text-white shadow-sm' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Diagnostic Doctor ({incidents.length})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: TOOL FOUNDRY ─── */}
      {activeSubTab === 'tools' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tool Selector Catalog */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-text-tertiary px-1">
              Contractor Specialized Tool Suite
            </div>
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {catalog.map((tool) => {
                const IconComponent = ICON_MAP[tool.iconName] || Wrench;
                const isSelected = selectedTool?.id === tool.id;

                return (
                  <div
                    key={tool.id}
                    onClick={() => handleSelectTool(tool)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                        : 'bg-bg-raised border-border-dim hover:border-border-bright hover:bg-bg-subtle'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500 text-white' : 'bg-bg-subtle text-text-secondary'}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-text-primary">{tool.name}</h4>
                          <span className="text-[10px] text-cyan-400 font-mono font-semibold">{tool.badge}</span>
                        </div>
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-bg-base border border-border-dim text-text-tertiary font-mono">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tool Execution Workbench */}
          <div className="lg:col-span-7 bg-bg-raised border border-border-dim rounded-xl p-5 space-y-4 shadow-sm">
            {selectedTool ? (
              <>
                <div className="flex items-center justify-between border-b border-border-dim pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{selectedTool.name}</h3>
                    <p className="text-xs text-text-secondary">Tailored execution parameters for contractor business context.</p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                    {selectedTool.category.toUpperCase()} WORKBENCH
                  </span>
                </div>

                {/* Prompt Intent Override */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                    <span>Strategic Directive / Prompt</span>
                    <span className="text-[10px] font-mono text-text-tertiary">Natural Language Instruction</span>
                  </label>
                  <textarea
                    value={promptOverride}
                    onChange={(e) => setPromptOverride(e.target.value)}
                    rows={3}
                    className="w-full bg-bg-base border border-border-dim rounded-lg p-2.5 text-xs text-text-primary font-mono focus:outline-none focus:border-cyan-500"
                    placeholder="Enter specific campaign requirements or special offers..."
                  />
                </div>

                {/* JSON Parameters Tuning */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                    <span>Configuration Payload (JSON)</span>
                    <span className="text-[10px] font-mono text-text-tertiary">Auto-filled from Business Profile</span>
                  </label>
                  <textarea
                    value={rawParamsText}
                    onChange={(e) => {
                      setRawParamsText(e.target.value);
                      try {
                        setToolParameters(JSON.parse(e.target.value));
                      } catch (_) {
                        // ignore typing syntax errors
                      }
                    }}
                    rows={8}
                    className="w-full bg-bg-base border border-border-dim rounded-lg p-2.5 text-xs text-cyan-400 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Attribution Safety Notice */}
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2 text-xs text-indigo-300">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                  <div>
                    <span className="font-bold">HAL Safe Sandbox Rail:</span> All assets synthesized inside this lab automatically inherit your GCLID capture tags, CRM webhook listeners, and zero-leak attribution routes.
                  </div>
                </div>

                {/* Action Trigger */}
                <button
                  onClick={handleExecuteTool}
                  disabled={executing}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  {executing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Hermes Synthesizing Asset...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Synthesize Production Asset in Lab
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="py-16 text-center text-text-tertiary text-xs">
                Select a tool from the catalog to launch its workbench.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: CHAT & TASTE STUDIO ─── */}
      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Context & Active Asset Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-bg-raised border border-border-dim rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text-primary">Hermes Creative Strategist</h3>
                  <p className="text-[11px] text-text-secondary">Personalize assets to your exact brand & taste</p>
                </div>
              </div>

              {/* Target Artifact in Scope */}
              <div className="pt-2 border-t border-border-dim/60 space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-text-tertiary font-bold flex items-center justify-between">
                  <span>Working on Asset:</span>
                  {activeArtifact && (
                    <button
                      onClick={() => setActiveArtifact(null)}
                      className="text-[9px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      Clear selection
                    </button>
                  )}
                </label>

                {activeArtifact ? (
                  <div className="p-2.5 bg-bg-base border border-cyan-500/30 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 line-clamp-1">{activeArtifact.title}</span>
                      <span className="text-[9px] font-mono uppercase bg-cyan-500/10 text-cyan-300 px-1 rounded">
                        {activeArtifact.toolId}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-secondary line-clamp-2">
                      {activeArtifact.content?.summary}
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-bg-base border border-border-dim rounded-lg text-[11px] text-text-tertiary">
                    No specific asset selected. Hermes will converse with you or create a new personalized asset.
                  </div>
                )}
              </div>

              {/* Quick Suggestion Chips */}
              <div className="space-y-1.5 pt-2 border-t border-border-dim/60">
                <div className="text-[10px] font-mono uppercase text-text-tertiary font-bold">
                  Quick Brand & Style Prompts
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    'Make the theme modern dark matte slate with emerald accents',
                    'Add a sticky emergency 24/7 call bar at the top',
                    'Rewrite in a trusted, family-owned tone (in business since 1998)',
                    'Add a $99 Precision Tune-Up seasonal discount badge',
                    'Make all buttons rounded pills with high-contrast amber hover'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setChatInput(preset)}
                      className="text-left px-2.5 py-1.5 rounded bg-bg-base border border-border-dim hover:border-cyan-500/50 hover:bg-bg-subtle text-[11px] text-text-secondary hover:text-text-primary transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span className="line-clamp-1">{preset}</span>
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages & Input Stream */}
          <div className="lg:col-span-8 bg-bg-raised border border-border-dim rounded-xl flex flex-col h-[650px] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border-dim flex items-center justify-between bg-bg-base/40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-text-primary">Hermes Lab Dialogue</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {engineStatus?.activeEngine || 'Nous Hermes 3 (70B / 405B) Live'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-text-tertiary">
                {engineStatus?.activeModel || 'Direct Nous Research Engine'}
              </span>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h4 className="text-sm font-bold text-text-primary">Personalize Assets to Your Taste</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Ask Hermes to alter color schemes, rewrite copy, add emergency warranty badges, or re-structure layout forms. Hermes updates the code in real-time.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`max-w-[80%] space-y-2`}>
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isUser
                              ? 'bg-cyan-600 text-white rounded-tr-none'
                              : 'bg-bg-base border border-border-dim text-text-primary rounded-tl-none'
                          }`}
                        >
                          {msg.thoughtProcess && (
                            <div className="mb-2 p-2 bg-bg-subtle border border-border-dim rounded text-[10px] font-mono text-text-tertiary">
                              <span className="font-bold text-cyan-400">Hermes Reasoning: </span>
                              {msg.thoughtProcess}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {/* Attached / Updated Artifact Badge */}
                          {msg.attachedArtifact && (
                            <div className="mt-3 p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-between gap-2">
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">
                                  Updated Asset Ready
                                </span>
                                <span className="text-xs font-bold text-text-primary block line-clamp-1">
                                  {msg.attachedArtifact.title}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setActiveArtifact(msg.attachedArtifact);
                                  setActiveSubTab('artifacts');
                                }}
                                className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-white text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <span>Preview</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className={`text-[9px] font-mono text-text-tertiary px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {isUser && (
                        <div className="w-7 h-7 rounded-lg bg-bg-subtle text-text-secondary border border-border-dim flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border-dim bg-bg-base/60">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    activeArtifact 
                      ? `Tell Hermes how to personalize "${activeArtifact.title}"...`
                      : 'Ask Hermes to build or customize an asset to your taste...'
                  }
                  className="flex-1 bg-bg-raised border border-border-dim rounded-lg px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || sendingChat}
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/10 cursor-pointer disabled:opacity-50"
                >
                  {sendingChat ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <SendHorizontal className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {activeSubTab === 'artifacts' && (
        <div className="space-y-4">
          {/* PostgreSQL Storage Status & Architecture Strip */}
          <div className="bg-bg-raised border border-border-dim rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary">Durable Database Persistence</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono uppercase font-bold">
                    PostgreSQL: hermes_lab_artifacts
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  All landing pages, service ledgers, diagnostic scripts, and production revisions are permanently stored in your relational schema.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-text-tertiary">
              <span className="px-2 py-1 bg-bg-base border border-border-dim rounded-md">
                Total Stored: <strong className="text-text-primary font-sans">{artifacts.length}</strong>
              </span>
              <button
                onClick={fetchArtifacts}
                className="p-1.5 bg-bg-base border border-border-dim hover:border-cyan-500 text-text-secondary hover:text-text-primary rounded-md transition-colors cursor-pointer"
                title="Sync with PostgreSQL"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Artifacts List */}
            <div className="lg:col-span-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-text-tertiary px-1">
                <span>Stored Productions</span>
                <span className="text-[10px] text-cyan-400 lowercase">drizzle orm</span>
              </div>
              {artifacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-tertiary border border-border-dim rounded-xl bg-bg-raised">
                  No artifacts generated yet. Use the Tool Foundry to create your first landing page or ad set.
                </div>
              ) : (
                <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                  {artifacts.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => setActiveArtifact(art)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        activeArtifact?.id === art.id
                          ? 'bg-cyan-500/10 border-cyan-500/50 shadow-sm'
                          : 'bg-bg-raised border-border-dim hover:bg-bg-subtle'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-text-primary line-clamp-1">{art.title}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase">
                          {art.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">
                        {art.content?.summary || 'No summary available.'}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-dim/40 text-[10px] text-text-tertiary font-mono">
                        <span className="truncate max-w-[120px]">UUID: {art.id.slice(0, 8)}...</span>
                        <span>{new Date(art.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Artifact Viewer */}
            <div className="lg:col-span-8 bg-bg-raised border border-border-dim rounded-xl p-5 space-y-4 shadow-sm flex flex-col h-[700px]">
              {activeArtifact ? (
                <>
                  {/* Viewer Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-dim pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-text-primary">{activeArtifact.title}</h3>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Emil Kowalski UI/UX Standard
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">{activeArtifact.content?.summary}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* View mode toggle */}
                      <div className="flex items-center bg-bg-base border border-border-dim rounded-lg p-0.5 text-xs">
                        <button
                          onClick={() => setViewMode('preview')}
                          className={`px-2.5 py-1 rounded-md ${viewMode === 'preview' ? 'bg-cyan-500 text-white' : 'text-text-secondary'}`}
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => setViewMode('code')}
                          className={`px-2.5 py-1 rounded-md ${viewMode === 'code' ? 'bg-cyan-500 text-white' : 'text-text-secondary'}`}
                        >
                          Code
                        </button>
                      </div>

                      {/* Mobile/Desktop toggle if landing page */}
                      {activeArtifact.toolId === 'landing_page' && viewMode === 'preview' && (
                        <div className="flex items-center bg-bg-base border border-border-dim rounded-lg p-0.5 text-xs">
                          <button
                            onClick={() => setDevicePreview('desktop')}
                            className={`p-1.5 rounded-md ${devicePreview === 'desktop' ? 'bg-bg-subtle text-cyan-400' : 'text-text-secondary'}`}
                            title="Desktop View"
                          >
                            <Laptop className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDevicePreview('mobile')}
                            className={`p-1.5 rounded-md ${devicePreview === 'mobile' ? 'bg-bg-subtle text-cyan-400' : 'text-text-secondary'}`}
                            title="Mobile View"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {activeArtifact.toolId === 'landing_page' && (
                        <>
                          <button
                            onClick={handleOpenInNewTab}
                            className="p-1.5 bg-bg-base border border-border-dim hover:border-cyan-500 rounded-lg text-text-secondary hover:text-text-primary text-xs flex items-center gap-1 cursor-pointer"
                            title="Open Live Public URL in New Window"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCopyLiveLink}
                            className="p-1.5 bg-bg-base border border-border-dim hover:border-cyan-500 rounded-lg text-text-secondary hover:text-cyan-400 text-xs flex items-center gap-1 cursor-pointer"
                            title="Copy Public Shareable Landing Page Link"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={handleCopyCode}
                        className="p-1.5 bg-bg-base border border-border-dim hover:border-cyan-500 rounded-lg text-text-secondary hover:text-text-primary text-xs flex items-center gap-1 cursor-pointer"
                        title="Copy Code"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={handleDownloadCode}
                        className="p-1.5 bg-bg-base border border-border-dim hover:border-cyan-500 rounded-lg text-text-secondary hover:text-text-primary text-xs flex items-center gap-1 cursor-pointer"
                        title="Download File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content Canvas */}
                  <div className="flex-1 overflow-hidden rounded-lg border border-border-dim bg-bg-base relative">
                    {viewMode === 'preview' ? (
                      activeArtifact.toolId === 'landing_page' || activeArtifact.content?.renderedOutput?.includes('<html') ? (
                        <div className="w-full h-full flex items-center justify-center p-2 bg-paper-100">
                          <iframe
                            srcDoc={activeArtifact.content.renderedOutput}
                            title="Landing Page Preview"
                            className={`h-full border border-border-dim rounded-lg shadow-sm transition-all ${
                              devicePreview === 'mobile' ? 'w-[375px]' : 'w-full'
                            }`}
                            sandbox="allow-scripts"
                          />
                        </div>
                      ) : (
                        <div className="p-4 overflow-y-auto h-full space-y-4 text-xs font-mono">
                          <div className="p-3 bg-bg-raised border border-border-dim rounded-lg text-text-secondary whitespace-pre-wrap">
                            {activeArtifact.content?.renderedOutput}
                          </div>
                        </div>
                      )
                    ) : (
                      <pre className="p-4 overflow-auto h-full text-xs font-mono text-cyan-400 bg-slate-950 select-all">
                        <code>{activeArtifact.content?.renderedOutput}</code>
                      </pre>
                    )}
                  </div>
                </>
              ) : (
                <div className="m-auto text-center text-text-tertiary text-xs">
                  Select an artifact from the list to preview or export.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: DIAGNOSTIC DOCTOR & RESILIENCE ─── */}
      {activeSubTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="bg-bg-raised border border-border-dim rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Autonomous Resilience Overseer
              </h3>
              <p className="text-xs text-text-secondary">
                Continuous telemetry monitoring for webhook delivery failures, attribution tag drops, and zero-conversion leaks.
              </p>
            </div>
            <button
              onClick={triggerDiagnosticScan}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white font-bold rounded-lg text-xs flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Execute Deep System Health Audit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bg-raised border border-border-dim rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono uppercase text-text-tertiary">Active Monitored Surfaces</span>
              <div className="text-xl font-extrabold text-cyan-400">4 Surfaces</div>
              <p className="text-[11px] text-text-secondary">Google Ads GCLID, Webhook Outbox, SSL, Mobile Vitals</p>
            </div>
            <div className="bg-bg-raised border border-border-dim rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono uppercase text-text-tertiary">Open Diagnostic Incidents</span>
              <div className="text-xl font-extrabold text-amber-400">{incidents.length} Pending</div>
              <p className="text-[11px] text-text-secondary">Automated self-healing proposals ready in Lab</p>
            </div>
            <div className="bg-bg-raised border border-border-dim rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono uppercase text-text-tertiary">Healing Execution Policy</span>
              <div className="text-xl font-extrabold text-emerald-400">SANDBOX_GATED</div>
              <p className="text-[11px] text-text-secondary">Operator maintains 100% review & deploy control</p>
            </div>
          </div>

          {/* Incident Ledger */}
          <div className="bg-bg-raised border border-border-dim rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
              Incident Forensic Ledger
            </h4>
            {incidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-tertiary border border-border-dim rounded-lg">
                <Check className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                Zero critical anomalies detected across your marketing and outbox surfaces.
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map((inc) => (
                  <div key={inc.id} className="p-4 rounded-lg bg-bg-base border border-border-dim space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                          inc.severity === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {inc.severity}
                        </span>
                        <h5 className="text-xs font-bold text-text-primary">{inc.title}</h5>
                      </div>
                      <span className="text-[10px] font-mono text-text-tertiary">{new Date(inc.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-xs text-text-secondary">
                      <strong className="text-text-primary">Root Cause:</strong> {inc.rootCause}
                    </div>
                    <div className="text-xs text-cyan-400 bg-cyan-500/5 p-2.5 rounded border border-cyan-500/20 flex items-center justify-between">
                      <div>
                        <strong className="text-text-primary">Proposed Self-Healing Fix:</strong> {inc.proposedFix}
                      </div>
                      <button
                        onClick={() => {
                          if (catalog.length > 0) {
                            handleSelectTool(catalog[0]);
                          }
                          setActiveSubTab('tools');
                        }}
                        className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold uppercase ml-4 shrink-0 cursor-pointer"
                      >
                        Deploy from Lab
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
