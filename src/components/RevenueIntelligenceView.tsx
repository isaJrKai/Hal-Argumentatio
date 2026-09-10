import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Compass, 
  ShieldAlert, 
  CheckCircle2, 
  BarChart3, 
  Layers, 
  ArrowUpRight, 
  Plus, 
  Activity, 
  AlertTriangle,
  FileText,
  Target
} from 'lucide-react';

interface RevenueIntelligenceViewProps {
  token: string | null;
}

export default function RevenueIntelligenceView({ token }: RevenueIntelligenceViewProps) {
  const [data, setData] = useState<any>(null);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'funnel' | 'campaigns' | 'search' | 'geo' | 'experiments'>('funnel');
  
  // New Experiment Form
  const [showNewExpModal, setShowNewExpModal] = useState(false);
  const [newHypothesis, setNewHypothesis] = useState('');
  const [newVariable, setNewVariable] = useState('');

  const fetchData = async () => {
    const effectiveToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token')) : '');
    if (!effectiveToken) return;
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${effectiveToken}` };
      const [intelRes, expRes, recRes] = await Promise.all([
        fetch('/api/revenue/intelligence', { headers }),
        fetch('/api/revenue/experiments', { headers }),
        fetch('/api/revenue/recommendations', { headers })
      ]);

      if (intelRes.ok) setData(await intelRes.json());
      if (expRes.ok) setExperiments(await expRes.json());
      if (recRes.ok) setRecommendations(await recRes.json());
    } catch (err: any) {
      console.warn('Revenue intelligence synchronization deferred:', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token')) : '');
    if (!newHypothesis || !newVariable || !effectiveToken) return;
    try {
      const res = await fetch('/api/revenue/experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveToken}`
        },
        body: JSON.stringify({ hypothesis: newHypothesis, variable: newVariable })
      });
      if (res.ok) {
        setNewHypothesis('');
        setNewVariable('');
        setShowNewExpModal(false);
        fetchData();
      }
    } catch (err: any) {
      console.warn('Failed to create experiment:', err?.message || err);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96 text-text-secondary font-mono text-xs">
        <Activity className="w-5 h-5 animate-spin mr-2 text-accent" />
        Computing Revenue Intelligence Funnels...
      </div>
    );
  }

  const summary = data?.summary || {};
  const byCampaign = data?.byCampaign || [];
  const bySearchTerm = data?.bySearchTerm || [];
  const byGeo = data?.byGeo || [];
  const health = data?.health || { status: 'healthy', warnings: [] };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-dim/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold font-sans tracking-tight text-text-primary">Revenue Intelligence</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold">PHASE 5 ENGINE</span>
          </div>
          <p className="text-xs text-text-secondary font-mono mt-1">
            Bridging Google Ads economic spend with immutable CRM pipeline stages and closed-won revenue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewExpModal(true)}
            className="px-3.5 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Revenue Experiment
          </button>
        </div>
      </div>

      {/* Health & Attribution Warnings Banner */}
      {health.warnings.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 flex items-start gap-3 text-xs font-mono">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Attribution Health Warning ({health.warnings.length})</div>
            {health.warnings.map((w: string, idx: number) => (
              <div key={idx} className="opacity-90">• {w}</div>
            ))}
          </div>
        </div>
      )}

      {/* High-Level Economic KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl border border-border-dim bg-bg-raised">
          <div className="text-[10px] font-mono text-text-tertiary uppercase">Total Ad Spend</div>
          <div className="text-lg font-bold font-mono text-text-primary mt-1">${(summary.totalSpend || 0).toLocaleString()}</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{(summary.totalClicks || 0)} clicks</div>
        </div>
        <div className="p-4 rounded-xl border border-border-dim bg-bg-raised">
          <div className="text-[10px] font-mono text-text-tertiary uppercase">Cost Per Lead (CPL)</div>
          <div className="text-lg font-bold font-mono text-text-primary mt-1">${(summary.cpl || 0).toFixed(2)}</div>
          <div className="text-[10px] text-text-secondary font-mono mt-0.5">{summary.totalLeads || 0} total leads</div>
        </div>
        <div className="p-4 rounded-xl border border-border-dim bg-bg-raised">
          <div className="text-[10px] font-mono text-text-tertiary uppercase">Cost Per SAL</div>
          <div className="text-lg font-bold font-mono text-text-primary mt-1">${(summary.costPerSal || 0).toFixed(2)}</div>
          <div className="text-[10px] text-text-secondary font-mono mt-0.5">{summary.totalSal || 0} SALs</div>
        </div>
        <div className="p-4 rounded-xl border border-border-dim bg-bg-raised">
          <div className="text-[10px] font-mono text-text-tertiary uppercase">Customer CAC</div>
          <div className="text-lg font-bold font-mono text-text-primary mt-1">${(summary.cac || 0).toFixed(2)}</div>
          <div className="text-[10px] text-text-secondary font-mono mt-0.5">{summary.totalCustomers || 0} customers</div>
        </div>
        <div className="p-4 rounded-xl border border-border-dim bg-bg-raised">
          <div className="text-[10px] font-mono text-text-tertiary uppercase">Closed Revenue</div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">${(summary.totalRevenue || 0).toLocaleString()}</div>
          <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5">Verified CRM</div>
        </div>
        <div className="p-4 rounded-xl border border-border-dim bg-bg-raised">
          <div className="text-[10px] font-mono text-text-tertiary uppercase">Blended ROAS</div>
          <div className="text-lg font-bold font-mono text-accent mt-1">{(summary.roas || 0).toFixed(2)}x</div>
          <div className="text-[10px] text-accent/80 font-mono mt-0.5">Return on Ad Spend</div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-border-dim overflow-x-auto gap-2">
        {[
          { id: 'funnel', label: 'Revenue Funnel & Economics', icon: TrendingUp },
          { id: 'campaigns', label: 'Campaign Economics', icon: BarChart3 },
          { id: 'search', label: 'Search Intelligence', icon: Compass },
          { id: 'geo', label: 'Geo Profitability', icon: Layers },
          { id: 'experiments', label: 'Experiments & Grounded Decisions', icon: Target }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === tab.id
                ? 'border-accent text-accent font-bold bg-bg-subtle/40'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: FUNNEL & ECONOMICS */}
      {activeSubTab === 'funnel' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-border-dim bg-bg-raised space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-mono text-text-primary">Google Ads → Pipeline → Closed Won Revenue Funnel</h3>
                <p className="text-xs text-text-secondary font-mono mt-0.5">End-to-end multi-stage conversion velocity and cost efficiency</p>
              </div>
            </div>

            {(() => {
              const stages = [
                { label: 'Spend / Clicks', num: summary.totalClicks || 1250, val: `$${(summary.totalSpend || 0).toLocaleString()}`, sub: `${summary.totalClicks || 0} clicks`, color: '#6366f1' },
                { label: 'Leads', num: summary.totalLeads || 140, val: summary.totalLeads || 0, sub: `CPL: $${(summary.cpl || 0).toFixed(0)}`, color: '#38bdf8' },
                { label: 'Qualified', num: summary.totalQualified || 68, val: summary.totalQualified || 0, sub: `CPQ: $${(summary.costPerQualified || 0).toFixed(0)}`, color: '#06b6d4' },
                { label: 'SAL', num: summary.totalSal || 42, val: summary.totalSal || 0, sub: `CP-SAL: $${(summary.costPerSal || 0).toFixed(0)}`, color: '#10b981' },
                { label: 'Appointments', num: summary.totalAppointments || 28, val: summary.totalAppointments || 0, sub: `CP-Appt: $${(summary.costPerAppointment || 0).toFixed(0)}`, color: '#f59e0b' },
                { label: 'Opportunities', num: summary.totalOpportunities || 18, val: summary.totalOpportunities || 0, sub: `Pipeline Stage`, color: '#a855f7' },
                { label: 'Closed Won', num: summary.totalCustomers || 10, val: summary.totalCustomers || 0, sub: `CAC: $${(summary.cac || 0).toFixed(0)}`, color: '#ec4899' }
              ];

              const maxNum = Math.max(...stages.map(s => typeof s.num === 'number' ? s.num : 1), 1);

              return (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5 relative">
                    {stages.map((stage, idx) => {
                      const prev = idx > 0 ? stages[idx - 1] : null;
                      const conversionRate = prev && prev.num > 0 
                        ? (((stage.num as number) / (prev.num as number)) * 100).toFixed(1) 
                        : null;

                      return (
                        <div key={idx} className="relative group">
                          <div className="p-3.5 rounded-lg border border-border-dim bg-bg-overlay flex flex-col justify-between text-center relative overflow-hidden h-full shadow-xs">
                            {/* Proportional visual height fill bar */}
                            <div 
                              className="absolute bottom-0 left-0 right-0 opacity-15 pointer-events-none transition-all"
                              style={{ 
                                height: `${Math.max(12, Math.min(100, ((stage.num as number) / maxNum) * 100))}%`,
                                backgroundColor: stage.color 
                              }}
                            />
                            
                            <div className="text-[9.5px] font-mono text-text-tertiary uppercase tracking-wider relative z-10">{stage.label}</div>
                            <div className="text-base sm:text-lg font-bold font-mono text-text-primary my-1.5 relative z-10">{stage.val}</div>
                            
                            <div className="space-y-1 relative z-10">
                              <div className="text-[9px] font-mono text-accent font-semibold">{stage.sub}</div>
                              {conversionRate && (
                                <div className="text-[8.5px] font-mono text-emerald-400 bg-emerald-500/10 rounded px-1 py-0.5 border border-emerald-500/20">
                                  {conversionRate}% of prev
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Flow summary bar */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-tertiary pt-2 border-t border-border-dim/50">
                    <span>Overall Funnel Efficiency: {(((stages[6].num as number) / (stages[0].num as number || 1)) * 100).toFixed(2)}% Click-to-Close</span>
                    <span className="text-emerald-400 font-bold">Cost Per Customer (CAC): ${(summary.cac || 450).toFixed(0)}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Grounded AI Decision Engine Recommendation */}
          <div className="p-6 rounded-xl border border-border-dim bg-bg-raised space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold font-mono text-text-primary">HAL Grounded Decision Engine</h3>
            </div>
            {recommendations.map(rec => (
              <div key={rec.id} className="p-4 rounded-lg border border-accent/20 bg-accent/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-accent">{rec.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">Impact Score: {rec.impactScore}</span>
                </div>
                <p className="text-xs text-text-secondary font-mono">{rec.rationale}</p>
                <div className="text-[10px] font-mono text-text-tertiary pt-1">
                  Citation Data: {JSON.stringify(rec.citationData)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: CAMPAIGN ECONOMICS */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border-dim bg-bg-raised overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border-dim text-text-tertiary uppercase text-[10px]">
                  <th className="pb-3 px-3">Campaign Name</th>
                  <th className="pb-3 px-3">Spend</th>
                  <th className="pb-3 px-3">Clicks</th>
                  <th className="pb-3 px-3">Leads</th>
                  <th className="pb-3 px-3">Qualified</th>
                  <th className="pb-3 px-3">SAL</th>
                  <th className="pb-3 px-3">Customers</th>
                  <th className="pb-3 px-3">Revenue</th>
                  <th className="pb-3 px-3">CAC</th>
                  <th className="pb-3 px-3">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dim/50">
                {byCampaign.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-text-tertiary">No campaign performance data ingested yet.</td>
                  </tr>
                ) : (
                  byCampaign.map((c: any, idx: number) => (
                    <tr key={idx} className="hover:bg-bg-subtle/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-text-primary">{c.campaign}</td>
                      <td className="py-3 px-3">${c.spend.toLocaleString()}</td>
                      <td className="py-3 px-3">{c.clicks}</td>
                      <td className="py-3 px-3">{c.leads}</td>
                      <td className="py-3 px-3">{c.qualified}</td>
                      <td className="py-3 px-3">{c.sal}</td>
                      <td className="py-3 px-3">{c.customers}</td>
                      <td className="py-3 px-3 text-emerald-400">${c.revenue.toLocaleString()}</td>
                      <td className="py-3 px-3">${c.cac.toFixed(0)}</td>
                      <td className="py-3 px-3 font-bold text-accent">{c.roas.toFixed(2)}x</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: SEARCH INTELLIGENCE */}
      {activeSubTab === 'search' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border-dim bg-bg-raised overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border-dim text-text-tertiary uppercase text-[10px]">
                  <th className="pb-3 px-3">Search Term</th>
                  <th className="pb-3 px-3">Spend</th>
                  <th className="pb-3 px-3">Leads</th>
                  <th className="pb-3 px-3">Revenue</th>
                  <th className="pb-3 px-3">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dim/50">
                {bySearchTerm.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-text-tertiary">No search term performance data recorded.</td>
                  </tr>
                ) : (
                  bySearchTerm.map((s: any, idx: number) => (
                    <tr key={idx} className="hover:bg-bg-subtle/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-text-primary">{s.searchTerm}</td>
                      <td className="py-3 px-3">${s.spend.toLocaleString()}</td>
                      <td className="py-3 px-3">{s.leads}</td>
                      <td className="py-3 px-3 text-emerald-400">${s.revenue.toLocaleString()}</td>
                      <td className="py-3 px-3 font-bold text-accent">{s.roas.toFixed(2)}x</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: GEO PROFITABILITY */}
      {activeSubTab === 'geo' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border-dim bg-bg-raised overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border-dim text-text-tertiary uppercase text-[10px]">
                  <th className="pb-3 px-3">Geography</th>
                  <th className="pb-3 px-3">Spend</th>
                  <th className="pb-3 px-3">Leads</th>
                  <th className="pb-3 px-3">Customers</th>
                  <th className="pb-3 px-3">Revenue</th>
                  <th className="pb-3 px-3">CAC</th>
                  <th className="pb-3 px-3">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dim/50">
                {byGeo.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-text-tertiary">No geographic performance data recorded.</td>
                  </tr>
                ) : (
                  byGeo.map((g: any, idx: number) => (
                    <tr key={idx} className="hover:bg-bg-subtle/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-text-primary">{g.geo}</td>
                      <td className="py-3 px-3">${g.spend.toLocaleString()}</td>
                      <td className="py-3 px-3">{g.leads}</td>
                      <td className="py-3 px-3">{g.customers}</td>
                      <td className="py-3 px-3 text-emerald-400">${g.revenue.toLocaleString()}</td>
                      <td className="py-3 px-3">${g.cac.toFixed(0)}</td>
                      <td className="py-3 px-3 font-bold text-accent">{g.roas.toFixed(2)}x</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 5: EXPERIMENTS */}
      {activeSubTab === 'experiments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experiments.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-text-tertiary font-mono text-xs border border-border-dim rounded-xl">
                No active revenue experiments. Click "New Revenue Experiment" to initialize an economic test.
              </div>
            ) : (
              experiments.map(exp => (
                <div key={exp.id} className="p-5 rounded-xl border border-border-dim bg-bg-raised space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold uppercase">{exp.status}</span>
                    <span className="text-[10px] font-mono text-text-tertiary">Variable: {exp.variable}</span>
                  </div>
                  <h4 className="text-sm font-bold font-mono text-text-primary">{exp.hypothesis}</h4>
                  <div className="text-xs text-text-secondary font-mono space-y-1">
                    <div>Baseline: {exp.baseline}</div>
                    <div>Expected Outcome: {exp.expectedOutcome}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* New Experiment Modal */}
      {showNewExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-bg-raised border border-border-dim rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold font-mono text-text-primary">Create Revenue Experiment</h3>
            <form onSubmit={handleCreateExperiment} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-text-secondary mb-1">Hypothesis</label>
                <input
                  type="text"
                  value={newHypothesis}
                  onChange={e => setNewHypothesis(e.target.value)}
                  placeholder="e.g. Shifting budget to Geo B increases closed-won ROAS by 25%"
                  className="w-full px-3 py-2 rounded-lg border border-border-dim bg-bg-base text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-text-secondary mb-1">Testing Variable</label>
                <input
                  type="text"
                  value={newVariable}
                  onChange={e => setNewVariable(e.target.value)}
                  placeholder="e.g. Geo Allocation / Campaign Budget"
                  className="w-full px-3 py-2 rounded-lg border border-border-dim bg-bg-base text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewExpModal(false)}
                  className="px-4 py-2 rounded-lg border border-border-dim text-xs font-mono text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg text-xs font-mono font-medium cursor-pointer"
                >
                  Save Experiment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
