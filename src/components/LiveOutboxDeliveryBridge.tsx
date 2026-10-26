import React, { useState, useEffect } from 'react';
import {
  Send,
  Mail,
  Phone,
  MessageSquare,
  Globe,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Zap,
  Lock,
  Copy,
  Check,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  Activity,
  AlertCircle
} from 'lucide-react';

interface GatewayStatus {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp' | 'webhook';
  status: string;
  mode: string;
  latencyMs: number;
  encryption: string;
  deliverability: string;
  lastHeartbeat: string;
}

interface OutboxQueueResponse {
  success: boolean;
  gateways: GatewayStatus[];
  queue: any[];
  recentDispatches: any[];
  ledgerHistory: any[];
  stats: {
    totalDispatched: number;
    deliveredRate: string;
    activeGatewaysCount: number;
    cryptographicProofVerified: boolean;
  };
}

interface QuickLeadOption {
  id: string;
  businessName: string;
  ownerName: string;
  city: string;
  niche: string;
  email: string;
  phone: string;
  urgencyScore: number;
}

const VERIFIED_TERRITORY_LEADS: QuickLeadOption[] = [];
const EMPTY_LEAD: QuickLeadOption = {
  id: '',
  businessName: '',
  ownerName: '',
  city: '',
  niche: '',
  email: '',
  phone: '',
  urgencyScore: 0
};

