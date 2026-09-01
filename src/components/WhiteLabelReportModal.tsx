import React, { useEffect, useState } from 'react';
import { Lead } from '../types';
import { useBusinessContext } from '../context/BusinessContext';
import { 
  Building2, 
  X, 
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
  User,
  Phone,
  Mail,
  FileText,
  DollarSign,
  Download,
  Check,
  Share2,
  ExternalLink
} from 'lucide-react';

interface WhiteLabelReportModalProps {
  lead?: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WhiteLabelReportModal({ lead, isOpen, onClose }: WhiteLabelReportModalProps) {
  const { activeIndustry, activeCity, activeNiche, workspaceConfig } = useBusinessContext();
  const [downloadedCsv, setDownloadedCsv] = useState(false);
  const [copiedAuditLink, setCopiedAuditLink] = useState(false);

  // Allow closing via Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const targetName = lead ? lead.businessName : `${activeCity} ${activeNiche.toUpperCase()} TERRITORY AUDIT`;
  const ownerName = lead?.ownerName || 'Business Owner / Principal';
  const website = lead?.websiteUrl || `https://www.${targetName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  const seo = lead?.seoScore ?? 68;
  const perf = lead?.performanceScore ?? 54;
  const ssl = lead?.sslStatus ?? 'secured';
  const rating = lead?.googleRating ?? 4.4;
  const reviews = lead?.reviewCount ?? 38;
  const ltv = lead?.predictedLtvUsd ?? activeIndustry.ltvRange.averageContract;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAuditLink = () => {
    if (!lead) return;
    const url = `${window.location.origin}/?audit=${lead.id}`;
    navigator.clipboard.writeText(url);
    setCopiedAuditLink(true);
    setTimeout(() => setCopiedAuditLink(false), 3000);
  };

  const handleOpenAuditPreview = () => {
    if (!lead) return;
    window.open(`/?audit=${lead.id}`, '_blank');
  };

  const handleDownloadSingleLeadCsv = () => {
    const headers = ['Business Name', 'Owner', 'City', 'Niche', 'Website', 'Phone', 'Email', 'SEO Score', 'Performance Score', 'SSL Status', 'Google Rating', 'Review Count', 'Predicted LTV ($)', 'Status', 'Audit Notes', 'Pitch Strategy'];
    const row = [
      targetName,
      ownerName,
      lead?.city || activeCity,
      lead?.serviceType || activeNiche,
      website,
      lead?.phone || '',
      lead?.email || '',
      seo,
      perf,
      ssl,
      rating,
      reviews,
      ltv,
      lead?.status || 'new',
      lead?.notes || activeIndustry.outreachAngle,
      lead?.outreachStrategy || ''
    ].map(cell => {
      const cellStr = cell === null || cell === undefined ? '' : String(cell);
      if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',');

    const csvContent = [headers.join(','), row].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${targetName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_audit_report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadedCsv(true);
    setTimeout(() => setDownloadedCsv(false), 3000);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto"
      style={{ isolation: 'isolate' }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-bg-raised border border-border-dim rounded-md shadow-2xl overflow-hidden my-auto print:border-none print:shadow-none print:m-0 print:w-full print:max-w-none flex flex-col z-10"
      >
        
        {/* TOP CONTROLS (Hidden on Print) */}
        <div className="flex items-center justify-between p-4 bg-bg-subtle border-b border-border-dim print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand" />
            <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
              WHITE-LABEL EXECUTIVE PITCH DECK & AUDIT REPORT
            </span>
          </div>
          <div className="flex items-center gap-2">
            {lead && (
              <button
                onClick={handleCopyAuditLink}
                className="px-3 py-1.5 bg-accent/15 border border-accent/40 hover:bg-accent/25 text-accent text-xs font-mono font-bold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy shareable link with interactive ROI calculator and booking"
              >
                {copiedAuditLink ? <Check className="w-3.5 h-3.5 text-positive" /> : <Share2 className="w-3.5 h-3.5" />}
                {copiedAuditLink ? 'LINK COPIED!' : 'SHARE AUDIT'}
              </button>
            )}
            {lead && (
              <button
                onClick={handleOpenAuditPreview}
                className="px-3 py-1.5 bg-bg-raised border border-border-dim hover:border-brand/40 text-text-primary text-xs font-mono font-bold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open client-facing audit view in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-brand" />
                <span className="hidden sm:inline">LIVE PREVIEW</span>
              </button>
            )}
            <button
              onClick={handleDownloadSingleLeadCsv}
              className="px-3 py-1.5 bg-bg-raised border border-border-dim hover:border-brand/40 text-text-primary text-xs font-mono font-bold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download CSV report data"
            >
              {downloadedCsv ? <Check className="w-3.5 h-3.5 text-positive" /> : <Download className="w-3.5 h-3.5 text-brand" />}
              {downloadedCsv ? 'CSV DOWNLOADED' : 'DOWNLOAD CSV'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-mono font-bold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> PRINT / DOWNLOAD PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-text-dim hover:text-text-primary hover:bg-bg-raised rounded-sm transition-colors cursor-pointer flex items-center gap-1 font-mono text-xs font-bold"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
              <span>ESC</span>
            </button>
          </div>
        </div>

        {/* REPORT CONTENT CANVAS */}
        <div className="p-8 space-y-8 bg-bg-raised text-text-primary print:p-6 print:bg-white print:text-black overflow-y-auto max-h-[78vh]">
          
          {/* BRANDED HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-brand/30 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3.5 h-3.5 rounded-sm"
                  style={{ backgroundColor: workspaceConfig.brandColor || '#3b82f6' }}
                />
                <h1 className="text-xl font-mono font-bold text-text-primary uppercase tracking-tight">
                  {workspaceConfig.agencyName}
                </h1>
              </div>
              <p className="text-xs font-mono text-text-secondary mt-1">
                {workspaceConfig.tagline}
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-[11px] text-text-secondary space-y-0.5">
              <p className="font-bold text-text-primary">PREPARED BY: {workspaceConfig.operatorName.toUpperCase()}</p>
              <p>INDUSTRY: <span className="text-brand font-bold">{activeIndustry.name.toUpperCase()}</span></p>
              <p>NICHE: <span className="uppercase">{activeNiche}</span></p>
              <p className="text-[10px] text-text-dim">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* TARGET PROSPECT BANNER */}
          <div className="bg-bg-subtle border border-border-dim p-5 rounded-sm flex flex-col md:flex-row justify-between gap-4">
            <div>
              <span className="text-[9px] font-mono text-brand font-bold uppercase tracking-widest block mb-1">
                EXECUTIVE AUDIT TARGET
              </span>
              <h2 className="text-lg font-mono font-bold text-text-primary uppercase">
                {targetName}
              </h2>
              <p className="text-xs font-mono text-text-secondary mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1"><User className="w-3 h-3 text-text-dim" /> {ownerName}</span>
                <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-text-dim" /> {website}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-border-dim pt-3 md:pt-0 md:pl-6 font-mono">
              <div className="text-center px-2">
                <span className="text-[9px] text-text-dim block uppercase">PREDICTED LTV</span>
                <span className="text-base font-bold text-positive flex items-center justify-center">
                  ${ltv.toLocaleString()}
                </span>
              </div>
              <div className="text-center px-2 border-l border-border-dim/50">
                <span className="text-[9px] text-text-dim block uppercase">RATING</span>
                <span className="text-base font-bold text-amber-400 flex items-center justify-center gap-1">
                  ★ {rating}
                </span>
              </div>
            </div>
          </div>

          {/* CORE TECHNICAL AUDIT METRICS GRID */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-brand" />
              <span>TECHNICAL PERFORMANCE & DIGITAL AUDIT BREAKDOWN</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3 bg-bg-subtle border border-border-dim rounded-sm">
                <span className="text-[9px] text-text-secondary uppercase block">TECHNICAL SEO</span>
                <span className={`text-xl font-bold ${seo >= 70 ? 'text-positive' : seo >= 50 ? 'text-amber-400' : 'text-negative'}`}>
                  {seo}/100
                </span>
                <span className="text-[9px] text-text-dim block mt-0.5">Search index score</span>
              </div>

              <div className="p-3 bg-bg-subtle border border-border-dim rounded-sm">
                <span className="text-[9px] text-text-secondary uppercase block">MOBILE SPEED</span>
                <span className={`text-xl font-bold ${perf >= 70 ? 'text-positive' : perf >= 50 ? 'text-amber-400' : 'text-negative'}`}>
                  {perf}/100
                </span>
                <span className="text-[9px] text-text-dim block mt-0.5">Load responsiveness</span>
              </div>

              <div className="p-3 bg-bg-subtle border border-border-dim rounded-sm">
                <span className="text-[9px] text-text-secondary uppercase block">SSL CERTIFICATE</span>
                <span className={`text-sm font-bold flex items-center gap-1 mt-1 ${ssl === 'secured' ? 'text-positive' : 'text-negative'}`}>
                  {ssl === 'secured' ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {ssl.toUpperCase()}
                </span>
                <span className="text-[9px] text-text-dim block mt-0.5">Browser trust lock</span>
              </div>

              <div className="p-3 bg-bg-subtle border border-border-dim rounded-sm">
                <span className="text-[9px] text-text-secondary uppercase block">GOOGLE REVIEWS</span>
                <span className="text-sm font-bold text-text-primary mt-1 block">
                  {reviews} REVIEWS
                </span>
                <span className="text-[9px] text-text-dim block mt-0.5">Public reputation</span>
              </div>
            </div>
          </div>

          {/* INDUSTRY SPECIFIC AUDIT FOCUS CHECKLIST */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-brand" />
              <span>INDUSTRY CRITICAL COMPLIANCE AUDIT ({activeIndustry.name.toUpperCase()})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-bg-subtle border border-border-dim rounded-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-text-primary block">{activeIndustry.auditFocus.key1}</span>
                  <span className="text-[10px] text-text-secondary">Core speed & mobile usability benchmark for {activeNiche}.</span>
                </div>
              </div>

              <div className="p-3 bg-bg-subtle border border-border-dim rounded-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-text-primary block">{activeIndustry.auditFocus.key2}</span>
                  <span className="text-[10px] text-text-secondary">Credential badging and trust verification signals.</span>
                </div>
              </div>

              <div className="p-3 bg-bg-subtle border border-border-dim rounded-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-text-primary block">{activeIndustry.auditFocus.key3}</span>
                  <span className="text-[10px] text-text-secondary">Instant estimation & booking friction reduction.</span>
                </div>
              </div>

              <div className="p-3 bg-bg-subtle border border-border-dim rounded-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-text-primary block">{activeIndustry.auditFocus.key4}</span>
                  <span className="text-[10px] text-text-secondary">Local territory search dominance & reputation management.</span>
                </div>
              </div>
            </div>
          </div>

          {/* EXECUTIVE ANALYSIS & VALUE ANGLE */}
          <div className="p-4 bg-brand/10 border border-brand/30 rounded-sm space-y-2 font-mono">
            <h4 className="text-xs font-bold text-brand uppercase flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>STRATEGIC ACQUISITION ANGLE & VALUE PROPOSITION</span>
            </h4>
            <p className="text-xs text-text-primary leading-relaxed">
              "{lead?.notes || activeIndustry.outreachAngle}"
            </p>
            {lead?.outreachStrategy && (
              <div className="pt-2 border-t border-brand/20 text-[11px] text-text-secondary">
                <span className="font-bold text-text-primary">RECOMMENDED ACTION PLAN: </span>
                {lead.outreachStrategy}
              </div>
            )}
          </div>

          {/* STRATEGY SESSION & BOOKING CALLOUT */}
          <div className="p-4 bg-bg-subtle border border-border-dim rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-text-primary font-bold">
                <Calendar className="w-4 h-4 text-brand" />
                <span>SCHEDULE 15-MIN EXECUTIVE STRATEGY REVIEW</span>
              </div>
              <p className="text-[11px] text-text-secondary">
                Direct calendar link for {lead ? lead.businessName : 'Prospect'}: <span className="text-brand underline">{workspaceConfig.bookingUrl || 'https://cal.com/hal-strategy'}</span>
              </p>
            </div>
            {lead && (
              <button
                type="button"
                onClick={handleCopyAuditLink}
                className="px-3.5 py-1.5 bg-brand/10 border border-brand/40 text-brand hover:bg-brand/20 rounded-sm text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 print:hidden"
              >
                {copiedAuditLink ? <Check className="w-3.5 h-3.5 text-positive" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedAuditLink ? 'LINK COPIED' : 'COPY CLIENT AUDIT LINK'}</span>
              </button>
            )}
          </div>

          {/* FOOTER CONFIDENTIALITY NOTICE */}
          <div className="pt-6 border-t border-border-dim flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-text-dim gap-2">
            <div>
              <span>CONFIDENTIAL AUDIT PREPARED BY </span>
              <span className="font-bold text-text-secondary">{workspaceConfig.agencyName.toUpperCase()}</span>
            </div>
            <div>
              <span>HAL BUSINESS OPERATING INTELLIGENCE V0.1</span>
            </div>
          </div>

        </div>

        {/* BOTTOM ACTION BAR (Hidden on Print) */}
        <div className="flex items-center justify-between p-4 bg-bg-subtle border-t border-border-dim print:hidden shrink-0">
          <div className="text-[11px] font-mono text-text-secondary">
            Press <kbd className="px-1.5 py-0.5 bg-bg-raised border border-border-dim rounded text-text-primary text-[10px]">ESC</kbd> or click outside to exit
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSingleLeadCsv}
              className="px-3.5 py-1.5 bg-bg-raised border border-border-dim hover:border-brand/40 text-text-primary text-xs font-mono font-bold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {downloadedCsv ? <Check className="w-3.5 h-3.5 text-positive" /> : <Download className="w-3.5 h-3.5 text-brand" />}
              {downloadedCsv ? 'CSV Downloaded' : 'Export CSV'}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-mono font-bold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-bg-raised border border-border-dim text-text-secondary hover:text-text-primary text-xs font-mono font-bold rounded-sm transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
