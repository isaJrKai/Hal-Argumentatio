import React, { useState } from 'react';
import {
  Search,
  Bell,
  Map,
  Users,
  Send,
  TrendingUp,
  Cpu,
  Download,
  LogOut,
  Activity,
  ListTodo,
  Compass,
  Bot,
  ChevronDown,
  ChevronUp
} from 'lucide-react';import { useBusinessContext } from '../context/BusinessContext';

interface TopTelemetryBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCommandPalette: () => void;
  contractorName?: string;
  companyLogo?: string | null;
  unreadNotificationsCount?: number;
  notifications?: any[];
  clearNotifications?: () => void;
  onMarkNotificationRead?: (notificationId: string) => void;
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
  contractorName = 'Workspace',
  companyLogo,
  unreadNotificationsCount = 0,
  notifications = [],
  clearNotifications,
  onMarkNotificationRead,
  showNotifications = false,
  onToggleNotifications,
  onCloseNotifications,
  onToggleTheme,
  onOpenMobileMenu,
  theme = 'dark',
  isAppInstalled = false,
  onInstallClick,
  onLogout
}) => {
  const { workspaceConfig, activeCity, activeIndustry, supportedCities, setActiveCity, setCity } = useBusinessContext();
  const [isRibbonExpanded, setIsRibbonExpanded] = useState(false);

  // Top Workspace Tabs (AutoCAD Master Panels)
  const topNavTabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'work-history', label: 'Activity', icon: Activity },
    { id: 'work-queue', label: 'Tasks', icon: ListTodo },
    { id: 'leads', label: 'Prospects', icon: Compass },
    { id: 'board', label: 'Sales Pipeline', icon: Users },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'campaigns', label: 'Outreach & Messages', icon: Send },
    { id: 'revenue-intelligence', label: 'Financials', icon: TrendingUp },
    { id: 'hermes-lab', label: 'Business assistant', icon: Cpu },
    { id: 'chat', label: 'Chat', icon: Bot },
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
            <div className="flex items-center gap-2.5">
              <img src="/hal-mark.svg" alt="HAL" className="w-8 h-8 rounded-lg ring-1 ring-border-dim/80 shadow-sm" />
              <span className="text-lg font-semibold tracking-tight text-text-primary font-display">HAL<span className="text-accent">Biz</span></span>
            </div>
            <div className="hidden sm:block h-3.5 w-px bg-border-dim" />
            <span className="hidden sm:block text-xs font-medium text-text-secondary font-sans truncate">
              {workspaceConfig.agencyName || 'Contractor workspace'}
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
            <span className="text-xs font-sans truncate">Search prospects, deals or tools</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold bg-bg-raised text-text-secondary rounded border border-border-dim shrink-0">
            ⌘K
          </kbd>
        </div>

        {/* Right Status Cluster */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Download App Action - Disappears after download */}
          {!isAppInstalled && onInstallClick && (
            <button
              id="download-app-header-btn"
              onClick={onInstallClick}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/85 text-black text-xs font-mono font-bold transition-all cursor-pointer shadow-sm hover:shadow active:scale-95 group shrink-0"
              title="Download & Install HAL Desktop or Mobile App (Disappears once downloaded)"
            >
              <Download className="w-3.5 h-3.5 text-black group-hover:translate-y-0.5 transition-transform" />
              <span className="hidden sm:inline">DOWNLOAD APP</span>
              <span className="sm:hidden">DOWNLOAD</span>
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
                      <button
                        key={notif.id || i}
                        type="button"
                        onClick={() => notif.id && onMarkNotificationRead?.(notif.id)}
                        aria-label={`Mark notification as read: ${notif.title || 'System notification'}`}
                        className={`w-full text-left p-2.5 rounded border space-y-1 transition-colors ${notif.read ? 'bg-bg-subtle border-border-dim' : 'bg-accent-dim/40 border-accent/30'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-text-primary text-xs">{notif.title || 'System Notification'}</span>
                          {!notif.read && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />}
                        </div>
                        <div className="text-[11px] text-text-secondary">{notif.message || notif.text}</div>
                        <span className="text-[10px] text-text-tertiary">{notif.read ? 'Read' : 'Select to mark as read'}</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-text-tertiary text-xs">
                      No notifications to show.
                    </div>
                  )}                </div>
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
        <div id="hal-primary-workspace-tabs" className={`flex items-center gap-1 no-scrollbar py-0.5 min-w-0 ${isRibbonExpanded ? 'flex-wrap overflow-visible' : 'overflow-x-auto'}`}>
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
        <button
          type="button"
          onClick={() => setIsRibbonExpanded(value => !value)}
          aria-expanded={isRibbonExpanded}
          aria-controls="hal-primary-workspace-tabs"
          className="inline-flex items-center gap-1.5 shrink-0 px-2.5 py-2 text-[11px] font-medium text-text-secondary hover:text-text-primary rounded-md border border-border-dim hover:bg-bg-subtle transition-colors"
          title={isRibbonExpanded ? "Collapse workspace ribbon" : "Expand workspace ribbon"}
        >
          {isRibbonExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isRibbonExpanded ? "Collapse ribbon" : "Expand ribbon"}</span>
          <span className="sm:hidden">{isRibbonExpanded ? "Less" : "More"}</span>
        </button>
        <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-border-dim shrink-0">
          <label htmlFor="workspace-territory" className="text-xs text-text-secondary">Territory</label>
          <select
            id="workspace-territory"
            aria-label="Workspace territory"
            value={activeCity}
            onChange={(event) => (setActiveCity ? setActiveCity(event.target.value) : setCity?.(event.target.value))}
            className="max-w-[160px] px-2.5 py-2 rounded-md text-xs font-sans font-medium bg-bg-raised text-text-primary border border-border-dim focus:outline-none focus:border-accent cursor-pointer"
          >
            {Array.from(new Set([activeCity, ...(supportedCities || [])])).map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <span className="text-xs text-text-secondary pl-2">{activeIndustry.name}</span>
        </div>
      </div>


    </div>
  );
};