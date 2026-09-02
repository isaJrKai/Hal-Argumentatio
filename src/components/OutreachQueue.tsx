import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Filter, 
  Layers, 
  Zap, 
  ArrowRight, 
  UserCheck, 
  Calendar, 
  Check, 
  X, 
  RefreshCw, 
  Share2, 
  MessageSquare,
  FileCheck,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Lead } from '../types';
import { useBusinessContext } from '../context/BusinessContext';

interface OutreachQueueProps {
  leads: Lead[];
  token: string;
  onRefresh: () => void;
}

export type OutreachStage = 'new' | 'contacted' | 'audit_sent' | 'meeting_booked' | 'contract_sent' | 'converted' | 'dead';

export interface BatchItem {
  lead: Lead;
  selectedChannel: 'email' | 'sms' | 'call';
  customSubject: string;
  customBody: string;
  stage: OutreachStage;
  scheduledFollowUpDays: number;
}

export default function OutreachQueue({ leads, token, onRefresh }: OutreachQueueProps) {
  const { workspaceConfig, activeIndustry, activeCity, activeNiche, regionalProfile } = useBusinessContext();
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [activeChannelFilter, setActiveChannelFilter] = useState<'all' | 'email' | 'sms' | 'call'>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Batch Execution State
  const [isExecutingBatch, setIsExecutingBatch] = useState(false);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);
  const [batchErrorMessage, setBatchErrorMessage] = useState<string | null>(null);

  // Template customizer state
  const [templateSubject, setTemplateSubject] = useState(
    'Actionable Speed & Revenue Leakage Audit for {{businessName}} ({{city}})'
  );
  const [templateBody, setTemplateBody] = useState(
    `Hi {{ownerName}},\n\nI conducted a preliminary diagnostic on {{businessName}}'s digital presence in {{city}} and identified immediate technical optimizations (Core Web Vitals acceleration & Google Map Pack visibility for ${activeIndustry.name}).\n\nGiven current ${regionalProfile.currentSeasonalFocus.toLowerCase()}, we prepared a live technical teardown showing how to capture high-intent ${activeNiche} inquiries before competitors.\n\nWould you have 5 minutes this week for a quick walkthrough?\n\nBest regards,\n${workspaceConfig.operatorName}\n${workspaceConfig.agencyName}`
  );
  const [targetFollowUpDays, setTargetFollowUpDays] = useState(3);
  const [autoAdvanceStatus, setAutoAdvanceStatus] = useState(true);

  // Quick preset loader
  const handleLoadRegionalAngle = () => {
    setTemplateSubject(`Seasonal Growth Audit: Capture High-Intent ${activeNiche.toUpperCase()} Inquiries in ${activeCity}`);
    setTemplateBody(
      `Hi {{ownerName}},\n\nOur system detected that {{businessName}} serves the ${activeCity} market. With ${regionalProfile.climateZone.toLowerCase()} seasonal load underway, homeowners are seeking verified ${activeNiche} specialists.\n\nOur audit revealed technical bottlenecks in mobile load times and local search ranking.\n\nMay I share a 1-page breakdown outlining the 3 fastest fixes to increase inbound calls?\n\nRegards,\n${workspaceConfig.operatorName}\n${workspaceConfig.agencyName}`
    );
  };

  // Quick inspect preview
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);

  // Filter leads for the queue
  const queueLeads = leads.filter(l => {
    const matchesSearch = !searchQuery || 
      l.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.serviceType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = activeStatusFilter === 'all' || l.status === activeStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === queueLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(queueLeads.map(l => l.id));
    }
  };

  const handleToggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Execute Batch Multi-Channel Dispatch
  const handleExecuteBatch = async (channel: 'email' | 'sms' | 'call') => {
    if (selectedLeadIds.length === 0) return;
    setIsExecutingBatch(true);
    setBatchSuccessMessage(null);
    setBatchErrorMessage(null);

    try {
      const res = await fetch('/api/dispatch/campaign-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          channel,
          leadIds: selectedLeadIds,
          template: {
            subject: templateSubject,
            body: templateBody
          }
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBatchSuccessMessage(`Transmitted ${channel.toUpperCase()} outreach to ${data.successfulCount || selectedLeadIds.length} target accounts.`);
        setSelectedLeadIds([]);
        onRefresh();
        setTimeout(() => setBatchSuccessMessage(null), 5000);
      } else {
        setBatchErrorMessage(data.error || 'Batch dispatch failed.');
      }
    } catch (err: any) {
      setBatchErrorMessage(err.message || 'Connection error during batch execution.');
    } finally {
      setIsExecutingBatch(false);
    }
  };

  // Follow-up Alert Calculation
  const staleContactedLeads = leads.filter(l => {
    if (l.status !== 'contacted') return false;
    const updated = new Date(l.updatedAt).getTime();
    const daysSince = (Date.now() - updated) / (1000 * 60 * 60 * 24);
    return daysSince >= 2;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER & OVERVIEW */}
      <div className="border-b border-border-dim/60 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold tracking-widest text-brand uppercase bg-brand/10 px-2 py-0.5 rounded">
              Phase 3: Active Operations
            </span>
            <span className="w-1 h-1 rounded-full bg-text-tertiary" />
            <span className="text-[10px] font-mono text-text-secondary">BATCH OUTREACH & TOUCHPOINT QUEUE</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary mt-1">Active Outreach & Cadence Control</h2>
          <p className="text-xs text-text-secondary max-w-2xl mt-0.5">
            Stage, personalize, and trigger batch multi-channel touches across prospects. Auto-advance pipeline stages and monitor cadence health.
          </p>
        </div>

        {/* METRICS CHIPS */}
        <div className="flex items-center gap-2 font-mono text-xs shrink-0 flex-wrap">
          <div className="px-3 py-1.5 rounded-sm bg-bg-raised border border-border-dim">
            <span className="text-[9px] text-text-secondary uppercase block">Queue Target</span>
            <span className="text-sm font-bold text-text-primary">{queueLeads.length} Leads</span>
          </div>
          <div className="px-3 py-1.5 rounded-sm bg-bg-raised border border-border-dim">
            <span className="text-[9px] text-text-secondary uppercase block">Selected</span>
            <span className="text-sm font-bold text-brand">{selectedLeadIds.length} Selected</span>
          </div>
          {staleContactedLeads.length > 0 && (
            <div className="px-3 py-1.5 rounded-sm bg-warning/10 border border-warning/30 text-warning flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <div>
                <span className="text-[9px] uppercase block font-bold">Follow-Up Alert</span>
                <span className="text-xs font-bold">{staleContactedLeads.length} Due for Touch 2</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ALERT BANNERS */}
      {batchSuccessMessage && (
        <div className="p-3 bg-positive/10 border border-positive/30 rounded-sm text-positive text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{batchSuccessMessage}</span>
          </div>
          <button onClick={() => setBatchSuccessMessage(null)} className="text-text-secondary hover:text-text-primary">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {batchErrorMessage && (
        <div className="p-3 bg-negative/10 border border-negative/30 rounded-sm text-negative text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{batchErrorMessage}</span>
          </div>
          <button onClick={() => setBatchErrorMessage(null)} className="text-text-secondary hover:text-text-primary">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* DUAL WORKSPACE: TEMPLATE COMPOSER (LEFT) & QUEUE TABLE (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TEMPLATE CUSTOMIZER & EXECUTION DOCK (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-bg-raised border border-border-dim rounded-sm p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border-dim/60 pb-2">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-text-primary uppercase">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                <span>Message Personalizer</span>
              </div>
              <span className="text-[10px] font-mono text-text-dim">HAL Smart Variables</span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-text-secondary uppercase font-bold">Email / Message Subject</label>
              <input
                type="text"
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                className="w-full bg-bg-dark border border-border-dim rounded-sm p-2 text-xs font-mono text-text-primary focus:border-brand outline-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-text-secondary uppercase font-bold">Outreach Pitch Body</label>
                <button
                  type="button"
                  onClick={handleLoadRegionalAngle}
                  className="text-[9.5px] font-mono text-brand hover:underline font-bold uppercase cursor-pointer"
                >
                  Load {activeCity} Angle
                </button>
              </div>
              <textarea
                rows={7}
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                className="w-full bg-bg-dark border border-border-dim rounded-sm p-2 text-xs font-mono text-text-primary focus:border-brand outline-none resize-none leading-relaxed"
              />
              <div className="flex flex-wrap gap-1 pt-1 text-[9px] font-mono text-text-dim">
                <span>Variables:</span>
                <code className="bg-bg-dark px-1 rounded text-brand">{'{{businessName}}'}</code>
                <code className="bg-bg-dark px-1 rounded text-brand">{'{{ownerName}}'}</code>
                <code className="bg-bg-dark px-1 rounded text-brand">{'{{city}}'}</code>
                <code className="bg-bg-dark px-1 rounded text-brand">{'{{serviceType}}'}</code>
              </div>
            </div>

            {/* BATCH ACTION TRIGGER BUTTONS */}
            <div className="pt-3 border-t border-border-dim/60 space-y-2">
              <span className="text-[10px] font-mono text-text-secondary uppercase font-bold block">
                Execute Batch Transmit ({selectedLeadIds.length} Selected)
              </span>

              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <button
                  disabled={selectedLeadIds.length === 0 || isExecutingBatch}
                  onClick={() => handleExecuteBatch('email')}
                  className="p-2 bg-brand text-black hover:bg-brand-dim disabled:opacity-30 rounded-sm font-bold uppercase flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-[10px]">BATCH EMAIL</span>
                </button>

                <button
                  disabled={selectedLeadIds.length === 0 || isExecutingBatch}
                  onClick={() => handleExecuteBatch('sms')}
                  className="p-2 bg-positive text-black hover:bg-positive/80 disabled:opacity-30 rounded-sm font-bold uppercase flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-[10px]">BATCH SMS</span>
                </button>

                <button
                  disabled={selectedLeadIds.length === 0 || isExecutingBatch}
                  onClick={() => handleExecuteBatch('call')}
                  className="p-2 bg-bg-dark border border-border-dim hover:border-brand text-text-primary disabled:opacity-30 rounded-sm font-bold uppercase flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-text-secondary" />
                  <span className="text-[10px]">CALL LOG</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* QUEUE TABLE & STAGE PROGRESSION (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* SEARCH & FILTERS */}
          <div className="bg-bg-raised border border-border-dim rounded-sm p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by business name, city, or niche..."
                className="w-full bg-bg-dark border border-border-dim rounded-sm px-2.5 py-1.5 text-xs font-mono text-text-primary focus:border-brand outline-none"
              />
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <select
                value={activeStatusFilter}
                onChange={(e) => setActiveStatusFilter(e.target.value)}
                className="bg-bg-dark border border-border-dim rounded-sm px-2.5 py-1.5 text-text-primary outline-none text-xs"
              >
                <option value="all">ALL STAGES</option>
                <option value="new">NEW (UNTOUCHED)</option>
                <option value="contacted">CONTACTED</option>
                <option value="converted">CONVERTED</option>
                <option value="dead">DEAD</option>
              </select>

              <button
                onClick={handleToggleSelectAll}
                className="px-2.5 py-1.5 bg-bg-dark border border-border-dim hover:border-brand/40 text-text-primary rounded-sm font-bold text-[10px] uppercase"
              >
                {selectedLeadIds.length === queueLeads.length ? 'DESELECT ALL' : 'SELECT ALL'}
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-bg-raised border border-border-dim rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-bg-subtle border-b border-border-dim text-[10px] text-text-secondary uppercase">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={queueLeads.length > 0 && selectedLeadIds.length === queueLeads.length}
                        onChange={handleToggleSelectAll}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Business Prospect</th>
                    <th className="p-3">Location & Niche</th>
                    <th className="p-3">Urgency & Tech Score</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim/60">
                  {queueLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-text-dim text-xs">
                        No prospects match current filters. Adjust search query or add new leads from Conquest Map.
                      </td>
                    </tr>
                  ) : (
                    queueLeads.map((lead) => {
                      const isSelected = selectedLeadIds.includes(lead.id);
                      return (
                        <tr 
                          key={lead.id}
                          className={`hover:bg-bg-subtle/50 transition-colors ${isSelected ? 'bg-brand/5' : ''}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectLead(lead.id)}
                              className="cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-text-primary">{lead.businessName}</div>
                            <div className="text-[10px] text-text-dim">{lead.email || lead.phone || 'Contact on file'}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-text-secondary">{lead.city}</div>
                            <div className="text-[10px] text-text-dim uppercase">{lead.serviceType}</div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-brand">{lead.urgencyScore || 7.5}</span>
                              <span className="text-[10px] text-text-dim">
                                Speed: <strong className={lead.performanceScore && lead.performanceScore > 60 ? 'text-positive' : 'text-warning'}>{lead.performanceScore || 52}/100</strong>
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`text-[9px] px-2 py-0.5 rounded-sm font-bold uppercase ${
                              lead.status === 'converted' ? 'bg-positive/15 text-positive border border-positive/30' :
                              lead.status === 'contacted' ? 'bg-brand/15 text-brand border border-brand/30' :
                              lead.status === 'dead' ? 'bg-negative/15 text-negative border border-negative/30' :
                              'bg-bg-dark text-text-secondary border border-border-dim'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                handleToggleSelectLead(lead.id);
                              }}
                              className="px-2 py-1 bg-bg-dark hover:bg-bg-subtle border border-border-dim text-[10px] text-text-primary rounded-sm font-bold uppercase transition-colors"
                            >
                              {isSelected ? 'QUEUED' : 'QUEUE'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
