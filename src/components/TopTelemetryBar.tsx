import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Bell, 
  Map, 
  Users, 
  Send, 
  TrendingUp, 
  Cpu, 
  ChevronDown,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Download,
  LogOut,
  Activity,
  Plus,
  Phone,
  Mail,
  Layers,
  Compass,
  Sliders,
  RefreshCw,
  Globe,
  Sun,
  Moon,
  Bot
} from 'lucide-react';
import { useBusinessContext } from '../context/BusinessContext';

interface TopTelemetryBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCommandPalette: () => void;
  contractorName?: string;
  companyLogo?: string | null;
  unreadNotificationsCount?: number;
  notifications?: any[];
  clearNotifications?: () => void;
  showNotifications?: boolean;
  onToggleNotifications?: () => void;
  onCloseNotifications?: () => void;
  onToggleTheme?: () => void;
  onOpenMobileMenu?: () => void;
  theme?: 'dark' | 'light';
  isAppInstalled?: boolean;
  onInstallClick?: () => void;
  onLogout?: () => void;
}

export const TopTelemetryBar: React.FC<TopTelemetryBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCommandPalette,
  contractorName = 'Acme Services',
  companyLogo,
  unreadNotificationsCount = 0,
  notifications = [],
  clearNotifications,
  showNotifications = false,
  onToggleNotifications,
  onCloseNotifications,
  onToggleTheme,
  onOpenMobileMenu,
  theme = 'dark',
  isAppInstalled = true,
  onInstallClick,
  onLogout
}) => {
  const { 
    workspaceConfig, 
    activeIndustry, 
    activeCity, 
    regionalProfile, 
    formatCurrency, 
    setCity 
  } = useBusinessContext();
  
  const [showRibbon, setShowRibbon] = useState(true);
  const [quickNotification, setQuickNotification] = useState<string | null>(null);

  // Trigger brief user-friendly feedback on quick ribbon actions
  const triggerRibbonAction = (actionName: string, tabRedirect?: string) => {
    setQuickNotification(actionName);
    if (tabRedirect) {
      setActiveTab(tabRedirect);
    }
    setTimeout(() => {
      setQuickNotification(null);
    }, 2800);
  };

  // Top Workspace Tabs (AutoCAD Master Panels)
  const topNavTabs = [
    { id: 'overview', label: 'Mission Control', icon: Sparkles },
    { id: 'leads', label: 'Prospect Finder', icon: Compass },
    { id: 'board', label: 'Sales Pipeline', icon: Users },
    { id: 'map', label: 'Map Intelligence', icon: Map },
    { id: 'campaigns', label: 'Outreach & Messages', icon: Send },
    { id: 'revenue-intelligence', label: 'Financials & Revenue', icon: TrendingUp },
    { id: 'hermes-lab', label: 'AI Business Assistant', icon: Cpu },
    { id: 'chat', label: 'HAL Copilot', icon: Bot },
  ];

  return (
    <div className="w-full bg-bg-raised border-b border-border-dim text-text-primary select-none z-30 shrink-0 transition-colors duration-200">
      
      {/* ─── ROW 1: PRIMARY BRAND & GLOBAL SEARCH ─── */}
      <div className="h-13 px-3 sm:px-5 flex items-center justify-between border-b border-border-dim gap-3">
        
        {/* Left: Mobile hamburger + Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-subtle transition-colors cursor-pointer"
              title="Open Navigation Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-text-primary font-display">HAL</span>
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-xs" />
            </div>
            <div className="hidden sm:block h-3.5 w-px bg-border-dim" />
            <span className="hidden sm:block text-xs font-medium text-text-secondary font-sans truncate">
              {workspaceConfig.agencyName || 'Contractor Operating Intelligence'}
            </span>
          </div>
        </div>

        {/* Global Search Bar (⌘K) */}
        <div 
          onClick={onOpenCommandPalette}
          className="flex-1 max-w-lg mx-2 sm:mx-4 flex items-center justify-between bg-bg-subtle hover:bg-bg-base border border-border-default hover:border-accent/60 rounded-lg px-3 py-1.5 transition-all cursor-pointer shadow-xs group min-w-0"
        >
          <div className="flex items-center gap-2 text-text-secondary group-hover:text-text-primary min-w-0">
            <Search className="w-3.5 h-3.5 text-text-tertiary group-hover:text-accent transition-colors shrink-0" />
            <span className="text-xs font-sans truncate">Search prospects, deals, or tools (⌘K)...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold bg-bg-raised text-text-secondary rounded border border-border-dim shrink-0">
            ⌘K
          </kbd>
        </div>

        {/* Right Status Cluster */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Quick Notification Toast */}
          {quickNotification && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-positive-dim border border-positive/30 text-positive text-xs font-sans animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{quickNotification}</span>
            </div>
          )}

          {/* AI Assistant Quick Status */}
          <button
            onClick={() => setActiveTab('hermes-lab')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent-dim border border-accent/30 text-accent hover:bg-accent-mid text-xs font-sans font-medium transition-all cursor-pointer shadow-xs"
            title="AI Business Assistant: Online and ready"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">AI Assistant</span>
            <span className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
          </button>

          {/* Dedicated Theme Toggle: Paper & Ink / Dark Carbon */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-default hover:border-accent/60 bg-bg-subtle hover:bg-bg-base text-text-primary text-xs transition-all cursor-pointer shadow-xs"
              title={theme === 'light' ? 'Switch to Dark Carbon Mode' : 'Switch to Paper & Ink Light Theme'}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="hidden sm:inline text-[10px] font-mono font-bold tracking-wider uppercase text-accent">PAPER & INK</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="hidden sm:inline text-[10px] font-mono font-bold tracking-wider uppercase text-accent">DARK CARBON</span>
                </>
              )}
            </button>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={onToggleNotifications}
              className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-subtle border border-transparent hover:border-border-dim transition-all cursor-pointer"
              title="Company Notifications & Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-negative text-white rounded-full text-[8px] font-mono font-bold flex items-center justify-center shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 border border-border-default rounded-xl shadow-2xl p-4 space-y-3 z-50 text-xs bg-bg-raised text-text-primary backdrop-blur-xl">
                <div className="flex justify-between items-center border-b border-border-dim pb-2">
                  <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">Company Updates</span>
                  {clearNotifications && (
                    <button
                      onClick={clearNotifications}
                      className="text-[10px] text-accent hover:underline cursor-pointer"
                    >
                      Dismiss All
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {notifications.length > 0 ? (
                    notifications.map((notif: any, i: number) => (
                      <div key={i} className="p-2.5 rounded bg-bg-subtle border border-border-dim space-y-1">
                        <div className="font-semibold text-text-primary text-xs">{notif.title || 'System Notification'}</div>
                        <div className="text-[11px] text-text-secondary">{notif.message || notif.text}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-text-tertiary text-xs">
                      All systems operating smoothly. No pending alerts.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Account Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-border-dim text-xs">
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt="Logo" 
                className="w-6 h-6 rounded object-cover border border-border-dim shadow-xs shrink-0" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded bg-accent-dim border border-accent/30 flex items-center justify-center text-accent font-bold text-xs font-mono shrink-0">
                {(contractorName || 'HAL').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden lg:inline text-text-primary font-medium truncate max-w-[120px]">{contractorName}</span>
          </div>

          {/* Sign Out */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-negative hover:bg-bg-subtle transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── ROW 2: PRIMARY WORKSPACE TABS (DOMAINS) ─── */}
      <div className="px-3 sm:px-5 flex items-center justify-between border-b border-border-dim bg-bg-base transition-colors duration-200">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {topNavTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-sans whitespace-nowrap shrink-0 border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-accent text-accent bg-accent-dim font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default font-medium'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-accent' : 'text-text-tertiary'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toggle Ribbon Mini-Panels */}
        <button
          onClick={() => setShowRibbon(!showRibbon)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-sans text-text-secondary hover:text-text-primary rounded border border-border-dim bg-bg-subtle hover:bg-bg-raised transition-colors shrink-0 ml-2"
          title="Toggle Contextual Action Ribbon"
        >
          <Sliders className="w-3 h-3 text-accent" />
          <span>{showRibbon ? 'Collapse Ribbon' : 'Expand Tools'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showRibbon ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* ─── ROW 3: CONTEXTUAL ACTION RIBBON ─── */}
      {showRibbon && (
        <div className="px-3 sm:px-5 py-2 bg-bg-subtle border-b border-border-dim flex items-center gap-3 overflow-x-auto no-scrollbar animate-fadeIn text-xs transition-colors duration-200">
          
          {/* ============================================================== */}
          {/* 1. RIBBON FOR MISSION CONTROL (overview)                      */}
          {/* ============================================================== */}
          {activeTab === 'overview' && (
            <>
              {/* Mini-Panel: Daily Actions */}
              <div className="flex items-center gap-1.5 pr-3 border-r border-border-dim/50 shrink-0">
                <button
                  onClick={() => triggerRibbonAction('Scanning website speed and mobile health for local leads...', 'leads')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent-dim hover:bg-accent-mid text-accent border border-accent/40 font-medium transition-all cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-accent" />
                  <span>Scan Website Health</span>
                </button>

                <button
                  onClick={() => triggerRibbonAction(`Weather Demand Alert checked for ${activeCity}: High demand active`)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-warning-dim hover:bg-warning-dim/80 text-warning border border-warning/30 font-medium transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  <span>Weather Demand Alert</span>
                </button>

                <button
                  onClick={() => triggerRibbonAction('Viewing today’s highest-priority trade lead', 'leads')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-raised hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border-default font-medium transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Today's Priority Deal</span>
                </button>
              </div>

              {/* Mini-Panel: Territory & Trade Selector */}
              <div className="flex items-center gap-2 px-3 border-r border-border-dim/50 shrink-0">
                <span className="text-[11px] text-text-tertiary font-sans">Location:</span>
                <div className="flex items-center gap-1">
                  {['Calgary', 'Winnipeg', 'Edmonton'].map((city) => (
                    <button
                      key={city}
                      onClick={() => setCity(city)}
                      className={`px-2 py-0.5 rounded text-[11px] font-sans font-medium transition-colors cursor-pointer border ${
                        activeCity === city
                          ? 'bg-accent text-accent-contrast border-accent font-bold shadow-xs'
                          : 'bg-bg-raised text-text-secondary hover:text-text-primary border-border-dim hover:bg-bg-subtle'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mini-Panel: Trade Focus */}
              <div className="flex items-center gap-2 px-3 border-r border-border-dim/50 shrink-0">
                <span className="text-[11px] text-text-tertiary font-sans">Trade:</span>
                <span className="px-2.5 py-0.5 rounded bg-bg-raised border border-border-default text-text-primary font-medium text-[11px]">
                  {activeIndustry.name}
                </span>
              </div>

              {/* Mini-Panel: Quick Performance Ticker */}
              <div className="flex items-center gap-4 pl-2 shrink-0 text-[11px] font-sans">
                <div className="flex items-center gap-1">
                  <span className="text-text-tertiary">Revenue (MTD):</span>
                  <span className="font-bold text-text-primary font-mono">{formatCurrency(42850)}</span>
                  <span className="text-positive font-medium">(+18.4%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-text-tertiary">Pipeline:</span>
                  <span className="font-bold text-accent font-mono">{formatCurrency(91400)}</span>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* 2. RIBBON FOR PROSPECT FINDER (leads)                          */}
          {/* ============================================================== */}
          {activeTab === 'leads' && (
            <>
              <div className="flex items-center gap-1.5 pr-3 border-r border-border-dim/50 shrink-0">
                <button
                  onClick={() => triggerRibbonAction('Scanning territory for new verified contractor prospects...')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent text-accent-contrast border border-accent font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find New Prospects</span>
                </button>

                <button
                  onClick={() => triggerRibbonAction('Phone numbers and line types verified')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-positive-dim hover:bg-positive-dim/80 text-positive border border-positive/30 font-medium transition-all cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Verify Phone Lines</span>
                </button>

                <button
                  onClick={() => triggerRibbonAction('Exporting prospect data to spreadsheet')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-raised hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border-default font-medium transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export to Excel</span>
                </button>
              </div>

              <div className="flex items-center gap-2 px-3 shrink-0">
                <span className="text-[11px] text-text-tertiary">Quick Filters:</span>
                <button className="px-2 py-0.5 rounded bg-bg-raised text-text-secondary hover:text-text-primary border border-border-dim text-[11px] transition-colors cursor-pointer">
                  All (142)
                </button>
                <button className="px-2 py-0.5 rounded bg-accent-dim text-accent border border-accent/30 text-[11px] font-medium transition-colors cursor-pointer">
                  Uncontacted (128)
                </button>
                <button className="px-2 py-0.5 rounded bg-negative-dim text-negative border border-negative/30 text-[11px] transition-colors cursor-pointer">
                  Missing Website SSL (34)
                </button>
                <button className="px-2 py-0.5 rounded bg-positive-dim text-positive border border-positive/30 text-[11px] font-medium transition-colors cursor-pointer">
                  High Deal Value $5k+ (48)
                </button>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* 3. RIBBON FOR SALES PIPELINE (board)                           */}
          {/* ============================================================== */}
          {activeTab === 'board' && (
            <>
              <div className="flex items-center gap-1.5 pr-3 border-r border-border-dim/50 shrink-0">
                <button
                  onClick={() => triggerRibbonAction('Ready to add a new qualified deal card')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent text-accent-contrast border border-accent font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Deal</span>
                </button>

                <button
                  onClick={() => triggerRibbonAction('Recalculated pipeline closing probabilities')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-raised hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border-default font-medium transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Recalculate Values</span>
                </button>
              </div>

              <div className="flex items-center gap-3 px-3 shrink-0 text-[11px]">
                <div>
                  <span className="text-text-tertiary">Total Pipeline Value:</span>{' '}
                  <strong className="text-positive font-mono text-xs">{formatCurrency(91400)}</strong>
                </div>
                <span className="text-border-default">|</span>
                <div>
                  <span className="text-text-tertiary">Active Deals:</span>{' '}
                  <strong className="text-text-primary font-mono text-xs">24 Opportunities</strong>
                </div>
                <span className="text-border-default">|</span>
                <div>
                  <span className="text-text-tertiary">Win Rate:</span>{' '}
                  <strong className="text-accent font-mono text-xs">28.4%</strong>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* 4. RIBBON FOR MAP INTELLIGENCE (map)                           */}
          {/* ============================================================== */}
          {activeTab === 'map' && (
            <>
              <div className="flex items-center gap-1.5 pr-3 border-r border-border-dim/50 shrink-0">
                <button
                  onClick={() => triggerRibbonAction(`Geofence set to 15km Metro coverage for ${activeCity}`)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent text-accent-contrast border border-accent font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>15 km Metro Radius</span>
                </button>
                <button
                  onClick={() => triggerRibbonAction('Contractor density heatmap layer active')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-raised hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border-default font-medium transition-all cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Contractor Heatmap</span>
                </button>
              </div>

              <div className="flex items-center gap-2 px-3 shrink-0 text-[11px]">
                <span className="text-text-tertiary">Territory:</span>
                <span className="font-bold text-text-primary">{activeCity}, {regionalProfile.countryCode}</span>
                <span className="text-text-tertiary">({regionalProfile.territoryMetrics.activeCompetitorDensity} local competitors analyzed)</span>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* 5. RIBBON FOR OUTREACH & MESSAGES (campaigns)                  */}
          {/* ============================================================== */}
          {activeTab === 'campaigns' && (
            <>
              <div className="flex items-center gap-1.5 pr-3 border-r border-border-dim/50 shrink-0">
                <button
                  onClick={() => triggerRibbonAction('Drafting new automated outreach sequence')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent text-accent-contrast border border-accent font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Outreach Campaign</span>
                </button>

                <button
                  onClick={() => triggerRibbonAction('Sent test outreach email to owner inbox')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-raised hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border-default font-medium transition-all cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Test Email</span>
                </button>
              </div>

              <div className="flex items-center gap-3 px-3 shrink-0 text-[11px]">
                <div>
                  <span className="text-text-tertiary">Open Rate:</span>{' '}
                  <strong className="text-positive font-mono">46.2%</strong>
                </div>
                <span className="text-border-default">|</span>
                <div>
                  <span className="text-text-tertiary">Reply Rate:</span>{' '}
                  <strong className="text-accent font-mono">14.8%</strong>
                </div>
                <span className="text-border-default">|</span>
                <div>
                  <span className="text-text-tertiary">Daily Dispatch Cap:</span>{' '}
                  <strong className="text-text-secondary font-mono">50 messages/day</strong>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* 6. RIBBON FOR FINANCIALS & REVENUE (revenue-intelligence)      */}
          {/* ============================================================== */}
          {activeTab === 'revenue-intelligence' && (
            <>
              <div className="flex items-center gap-1.5 pr-3 border-r border-border-dim/50 shrink-0">
                <button
                  onClick={() => triggerRibbonAction('Opening new customer invoice creator')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent text-accent-contrast border border-accent font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Invoice</span>
                </button>

                <button
                  onClick={() => triggerRibbonAction('Monthly revenue target updated')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-raised hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border-default font-medium transition-all cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Adjust Monthly Goal</span>
                </button>

                <button
                  onClick={() => triggerRibbonAction('Exporting monthly financial statement')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-raised hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border-default font-medium transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Financial Report</span>
                </button>
              </div>

              <div className="flex items-center gap-3 px-3 shrink-0 text-[11px]">
                <div>
                  <span className="text-text-tertiary">Monthly Run-Rate:</span>{' '}
                  <strong className="text-positive font-mono">{formatCurrency(42850)}</strong>
                </div>
                <span className="text-border-default">|</span>
                <div>
                  <span className="text-text-tertiary">Retainers Active:</span>{' '}
                  <strong className="text-accent font-mono">12 Contractors</strong>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* 7. RIBBON FOR AI ASSISTANT (hermes-lab)                        */}
          {/* ============================================================== */}
          {activeTab === 'hermes-lab' && (
            <>
              <div className="flex items-center gap-1.5 pr-3 border-r border-border-dim/50 shrink-0">
                <button
                  onClick={() => triggerRibbonAction('Prompt drafted: Personalized cold email for contractor')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent text-accent-contrast border border-accent font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Draft Contractor Email</span>
                </button>

                <button
                  onClick={() => triggerRibbonAction('Prompt drafted: Cold calling rebuttal script')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-raised hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border-default font-medium transition-all cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Generate Phone Script</span>
                </button>

                <button
                  onClick={() => triggerRibbonAction('Prompt drafted: Local competitor gap analysis')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-raised hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border-default font-medium transition-all cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Analyze Competitor</span>
                </button>
              </div>

              <div className="flex items-center gap-2 px-3 shrink-0 text-[11px] text-text-secondary">
                <span className="w-2 h-2 rounded-full bg-positive animate-pulse" />
                <span>AI Operating Assistant active • Powered by Google Gemini Enterprise</span>
              </div>
            </>
          )}

          {/* Fallback for secondary tools */}
          {!['overview', 'leads', 'board', 'map', 'campaigns', 'revenue-intelligence', 'hermes-lab'].includes(activeTab) && (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-text-tertiary font-sans text-xs">Secondary Workspace Tool:</span>
                <span className="font-bold text-text-primary text-xs uppercase">{activeTab.replace('-', ' ')}</span>
              </div>
              <button
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-1 text-xs text-accent hover:underline cursor-pointer font-medium"
              >
                <span>Return to Mission Control</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
