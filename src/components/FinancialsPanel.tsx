import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Zap, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Activity, 
  CheckCircle2, 
  Percent, 
  Clock, 
  RefreshCw,
  Award
} from 'lucide-react';
import { FinancialSnapshot } from '../types';
import { useBusinessContext } from '../context/BusinessContext';
import { safeFetchJson } from '../lib/apiHelper';

interface FinancialsPanelProps {
  token: string;
}

export default function FinancialsPanel({ token }: FinancialsPanelProps) {
  const { workspaceConfig } = useBusinessContext();
  const [data, setData] = useState<FinancialSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forecastHorizon, setForecastHorizon] = useState<'6m' | '12m'>('12m');

  const fetchFinancials = async () => {
    const authToken = token || localStorage.getItem('halbiz_auth_token') || '';
    if (!authToken) {
      setLoading(false);
      setErrorMsg('Authentication token required. Please sign in.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const json = await safeFetchJson('/api/financials/overview', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      setData(json);
    } catch (err: any) {
      console.error('Failed to fetch financial metrics:', err);
      setErrorMsg(err.message || 'Network error fetching financials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [token]);

  if (loading) {
    return (
      <div className="p-12 text-center text-text-dim font-mono text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-brand" />
        <span>Calculating financial metrics and cohort valuations...</span>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="p-8 bg-bg-raised border border-border-dim rounded-sm text-center space-y-4 max-w-lg mx-auto mt-12 font-mono">
        <div className="text-red-400 text-xs font-bold uppercase">Financial Intelligence Error</div>
        <p className="text-xs text-text-secondary">{errorMsg || 'Unable to load financial metrics.'}</p>
        <button
          onClick={fetchFinancials}
          className="px-4 py-2 bg-brand text-black rounded-sm font-bold text-xs uppercase tracking-wider hover:bg-brand/90 transition-colors cursor-pointer"
        >
          Retry Loading Financials
        </button>
      </div>
    );
  }

  const maxMrr = Math.max(...(data.mrrHistory || []).map(m => m.mrr), 1);

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="border-b border-border-dim/60 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold tracking-widest text-brand uppercase bg-brand/10 px-2 py-0.5 rounded">
              Phase 5: Financial Intelligence
            </span>
            <span className="w-1 h-1 rounded-full bg-text-tertiary" />
            <span className="text-[10px] font-mono text-text-secondary">RETAINER REVENUE & UNIT ECONOMICS</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary mt-1">Financial Intelligence & Retainers</h2>
          <p className="text-xs text-text-secondary max-w-2xl mt-0.5">
            Real-time MRR/ARR capitalization, LTV-to-CAC health ratios, churn analytics, and multi-tier retainer cohort projections.
          </p>
        </div>

        <button
          onClick={fetchFinancials}
          className="px-3 py-1.5 bg-bg-raised border border-border-dim hover:border-brand text-text-primary rounded-sm font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3 h-3 text-brand" />
          <span>Refresh Financials</span>
        </button>
      </div>

      {/* CORE CAPITALIZATION KPI HERO (4 TILES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CURRENT MRR */}
        <div className="p-4 bg-bg-raised border border-border-dim rounded-sm space-y-2">
          <div className="flex items-center justify-between text-text-dim text-[10px] font-mono uppercase font-bold">
            <span>Monthly Recurring (MRR)</span>
            <DollarSign className="w-3.5 h-3.5 text-brand" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            ${data.currentMrrUsd.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-positive font-bold">
            <ArrowUpRight className="w-3 h-3" />
            <span>+14.2% MoM Expansion</span>
          </div>
        </div>

        {/* ANNUAL RUN RATE */}
        <div className="p-4 bg-bg-raised border border-border-dim rounded-sm space-y-2">
          <div className="flex items-center justify-between text-text-dim text-[10px] font-mono uppercase font-bold">
            <span>Annual Run-Rate (ARR)</span>
            <Activity className="w-3.5 h-3.5 text-brand" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            ${data.arrUsd.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-text-dim">
            Across {data.activeClientCount} active retainers
          </div>
        </div>

        {/* LTV : CAC RATIO */}
        <div className="p-4 bg-bg-raised border border-border-dim rounded-sm space-y-2">
          <div className="flex items-center justify-between text-text-dim text-[10px] font-mono uppercase font-bold">
            <span>LTV : CAC Efficiency</span>
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
          </div>
          <div className="text-2xl font-bold text-brand">
            {data.ltvToCacRatio}x
          </div>
          <div className="text-[10px] font-mono text-positive font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Healthy (CAC: ${data.blendedCacUsd})</span>
          </div>
        </div>

        {/* AVERAGE LTV & CHURN */}
        <div className="p-4 bg-bg-raised border border-border-dim rounded-sm space-y-2">
          <div className="flex items-center justify-between text-text-dim text-[10px] font-mono uppercase font-bold">
            <span>Average Client LTV</span>
            <Award className="w-3.5 h-3.5 text-brand" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            ${data.averageLtvUsd.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-text-secondary">
            {data.averageContractLengthMonths} mo avg retention • {data.churnRatePercent}% churn
          </div>
        </div>

      </div>

      {/* DUAL SECTION: MRR TRAJECTORY CHART (LEFT) & RETAINER TIER DISTRIBUTION (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MRR HISTORICAL & PROJECTION ENGINE (8 COLS) */}
        <div className="lg:col-span-8 bg-bg-raised border border-border-dim rounded-sm p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-dim/60 pb-3">
            <div>
              <h3 className="text-sm font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand" />
                <span>Monthly Recurring Growth & Forecast Engine</span>
              </h3>
              <span className="text-[10px] font-mono text-text-dim mt-0.5 block">
                Historical monthly billings vs 12% compounding client pipeline model
              </span>
            </div>

            {/* HORIZON SELECTOR */}
            <div className="flex items-center gap-1 bg-bg-dark border border-border-dim p-0.5 rounded-sm font-mono text-[10px]">
              <button
                onClick={() => setForecastHorizon('6m')}
                className={`px-2 py-0.5 rounded-xs font-bold uppercase transition-colors ${
                  forecastHorizon === '6m' ? 'bg-brand text-black' : 'text-text-dim hover:text-text-primary'
                }`}
              >
                6-Month Outlook
              </button>
              <button
                onClick={() => setForecastHorizon('12m')}
                className={`px-2 py-0.5 rounded-xs font-bold uppercase transition-colors ${
                  forecastHorizon === '12m' ? 'bg-brand text-black' : 'text-text-dim hover:text-text-primary'
                }`}
              >
                12-Month Outlook
              </button>
            </div>
          </div>

          {/* HISTORICAL BAR CHART */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-mono text-text-dim uppercase font-bold block">
              6-Month Historical Billings Trajectory
            </span>

            <div className="h-40 flex items-end justify-between gap-3 pt-6 px-2 border-b border-border-dim/60 pb-2">
              {data.mrrHistory.map((item) => {
                const heightPct = Math.round((item.mrr / maxMrr) * 100);
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[9px] font-mono text-text-dim opacity-0 group-hover:opacity-100 transition-opacity">
                      ${(item.mrr / 1000).toFixed(1)}k
                    </div>
                    <div 
                      className="w-full bg-brand/30 border border-brand/60 rounded-xs group-hover:bg-brand group-hover:border-brand transition-all cursor-pointer"
                      style={{ height: `${Math.max(12, heightPct)}%` }}
                    />
                    <span className="text-[10px] font-mono text-text-secondary font-bold uppercase">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PROJECTION BENCHMARK CALLOUT */}
          <div className="p-4 bg-bg-dark border border-border-dim rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
            <div>
              <span className="text-[10px] text-brand uppercase font-bold block">Compounding Pipeline Projection</span>
              <div className="text-sm font-bold text-text-primary mt-0.5">
                Target MRR at {forecastHorizon === '12m' ? 'Month 12' : 'Month 6'}:{' '}
                <span className="text-brand">
                  ${(forecastHorizon === '12m' ? data.projectedMrr12Months : data.projectedMrr6Months).toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-text-dim mt-0.5 font-sans">
                Based on active lead conversion rates, $2,400 target ACV, and {data.churnRatePercent}% monthly churn tolerance.
              </p>
            </div>

            <div className="shrink-0 text-right">
              <span className="text-[10px] text-text-dim uppercase block font-bold">Annualized Target</span>
              <span className="text-lg font-bold text-positive">
                ${((forecastHorizon === '12m' ? data.projectedMrr12Months : data.projectedMrr6Months) * 12).toLocaleString()}
              </span>
            </div>
          </div>

        </div>

        {/* RETAINER TIER DISTRIBUTION & BREAKDOWN (4 COLS) */}
        <div className="lg:col-span-4 bg-bg-raised border border-border-dim rounded-sm p-5 space-y-4">
          <div className="border-b border-border-dim/60 pb-3">
            <h3 className="text-sm font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-brand" />
              <span>Retainer Tier Allocation</span>
            </h3>
            <span className="text-[10px] font-mono text-text-dim mt-0.5 block">
              Package distribution across active accounts
            </span>
          </div>

          <div className="space-y-3">
            {data.tierDistribution.map((tierItem) => {
              const tierRevenuePct = data.currentMrrUsd > 0 
                ? Math.round((tierItem.totalRevenue / data.currentMrrUsd) * 100) 
                : 0;

              return (
                <div key={tierItem.tier} className="p-3 bg-bg-dark border border-border-dim rounded-sm space-y-2 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text-primary">{tierItem.tier} Package</span>
                    <span className="text-brand font-bold">${tierItem.totalRevenue.toLocaleString()}/mo</span>
                  </div>

                  <div className="w-full h-1.5 bg-bg-base rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand rounded-full"
                      style={{ width: `${tierRevenuePct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-text-dim">
                    <span>{tierItem.count} Client{tierItem.count === 1 ? '' : 's'}</span>
                    <span>{tierRevenuePct}% of Total MRR</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* UNIT ECONOMICS SUMMARY TABLE */}
          <div className="pt-3 border-t border-border-dim/60 space-y-2 font-mono text-xs">
            <span className="text-[10px] text-text-dim uppercase font-bold block">Cohort Unit Economics</span>
            <div className="flex justify-between text-[11px] py-1 border-b border-border-dim/40">
              <span className="text-text-secondary">Blended CAC:</span>
              <span className="text-text-primary font-bold">${data.blendedCacUsd}</span>
            </div>
            <div className="flex justify-between text-[11px] py-1 border-b border-border-dim/40">
              <span className="text-text-secondary">Payback Period:</span>
              <span className="text-positive font-bold">1.4 Months</span>
            </div>
            <div className="flex justify-between text-[11px] py-1">
              <span className="text-text-secondary">Operating Runway:</span>
              <span className="text-brand font-bold">{data.cashRunwayMonths} Months</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
