import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Shield, 
  FileText, 
  Database, 
  Key, 
  Cpu, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  ArrowRight, 
  Search, 
  Lock, 
  Code, 
  LineChart, 
  GitPullRequest, 
  Compass, 
  Users, 
  Settings, 
  Briefcase,
  HelpCircle,
  Eye,
  Type,
  Palette,
  Grid,
  BellRing,
  Maximize2,
  Loader2
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import { Dialog } from './ui/Dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmptyState } from './ui/Table';
import { MissionTitle, SectionTitle, CardTitle, MetadataText, ProseText, MonoValue } from './ui/Typography';
import { EmptyState } from './ui/EmptyState';
import { Breadcrumbs } from './ui/Breadcrumbs';
import { useToast } from '../context/ToastContext';

// We can reuse the design system components or write the Design System view inline for Document 04
interface DocumentSpec {
  id: string;
  number: string;
  title: string;
  description: string;
  status: 'canonical' | 'draft' | 'planned';
  phase: 'foundation' | 'intelligence' | 'engineering' | 'product';
  icon: any;
}

export default function HalBiblePanel() {
  const { toast } = useToast();
  const [selectedDocId, setSelectedDocId] = useState<string>('02');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Design system specific states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tableSort, setTableSort] = useState<'asc' | 'desc'>('asc');
  const [activeDSCategory, setActiveDSCategory] = useState<'primitives' | 'semantics' | 'interaction'>('primitives');

  // Verify Alignment state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationPassed, setVerificationPassed] = useState(false);

  // List of all 23 documents in the Master Plan
  const documents: DocumentSpec[] = useMemo(() => [
    // Phase 1 — Foundation
    { id: '01', number: '01', title: 'Vision', description: 'The grand mandate: coordinating local contractor outreach through evidence-based intelligence.', status: 'canonical', phase: 'foundation', icon: Sparkles },
    { id: '02', number: '02', title: 'Philosophy', description: 'The absolute core convictions. The rules determining every engineering and product decision.', status: 'canonical', phase: 'foundation', icon: BookOpen },
    { id: '03', number: '03', title: 'Design Language', description: 'Visual code of HAL: high density, space optimization, zero bloat, and absolute layout clarity.', status: 'canonical', phase: 'foundation', icon: Palette },
    { id: '04', number: '04', title: 'Design System', description: 'Unified visual primitives, cryptographic UI states, and interactive live components.', status: 'canonical', phase: 'foundation', icon: Layers },
    { id: '05', number: '05', title: 'Architecture', description: 'Modular services, unified state contexts, and decoupled client-server structures.', status: 'canonical', phase: 'foundation', icon: Grid },
    { id: '06', number: '06', title: 'UX Principles', description: 'Micro-feedback, spring animations, clear outcomes, and instructive empty states.', status: 'canonical', phase: 'foundation', icon: Compass },

    // Phase 2 — Intelligence
    { id: '07', number: '07', title: 'Memory', description: 'State persistence engines: secure client caches and resilient Google Firestore integration.', status: 'draft', phase: 'intelligence', icon: Database },
    { id: '08', number: '08', title: 'Knowledge', description: 'Real-time Google Maps Places API grounding for Calgary, Winnipeg, and Alberta markets.', status: 'draft', phase: 'intelligence', icon: Compass },
    { id: '09', number: '09', title: 'Skills', description: 'Diagnostic script library: technical SEO scans, speed index calculations, and SSL sweeps.', status: 'canonical', phase: 'intelligence', icon: Cpu },
    { id: '10', number: '10', title: 'Agents', description: 'HAL Council autonomous reasoning loops, proposal generators, and outreach engines.', status: 'draft', phase: 'intelligence', icon: Cpu },
    { id: '11', number: '11', title: 'Council', description: 'Decision orchestrator and multi-agent coordination system.', status: 'planned', phase: 'intelligence', icon: Users },
    { id: '12', number: '12', title: 'Missions', description: 'Operational pipelines, launch triggers, and client outreach campaigns.', status: 'canonical', phase: 'intelligence', icon: Briefcase },
    { id: '13', number: '13', title: 'Connectors', description: 'Secure auth vaults, external API proxies, and Google OAuth credentials.', status: 'draft', phase: 'intelligence', icon: Settings },

    // Phase 3 — Engineering
    { id: '14', number: '14', title: 'Database', description: 'Relational Cloud SQL setups, Drizzle schemas, and secure Firestore rules.', status: 'draft', phase: 'engineering', icon: Database },
    { id: '15', number: '15', title: 'APIs', description: 'Express + Vite proxies, server-side secure endpoints, and route controllers.', status: 'draft', phase: 'engineering', icon: Code },
    { id: '16', number: '16', title: 'Components', description: 'Pragmatic, beautiful, and accessible UI components styled with pure Tailwind.', status: 'canonical', phase: 'engineering', icon: Layers },
    { id: '17', number: '17', title: 'Security', description: 'AES-GCM-256 cryptography vault for prospect phone numbers and emails.', status: 'canonical', phase: 'engineering', icon: Shield },
    { id: '18', number: '18', title: 'Testing', description: 'Type checking validations, static analysis lint checks, and structural stability.', status: 'planned', phase: 'engineering', icon: Activity },
    { id: '19', number: '19', title: 'DevOps', description: 'Vite/esbuild bundling, container routing to port 3000, and fast cold-starts.', status: 'draft', phase: 'engineering', icon: GitPullRequest },

    // Phase 4 — Product
    { id: '20', number: '20', title: 'Roadmap', description: 'Strategic milestones to transition from regional MVP to multi-territory business brain.', status: 'planned', phase: 'product', icon: LineChart },
    { id: '21', number: '21', title: 'UI Library', description: 'Standardized layout files, typography maps, and reusable pattern libraries.', status: 'planned', phase: 'product', icon: Layers },
    { id: '22', number: '22', title: 'Workspaces', description: 'Contractor dashboard orchestration, campaign builders, and leads flow.', status: 'canonical', phase: 'product', icon: Briefcase },
    { id: '23', number: '23', title: 'Future Vision', description: 'Autonomous market expansion and self-optimizing outreach campaigns.', status: 'planned', phase: 'product', icon: Sparkles },
    { id: '24', number: '24', title: 'Hermes Engine', description: 'Nous Research Hermes synthesis: dynamic anti-AI landing pages, diagnostic scripts, and event-bus dispatch.', status: 'canonical', phase: 'intelligence', icon: Sparkles }
  ], []);

  // Filter documents based on search query
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter(d => 
      d.title.toLowerCase().includes(q) || 
      d.number.includes(q) || 
      d.description.toLowerCase().includes(q)
    );
  }, [documents, searchQuery]);

  // Group filtered documents by Phase
  const groupedDocs = useMemo(() => {
    const groups = {
      foundation: [] as DocumentSpec[],
      intelligence: [] as DocumentSpec[],
      engineering: [] as DocumentSpec[],
      product: [] as DocumentSpec[]
    };
    filteredDocs.forEach(d => {
      groups[d.phase].push(d);
    });
    return groups;
  }, [filteredDocs]);

  // Calculate spec completion statistics
  const stats = useMemo(() => {
    const total = documents.length;
    const canonical = documents.filter(d => d.status === 'canonical').length;
    const draft = documents.filter(d => d.status === 'draft').length;
    const planned = documents.filter(d => d.status === 'planned').length;
    const percent = Math.round((canonical / total) * 100);
    return { total, canonical, draft, planned, percent };
  }, [documents]);

  const activeDoc = useMemo(() => {
    return documents.find(d => d.id === selectedDocId) || documents[1];
  }, [documents, selectedDocId]);

  // Sample data for Table primitive showcase
  const sampleTableData = [
    { id: '1', item: 'Strategic Territory Ingestion Scan', status: 'active', priority: 'High', value: '$12,400' },
    { id: '2', item: 'Google Maps Places API Syncer', status: 'new', priority: 'Medium', value: '$4,250' },
    { id: '3', item: 'Reputation Harvest Sweep (Calgary)', status: 'warning', priority: 'High', value: '$8,100' },
    { id: '4', item: 'Isaac\'s Custom Cold Outreach Run', status: 'neutral', priority: 'Low', value: '$1,800' }
  ];

  const sortedData = [...sampleTableData].sort((a, b) => {
    if (tableSort === 'asc') return a.value.localeCompare(b.value);
    return b.value.localeCompare(a.value);
  });

  const triggerToast = (variant: 'info' | 'success' | 'warning' | 'danger' | 'ai') => {
    const titles = {
      info: 'Operational Scope Alignment',
      success: 'Database Schema Sync Success',
      warning: 'Outreach Quota Limit Nearing',
      danger: 'Lead Connection Interrupted',
      ai: 'HAL Council Strategy Assessment'
    };

    const descs = {
      info: 'The territorial sweep across Winnipeg plastering leads is completed.',
      success: 'All prospect records successfully encrypted with AES-256 standard.',
      warning: 'You have used 85% of your recommended daily active outreach budget.',
      danger: 'Failed to authenticate with Calgary Map Services API key wrapper.',
      ai: 'HAL detects 15 roofing websites with speed indices greater than 4.2 seconds.'
    };

    const nextActions = {
      info: 'Verify the newly imported prospect records.',
      success: 'Proceed to client campaigns launchpad.',
      warning: 'Upgrade your billing or throttle automated emails.',
      danger: 'Review active API tokens in your Settings dashboard.',
      ai: 'Generate performance pitch deck templates instantly.'
    };

    toast({
      variant,
      title: titles[variant],
      description: descs[variant],
      whatNext: nextActions[variant],
      actionLabel: 'RESOLVE NOW',
      onAction: () => alert(`Action taken for ${titles[variant]}`)
    });
  };

  // Run Philosophy System Alignment check
  const startSystemVerification = () => {
    setIsVerifying(true);
    setVerificationProgress(10);
    setVerificationPassed(false);

    const steps = [
      { p: 25, label: 'Auditing Network configuration port...' },
      { p: 50, label: 'Scanning codebase for PII cryptology functions...' },
      { p: 75, label: 'Evaluating UI visual weights and gradients...' },
      { p: 90, label: 'Checking for unrequested layout bloat...' },
      { p: 100, label: 'Verification successfully finalized!' }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setVerificationProgress(step.p);
        if (step.p === 100) {
          setIsVerifying(false);
          setVerificationPassed(true);
          toast({
            variant: 'success',
            title: 'HAL Core Alignment Passed',
            description: 'Your codebase remains 100% compliant with the HAL Master Philosophy.',
            whatNext: 'Proceed with building high-fidelity client features.'
          });
        }
      }, (idx + 1) * 600);
    });
  };

  return (
    <div className="space-y-6 select-none pb-12 animate-fade-in text-text-primary">
      
      {/* HEADER SECTION WITH BREADCRUMBS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-dim pb-4">
        <div className="space-y-1">
          <Breadcrumbs items={[{ label: 'System Configuration' }, { label: 'HAL Bible' }]} />
          <MissionTitle>HAL Master Specification</MissionTitle>
          <ProseText className="max-w-xl">
            The canonical Bible of HAL as a high-fidelity intelligence platform. Each section acts as an active blueprint, aligning engineering and visual layout with core philosophy.
          </ProseText>
        </div>

        {/* Master Completion Badge */}
        <div className="flex items-center gap-4 bg-bg-base border border-border-dim p-3 rounded-sm shrink-0">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono text-text-secondary uppercase block">Master Spec Completion</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-bg-subtle rounded-full overflow-hidden border border-border-dim/55">
                <div 
                  className="h-full bg-accent transition-all duration-500" 
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-accent">{stats.percent}%</span>
            </div>
          </div>
          <div className="border-l border-border-dim pl-3 text-right">
            <span className="text-[8px] font-mono text-text-secondary uppercase block">Status</span>
            <span className="text-xs font-mono font-bold text-positive-dim text-positive">CANONICAL</span>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: INDEX DRAWER (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* SEARCH & FILTER */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search specifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-overlay border border-border-dim text-xs py-2 pl-9 pr-4 rounded-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* DOCUMENT TREE INDEX */}
          <div className="bg-bg-raised border border-border-dim rounded-sm divide-y divide-border-dim/40 max-h-[640px] overflow-y-auto">
            
            {/* PHASE 1 — FOUNDATION */}
            {groupedDocs.foundation.length > 0 && (
              <div className="p-3 space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-accent tracking-widest uppercase block mb-1">
                  Phase 1 — Foundation
                </span>
                <div className="space-y-1">
                  {groupedDocs.foundation.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`w-full flex items-center justify-between text-left p-2 rounded-sm transition-all border ${
                        selectedDocId === doc.id
                          ? 'bg-accent/10 border-accent/30 text-text-primary font-medium'
                          : 'border-transparent hover:bg-white/[0.02] text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-mono text-text-tertiary w-4 shrink-0">{doc.number}</span>
                        <doc.icon className={`w-3.5 h-3.5 shrink-0 ${selectedDocId === doc.id ? 'text-accent' : 'text-text-tertiary'}`} />
                        <span className="text-[11px] font-sans truncate">{doc.title}</span>
                      </div>
                      <Badge variant={doc.status}>
                        {doc.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PHASE 2 — INTELLIGENCE */}
            {groupedDocs.intelligence.length > 0 && (
              <div className="p-3 space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-[#8b5cf6] tracking-widest uppercase block mb-1">
                  Phase 2 — Intelligence
                </span>
                <div className="space-y-1">
                  {groupedDocs.intelligence.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`w-full flex items-center justify-between text-left p-2 rounded-sm transition-all border ${
                        selectedDocId === doc.id
                          ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30 text-text-primary font-medium'
                          : 'border-transparent hover:bg-white/[0.02] text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-mono text-text-tertiary w-4 shrink-0">{doc.number}</span>
                        <doc.icon className={`w-3.5 h-3.5 shrink-0 ${selectedDocId === doc.id ? 'text-[#8b5cf6]' : 'text-text-tertiary'}`} />
                        <span className="text-[11px] font-sans truncate">{doc.title}</span>
                      </div>
                      <Badge variant={doc.status}>
                        {doc.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PHASE 3 — ENGINEERING */}
            {groupedDocs.engineering.length > 0 && (
              <div className="p-3 space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-sky-400 tracking-widest uppercase block mb-1">
                  Phase 3 — Engineering
                </span>
                <div className="space-y-1">
                  {groupedDocs.engineering.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`w-full flex items-center justify-between text-left p-2 rounded-sm transition-all border ${
                        selectedDocId === doc.id
                          ? 'bg-sky-500/10 border-sky-500/30 text-text-primary font-medium'
                          : 'border-transparent hover:bg-white/[0.02] text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-mono text-text-tertiary w-4 shrink-0">{doc.number}</span>
                        <doc.icon className={`w-3.5 h-3.5 shrink-0 ${selectedDocId === doc.id ? 'text-sky-400' : 'text-text-tertiary'}`} />
                        <span className="text-[11px] font-sans truncate">{doc.title}</span>
                      </div>
                      <Badge variant={doc.status}>
                        {doc.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PHASE 4 — PRODUCT */}
            {groupedDocs.product.length > 0 && (
              <div className="p-3 space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-[#f59e0b] tracking-widest uppercase block mb-1">
                  Phase 4 — Product
                </span>
                <div className="space-y-1">
                  {groupedDocs.product.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`w-full flex items-center justify-between text-left p-2 rounded-sm transition-all border ${
                        selectedDocId === doc.id
                          ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30 text-text-primary font-medium'
                          : 'border-transparent hover:bg-white/[0.02] text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-mono text-text-tertiary w-4 shrink-0">{doc.number}</span>
                        <doc.icon className={`w-3.5 h-3.5 shrink-0 ${selectedDocId === doc.id ? 'text-[#f59e0b]' : 'text-text-tertiary'}`} />
                        <span className="text-[11px] font-sans truncate">{doc.title}</span>
                      </div>
                      <Badge variant={doc.status}>
                        {doc.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* METRIC BOX: BIBLE FOOTER CREDITS */}
          <div className="bg-bg-raised border border-border-dim p-4 rounded-sm space-y-1 font-mono text-[10px] text-text-secondary">
            <div className="flex justify-between">
              <span>CANONICAL:</span>
              <span className="text-text-primary font-bold">{stats.canonical} Docs</span>
            </div>
            <div className="flex justify-between">
              <span>BLUEPRINT DRAFTS:</span>
              <span className="text-text-primary font-bold">{stats.draft} Docs</span>
            </div>
            <div className="flex justify-between">
              <span>PLANNED SCHEMA:</span>
              <span className="text-text-primary font-bold">{stats.planned} Docs</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ACTIVE CANVAS (col-span-8) */}
        <div className="lg:col-span-8 bg-bg-raised border border-border-dim rounded-sm p-6 min-h-[500px]">
          
          {/* ACTIVE SPECIFICATION TEMPLATE VIEW */}
          <div className="space-y-6">
            
            {/* DOCUMENT SUB-HEADER */}
            <div className="flex items-center justify-between border-b border-border-dim pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary uppercase">
                  <span>SPECIFICATION DOCUMENT {activeDoc.number}</span>
                  <span>•</span>
                  <span className="text-accent uppercase tracking-wider">{activeDoc.phase}</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">{activeDoc.title}</h2>
              </div>
              <Badge variant={activeDoc.status}>
                {activeDoc.status.toUpperCase()} SPECIFICATION
              </Badge>
            </div>

            {/* RENDER SPECIFIC INTERACTIVE ARTIFACTS OR BLUEPRINT */}
            
            {/* DOCUMENT 02: PHILOSOPHY */}
            {activeDoc.id === '02' && (
              <div className="space-y-6">
                
                {/* 1. HERO CONVICTION ELEMENT */}
                <div className="bg-bg-base border border-border-dim rounded p-6 flex flex-col items-center justify-center text-center py-10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-indigo-500 to-accent" />
                  <span className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3">HAL CORE SUBSTANCE</span>
                  <h1 className="text-4xl font-extrabold tracking-tight text-text-primary font-sans max-w-lg leading-tight">
                    HAL IS AN
                  </h1>
                  <h1 className="text-3xl font-extrabold tracking-tight text-accent font-sans max-w-lg mt-1 select-all">
                    AI Business Operating Intelligence System
                  </h1>
                  <p className="text-xs text-text-secondary max-w-md mt-4 font-sans leading-relaxed">
                    Not a chatbot. Not a CRM. Not a marketing dashboard. Not another SaaS application. HAL is an executive partner.
                  </p>

                  {/* SUPREME INTENTIONALITY DIRECTIVE CARD */}
                  <div className="mt-6 w-full max-w-2xl bg-bg-overlay/80 border border-accent/30 rounded-lg p-4 text-left shadow-sm">
                    <div className="flex items-center justify-between border-b border-border-dim/60 pb-2 mb-2.5">
                      <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        INTENTIONALITY DIRECTIVE v1.0
                      </span>
                      <span className="text-[9px] font-mono text-positive bg-positive/10 border border-positive/20 px-1.5 py-0.5 rounded uppercase font-bold">
                        ACTIVE LAW
                      </span>
                    </div>
                    <blockquote className="text-xs sm:text-sm font-sans font-medium text-text-primary leading-relaxed italic border-l-2 border-accent pl-3 my-1">
                      "HAL does not exist to answer everything. HAL exists to understand what matters, reason about it, and help the operator move the business forward."
                    </blockquote>
                    <p className="text-[10px] text-text-secondary mt-2 font-mono">
                      Every behavior must have intent: <span className="text-text-primary">Evidence ➔ Interpretation ➔ Decision</span>. Never fabricate reality or manufacture certainty where evidence is absent.
                    </p>
                  </div>
                </div>

                {/* 2. THE CORE STATEMENT PILLARS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Mission */}
                  <div className="border border-border-dim bg-bg-overlay p-4 rounded-sm space-y-2">
                    <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">Mission</span>
                    <p className="text-xs text-text-primary leading-relaxed">
                      To help humans make better business decisions through intelligence, memory, reasoning, planning, learning, and execution.
                    </p>
                  </div>

                  {/* Identity */}
                  <div className="border border-border-dim bg-bg-overlay p-4 rounded-sm space-y-2">
                    <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">Identity</span>
                    <p className="text-xs text-text-primary leading-relaxed">
                      HAL is an executive partner. Not a tool. Not an assistant. Not an employee. A partner.
                    </p>
                  </div>

                  {/* Product Philosophy */}
                  <div className="border border-border-dim bg-bg-overlay p-4 rounded-sm space-y-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">Product Philosophy</span>
                    <p className="text-xs text-text-primary leading-relaxed">
                      HAL exists to answer one question: <span className="text-indigo-300">"What should I do next to grow this business?"</span> Everything else supports this.
                    </p>
                  </div>

                  {/* Intelligence Philosophy */}
                  <div className="border border-border-dim bg-bg-overlay p-4 rounded-sm space-y-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">Intelligence Philosophy</span>
                    <p className="text-xs text-text-primary leading-relaxed">
                      HAL does not simply retrieve information. HAL understands relationships, reasons, explains, learns, reflects, recommends, and improves.
                    </p>
                  </div>

                  {/* Design Philosophy */}
                  <div className="border border-border-dim bg-bg-overlay p-4 rounded-sm space-y-2">
                    <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider">Design Philosophy</span>
                    <p className="text-xs text-text-primary leading-relaxed">
                      Every screen reduces cognitive load. Every interaction increases clarity. Every recommendation is evidence-based. Every action serves a mission.
                    </p>
                  </div>

                  {/* UI Philosophy */}
                  <div className="border border-border-dim bg-bg-overlay p-4 rounded-sm space-y-2">
                    <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider">UI Philosophy</span>
                    <p className="text-xs text-text-primary leading-relaxed">
                      HAL never resembles a traditional CRM. HAL resembles an executive operating system.
                    </p>
                  </div>

                  {/* Architecture Philosophy */}
                  <div className="border border-border-dim bg-bg-overlay p-4 rounded-sm space-y-2">
                    <span className="text-[10px] font-mono font-bold text-[#f59e0b] uppercase tracking-wider">Architecture Philosophy</span>
                    <p className="text-xs text-text-primary leading-relaxed">
                      HAL Core remains permanently small. New capability is added through: Skills, Agents, Connectors, Workspaces. Never by increasing HAL Core complexity.
                    </p>
                  </div>

                  {/* Knowledge Philosophy */}
                  <div className="border border-border-dim bg-bg-overlay p-4 rounded-sm space-y-2">
                    <span className="text-[10px] font-mono font-bold text-[#f59e0b] uppercase tracking-wider">Knowledge Philosophy</span>
                    <div className="text-[11px] text-text-primary flex flex-col items-center gap-1 font-mono pt-1">
                      <span>Data</span>
                      <span className="text-[9px] opacity-40">↓</span>
                      <span>Information</span>
                      <span className="text-[9px] opacity-40">↓</span>
                      <span>Knowledge</span>
                      <span className="text-[9px] opacity-40">↓</span>
                      <span>Understanding</span>
                      <span className="text-[9px] opacity-40">↓</span>
                      <span>Recommendations</span>
                      <span className="text-[9px] opacity-40">↓</span>
                      <span className="text-accent font-bold">Action</span>
                    </div>
                  </div>

                  {/* Decision Philosophy */}
                  <div className="border border-border-dim bg-bg-overlay p-4 rounded-sm space-y-2">
                    <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">Decision Philosophy</span>
                    <p className="text-xs text-text-primary leading-relaxed">
                      Every page must answer: What matters? Why? What should happen next?
                    </p>
                  </div>

                  {/* Learning Philosophy */}
                  <div className="border border-border-dim bg-bg-overlay p-4 rounded-sm space-y-2">
                    <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">Learning Philosophy</span>
                    <p className="text-xs text-text-primary leading-relaxed">
                      Every interaction teaches HAL. Every outcome improves HAL. Every mistake becomes knowledge.
                    </p>
                  </div>

                  {/* Business Philosophy */}
                  <div className="border border-border-dim bg-bg-overlay p-4 rounded-sm space-y-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Business Philosophy</span>
                    <p className="text-xs text-text-primary leading-relaxed">
                      HAL does not manage businesses. HAL helps businesses make better decisions.
                    </p>
                  </div>

                  {/* Human Philosophy */}
                  <div className="border border-border-dim bg-bg-overlay p-4 rounded-sm space-y-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Human Philosophy</span>
                    <p className="text-xs text-text-primary leading-relaxed">
                      The human always owns the final decision. HAL recommends. Humans approve.
                    </p>
                  </div>

                </div>

                {/* PRINCIPLES LIST */}
                <div className="space-y-3 pt-4 border-t border-border-dim">
                  <span className="text-[10px] font-mono tracking-widest text-text-secondary uppercase font-semibold block">SYSTEM PRINCIPLES</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 border border-border-dim bg-bg-base/40 rounded-sm">
                      <h4 className="text-[11px] font-mono font-bold text-accent uppercase">Design Principle</h4>
                      <p className="text-[10px] text-text-secondary mt-1">
                        Order over decoration. Consistency over creativity. Clarity over complexity. Speed over unnecessary animation. Depth over clutter.
                      </p>
                    </div>
                    <div className="p-3 border border-border-dim bg-bg-base/40 rounded-sm">
                      <h4 className="text-[11px] font-mono font-bold text-accent uppercase">Engineering Principle</h4>
                      <p className="text-[10px] text-text-secondary mt-1">
                        Architecture first. Features second. Polish always.
                      </p>
                    </div>
                    <div className="p-3 border border-border-dim bg-bg-base/40 rounded-sm">
                      <h4 className="text-[11px] font-mono font-bold text-accent uppercase">Growth Principle</h4>
                      <p className="text-[10px] text-text-secondary mt-1">
                        Never build because it is possible. Build because it advances the mission.
                      </p>
                    </div>
                  </div>

                  {/* Golden Rule banner */}
                  <div className="bg-accent-dim/10 border border-accent/25 p-4 rounded-sm text-center">
                    <span className="text-[10px] font-mono text-accent uppercase font-bold block mb-1">THE GOLDEN RULE</span>
                    <p className="text-xs text-text-primary max-w-xl mx-auto leading-relaxed">
                      Every new feature must answer: <span className="text-accent font-semibold">"Does this help the user make better business decisions?"</span> If the answer is no, it does not belong in HAL.
                    </p>
                  </div>
                </div>

                {/* INTERACTIVE ALIGNMENT ENGINE - "Artifacts get used, not just read" */}
                <div className="pt-6 border-t border-border-dim space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-text-primary uppercase font-mono flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-accent animate-pulse" />
                        Verify System Alignment Engine
                      </h3>
                      <p className="text-xs text-text-secondary">
                        Audit active codebase configurations, port parameters, and cryptology vectors in real-time.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={startSystemVerification}
                      isLoading={isVerifying}
                    >
                      EXECUTE PHILOSOPHY ALIGNMENT
                    </Button>
                  </div>

                  {isVerifying && (
                    <div className="bg-bg-base border border-border-dim p-4 rounded font-mono text-xs text-text-secondary space-y-3">
                      <div className="flex justify-between items-center text-[10px]">
                        <span>CORE ALIGNMENT PROGRESS:</span>
                        <span className="text-accent">{verificationProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent transition-all duration-300"
                          style={{ width: `${verificationProgress}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
                        <Loader2 className="w-3 h-3 animate-spin text-accent" />
                        <span>
                          {verificationProgress < 25 && 'Auditing Network configuration port...'}
                          {verificationProgress >= 25 && verificationProgress < 50 && 'Scanning codebase for PII cryptology functions...'}
                          {verificationProgress >= 50 && verificationProgress < 75 && 'Evaluating UI visual weights and gradients...'}
                          {verificationProgress >= 75 && verificationProgress < 100 && 'Checking for unrequested layout bloat...'}
                          {verificationProgress === 100 && 'Verification successfully finalized!'}
                        </span>
                      </div>
                    </div>
                  )}

                  {verificationPassed && !isVerifying && (
                    <div className="bg-bg-base border border-border-dim p-4 rounded font-mono text-xs text-text-secondary space-y-3">
                      <div className="flex items-center gap-2 text-positive">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="font-bold">SYSTEM IN PERFECT PHILOSOPHY ALIGNMENT</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10.5px] pt-1">
                        <div className="flex justify-between border-b border-border-dim/40 pb-1.5">
                          <span className="opacity-60">PORT 3000 INTEGRITY:</span>
                          <span className="text-positive font-bold">100% SECURE (COMPLIANT)</span>
                        </div>
                        <div className="flex justify-between border-b border-border-dim/40 pb-1.5">
                          <span className="opacity-60">PII CRYPTOLOGY FIELD:</span>
                          <span className="text-positive font-bold">ACTIVE (AES-GCM-256)</span>
                        </div>
                        <div className="flex justify-between border-b border-border-dim/40 pb-1.5">
                          <span className="opacity-60">UI GRADIENT DECORATION:</span>
                          <span className="text-positive font-bold">0% ACCENTS ONLY (COMPLIANT)</span>
                        </div>
                        <div className="flex justify-between border-b border-border-dim/40 pb-1.5">
                          <span className="opacity-60">UNREQUESTED MENUS BLOAT:</span>
                          <span className="text-positive font-bold">0% BLOCKED (COMPLIANT)</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* DOCUMENT 04: DESIGN SYSTEM */}
            {activeDoc.id === '04' && (
              <div className="space-y-6">
                
                {/* Embedded Design System Toggle and Categories */}
                <div className="flex items-center justify-between border-b border-border-dim pb-3">
                  <span className="text-[10px] font-mono text-text-secondary uppercase">
                    LIVE SHIELDS & INTERACTIVE COMPONENT PREVIEWS
                  </span>
                  <div className="flex items-center gap-1 bg-bg-base border border-border-dim p-1 rounded-sm shrink-0">
                    <Button 
                      variant={activeDSCategory === 'primitives' ? 'primary' : 'ghost'} 
                      size="sm"
                      onClick={() => setActiveDSCategory('primitives')}
                    >
                      Primitives
                    </Button>
                    <Button 
                      variant={activeDSCategory === 'semantics' ? 'primary' : 'ghost'} 
                      size="sm"
                      onClick={() => setActiveDSCategory('semantics')}
                    >
                      Semantics
                    </Button>
                    <Button 
                      variant={activeDSCategory === 'interaction' ? 'primary' : 'ghost'} 
                      size="sm"
                      onClick={() => setActiveDSCategory('interaction')}
                    >
                      Interactions
                    </Button>
                  </div>
                </div>

                {activeDSCategory === 'primitives' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CARD 1: TYPOGRAPHY HIERARCHY */}
                    <Card>
                      <CardHeader 
                        title="Mathematical Typography Scale" 
                        subtitle="HIERARCHY IS INSTANTLY RECOGNIZABLE" 
                        action={<Type className="w-4 h-4 text-accent" />} 
                      />
                      <CardContent className="space-y-5">
                        <div className="border-l border-border-dim pl-3.5 space-y-1">
                          <MetadataText>Mission (Largest)</MetadataText>
                          <MissionTitle>Acquire 20 Roofing Clients</MissionTitle>
                        </div>

                        <div className="border-l border-border-dim pl-3.5 space-y-1">
                          <MetadataText>Section (Large)</MetadataText>
                          <SectionTitle>Operational Intelligence Map</SectionTitle>
                        </div>

                        <div className="border-l border-border-dim pl-3.5 space-y-1">
                          <MetadataText>Cards (Medium)</MetadataText>
                          <CardTitle>NVIDIA Analytics API Token Key</CardTitle>
                        </div>

                        <div className="border-l border-border-dim pl-3.5 space-y-1">
                          <MetadataText>Prose / Explanation</MetadataText>
                          <ProseText>
                            Never mix visual weights. Content is optimized to maintain absolute vertical alignment across bento layouts, minimizing user cognitive load.
                          </ProseText>
                        </div>

                        <div className="border-l border-border-dim pl-3.5 space-y-1">
                          <MetadataText>System / Database Values (Monospace)</MetadataText>
                          <MonoValue>aes-256_hash_value_9f68d2</MonoValue>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <span>Font families: Inter (Sans) & JetBrains Mono</span>
                        <span className="font-mono text-accent">100% STANDARDIZED</span>
                      </CardFooter>
                    </Card>

                    {/* CARD 2: BUTTON STATES & DISCIPLINE */}
                    <Card>
                      <CardHeader 
                        title="Deterministic Buttons" 
                        subtitle="DETERMINISTIC STATES PREVENT LAYOUT SHIFTS" 
                        action={<Layers className="w-4 h-4 text-indigo-400" />} 
                      />
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-text-secondary uppercase">Active Variants</span>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="primary">Primary Accent</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost link</Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-text-secondary uppercase">Semantic Actions</span>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="success">Success state</Button>
                            <Button variant="danger">Critical Danger</Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-text-secondary uppercase">Interactive Loader Feedbacks</span>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="primary" isLoading={true}>Button Loading</Button>
                            <Button variant="danger" isLoading={true}>Destructive loading</Button>
                            <Button variant="outline" disabled={true}>Disabled Primitive</Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-text-secondary uppercase">Responsive Scale Bounds</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button size="sm">Small (sm)</Button>
                            <Button size="md">Medium (md)</Button>
                            <Button size="lg">Large (lg)</Button>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <span>Transition animations: 150ms spring curves</span>
                        <span className="font-mono text-text-secondary">ACCESSIBILITY SAFE</span>
                      </CardFooter>
                    </Card>

                    {/* CARD 3: BADGES & LABELS */}
                    <Card className="md:col-span-2">
                      <CardHeader 
                        title="Semantic Badging Rules" 
                        subtitle="BADGES DECORATE STATUS WITH STRICT COLOR DISCIPLINE" 
                        action={<Grid className="w-4 h-4 text-[#c8f542]" />} 
                      />
                      <CardContent className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                        <div className="bg-bg-base border border-border-dim p-3 rounded text-center space-y-2">
                          <span className="text-[9px] font-mono opacity-50 block uppercase">New / Fresh</span>
                          <Badge variant="new">Prospect New</Badge>
                        </div>
                        <div className="bg-bg-base border border-border-dim p-3 rounded text-center space-y-2">
                          <span className="text-[9px] font-mono opacity-50 block uppercase">Active / Good</span>
                          <Badge variant="active">Operational</Badge>
                        </div>
                        <div className="bg-bg-base border border-border-dim p-3 rounded text-center space-y-2">
                          <span className="text-[9px] font-mono opacity-50 block uppercase">Warning / Attn</span>
                          <Badge variant="warning">Quota Warning</Badge>
                        </div>
                        <div className="bg-bg-base border border-border-dim p-3 rounded text-center space-y-2">
                          <span className="text-[9px] font-mono opacity-50 block uppercase">Danger / Critical</span>
                          <Badge variant="danger">Token Expired</Badge>
                        </div>
                        <div className="bg-bg-base border border-border-dim p-3 rounded text-center space-y-2">
                          <span className="text-[9px] font-mono opacity-50 block uppercase">Information</span>
                          <Badge variant="info">Syncing Api</Badge>
                        </div>
                        <div className="bg-bg-base border border-border-dim p-3 rounded text-center space-y-2">
                          <span className="text-[9px] font-mono opacity-50 block uppercase">AI / Reasoning</span>
                          <Badge variant="ai">HAL Cog Engine</Badge>
                        </div>
                        <div className="bg-bg-base border border-border-dim p-3 rounded text-center space-y-2">
                          <span className="text-[9px] font-mono opacity-50 block uppercase">Neutral</span>
                          <Badge variant="neutral">Offline Cache</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeDSCategory === 'semantics' && (
                  <div className="space-y-6">
                    {/* COLOR DISCIPLINE SECTION */}
                    <Card>
                      <CardHeader 
                        title="Semantic Color Palette" 
                        subtitle="COLOR IS DESIGNATED FOR EMOTION AND MEANING" 
                        action={<Palette className="w-4 h-4 text-purple-400" />} 
                      />
                      <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
                        
                        <div className="space-y-2">
                          <div className="h-14 rounded bg-[#080808] border border-border-default flex items-end p-2">
                            <span className="text-[9px] font-mono font-bold text-text-primary uppercase">#080808</span>
                          </div>
                          <div>
                            <h4 className="text-[11px] font-mono uppercase font-bold text-text-primary">Base Canvas</h4>
                            <p className="text-[10px] text-text-secondary">Default dark space</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="h-14 rounded bg-[#0f0f0f] border border-border-default flex items-end p-2">
                            <span className="text-[9px] font-mono font-bold text-text-primary uppercase">#0F0F0F</span>
                          </div>
                          <div>
                            <h4 className="text-[11px] font-mono uppercase font-bold text-text-primary">Raised Card</h4>
                            <p className="text-[10px] text-text-secondary">Bento widgets canvas</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="h-14 rounded bg-accent flex items-end p-2">
                            <span className="text-[9px] font-mono font-bold text-black uppercase">#C8F542</span>
                          </div>
                          <div>
                            <h4 className="text-[11px] font-mono uppercase font-bold text-text-primary">HAL Lime</h4>
                            <p className="text-[10px] text-text-secondary">Primary call-to-action</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="h-14 rounded bg-positive-dim text-positive border border-positive/35 flex items-end p-2">
                            <span className="text-[9px] font-mono font-bold uppercase">#22C55E</span>
                          </div>
                          <div>
                            <h4 className="text-[11px] font-mono uppercase font-bold text-text-primary">Healthy Green</h4>
                            <p className="text-[10px] text-text-secondary">Connected & Synchronized</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="h-14 rounded bg-warning-dim text-warning border border-warning/35 flex items-end p-2">
                            <span className="text-[9px] font-mono font-bold uppercase">#F59E0B</span>
                          </div>
                          <div>
                            <h4 className="text-[11px] font-mono uppercase font-bold text-text-primary">Amber Warning</h4>
                            <p className="text-[10px] text-text-secondary">Approaching thresholds</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="h-14 rounded bg-negative-dim text-negative border border-negative/35 flex items-end p-2">
                            <span className="text-[9px] font-mono font-bold uppercase">#EF4444</span>
                          </div>
                          <div>
                            <h4 className="text-[11px] font-mono uppercase font-bold text-text-primary">Critical Red</h4>
                            <p className="text-[10px] text-text-secondary">Authentication disruptions</p>
                          </div>
                        </div>

                      </CardContent>
                    </Card>

                    {/* TABLE PRIMITIVE DEMONSTRATION */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono tracking-widest text-text-secondary uppercase font-semibold">PREMIUM FLUID TABLES</span>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Territory Client Object</TableHead>
                            <TableHead>Operational State</TableHead>
                            <TableHead>Value Weight</TableHead>
                            <TableHead 
                              className="cursor-pointer hover:text-accent"
                              isSorted={true} 
                              sortDirection={tableSort}
                              onClick={() => setTableSort(prev => prev === 'asc' ? 'desc' : 'asc')}
                            >
                              Est. Revenue Value
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedData.map((d) => (
                            <TableRow key={d.id} isSelectable={true}>
                              <TableCell className="font-sans font-medium">{d.item}</TableCell>
                              <TableCell>
                                <Badge variant={d.status as any}>
                                  {d.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-text-secondary uppercase">{d.priority}</TableCell>
                              <TableCell className="font-mono text-accent font-semibold">{d.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* INSTRUCTIONAL EMPTY STATES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono tracking-widest text-text-secondary uppercase font-semibold font-bold">PEDAGOGICAL EMPTY STATES</span>
                        <EmptyState 
                          title="Google Maps Location Cache Cleared"
                          whyEmpty="The local client cache database is fully optimized and purged of outdated territory entries to comply with PII policies."
                          whatNext="Click 'Run Harvest Scanner' in your Knowledge workspace to initialize maps grounding."
                          expectedOutcome="HAL Council will instantly parse 45 new potential roofing candidates inside Alberta."
                          actionLabel="RUN HARVEST SCANNER"
                          onActionClick={() => alert('Harvesting Map grounding!')}
                        />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-mono tracking-widest text-text-secondary uppercase font-semibold font-bold">DATABASE SEARCH NO-RECORDS FOUND</span>
                        <Card className="p-0">
                          <Table>
                            <TableBody>
                              <TableEmptyState 
                                colSpan={4}
                                title="No Connected Google Ads Accounts"
                                description="Since Calgary Roof Pros hasn't authorized OAuth channels, HAL cannot fetch real-time ad performance metrics."
                                action={
                                  <Button variant="outline" size="sm">
                                    PROPOSE ENTERPRISE CONNECT
                                  </Button>
                                }
                              />
                            </TableBody>
                          </Table>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {activeDSCategory === 'interaction' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PORTAL DIALOG DEMO */}
                    <Card>
                      <CardHeader 
                        title="Animated Portal Overlays (Dialog)" 
                        subtitle="SPRING DAMPED DIALOG SHELF" 
                        action={<Maximize2 className="w-4 h-4 text-accent" />} 
                      />
                      <CardContent className="space-y-3">
                        <ProseText>
                          Modals must behave like native desktop frames. They support focus traps, body scroll locking, spring entrance curves, ESC key dismissal, and backdrop click triggers.
                        </ProseText>
                        <div className="pt-2">
                          <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
                            LAUNCH PORTAL CONSOLE
                          </Button>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <span>Portal Node: React document.body</span>
                        <span className="font-mono text-text-secondary">ESC DETECTED</span>
                      </CardFooter>
                    </Card>

                    {/* TOAST NOTIFICATION TRIGGERS */}
                    <Card>
                      <CardHeader 
                        title="Intelligent Executive Notifications (Toasts)" 
                        subtitle="EVERY TOAST CLARIFIES IMPACT AND ACTIONS" 
                        action={<BellRing className="w-4 h-4 text-accent" />} 
                      />
                      <CardContent className="space-y-3">
                        <ProseText>
                          Every notification inside HAL answers three fundamental executive questions: What changed? Why does it matter? What should the agent do next? Click below to experience micro-interactions:
                        </ProseText>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => triggerToast('info')}>
                            Trigger Info Toast
                          </Button>
                          <Button variant="success" size="sm" onClick={() => triggerToast('success')}>
                            Trigger Success Toast
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => triggerToast('warning')}>
                            Trigger Warning Toast
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => triggerToast('danger')}>
                            Trigger Critical Toast
                          </Button>
                          <Button variant="primary" size="sm" className="col-span-2 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30" onClick={() => triggerToast('ai')}>
                            <Sparkles className="w-3.5 h-3.5 mr-2 animate-pulse" />
                            Trigger AI Reason Toast
                          </Button>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <span>Stack container: Dynamic AnimatePresence</span>
                        <span className="font-mono text-indigo-400 font-bold uppercase">REAL TIME STREAM</span>
                      </CardFooter>
                    </Card>

                    {/* PORTAL DIALOG FRAME */}
                    <Dialog
                      isOpen={isDialogOpen}
                      onClose={() => setIsDialogOpen(false)}
                      title="HAL Executive Operating System"
                      size="md"
                      footer={
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>CANCEL</Button>
                          <Button variant="primary" onClick={() => {
                            setIsDialogOpen(false);
                            toast({
                              variant: 'success',
                              title: 'Strategic Mission Commenced',
                              description: 'The automated outreach protocol for Alberta has been scheduled.',
                              whatNext: 'Monitor response metrics in the workspace logs.'
                            });
                          }}>COMMENCE MANDATE</Button>
                        </div>
                      }
                    >
                      <div className="space-y-3">
                        <span className="text-[10px] font-mono tracking-widest text-accent uppercase font-bold block">CONFIRM EXECUTIVE AUTHORIZATION</span>
                        <p className="text-xs text-text-secondary leading-relaxed font-sans">
                          You are about to synchronize ISAAC's direct marketing pitch templates with active lead registers. This operation accesses external Google Maps APIs and launches secure territory scans.
                        </p>
                        <div className="p-3 bg-bg-base border border-border-dim rounded space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="opacity-60 uppercase">TARGET CONTRACTOR:</span>
                            <span className="text-text-primary font-bold font-mono">ISAAC_ALBERTA_REPRESENTS</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="opacity-60 uppercase">ENCRYPTION PROTOCOL:</span>
                            <span className="text-positive font-bold font-mono">AES-GCM-256</span>
                          </div>
                        </div>
                      </div>
                    </Dialog>
                  </div>
                )}

              </div>
            )}

            {/* BLUEPRINT / DRAFT SPECIFICATION PLACEHOLDERS */}
            {activeDoc.id !== '02' && activeDoc.id !== '04' && (
              <div className="space-y-6">
                
                {/* BLUEPRINT SUBTITLE BANNER */}
                <div className="p-4 bg-bg-overlay border border-border-dim rounded-sm flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-[#f59e0b] font-bold uppercase block">ARCHITECTURAL DESIGN BLUEPRINT</span>
                    <p className="text-xs text-text-secondary leading-relaxed font-sans">
                      This specification represents the active implementation directive for HAL's {activeDoc.title} module. It establishes strict guidelines, code definitions, and integration matrices.
                    </p>
                  </div>
                </div>

                {/* DETAILED SPECIFICATION WRITING FOR CORE ARCHITECTURES */}
                <div className="space-y-4">
                  <h3 className="text-xs font-mono tracking-widest text-text-secondary uppercase font-semibold">1. OVERVIEW & OBJECTIVE</h3>
                  <p className="text-xs text-text-secondary leading-relaxed font-sans">
                    {activeDoc.description}
                  </p>

                  <h3 className="text-xs font-mono tracking-widest text-text-secondary uppercase font-semibold pt-2">2. ARCHITECTURAL PATTERN DEFINITION</h3>
                  <div className="p-4 bg-bg-base border border-border-dim rounded font-mono text-xs text-text-secondary space-y-2">
                    <div className="flex justify-between">
                      <span className="opacity-50">MODULE PATH:</span>
                      <span className="text-text-primary">/src/{activeDoc.phase}/{activeDoc.title.toLowerCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-50">COMPONENT CLASSIFICATION:</span>
                      <span className="text-text-primary">Decoupled Operational Logic Service</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-50">STABILITY RANKING:</span>
                      <span className="text-accent uppercase">{activeDoc.status === 'canonical' ? '100% STABLE' : 'DRAFT SCHEMA'}</span>
                    </div>
                  </div>

                  <h3 className="text-xs font-mono tracking-widest text-text-secondary uppercase font-semibold pt-2">3. INTEGRATION CHANNELS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="border border-border-dim p-3 rounded-sm bg-bg-base/20">
                      <span className="text-[10px] font-mono text-text-primary block font-bold mb-1">UPSTREAM TRIGGER SOURCES</span>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        Reads from encrypted client-side context caches or Google Maps grounding databases.
                      </p>
                    </div>
                    <div className="border border-border-dim p-3 rounded-sm bg-bg-base/20">
                      <span className="text-[10px] font-mono text-text-primary block font-bold mb-1">DOWNSTREAM OUTCOME EXECUTION</span>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        Fires actions inside HAL Council decision trees, rendering notifications, and sending targeted contractor messages.
                      </p>
                    </div>
                  </div>

                  {/* Golden rule alignment check */}
                  <div className="pt-4 border-t border-border-dim flex justify-between items-center text-[10px] font-mono text-text-secondary">
                    <span>PHILOSOPHY COMPLIANCE:</span>
                    <div className="flex items-center gap-1 text-positive">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>GOLDEN RULE VERIFIED</span>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
