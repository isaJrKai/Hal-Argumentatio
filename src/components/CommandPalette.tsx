import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  Map, 
  Cpu, 
  Users, 
  Briefcase, 
  BarChart3, 
  TrendingUp, 
  Play, 
  Settings, 
  ArrowRight, 
  User, 
  BookOpen, 
  Compass, 
  FileText,
  Clock,
  Trash2,
  Network,
  Share2,
  Activity,
  Database,
  Shield,
  Zap,
  Layers,
  Layout
} from 'lucide-react';
import { Lead, Campaign } from '../types';
import { useInspector } from '../context/InspectorContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  campaigns?: Campaign[];
  onNavigate: (tabId: string) => void;
  onRunSkill?: (skillId: string) => void;
}

interface SearchHistoryItem {
  query: string;
  timestamp: string; // ISO string to enforce 7 days retention
}

export default function CommandPalette({
  isOpen,
  onClose,
  leads = [],
  campaigns = [],
  onNavigate,
  onRunSkill
}: CommandPaletteProps) {
  const { openInspector } = useInspector();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [hermesArtifacts, setHermesArtifacts] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch cached or active Hermes artifacts when opened
  useEffect(() => {
    if (isOpen) {
      const fetchArtifacts = async () => {
        try {
          const token = localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || '';
          const res = await fetch('/api/hermes/artifacts', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.artifacts)) {
              setHermesArtifacts(data.artifacts);
            }
          }
        } catch (_) {}
      };
      fetchArtifacts();
    }
  }, [isOpen]);

  // Load and clean history on mount or when the palette opens
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('hal_search_history');
      if (saved) {
        try {
          const parsed: SearchHistoryItem[] = JSON.parse(saved);
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          
          // Filter out queries older than 7 days
          const validHistory = parsed.filter(item => new Date(item.timestamp).getTime() >= sevenDaysAgo);
          setHistory(validHistory);
          
          // Update local storage with cleaned list
          localStorage.setItem('hal_search_history', JSON.stringify(validHistory));
        } catch (e) {
          console.error('Failed to parse search history', e);
        }
      }
    }
  }, [isOpen]);

  const saveQueryToHistory = (queryStr: string) => {
    const trimmed = queryStr.trim();
    if (!trimmed) return;

    const newItem: SearchHistoryItem = {
      query: trimmed,
      timestamp: new Date().toISOString()
    };

    setHistory(prev => {
      // Remove previous duplicates of the same query to move it to the top
      const filtered = prev.filter(item => item.query.toLowerCase() !== trimmed.toLowerCase());
      const updated = [newItem, ...filtered].slice(0, 15); // Maintain top 15 queries
      localStorage.setItem('hal_search_history', JSON.stringify(updated));
      return updated;
    });
  };

  const removeHistoryItem = (queryStr: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering/filling the search bar
    setHistory(prev => {
      const updated = prev.filter(item => item.query.toLowerCase() !== queryStr.toLowerCase());
      localStorage.setItem('hal_search_history', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem('hal_search_history');
  };

  const handleHistoryItemClick = (queryStr: string) => {
    setSearch(queryStr);
    inputRef.current?.focus();
  };

  // Navigation commands
  const navigationCommands = [
    { id: 'overview', label: 'Go to Mission Control', icon: Sparkles, type: 'nav', keywords: 'dashboard home overview stats kpi mission' },
    { id: 'blueprint', label: 'Go to Claude Blueprint & Spatial Audit', icon: Layout, type: 'nav', keywords: 'claude blueprint audit spatial dossier architecture overview auto-cad' },
    { id: 'neural', label: 'Go to Synaptic Neural Networks (Mesh & Learning)', icon: Network, type: 'nav', keywords: 'synaptic tool neural networks synaptic mesh deep learning weights nodes dual drive autonomous offline self teaching' },
    { id: 'missions', label: 'Go to Operations (Missions)', icon: Briefcase, type: 'nav', keywords: 'operations tasks missions goals execution' },
    { id: 'forecasts', label: 'Go to Intelligence (Forecasts & Scans)', icon: TrendingUp, type: 'nav', keywords: 'intelligence forecast revenue predictions market analytics' },
    { id: 'board', label: 'Go to Sales (Clients & Pipeline)', icon: Users, type: 'nav', keywords: 'sales pipeline clients crm deals revenue' },
    { id: 'campaigns', label: 'Go to Marketing (Campaigns & Sequences)', icon: BarChart3, type: 'nav', keywords: 'marketing email cold outreach campaigns sequences' },
    { id: 'leads', label: 'Go to Memory (Prospect Leads)', icon: Compass, type: 'nav', keywords: 'leads prospects contractors calgary winnipeg edmonton' },
    { id: 'drive', label: 'Go to Knowledge (Drive & Assets)', icon: FileText, type: 'nav', keywords: 'knowledge vault files documents drive assets' },
    { id: 'skills', label: 'Go to AI Council & Skills Engine', icon: Cpu, type: 'nav', keywords: 'skills ai council agents strategy audit seo' },
    { id: 'connectors', label: 'Go to Connectors Hub (AI & Cloud APIs)', icon: Share2, type: 'nav', keywords: 'connectors hub integrations google gemini nvidia nemotron stripe neon' },
    { id: 'health', label: 'Go to System Heartbeat & Health', icon: Activity, type: 'nav', keywords: 'health heartbeat diagnostics logs latency status' },
    { id: 'scheduler', label: 'Go to Simulations & Automated Scans', icon: Play, type: 'nav', keywords: 'simulations cron scheduler background jobs' },
    { id: 'bible', label: 'Go to HAL Constitution & Directives', icon: BookOpen, type: 'nav', keywords: 'bible constitution directives lore system architecture' },
    { id: 'credentials', label: 'Go to Settings & Database (Neon/Postgres)', icon: Settings, type: 'nav', keywords: 'settings postgres neon database api keys tokens credentials' }
  ];

  // Synaptic Tools & Cognitive Engines
  const synapticCommands = [
    { 
      id: 'synaptic_dual_consensus', 
      label: 'Synaptic Tool: Dual-Drive Cognitive Consensus (Gemini 2.5 + Nemotron 70B)', 
      description: 'Concurrent multimodal discovery + high-speed deterministic verification with live failover telemetry.',
      icon: Cpu, 
      type: 'synaptic', 
      tab: 'neural', 
      subTab: 'dual_engine',
      badge: 'CONSENSUS CO-PILOT',
      category: 'DUAL DRIVE',
      keywords: 'synaptic tool cognitive task cognitive tasks reasoning consensus dual drive parallel synthesis cross validation nemotron 70b gemini 2.5 failover co pilot multimodal deterministic verification architecture' 
    },
    { 
      id: 'synaptic_bayesian_calibration', 
      label: 'Synaptic Tool: Autonomous Bayesian Calibration Matrix', 
      description: 'Calibrates feature weights (SSL status, PageSpeed, Review count, Territory priors) per epoch without cloud dependencies.',
      icon: Sparkles, 
      type: 'synaptic', 
      tab: 'neural', 
      subTab: 'autonomous_learning',
      badge: 'SELF-TEACHING',
      category: 'BAYESIAN WEIGHTS',
      keywords: 'synaptic tool cognitive task cognitive tasks reasoning weights neural weights bayesian calibration matrix epoch loss minimization priors learning gradient descent self teaching autonomous offline' 
    },
    { 
      id: 'synaptic_objection_graph', 
      label: 'Synaptic Tool: Self-Taught Objection & Win-Rate Graph', 
      description: 'Resolves price, timing, and authority resistance using calibrated win/loss confidence vectors.',
      icon: Shield, 
      type: 'synaptic', 
      tab: 'neural', 
      subTab: 'autonomous_learning',
      badge: 'GRAPH MODEL',
      category: 'OBJECTION SOLVER',
      keywords: 'synaptic tool cognitive task cognitive tasks reasoning objection solver rebuttal graph resistance pricing timing authority win rate conversion optimization sales objections cold call resistance' 
    },
    { 
      id: 'synaptic_pitch_synthesizer', 
      label: 'Synaptic Tool: Offline Cold Script & Discovery Synthesizer', 
      description: 'Generates phone & email discovery scripts from self-taught Bayesian weights in zero-latency offline mode.',
      icon: Play, 
      type: 'synaptic', 
      tab: 'neural', 
      subTab: 'autonomous_learning',
      badge: 'OFFLINE SAFE',
      category: 'SCRIPT ENGINE',
      keywords: 'synaptic tool cognitive task cognitive tasks reasoning pitch synthesizer cold script cold outreach cold email discovery call script synthesis offline pitch phone script outreach message' 
    },
    { 
      id: 'synaptic_mesh_inspector', 
      label: 'Synaptic Tool: 13,000+ Associative Mesh Synapse Inspector', 
      description: 'Explores interactive associative nodes, hyperlinked definitions, and mathematical activation gradients.',
      icon: Network, 
      type: 'synaptic', 
      tab: 'neural', 
      subTab: 'neural_mesh',
      badge: '13K+ SYNAPSES',
      category: 'SYNAPTIC MESH',
      keywords: 'synaptic tool cognitive task cognitive tasks reasoning synaptic mesh inspector neural graph nodes dictionary layers associative graph topology variables neural intelligence node' 
    },
    { 
      id: 'synaptic_offline_toggle', 
      label: 'Synaptic Tool: Simulated Zero-Latency Offline Mode Toggle', 
      description: 'Isolates the intelligence engine from cloud APIs to stress-test local autonomous reasoning.',
      icon: Zap, 
      type: 'synaptic', 
      tab: 'neural', 
      subTab: 'autonomous_learning',
      badge: 'STATE CONTROL',
      category: 'SYSTEM RESILIENCE',
      keywords: 'synaptic tool cognitive task offline mode toggle simulated cloud disconnect zero latency local autonomous offline reasoning failover fallback stress test' 
    },
    { 
      id: 'credentials', 
      label: 'Synaptic Tool: Sync Neural Weights to Neon Cloud PostgreSQL', 
      description: 'Durable cloud replication of Bayesian weights and learning history to PostgreSQL.',
      icon: Database, 
      type: 'nav', 
      tab: 'credentials',
      badge: 'CLOUD BACKUP',
      category: 'POSTGRES SYNC',
      keywords: 'synaptic tool sync postgres neon database cloud backup weights persistence durable replication' 
    }
  ];

  // Neural Intelligence Nodes (Surfaced for cognitive tasks & architecture exploration)
  const neuralNodeCommands = [
    {
      id: 'node_SECURE_SQLITE',
      nodeId: 'SECURE_SQLITE',
      label: 'Neural Node: SECURE_SQLITE (Sensorium Vault)',
      description: 'Local encrypted relational store holding leads, audits, and real-time territory telemetry.',
      icon: Database,
      type: 'node',
      tab: 'neural',
      subTab: 'neural_mesh',
      badge: '98% ACTIVATION',
      category: 'SENSORIUM INGEST',
      keywords: 'neural node neural intelligence node cognitive task secure sqlite sensorium ingest database store pii local cache encryption'
    },
    {
      id: 'node_BAYESIAN_CALIBRATOR',
      nodeId: 'BAYESIAN_CALIBRATOR',
      label: 'Neural Node: BAYESIAN_CALIBRATOR (Feedback Optimization)',
      description: 'Calibrates feature weights and prior probabilities per territory epoch without external LLMs.',
      icon: Sparkles,
      type: 'node',
      tab: 'neural',
      subTab: 'neural_mesh',
      badge: '94% ACTIVATION',
      category: 'FEEDBACK OPTIMIZATION',
      keywords: 'neural node neural intelligence node cognitive task bayesian calibrator feedback optimization weights loss gradient learning'
    },
    {
      id: 'node_CRYPTOGRAPHIC_GUARD',
      nodeId: 'CRYPTOGRAPHIC_GUARD',
      label: 'Neural Node: CRYPTOGRAPHIC_GUARD (PII AES-256-GCM)',
      description: 'Deterministic security gateway verifying that sensitive customer PII is encrypted before persistence.',
      icon: Shield,
      type: 'node',
      tab: 'neural',
      subTab: 'neural_mesh',
      badge: '100% ACTIVATION',
      category: 'CRYPTOGRAPHIC GUARD',
      keywords: 'neural node neural intelligence node cognitive task cryptographic guard security pii encryption aes-256-gcm firewall privacy'
    },
    {
      id: 'node_TERRITORY_MAP',
      nodeId: 'TERRITORY_CONQUEST_MAP',
      label: 'Neural Node: TERRITORY_CONQUEST_MAP (Relational Spatial Graph)',
      description: 'Spatial associative graph correlating contractor densities, competitor gaps, and geo-scores.',
      icon: Map,
      type: 'node',
      tab: 'neural',
      subTab: 'neural_mesh',
      badge: '91% ACTIVATION',
      category: 'RELATIONAL MAP',
      keywords: 'neural node neural intelligence node cognitive task territory conquest map spatial relational geo competitor heat map'
    },
    {
      id: 'node_REVENUE_PREDICTOR',
      nodeId: 'REVENUE_PREDICTOR_V2',
      label: 'Neural Node: REVENUE_PREDICTOR_V2 (Decision Engine)',
      description: 'Predicts monthly lost contractor revenue using SSL state, mobile page speed, and local review rank.',
      icon: TrendingUp,
      type: 'node',
      tab: 'neural',
      subTab: 'neural_mesh',
      badge: '89% ACTIVATION',
      category: 'DECISION ENGINE',
      keywords: 'neural node neural intelligence node cognitive task revenue predictor decision engine lost revenue forecast roi model calculation'
    },
    {
      id: 'node_AUTONOMOUS_FALLBACK',
      nodeId: 'AUTONOMOUS_FALLBACK_CORE',
      label: 'Neural Node: AUTONOMOUS_FALLBACK_CORE (Cognitive Associative)',
      description: 'Zero-cloud emergency reasoning core activating when cloud channels are unreachable or offline.',
      icon: Zap,
      type: 'node',
      tab: 'neural',
      subTab: 'neural_mesh',
      badge: '96% ACTIVATION',
      category: 'COGNITIVE ASSOCIATIVE',
      keywords: 'neural node neural intelligence node cognitive task autonomous fallback core zero cloud offline reasoning failover emergency'
    }
  ];

  // Skill commands
  const skillCommands = [
    { id: 'website_audit', label: 'Run Website Performance Audit', icon: Cpu, type: 'skill', keywords: 'audit website speed seo performance lighthouse technical audit' },
    { id: 'outreach', label: 'Generate Outreach Proposal Email', icon: Cpu, type: 'skill', keywords: 'outreach email proposal pitch cold email sequence' },
    { id: 'geo_map', label: 'Open Territory Conquest Map', icon: Map, type: 'skill', keywords: 'map territory conquest geographic spatial competitor' },
    { id: 'research', label: 'Perform Prospect Deep Research', icon: Cpu, type: 'skill', keywords: 'deep research intelligence competitor analysis background' },
    { id: 'seo', label: 'Run Technical SEO Assessment', icon: Cpu, type: 'skill', keywords: 'seo assessment technical audit ssl performance score' }
  ];

  // Lead commands - indexes all leads dynamically
  const leadCommands = leads.map(lead => {
    const serviceType = lead.serviceType || (lead as any).niche || 'Contracting';
    const status = lead.status || 'new';
    return {
      id: lead.id,
      label: `${lead.businessName || 'Business'} (${lead.city || 'Territory'})`,
      description: `${serviceType.toUpperCase()} • Status: ${status.toUpperCase()} • Urgency: ${lead.urgencyScore || 7.5}/10 • Speed: ${lead.performanceScore || 50}/100`,
      icon: User,
      type: 'lead',
      leadData: lead,
      badge: status.toUpperCase(),
      keywords: `${lead.businessName || ''} ${lead.city || ''} ${serviceType} ${lead.ownerName || ''} ${lead.phone || ''} ${lead.email || ''} ${status} prospect lead contractor`
    };
  });

  // Campaign commands - indexes all campaigns
  const campaignCommands = campaigns.map(camp => {
    const status = camp.status || 'draft';
    const platform = camp.platform || 'General';
    return {
      id: camp.id,
      label: `Campaign: ${camp.name || 'Untitled'}`,
      description: `Platform: ${platform} • Budget: $${(camp.budget || 0).toLocaleString()} • Status: ${status.toUpperCase()}`,
      icon: BarChart3,
      type: 'campaign',
      campaignData: camp,
      badge: platform.toUpperCase(),
      keywords: `${camp.name || ''} ${platform} ${status} campaign ads budget spend marketing`
    };
  });

  // Contract and legal template commands
  const contractCommands = [
    {
      id: 'contract_retainer',
      label: 'Standard Contractor Service Retainer Agreement',
      description: 'Pre-drafted multi-stage marketing, SEO, and lead acquisition agreement with milestone escrow.',
      icon: FileText,
      type: 'contract',
      badge: 'LEGAL RETAINER',
      targetTab: 'contracts',
      keywords: 'contract legal agreement retainer terms client contractor escrow service agreement'
    },
    {
      id: 'contract_nda',
      label: 'Mutual Non-Disclosure Agreement (NDA)',
      description: 'Protects proprietary territory data, Hermes generation weights, and lead pipeline intelligence.',
      icon: FileText,
      type: 'contract',
      badge: 'LEGAL NDA',
      targetTab: 'contracts',
      keywords: 'nda non disclosure agreement privacy confidentiality proprietary secrets'
    },
    {
      id: 'contract_performance',
      label: 'Performance Growth Milestone Agreement',
      description: 'Pay-per-qualified-lead and ROAS revenue split contract for high-volume trade contractors.',
      icon: FileText,
      type: 'contract',
      badge: 'COMMISSION SLA',
      targetTab: 'contracts',
      keywords: 'commission performance bonus revenue share growth milestone agreement roas'
    }
  ];

  // HAL Bible & Architecture Specifications
  const documentCommands = [
    {
      id: 'doc_01_vision',
      label: 'HAL Spec 01: Vision & Strategic Mandate',
      description: 'The grand mandate: coordinating local contractor outreach through evidence-based intelligence.',
      icon: BookOpen,
      type: 'document',
      badge: 'CONSTITUTION',
      docData: { title: 'HAL Spec 01: Vision', id: '01' },
      targetTab: 'bible',
      keywords: 'spec 01 vision constitution mission hal mandate north star'
    },
    {
      id: 'doc_02_philosophy',
      label: 'HAL Spec 02: Core Philosophy & Intentionality Laws',
      description: 'The supreme rule of intentionality: Fact vs Hypothesis, No Unsolicited Noise, Zero AI Slop.',
      icon: BookOpen,
      type: 'document',
      badge: 'PHILOSOPHY',
      docData: { title: 'HAL Spec 02: Philosophy', id: '02' },
      targetTab: 'bible',
      keywords: 'spec 02 philosophy intentionality laws rules constitution principles'
    },
    {
      id: 'doc_04_design_system',
      label: 'HAL Spec 04: Design System & Primitives',
      description: 'Unified visual primitives, cryptographic UI states, and responsive AutoCAD-grade layouts.',
      icon: BookOpen,
      type: 'document',
      badge: 'DESIGN SYSTEM',
      docData: { title: 'HAL Spec 04: Design System', id: '04' },
      targetTab: 'bible',
      keywords: 'spec 04 design system ui primitives components tokens'
    },
    {
      id: 'doc_17_security',
      label: 'HAL Spec 17: Security & Cryptographic PII Vault',
      description: 'AES-GCM-256 field encryption for prospect phone numbers, emails, and contractor credentials.',
      icon: Shield,
      type: 'document',
      badge: 'ENCRYPTION',
      docData: { title: 'HAL Spec 17: Security', id: '17' },
      targetTab: 'bible',
      keywords: 'spec 17 security encryption pii crypto aes gcm vault credentials'
    },
    {
      id: 'doc_24_hermes',
      label: 'HAL Spec 24: Hermes Engine Architecture',
      description: 'Nous Research Hermes synthesis: dynamic anti-AI landing pages, diagnostic scripts, and event-bus dispatch.',
      icon: Sparkles,
      type: 'document',
      badge: 'HERMES SPEC',
      docData: { title: 'HAL Spec 24: Hermes Engine', id: '24' },
      targetTab: 'bible',
      keywords: 'spec 24 hermes engine nous research ai synthesis landing page ad copy'
    }
  ];

  // Dynamically map any fetched Hermes artifacts
  const artifactCommands = hermesArtifacts.map(art => {
    const category = art.category || 'ASSET';
    const status = art.status || 'DRAFT';
    return {
      id: `artifact_${art.id}`,
      label: `Hermes Artifact: ${art.title || 'Untitled'}`,
      description: `Category: ${category.toUpperCase()} • Status: ${status.toUpperCase()} • ${art.content?.summary || 'Synthesized asset'}`,
      icon: Sparkles,
      type: 'artifact',
      badge: 'HERMES ASSET',
      docData: art,
      targetTab: 'bible',
      keywords: `${art.title || ''} ${category} ${art.toolId || ''} hermes artifact asset report code`
    };
  });

  // Combine commands
  const allCommands = [
    ...synapticCommands,
    ...neuralNodeCommands,
    ...skillCommands,
    ...navigationCommands,
    ...campaignCommands,
    ...contractCommands,
    ...documentCommands,
    ...artifactCommands,
    ...leadCommands
  ];

  // Filter commands based on search (matching label, description, category or keywords)
  const filteredCommands = allCommands.filter(cmd => {
    const q = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      ((cmd as any).description && (cmd as any).description.toLowerCase().includes(q)) ||
      ((cmd as any).category && (cmd as any).category.toLowerCase().includes(q)) ||
      (cmd.keywords && cmd.keywords.toLowerCase().includes(q))
    );
  }).slice(0, 35); // Keep results responsive and concise

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Handle global keyboard triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-focus input when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Handle navigation/selection keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (search.trim()) {
        saveQueryToHistory(search);
      }
      if (filteredCommands[selectedIndex]) {
        executeCommand(filteredCommands[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const executeCommand = (cmd: any) => {
    if (search.trim()) {
      saveQueryToHistory(search);
    }
    if (cmd.type === 'nav') {
      onNavigate(cmd.id);
    } else if (cmd.type === 'synaptic') {
      if (cmd.subTab) {
        localStorage.setItem('hal_neural_active_tab', cmd.subTab);
      }
      window.dispatchEvent(new Event('storage'));
      onNavigate(cmd.tab || 'neural');
    } else if (cmd.type === 'node') {
      localStorage.setItem('hal_neural_active_tab', cmd.subTab || 'neural_mesh');
      if (cmd.nodeId) {
        localStorage.setItem('hal_neural_active_node', cmd.nodeId);
      }
      window.dispatchEvent(new Event('storage'));
      onNavigate(cmd.tab || 'neural');
    } else if (cmd.type === 'skill') {
      onNavigate('skills');
      onRunSkill(cmd.id);
    } else if (cmd.type === 'lead') {
      if (cmd.leadData) {
        openInspector('lead', cmd.leadData.businessName, cmd.leadData);
      }
      onNavigate('leads');
    } else if (cmd.type === 'campaign') {
      if (cmd.campaignData) {
        openInspector('campaign', cmd.campaignData.name, cmd.campaignData);
      }
      onNavigate('campaigns');
    } else if (cmd.type === 'contract') {
      onNavigate(cmd.targetTab || 'contracts');
    } else if (cmd.type === 'document' || cmd.type === 'artifact') {
      if (cmd.docData) {
        openInspector('artifact', cmd.docData.title || cmd.label, cmd.docData);
      }
      onNavigate(cmd.targetTab || 'bible');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-[8px]"
        />

        {/* Palette Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[640px] bg-bg-overlay border border-border-default shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[540px]"
        >
          {/* Header search bar */}
          <div className="flex items-center gap-3.5 px-4 py-3.5 border-b border-border-dim bg-bg-raised/70">
            <Search className="w-4 h-4 text-accent shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search cognitive tasks, synaptic tools, neural nodes, skills, or prospects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent text-text-primary text-[13px] outline-none border-none placeholder:text-text-tertiary w-full font-mono"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-text-tertiary hover:text-text-primary text-[10px] font-mono px-1 py-0.5 rounded cursor-pointer"
              >
                CLEAR
              </button>
            )}
            <span className="text-[10px] font-mono bg-bg-subtle text-text-tertiary px-1.5 py-0.5 rounded border border-border-dim shrink-0">ESC</span>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-2.5 scrollbar-none space-y-2 select-none">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center font-mono space-y-1">
                <div className="text-xs text-text-tertiary font-bold">
                  NO INTELLIGENCE COMMANDS FOUND FOR "{(search || '').toUpperCase()}"
                </div>
                <div className="text-[10px] text-text-secondary">
                  Try searching "cognitive", "objection", "dual drive", "consensus", "bayesian", "script", or a prospect name.
                </div>
              </div>
            ) : (
              <>
                {/* Categorize Commands manually if search is empty */}
                {search === '' ? (
                  <>
                    {/* Search History Section */}
                    {history.length > 0 && (
                      <div className="px-1 pb-1">
                        <div className="flex items-center justify-between px-2 py-1 border-b border-border-dim pb-1 mb-1.5">
                          <div className="text-[9px] font-mono font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-text-tertiary shrink-0" />
                            <span>Recent Searches</span>
                          </div>
                          <button
                            type="button"
                            onClick={clearAllHistory}
                            className="text-[9px] font-mono text-red-400 hover:text-red-300 transition-colors uppercase font-bold cursor-pointer"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1 px-2">
                          {history.map((item, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleHistoryItemClick(item.query)}
                              className="group flex items-center gap-1.5 bg-bg-subtle hover:bg-accent/15 border border-border-dim hover:border-accent/30 text-text-secondary hover:text-text-primary px-2.5 py-1 rounded text-[10px] font-mono cursor-pointer transition-all duration-100"
                              title={`Searched ${new Date(item.timestamp).toLocaleDateString()}`}
                            >
                              <span>{item.query}</span>
                              <button
                                type="button"
                                onClick={(e) => removeHistoryItem(item.query, e)}
                                className="text-text-tertiary hover:text-red-400 transition-colors cursor-pointer"
                                title="Remove search from history"
                              >
                                <Trash2 className="w-2.5 h-2.5 shrink-0" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Synaptic Tools Section */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-3 py-1 text-[9px] font-mono font-bold text-accent uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-accent" />
                          Synaptic Tools & Cognitive Engines
                        </span>
                        <span className="text-text-tertiary">{synapticCommands.length} Tools</span>
                      </div>
                      {synapticCommands.map((cmd) => {
                        const absoluteIdx = filteredCommands.indexOf(cmd);
                        const isSelected = absoluteIdx === selectedIndex;
                        return (
                          <div
                            key={cmd.id}
                            onClick={() => executeCommand(cmd)}
                            onMouseEnter={() => setSelectedIndex(absoluteIdx)}
                            className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected 
                                ? 'bg-accent/10 border-accent text-text-primary shadow-sm' 
                                : 'bg-bg-raised/60 border-border-dim hover:border-border-default text-text-secondary'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className={`p-1.5 rounded bg-bg-base border shrink-0 mt-0.5 ${isSelected ? 'border-accent text-accent' : 'border-border-dim text-text-tertiary'}`}>
                                <cmd.icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-mono font-bold truncate ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
                                    {cmd.label}
                                  </span>
                                  <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-accent/10 border border-accent/25 text-accent font-bold shrink-0">
                                    {cmd.badge}
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-text-secondary truncate font-sans">
                                  {cmd.description}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono text-accent font-bold">
                              <span>Launch</span>
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Operational Skills Section */}
                    <div className="space-y-1 pt-1.5">
                      <div className="px-3 py-1 text-[9px] font-mono font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-text-tertiary" />
                        HAL Operational Skills
                      </div>
                      {skillCommands.map((cmd) => {
                        const absoluteIdx = filteredCommands.indexOf(cmd);
                        const isSelected = absoluteIdx === selectedIndex;
                        return (
                          <div
                            key={cmd.id}
                            onClick={() => executeCommand(cmd)}
                            onMouseEnter={() => setSelectedIndex(absoluteIdx)}
                            className={`flex items-center justify-between px-3.5 py-2 rounded-md cursor-pointer transition-colors duration-100 ${
                              isSelected ? 'bg-bg-subtle text-text-primary border-l-2 border-accent' : 'text-text-secondary hover:bg-bg-raised'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <cmd.icon className={`w-3.5 h-3.5 ${isSelected ? 'text-accent' : 'text-text-tertiary'}`} />
                              <span className="text-[11px] font-mono uppercase tracking-wide">{cmd.label}</span>
                            </div>
                            <span className="text-[9px] font-mono text-accent bg-accent/5 border border-accent/20 px-1.5 py-0.5 rounded">SKILL</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Access Navigations */}
                    <div className="space-y-1 pt-1.5">
                      <div className="px-3 py-1 text-[9px] font-mono font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-text-tertiary" />
                        Quick Access Navigations
                      </div>
                      {navigationCommands.map((cmd) => {
                        const absoluteIdx = filteredCommands.indexOf(cmd);
                        const isSelected = absoluteIdx === selectedIndex;
                        return (
                          <div
                            key={cmd.id}
                            onClick={() => executeCommand(cmd)}
                            onMouseEnter={() => setSelectedIndex(absoluteIdx)}
                            className={`flex items-center justify-between px-3.5 py-2 rounded-md cursor-pointer transition-colors duration-100 ${
                              isSelected ? 'bg-bg-subtle text-text-primary border-l-2 border-accent' : 'text-text-secondary hover:bg-bg-raised'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <cmd.icon className={`w-3.5 h-3.5 ${isSelected ? 'text-accent' : 'text-text-tertiary'}`} />
                              <span className="text-[11px] font-mono uppercase tracking-wide">{cmd.label}</span>
                            </div>
                            {isSelected && <ArrowRight className="w-3 h-3 text-accent" />}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* Active Search Match List with rich card layout */
                  filteredCommands.map((cmd: any, idx) => {
                    const isSelected = idx === selectedIndex;
                    
                    if (cmd.type === 'synaptic') {
                      return (
                        <div
                          key={cmd.id + '-' + cmd.type}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected 
                              ? 'bg-accent/15 border-accent text-text-primary ring-1 ring-accent/30 shadow-md' 
                              : 'bg-bg-raised/70 border-border-dim hover:border-accent/40 text-text-secondary'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded bg-bg-base border shrink-0 mt-0.5 ${isSelected ? 'border-accent text-accent' : 'border-border-dim text-accent'}`}>
                              <cmd.icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono font-bold truncate ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
                                  {cmd.label}
                                </span>
                                <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-accent/15 border border-accent/30 text-accent font-extrabold uppercase shrink-0">
                                  {cmd.badge || 'SYNAPTIC TOOL'}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-secondary truncate font-sans">
                                {cmd.description}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono text-accent font-bold">
                            <span>Launch Tool</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      );
                    }

                    if (cmd.type === 'node') {
                      return (
                        <div
                          key={cmd.id + '-' + cmd.type}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected 
                              ? 'bg-sky-500/15 border-sky-400 text-text-primary ring-1 ring-sky-400/30 shadow-md' 
                              : 'bg-bg-raised/70 border-border-dim hover:border-sky-400/40 text-text-secondary'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded bg-bg-base border shrink-0 mt-0.5 ${isSelected ? 'border-sky-400 text-sky-400' : 'border-border-dim text-sky-400'}`}>
                              <cmd.icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono font-bold truncate ${isSelected ? 'text-sky-400' : 'text-text-primary'}`}>
                                  {cmd.label}
                                </span>
                                <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-sky-500/15 border border-sky-400/30 text-sky-400 font-extrabold uppercase shrink-0">
                                  {cmd.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-secondary truncate font-sans">
                                {cmd.description}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono text-sky-400 font-bold">
                            <span>Inspect Node</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      );
                    }

                    if (cmd.type === 'lead') {
                      return (
                        <div
                          key={cmd.id + '-' + cmd.type}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected 
                              ? 'bg-emerald-500/15 border-emerald-400 text-text-primary ring-1 ring-emerald-400/30 shadow-md' 
                              : 'bg-bg-raised/70 border-border-dim hover:border-emerald-400/40 text-text-secondary'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded bg-bg-base border shrink-0 mt-0.5 ${isSelected ? 'border-emerald-400 text-emerald-400' : 'border-border-dim text-emerald-400'}`}>
                              <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono font-bold truncate ${isSelected ? 'text-emerald-400' : 'text-text-primary'}`}>
                                  {cmd.label}
                                </span>
                                <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded border font-extrabold uppercase shrink-0 ${
                                  cmd.leadData?.status === 'converted' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                  cmd.leadData?.status === 'contacted' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                                  cmd.leadData?.status === 'dead' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                  'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                }`}>
                                  {cmd.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-secondary truncate font-sans">
                                {cmd.description}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                            <span>Inspect & Act</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      );
                    }

                    if (cmd.type === 'campaign') {
                      return (
                        <div
                          key={cmd.id + '-' + cmd.type}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected 
                              ? 'bg-purple-500/15 border-purple-400 text-text-primary ring-1 ring-purple-400/30 shadow-md' 
                              : 'bg-bg-raised/70 border-border-dim hover:border-purple-400/40 text-text-secondary'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded bg-bg-base border shrink-0 mt-0.5 ${isSelected ? 'border-purple-400 text-purple-400' : 'border-border-dim text-purple-400'}`}>
                              <BarChart3 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono font-bold truncate ${isSelected ? 'text-purple-400' : 'text-text-primary'}`}>
                                  {cmd.label}
                                </span>
                                <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-purple-500/15 border border-purple-400/30 text-purple-400 font-extrabold uppercase shrink-0">
                                  {cmd.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-secondary truncate font-sans">
                                {cmd.description}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono text-purple-400 font-bold">
                            <span>Inspect Campaign</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      );
                    }

                    if (cmd.type === 'document' || cmd.type === 'contract' || cmd.type === 'artifact') {
                      return (
                        <div
                          key={cmd.id + '-' + cmd.type}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected 
                              ? 'bg-amber-500/15 border-amber-400 text-text-primary ring-1 ring-amber-400/30 shadow-md' 
                              : 'bg-bg-raised/70 border-border-dim hover:border-amber-400/40 text-text-secondary'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded bg-bg-base border shrink-0 mt-0.5 ${isSelected ? 'border-amber-400 text-amber-400' : 'border-border-dim text-amber-400'}`}>
                              <cmd.icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono font-bold truncate ${isSelected ? 'text-amber-400' : 'text-text-primary'}`}>
                                  {cmd.label}
                                </span>
                                <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-400/30 text-amber-400 font-extrabold uppercase shrink-0">
                                  {cmd.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-secondary truncate font-sans">
                                {cmd.description}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono text-amber-400 font-bold">
                            <span>Open Document</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={cmd.id + '-' + cmd.type}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between px-3.5 py-2 rounded-md cursor-pointer transition-colors duration-100 ${
                          isSelected ? 'bg-bg-subtle text-text-primary border-l-2 border-accent' : 'text-text-secondary hover:bg-bg-raised'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <cmd.icon className={`w-3.5 h-3.5 ${isSelected ? 'text-accent' : 'text-text-tertiary'}`} />
                          <span className="text-[11px] font-mono uppercase tracking-wide">{cmd.label}</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          cmd.type === 'skill' ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' :
                          'text-text-tertiary'
                        }`}>
                          {(cmd.type || 'ACTION').toUpperCase()}
                        </span>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
