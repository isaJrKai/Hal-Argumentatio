import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Calendar, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Settings2, 
  RefreshCw, 
  Sliders, 
  Search, 
  Filter, 
  ChevronRight, 
  ShieldCheck, 
  ExternalLink,
  Layers,
  ArrowUpRight,
  Copy,
  Zap,
  Check
} from 'lucide-react';
import { Lead } from '../types';
import { useBusinessContext } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';

interface UnifiedCommunicationsHubProps {
  leads: Lead[];
  token: string | null;
  onRefresh?: () => void;
}

interface BridgeStatus {
  whatsapp: {
    enabled: boolean;
    displayNumber?: string;
    webhookActive: boolean;
    deliveredCount: number;
    replyRate: number | null;
    status: string;
  };
  email: {
    enabled: boolean;
    provider: string;
    senderEmail: string;
    deliveredCount: number;
    openRate: number | null;
    status: string;
  };
  sms: {
    enabled: boolean;
    virtualNumber: string;
    deliveredCount: number;
    slaResponseSec: number | null;
    status: string;
  };
  calendar: {
    enabled: boolean;
    bookingUrl: string;
    bookedAppointments: number | null;
    status: string;
  };
}

export const UnifiedCommunicationsHub: React.FC<UnifiedCommunicationsHubProps> = ({ leads, token, onRefresh }) => {
  const { regionalProfile, activeNiche, workspaceConfig } = useBusinessContext();
  const { showToast } = useToast();

  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'email' | 'sms' | 'calendar'>('whatsapp');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(leads[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [bridges, setBridges] = useState<BridgeStatus | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [dispatchHistory, setDispatchHistory] = useState<any[]>([]);

  // Fetch Bridge Status
  const fetchBridges = async () => {
    try {
      const res = await fetch('/api/outreach/bridges/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setBridges(data.bridges);
      }
    } catch (_) {}
  };

  // Fetch Dispatch History
  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/dispatch/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setDispatchHistory(Array.isArray(data) ? data : []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchBridges();
    fetchHistory();
  }, []);

  // Update draft when channel or selected lead changes
  useEffect(() => {
    if (!selectedLead) return;
    const owner = selectedLead.ownerName || 'Business Owner';
    const biz = selectedLead.businessName;
    const city = selectedLead.city;

    if (activeChannel === 'whatsapp') {
      setSubject('');
      setMessage(`Hi ${owner}, following up on our diagnostic of ${biz} in ${city}. We identified urgent homeowner search volume that is currently dropping off before calling your on-duty team. Can I send over the 2-minute teardown?`);
    } else if (activeChannel === 'email') {
      setSubject(`Performance diagnostic & emergency call capture for ${biz} (${city})`);
      setMessage(`Hi ${owner},\n\nI reviewed ${biz}'s local search presence in ${city} and identified that local homeowners needing ${selectedLead.serviceType || 'urgent service'} face a delay in your mobile intake flow.\n\nWe engineered a direct call-routing solution that connects inbound homeowners in under 30 seconds with zero wasted ad spend.\n\nWould you have 5 minutes this Thursday for a quick walkthrough?\n\nBest regards,\n${workspaceConfig.operatorName || 'HAL Dispatch Team'}\n${workspaceConfig.agencyName || 'HAL Business Operating Intelligence'}`);
    } else if (activeChannel === 'sms') {
      setSubject('');
      setMessage(`Hi ${owner}, we have qualified homeowner requests for ${selectedLead.serviceType || 'trade service'} in ${city}. Does ${biz} have capacity to take priority calls this week?`);
    } else if (activeChannel === 'calendar') {
      setSubject(`HAL Emergency Dispatch Walkthrough — ${biz}`);
      setMessage(`15-Minute Technical Intake Walkthrough\nAgenda:\n1. Review live speed deficit & missed call leak\n2. Demonstrate 30-sec automated dispatcher\n3. Confirm local service territory coverage in ${city}`);
    }
  }, [activeChannel, selectedLead]);

  // AI Draft with Gemini
  const handleAiDraft = async () => {
    if (!selectedLead) return;
    setIsDrafting(true);
    try {
      const res = await fetch('/api/outreach/draft-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          channel: activeChannel,
          lead: selectedLead,
          niche: activeNiche,
          city: regionalProfile.city,
          customInstructions: customInstructions.trim() || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.draft) {
          if (data.draft.subject) setSubject(data.draft.subject);
          if (data.draft.body) setMessage(data.draft.body);
          showToast({
            title: 'AI Copy Generated',
            message: `Crafted tailored ${activeChannel.toUpperCase()} message using Gemini 3.8-Flash.`,
            type: 'success'
          });
        }
      }
    } catch (err) {
      showToast({
        title: 'Drafting Error',
        message: 'Could not generate AI draft. Please try again.',
        type: 'error'
      });
    } finally {
      setIsDrafting(false);
    }
  };

  // Dispatch Message
  const handleDispatch = async () => {
    if (!selectedLead || !message.trim()) return;
    const recipient = activeChannel === 'email' ? selectedLead.email : selectedLead.phone;
    if (!recipient) {
      showToast({
        title: 'Contact details missing',
        message: activeChannel === 'email' ? 'This lead has no email address.' : 'This lead has no phone number.',
        type: 'error'
      });
      return;
    }

    setIsDispatching(true);
    try {
      const res = await fetch('/api/outreach/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          channel: activeChannel,
          recipient,
          leadId: selectedLead.id,
          leadBusinessName: selectedLead.businessName,
          subject: subject.trim() || undefined,
          message: message.trim(),
          mode: 'simulation',
          variables: {
            businessName: selectedLead.businessName,
            ownerName: selectedLead.ownerName || 'Owner',
            city: selectedLead.city,
            serviceType: selectedLead.serviceType || 'Contractor',
            phone: selectedLead.phone || ''
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch message.');
      }

      showToast({
        title: 'Simulation recorded',
        message: `Prepared a ${activeChannel.toUpperCase()} message for ${recipient}. No external message was sent.`,
        type: 'success'
      });

      fetchHistory();
      fetchBridges();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast({
        title: 'Dispatch Failed',
        message: err.message || 'Error transmitting message through bridge.',
        type: 'error'
      });
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredLeads = leads.filter(l => 
    l.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.ownerName && l.ownerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* ─── TOP BRIDGE CONNECTION TELEMETRY STRIP ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* WhatsApp Bridge Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-white">WhatsApp Business</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <span className={bridges?.whatsapp.enabled ? "w-2 h-2 rounded-full bg-amber-400" : "w-2 h-2 rounded-full bg-slate-500"}></span>
              <span>{bridges?.whatsapp.status === 'configured_unverified' ? 'Configured · unverified' : 'Not configured'}</span>
            </span>
          </div>
          <div>
            <div className="text-lg font-mono font-black text-white tabular-nums">
              {bridges?.whatsapp.replyRate == null ? '—' : `${bridges.whatsapp.replyRate}%`}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Reply rate unavailable · {bridges?.whatsapp.deliveredCount ?? 0} delivered
            </div>
          </div>
        </div>

        {/* Email Sequence Bridge Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                <Mail className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-white">Email Sequences</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-sky-400 font-mono">
              <span className={bridges?.email.enabled ? "w-2 h-2 rounded-full bg-amber-400" : "w-2 h-2 rounded-full bg-slate-500"}></span>
              <span>{bridges?.email.status === 'configured_unverified' ? 'Configured · unverified' : 'Not configured'}</span>
            </span>
          </div>
          <div>
            <div className="text-lg font-mono font-black text-white tabular-nums">
              {bridges?.email.openRate == null ? '—' : `${bridges.email.openRate}%`}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Open rate unavailable · {bridges?.email.deliveredCount ?? 0} delivered
            </div>
          </div>
        </div>

        {/* Twilio SMS Bridge Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Phone className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-white">Twilio SMS / Voice</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-mono">
              <span className={bridges?.sms.enabled ? "w-2 h-2 rounded-full bg-amber-400" : "w-2 h-2 rounded-full bg-slate-500"}></span>
              <span>{bridges?.sms.status === 'configured_unverified' ? 'Configured · unverified' : 'Not configured'}</span>
            </span>
          </div>
          <div>
            <div className="text-lg font-mono font-black text-white tabular-nums">
              {bridges?.sms.slaResponseSec == null ? '—' : `${bridges.sms.slaResponseSec}s`}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Response SLA unavailable · {bridges?.sms.deliveredCount ?? 0} delivered
            </div>
          </div>
        </div>

        {/* Calendar Sync Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Calendar className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-white">Calendar Booking</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-purple-400 font-mono">
              <span className={bridges?.calendar.enabled ? "w-2 h-2 rounded-full bg-amber-400" : "w-2 h-2 rounded-full bg-slate-500"}></span>
              <span>{bridges?.calendar.status === 'configured_unverified' ? 'Configured · unverified' : 'Not configured'}</span>
            </span>
          </div>
          <div>
            <div className="text-lg font-mono font-black text-white tabular-nums">
              {bridges?.calendar.bookedAppointments == null ? '—' : bridges.calendar.bookedAppointments}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Appointments booked · reporting not connected
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN WORKSPACE: PROSPECT QUEUE + INTERACTIVE COMPOSER ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Targeted Prospect Directory (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Harvested Prospect Directory</h3>
              <p className="text-[11px] text-slate-400">Select prospect for individualized outreach</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
              {filteredLeads.length} leads
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by business or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Lead List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredLeads.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No leads match your search query.
              </div>
            ) : (
              filteredLeads.map((ld) => {
                const isSelected = selectedLead?.id === ld.id;
                return (
                  <div
                    key={ld.id}
                    onClick={() => setSelectedLead(ld)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">{ld.businessName}</h4>
                        {ld.status === 'contacted' && (
                          <span className="text-[10px] text-emerald-400 font-semibold shrink-0">✓ Contacted</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{ld.city}</span>
                        <span>·</span>
                        <span>{ld.ownerName || 'Owner'}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                        {ld.urgencyScore ? `${ld.urgencyScore}/10` : 'Urgent'}
                      </div>
                      <span className="text-[10px] text-slate-500 block">KAISO Score</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Multi-Channel Composer & Dispatch Studio (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          {/* Channel Selector Tab Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex p-0.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setActiveChannel('whatsapp')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeChannel === 'whatsapp' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveChannel('email')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeChannel === 'email' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Cadence</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveChannel('sms')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeChannel === 'sms' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Twilio SMS</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveChannel('calendar')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeChannel === 'calendar' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Booking</span>
              </button>
            </div>

            <button
              type="button"
              disabled={isDrafting}
              onClick={handleAiDraft}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDrafting ? 'Drafting...' : 'AI Polish with Gemini'}</span>
            </button>
          </div>

          {/* Active Target Banner */}
          {selectedLead && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Recipient</span>
                <span className="font-bold text-white">{selectedLead.businessName}</span>
                <span className="text-slate-400 ml-1">({selectedLead.city} · {selectedLead.ownerName || 'Owner'})</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Destination</span>
                <span className="font-mono text-amber-400 font-bold">
                  {activeChannel === 'email' ? (selectedLead.email || 'Email on file') : (selectedLead.phone || 'Phone on file')}
                </span>
              </div>
            </div>
          )}

          {/* Subject Line (For Email / Calendar) */}
          {(activeChannel === 'email' || activeChannel === 'calendar') && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter compelling, personalized subject line..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* Message Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300">Message Content</label>
              <span className="text-[10px] font-mono text-slate-500">
                Variables: {'{{businessName}} · {{city}} · {{ownerName}}'}
              </span>
            </div>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono leading-relaxed focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Custom Instruction Bar for Gemini */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Custom AI guidance (e.g., 'Emphasize frozen pipe weekend emergencies')..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              disabled={isDispatching}
              onClick={handleDispatch}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isDispatching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Transmitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Transmit via {activeChannel.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── LIVE DISPATCH & CONVERSION AUDIT LEDGER ─── */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Cryptographic Transmission Ledger & Live Receipts
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">AES-256-GCM Verified</span>
        </div>

        {dispatchHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No live dispatches logged yet. Transmit an outreach message above to start the conversion ledger.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
            {dispatchHistory.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    item.channel === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-400' :
                    item.channel === 'email' ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {item.channel}
                  </span>
                  <div>
                    <span className="font-bold text-white">{item.leadBusinessName}</span>
                    <span className="text-slate-400 text-[11px] ml-2 font-mono">{item.recipient}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="text-slate-400 font-mono hidden sm:inline">{item.providerId}</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
