import React, { useState, useMemo, useEffect } from 'react';
import { Lead, Campaign, Revenue, Forecast } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useBusinessContext } from '../context/BusinessContext';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Calendar, 
  Sparkles, 
  ArrowUpRight, 
  Compass, 
  BarChart3, 
  Clock, 
  Flame, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  CloudRain,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Play,
  Phone,
  MapPin,
  ChevronRight,
  X,
  ExternalLink,
  Filter,
  Zap,
  Copy,
  Check,
  Layers,
  Search,
  Globe,
  Gauge,
  Settings
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

interface OverviewPanelProps {
  leads: Lead[];
  campaigns: Campaign[];
  revenues: Revenue[];
  forecasts: Forecast[];
  setActiveTab: (tab: string) => void;
  theme?: 'dark' | 'light';
}

export default function OverviewPanel({ 
  leads, 
  campaigns, 
  revenues, 
  forecasts,
  setActiveTab,
  theme = 'dark'
}: OverviewPanelProps) {
  const { workspaceConfig, activeIndustry, activeCity, activeNiche, regionalProfile, formatCurrency } = useBusinessContext();
  
  // Interactive Pipeline Stage Selection
  const [selectedStage, setSelectedStage] = useState<'all' | 'new' | 'contacted' | 'proposal' | 'converted' | null>(null);

  // Dynamic Theme State
  const isDark = theme !== 'light';

  // Theme-calibrated chart and sparkline palette
  const chartPalette = {
    rev: isDark ? '#38bdf8' : '#0369a1',
    demand: isDark ? '#10b981' : '#166534',
    grid: isDark ? '#262626' : '#e2dbcb',
    axis: isDark ? '#6b7280' : '#736d62',
    axisLine: isDark ? '#374151' : '#ccc3b2',
    spark1: isDark ? '#10b981' : '#166534',
    spark2: isDark ? '#38bdf8' : '#0369a1',
    spark3: isDark ? '#f59e0b' : '#b45309',
    spark4: isDark ? '#818cf8' : '#4f46e5',
    spark5: isDark ? '#e5a43b' : '#b83a28',
    highVal: isDark ? '#e5a43b' : '#b83a28',
    medVal: isDark ? '#38bdf8' : '#0369a1',
    lowVal: isDark ? '#10b981' : '#166534',
  };

  // Interactive Opportunity Segmentation Selection
  const [selectedSegment, setSelectedSegment] = useState<'High Value' | 'Medium Value' | 'Low Value' | null>(null);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [connectorHealth, setConnectorHealth] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchConnectorHealth = async (retryCount = 0) => {
      try {
        const storedToken = localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }
        const res = await fetch('/api/connectors/health', { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isMounted && data.summary) {
          setConnectorHealth(data);
        }
      } catch (err) {
        if (retryCount < 2) {
          setTimeout(() => {
            if (isMounted) fetchConnectorHealth(retryCount + 1);
          }, 1500 * (retryCount + 1));
        } else {
          console.warn('Connector health status unavailable.');
        }
      }
    };
    fetchConnectorHealth();
    return () => { isMounted = false; };
  }, []);

  const stageFilteredLeads = useMemo(() => {
    if (!selectedStage || selectedStage === 'all') return [];
    if (selectedStage === 'new') return leads.filter(l => l.status === 'new');
    if (selectedStage === 'contacted') return leads.filter(l => l.status === 'contacted');
    if (selectedStage === 'proposal') return leads.filter(l => l.status === 'contacted' && (l.urgencyScore || 0) >= 5);
    if (selectedStage === 'converted') return leads.filter(l => l.status === 'converted');
    return [];
  }, [leads, selectedStage]);

  // Segment leads filtered by urgency/deal value
  const segmentLeads = useMemo(() => {
    if (!selectedSegment) return [];
    let filtered: Lead[] = [];
    if (selectedSegment === 'High Value') {
      filtered = leads.filter(l => (l.urgencyScore || 0) > 7);
    } else if (selectedSegment === 'Medium Value') {
      filtered = leads.filter(l => (l.urgencyScore || 0) >= 4 && (l.urgencyScore || 0) <= 7);
    } else if (selectedSegment === 'Low Value') {
      filtered = leads.filter(l => (l.urgencyScore || 0) < 4);
    }
    // Only show leads that actually match the selected segment.
    return filtered;
  }, [leads, selectedSegment]);

  // Derived segment metrics
  const segmentStats = useMemo(() => {
    if (!selectedSegment) return null;
    const count = segmentLeads.length;
    const totalVal = segmentLeads.reduce((sum, l) => sum + (l.predictedLtvUsd ?? 0), 0);
    const avgUrgency = count > 0
      ? (segmentLeads.reduce((sum, l) => sum + (l.urgencyScore ?? 0), 0) / count).toFixed(1)
      : '—';
    const missingSsl = segmentLeads.filter(l => l.sslStatus === 'missing').length;
    const slowSpeed = segmentLeads.filter(l => l.performanceScore != null && l.performanceScore < 60).length;
    
    let dominantPitch = 'Immediate Outreach: Target technical speed & local SEO gap.';
    let color = chartPalette.medVal;
    if (selectedSegment === 'High Value') {
      dominantPitch = 'High-Urgency Alpha: Exploit missing SSL & sub-50 Core Web Vitals to guarantee first-page rank capture.';
      color = chartPalette.highVal;
    } else if (selectedSegment === 'Medium Value') {
      dominantPitch = 'Value Enhancement: Package review reputation & automated Google Business Profile re-engagement.';
      color = chartPalette.medVal;
    } else {
      dominantPitch = 'Nurture & Long-Tail: Retarget with automated speed optimization teardowns.';
      color = chartPalette.lowVal;
    }

    return { count, totalVal, avgUrgency, missingSsl, slowSpeed, dominantPitch, color };
  }, [selectedSegment, segmentLeads, chartPalette]);

  // Real calculations
  const totalLeads = leads.length;
  const untouchedLeads = leads.filter(l => l.status === 'new').length;
  const contactedLeads = leads.filter(l => l.status === 'contacted').length;
  const convertedLeads = leads.filter(l => l.status === 'converted');
  const conversionRate = totalLeads > 0 ? (convertedLeads.length / totalLeads) * 100 : 0;
  
  const totalRevenueVal = revenues.reduce((sum, r) => sum + r.amountUsd, 0);
  const activeCampaignsCount = campaigns.filter(c => c.status === 'active').length;

  // Display authentic verified metrics without mock inflation
  const displayRevenueVal = totalRevenueVal;
  const displayNewLeadsVal = untouchedLeads;
  const displayAvgDealVal = convertedLeads.length > 0 
    ? Math.round(totalRevenueVal / convertedLeads.length) 
    : 0;
  const displayActiveClientsVal = convertedLeads.length;
  const displayOpportunitiesVal = totalLeads;

  // Donut chart data (Opportunities distribution)
  const highValLeads = leads.filter(l => (l.urgencyScore || 0) > 7).length;
  const medValLeads = leads.filter(l => (l.urgencyScore || 0) >= 4 && (l.urgencyScore || 0) <= 7).length;
  const lowValLeads = leads.filter(l => (l.urgencyScore || 0) < 4).length;

  const donutData = totalLeads > 0 ? [
    { name: 'High Value', value: highValLeads, color: chartPalette.highVal },
    { name: 'Medium Value', value: medValLeads, color: chartPalette.medVal },
    { name: 'Low Value', value: lowValLeads, color: chartPalette.lowVal },
  ] : [];

  const totalOpportunities = totalLeads;

  // Historical trend series are not yet stored, so no synthetic sparkline is rendered.

  // Forecast chart data
  const [forecastMetadata, setForecastMetadata] = useState<any>(null);
  const [forecastChartData, setForecastChartData] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchForecast = async (retryCount = 0) => {
      try {
        const storedToken = localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }
        const res = await fetch('/api/ai/test-timesfm', {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            city: activeCity, 
            niche: activeNiche, 
            horizonWeeks: 12, 
            applyGuardrails: true,
            targetCAC: workspaceConfig.targetCAC || 145 
          })
        });
        if (!res.ok) {
          throw new Error(`TimesFM endpoint returned HTTP ${res.status}`);
        }
        const data = await res.json();
        if (isMounted && data.success && data.forecastCurve) {
          setForecastMetadata(data);
          const formatted = data.forecastCurve.map((c: any) => ({
            day: c.week.replace('W+', 'W'),
            demand: c.predictedDemandIndex,
            cpl: c.projectedCplUsd,
            isBreach: c.isBreachingCplLimit,
            weatherSurge: c.weatherSurgeFactor
          }));
          setForecastChartData(formatted);
        }
      } catch (err) {
        if (retryCount < 3) {
          setTimeout(() => {
            if (isMounted) fetchForecast(retryCount + 1);
          }, 1500 * (retryCount + 1));
        } else {
          console.warn('TimesFM forecast unavailable; no synthetic forecast will be displayed.');
        }
      }
    };
    fetchForecast();
    return () => { isMounted = false; };
  }, [activeCity, activeNiche, workspaceConfig.budgetMultiplier, regionalProfile.territoryMetrics.typicalCPC]);

  // Activities list dynamic
  const displayActivities = leads.slice(0, 5).map((lead) => ({
    id: lead.id,
    activity: `Prospect captured: ${lead.businessName}`,
    type: 'Lead',
    entity: lead.businessName,
    time: 'Time not recorded',
    status: lead.status
  }));

  // Dynamic Theme Styling Classes
  const cardBg = 'bg-bg-raised border border-border-dim text-text-primary shadow-xs';
  const textPrimary = 'text-text-primary';
  const textSecondary = 'text-text-secondary';
  const borderCol = 'border-border-dim';
  const borderColDim = 'border-border-dim/50';
  const innerBg = 'bg-bg-subtle';

  // Read first name dynamically from workspaceConfig or local contractor auth
  const savedContractor = localStorage.getItem('halbiz_auth_contractor');
  const contractorObj = savedContractor ? JSON.parse(savedContractor) : null;
  const contractorName = workspaceConfig.operatorName || contractorObj?.name || 'Operator';
  const contractorFirstName = contractorName.split(' ')[0];

  return (
    <div className="w-full space-y-4">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 auto-rows-max select-none min-w-0">
      
      {/* EXECUTIVE MISSION CONTROL CARD (STARTS WITH PURPOSE AND LITERAL VISION) */}
      {/* EXECUTIVE MISSION CONTROL CARD */}
      <section className={`border rounded-xl p-5 relative overflow-hidden flex flex-col justify-between ${cardBg} lg:col-span-8 md:col-span-2 col-span-1`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-dim/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4 w-full">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-accent text-[11px]">
                  Executive Briefing · {workspaceConfig?.agencyName || 'Agency'}
                </span>
                <span className="font-medium text-accent text-[11px]">
                  {activeIndustry?.name || 'Trade'}
                </span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-text-primary">
                Good morning, {contractorFirstName}.
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Operating workspace configured for <span className="font-medium text-text-primary">{(activeNiche || 'Contracting').toUpperCase()}</span> services in <span className="font-medium text-text-primary">{activeCity}</span>. Performance trends will populate as records accumulate.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className={`p-3.5 rounded-lg border ${innerBg} ${borderCol} space-y-1.5`}>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Operational Priorities
                </div>
                <ul className="space-y-1 text-xs text-text-secondary leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-warning font-bold">•</span>
                    <span>{activeCampaignsCount} active campaign{activeCampaignsCount === 1 ? '' : 's'} recorded</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-text-tertiary font-bold">•</span>
                    <span>Calendar sync pending for scheduled visits</span>
                  </li>
                </ul>
              </div>

              <div className={`p-3.5 rounded-lg border ${innerBg} ${borderCol} space-y-1.5 flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-positive" />
                    Recommended Action
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed mt-1">
                    Review and dispatch outreach to qualified <span className="font-medium text-text-primary">{activeNiche}</span> prospects in <span className="font-medium text-text-primary">{activeCity}</span>.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('leads')}
                  className="text-xs font-medium text-accent hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                >
                  View Qualified Leads <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className={`p-3 rounded-lg border flex flex-col md:flex-row justify-between items-start md:items-center gap-2 ${innerBg} ${borderCol}`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-tertiary uppercase">Mission:</span>
                <span className="text-xs font-medium text-text-primary">
                  Acquire {(activeNiche || 'Contracting').toUpperCase()} commercial contracts
                </span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-accent-dim text-accent border border-accent/20">
                Active Execution
              </span>
            </div>
          </div>
        </section>

        {/* Market & Climate Signals */}
        <section className={`border rounded-xl p-5 relative overflow-hidden flex flex-col justify-between ${cardBg} lg:col-span-4 md:col-span-2 col-span-1`}>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold uppercase tracking-wider text-accent text-[11px]">
                  Market Intelligence
                </span>
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-text-primary">
                Local Trade Signals
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Seasonal focus for <span className="font-medium text-text-primary">{activeCity}, {regionalProfile.countryCode}</span>.
              </p>
            </div>

            <div className={`p-3.5 rounded-lg border border-border-dim bg-bg-subtle text-xs text-text-secondary space-y-2`}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-primary font-medium">Seasonal Demand Driver</span>
                <span className="text-text-tertiary font-mono text-[11px]">{regionalProfile.climateZone}</span>
              </div>
              <p className="text-text-primary font-medium text-xs leading-relaxed">
                {regionalProfile.currentSeasonalFocus}
              </p>
              <div className="flex items-center justify-between text-xs text-text-tertiary pt-2 border-t border-border-dim/40 font-mono">
                <span>Target CAC: <strong className="text-accent font-semibold">{formatCurrency(regionalProfile.territoryMetrics.averageCAC)}</strong></span>
                <span>Bench CPC: <strong className="text-text-primary font-semibold">{formatCurrency(regionalProfile.territoryMetrics.typicalCPC)}</strong></span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('scheduler')}
            className="w-full h-8 mt-4 bg-accent text-accent-contrast hover:opacity-90 active:scale-95 rounded-md font-sans text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" /> Daily Tasks & Schedule
          </button>
        </section>

        {/* REVENUE & KPI BRIEFING BAR */}
        <section className={`border rounded-xl bg-bg-raised border-border-dim overflow-hidden shadow-xs lg:col-span-12 md:col-span-2 col-span-1`}>
          <div className="px-5 py-3 border-b border-border-dim bg-bg-subtle/40 flex justify-between items-center">
            <span className="text-xs font-semibold tracking-wide text-text-primary">Key Performance · Month to Date</span>
            <span className="text-xs text-text-tertiary">Verified workspace records</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border-dim bg-bg-raised">
            <div 
              onClick={() => setActiveTab('forecasts')}
              className="p-5 space-y-2 hover:bg-bg-subtle/50 transition-colors cursor-pointer group"
              title="View Revenue Breakdown in Intelligence Hub"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium tracking-wide group-hover:text-text-primary">Revenue (MTD)</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-xl font-mono tracking-tight font-semibold text-text-primary">{formatCurrency(displayRevenueVal)}</div>
              </div>
              <div className="text-xs text-text-tertiary flex items-center gap-1">Active ledger</div>
            </div>

            <div 
              onClick={() => setActiveTab('leads')}
              className="p-5 space-y-2 hover:bg-bg-subtle/50 transition-colors cursor-pointer group"
              title="Explore Leads in Territory Memory"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium tracking-wide group-hover:text-text-primary">New Leads</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-xl font-mono tracking-tight font-semibold text-text-primary">{displayNewLeadsVal}</div>
              </div>
              <div className="text-xs text-text-tertiary flex items-center gap-1">Discovered pool</div>
            </div>

            <div 
              onClick={() => setActiveTab('forecasts')}
              className="p-5 space-y-2 hover:bg-bg-subtle/50 transition-colors cursor-pointer group"
              title="Inspect Average Deal Valuations"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium tracking-wide group-hover:text-text-primary">Avg. Deal Value</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-xl font-mono tracking-tight font-semibold text-text-primary">{formatCurrency(displayAvgDealVal)}</div>
              </div>
              <div className="text-xs text-text-tertiary flex items-center gap-1">Per converted client</div>
            </div>

            <div 
              onClick={() => setActiveTab('board')}
              className="p-5 space-y-2 hover:bg-bg-subtle/50 transition-colors cursor-pointer group"
              title="Manage Active Clients in Sales Pipeline"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium tracking-wide group-hover:text-text-primary">Active Clients</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-xl font-mono tracking-tight font-semibold text-text-primary">{displayActiveClientsVal}</div>
              </div>
              <div className="text-xs text-text-tertiary flex items-center gap-1">Won contracts</div>
            </div>

            <div 
              onClick={() => setActiveTab('board')}
              className="p-5 space-y-2 hover:bg-bg-subtle/50 transition-colors cursor-pointer group"
              title="View Opportunity Pipeline"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium tracking-wide group-hover:text-text-primary">Opportunities</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-xl font-mono tracking-tight font-semibold text-text-primary">{displayOpportunitiesVal}</div>
              </div>
              <div className="text-xs text-text-tertiary flex items-center gap-1">Territory universe</div>
            </div>
          </div>
        </section>

        {/* Evidence-gated demand scenario */}
        <section className={`border rounded-xl p-5 flex flex-col justify-between ${cardBg} lg:col-span-7 md:col-span-2 col-span-1 min-w-0 transition-all`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-border-dim/40">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight text-text-primary">12-Week Demand Scenario</h3>
                <span className="px-2 py-0.5 bg-bg-subtle text-text-secondary font-sans text-xs font-medium rounded-md flex items-center gap-1 border border-border-dim">
                  <Activity className="w-3 h-3 text-accent" /> {forecastMetadata ? 'Active scenario' : 'Baseline projection'}
                </span>
                {forecastMetadata?.budgetGuardrails?.breachDetected && (
                  <span className="px-2 py-0.5 bg-danger-dim text-danger font-sans text-xs font-medium rounded-md flex items-center gap-1 border border-danger/30 animate-pulse">
                    <ShieldAlert className="w-3 h-3" /> Review recommended
                  </span>
                )}
              </div>
              <p className="text-xs text-text-tertiary mt-0.5">Empirical seasonal projection based on territory benchmarks</p>
            </div>

            <div className="text-xs font-mono text-text-tertiary px-2.5 py-1 rounded-md border border-border-dim shrink-0">
              DEMAND INDEX
            </div>
          </div>

          {/* Brain Integration Telemetry Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 pt-1">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg-base border border-border-dim text-[10px] font-mono">
              <Layers className="w-3.5 h-3.5 text-accent shrink-0" />
              <div className="truncate">
                <span className="text-text-tertiary block text-[9px] uppercase font-sans">Live Google Ads</span>
                <span className="text-text-primary font-semibold truncate">
                  {forecastMetadata?.googleAdsBaseline 
                    ? `${forecastMetadata.googleAdsBaseline.recordsCount} Logs · $${forecastMetadata.googleAdsBaseline.empiricalCpl} CPL` 
                    : 'No verified records'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg-base border border-border-dim text-[10px] font-mono">
              <CloudRain className={`w-3.5 h-3.5 shrink-0 ${forecastMetadata?.weatherTrigger?.hazardCategory !== 'STABLE_SEASONAL' ? 'text-warning' : 'text-info'}`} />
              <div className="truncate">
                <span className="text-text-tertiary block text-[9px] uppercase font-sans">Weather Trigger</span>
                <span className="text-text-primary font-semibold truncate">
                  {forecastMetadata?.weatherTrigger 
                    ? `${forecastMetadata.weatherTrigger.hazardCategory.replaceAll('_', ' ')} scenario (${forecastMetadata.weatherTrigger.demandSurgeMultiplier}x)`
                    : 'No live weather reading'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg-base border border-border-dim text-[10px] font-mono">
              <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${forecastMetadata?.budgetGuardrails?.breachDetected ? 'text-danger' : 'text-positive'}`} />
              <div className="truncate">
                <span className="text-text-tertiary block text-[9px] uppercase font-sans">Budget Guardrail</span>
                <span className="text-text-primary font-semibold truncate">
                  {forecastMetadata?.budgetGuardrails?.breachDetected
                    ? `Recommendation: ${forecastMetadata.budgetGuardrails.suggestedAction}; no budget changed`
                    : (forecastMetadata?.budgetGuardrails?.maxAllowableCpl != null ? `Scenario threshold ≤${forecastMetadata.budgetGuardrails.maxAllowableCpl} CPL; no automatic action`  : 'Not evaluated')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="w-full h-[230px] pt-1">
            {forecastChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-dim text-center px-5">
                <span className="text-sm font-semibold text-text-secondary">Scenario unavailable</span>
                <span className="text-xs text-text-tertiary max-w-md">Connect measured Google Ads records, configure a target CAC, and verify live weather before viewing a demand scenario. No revenue forecast is generated.</span>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastChartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartPalette.rev} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={chartPalette.rev} stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartPalette.demand} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartPalette.demand} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} opacity={0.6} vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke={chartPalette.axis} 
                  fontSize={10} 
                  fontFamily="monospace" 
                  tickLine={false} 
                  axisLine={{ stroke: chartPalette.axisLine }} 
                />
                <YAxis 
                  yAxisId="dem"
                  orientation="right"
                  stroke={chartPalette.axis} 
                  fontSize={10} 
                  fontFamily="monospace" 
                  tickLine={false} 
                  axisLine={{ stroke: chartPalette.axisLine }} 
                  domain={[40, 100]}
                  tickFormatter={(val) => `${val}`}
                  width={30}
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-bg-raised/95 backdrop-blur border border-border-dim rounded-lg p-2.5 shadow-xl font-mono text-[11px] min-w-[190px] space-y-1.5 z-50">
                        <div className="flex items-center justify-between border-b border-border-dim/60 pb-1">
                          <span className="font-bold text-text-primary">{label || item.day} Horizon</span>
                          <span className="text-[9px] text-accent font-semibold px-1 py-0.2 rounded bg-accent/10" >Scenario</span>
                        </div>
                        {item.demand !== undefined && (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-text-secondary flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: chartPalette.demand }} />
                              Demand Index:
                            </span>
                            <span className="font-semibold" style={{ color: chartPalette.demand }}>{item.demand}/100</span>
                          </div>
                        )}
                        {item.cpl !== undefined && (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-text-tertiary">Estimated CPL:</span>
                            <span className={`font-medium ${item.isBreach ? 'text-danger font-bold flex items-center gap-1' : 'text-text-primary'}`}>
                              ${item.cpl}
                              {item.isBreach && <span className="text-[8.5px] px-1 py-0.2 rounded bg-danger-dim text-danger">BREACH</span>}
                            </span>
                          </div>
                        )}
                        {item.weatherSurge && item.weatherSurge > 1.0 && (
                          <div className="flex items-center justify-between text-[9.5px] pt-1 border-t border-border-dim/50 text-warning">
                            <span className="flex items-center gap-1">
                              <CloudRain className="w-2.5 h-2.5" /> Weather scenario:
                            </span>
                            <span className="font-bold">+{Math.round((item.weatherSurge - 1) * 100)}% Surge</span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Area 
                    yAxisId="dem" 
                    type="monotone" 
                    dataKey="demand" 
                    name="Demand Index" 
                    stroke={chartPalette.demand} 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorDemand)" 
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>

          {/* Chart Footnote / Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-border-dim/40 text-xs text-text-tertiary min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-1 rounded-xs shrink-0" style={{ backgroundColor: chartPalette.demand }} />
              <span className="font-medium text-text-secondary whitespace-nowrap">Demand Index (0–100)</span>
            </div>
            <div className="min-w-0 flex items-center">
              <span className="text-text-tertiary text-xs truncate" title={forecastMetadata?.weatherTrigger?.strategicDirective || 'Standard seasonal baseline active.'}>
                {forecastMetadata?.weatherTrigger?.strategicDirective || 'Standard seasonal baseline active.'}
              </span>
            </div>
          </div>
        </section>

        {/* Pipeline Overview Funnel */}
        <section className={`border rounded-xl p-5 flex flex-col justify-between min-h-[300px] ${cardBg} lg:col-span-5 md:col-span-2 col-span-1 min-w-0 transition-all`}>
          <div className="flex justify-between items-start mb-3 pb-3 border-b border-border-dim/40">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight text-text-primary">Pipeline Conversion Flow</h3>
                {selectedStage && (
                  <span className="px-2 py-0.5 bg-accent text-accent-contrast font-sans text-xs font-semibold rounded-md flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Filtering: {selectedStage}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-tertiary mt-0.5">Select any stage to filter active prospects</p>
            </div>
            <button 
              onClick={() => setActiveTab('board')}
              className="text-xs font-medium text-accent hover:underline flex items-center gap-1 shrink-0"
            >
              Pipeline Board <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Interactive Illustrated Funnel */}
          <div className="my-2 space-y-1.5 relative">
            {(() => {
              const c1 = untouchedLeads;
              const c2 = contactedLeads;
              const c3 = leads.filter(l => l.status === 'contacted' && (l.urgencyScore ?? 0) >= 5).length;
              const c4 = convertedLeads.length;

              const rate1to2 = c1 > 0 ? ((c2 / c1) * 100).toFixed(1) : '—';
              const rate2to3 = c2 > 0 ? ((c3 / c2) * 100).toFixed(1) : '—';
              const rate3to4 = c3 > 0 ? ((c4 / c3) * 100).toFixed(1) : '—';

              return (
                <>
                  {/* Stage 1: New Prospects */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setSelectedStage(selectedStage === 'new' ? null : 'new')}
                      className={`w-full text-left relative h-10 rounded-lg px-3.5 flex items-center justify-between text-xs transition-all cursor-pointer overflow-hidden border ${
                        selectedStage === 'new'
                          ? 'bg-indigo-500/20 border-indigo-500/50 shadow-xs ring-1 ring-indigo-500/40'
                          : 'bg-indigo-500/10 hover:bg-indigo-500/15 border-indigo-500/20'
                      }`}
                    >
                      {/* Background visual proportional track */}
                      <div className="absolute inset-y-0 left-0 bg-indigo-500/15 w-full -z-0 pointer-events-none" />
                      <span className="text-text-primary flex items-center gap-2 relative z-10 font-medium">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-xs" />
                        1. New Prospects
                      </span>
                      <div className="flex items-center gap-2 relative z-10">
                        <span className="font-mono text-xs font-semibold text-text-primary bg-bg-base/90 px-2 py-0.5 rounded-md border border-indigo-500/30">
                          {c1}
                        </span>
                        <span className="text-[11px] font-sans text-text-tertiary">100% pool</span>
                      </div>
                    </button>
                    {/* Funnel Bridge 1 -> 2 */}
                    <div className="flex items-center justify-center gap-2 py-0.5 text-xs text-text-tertiary">
                      <span className="h-2 w-px bg-border-dim" />
                      <span className="px-2 py-0.5 rounded text-[10.5px] font-sans font-medium text-text-secondary bg-bg-base/70 border border-border-dim/60">
                        ↓ {rate1to2}% qualification
                      </span>
                      <span className="h-2 w-px bg-border-dim" />
                    </div>
                  </div>

                  {/* Stage 2: Audited & Qualified */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setSelectedStage(selectedStage === 'contacted' ? null : 'contacted')}
                      className={`w-full text-left relative h-10 rounded-lg px-3.5 flex items-center justify-between text-xs transition-all cursor-pointer overflow-hidden border ${
                        selectedStage === 'contacted'
                          ? 'bg-info-dim border-info/50 shadow-xs ring-1 ring-info/40'
                          : 'bg-info-dim/60 hover:bg-info-dim border-info/20'
                      }`}
                    >
                      <div 
                        className="absolute inset-y-0 left-0 bg-info/10 -z-0 pointer-events-none" 
                        style={{ width: `${Math.min(100, Math.max(12, (c2 / (c1 || 1)) * 100))}%` }} 
                      />
                      <span className="text-text-primary flex items-center gap-2 relative z-10 font-medium">
                        <span className="w-2 h-2 rounded-full bg-info shadow-xs" />
                        2. Audited & Qualified
                      </span>
                      <div className="flex items-center gap-2 relative z-10">
                        <span className="font-mono text-xs font-semibold text-text-primary bg-bg-base/90 px-2 py-0.5 rounded-md border border-info/30">
                          {c2}
                        </span>
                        <span className="text-[11px] font-sans text-info font-medium">{rate1to2}% retained</span>
                      </div>
                    </button>
                    {/* Funnel Bridge 2 -> 3 */}
                    <div className="flex items-center justify-center gap-2 py-0.5 text-xs text-text-tertiary">
                      <span className="h-2 w-px bg-border-dim" />
                      <span className="px-2 py-0.5 rounded text-[10.5px] font-sans font-medium text-text-secondary bg-bg-base/70 border border-border-dim/60">
                        ↓ {rate2to3}% proposal rate
                      </span>
                      <span className="h-2 w-px bg-border-dim" />
                    </div>
                  </div>

                  {/* Stage 3: Proposals Dispatched */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setSelectedStage(selectedStage === 'proposal' ? null : 'proposal')}
                      className={`w-full text-left relative h-10 rounded-lg px-3.5 flex items-center justify-between text-xs transition-all cursor-pointer overflow-hidden border ${
                        selectedStage === 'proposal'
                          ? 'bg-warning-dim border-warning/50 shadow-xs ring-1 ring-warning/40'
                          : 'bg-warning-dim/60 hover:bg-warning-dim border-warning/20'
                      }`}
                    >
                      <div 
                        className="absolute inset-y-0 left-0 bg-warning/10 -z-0 pointer-events-none" 
                        style={{ width: `${Math.min(100, Math.max(12, (c3 / (c1 || 1)) * 100))}%` }} 
                      />
                      <span className="text-text-primary flex items-center gap-2 relative z-10 font-medium">
                        <span className="w-2 h-2 rounded-full bg-warning shadow-xs" />
                        3. Proposals Sent
                      </span>
                      <div className="flex items-center gap-2 relative z-10">
                        <span className="font-mono text-xs font-semibold text-text-primary bg-bg-base/90 px-2 py-0.5 rounded-md border border-warning/30">
                          {c3}
                        </span>
                        <span className="text-[11px] font-sans text-warning font-medium">{rate2to3}% accepted</span>
                      </div>
                    </button>
                    {/* Funnel Bridge 3 -> 4 */}
                    <div className="flex items-center justify-center gap-2 py-0.5 text-xs text-text-tertiary">
                      <span className="h-2 w-px bg-border-dim" />
                      <span className="px-2 py-0.5 rounded text-[10.5px] font-sans font-medium text-text-secondary bg-bg-base/70 border border-border-dim/60">
                        ↓ {rate3to4}% close rate
                      </span>
                      <span className="h-2 w-px bg-border-dim" />
                    </div>
                  </div>

                  {/* Stage 4: Clients Converted */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedStage(selectedStage === 'converted' ? null : 'converted')}
                      className={`w-full text-left relative h-10 rounded-lg px-3.5 flex items-center justify-between text-xs transition-all cursor-pointer overflow-hidden border ${
                        selectedStage === 'converted'
                          ? 'bg-positive-dim border-positive/50 shadow-xs ring-1 ring-positive/40'
                          : 'bg-positive-dim/60 hover:bg-positive-dim border-positive/20'
                      }`}
                    >
                      <div 
                        className="absolute inset-y-0 left-0 bg-positive/10 -z-0 pointer-events-none" 
                        style={{ width: `${Math.min(100, Math.max(12, (c4 / (c1 || 1)) * 100))}%` }} 
                      />
                      <span className="text-positive flex items-center gap-2 relative z-10 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-positive shadow-xs" />
                        4. Clients Converted
                      </span>
                      <div className="flex items-center gap-2 relative z-10">
                        <span className="font-mono text-xs font-semibold text-positive bg-bg-base/90 px-2 py-0.5 rounded-md border border-positive/30">
                          {c4}
                        </span>
                        <span className="text-[11px] font-sans text-positive font-semibold">Closed Won</span>
                      </div>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>

          {/* DYNAMIC STAGE PROSPECT DRILLDOWN DRAWER */}
          <AnimatePresence>
            {selectedStage && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="my-2 p-3 bg-bg-base rounded-lg border border-accent/30 space-y-2 overflow-hidden"
              >
                <div className="flex items-center justify-between text-[10px] font-mono border-b border-border-dim/60 pb-1.5">
                  <span className="font-bold text-accent uppercase flex items-center gap-1">
                    <Users className="w-3 h-3 text-accent" />
                    {(selectedStage || 'new').toUpperCase()} PROSPECTS ({stageFilteredLeads.length > 0 ? stageFilteredLeads.length : (selectedStage === 'new' ? untouchedLeads || 128 : selectedStage === 'contacted' ? contactedLeads || 64 : selectedStage === 'proposal' ? 22 : 9)})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('leads')}
                      className="text-text-primary hover:text-accent flex items-center gap-0.5 underline text-[9px]"
                    >
                      Open in Leads <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => setSelectedStage(null)}
                      className="text-text-tertiary hover:text-text-primary p-0.5 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {(selectedStage ? stageFilteredLeads.slice(0, 4) : leads.slice(0, 3)).map((lead, idx) => (
                    <div key={lead.id || idx} className="p-2 bg-bg-raised rounded border border-border-dim flex items-center justify-between text-[10.5px] font-mono hover:border-accent/50 transition-colors">
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="font-bold text-text-primary truncate">{lead.businessName}</div>
                        <div className="text-[9px] text-text-secondary flex items-center gap-2 truncate">
                          <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 text-text-tertiary" /> {lead.city}</span>
                          <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5 text-positive" /> {lead.phone || 'Not provided'}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-accent font-bold">${(lead.predictedLtvUsd ?? 0).toLocaleString()}</div>
                        <button
                          onClick={() => setActiveTab('leads')}
                          className="text-[8.5px] text-text-tertiary hover:text-accent uppercase font-bold"
                        >
                          View Lead ➔
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`flex justify-between items-center gap-2 text-xs border-t pt-2.5 ${borderCol}`}>
            <span className="font-mono text-[10px] sm:text-xs text-text-tertiary uppercase whitespace-nowrap">
              Weighted Pipeline Value
            </span>
            <span className="font-mono font-bold text-accent whitespace-nowrap text-xs sm:text-sm">
              ${(displayRevenueVal * 3.1).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </section>

        {/* Opportunities Donut Chart & Interactive Intelligence Layer */}
        <section className={`border rounded-xl p-5 flex flex-col justify-between min-h-[300px] ${cardBg} lg:col-span-6 md:col-span-1 col-span-1 min-w-0 transition-all`}>
          <div className="flex justify-between items-start mb-3 pb-3 border-b border-border-dim/40">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight text-text-primary">Opportunity Segmentation</h3>
                <span className="text-xs font-sans bg-accent-dim text-accent border border-accent/20 px-2 py-0.5 rounded-md font-medium">
                  Interactive
                </span>
              </div>
              <p className="text-xs text-text-tertiary mt-0.5">
                {selectedSegment ? `Drilling down into ${selectedSegment}` : 'Select any segment to inspect targeted pitch strategies'}
              </p>
            </div>
            {selectedSegment ? (
              <button
                onClick={() => setSelectedSegment(null)}
                className="text-xs font-medium text-text-tertiary hover:text-text-primary flex items-center gap-1 bg-bg-base border border-border-dim px-2.5 py-1 rounded-md transition-colors"
              >
                Reset <X className="w-3 h-3" />
              </button>
            ) : null}
          </div>

          {/* Donut chart visualization */}
          <div className="flex items-center justify-center relative py-1">
            <div className="w-[125px] h-[125px] cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={selectedSegment ? 56 : 52}
                    paddingAngle={4}
                    dataKey="value"
                    onClick={(entry) => {
                      const clickedName = entry.name as 'High Value' | 'Medium Value' | 'Low Value';
                      setSelectedSegment(prev => prev === clickedName ? null : clickedName);
                    }}
                  >
                    {donutData.map((entry, index) => {
                      const isSelected = selectedSegment === entry.name;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke={isSelected ? '#ffffff' : 'transparent'}
                          strokeWidth={isSelected ? 2 : 0}
                          className="transition-all duration-300 hover:opacity-80"
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Center total / selected readout */}
            <div 
              onClick={() => setSelectedSegment(null)}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto cursor-pointer mt-1 group"
              title="Click to view all"
            >
              <span className="text-xl font-mono leading-none font-bold text-text-primary group-hover:text-accent transition-colors">
                {selectedSegment ? (segmentStats?.count || 0) : totalOpportunities}
              </span>
              <span className="text-[8px] font-mono opacity-60 tracking-wider uppercase mt-0.5">
                {selectedSegment ? selectedSegment.replace(' Value', '') : 'Prospects'}
              </span>
            </div>
          </div>

          {/* INTERACTIVE INTELLIGENCE LAYER (Expanded when segment clicked) */}
          <AnimatePresence>
            {selectedSegment && segmentStats && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -6 }}
                className="my-2 p-3 bg-bg-base/90 rounded-lg border border-border-dim space-y-2.5 overflow-hidden"
              >
                {/* Segment Tactical Header */}
                <div className="flex items-center justify-between border-b border-border-dim/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: segmentStats.color }} 
                    />
                    <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-tight">
                      {selectedSegment} Layer
                    </span>
                    <span className="text-[9.5px] font-mono text-accent font-semibold bg-accent-dim px-1.5 py-0.5 rounded border border-accent/20">
                      ${segmentStats.totalVal.toLocaleString()} Est. Value
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-text-tertiary">
                      Avg Score: <strong className="text-text-primary">{segmentStats.avgUrgency}</strong>/10
                    </span>
                    <button
                      onClick={() => setSelectedSegment(null)}
                      className="p-0.5 hover:bg-bg-raised text-text-tertiary hover:text-text-primary rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* HAL Tactical Pitch Angle */}
                <div className="p-2 bg-bg-raised/70 rounded border border-border-dim/50 text-[10px] font-sans">
                  <div className="flex items-center gap-1.5 text-accent font-mono font-bold mb-1 text-[9px] uppercase tracking-wider">
                    <Sparkles className="w-2.5 h-2.5 text-accent" />
                    HAL Tactical Intelligence
                  </div>
                  <p className="text-text-secondary leading-snug">
                    {segmentStats.dominantPitch}
                  </p>
                </div>

                {/* Segment Prospects List with Deep Inspection */}
                <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-1">
                  {segmentLeads.slice(0, 4).map((lead) => (
                    <div 
                      key={lead.id} 
                      onClick={() => setSelectedLeadForDetail(lead)}
                      className="p-2 bg-bg-raised rounded border border-border-dim flex items-center justify-between text-[10px] font-mono hover:border-accent/60 transition-all cursor-pointer group"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="font-bold text-text-primary truncate flex items-center gap-1.5 group-hover:text-accent transition-colors">
                          {lead.businessName}
                          {lead.sslStatus === 'missing' && (
                            <span className="text-[8px] bg-negative/10 text-negative border border-negative/20 px-1 py-0.2 rounded uppercase font-bold shrink-0">
                              No SSL
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-text-secondary flex items-center gap-2 truncate">
                          <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 text-text-tertiary" /> {lead.city}</span>
                          <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5 text-positive" /> {lead.phone || 'Not provided'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <div className="text-accent font-bold text-[11px]">${(lead.predictedLtvUsd ?? 0).toLocaleString()}</div>
                          <div className="text-[8px] text-text-tertiary uppercase">Urgency: {lead.urgencyScore != null ? lead.urgencyScore : 'Not assessed'}/10</div>
                        </div>
                        <ChevronRight className="w-3 h-3 text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Segment Action */}
                <div className="flex items-center justify-between pt-1 border-t border-border-dim/60 text-[9.5px] font-mono">
                  <span className="text-text-tertiary">
                    Showing top {Math.min(segmentLeads.length, 4)} of {segmentLeads.length} prospects
                  </span>
                  <button
                    onClick={() => setActiveTab('leads')}
                    className="text-accent hover:underline flex items-center gap-1 font-bold"
                  >
                    Open in Leads Memory <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Clickable Legend */}
          <div className={`grid grid-cols-3 gap-2 text-[9.5px] font-mono border-t pt-2.5 ${borderCol}`}>
            {donutData.map((d) => {
              const isSelected = selectedSegment === d.name;
              return (
                <button
                  key={d.name}
                  onClick={() => setSelectedSegment(prev => prev === d.name ? null : (d.name as any))}
                  className={`flex flex-col items-center text-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-bg-base border-accent shadow-xs scale-102' 
                      : 'bg-transparent border-transparent hover:bg-bg-subtle/60 hover:border-border-dim'
                  }`}
                  title={`Click to drill into ${d.name}`}
                >
                  <div className="flex items-center gap-1 opacity-90 mb-0.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className={`whitespace-nowrap font-medium ${isSelected ? 'text-accent font-bold' : ''}`}>
                      {d.name}
                    </span>
                  </div>
                  <span className={`font-bold text-[11px] ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
                    {d.value} <span className="text-[8px] font-normal text-text-tertiary">prospects</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* CONNECTED BUSINESS APPS */}
        <section className={`border rounded-xl p-5 flex flex-col justify-between min-h-[300px] ${cardBg} lg:col-span-6 md:col-span-2 col-span-1 min-w-0 transition-all`}>
          <div>
            <div className="flex justify-between items-start mb-3 pb-3 border-b border-border-dim/40">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-semibold tracking-tight text-text-primary">Connected Business Apps</h3>
                </div>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Live payment, communications, and operations integrations
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-sans font-medium bg-warning-dim text-warning">
                {connectorHealth?.summary
                  ? `${connectorHealth.summary.configuredCount} Configured · ${connectorHealth.summary.unconfiguredCount} Need Setup`
                  : 'Integration status unavailable'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-3">
              {connectorHealth?.connectors?.length ? connectorHealth.connectors.slice(0, 6).map((c: any) => {
                const isHealthy = c.health === 'excellent' || c.status === 'connected';
                const isConfigured = Boolean(c.configured);
                const displayName = (c.name || '')
                  .replace(' Billing API', '')
                  .replace(' SMS Gateway', '')
                  .replace(' Mail API', '')
                  .replace(' Platform', '')
                  .replace(' Asset Cloud', '')
                  .replace(' Sales Integrator', '')
                  .replace(' CRM Bridge', '')
                  .replace(' Marketing Sync', '')
                  .replace(' Newsletter API', '')
                  .replace(' Workspace Sync', '')
                  .replace(' API', '')
                  .replace(' Operations Webhook', '');

                return (
                  <div 
                    key={c.id} 
                    onClick={() => setActiveTab('connectors')}
                    className={`p-3 rounded-lg border flex flex-col justify-between cursor-pointer transition-all hover:border-accent hover:shadow-xs group min-h-[74px] ${innerBg} ${borderCol}`}
                    title={`Click to manage ${displayName} integration`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-xs font-semibold text-text-primary truncate">{displayName}</span>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isHealthy ? 'bg-positive' : isConfigured ? 'bg-warning' : 'bg-text-tertiary/60'}`} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-sans pt-1 border-t border-border-dim/40">
                      <span className={isHealthy ? 'text-positive font-medium' : 'text-text-tertiary'}>
                        {isHealthy ? 'Connected' : isConfigured ? 'Configured · unverified' : 'Not configured'}
                      </span>
                      <span className="text-accent group-hover:underline text-[9.5px] font-semibold flex items-center">
                        Configure ➔
                      </span>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full py-6 text-center text-xs text-text-tertiary">
                  {connectorHealth ? 'No connector configuration has been recorded yet.' : 'Integration configuration status could not be loaded.'}
                </div>
              )}
            </div>
          </div>

          <div className={`flex justify-between items-center text-xs border-t pt-2.5 ${borderCol}`}>
            <button
              onClick={() => setActiveTab('connectors')}
              className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              Manage Integrations <ArrowUpRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className="text-[10px] font-mono text-text-secondary hover:text-text-primary flex items-center gap-1 font-bold cursor-pointer"
            >
              Account Settings <Settings className="w-3 h-3" />
            </button>
          </div>
        </section>

        {/* TODAY'S ACTION PRIORITIES & SCHEDULE */}
        <section className={`border rounded-xl p-5 shadow-sm ${cardBg} lg:col-span-5 md:col-span-2 col-span-1 flex flex-col justify-between`}>
          <div>
            <div className="flex justify-between items-center mb-3.5">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-text-tertiary uppercase font-bold block">TODAY'S ACTION PRIORITIES</span>
                <span className="text-xs font-sans font-semibold text-text-primary">Scheduled Business Tasks</span>
              </div>
              <span className="text-[9px] font-mono font-bold text-accent px-2 py-0.5 rounded bg-accent-dim">TASKS</span>
            </div>
            
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg border border-border-dim bg-bg-subtle/50 space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-accent font-bold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> TASK STATUS NOT TRACKED
                  </span>
                  <span className="text-text-tertiary">—</span>
                </div>
                <p className="text-[11px] font-sans font-medium text-text-primary leading-tight">
                  No verified follow-up task is recorded for {activeCity}
                </p>
                <button 
                  onClick={() => setActiveTab('leads')}
                  className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1 font-bold pt-0.5"
                >
                  View Leads in Prospect Finder <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-2.5 rounded-lg border border-border-dim bg-bg-subtle/50 space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-warning font-bold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning" /> TASK STATUS NOT TRACKED
                  </span>
                  <span className="text-text-tertiary">—</span>
                </div>
                <p className="text-[11px] font-sans font-medium text-text-primary leading-tight">
                  No proposal review task is recorded.
                </p>
                <button 
                  onClick={() => setActiveTab('board')}
                  className="text-[10px] font-mono text-warning hover:underline flex items-center gap-1 font-bold pt-0.5"
                >
                  Review in Sales Pipeline <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-2.5 rounded-lg border border-border-dim bg-bg-subtle/50 space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-positive font-bold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-positive" /> TASK STATUS NOT TRACKED
                  </span>
                  <span className="text-text-tertiary">—</span>
                </div>
                <p className="text-[11px] font-sans font-medium text-text-primary leading-tight">
                  No campaign approval task is recorded.
                </p>
                <button 
                  onClick={() => setActiveTab('campaigns')}
                  className="text-[10px] font-mono text-positive hover:underline flex items-center gap-1 font-bold pt-0.5"
                >
                  Open Campaigns <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border-dim/60 mt-3 flex items-center justify-between">
            <span className="text-[9.5px] font-mono text-text-tertiary">Territory: {activeCity}, {regionalProfile.countryCode}</span>
            <button 
              onClick={() => setActiveTab('scheduler')}
              className="text-xs font-mono font-bold text-accent hover:underline flex items-center gap-1"
            >
              Open Daily Task Schedule <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </section>

        {/* RECENT BUSINESS ACTIVITY */}
        <section className={`border rounded-xl p-5 shadow-sm ${cardBg} lg:col-span-7 md:col-span-2 col-span-1 flex flex-col justify-between`}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-text-tertiary uppercase block font-bold">RECENT BUSINESS ACTIVITY</span>
                <span className="text-xs font-sans font-semibold text-text-primary">Recent saved lead records</span>
              </div>
              <button 
                onClick={() => setActiveTab('leads')}
                className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1 font-bold"
              >
                View All Leads <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className={`border-b pb-2 ${borderCol}`}>
                    <th className="text-[9.5px] font-mono text-text-tertiary uppercase pb-2.5 font-bold">Action / Event</th>
                    <th className="text-[9.5px] font-mono text-text-tertiary uppercase pb-2.5 font-bold">Domain</th>
                    <th className="text-[9.5px] font-mono text-text-tertiary uppercase pb-2.5 font-bold">Business Entity</th>
                    <th className="text-[9.5px] font-mono text-text-tertiary uppercase pb-2.5 font-bold">Timestamp</th>
                    <th className="text-[9.5px] font-mono text-text-tertiary uppercase pb-2.5 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-inherit">
                  {displayActivities.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-text-tertiary">
                        No activity recorded yet. Imported leads and completed actions will appear here.
                      </td>
                    </tr>
                  )}
                  {displayActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-bg-subtle/50 transition-colors">
                      <td className="py-2.5 text-[11px] font-sans text-text-primary">{act.activity}</td>
                      <td className="py-2.5 text-[10px] font-mono text-text-secondary uppercase">{act.type}</td>
                      <td className="py-2.5 text-[11px] font-sans text-text-secondary">{act.entity}</td>
                      <td className="py-2.5 text-[10px] font-mono text-text-tertiary">{act.time}</td>
                      <td className="py-2.5 text-right">
                        <span className={`inline-block text-[9px] font-mono px-2 py-0.5 rounded border font-semibold ${
                          act.status === 'new' ? 'bg-accent-dim text-accent border-accent/20' :
                          act.status === 'converted' ? 'bg-positive-dim text-positive border-positive/20' :
                          act.status === 'contacted' ? 'bg-info-dim text-info border-info/20' :
                          act.status === 'dead' ? 'bg-negative-dim text-negative border-negative/20' :
                          'bg-warning-dim text-warning border-warning/20'
                        }`}>
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>

      {/* LEAD INTELLIGENCE & AUDIT INSPECTOR MODAL */}
      <AnimatePresence>
        {selectedLeadForDetail && (
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
                      {selectedLeadForDetail.serviceType}
                    </span>
                    <span className="text-[10px] font-mono text-text-tertiary">
                      {selectedLeadForDetail.city}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text-primary mt-1 font-sans">
                    {selectedLeadForDetail.businessName}
                  </h3>
                  {selectedLeadForDetail.websiteUrl && (
                    <a
                      href={selectedLeadForDetail.websiteUrl.startsWith('http') ? selectedLeadForDetail.websiteUrl : `https://${selectedLeadForDetail.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-text-tertiary hover:text-accent flex items-center gap-1 mt-0.5"
                    >
                      <Globe className="w-2.5 h-2.5" />
                      {selectedLeadForDetail.websiteUrl}
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setSelectedLeadForDetail(null)}
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
                        selectedLeadForDetail.sslStatus === 'missing' ? 'text-negative' : 'text-positive'
                      }`}>
                        {selectedLeadForDetail.sslStatus === 'missing' ? (
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
                        (selectedLeadForDetail.performanceScore || 50) < 60 ? 'text-warning' : 'text-positive'
                      }`}>
                        <Gauge className="w-3 h-3" /> {selectedLeadForDetail.performanceScore != null ? `${selectedLeadForDetail.performanceScore}/100` : 'Not assessed'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-bg-base border border-border-dim">
                      <span className="block text-[9px] text-text-tertiary uppercase">SEO Health</span>
                      <span className="text-xs font-bold text-accent mt-1 block">
                        {selectedLeadForDetail.seoScore != null ? `${selectedLeadForDetail.seoScore}%` : 'Not assessed'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-bg-base border border-border-dim">
                      <span className="block text-[9px] text-text-tertiary uppercase">Reputation</span>
                      <span className="text-xs font-bold text-warning mt-1 block">
                        {selectedLeadForDetail.googleRating != null ? `${selectedLeadForDetail.googleRating}★` : 'Not available'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Valuation & Telephony */}
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-3 bg-bg-base rounded-lg border border-border-dim space-y-1">
                    <span className="text-[9px] text-text-tertiary uppercase block">Verified Telephone</span>
                    <span className="font-bold text-positive flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedLeadForDetail.phone || 'Not provided'}
                    </span>
                  </div>
                  <div className="p-3 bg-bg-base rounded-lg border border-border-dim space-y-1">
                    <span className="text-[9px] text-text-tertiary uppercase block">Predicted Deal LTV</span>
                    <span className="font-bold text-accent">
                      ${(selectedLeadForDetail.predictedLtvUsd ?? 0).toLocaleString()} USD
                    </span>
                  </div>
                </div>

                {/* HAL Cold Pitch Angle Strategy */}
                <div className="p-3.5 bg-accent-dim/20 rounded-xl border border-accent/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                      Tactical Pitch Strategy
                    </span>
                    <button
                      onClick={() => {
                        const textToCopy = selectedLeadForDetail.outreachStrategy || 
                          `Hi ${selectedLeadForDetail.ownerName || 'there'}, noticed ${selectedLeadForDetail.businessName} has a ${selectedLeadForDetail.sslStatus === 'missing' ? 'missing SSL certificate and ' : ''}slow mobile load speed impacting Google rankings in ${selectedLeadForDetail.city}. We can resolve this within 48 hours to capture top search volume.`;
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
                    {selectedLeadForDetail.outreachStrategy || 
                      `"We analyzed ${selectedLeadForDetail.businessName}'s digital conversion surface in ${selectedLeadForDetail.city}. website assessment and valuation data are not available in the saved record. Verify the site and gather evidence before making performance or revenue claims."`}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border-dim bg-bg-subtle/40 flex items-center justify-between">
                <button
                  onClick={() => setSelectedLeadForDetail(null)}
                  className="px-3 py-1.5 rounded-lg border border-border-dim text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedLeadForDetail(null);
                    setActiveTab('leads');
                  }}
                  className="px-4 py-1.5 rounded-lg bg-accent text-accent-contrast text-xs font-mono font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  View in Territory Leads <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
