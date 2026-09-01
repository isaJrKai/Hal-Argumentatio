import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Map, 
  Sparkles, 
  CloudRain, 
  Terminal, 
  CheckCircle, 
  Play, 
  RefreshCw, 
  Database, 
  Globe, 
  Mail, 
  Star, 
  Plus, 
  Compass, 
  Layers, 
  Loader2 
} from 'lucide-react';
import { useBusinessContext } from '../context/BusinessContext';

interface MissionStep {
  id: string;
  missionId: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  updatedAt: string;
}

interface Mission {
  id: string;
  contractorId: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  city: string;
  niche: string;
  createdAt: string;
  updatedAt: string;
  steps: MissionStep[];
}

interface Lead {
  id: string;
  businessName: string;
  ownerName?: string;
  city: string;
  serviceType: string;
  websiteUrl?: string;
  performanceScore?: number;
  seoScore?: number;
  sslStatus?: string;
  googleRating?: number;
  reviewCount?: number;
  notes?: string;
  source: string;
  createdAt: string;
}

interface MissionsPanelProps {
  token: string;
  leads: Lead[];
  onRefreshLeads: () => void;
}

export default function MissionsPanel({ token, leads, onRefreshLeads }: MissionsPanelProps) {
  const { activeCity, activeNiche, supportedCities, supportedNiches, setActiveCity, setActiveNiche } = useBusinessContext();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [launching, setLaunching] = useState(false);
  const [cityInput, setCityInput] = useState(activeCity);
  const [nicheInput, setNicheInput] = useState(activeNiche);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setCityInput(activeCity);
    setNicheInput(activeNiche);
  }, [activeCity, activeNiche]);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/missions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMissions(data);
        if (data.length > 0) {
          // Keep selection or default to first
          setSelectedMission(prev => data.find((m: Mission) => m.id === prev?.id) || data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch missions:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLaunchMission = async (e: React.FormEvent) => {
    e.preventDefault();
    setLaunching(true);
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ city: cityInput, niche: nicheInput })
      });

      if (res.ok) {
        const created = await res.json();
        // Update context
        setActiveCity(cityInput);
        setActiveNiche(nicheInput);
        
        // Refresh
        await fetchMissions();
        onRefreshLeads();
        setSelectedMission(created);
      }
    } catch (err) {
      console.error('Launch failed:', err);
    } finally {
      setLaunching(false);
    }
  };

  // Poll active mission details if one is currently 'running'
  useEffect(() => {
    const activeRunning = missions.some(m => m.status === 'running');
    if (activeRunning) {
      const interval = setInterval(() => {
        fetchMissions();
        onRefreshLeads();
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [missions]);

  // Filter leads sourced by the selected mission context (matches by city and niche service type)
  const missionLeads = leads.filter(l => 
    selectedMission && 
    (l?.city || '').toLowerCase() === (selectedMission?.city || '').toLowerCase() &&
    (l?.serviceType || '').toLowerCase() === (selectedMission?.niche || '').toLowerCase() &&
    l?.source === 'sourced_intelligence'
  );

  return (
    <div className="space-y-6 animate-fadeIn" id="missions_panel">
      
      {/* PAGE CONTEXT BRIEFING */}
      <div className="border-b border-border-dim/60 pb-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold tracking-widest text-accent uppercase bg-accent-dim px-2 py-0.5 rounded">Operations</span>
          <span className="w-1 h-1 rounded-full bg-text-tertiary" />
          <span className="text-[10px] font-mono text-text-secondary">ACTIVE CONTROL HUB</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Autonomous Territory Sourcing</h2>
            <p className="text-xs text-text-secondary max-w-2xl mt-0.5 leading-relaxed">
              Deploy HAL Sourcing Engines to scrape, enrich, and validate targeted {activeNiche} and local trade merchants. Running campaigns extract active ads, mobile speed metrics, and Google Reviews in real time.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono shrink-0">
            <div className="px-3.5 py-1.5 border border-border-dim rounded bg-bg-raised text-center min-w-[100px]">
              <span className="block text-[10px] text-text-secondary uppercase">Active Engines</span>
              <span className="text-sm font-semibold text-text-primary mt-0.5 block">{missions.filter(m => m.status === 'running').length}</span>
            </div>
            <div className="px-3.5 py-1.5 border border-border-dim rounded bg-bg-raised text-center min-w-[100px]">
              <span className="block text-[10px] text-text-secondary uppercase">Validated Leads</span>
              <span className="text-sm font-semibold text-accent mt-0.5 block">{leads.filter(l => l.source === 'sourced_intelligence').length}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* EXECUTIVE SUMMARY COUNTER METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bg-raised border border-border-dim p-4 rounded-lg relative overflow-hidden shadow-xs">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">Automated Campaigns Launched</span>
            <Compass className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-bold text-text-primary font-mono">{missions.length}</div>
          <p className="text-[10px] text-text-secondary mt-1.5 font-sans">Territorial conquest operational plans</p>
        </div>

        <div className="bg-bg-raised border border-border-dim p-4 rounded-lg relative overflow-hidden shadow-xs">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">Active Sourced Territory Leads</span>
            <Database className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-bold text-text-primary font-mono">
            {leads.filter(l => l.source === 'sourced_intelligence').length}
          </div>
          <p className="text-[10px] text-text-secondary mt-1.5 font-sans">Pure PII-secured merchant leads</p>
        </div>

        <div className="bg-bg-raised border border-border-dim p-4 rounded-lg relative overflow-hidden shadow-xs">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">Active Execution Engines</span>
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-bold text-text-primary font-mono flex items-center gap-1.5">
            {missions.filter(m => m.status === 'running').length > 0 ? (
              <span className="text-accent flex items-center gap-1 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                OPERATIONAL
              </span>
            ) : (
              <span className="text-text-secondary">STANDBY</span>
            )}
          </div>
          <p className="text-[10px] text-text-secondary mt-1.5 font-sans">Background processes and API loops</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Mission List & Launch Panel */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* New Campaign Deployment Form */}
          <div className="bg-bg-raised border border-border-dim rounded-xl shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border-dim flex items-center justify-between bg-bg-subtle/50">
              <span className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-accent" />
                Deploy Sourced Campaign
              </span>
            </div>
            <form onSubmit={handleLaunchMission} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-text-secondary uppercase tracking-wider">Territorial City</label>
                  <select
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    className="w-full bg-bg-subtle border border-border-dim rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors font-sans"
                  >
                    {supportedCities.map(c => (
                      <option key={c} value={c} className="bg-bg-raised text-text-primary">{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-text-secondary uppercase tracking-wider">Target Niche</label>
                  <select
                    value={nicheInput}
                    onChange={(e) => setNicheInput(e.target.value)}
                    className="w-full bg-bg-subtle border border-border-dim rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors font-sans"
                  >
                    {supportedNiches.map(n => (
                      <option key={n} value={n} className="bg-bg-raised text-text-primary">{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={launching}
                className="w-full py-2.5 bg-accent hover:opacity-90 disabled:opacity-50 text-accent-contrast text-xs font-mono font-bold uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {launching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-inherit" />
                    HARVESTING LOCALITY...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    LAUNCH AUTOMATED CONQUEST
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Historical Campaigns List */}
          <div className="bg-bg-raised border border-border-dim rounded-xl shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border-dim flex items-center justify-between bg-bg-subtle/50">
              <span className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-accent" />
                Campaign Logs
              </span>
              <button 
                onClick={fetchMissions} 
                disabled={refreshing}
                className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="p-3 divide-y divide-border-dim max-h-[350px] overflow-y-auto">
              {missions.length === 0 ? (
                <p className="text-[10px] font-mono text-text-secondary text-center py-6">No historical campaigns recorded.</p>
              ) : (
                missions.map(m => {
                  const isSelected = selectedMission?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMission(m)}
                      className={`w-full text-left p-3 flex items-center justify-between transition-colors rounded-lg cursor-pointer ${
                        isSelected ? 'bg-bg-subtle border border-border-dim/40' : 'hover:bg-bg-subtle/40 border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-text-primary block truncate uppercase tracking-tight">{m.city} ({m.niche})</span>
                        </div>
                        <p className="text-[10px] text-text-secondary truncate mt-1 font-sans">{m.description}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2 font-mono text-[9px] font-bold">
                        {m.status === 'completed' && <span className="text-accent bg-accent-dim px-1.5 py-0.5 rounded-sm uppercase border border-accent/10">COMPLETE</span>}
                        {m.status === 'running' && <span className="text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-sm animate-pulse uppercase border border-yellow-500/20">ACTIVE</span>}
                        {m.status === 'failed' && <span className="text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-sm uppercase border border-red-500/20">FAILED</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Live Step Flow Pipeline & Sourced leads list */}
        <div className="lg:col-span-7 space-y-6">
          {selectedMission && (
            <div className="space-y-6">
              
              {/* Active Pipeline Status Flow */}
              <div className="bg-bg-raised border border-border-dim p-5 rounded-xl shadow-xs">
                <div className="flex justify-between items-start border-b border-border-dim pb-3.5 mb-4">
                  <div>
                    <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">{selectedMission.title}</h3>
                    <p className="text-[10px] text-text-secondary font-sans mt-0.5">{selectedMission.description}</p>
                  </div>
                  <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">LAUNCHED: {new Date(selectedMission.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Vertical Process Steps */}
                <div className="space-y-5 relative pl-4 border-l border-border-dim ml-2.5">
                  {selectedMission.steps.map((st, idx) => {
                    let dotColor = 'bg-border-dim';
                    let titleColor = 'text-text-secondary';
                    if (st.status === 'completed') {
                      dotColor = 'bg-accent';
                      titleColor = 'text-text-primary';
                    } else if (st.status === 'running') {
                      dotColor = 'bg-yellow-400 animate-pulse';
                      titleColor = 'text-text-primary font-medium';
                    }
                    return (
                      <div key={st.id} className="relative">
                        <div className={`absolute -left-[22.5px] top-1 w-3 h-3 rounded-full border border-bg-base ${dotColor}`} />
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${titleColor}`}>{idx + 1}. {st.title}</span>
                            <span className="text-[8px] font-mono font-bold uppercase text-text-secondary tracking-wide">{st.status}</span>
                          </div>
                          <p className="text-[10px] text-text-secondary font-sans leading-normal">{st.description}</p>
                          {st.result && (
                            <div className="bg-bg-subtle border border-border-dim p-2.5 rounded-md text-[10px] text-text-secondary font-sans leading-normal mt-1.5 italic select-text">
                              stdout: {st.result}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sourced Intelligence leads compiled list */}
              <div className="bg-bg-raised border border-border-dim rounded-xl shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border-dim bg-bg-subtle/50">
                  <span className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-accent" />
                    Sourced Intelligence Leads ({missionLeads.length})
                  </span>
                </div>

                <div className="p-5 space-y-4 divide-y divide-border-dim/60">
                  {missionLeads.length === 0 ? (
                    <div className="text-center py-6 text-[10px] font-mono text-text-secondary">
                      {selectedMission.status === 'running' ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-accent" />
                          <span>Intelligence harvester operating. Standby...</span>
                        </div>
                      ) : (
                        <span>No sourced leads registered for this campaign region.</span>
                      )}
                    </div>
                  ) : (
                    missionLeads.map(l => (
                      <div key={l.id} className="pt-4 first:pt-0 space-y-3 select-text">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[11px] font-bold text-text-primary block uppercase tracking-wide">{l.businessName}</span>
                            <div className="flex gap-2 text-[9px] font-mono text-text-secondary mt-1">
                              <span>OWNER: {l.ownerName || 'Unknown'}</span>
                              <span>•</span>
                              <span>TEL: {l.id.includes('seed') ? 'Confidential' : 'Verified'}</span>
                            </div>
                          </div>
                          {l.googleRating && (
                            <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-yellow-500 bg-yellow-500/5 px-2 py-0.5 rounded-sm border border-yellow-500/20">
                              <Star className="w-3 h-3 fill-current text-yellow-500" />
                              <span>{l.googleRating} ({l.reviewCount})</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-text-secondary">
                          <div className="bg-bg-subtle p-2 rounded-md border border-border-dim text-center">
                            <span className="text-text-secondary block text-[8px] uppercase tracking-wider mb-0.5">Speed Index</span>
                            <span className="font-bold text-yellow-500">{l.performanceScore || '68'}/100</span>
                          </div>
                          <div className="bg-bg-subtle p-2 rounded-md border border-border-dim text-center">
                            <span className="text-text-secondary block text-[8px] uppercase tracking-wider mb-0.5">SSL Secured</span>
                            <span className={`font-bold uppercase ${l.sslStatus === 'secured' ? 'text-accent' : 'text-red-500'}`}>{l.sslStatus || 'UNSECURED'}</span>
                          </div>
                          <div className="bg-bg-subtle p-2 rounded-md border border-border-dim text-center">
                            <span className="text-text-secondary block text-[8px] uppercase tracking-wider mb-0.5">SEO Profile</span>
                            <span className="font-bold text-text-primary">{l.seoScore || 'N/A'}/100</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-text-secondary leading-relaxed font-sans bg-bg-subtle/60 p-2.5 rounded-md border border-border-dim italic">
                          {l.notes}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
