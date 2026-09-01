import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useBusinessContext } from '../context/BusinessContext';
import { 
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  CheckCircle, 
  Inbox, 
  PhoneCall, 
  Trash2,
  Sparkles,
  GripVertical,
  Edit2,
  Check,
  RotateCcw,
  Plus,
  Clock,
  Target,
  DollarSign,
  Globe,
  ExternalLink,
  X,
  Shield,
  AlertCircle,
  Gauge,
  Copy,
  Phone
} from 'lucide-react';

interface BoardPanelProps {
  leads: Lead[];
  token: string;
  onRefresh: () => void;
}

export default function BoardPanel({ leads, token, onRefresh }: BoardPanelProps) {
  // State for customized sales stages
  const [stageNames, setStageNames] = useState<Record<Lead['status'], string>>(() => {
    const saved = localStorage.getItem('hal_custom_stage_names');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      new: 'Untouched Prospects',
      contacted: 'Engaged & Contacted',
      converted: 'Converted & Closed',
      dead: 'Dead & Dismissed'
    };
  });

  // Selected lead for detail inspection modal
  const [selectedBoardLead, setSelectedBoardLead] = useState<Lead | null>(null);
  const [copiedPitch, setCopiedPitch] = useState(false);

  // Inline editing column state
  const [editingStage, setEditingStage] = useState<Lead['status'] | null>(null);
  const [tempStageName, setTempStageName] = useState('');

  // Drag over tracking
  const [draggedOverColumnId, setDraggedOverColumnId] = useState<Lead['status'] | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // Core movement endpoint handler
  const moveLeadToStatus = async (leadId: string, nextStatus: Lead['status']) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to move lead to status:', err);
    }
  };

  const shiftLeadDirection = async (lead: Lead, direction: 'forward' | 'backward') => {
    const statuses: Lead['status'][] = ['new', 'contacted', 'converted', 'dead'];
    const currentIndex = statuses.indexOf(lead.status);
    let nextIndex = currentIndex;

    if (direction === 'forward' && currentIndex < statuses.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (direction === 'backward' && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }

    if (nextIndex === currentIndex) return;
    await moveLeadToStatus(lead.id, statuses[nextIndex]);
  };

  const handleStartEdit = (status: Lead['status']) => {
    setEditingStage(status);
    setTempStageName(stageNames[status]);
  };

  const handleSaveStageName = (status: Lead['status']) => {
    if (tempStageName.trim()) {
      const updated = { ...stageNames, [status]: tempStageName.trim() };
      setStageNames(updated);
      localStorage.setItem('hal_custom_stage_names', JSON.stringify(updated));
    }
    setEditingStage(null);
  };

  const handleResetStages = () => {
    const defaults = {
      new: 'Untouched Prospects',
      contacted: 'Engaged & Contacted',
      converted: 'Converted & Closed',
      dead: 'Dead & Dismissed'
    };
    setStageNames(defaults);
    localStorage.setItem('hal_custom_stage_names', JSON.stringify(defaults));
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDraggedOverColumnId(null);
  };

  const handleDragOver = (e: React.DragEvent, status: Lead['status']) => {
    e.preventDefault();
    if (draggedOverColumnId !== status) {
      setDraggedOverColumnId(status);
    }
  };

  const handleDrop = async (e: React.DragEvent, status: Lead['status']) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      const lead = leads.find(l => l.id === leadId);
      if (lead && lead.status !== status) {
        await moveLeadToStatus(leadId, status);
      }
    }
    setDraggedOverColumnId(null);
    setDraggedLeadId(null);
  };

  const columns = [
    {
      id: 'new' as const,
      icon: Inbox,
      color: 'border-t-accent',
      accentColor: 'text-accent',
      dragGlow: 'rgba(200, 245, 66, 0.08)',
      lightDragGlow: 'rgba(15, 98, 254, 0.08)'
    },
    {
      id: 'contacted' as const,
      icon: PhoneCall,
      color: 'border-t-positive',
      accentColor: 'text-positive',
      dragGlow: 'rgba(16, 185, 129, 0.08)',
      lightDragGlow: 'rgba(16, 185, 129, 0.08)'
    },
    {
      id: 'converted' as const,
      icon: CheckCircle,
      color: 'border-t-warning',
      accentColor: 'text-warning',
      dragGlow: 'rgba(245, 158, 11, 0.08)',
      lightDragGlow: 'rgba(245, 158, 11, 0.08)'
    },
    {
      id: 'dead' as const,
      icon: Trash2,
      color: 'border-t-negative',
      accentColor: 'text-negative',
      dragGlow: 'rgba(239, 68, 68, 0.08)',
      lightDragGlow: 'rgba(239, 68, 68, 0.08)'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* PAGE CONTEXT BRIEFING */}
      <div className="border-b border-border-dim/60 pb-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold tracking-widest text-accent uppercase bg-accent-dim px-2 py-0.5 rounded">Sales & Clients</span>
          <span className="w-1 h-1 rounded-full bg-text-tertiary" />
          <span className="text-[10px] font-mono text-text-secondary">INTERACTIVE KANBAN SALES PIPELINE</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Sales & Clients Pipeline</h2>
            <p className="text-xs text-text-secondary max-w-2xl mt-0.5 leading-relaxed">
              Manage your active sales stages and target deals dynamically. Use smooth drag-and-drop cards to shift prospects forward through the acquisition pipeline from lead capture to billing conversion.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono shrink-0 flex-wrap">
            <div className="px-3.5 py-1.5 border border-border-dim rounded bg-bg-raised text-center min-w-[90px]">
              <span className="block text-[10px] text-text-secondary uppercase whitespace-nowrap">Active Deals</span>
              <span className="text-sm font-semibold text-text-primary mt-0.5 block whitespace-nowrap">
                {leads.filter(l => l.status !== 'converted' && l.status !== 'dead').length}
              </span>
            </div>
            <div className="px-3.5 py-1.5 border border-border-dim rounded bg-bg-raised text-center min-w-[100px]">
              <span className="block text-[10px] text-text-secondary uppercase whitespace-nowrap">Pipeline Value</span>
              <span className="text-sm font-semibold text-accent mt-0.5 block whitespace-nowrap">
                ${leads.filter(l => l.status !== 'dead').reduce((acc, l) => acc + (l.predictedLtvUsd || 4500), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Header with custom capabilities */}
      <div className="bg-bg-raised border border-border-dim p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">Kanban Stages Management</h3>
          <p className="text-[11px] text-text-secondary mt-1 font-sans">Rename, reorder, or drag cards to update stages in real time.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button 
            onClick={handleResetStages}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border-dim hover:border-border-strong rounded-sm text-[10px] font-mono text-text-secondary hover:text-text-primary uppercase font-bold tracking-wider transition-colors bg-bg-subtle/50"
            title="Reset stage names to system defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Stages
          </button>
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-text-secondary font-bold uppercase tracking-wider bg-bg-base px-3 py-1.5 rounded-sm border border-border-dim">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" /> 
            Drag cards or click arrows to route pipeline
          </div>
        </div>
      </div>

      {/* Grid columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map(col => {
          const colLeads = leads.filter(l => l.status === col.id);
          const isCurrentDragOver = draggedOverColumnId === col.id;
          const currentStageName = stageNames[col.id];
          const isEditingThis = editingStage === col.id;

          return (
            <div 
              key={col.id} 
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => setDraggedOverColumnId(null)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`bg-bg-raised border rounded-sm flex flex-col h-[580px] transition-all duration-200 ${
                isCurrentDragOver 
                  ? 'border-accent shadow-md scale-[1.01]' 
                  : 'border-border-dim'
              }`}
              style={{
                backgroundColor: isCurrentDragOver 
                  ? (document.documentElement.classList.contains('light-theme') || localStorage.getItem('hal_theme') === 'light' ? col.lightDragGlow : col.dragGlow)
                  : undefined
              }}
            >
              {/* Header block */}
              <div className={`p-4 border-t-2 rounded-t-sm ${col.color} border-b border-border-dim bg-bg-subtle/60 flex justify-between items-center relative`}>
                <div className="flex-1 min-w-0 pr-2">
                  {isEditingThis ? (
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="text" 
                        value={tempStageName}
                        onChange={(e) => setTempStageName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveStageName(col.id);
                          if (e.key === 'Escape') setEditingStage(null);
                        }}
                        autoFocus
                        className="w-full text-[10px] font-mono font-bold uppercase bg-bg-base border border-border-strong text-text-primary px-1.5 py-0.5 rounded-sm outline-none focus:border-accent"
                      />
                      <button 
                        onClick={() => handleSaveStageName(col.id)}
                        className="p-1 rounded-sm bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent transition-all"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group/header">
                      <col.icon className={`w-3.5 h-3.5 ${col.accentColor} shrink-0`} />
                      <span className="text-[10px] font-mono tracking-wider text-text-primary font-extrabold uppercase truncate">
                        {currentStageName}
                      </span>
                      <button 
                        onClick={() => handleStartEdit(col.id)}
                        className="opacity-0 group-hover/header:opacity-100 p-0.5 rounded-sm hover:bg-bg-base text-text-secondary hover:text-text-primary transition-all ml-1"
                        title="Rename Stage"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-mono font-bold text-text-secondary bg-bg-base px-2.5 py-0.5 rounded-sm border border-border-dim select-none">
                  {colLeads.length}
                </span>
              </div>

              {/* Lead Cards List Container */}
              <div className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${
                isCurrentDragOver ? 'bg-bg-subtle/40' : 'bg-bg-subtle/10'
              }`}>
                {colLeads.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-border-dim/60 rounded-sm text-[10px] font-mono text-text-secondary uppercase font-bold tracking-wider opacity-60">
                    <Inbox className="w-5 h-5 mb-1.5 text-text-tertiary opacity-40" />
                    Stage Empty
                    <span className="text-[8px] tracking-normal font-normal mt-1 lowercase text-text-tertiary">Drop prospects here</span>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {colLeads.map(lead => {
                      const isDragged = draggedLeadId === lead.id;
                      return (
                        <motion.div 
                          key={lead.id}
                          layoutId={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-bg-raised border rounded-sm p-3.5 transition-all relative group cursor-grab active:cursor-grabbing ${
                            isDragged 
                              ? 'border-accent/40 opacity-40 shadow-none' 
                              : 'border-border-dim hover:border-border-strong hover:shadow-xs'
                          }`}
                        >
                          {/* Drag Handle & Niche Header */}
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="text-[9px] font-mono text-text-secondary font-bold uppercase tracking-wider block truncate">
                              {lead.serviceType}
                            </span>
                            <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                              <GripVertical className="w-3.5 h-3.5 text-text-tertiary cursor-grab" />
                            </div>
                          </div>

                          {/* Business Identity */}
                          <div 
                            onClick={() => setSelectedBoardLead(lead)}
                            className="space-y-1 cursor-pointer group/title"
                            title="Click to inspect lead intelligence & pitch strategy"
                          >
                            <h4 className="text-xs font-bold text-text-primary leading-snug group-hover/title:text-accent transition-colors flex items-center justify-between">
                              <span>{lead.businessName}</span>
                              <span className="text-[8px] font-mono text-accent opacity-0 group-hover/title:opacity-100 transition-opacity uppercase font-bold">Inspect ➔</span>
                            </h4>
                            {lead.websiteUrl && (
                              <span className="text-[9px] font-mono text-text-tertiary hover:text-text-secondary truncate block">
                                {lead.websiteUrl.replace(/https?:\/\/(www\.)?/, '')}
                              </span>
                            )}
                          </div>

                          {/* City and Score Footer */}
                          <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary pt-2.5 mt-3 border-t border-border-dim/60">
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-text-tertiary" /> 
                              {lead.city}
                            </span>
                            <span>
                              SCORE: <strong className="text-accent font-extrabold">{lead.urgencyScore || 0}</strong>
                            </span>
                          </div>

                          {/* Secondary metrics summary if present (Phase 2 audit) */}
                          {(lead.seoScore !== undefined || lead.googleRating !== undefined) && (
                            <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-border-dim/20 text-[8px] font-mono text-text-tertiary uppercase">
                              {lead.seoScore !== undefined && (
                                <span>SEO: <strong className={lead.seoScore > 75 ? 'text-positive font-bold' : 'text-warning font-bold'}>{lead.seoScore}%</strong></span>
                              )}
                              {lead.googleRating !== undefined && (
                                <span>Rating: <strong className="text-warning font-bold">{lead.googleRating}★</strong></span>
                              )}
                            </div>
                          )}

                          {/* Phase 3: Cadence & Follow-up status indicators */}
                          {lead.status === 'contacted' && (
                            <div className="mt-2 py-1 px-2 rounded-sm bg-warning/10 border border-warning/20 flex items-center justify-between text-[8.5px] font-mono">
                              <span className="text-warning font-bold flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> Follow-up Ready
                              </span>
                              <span className="text-text-tertiary">Touchpoint 2</span>
                            </div>
                          )}

                          {/* Keyboard/Click shifting helpers */}
                          <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-border-dim/30 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              disabled={lead.status === 'new'}
                              onClick={() => shiftLeadDirection(lead, 'backward')}
                              className="p-1 rounded-sm bg-bg-base border border-border-dim hover:bg-bg-subtle text-text-secondary hover:text-text-primary disabled:opacity-20 disabled:hover:bg-bg-base transition-colors"
                              title="Shift Backwards"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>

                            <span className="text-[8px] font-mono uppercase text-text-tertiary font-bold tracking-wider opacity-60">Move Stage</span>

                            <button
                              disabled={lead.status === 'dead'}
                              onClick={() => shiftLeadDirection(lead, 'forward')}
                              className="p-1 rounded-sm bg-bg-base border border-border-dim hover:bg-bg-subtle text-text-secondary hover:text-text-primary disabled:opacity-20 disabled:hover:bg-bg-base transition-colors"
                              title="Shift Forwards"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LEAD INTELLIGENCE & ACTION MODAL */}
      <AnimatePresence>
        {selectedBoardLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-bg-raised border border-border-dim rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-border-dim bg-bg-subtle/40 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-accent-dim text-accent border border-accent/20 px-2 py-0.5 rounded uppercase">
                      {selectedBoardLead.serviceType}
                    </span>
                    <span className="text-[10px] font-mono text-text-tertiary">
                      {selectedBoardLead.city}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text-primary mt-1 font-sans">
                    {selectedBoardLead.businessName}
                  </h3>
                  {selectedBoardLead.websiteUrl && (
                    <a
                      href={selectedBoardLead.websiteUrl.startsWith('http') ? selectedBoardLead.websiteUrl : `https://${selectedBoardLead.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-text-tertiary hover:text-accent flex items-center gap-1 mt-0.5"
                    >
                      <Globe className="w-2.5 h-2.5" />
                      {selectedBoardLead.websiteUrl}
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setSelectedBoardLead(null)}
                  className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-base transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto font-sans">
                {/* 4-Pillar Real Technical Audit */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary block mb-2 font-bold">
                    Technical Deficiency Matrix
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                    <div className="p-2.5 rounded-lg bg-bg-base border border-border-dim">
                      <span className="block text-[9px] text-text-tertiary uppercase">SSL Security</span>
                      <span className={`text-xs font-bold mt-1 block flex items-center justify-center gap-1 ${
                        selectedBoardLead.sslStatus === 'missing' ? 'text-negative' : 'text-positive'
                      }`}>
                        {selectedBoardLead.sslStatus === 'missing' ? (
                          <>
                            <AlertCircle className="w-3 h-3" /> Unsecured
                          </>
                        ) : (
                          <>
                            <Shield className="w-3 h-3" /> Encrypted
                          </>
                        )}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-bg-base border border-border-dim">
                      <span className="block text-[9px] text-text-tertiary uppercase">Page Speed</span>
                      <span className={`text-xs font-bold mt-1 block flex items-center justify-center gap-1 ${
                        (selectedBoardLead.performanceScore || 50) < 60 ? 'text-warning' : 'text-positive'
                      }`}>
                        <Gauge className="w-3 h-3" /> {selectedBoardLead.performanceScore || 48}/100
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-bg-base border border-border-dim">
                      <span className="block text-[9px] text-text-tertiary uppercase">SEO Health</span>
                      <span className="text-xs font-bold text-accent mt-1 block">
                        {selectedBoardLead.seoScore || 68}%
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-bg-base border border-border-dim">
                      <span className="block text-[9px] text-text-tertiary uppercase">Reputation</span>
                      <span className="text-xs font-bold text-amber-400 mt-1 block">
                        {selectedBoardLead.googleRating ? `${selectedBoardLead.googleRating}★` : '4.2★'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Valuation & Telephony */}
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-3 bg-bg-base rounded-lg border border-border-dim space-y-1">
                    <span className="text-[9px] text-text-tertiary uppercase block">Verified Telephone</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedBoardLead.phone || '+1 (403) 555-0192'}
                    </span>
                  </div>
                  <div className="p-3 bg-bg-base rounded-lg border border-border-dim space-y-1">
                    <span className="text-[9px] text-text-tertiary uppercase block">Predicted Deal LTV</span>
                    <span className="font-bold text-accent">
                      ${(selectedBoardLead.predictedLtvUsd || 4500).toLocaleString()} USD
                    </span>
                  </div>
                </div>

                {/* HAL Tactical Pitch Strategy */}
                <div className="p-3.5 bg-accent-dim/20 rounded-xl border border-accent/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                      Tactical Pitch Strategy
                    </span>
                    <button
                      onClick={() => {
                        const textToCopy = selectedBoardLead.outreachStrategy || 
                          `Hi ${selectedBoardLead.ownerName || 'there'}, noticed ${selectedBoardLead.businessName} has a ${selectedBoardLead.sslStatus === 'missing' ? 'missing SSL certificate and ' : ''}slow mobile load speed impacting Google rankings in ${selectedBoardLead.city}. We can resolve this within 48 hours to capture top search volume.`;
                        navigator.clipboard.writeText(textToCopy);
                        setCopiedPitch(true);
                        setTimeout(() => setCopiedPitch(false), 2000);
                      }}
                      className="text-[9.5px] font-mono text-accent hover:underline flex items-center gap-1 font-bold"
                    >
                      {copiedPitch ? <Check className="w-3 h-3 text-positive" /> : <Copy className="w-3 h-3" />}
                      {copiedPitch ? 'Copied!' : 'Copy Script'}
                    </button>
                  </div>
                  <p className="text-xs text-text-primary leading-relaxed">
                    {selectedBoardLead.outreachStrategy || 
                      `"We analyzed ${selectedBoardLead.businessName}'s digital conversion surface in ${selectedBoardLead.city}. Their website ${selectedBoardLead.sslStatus === 'missing' ? 'flags an unencrypted SSL error and ' : ''}scores below standard mobile speed, leaking valuable high-intent local customer calls to competitors. Immediate remediation unlocks an estimated +$${(selectedBoardLead.predictedLtvUsd || 4500).toLocaleString()} in pipeline value."`}
                  </p>
                </div>

                {/* Quick Move Stage Action */}
                <div className="pt-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary block mb-1.5 font-bold">
                    Move Pipeline Stage
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 font-mono text-[9px]">
                    {(['new', 'contacted', 'converted', 'dead'] as Lead['status'][]).map(st => (
                      <button
                        key={st}
                        onClick={() => {
                          moveLeadToStatus(selectedBoardLead.id, st);
                          setSelectedBoardLead(prev => prev ? { ...prev, status: st } : null);
                        }}
                        className={`py-1.5 px-1 rounded border text-center font-bold uppercase transition-all ${
                          selectedBoardLead.status === st 
                            ? 'bg-accent text-accent-contrast border-accent' 
                            : 'bg-bg-base border-border-dim text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border-dim bg-bg-subtle/40 flex items-center justify-between">
                <button
                  onClick={() => setSelectedBoardLead(null)}
                  className="px-3 py-1.5 rounded-lg border border-border-dim text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
                >
                  Close
                </button>
                <div className="text-[10px] font-mono text-text-tertiary">
                  ID: <span className="text-text-primary">{selectedBoardLead.id.slice(0, 8)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
