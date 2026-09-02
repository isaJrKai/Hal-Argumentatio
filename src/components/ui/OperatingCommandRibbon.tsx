import React, { useState } from 'react';
import { useBusinessContext } from '../../context/BusinessContext';
import { 
  Globe, 
  MapPin, 
  Sliders, 
  Sparkles, 
  ShieldCheck, 
  DollarSign, 
  Activity, 
  Wrench, 
  RefreshCw, 
  TrendingUp,
  Cpu,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OperatingCommandRibbonProps {
  activeTab: string;
  onRefreshData?: () => void;
}

export const OperatingCommandRibbon: React.FC<OperatingCommandRibbonProps> = ({
  activeTab,
  onRefreshData
}) => {
  const { 
    activeCity, 
    setActiveCity, 
    activeIndustry, 
    setActiveIndustry, 
    activeNiche, 
    setActiveNiche,
    regionalProfile, 
    supportedCities, 
    supportedIndustries, 
    supportedNiches,
    workspaceConfig,
    updateWorkspaceConfig,
    formatCurrency
  } = useBusinessContext();

  const [isOpen, setIsOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'regional' | 'tactical' | 'hermes'>('regional');

  return (
    <div className="w-full bg-bg-raised border border-border-dim rounded-xl p-3 sm:p-4 mb-5 shadow-xs transition-all">
      {/* Primary Bar (Always visible) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        
        {/* Left: Global Territory & Trade Selector */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Active Flag & Regional Capsule */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-bg-base border border-border-dim rounded-lg shadow-2xs font-mono">
            <span className="text-base leading-none">{regionalProfile.flag}</span>
            <div className="flex flex-col">
              <span className="text-[9px] text-text-tertiary uppercase leading-none">Territory</span>
              <span className="text-xs font-bold text-text-primary leading-tight">{regionalProfile.city}, {regionalProfile.countryCode}</span>
            </div>
          </div>

          {/* City Selector */}
          <div className="relative">
            <select
              value={activeCity}
              onChange={(e) => setActiveCity(e.target.value)}
              className="bg-bg-base border border-border-dim hover:border-accent text-text-primary text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-hidden focus:border-accent cursor-pointer transition-colors"
              title="Switch Active Global Territory"
            >
              {supportedCities.map((city) => (
                <option key={city} value={city} className="bg-bg-raised text-text-primary">
                  📍 {city}
                </option>
              ))}
            </select>
          </div>

          {/* Industry Vertical Selector */}
          <div className="relative">
            <select
              value={activeIndustry.id}
              onChange={(e) => setActiveIndustry(e.target.value)}
              className="bg-bg-base border border-border-dim hover:border-accent text-text-primary text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-hidden focus:border-accent cursor-pointer transition-colors"
              title="Switch Trade Vertical"
            >
              {supportedIndustries.map((ind) => (
                <option key={ind.id} value={ind.id} className="bg-bg-raised text-text-primary">
                  🛠️ {ind.name}
                </option>
              ))}
            </select>
          </div>

          {/* Trade Niche Selector */}
          <div className="relative">
            <select
              value={activeNiche}
              onChange={(e) => setActiveNiche(e.target.value)}
              className="bg-bg-base border border-border-dim hover:border-accent text-text-primary text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-hidden focus:border-accent cursor-pointer uppercase transition-colors"
              title="Switch Sub-Specialty"
            >
              {supportedNiches.map((niche) => (
                <option key={niche} value={niche} className="bg-bg-raised text-text-primary">
                  {niche}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Right: Live Dynamic Metrics & Quick Ribbon Drawer Button */}
        <div className="flex items-center gap-2.5 shrink-0 justify-between sm:justify-end">
          
          {/* Active Local Climate & Regulatory Badge */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-text-secondary bg-bg-base/70 border border-border-dim/60 px-2.5 py-1 rounded-lg">
            <span className="text-amber-400">⚡</span>
            <span className="truncate max-w-[210px] text-[10.5px]">
              {regionalProfile.currentSeasonalFocus}
            </span>
          </div>

          {/* Currency format display */}
          <div className="px-2.5 py-1 bg-bg-base border border-border-dim rounded-lg font-mono text-[11px] font-bold text-accent">
            {regionalProfile.currencySymbol} ({regionalProfile.currencyCode})
          </div>

          {/* Ribbon Levers Dropdown Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
              isOpen 
                ? 'bg-accent text-accent-contrast border-accent shadow-xs' 
                : 'bg-bg-base hover:bg-bg-subtle border-border-dim text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="uppercase text-[10px]">Operating Levers</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="p-1.5 bg-bg-base border border-border-dim hover:border-accent rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Sync Active Territory Intelligence"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

        </div>

      </div>

      {/* Expandable Operational Command Ribbon (The "Office/Word" Toolset) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="border-t border-border-dim pt-3 space-y-3 overflow-hidden"
          >
            {/* Sub-tab Ribbon Selector */}
            <div className="flex items-center gap-2 text-xs font-mono border-b border-border-dim/50 pb-2">
              <button
                onClick={() => setActiveSubView('regional')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeSubView === 'regional' ? 'bg-accent text-accent-contrast font-bold' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                🌍 Regional World Model
              </button>
              <button
                onClick={() => setActiveSubView('tactical')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeSubView === 'tactical' ? 'bg-accent text-accent-contrast font-bold' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                ⚙️ Financial & CAC Levers
              </button>
              <button
                onClick={() => setActiveSubView('hermes')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeSubView === 'hermes' ? 'bg-accent text-accent-contrast font-bold' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                ⚡ Hermes Cross-System Bus
              </button>
            </div>

            {/* View 1: Regional World Model Heuristics */}
            {activeSubView === 'regional' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                
                {/* Regulatory Standards */}
                <div className="p-3 bg-bg-base rounded-lg border border-border-dim space-y-1.5">
                  <div className="flex items-center gap-1.5 text-text-tertiary uppercase text-[9.5px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Regulatory Licensure Standard
                  </div>
                  <div className="space-y-1">
                    {regionalProfile.regulatoryBodies.map((reg) => (
                      <div key={reg.code} className="text-[11px] text-text-primary font-sans">
                        <strong className="text-emerald-400 font-mono text-[10px]">{reg.code}</strong> — {reg.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Local Climate Heuristic */}
                <div className="p-3 bg-bg-base rounded-lg border border-border-dim space-y-1.5">
                  <div className="flex items-center gap-1.5 text-text-tertiary uppercase text-[9.5px] font-bold">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    Climate & Seasonal Drivers
                  </div>
                  <div className="text-[11px] text-text-secondary font-sans leading-relaxed">
                    <p className="font-semibold text-text-primary">{regionalProfile.climateZone}</p>
                    <p className="text-[10px] text-amber-400/90 font-mono mt-0.5">Priority: {regionalProfile.currentSeasonalFocus}</p>
                  </div>
                </div>

                {/* Benchmark Territory Economics */}
                <div className="p-3 bg-bg-base rounded-lg border border-border-dim space-y-1.5">
                  <div className="flex items-center gap-1.5 text-text-tertiary uppercase text-[9.5px] font-bold">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    Territory Economic Benchmarks
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                    <div>
                      <span className="text-[9px] text-text-tertiary block">Target CAC</span>
                      <strong className="text-text-primary font-mono">{formatCurrency(regionalProfile.territoryMetrics.averageCAC)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-tertiary block">Average CPC</span>
                      <strong className="text-text-primary font-mono">{formatCurrency(regionalProfile.territoryMetrics.typicalCPC)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-tertiary block">Recommended Mo. Ad Spend</span>
                      <strong className="text-text-primary font-mono">{formatCurrency(regionalProfile.territoryMetrics.recommendedMonthlyBudget)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-tertiary block">Market Density</span>
                      <strong className="text-amber-400 font-mono">{regionalProfile.territoryMetrics.activeCompetitorDensity}</strong>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* View 2: Financial & CAC Levers */}
            {activeSubView === 'tactical' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                
                <div className="p-3 bg-bg-base rounded-lg border border-border-dim space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-text-secondary">
                    <span>Target Customer Acquisition Cost (CAC)</span>
                    <span className="text-accent">{formatCurrency(workspaceConfig.targetCAC || 145)}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="10"
                    value={workspaceConfig.targetCAC || 145}
                    onChange={(e) => updateWorkspaceConfig({ targetCAC: Number(e.target.value) })}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <p className="text-[10px] text-text-tertiary font-sans">
                    Governs Hermes ad bid recommendations and positive ROI threshold alerts.
                  </p>
                </div>

                <div className="p-3 bg-bg-base rounded-lg border border-border-dim space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-text-secondary">
                    <span>Monthly Ad Spend Multiplier</span>
                    <span className="text-accent">{workspaceConfig.budgetMultiplier || 1.0}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={workspaceConfig.budgetMultiplier || 1.0}
                    onChange={(e) => updateWorkspaceConfig({ budgetMultiplier: Number(e.target.value) })}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <p className="text-[10px] text-text-tertiary font-sans">
                    Scales campaign forecast modeling and outreach batch sizes across all modules.
                  </p>
                </div>

                <div className="p-3 bg-bg-base rounded-lg border border-border-dim space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-text-secondary">
                    <span>LTV Multiplier</span>
                    <span className="text-accent">{workspaceConfig.ltvMultiplier || 1.0}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={workspaceConfig.ltvMultiplier || 1.0}
                    onChange={(e) => updateWorkspaceConfig({ ltvMultiplier: Number(e.target.value) })}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <p className="text-[10px] text-text-tertiary font-sans">
                    Tunes deal valuation algorithms for commercial vs residential ticket sizes.
                  </p>
                </div>

              </div>
            )}

            {/* View 3: Hermes Cross-System Bus */}
            {activeSubView === 'hermes' && (
              <div className="p-3 bg-bg-base rounded-lg border border-border-dim space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold font-sans text-text-primary">Hermes Auto-Deploy & Bi-directional Event Bus</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-mono text-[11px]">
                    <input
                      type="checkbox"
                      checked={workspaceConfig.autoDeployHermesAssets !== false}
                      onChange={(e) => updateWorkspaceConfig({ autoDeployHermesAssets: e.target.checked })}
                      className="rounded border-border-dim accent-accent"
                    />
                    <span>Auto-Sync Generated Landing Pages to Mission Control & Campaigns</span>
                  </label>
                </div>
                <p className="text-[11px] text-text-secondary font-sans leading-relaxed">
                  When enabled, any landing page, negative keyword matrix, or diagnostic schema produced by Nous Research Hermes is instantly registered in your PostgreSQL database and dispatched to the active territory campaign planner.
                </p>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
