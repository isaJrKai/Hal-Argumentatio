import React, { useState, useMemo, useEffect } from 'react';
import { useBusinessContext } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';
import { 
  RibbonTab, 
  DocumentPageSettings, 
  DocumentTheme, 
  DocumentFormattingStyle, 
  DocumentRecipient, 
  DocumentComment 
} from './document-studio/types';
import { 
  DOCUMENT_TEMPLATES, 
  THEME_PRESETS, 
  FORMATTING_STYLE_PRESETS 
} from './document-studio/templates';
import { DocumentRibbon } from './document-studio/DocumentRibbon';
import { DocumentCanvas } from './document-studio/DocumentCanvas';
import { 
  FileText, 
  Printer, 
  Download, 
  Copy, 
  Share2, 
  Sparkles, 
  Check, 
  Layers, 
  Maximize2, 
  Minimize2, 
  RefreshCw,
  FolderOpen
} from 'lucide-react';

export const DocumentStudioPanel: React.FC<{ token?: string | null }> = ({ token }) => {
  const { 
    
    activeCity, 
    activeNiche, 
    workspaceConfig, 
    regionalProfile 
  } = useBusinessContext();
  
  const { showToast } = useToast();

  const [leadRecords, setLeadRecords] = useState<any[]>([]);
  const [leadLoadError, setLeadLoadError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalLeadId, setProposalLeadId] = useState('');
  const [proposalPackageTier, setProposalPackageTier] = useState<'Growth' | 'Dominance' | 'Enterprise'>('Growth');
  const [proposalRetainer, setProposalRetainer] = useState('1200');
  const [proposalSetupFee, setProposalSetupFee] = useState('500');
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalNotice, setProposalNotice] = useState<string | null>(null);
  const [proposalBusyId, setProposalBusyId] = useState<string | null>(null);

  const getEffectiveToken = () => token || (typeof window !== 'undefined'
    ? (localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || '')
    : '');

  const refreshProposals = async () => {
    const effectiveToken = getEffectiveToken();
    if (!effectiveToken) { setProposals([]); return; }
    const response = await fetch('/api/proposals', { headers: { Authorization: `Bearer ${effectiveToken}` } });
    const payload = await response.json().catch(() => []);
    if (!response.ok) throw new Error(payload?.error || `Proposal list could not be loaded (HTTP ${response.status}).`);
    if (!Array.isArray(payload)) throw new Error('Proposal list response was not a valid array.');
    setProposals(payload);
  };

  useEffect(() => {
    let cancelled = false;
    const effectiveToken = getEffectiveToken();
    if (!effectiveToken) return;
    fetch('/api/proposals', { headers: { Authorization: `Bearer ${effectiveToken}` } })
      .then(async response => {
        const payload = await response.json().catch(() => []);
        if (!response.ok) throw new Error(payload?.error || `Proposal list could not be loaded (HTTP ${response.status}).`);
        if (!Array.isArray(payload)) throw new Error('Proposal list response was not a valid array.');
        if (!cancelled) setProposals(payload);
      })
      .catch(error => {
        if (!cancelled) setProposalError(error instanceof Error ? error.message : 'Saved proposals could not be loaded.');
      });
    return () => { cancelled = true; };
  }, [token]);

  const handleGenerateProposal = async (event: React.FormEvent) => {
    event.preventDefault();
    const effectiveToken = getEffectiveToken();
    const retainer = Number(proposalRetainer);
    const setupFee = Number(proposalSetupFee);
    if (!effectiveToken || !proposalLeadId || !Number.isSafeInteger(retainer) || retainer <= 0 || !Number.isSafeInteger(setupFee) || setupFee <= 0) {
      setProposalError('Select a saved lead and enter positive whole-dollar retainer and setup fees.');
      return;
    }
    setProposalError(null); setProposalNotice(null); setProposalBusyId('generate');
    try {
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${effectiveToken}` },
        body: JSON.stringify({ leadId: proposalLeadId, packageTier: proposalPackageTier, monthlyRetainerUsd: retainer, setupFeeUsd: setupFee })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Proposal generation failed (HTTP ${response.status}).`);
      await refreshProposals();
      setProposalNotice('Proposal draft saved to the workspace. It is not yet internally approved or accepted by the client.');
    } catch (error) {
      setProposalError(error instanceof Error ? error.message : 'Proposal draft could not be saved.');
    } finally { setProposalBusyId(null); }
  };

  const handleApproveProposal = async (proposalId: string) => {
    const effectiveToken = getEffectiveToken();
    if (!effectiveToken) { setProposalError('Sign in again to approve this proposal.'); return; }
    setProposalBusyId(proposalId); setProposalError(null);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${effectiveToken}` },
        body: JSON.stringify({ status: 'approved' })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Proposal approval failed (HTTP ${response.status}).`);
      await refreshProposals();
      setProposalNotice('Proposal approved internally. This is not client acceptance.');
    } catch (error) {
      setProposalError(error instanceof Error ? error.message : 'Proposal could not be approved.');
    } finally { setProposalBusyId(null); }
  };

  const handleCreateSigningLink = async (proposalId: string) => {
    const effectiveToken = getEffectiveToken();
    if (!effectiveToken) { setProposalError('Sign in again to create a client acceptance link.'); return; }
    setProposalBusyId(proposalId); setProposalError(null); setProposalNotice(null);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/signing-link`, {
        method: 'POST', headers: { Authorization: `Bearer ${effectiveToken}` }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Acceptance link creation failed (HTTP ${response.status}).`);
      const absoluteUrl = new URL(payload.signingUrl, window.location.origin).toString();
      await navigator.clipboard.writeText(absoluteUrl);
      setProposalNotice('One-time client acceptance link copied. It expires in seven days; external identity verification is not configured.');
    } catch (error) {
      setProposalError(error instanceof Error ? error.message : 'Client acceptance link could not be created or copied.');
    } finally { setProposalBusyId(null); }
  };


  useEffect(() => {
    let cancelled = false;
    const effectiveToken = token || (typeof window !== 'undefined'
      ? (localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || '')
      : '');
    if (!effectiveToken) {
      setLeadRecords([]);
      setLeadLoadError('Sign in to load saved workspace leads for mail merge.');
      return () => { cancelled = true; };
    }
    fetch('/api/leads', { headers: { Authorization: `Bearer ${effectiveToken}` } })
      .then(async response => {
        const payload = await response.json().catch(() => []);
        if (!response.ok) throw new Error(payload?.error || `Lead list could not be loaded (HTTP ${response.status}).`);
        if (!Array.isArray(payload)) throw new Error('Lead list response was not a valid array.');
        if (!cancelled) {
          setLeadRecords(payload);
          setLeadLoadError(null);
        }
      })
      .catch(error => {
        if (!cancelled) {
          setLeadRecords([]);
          setLeadLoadError(error instanceof Error ? error.message : 'Saved leads could not be loaded.');
        }
      });
    return () => { cancelled = true; };
  }, [token]);


  // Active Ribbon Tab (Default to 'design' or 'home' matching user request)
  const [activeTab, setActiveTab] = useState<RibbonTab>('design');

  // Selected Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('commercial-sla-proposal');
  const [content, setContent] = useState<string>(() => {
    return DOCUMENT_TEMPLATES[0].content;
  });

  // Page Settings
  const [pageSettings, setPageSettings] = useState<DocumentPageSettings>({
    size: 'letter',
    orientation: 'portrait',
    margins: 'normal',
    columns: 1,
    pageColor: '#ffffff',
    watermark: 'CONFIDENTIAL',
    borderStyle: 'box',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    headerText: 'HAL ENTERPRISE OPERATING INTELLIGENCE',
    footerText: 'PROPRIETARY & CONFIDENTIAL COMMERCIAL DOCUMENT',
    showPageNumbers: true,
    indentLeft: 0,
    indentRight: 0,
    spacingBefore: 0,
    spacingAfter: 8,
    lineSpacing: 1.15
  });

  // Active Theme & Formatting Style
  const [activeTheme, setActiveTheme] = useState<DocumentTheme>(THEME_PRESETS[0]);
  const [activeStyle, setActiveStyle] = useState<DocumentFormattingStyle>(FORMATTING_STYLE_PRESETS[1]);

  // Drawing / Inking Mode
  const [drawingMode, setDrawingMode] = useState<boolean>(false);
  const [penTool, setPenTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState<string>('#2563eb');
  const [penSize, setPenSize] = useState<number>(3);
  const [showRuler, setShowRuler] = useState<boolean>(false);
  const [gridBackground, setGridBackground] = useState<'none' | 'ruled' | 'grid'>('none');

  // Mailings & Merge Fields (Populated dynamically from HAL context!)
  // Mail-merge recipients come only from tenant-owned API records.
  const recipients: DocumentRecipient[] = useMemo(() => leadRecords.map(lead => ({
    id: String(lead.id),
    businessName: lead.businessName || 'Business name not recorded',
    ownerName: lead.ownerName || 'Contact not recorded',
    city: lead.city || 'City not recorded',
    phone: lead.phone || 'Phone not recorded',
    email: lead.email || 'Email not recorded',
    tradeNiche: lead.niche || 'Industry not recorded',
    website: lead.websiteUrl || '',
    sslStatus: lead.sslStatus === 'secured' || lead.sslStatus === 'missing' ? lead.sslStatus : 'unknown',
    lcpSpeed: 'Not measured',
    recommendedSlaUsd: null
  })), [leadRecords]);
  const [currentRecipientIndex, setCurrentRecipientIndex] = useState<number>(0);
  const [previewMerge, setPreviewMerge] = useState<boolean>(false);

  // Review & Speech
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [comments, setComments] = useState<DocumentComment[]>([]);

  // Word & Character count calculation
  const wordCount = useMemo(() => {
    const textOnly = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = textOnly ? textOnly.split(' ').length : 0;
    const chars = textOnly.length;
    const readTimeMin = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readTimeMin };
  }, [content]);

  // Full-screen mode
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Switch Template
  const handleSelectTemplate = (templateId: string) => {
    const t = DOCUMENT_TEMPLATES.find(temp => temp.id === templateId);
    if (t) {
      setSelectedTemplateId(t.id);
      setContent(t.content);
      const th = THEME_PRESETS.find(item => item.id === t.themeId);
      if (th) setActiveTheme(th);
      const st = FORMATTING_STYLE_PRESETS.find(item => item.id === t.styleId);
      if (st) setActiveStyle(st);

      showToast({
        title: 'Template Applied',
        message: `Loaded "${t.title}". Design styles updated.`,
        type: 'info'
      });
    }
  };

  // Execution Commands on Document Canvas
  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
  };

  const insertTable = (rows: number, cols: number) => {
    let html = `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">`;
    html += `<thead><tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">`;
    for (let c = 0; c < cols; c++) {
      html += `<th style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: left; font-weight: 600;">Header ${c + 1}</th>`;
    }
    html += `</tr></thead><tbody>`;
    for (let r = 0; r < rows; r++) {
      html += `<tr>`;
      for (let c = 0; c < cols; c++) {
        html += `<td style="padding: 8px 12px; border: 1px solid #e2e8f0;">Cell Data</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table><p><br/></p>`;
    document.execCommand('insertHTML', false, html);
  };

  const insertImage = (url: string) => {
    const html = `<div style="margin: 16px 0; text-align: center;"><img src="${url}" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" alt="Document illustration" /><p style="font-size: 11px; color: #64748b; margin-top: 4px; font-style: italic;">Figure: Verified System Diagnostic Evidence</p></div><p><br/></p>`;
    document.execCommand('insertHTML', false, html);
  };

  const insertCallout = () => {
    const html = `<div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 18px; margin: 16px 0; border-radius: 0 8px 8px 0;"><h4 style="margin: 0 0 4px 0; color: #1e40af; font-size: 14px; font-weight: 700;">Executive Performance Notice</h4><p style="margin: 0; font-size: 12px; color: #1e3a8a; line-height: 1.5;">This engagement is protected under strict local territorial exclusivity. No rival contractor will be onboarded within the specified radius.</p></div><p><br/></p>`;
    document.execCommand('insertHTML', false, html);
  };

  const insertPageBreak = () => {
    const html = `<div style="page-break-after: always; height: 16px; border-bottom: 2px dashed #94a3b8; margin: 24px 0; display: flex; align-items: center; justify-content: center;"><span style="font-size: 10px; background-color: #cbd5e1; color: #475569; padding: 2px 8px; border-radius: 4px; font-family: monospace;">PAGE BREAK</span></div><p><br/></p>`;
    document.execCommand('insertHTML', false, html);
  };

  const insertToc = () => {
    const html = `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">Table of Contents</h3>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #cbd5e1; padding: 4px 0; font-size: 12px;"><span>1. Executive Summary & Diagnostic Scope</span><span style="font-family: monospace; color: #64748b;">Page 1</span></div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #cbd5e1; padding: 4px 0; font-size: 12px;"><span>2. Core Web Vitals & Competitive Analysis</span><span style="font-family: monospace; color: #64748b;">Page 2</span></div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #cbd5e1; padding: 4px 0; font-size: 12px;"><span>3. Monthly Performance Retainer SLA</span><span style="font-family: monospace; color: #64748b;">Page 3</span></div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px;"><span>4. Commercial Authorizations & Signatures</span><span style="font-family: monospace; color: #64748b;">Page 4</span></div>
      </div>
      <p><br/></p>
    `;
    document.execCommand('insertHTML', false, html);
  };

  const insertSignatureBlock = () => {
    const html = `
      <div style="display: flex; justify-content: space-between; margin-top: 36px; padding-top: 20px; page-break-inside: avoid;">
        <div style="width: 45%; border-top: 1px solid #94a3b8; padding-top: 8px;">
          <p style="margin: 0; font-size: 12px; font-weight: 600; color: #0f172a;">Customer Client Representative</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Signature: ___________________________</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Date: _______________________________</p>
        </div>
        <div style="width: 45%; border-top: 1px solid #94a3b8; padding-top: 8px;">
          <p style="margin: 0; font-size: 12px; font-weight: 600; color: #0f172a;">HAL Operating Intelligence</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Authorized Director: _________________</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Date: {{date_today}}</p>
        </div>
      </div>
      <p><br/></p>
    `;
    document.execCommand('insertHTML', false, html);
  };

  const insertMergeField = (fieldKey: string) => {
    document.execCommand('insertHTML', false, `<span style="background-color: #dbeafe; color: #1e40af; font-family: monospace; font-weight: 600; padding: 2px 6px; border-radius: 4px; border: 1px solid #bfdbfe;">${fieldKey}</span>&nbsp;`);
  };

  // Clear freehand ink canvas
  const clearDrawings = () => {
    const canvas = document.querySelector('#document-page-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      showToast({
        title: 'Drawings Cleared',
        message: 'Ink layer reset.',
        type: 'info'
      });
    }
  };

  // Speech synthesis (Read Aloud)
  const toggleReadAloud = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      showToast({ title: 'Speech Not Supported', message: 'Browser TTS is not available.', type: 'error' });
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textOnly = content.replace(/<[^>]*>/g, ' ');
      const utterance = new SpeechSynthesisUtterance(textOnly);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleAddComment = (commentData: Omit<DocumentComment, 'id' | 'date'>) => {
    const newComment: DocumentComment = {
      id: `comm-${Date.now()}`,
      author: commentData.author,
      text: commentData.text,
      date: 'Just now'
    };
    setComments(prev => [...prev, newComment]);
    showToast({
      title: 'Comment Added',
      message: 'Review note pinned to document.',
      type: 'success'
    });
  };

  const handleDeleteComment = (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(content);
    showToast({
      title: 'HTML Copied',
      message: 'Full formatted document HTML copied to clipboard.',
      type: 'success'
    });
  };

  return (
    <div className={`flex flex-col h-full bg-bg-base text-text-primary ${isFullScreen ? 'fixed inset-0 z-50' : 'relative'}`}>
      {/* Top Application Bar with Template Selector & Actions */}
      <div className="h-12 bg-bg-raised border-b border-border-dim px-4 flex items-center justify-between select-none">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-accent" />
            <span className="font-bold text-sm tracking-tight text-text-primary">Document Design Studio</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-accent/15 text-accent font-mono border border-accent/30">
              Word-Class Ribbon Suite
            </span>
          </div>

          <div className="h-4 w-px bg-border-dim mx-2" />

          {/* Template Quick Switcher */}
          <div className="flex items-center space-x-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-text-secondary" />
            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="bg-bg-base border border-border-dim rounded px-2.5 py-1 text-xs text-text-primary outline-none hover:border-accent transition-colors"
            >
              {DOCUMENT_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Right Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyHtml}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-subtle rounded text-xs flex items-center space-x-1"
            title="Copy Raw Document HTML"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="text-xs">Copy HTML</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-accent hover:bg-accent/80 text-black font-semibold rounded text-xs flex items-center space-x-1.5 shadow transition-colors"
            title="Print or Export to PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-subtle rounded"
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <section className="mx-4 my-3 rounded-lg border border-border-dim bg-bg-raised p-4 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Persisted client proposals</h3>
          <p className="mt-1 text-xs text-text-secondary">Generate drafts from saved leads, approve internally, and create one-time client acceptance links. Acceptance is first-party typed-name consent, not external e-sign provider verification.</p>
        </div>
        {proposalError && <div role="alert" className="rounded border border-rose-500/30 bg-rose-500/5 p-2 text-xs text-rose-200">{proposalError}</div>}
        {proposalNotice && <div role="status" className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2 text-xs text-emerald-200">{proposalNotice}</div>}
        <form onSubmit={handleGenerateProposal} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
          <label className="text-xs text-text-secondary md:col-span-2">Saved lead
            <select value={proposalLeadId} onChange={event => setProposalLeadId(event.target.value)} required className="mt-1 w-full rounded border border-border-dim bg-bg-base p-2 text-xs text-text-primary">
              <option value="">Select a real saved lead</option>
              {leadRecords.map(lead => <option key={lead.id} value={lead.id}>{lead.businessName} · {lead.city}</option>)}
            </select>
          </label>
          <label className="text-xs text-text-secondary">Package
            <select value={proposalPackageTier} onChange={event => setProposalPackageTier(event.target.value as 'Growth' | 'Dominance' | 'Enterprise')} className="mt-1 w-full rounded border border-border-dim bg-bg-base p-2 text-xs text-text-primary">
              <option value="Growth">Growth</option><option value="Dominance">Dominance</option><option value="Enterprise">Enterprise</option>
            </select>
          </label>
          <label className="text-xs text-text-secondary">Monthly retainer (USD)
            <input type="number" min="1" step="1" value={proposalRetainer} onChange={event => setProposalRetainer(event.target.value)} className="mt-1 w-full rounded border border-border-dim bg-bg-base p-2 text-xs text-text-primary" />
          </label>
          <label className="text-xs text-text-secondary">Setup fee (USD)
            <input type="number" min="1" step="1" value={proposalSetupFee} onChange={event => setProposalSetupFee(event.target.value)} className="mt-1 w-full rounded border border-border-dim bg-bg-base p-2 text-xs text-text-primary" />
          </label>
          <button type="submit" disabled={proposalBusyId === 'generate' || leadRecords.length === 0} className="md:col-span-5 justify-self-start rounded bg-accent px-3 py-2 text-xs font-semibold text-black disabled:opacity-50">
            {proposalBusyId === 'generate' ? 'Saving draft…' : 'Generate and save proposal draft'}
          </button>
        </form>
        <div className="space-y-2">
          {proposals.length === 0 ? <p className="text-xs text-text-secondary">No persisted proposals yet.</p> : proposals.map(proposal => {
            const proposalContent = proposal.content || {};
            const status = String(proposal.status || 'draft');
            return <div key={proposal.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded border border-border-dim bg-bg-base p-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-primary">{proposalContent.companyName || 'Client proposal'} · {proposalContent.packageTier || 'Package'}</div>
                <div className="mt-1 text-[11px] text-text-secondary">{proposalContent.clientName || 'Client'} · ${Number(proposalContent.monthlyRetainerUsd || 0).toLocaleString()}/mo · Setup ${Number(proposalContent.setupFeeUsd || 0).toLocaleString()}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-text-secondary">Status: {status === 'signed' ? 'Client accepted (first-party)' : status === 'approved' ? 'Internally approved' : status}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {status === 'draft' && <button type="button" disabled={proposalBusyId === proposal.id} onClick={() => handleApproveProposal(proposal.id)} className="rounded border border-border-dim px-2.5 py-1.5 text-[11px] text-text-primary disabled:opacity-50">Approve internally</button>}
                {status === 'approved' && <button type="button" disabled={proposalBusyId === proposal.id} onClick={() => handleCreateSigningLink(proposal.id)} className="rounded border border-border-dim px-2.5 py-1.5 text-[11px] text-text-primary disabled:opacity-50">Copy client acceptance link</button>}
              </div>
            </div>;
          })}
        </div>
      </section>

      {/* The 8-Tab Word Ribbon Toolbar */}
      <DocumentRibbon
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pageSettings={pageSettings}
        setPageSettings={setPageSettings}
        activeTheme={activeTheme}
        setActiveTheme={setActiveTheme}
        activeStyle={activeStyle}
        setActiveStyle={setActiveStyle}
        drawingMode={drawingMode}
        setDrawingMode={setDrawingMode}
        penTool={penTool}
        setPenTool={setPenTool}
        penColor={penColor}
        setPenColor={setPenColor}
        penSize={penSize}
        setPenSize={setPenSize}
        showRuler={showRuler}
        setShowRuler={setShowRuler}
        gridBackground={gridBackground}
        setGridBackground={setGridBackground}
        clearDrawings={clearDrawings}
        recipients={recipients}
        currentRecipientIndex={currentRecipientIndex}
        setCurrentRecipientIndex={setCurrentRecipientIndex}
        previewMerge={previewMerge}
        setPreviewMerge={setPreviewMerge}
        insertMergeField={insertMergeField}
        isSpeaking={isSpeaking}
        toggleReadAloud={toggleReadAloud}
        wordCount={wordCount}
        showComments={showComments}
        setShowComments={setShowComments}
        execCommand={execCommand}
        insertTable={insertTable}
        insertImage={insertImage}
        insertCallout={insertCallout}
        insertPageBreak={insertPageBreak}
        insertToc={insertToc}
        insertSignatureBlock={insertSignatureBlock}
      />

      {leadLoadError && (
        <div role="alert" className="mx-4 my-2 rounded border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
          {leadLoadError}
        </div>
      )}
      {!leadLoadError && recipients.length === 0 && (
        <div role="status" className="mx-4 my-2 rounded border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-300">
          No saved leads are available for mail merge. Add and verify a real lead in CRM first; HAL will not insert sample recipients.
        </div>
      )}

      {/* Main Interactive Paper Canvas Area */}
      <DocumentCanvas
        content={content}
        onContentChange={setContent}
        pageSettings={pageSettings}
        activeTheme={activeTheme}
        activeStyle={activeStyle}
        drawingMode={drawingMode}
        penTool={penTool}
        penColor={penColor}
        penSize={penSize}
        showRuler={showRuler}
        gridBackground={gridBackground}
        previewMerge={previewMerge}
        activeRecipient={recipients[currentRecipientIndex]}
        comments={comments}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        showComments={showComments}
      />

      {/* Bottom Status Bar */}
      <div className="h-6 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 select-none">
        <div className="flex items-center space-x-4">
          <span>Page 1 of 1</span>
          <span>{wordCount.words} words</span>
          <span>{wordCount.chars} characters</span>
          <span className="text-emerald-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            <span>Editor state only · not persisted</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span>Theme: <strong className="text-slate-200">{activeTheme.name}</strong></span>
          <span>Layout: <strong className="text-slate-200 capitalize">{pageSettings.orientation} ({pageSettings.size})</strong></span>
          {previewMerge && (
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 font-mono rounded">
              MERGE PREVIEW ACTIVE
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