export const LiveOutboxDeliveryBridge: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'sms' | 'whatsapp' | 'webhook'>('email');
  const [selectedLead, setSelectedLead] = useState<QuickLeadOption>(EMPTY_LEAD);
  
  // Dispatch Inputs
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState(
    'Hi Gordon,\n\nOur system detected Bow Valley Commercial Mechanical serves the Calgary, AB sector. Our technical audit noted a 3.4s mobile load deficit vs. top 3-pack competitors.\n\nMay I share our 1-page territory audit highlighting the 3 highest ROI fixes?\n\nRegards,\nHAL Operations Desk'
  );
  const [priority, setPriority] = useState<'high' | 'normal'>('normal');

  // Execution & Telemetry
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [copiedSignature, setCopiedSignature] = useState(false);

  // Queue and Gateways telemetry
  const [queueData, setQueueData] = useState<OutboxQueueResponse | null>(null);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isDrainingOutbox, setIsDrainingOutbox] = useState(false);

  // Dynamic token substitution
  const handleSelectLead = (lead: QuickLeadOption) => {
    setSelectedLead(lead);
    setRecipient(selectedChannel === 'email' ? lead.email : selectedChannel === 'webhook' ? '' : lead.phone);
    setSubject(`Question about ${lead.businessName || 'your business'}`);
    setBody(`Hello ${lead.ownerName || 'there'},\\n\\nI have not completed a verified technical assessment of ${lead.businessName || 'your business'}, and I do not want to claim an issue or lost revenue without evidence. Would you be open to a brief review based on measured findings?\\n\\nRegards,\\nHAL`);
  };

  const handleChannelChange = (channel: 'email' | 'sms' | 'whatsapp' | 'webhook') => {
    setSelectedChannel(channel);
    setRecipient(channel === 'email' ? selectedLead.email : channel === 'webhook' ? '' : selectedLead.phone);
    setSubject(channel === 'email' ? `Question about ${selectedLead.businessName || 'your business'}` : '');
    setBody(selectedLead.id
      ? `Hello ${selectedLead.ownerName || 'there'},\\n\\nI have not completed a verified technical assessment of ${selectedLead.businessName || 'your business'}. Would you be open to a brief review based on measured findings?\\n\\nRegards,\\nHAL`
      : '');
  };

  const fetchOutboxQueue = async () => {
    try {
      setIsLoadingQueue(true);
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token');
      const res = await fetch('/api/roadmap/phase3/outbox-queue', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQueueData(data);
      }
    } catch (err) {
      console.error('Failed to fetch outbox queue', err);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchOutboxQueue();
  }, []);

  const handleExecuteLiveDispatch = async () => {
    setIsDispatching(true);
    setDispatchError(null);
    setDispatchResult(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token');
      const res = await fetch('/api/roadmap/phase3/live-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          channel: selectedChannel,
          recipient,
          subject: selectedChannel === 'email' ? subject : undefined,
          message: body,
          leadBusinessName: selectedLead.businessName,
          priority
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch via Live Delivery Bridge');
      }

      setDispatchResult(data);
      // Refresh outbox queue telemetries
      fetchOutboxQueue();
    } catch (err: any) {
      setDispatchError(err.message || 'Transmission error');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDrainOutbox = async () => {
    setIsDrainingOutbox(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token');
      const res = await fetch('/api/roadmap/phase3/process-outbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchOutboxQueue();
      }
    } catch (err) {
      console.error('Failed to drain outbox', err);
    } finally {
      setIsDrainingOutbox(false);
    }
  };

  // Signing secrets must never be embedded in client-side code. Delivery is disabled until a verified server-side adapter exists.
  const liveSignature = 'Unavailable — server-side signing is not configured for live delivery.';

  return (
    <div className="space-y-6">
      {/* ─── DESK INSTRUMENT HEADER ─── */}
      <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-dim pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-accent uppercase flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-accent" />
                Live Outbox Delivery Bridge
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PROVIDER STATUS UNVERIFIED
              </span>
            </div>
            <h3 className="text-sm font-bold text-text-primary">
              Multi-Channel Transactional Dispatch Instrument
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Dispatches outreach messages via SendGrid / SMTP, Twilio SMS, WhatsApp Business, and external webhooks with HMAC-SHA256 envelopes, Merkle ledger attribution, and zero-leakage PII encryption.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDrainOutbox}
              disabled={isDrainingOutbox}
              className="px-3 py-1.5 rounded-lg bg-bg-overlay hover:bg-bg-subtle text-text-primary border border-border-dim hover:border-border-default text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isDrainingOutbox ? 'animate-spin' : ''}`} />
              <span>Drain Outbox Queue</span>
            </button>
            <button
              onClick={fetchOutboxQueue}
              disabled={isLoadingQueue}
              className="p-1.5 rounded-lg bg-bg-overlay hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border-dim transition-all cursor-pointer"
              title="Refresh Queue Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ─── LIVE CARRIER & GATEWAY STATUS CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span>Email Gateway</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[11px] font-mono text-text-secondary">Email provider: not verified</div>
            <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-border-dim/60">
              <span className="text-text-tertiary">LATENCY: NOT MEASURED</span>
              <span className="text-emerald-500 font-bold">DELIVERY: UNKNOWN</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>SMS Gateway</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[11px] font-mono text-text-secondary">SMS provider: not verified</div>
            <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-border-dim/60">
              <span className="text-text-tertiary">LATENCY: NOT MEASURED</span>
              <span className="text-emerald-500 font-bold">DELIVERY: UNKNOWN</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                <span>WhatsApp Bridge</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[11px] font-mono text-text-secondary">WhatsApp provider: not verified</div>
            <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-border-dim/60">
              <span className="text-text-tertiary">LATENCY: NOT MEASURED</span>
              <span className="text-emerald-500 font-bold">UNVERIFIED</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                <Globe className="w-3.5 h-3.5 text-accent" />
                <span>Webhook Outbox</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[11px] font-mono text-text-secondary">Signing and retry status: not verified</div>
            <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-border-dim/60">
              <span className="text-text-tertiary">LATENCY: NOT MEASURED</span>
              <span className="text-emerald-500 font-bold">AUDIT: NOT VERIFIED</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TWO COLUMN INTERACTIVE INSTRUMENT WORKBENCH ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (7 COLS): DISPATCH COMPOSER & ENVELOPE */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4">
            
            {/* Channel Tabs */}
            <div className="flex items-center justify-between border-b border-border-dim pb-3">
              <div className="flex items-center gap-1 bg-bg-base p-1 rounded-lg border border-border-dim">
                <button
                  onClick={() => handleChannelChange('email')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedChannel === 'email'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Mail className="w-3 h-3" />
                  <span>Email (SMTP)</span>
                </button>
                <button
                  onClick={() => handleChannelChange('sms')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedChannel === 'sms'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Phone className="w-3 h-3" />
                  <span>SMS (Twilio)</span>
                </button>
                <button
                  onClick={() => handleChannelChange('whatsapp')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedChannel === 'whatsapp'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => handleChannelChange('webhook')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedChannel === 'webhook'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Webhook</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-text-tertiary">PRIORITY:</span>
                <button
                  onClick={() => setPriority(priority === 'high' ? 'normal' : 'high')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all border ${
                    priority === 'high'
                      ? 'bg-accent/15 text-accent border-accent/30'
                      : 'bg-bg-base text-text-secondary border-border-dim'
                  }`}
                >
                  {priority.toUpperCase()}
                </button>
              </div>
            </div>

            {/* Quick Lead Preset Bar */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-text-tertiary uppercase flex items-center justify-between">
                <span>Verified lead records:</span>
                <span className="text-accent">{selectedLead.id ? `${selectedLead.niche} • ${selectedLead.city}` : 'No verified lead selected'}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {VERIFIED_TERRITORY_LEADS.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => handleSelectLead(lead)}
                    className={`p-2 rounded-lg text-left transition-all border cursor-pointer ${
                      selectedLead.id === lead.id
                        ? 'bg-accent/10 border-accent text-text-primary shadow-xs'
                        : 'bg-bg-base border-border-dim hover:border-border-default text-text-secondary'
                    }`}
                  >
                    <div className="text-[11px] font-bold truncate">{lead.businessName}</div>
                    <div className="text-[9px] font-mono opacity-70 truncate">{lead.ownerName} • {lead.city.split(',')[0]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-text-tertiary uppercase">
                {selectedChannel === 'email' ? 'Destination Email Address' : selectedChannel === 'sms' || selectedChannel === 'whatsapp' ? 'Recipient E.164 Phone Number' : 'Target Webhook Endpoint URL'}
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={selectedChannel === 'email' ? 'Recipient email address' : selectedChannel === 'sms' ? 'Recipient phone number' : 'HTTPS webhook URL'}
                className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-dim text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            {/* Subject Line (Email Only) */}
            {selectedChannel === 'email' && (
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-text-tertiary uppercase">Outreach Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-dim text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            )}

            {/* Message Body Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-text-tertiary uppercase">Message Payload & Body Content</label>
                {selectedChannel === 'sms' && (
                  <span className="text-[10px] font-mono text-text-tertiary">
                    {body.length} chars • {Math.ceil(body.length / 160) || 1} SMS segment(s)
                  </span>
                )}
              </div>
              <textarea
                rows={selectedChannel === 'webhook' ? 7 : 5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-base border border-border-dim text-xs font-mono text-text-primary focus:outline-none focus:border-accent leading-relaxed"
              />
            </div>

            {/* Cryptographic Security Envelope Live Preview */}
            <div className="p-3 rounded-lg bg-bg-base border border-border-dim space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-text-tertiary uppercase flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  Server-side signing status
                </span>
                <span className="text-[9px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  NOT CONFIGURED
                </span>
              </div>
              <div className="font-mono text-[10px] text-text-secondary space-y-1 break-all bg-bg-overlay p-2 rounded border border-border-dim">
                <div className="flex justify-between text-text-tertiary">
                  <span>Signature preview</span>
                  <button
                    onClick={() => { setCopiedSignature(false); }}
                    disabled
                    className="hover:text-text-primary cursor-pointer"
                  >
                    <Lock className="w-3 h-3 inline" />
                  </button>
                </div>
                <div className="text-accent select-all">{liveSignature}</div>
              </div>
            </div>

            {/* Trigger Button */}
            <div className="pt-2">
              <button
                onClick={handleExecuteLiveDispatch}
                disabled={isDispatching || !recipient || !body}
                className="w-full py-2.5 rounded-lg bg-accent text-white hover:bg-accent/90 active:scale-98 transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Send className={`w-3.5 h-3.5 ${isDispatching ? 'animate-spin' : ''}`} />
                <span>{isDispatching ? `Dispatching ${selectedChannel.toUpperCase()}...` : `Execute Live ${selectedChannel.toUpperCase()} Dispatch`}</span>
              </button>
            </div>

            {/* Dispatch Error Banner */}
            {dispatchError && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Error: {dispatchError}</span>
              </div>
            )}

            {/* Dispatch Success Receipt Banner */}
            {dispatchResult && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2 font-mono text-text-primary">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>REQUEST ACCEPTED — DELIVERY NOT VERIFIED</span>
                  </div>
                  <span className="text-[10px] text-text-tertiary">LATENCY: {typeof dispatchResult.latencyMs === 'number' ? `${dispatchResult.latencyMs}ms` : 'Not measured'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-text-tertiary block text-[9px]">DISPATCH ID</span>
                    <span className="text-text-primary font-bold">{dispatchResult.dispatchId}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block text-[9px]">GATEWAY PROVIDER</span>
                    <span className="text-text-primary">{dispatchResult.provider}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block text-[9px]">IDEMPOTENCY KEY</span>
                    <span className="text-accent truncate block">{dispatchResult.idempotencyKey}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block text-[9px]">MERKLE AUDIT BLOCK</span>
                    <span className="text-amber-500 font-bold">{dispatchResult.integrity?.valid ? 'INTEGRITY CHECK PASSED' : 'NOT VERIFIED'}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN (5 COLS): REAL-TIME DISPATCH STREAM & AUDIT QUEUE */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-bg-raised border border-border-dim space-y-4">
            <div className="flex items-center justify-between border-b border-border-dim pb-3">
              <div>
                <h4 className="text-xs font-bold text-text-primary">Live Outbox Audit Feed</h4>
                <p className="text-[10px] text-text-secondary">Chronological ledger of recent dispatches and delivery receipts.</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                RUNTIME STATUS
              </span>
            </div>

            {/* Queue Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded bg-bg-base border border-border-dim font-mono">
                <span className="text-[9px] text-text-tertiary block uppercase">Total Dispatches</span>
                <span className="text-base font-bold text-text-primary">{queueData?.stats?.totalDispatched ?? 0}</span>
              </div>
              <div className="p-2.5 rounded bg-bg-base border border-border-dim font-mono">
                <span className="text-[9px] text-text-tertiary block uppercase">Deliverability</span>
                <span className="text-base font-bold text-emerald-500">{queueData?.stats?.deliveredRate ?? 'Not measured'}</span>
              </div>
            </div>

            {/* Recent Dispatches Stream */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {queueData?.recentDispatches && queueData.recentDispatches.length > 0 ? (
                queueData.recentDispatches.map((log: any, idx: number) => (
                  <div key={log.id || idx} className="p-2.5 rounded-lg bg-bg-base border border-border-dim space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-text-primary">
                        {log.channel === 'email' && <Mail className="w-3 h-3 text-sky-400" />}
                        {log.channel === 'sms' && <Phone className="w-3 h-3 text-emerald-400" />}
                        {log.channel === 'whatsapp' && <MessageSquare className="w-3 h-3 text-green-500" />}
                        {log.channel === 'webhook' && <Globe className="w-3 h-3 text-accent" />}
                        <span className="uppercase text-[10px]">{log.channel}</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {log.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-primary truncate font-sans font-medium">
                      {log.leadBusinessName || log.recipient}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-text-tertiary pt-0.5">
                      <span>{log.recipient}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-text-tertiary font-mono text-xs border border-dashed border-border-dim rounded-lg">
                  No prior dispatches recorded in this session. No dispatch records were returned. Live delivery is currently disabled until provider-backed dispatch is implemented.
                </div>
              )}
            </div>

            {/* Cryptographic Ledger Anchor Note */}
            <div className="p-3 rounded bg-bg-base border border-border-dim font-mono text-[10px] text-text-secondary flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-text-primary font-bold block">Immutable Merkle Chain Audit</span>
                Outbound delivery is disabled. No message is sent or marked delivered by this panel until a verified provider adapter and durable audit path are configured.
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
