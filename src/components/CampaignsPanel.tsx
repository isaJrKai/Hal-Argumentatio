import { useState, useEffect } from 'react';
import { Campaign, PerformanceSnapshot, Lead } from '../types';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Star, 
  Sparkles, 
  Loader2,
  Send,
  Mail,
  Phone,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Zap,
  RefreshCw,
  Copy,
  Check,
  ListOrdered,
  Gauge
} from 'lucide-react';
import OutreachQueue from './OutreachQueue';

interface CampaignsPanelProps {
  campaigns: Campaign[];
  leads?: Lead[];
  token: string;
  onRefresh?: () => void;
}

export default function CampaignsPanel({ campaigns, leads = [], token, onRefresh }: CampaignsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'performance' | 'dispatcher'>('queue');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [snapshots, setSnapshots] = useState<PerformanceSnapshot[]>([]);
  
  // Campaign Compare Tool state
  const [camp1Id, setCamp1Id] = useState('');
  const [camp2Id, setCamp2Id] = useState('');
  const [compareData, setCompareData] = useState<any | null>(null);
  const [comparing, setCompareLoading] = useState(false);

  // Multichannel Dispatcher state
  const [dispatchChannel, setDispatchChannel] = useState<'sms' | 'email' | 'webhook'>('email');
  const [gatewayStatus, setGatewayStatus] = useState<any | null>(null);
  const [emailSubject, setEmailSubject] = useState('Exclusive Local Growth Audit: High-Value Expansion in {{city}}');
  const [outreachBody, setOutreachBody] = useState(`Hi {{ownerName}},\n\nI conducted a preliminary digital speed and SEO audit for {{businessName}} in {{city}}.\n\nWe identified opportunities to capture higher-intent client inquiries for {{serviceType}} before peak seasonal demand.\n\nWould you be open to a 5-minute teardown?`);
  const [recipientMode, setRecipientMode] = useState<'new_leads' | 'single_test'>('new_leads');
  const [testRecipient, setTestRecipient] = useState('');
  const [testLeadBusiness, setTestLeadBusiness] = useState('Premier Trade Builders');
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.zapier.com/hooks/catch/sample/dispatch');
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (campaigns.length >= 2) {
      setCamp1Id(campaigns[0].id);
      setCamp2Id(campaigns[1].id);
    }
    if (campaigns.length > 0 && !selectedCampaign) {
      handleSelectCampaign(campaigns[0]);
    }
    fetchGatewayStatus();
    fetchDispatchHistory();
  }, [campaigns]);

  const fetchGatewayStatus = async () => {
    try {
      const res = await fetch('/api/dispatch/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGatewayStatus(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDispatchHistory = async () => {
    try {
      const res = await fetch('/api/dispatch/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDispatchLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyToken = (t: string) => {
    navigator.clipboard.writeText(t);
    setCopiedToken(t);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleExecuteDispatch = async () => {
    setIsDispatching(true);
    setDispatchResult(null);

    try {
      if (recipientMode === 'new_leads') {
        const res = await fetch('/api/dispatch/campaign-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            campaignId: selectedCampaign?.id,
            channel: dispatchChannel,
            template: {
              subject: emailSubject,
              body: outreachBody
            }
          })
        });
        const data = await res.json();
        setDispatchResult(data);
      } else {
        if (dispatchChannel === 'webhook') {
          const res = await fetch('/api/dispatch/webhook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              targetUrl: webhookUrl,
              eventType: 'campaign.outreach_triggered',
              payload: {
                campaign: selectedCampaign?.name || 'High LTV Campaign',
                channel: dispatchChannel,
                recipient: testRecipient || 'test@example.com',
                businessName: testLeadBusiness,
                message: outreachBody
              }
            })
          });
          const data = await res.json();
          setDispatchResult(data);
        } else {
          const res = await fetch('/api/dispatch/campaign-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              campaignId: selectedCampaign?.id,
              channel: dispatchChannel,
              template: {
                subject: emailSubject,
                body: outreachBody
              }
            })
          });
          const data = await res.json();
          setDispatchResult(data);
        }
      }

      fetchDispatchHistory();
    } catch (err: any) {
      setDispatchResult({ error: err.message });
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSelectCampaign = async (c: Campaign) => {
    setSelectedCampaign(c);
    try {
      const res = await fetch(`/api/campaigns/${c.id}/performance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSnapshots(data.snapshots);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompare = async () => {
    if (!camp1Id || !camp2Id) return;
    setCompareLoading(true);
    try {
      const res = await fetch(`/api/campaigns/compare?id1=${camp1Id}&id2=${camp2Id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCompareData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompareLoading(false);
    }
  };

  // Safe totals helpers
  const aggregateSnaps = (snaps: PerformanceSnapshot[]) => {
    const totalLeads = snaps.reduce((sum, s) => sum + s.leads, 0);
    const totalSpend = snaps.reduce((sum, s) => sum + s.spend, 0);
    const totalClicks = snaps.reduce((sum, s) => sum + s.clicks, 0);
    const totalImpressions = snaps.reduce((sum, s) => sum + s.impressions, 0);
    return {
      leads: totalLeads,
      spend: totalSpend,
      clicks: totalClicks,
      impressions: totalImpressions,
      cpl: totalLeads > 0 ? totalSpend / totalLeads : totalSpend,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    };
  };

  const currentStats = aggregateSnaps(snapshots);

  // Render SVG spend trend line
  const renderTrendLine = (snaps: PerformanceSnapshot[], width = 500, height = 150) => {
    if (snaps.length < 2) return null;
    const sorted = [...snaps].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const spends = sorted.map(s => s.spend);
    const maxSpend = Math.max(...spends) || 100;
    const minSpend = Math.min(...spends) || 0;
    const range = maxSpend - minSpend;

    const points = sorted.map((s, i) => {
      const x = (i / (sorted.length - 1)) * width;
      const y = height - 15 - (range > 0 ? ((s.spend - minSpend) / range) * (height - 30) : height / 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-full" viewBox={`0 0 ${width} ${height}`} fill="none">
        <path
          d={`M ${points}`}
          fill="none"
          stroke="#76B900"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {sorted.map((s, i) => {
          const x = (i / (sorted.length - 1)) * width;
          const y = height - 15 - (range > 0 ? ((s.spend - minSpend) / range) * (height - 30) : height / 2);
          return (
            <g key={s.id} className="group">
              <circle
                cx={x}
                cy={y}
                r="3"
                fill="#151515"
                stroke="#76B900"
                strokeWidth="1.5"
              />
              <title>{`${s.date}: $${s.spend.toFixed(1)} spent, ${s.leads} leads`}</title>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* PAGE CONTEXT BRIEFING */}
      <div className="border-b border-border-dim/60 pb-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold tracking-widest text-accent uppercase bg-accent-dim px-2 py-0.5 rounded">Marketing</span>
          <span className="w-1 h-1 rounded-full bg-text-tertiary" />
          <span className="text-[10px] font-mono text-text-secondary">CAMPAIGN PERFORMANCE ENGINE</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Marketing & Campaigns</h2>
            <p className="text-xs text-text-secondary max-w-2xl mt-0.5 leading-relaxed">
              Track the reach, spend, and cost per lead across active client outreach pipelines. Compare marketing channels side-by-side using real snapshots to maximize your return on ad spend (ROAS).
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono shrink-0">
            <div className="px-3.5 py-1.5 border border-border-dim rounded bg-bg-raised text-center min-w-[100px]">
              <span className="block text-[10px] text-text-secondary uppercase">Active Channels</span>
              <span className="text-sm font-semibold text-text-primary mt-0.5 block">{campaigns.filter(c => c.status === 'active').length}</span>
            </div>
            <div className="px-3.5 py-1.5 border border-border-dim rounded bg-bg-raised text-center min-w-[100px]">
              <span className="block text-[10px] text-text-secondary uppercase">Total Spend</span>
              <span className="text-sm font-semibold text-accent mt-0.5 block">$12,450</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-border-dim/60 pb-2">
        <button
          onClick={() => setActiveSubTab('queue')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
            activeSubTab === 'queue'
              ? 'bg-brand text-black'
              : 'bg-bg-raised text-text-secondary hover:text-text-primary border border-border-dim'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Active Outreach Queue</span>
        </button>

        <button
          onClick={() => setActiveSubTab('performance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
            activeSubTab === 'performance'
              ? 'bg-brand text-black'
              : 'bg-bg-raised text-text-secondary hover:text-text-primary border border-border-dim'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Campaign Analytics & ROAS</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dispatcher')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
            activeSubTab === 'dispatcher'
              ? 'bg-brand text-black'
              : 'bg-bg-raised text-text-secondary hover:text-text-primary border border-border-dim'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Dispatcher & Webhooks</span>
        </button>
      </div>

      {activeSubTab === 'queue' && (
        <OutreachQueue
          leads={leads}
          token={token}
          onRefresh={onRefresh || (() => {})}
        />
      )}

      {activeSubTab === 'performance' && (
        <div className="space-y-6">
          {/* Overview channel split card */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Campaigns list */}
        <div className="bg-card-dark border border-border-dark rounded-sm p-4 h-fit">
          <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim block mb-3 pl-2 font-bold">ACTIVE CHANNELS</span>
          <div className="space-y-2">
            {campaigns.map(c => {
              const active = selectedCampaign?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCampaign(c)}
                  className={`p-3 rounded-sm cursor-pointer border transition-all ${
                    active 
                      ? 'bg-brand-glow border-brand/30' 
                      : 'bg-card-inner border-border-dark hover:bg-card-highlight'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-text-primary leading-normal truncate font-sans">{c.name}</span>
                    <span className="text-[9px] font-mono bg-card-dark border border-border-dark text-text-secondary px-1.5 py-0.5 rounded-sm uppercase font-bold tracking-wider">
                      {(c?.platform || 'campaign').replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-text-secondary font-bold">
                    <span className="text-text-dim">Spent Budget</span>
                    <span>${c.spent} / ${c.budget}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Performance Snapshots */}
        <div className="lg:col-span-3 bg-card-dark border border-border-dark rounded-sm p-5">
          {selectedCampaign ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border-dark pb-3">
                <div>
                  <h3 className="text-sm font-bold text-text-primary tracking-tight font-sans">{selectedCampaign.name}</h3>
                  <p className="text-xs text-text-secondary uppercase font-mono mt-0.5 font-bold tracking-wider">7-Day Operational Performance Overview</p>
                </div>
                <div className="flex gap-4 font-mono text-xs">
                  <div className="text-right">
                    <span className="text-[9px] text-text-dim block font-bold">TOTAL LEADS</span>
                    <strong className="text-brand text-sm font-bold">{currentStats.leads}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-text-dim block font-bold">AGGREGATE SPEND</span>
                    <strong className="text-text-primary text-sm font-bold">${currentStats.spend.toLocaleString()}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-text-dim block font-bold">AVERAGE CPL</span>
                    <strong className="text-brand text-sm font-bold">${currentStats.cpl.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Trend Chart */}
              <div>
                <span className="text-[10px] font-mono text-text-dim uppercase block mb-3 font-bold">Spending Trend Evolution</span>
                <div className="bg-card-inner border border-border-dark/60 p-4 rounded-sm">
                  {snapshots.length >= 2 ? (
                    renderTrendLine(snapshots)
                  ) : (
                    <div className="h-[120px] flex items-center justify-center text-xs font-mono text-text-dim uppercase">
                      Loading campaign trend line data points...
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-[9px] font-mono text-text-dim mt-2 font-bold uppercase">
                  <span>Day 7 (Historical)</span>
                  <span>Day 1 (Latest)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-mono text-text-dim uppercase tracking-wider py-12">
              Select a campaign from the channel split list to view performance trends.
            </div>
          )}
        </div>
      </div>

      {/* CAMPAIGN COMPARE TOOL (Bento Card design) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card-dark border border-border-dark rounded-sm p-5"
      >
        <div className="flex items-center gap-2 border-b border-border-dark pb-3 mb-5">
          <BarChart3 className="w-4 h-4 text-brand" />
          <span className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold">Campaign Compare Intelligence Tool</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end mb-6">
          <div className="flex-1 space-y-1">
            <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-wider font-bold">Baseline Campaign</label>
            <select
              value={camp1Id}
              onChange={(e) => setCamp1Id(e.target.value)}
              className="w-full bg-card-inner border border-border-dark rounded-sm p-2 text-xs text-text-secondary focus:outline-none focus:border-brand font-mono font-bold"
            >
              <option value="">Select Campaign...</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
            </select>
          </div>

          <span className="text-text-dim font-mono text-xs self-center pb-2 font-bold">VS</span>

          <div className="flex-1 space-y-1">
            <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-wider font-bold">Comparison Target</label>
            <select
              value={camp2Id}
              onChange={(e) => setCamp2Id(e.target.value)}
              className="w-full bg-card-inner border border-border-dark rounded-sm p-2 text-xs text-text-secondary focus:outline-none focus:border-brand font-mono font-bold"
            >
              <option value="">Select Campaign...</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
            </select>
          </div>

          <button
            onClick={handleCompare}
            disabled={comparing || !camp1Id || !camp2Id}
            className="bg-brand text-black hover:bg-brand-dim px-5 py-2.5 rounded-sm font-mono text-xs font-bold uppercase flex items-center gap-1.5 transition-colors disabled:opacity-40 tracking-wider"
          >
            {comparing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Compare Channels'}
          </button>
        </div>

        {compareData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campaign 1 Column */}
              <div className={`p-5 rounded-sm border flex flex-col justify-between relative overflow-hidden ${
                compareData.winnerId === compareData.campaign1.info.id 
                  ? 'bg-brand-glow border-brand/30' 
                  : 'bg-card-inner border-border-dark'
              }`}>
                {compareData.winnerId === compareData.campaign1.info.id && (
                  <div className="absolute top-3 right-3 bg-brand text-black text-[9px] font-mono px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3 h-3 fill-black" /> Top Performer
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-bold text-text-primary mb-4 leading-normal font-sans">{compareData.campaign1.info.name}</h4>
                  
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-border-dark/40 font-bold">
                      <span className="text-text-dim uppercase tracking-wider text-[10px]">AGGREGATE SPEND</span>
                      <span className="text-text-primary">${compareData.campaign1.metrics.spend.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-border-dark/40 font-bold">
                      <span className="text-text-dim uppercase tracking-wider text-[10px]">LEADS CAPTURED</span>
                      <span className="text-text-primary">{compareData.campaign1.metrics.leads}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-border-dark/40 font-bold">
                      <span className="text-text-dim uppercase tracking-wider text-[10px]">COST PER LEAD (CPL)</span>
                      <strong className={`flex items-center gap-1 ${
                        compareData.campaign1.metrics.cpl <= compareData.campaign2.metrics.cpl ? 'text-brand' : 'text-text-secondary'
                      }`}>
                        ${compareData.campaign1.metrics.cpl.toFixed(2)}
                        {compareData.campaign1.metrics.cpl <= compareData.campaign2.metrics.cpl && <Star className="w-3 h-3 fill-current shrink-0" />}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center py-1.5 font-bold">
                      <span className="text-text-dim uppercase tracking-wider text-[10px]">CLICK-THROUGH RATE (CTR)</span>
                      <span className="text-text-secondary">{(compareData.campaign1.metrics.ctr * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign 2 Column */}
              <div className={`p-5 rounded-sm border flex flex-col justify-between relative overflow-hidden ${
                compareData.winnerId === compareData.campaign2.info.id 
                  ? 'bg-brand-glow border-brand/30' 
                  : 'bg-card-inner border-border-dark'
              }`}>
                {compareData.winnerId === compareData.campaign2.info.id && (
                  <div className="absolute top-3 right-3 bg-brand text-black text-[9px] font-mono px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3 h-3 fill-black" /> Top Performer
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-bold text-text-primary mb-4 leading-normal font-sans">{compareData.campaign2.info.name}</h4>
                  
                  <div className="space-y-2 font-mono text-xs font-bold">
                    <div className="flex justify-between items-center py-1.5 border-b border-border-dark/40 font-bold">
                      <span className="text-text-dim uppercase tracking-wider text-[10px]">AGGREGATE SPEND</span>
                      <span className="text-text-primary">${compareData.campaign2.metrics.spend.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-border-dark/40 font-bold">
                      <span className="text-text-dim uppercase tracking-wider text-[10px]">LEADS CAPTURED</span>
                      <span className="text-text-primary">{compareData.campaign2.metrics.leads}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-border-dark/40 font-bold">
                      <span className="text-text-dim uppercase tracking-wider text-[10px]">COST PER LEAD (CPL)</span>
                      <strong className={`flex items-center gap-1 ${
                        compareData.campaign2.metrics.cpl <= compareData.campaign1.metrics.cpl ? 'text-brand' : 'text-text-secondary'
                      }`}>
                        ${compareData.campaign2.metrics.cpl.toFixed(2)}
                        {compareData.campaign2.metrics.cpl <= compareData.campaign1.metrics.cpl && <Star className="w-3 h-3 fill-current shrink-0" />}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center py-1.5 font-bold">
                      <span className="text-text-dim uppercase tracking-wider text-[10px]">CLICK-THROUGH RATE (CTR)</span>
                      <span className="text-text-secondary">{(compareData.campaign2.metrics.ctr * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Evaluation narrative */}
            <div className="bg-card-inner border border-border-dark/60 p-4 rounded-sm flex gap-3.5 items-start">
              <div className="w-7 h-7 rounded bg-brand-glow border border-brand/20 text-brand flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-brand tracking-wider uppercase block font-bold">HAL Evaluation Decision Rationale</span>
                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  {compareData.rationale}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 border border-dashed border-border-dark rounded-sm text-center text-text-dim font-mono text-xs uppercase tracking-wider">
            Select two operational advertising campaigns above and trigger "COMPARE CHANNELS".
          </div>
        )}
      </motion.div>
    </div>
  )}

  {activeSubTab === 'dispatcher' && (
      /* ─── MULTICHANNEL OUTREACH DISPATCH ENGINE & WEBHOOKS ─── */
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card-bg border border-border-dark rounded-sm p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-dark/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-brand" />
              <h3 className="text-base font-bold text-text-primary uppercase tracking-wide font-mono">
                Multichannel Campaign Dispatcher & Webhooks
              </h3>
            </div>
            <p className="text-xs text-text-dim mt-1 font-sans">
              Autonomous multi-touch client outreach dispatch and secured HMAC-SHA256 Webhook integrations.
            </p>
          </div>

          {/* Engine Status Badges */}
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <div className="px-2.5 py-1 rounded border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              <span>OUTREACH PIPELINE: ACTIVE</span>
            </div>

            <div className="px-2.5 py-1 rounded border bg-blue-500/10 border-blue-500/30 text-blue-400 flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              <span>WEBHOOK: HMAC-SHA256</span>
            </div>
          </div>
        </div>

        {/* Channel Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setDispatchChannel('email')}
            className={`p-3.5 rounded border text-left flex items-start gap-3 transition-all cursor-pointer ${
              dispatchChannel === 'email'
                ? 'bg-brand-glow border-brand text-brand shadow-sm'
                : 'bg-card-inner border-border-dark text-text-secondary hover:text-text-primary'
            }`}
          >
            <Mail className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-mono text-xs font-bold uppercase">Email Outreach Channel</div>
              <div className="text-[11px] text-text-dim mt-0.5">High-deliverability custom pitch teardowns and audits</div>
            </div>
          </button>

          <button
            onClick={() => setDispatchChannel('sms')}
            className={`p-3.5 rounded border text-left flex items-start gap-3 transition-all cursor-pointer ${
              dispatchChannel === 'sms'
                ? 'bg-brand-glow border-brand text-brand shadow-sm'
                : 'bg-card-inner border-border-dark text-text-secondary hover:text-text-primary'
            }`}
          >
            <Phone className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-mono text-xs font-bold uppercase">SMS Mobile Channel</div>
              <div className="text-[11px] text-text-dim mt-0.5">Instant mobile touchpoints and time-sensitive alerts</div>
            </div>
          </button>

          <button
            onClick={() => setDispatchChannel('webhook')}
            className={`p-3.5 rounded border text-left flex items-start gap-3 transition-all cursor-pointer ${
              dispatchChannel === 'webhook'
                ? 'bg-brand-glow border-brand text-brand shadow-sm'
                : 'bg-card-inner border-border-dark text-text-secondary hover:text-text-primary'
            }`}
          >
            <Radio className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-mono text-xs font-bold uppercase">Zapier / Webhook Relay</div>
              <div className="text-[11px] text-text-dim mt-0.5">Signed JSON payloads to external CRM and workflows</div>
            </div>
          </button>
        </div>

        {/* Template & Target Form */}
        <div className="space-y-4 bg-card-inner border border-border-dark p-4 rounded-sm font-mono text-xs">
          {/* Target Audience / Test Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block mb-1.5">
                Target Recipient Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setRecipientMode('new_leads')}
                  className={`flex-1 py-2 px-3 rounded border text-center transition-colors cursor-pointer ${
                    recipientMode === 'new_leads'
                      ? 'bg-brand text-black font-bold border-brand'
                      : 'bg-bg-subtle border-border-dim text-text-secondary hover:text-text-primary'
                  }`}
                >
                  BATCH: ALL NEW PROSPECTS
                </button>
                <button
                  onClick={() => setRecipientMode('single_test')}
                  className={`flex-1 py-2 px-3 rounded border text-center transition-colors cursor-pointer ${
                    recipientMode === 'single_test'
                      ? 'bg-brand text-black font-bold border-brand'
                      : 'bg-bg-subtle border-border-dim text-text-secondary hover:text-text-primary'
                  }`}
                >
                  SINGLE TEST TRANSMISSION
                </button>
              </div>
            </div>

            {recipientMode === 'single_test' ? (
              <div>
                <label className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block mb-1.5">
                  {dispatchChannel === 'email' ? 'Test Email Address' : dispatchChannel === 'sms' ? 'Test Phone Number' : 'Webhook Endpoint URL'}
                </label>
                {dispatchChannel === 'webhook' ? (
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.zapier.com/..."
                    className="w-full bg-bg-subtle border border-border-dim rounded p-2 text-text-primary focus:outline-none focus:border-brand"
                  />
                ) : (
                  <input
                    type="text"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder={dispatchChannel === 'email' ? 'client@business.com' : '+12045550199'}
                    className="w-full bg-bg-subtle border border-border-dim rounded p-2 text-text-primary focus:outline-none focus:border-brand"
                  />
                )}
              </div>
            ) : (
              <div>
                <label className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block mb-1.5">
                  Associated Campaign Focus
                </label>
                <div className="p-2 bg-bg-subtle border border-border-dim rounded text-text-primary flex justify-between items-center">
                  <span>{selectedCampaign?.name || 'All Active Campaigns'}</span>
                  <span className="text-[10px] text-brand uppercase font-bold">{selectedCampaign?.platform || 'Multichannel'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Interpolation Token Helpers */}
          <div>
            <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold block mb-1">
              Available Personalization Tokens (Click to Copy):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['{{businessName}}', '{{ownerName}}', '{{city}}', '{{serviceType}}', '{{urgencyScore}}', '{{seoScore}}'].map(tokenStr => (
                <button
                  key={tokenStr}
                  onClick={() => handleCopyToken(tokenStr)}
                  className="px-2 py-0.5 bg-bg-subtle border border-border-dim hover:border-brand text-text-secondary text-[10px] rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedToken === tokenStr ? <Check className="w-2.5 h-2.5 text-positive" /> : <Copy className="w-2.5 h-2.5" />}
                  <code>{tokenStr}</code>
                </button>
              ))}
            </div>
          </div>

          {/* Email Subject if Email */}
          {dispatchChannel === 'email' && (
            <div>
              <label className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block mb-1.5">
                Email Subject Line
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full bg-bg-subtle border border-border-dim rounded p-2 text-text-primary focus:outline-none focus:border-brand font-sans text-xs"
              />
            </div>
          )}

          {/* Body Content */}
          <div>
            <label className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block mb-1.5">
              {dispatchChannel === 'sms' ? 'SMS Body (Max 160 chars recommended)' : 'Message Content / Pitch'}
            </label>
            <textarea
              rows={4}
              value={outreachBody}
              onChange={(e) => setOutreachBody(e.target.value)}
              className="w-full bg-bg-subtle border border-border-dim rounded p-2 text-text-primary focus:outline-none focus:border-brand font-sans text-xs leading-relaxed"
            />
          </div>

          {/* Dispatch Trigger Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-text-dim flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand" />
              <span>
                {recipientMode === 'new_leads' 
                  ? 'Batch transmission triggers real-time lead event logging and updates pipeline stage.'
                  : 'Test transmission immediately validates credentials and returns provider metadata.'}
              </span>
            </div>

            <button
              onClick={handleExecuteDispatch}
              disabled={isDispatching}
              className="w-full sm:w-auto px-6 py-2.5 bg-brand text-black font-bold uppercase tracking-wider text-xs rounded hover:bg-brand-hover transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isDispatching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>TRANSMITTING...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>DISPATCH {dispatchChannel.toUpperCase()} OUTREACH</span>
                </>
              )}
            </button>
          </div>

          {/* Real-time Dispatch Feedback */}
          {dispatchResult && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 rounded border text-xs ${
                dispatchResult.success !== false
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <div className="flex items-center gap-2 font-bold uppercase">
                {dispatchResult.success !== false ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>
                  {dispatchResult.success !== false ? 'Dispatch Successful' : 'Transmission Alert'}
                </span>
              </div>
              <div className="mt-1 text-[11px] font-mono text-text-secondary">
                {dispatchResult.successful !== undefined ? (
                  <span>Batch Complete: {dispatchResult.successful} delivered, {dispatchResult.failed} failed out of {dispatchResult.totalTargeted} targeted.</span>
                ) : (
                  <span>Provider ID: {dispatchResult.providerId || 'ACK_OK'} • Mode: {dispatchResult.mode || 'live'} • Recipient: {dispatchResult.recipient || dispatchResult.targetUrl}</span>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Live Dispatch Transmission Log Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-text-dim" />
              Recent Dispatch Transmission Audit Logs
            </h4>
            <button
              onClick={fetchDispatchHistory}
              className="text-[10px] text-brand hover:underline flex items-center gap-1 font-mono cursor-pointer"
            >
              <RefreshCw className="w-2.5 h-2.5" /> REFRESH LOGS
            </button>
          </div>

          {dispatchLogs.length > 0 ? (
            <div className="border border-border-dark rounded overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-card-inner text-text-dim border-b border-border-dark uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Channel</th>
                      <th className="py-2 px-3">Recipient</th>
                      <th className="py-2 px-3">Subject / Preview</th>
                      <th className="py-2 px-3">Mode</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark/40 bg-card-bg">
                    {dispatchLogs.slice(0, 8).map((log) => (
                      <tr key={log.id} className="hover:bg-card-inner/50 transition-colors">
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            log.channel === 'sms' ? 'bg-blue-500/20 text-blue-400' :
                            log.channel === 'email' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {log.channel}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-text-primary font-bold">{log.recipient}</td>
                        <td className="py-2 px-3 text-text-secondary truncate max-w-xs">{log.subject || log.preview || 'Outreach message'}</td>
                        <td className="py-2 px-3">
                          <span className={`text-[9px] uppercase font-bold ${log.mode === 'live' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {log.mode}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`flex items-center gap-1 font-bold ${
                            log.status === 'delivered' ? 'text-positive' : 'text-rose-400'
                          }`}>
                            {log.status === 'delivered' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {log.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-text-dim text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-4 border border-dashed border-border-dark rounded text-center text-text-dim font-mono text-[11px]">
              No dispatch transmissions recorded yet. Select an outreach channel above to send your first message.
            </div>
          )}
        </div>
      </motion.div>
    )}
    </div>
  );
}

