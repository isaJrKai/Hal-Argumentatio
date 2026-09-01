import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  Activity, 
  LogOut, 
  Sparkles, 
  Play, 
  Bell, 
  Check, 
  X,
  Menu,
  FileText,
  Briefcase,
  Cpu,
  Map,
  Search,
  Compass,
  Shield,
  Flame,
  Sun,
  Moon,
  Paintbrush,
  BookOpen,
  Share2,
  Network,
  Download,
  Laptop,
  Monitor,
  Smartphone,
  ArrowUpRight,
  DollarSign,
  Zap
} from 'lucide-react';

import AuthPage from './components/AuthPage';
import OverviewPanel from './components/OverviewPanel';
import LeadsPanel from './components/LeadsPanel';
import BoardPanel from './components/BoardPanel';
import CampaignsPanel from './components/CampaignsPanel';
import IntelligencePanel from './components/IntelligencePanel';
import HalOpsPanel from './components/HalOpsPanel';
import SettingsPanel from './components/SettingsPanel';
import MissionsPanel from './components/MissionsPanel';
import SkillsPanel from './components/SkillsPanel';
import CommandPalette from './components/CommandPalette';
import HalBiblePanel from './components/HalBiblePanel';
import GoogleDrivePanel from './components/GoogleDrivePanel';
import ConnectorsPanel from './components/ConnectorsPanel';
import NeuralPanel from './components/NeuralPanel';
import DebriefModule from './components/DebriefModule';
import SystemHealthPanel from './components/SystemHealthPanel';
import MapPanel from './components/MapPanel';
import PublicAuditPage from './components/PublicAuditPage';
import DeliveryHub from './components/DeliveryHub';
import PublicPortalPage from './components/PublicPortalPage';
import FinancialsPanel from './components/FinancialsPanel';
import RevenueIntelligenceView from './components/RevenueIntelligenceView';
import HalLoopOperationsView from './components/HalLoopOperationsView';
import { ErrorBoundary } from './components/ErrorBoundary';

import { useBusinessContext } from './context/BusinessContext';

import { 
  Lead, 
  Campaign, 
  Revenue, 
  Forecast, 
  LearningInsight, 
  Recommendation, 
  SchedulerJob, 
  Notification,
  Contractor 
} from './types';

export default function App() {
  const { 
    activeCity, 
    activeNiche, 
    supportedCities, 
    supportedNiches, 
    setActiveCity, 
    setActiveNiche 
  } = useBusinessContext();

  // Authentication State
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token'));
  const [contractor, setContractor] = useState<Contractor | null>(() => {
    const saved = localStorage.getItem('halbiz_auth_contractor');
    return saved ? JSON.parse(saved) : null;
  });

  // Public Interactive Audit Mode Detection (Direct client view without login)
  const [publicAuditId, setPublicAuditId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const auditParam = params.get('audit');
    if (auditParam) return auditParam;
    if (window.location.hash.startsWith('#audit-')) {
      return window.location.hash.replace('#audit-', '');
    }
    return null;
  });

  // Public Client Portal Mode Detection (Direct client delivery portal without operator login)
  const [publicPortalToken, setPublicPortalToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const portalParam = params.get('portal');
    if (portalParam) return portalParam;
    if (window.location.hash.startsWith('#portal-')) {
      return window.location.hash.replace('#portal-', '');
    }
    return null;
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const auditParam = params.get('audit');
      if (auditParam) {
        setPublicAuditId(auditParam);
      } else if (window.location.hash.startsWith('#audit-')) {
        setPublicAuditId(window.location.hash.replace('#audit-', ''));
      } else {
        setPublicAuditId(null);
      }

      const portalParam = params.get('portal');
      if (portalParam) {
        setPublicPortalToken(portalParam);
      } else if (window.location.hash.startsWith('#portal-')) {
        setPublicPortalToken(window.location.hash.replace('#portal-', ''));
      } else {
        setPublicPortalToken(null);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Active Panel Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Business Data Store
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [schedulerJobs, setSchedulerJobs] = useState<SchedulerJob[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // UI States
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [toastAlert, setToastAlert] = useState<{ id: string; title: string; message: string; type: string } | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Device & Form Factor Detection
  const [deviceInfo, setDeviceInfo] = useState(() => {
    if (typeof navigator === 'undefined') {
      return { isMobile: false, isIOS: false, isAndroid: false, isMac: false, isWindows: false };
    }
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /android/i.test(ua);
    const isMobile = isIOS || isAndroid || /Mobi|Tablet|iPad|iPhone/i.test(ua);
    const isMac = /Macintosh|Mac OS X/.test(ua);
    const isWindows = /Windows NT/.test(ua);
    return { isMobile, isIOS, isAndroid, isMac, isWindows };
  });

  // PWA & Installation Status
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    const wasMarkedInstalled = localStorage.getItem('hal_app_installed') === 'true';
    return isStandaloneMode || wasMarkedInstalled;
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showDesktopInstallModal, setShowDesktopInstallModal] = useState(false);

  // Theme & Identity States
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('hal_theme') as 'dark' | 'light') || 'dark';
  });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    return localStorage.getItem('hal_profile_photo');
  });
  const [companyLogo, setCompanyLogo] = useState<string | null>(() => {
    return localStorage.getItem('hal_company_logo');
  });

  const handleProfilePhotoUpdate = (photo: string | null) => {
    if (photo) {
      localStorage.setItem('hal_profile_photo', photo);
    } else {
      localStorage.removeItem('hal_profile_photo');
    }
    setProfilePhoto(photo);
  };

  const handleCompanyLogoUpdate = (logo: string | null) => {
    if (logo) {
      localStorage.setItem('hal_company_logo', logo);
    } else {
      localStorage.removeItem('hal_company_logo');
    }
    setCompanyLogo(logo);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('hal_theme', next);
    setTheme(next);
  };

  // Synchronize theme with document element classList to ensure proper background and variable values
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    }
  }, [theme]);

  // Global fetch interceptor to attach auth tokens and catch expired sessions
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let modifiedInit = init;
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      // Auto-inject Authorization header for /api requests if not already provided and not an auth endpoint
      if (urlStr && urlStr.startsWith('/api') && !urlStr.startsWith('/api/auth/')) {
        const storedToken = localStorage.getItem('halbiz_auth_token');
        if (storedToken) {
          const headers = new Headers(modifiedInit?.headers || {});
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${storedToken}`);
            modifiedInit = { ...modifiedInit, headers };
          }
        }
      }

      const response = await originalFetch(input, modifiedInit);

      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Auto-fetch data on token load
  useEffect(() => {
    let cleanupSSE: (() => void) | undefined;
    if (token) {
      fetchAllData();
      cleanupSSE = setupSSEConnection();
    }
    return () => {
      if (cleanupSSE) cleanupSSE();
      if (sseTimeoutRef.current) clearTimeout(sseTimeoutRef.current);
    };
  }, [token]);

  // Command palette toggle keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for native browser PWA installation triggers and display mode changes
  useEffect(() => {
    // Check display mode
    const mql = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsAppInstalled(true);
        localStorage.setItem('hal_app_installed', 'true');
      }
    };
    mql.addEventListener('change', handleDisplayModeChange);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      console.log('HALBiz was installed successfully');
      setIsAppInstalled(true);
      localStorage.setItem('hal_app_installed', 'true');
      setDeferredPrompt(null);
      setShowDesktopInstallModal(false);
      setToastAlert({
        id: 'installed_' + Date.now(),
        title: 'App Installed',
        message: 'HALBiz is now available on your device.',
        type: 'success'
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mql.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const markAsInstalled = () => {
    setIsAppInstalled(true);
    localStorage.setItem('hal_app_installed', 'true');
    setShowDesktopInstallModal(false);
    setToastAlert({
      id: 'installed_' + Date.now(),
      title: 'App Installed',
      message: deviceInfo.isMobile ? 'HALBiz added to your home screen.' : 'Desktop shortcut downloaded successfully.',
      type: 'success'
    });
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          markAsInstalled();
        }
        setDeferredPrompt(null);
      } catch (err) {
        setShowDesktopInstallModal(true);
      }
    } else {
      setShowDesktopInstallModal(true);
    }
  };

  const downloadWindowsShortcut = () => {
    const currentUrl = window.location.origin;
    const shortcutContent = `[InternetShortcut]\nURL=${currentUrl}\nIconIndex=0\nIconFile=${currentUrl}/icon.jpg\n`;
    const blob = new Blob([shortcutContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'HALBiz.url';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    markAsInstalled();
  };

  const downloadLinuxShortcut = () => {
    const currentUrl = window.location.origin;
    const shortcutContent = `[Desktop Entry]\nName=HALBiz\nComment=AI Business Operating Intelligence System\nExec=xdg-open ${currentUrl}\nIcon=utilities-terminal\nTerminal=false\nType=Application\nCategories=Office;Development;\n`;
    const blob = new Blob([shortcutContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'HALBiz.desktop';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    markAsInstalled();
  };

  const downloadMacShortcut = () => {
    const currentUrl = window.location.origin;
    const shortcutContent = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>URL</key>\n\t<string>${currentUrl}</string>\n</dict>\n</plist>\n`;
    const blob = new Blob([shortcutContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'HALBiz.webloc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    markAsInstalled();
  };

  const fetchAllData = async (retryCount = 0) => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [
        leadsRes, 
        campaignsRes, 
        revenuesRes, 
        forecastsRes, 
        insightsRes, 
        recsRes,
        jobsRes
      ] = await Promise.all([
        fetch('/api/leads', { headers }),
        fetch('/api/campaigns', { headers }),
        fetch('/api/revenues', { headers }),
        fetch('/api/forecasts', { headers }),
        fetch('/api/learning-insights', { headers }),
        fetch('/api/recommendations', { headers }),
        fetch('/api/scheduler/jobs', { headers })
      ]);

      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
      if (revenuesRes.ok) setRevenues(await revenuesRes.json());
      if (forecastsRes.ok) setForecasts(await forecastsRes.json());
      if (insightsRes.ok) setLearningInsights(await insightsRes.json());
      if (recsRes.ok) setRecommendations(await recsRes.json());
      if (jobsRes.ok) setSchedulerJobs(await jobsRes.json());

    } catch (err) {
      console.error('Failed to fetch full application store:', err);
      if (retryCount < 3) {
        setTimeout(() => fetchAllData(retryCount + 1), 2000 * (retryCount + 1));
      } else {
        setToastAlert({
          id: Date.now().toString(),
          title: "Connection Lost",
          message: "Failed to sync with Neural Matrix. The server might be rebooting.",
          type: "system"
        });
      }
    }
  };

  const sseRetryCountRef = useRef(0);
  const sseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setupSSEConnection = () => {
    if (sseTimeoutRef.current) {
      clearTimeout(sseTimeoutRef.current);
    }
    
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      setSseConnected(true);
      sseRetryCountRef.current = 0; // Reset backoff on success
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'notification') {
          const newNotif = payload.data as Notification;
          
          // Verify if notification belongs to current contractor
          if (newNotif.contractorId === contractor?.id) {
            setNotifications(prev => [newNotif, ...prev]);
            
            // Trigger dynamic toast slide-in alert
            setToastAlert({
              id: newNotif.id,
              title: newNotif.title,
              message: newNotif.message,
              type: newNotif.type
            });

            // Auto-dismiss toast
            setTimeout(() => {
              setToastAlert(prev => prev?.id === newNotif.id ? null : prev);
            }, 6000);

            // Instant refresh of data stores
            fetchAllData();
          }
        } else if (payload.type === 'heartbeat') {
          // Heartbeat received, connection is healthy
        }
      } catch (err) {
        console.error('SSE Message parsing failed:', err);
      }
    };

    eventSource.onerror = (err: any) => {
      setSseConnected(false);
      eventSource.close();
      
      // Implement exponential backoff: 2s, 4s, 8s, 16s... up to 30s
      const backoffDelay = Math.min(1000 * Math.pow(2, sseRetryCountRef.current + 1), 30000);
      sseRetryCountRef.current += 1;
      
      console.warn(`SSE Connection lost. Retrying in ${backoffDelay}ms (Attempt ${sseRetryCountRef.current})`);
      
      sseTimeoutRef.current = setTimeout(setupSSEConnection, backoffDelay);
    };

    return () => {
      eventSource.close();
      if (sseTimeoutRef.current) {
        clearTimeout(sseTimeoutRef.current);
      }
    };
  };

  const handleAuthSuccess = (newToken: string, newContractor: Contractor) => {
    localStorage.setItem('halbiz_auth_token', newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('halbiz_auth_contractor', JSON.stringify(newContractor));
    setToken(newToken);
    setContractor(newContractor);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('halbiz_auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('halbiz_auth_contractor');
      setToken(null);
      setContractor(null);
      setNotifications([]);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShowNotificationDropdown(false);
  };

  if (publicAuditId) {
    return (
      <PublicAuditPage 
        auditId={publicAuditId} 
        onNavigateToLogin={() => {
          window.history.pushState(null, '', window.location.pathname);
          window.location.hash = '';
          setPublicAuditId(null);
        }}
      />
    );
  }

  if (publicPortalToken) {
    return (
      <PublicPortalPage 
        token={publicPortalToken} 
        onNavigateToLogin={() => {
          window.history.pushState(null, '', window.location.pathname);
          window.location.hash = '';
          setPublicPortalToken(null);
        }}
      />
    );
  }

  if (!token || !contractor) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Structured navigation hierarchy matching human mental operational domains
  const navigationGroups = [
    {
      group: 'COMMAND & CONTROL',
      items: [
        { id: 'overview', label: 'Mission Control', icon: Sparkles },
        { id: 'forecasts', label: 'Intelligence & Revenue', icon: TrendingUp },
        { id: 'missions', label: 'Operations Center', icon: Briefcase },
      ]
    },
    {
      group: 'GROWTH ENGINE',
      items: [
        { id: 'revenue-intelligence', label: 'Revenue Intelligence', icon: TrendingUp },
        { id: 'leads', label: 'Territory Leads', icon: Compass },
        { id: 'board', label: 'Client Pipeline', icon: Users },
        { id: 'delivery', label: 'Client Delivery Hub', icon: Briefcase },
        { id: 'financials', label: 'Financials & Retainers', icon: DollarSign },
        { id: 'map', label: 'Conquest Map', icon: Map },
        { id: 'campaigns', label: 'Outreach Campaigns', icon: BarChart3 },
      ]
    },
    {
      group: 'COGNITIVE & REASONING',
      items: [
        { id: 'skills', label: 'AI Council & Skills', icon: Cpu },
        { id: 'scheduler', label: 'Simulations & Scans', icon: Play },
        { id: 'loop-engine', label: 'Verified Loop Engine', icon: Zap },
        { id: 'drive', label: 'Knowledge Vault', icon: FileText },
        { id: 'neural', label: 'Neural Intelligence', icon: Network },
        { id: 'debrief', label: 'Outcome Logger', icon: Check },
      ]
    },
    {
      group: 'SYSTEM & IDENTITY',
      items: [
        { id: 'connectors', label: 'Connectors Hub', icon: Share2 },
        { id: 'health', label: 'System Heartbeat', icon: Activity },
        { id: 'bible', label: 'HAL Constitution', icon: BookOpen },
        { id: 'credentials', label: 'Settings & Identity', icon: Settings }
      ]
    }
  ];

  const unreadNotificationsCount = notifications.length;
  const contractorFirstName = contractor?.name ? contractor.name.split(' ')[0] : 'Isaac';

  const isDark = theme === 'dark';
  const baseBg = 'bg-bg-base text-text-primary';
  const sidebarBg = 'bg-bg-raised border-border-dim/60';
  const headerBg = 'bg-bg-overlay border-border-dim/60';
  const footerBg = 'bg-bg-overlay border-border-dim/50';
  const innerBg = 'bg-bg-raised border-border-dim';

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden select-none selection:bg-accent/30 selection:text-white transition-colors duration-200 ${theme === 'light' ? 'light-theme' : 'dark-theme'} ${baseBg}`}>
      
      {/* GLOBAL SSE TOAST ALERT SLIDE-IN */}
      <AnimatePresence>
        {toastAlert && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`fixed top-12 right-6 z-50 max-w-sm border shadow-lg rounded p-4 flex gap-3 ${
              isDark ? 'bg-[#090b11] border-accent/30' : 'bg-white border-[#cbd5e1]'
            }`}
          >
            <div className="w-6 h-6 rounded bg-accent-dim border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>{toastAlert.title}</span>
                <button onClick={() => setToastAlert(null)} className="text-text-secondary hover:text-text-primary transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className={`text-[11px] leading-relaxed font-sans ${isDark ? 'text-text-secondary' : 'text-[#5a5a5a]'}`}>{toastAlert.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMMAND PALETTE */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        leads={leads}
        onNavigate={(tabId) => setActiveTab(tabId)}
        onRunSkill={(skillId) => {
          setActiveTab('skills');
        }}
      />

      {/* MOBILE NAV DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black z-40 md:hidden"
          />
        )}
        {isMobileMenuOpen && (
          <motion.aside
            key="mobile-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] z-50 flex flex-col justify-between select-none border-r md:hidden shadow-2xl h-full ${sidebarBg}`}
          >
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Logo area */}
                <div className="p-4 border-b flex items-center justify-between gap-2.5 border-border-dim/40">
                  <div className="flex items-center gap-2.5">
                    {companyLogo ? (
                      <img 
                        src={companyLogo} 
                        alt="Company Logo" 
                        className="w-8 h-8 rounded-lg object-cover border border-accent/20 shadow-md shadow-accent/5 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                        <div className="w-4 h-4 rounded-full bg-bg-base flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-bold tracking-tight uppercase font-sans text-text-primary">HAL</span>
                      <span className="text-[7.5px] font-mono tracking-widest uppercase leading-none font-semibold text-text-secondary">AI Business Operating</span>
                      <span className="text-[6.5px] font-mono tracking-widest uppercase leading-none mt-0.5 text-text-tertiary">Intelligence System</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close navigation menu"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg border text-text-secondary hover:text-text-primary transition-colors border-border-dim bg-bg-overlay hover:bg-bg-subtle active:scale-95 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable category list with accessible 44px+ touch targets */}
                <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
                  {navigationGroups.map((group) => (
                    <div key={group.group} className="space-y-1">
                      <div className="px-3.5 pt-2 pb-1 text-[8.5px] font-mono font-bold tracking-widest text-text-tertiary uppercase opacity-85">
                        {group.group}
                      </div>
                      {group.items.map((item) => {
                        const active = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`min-h-[44px] px-3.5 py-2.5 w-full flex items-center text-left rounded-lg transition-all border my-1 cursor-pointer ${
                              active 
                                ? 'text-text-primary bg-bg-subtle border-border-dim font-semibold shadow-xs'
                                : 'text-text-secondary hover:text-text-primary border-transparent hover:bg-bg-subtle/60 active:bg-bg-subtle'
                            }`}
                          >
                            <item.icon className={`w-4 h-4 shrink-0 transition-colors mr-3 ${
                              active ? 'text-accent' : 'text-text-secondary'
                            }`} />
                            <span className="text-xs font-mono uppercase tracking-wide truncate">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer of Sidebar */}
              <div className="p-4 border-t bg-bg-overlay/60 flex flex-col gap-2.5 border-border-dim/40">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-text-tertiary">HAL 2.0.0</span>
                  
                  {/* Theme Toggle Button */}
                  <button 
                    onClick={toggleTheme}
                    className="min-h-[44px] px-3 py-2 flex items-center gap-2 rounded-lg border transition-colors bg-bg-overlay hover:bg-bg-subtle active:bg-bg-subtle border-border-dim text-text-secondary hover:text-text-primary cursor-pointer"
                    title="Toggle System Theme"
                    aria-label="Toggle System Theme"
                  >
                    {isDark ? (
                      <>
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[9px] font-bold uppercase">LIGHT</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[9px] font-bold uppercase">DARK</span>
                      </>
                    )}
                  </button>
                </div>
                
                <button 
                  onClick={() => {
                    setActiveTab('credentials');
                    setIsMobileMenuOpen(false);
                  }}
                  className="min-h-[44px] px-3.5 py-2.5 flex items-center justify-between w-full border rounded-lg text-xs font-mono transition-all text-left bg-bg-overlay hover:bg-bg-subtle active:bg-bg-subtle border-border-dim text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    HAL Council
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 font-bold rounded">LIVE</span>
                </button>
              </div>
            </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER (SIDEBAR NAV + HEADER + WORKSPACE) */}
      <div className="flex-1 flex flex-row overflow-hidden w-full h-full min-w-0">
        
        {/* FIXED HIGH-DENSITY SIDEBAR NAV */}
        <aside className={`w-60 shrink-0 border-r flex flex-col justify-between hidden md:flex h-full select-none transition-colors ${sidebarBg}`}>
          
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Logo area */}
            <div className="p-5 border-b flex items-center gap-2.5 border-border-dim/40">
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt="Company Logo" 
                  className="w-8 h-8 rounded-lg object-cover border border-accent/20 shadow-md shadow-accent/5 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                  <div className="w-4 h-4 rounded-full bg-bg-base flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  </div>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight uppercase font-sans text-text-primary">HAL</span>
                <span className="text-[7.5px] font-mono tracking-widest uppercase leading-none font-semibold text-text-secondary">AI Business Operating</span>
                <span className="text-[6.5px] font-mono tracking-widest uppercase leading-none mt-0.5 text-text-tertiary">Intelligence System</span>
              </div>
            </div>

            {/* Scrollable category list */}
            <div className="flex-1 overflow-y-auto py-3.5 px-3 space-y-4">
              {navigationGroups.map((group) => (
                <div key={group.group} className="space-y-0.5">
                  <div className="px-2.5 pb-1 text-[7.5px] font-mono font-bold tracking-widest text-text-tertiary uppercase opacity-75">
                    {group.group}
                  </div>
                  {group.items.map((item) => {
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center h-7.5 px-2.5 w-full text-left rounded transition-all border ${
                          active 
                            ? 'text-text-primary bg-bg-subtle border-border-dim/80 font-semibold shadow-xs'
                            : 'text-text-secondary hover:text-text-primary border-transparent hover:bg-bg-subtle/50'
                        }`}
                      >
                        <item.icon className={`w-3.5 h-3.5 shrink-0 transition-colors mr-2.5 ${
                          active ? 'text-accent' : 'text-text-secondary'
                        }`} />
                        <span className="text-[10px] font-mono uppercase tracking-wider truncate">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Footer of Sidebar */}
          <div className="p-4 border-t bg-bg-overlay/60 flex flex-col gap-2 border-border-dim/40">
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-text-tertiary">HAL 2.0.0</span>
              
              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors bg-bg-overlay hover:bg-bg-subtle border-border-dim text-text-secondary hover:text-text-primary"
                title="Toggle System Theme"
              >
                {isDark ? (
                  <>
                    <Sun className="w-2.5 h-2.5 text-amber-400" />
                    <span className="text-[8px] font-bold uppercase">LIGHT</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-2.5 h-2.5 text-indigo-500" />
                    <span className="text-[8px] font-bold uppercase">DARK</span>
                  </>
                )}
              </button>
            </div>
            
            <button 
              onClick={() => setActiveTab('credentials')}
              className="flex items-center justify-between w-full h-8 px-2.5 border rounded text-[10px] font-mono transition-all text-left bg-bg-overlay hover:bg-bg-subtle border-border-dim text-text-secondary hover:text-text-primary"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                HAL Council
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 font-bold rounded">LIVE</span>
            </button>
          </div>
        </aside>

        {/* MAIN BODY AREA (TOP HEADER + WORKSPACE) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          
          {/* HEADER BAR */}
          <header className={`h-[70px] shrink-0 border-b px-4 md:px-6 flex items-center justify-between z-30 select-none transition-colors ${headerBg}`}>
            {/* Left portion: Greetings & System status */}
            <div className="flex items-center gap-3 md:gap-5">
              {/* Hamburger Menu Toggle on Mobile */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-lg border md:hidden transition-colors shrink-0 bg-bg-overlay border-border-dim text-text-secondary hover:text-text-primary hover:bg-bg-subtle active:scale-95 cursor-pointer"
                title="Open Navigation Menu"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden sm:block">
                <h1 className="text-sm font-bold tracking-tight leading-tight text-text-primary">Good morning, {contractorFirstName}.</h1>
                <p className="text-[10.5px] mt-0.5 leading-none text-text-secondary">Here's what's happening across your business.</p>
              </div>

              {/* Ultra compact mobile logo/title in case greeting is hidden on tiny screens */}
              <div className="sm:hidden flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold tracking-tight uppercase font-sans text-text-primary">HAL OS</span>
                <span className="w-1 h-1 rounded-full bg-positive animate-pulse" />
              </div>

              {/* Status capsule */}
              <button 
                onClick={() => setActiveTab('health')}
                className="hidden lg:flex items-center gap-1.5 border border-border-dim hover:border-accent hover:bg-bg-subtle/50 px-2.5 py-1 rounded-full text-[9.5px] font-mono bg-bg-overlay cursor-pointer transition-all"
                title="View System Diagnostics"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
                <span className="font-semibold uppercase text-text-secondary">All Systems Operational</span>
              </button>

              {/* Install App / Desktop Trigger - Automatically hidden once installed */}
              {!isAppInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 border border-accent/40 hover:border-accent hover:bg-accent/10 px-2.5 py-1 rounded-full text-[9.5px] font-mono bg-bg-overlay/80 cursor-pointer text-accent transition-all shadow-sm shadow-accent/5"
                  title={deviceInfo.isMobile ? "Add HALBiz to Home Screen" : "Download or Install to Desktop"}
                >
                  {deviceInfo.isMobile ? (
                    <Smartphone className="w-3 h-3 text-accent" />
                  ) : (
                    <Download className="w-3 h-3 text-accent" />
                  )}
                  <span className="font-bold uppercase tracking-wider">
                    {deviceInfo.isMobile ? "INSTALL APP" : "INSTALL DESKTOP"}
                  </span>
                </button>
              )}

              {/* HAL Council Stack */}
              <button 
                onClick={() => setActiveTab('skills')}
                className="hidden xl:flex items-center gap-1.5 border border-border-dim hover:border-accent hover:bg-bg-subtle/50 rounded-full px-2.5 py-1 text-[9.5px] bg-bg-overlay cursor-pointer transition-all"
                title="View HAL AI Council & Skills"
              >
                <span className="font-mono mr-1 text-text-secondary">HAL Council:</span>
                <div className="flex -space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 border border-bg-base flex items-center justify-center text-[7px] font-bold text-white" title="Strategy Agent">SA</span>
                  <span className="w-4 h-4 rounded-full bg-emerald-600 border border-bg-base flex items-center justify-center text-[7px] font-bold text-white" title="Marketing Agent">MA</span>
                  <span className="w-4 h-4 rounded-full bg-amber-600 border border-bg-base flex items-center justify-center text-[7px] font-bold text-white" title="Database Agent">DA</span>
                  <span className="w-4 h-4 rounded-full bg-cyan-600 border border-bg-base flex items-center justify-center text-[7px] font-bold text-white" title="Campaign Agent">CA</span>
                  <span className="w-4 h-4 rounded-full bg-fuchsia-600 border border-bg-base flex items-center justify-center text-[7px] font-bold text-white" title="Financial Agent">FA</span>
                  <span className="w-4 h-4 rounded-full border border-bg-base flex items-center justify-center text-[7px] font-bold bg-bg-subtle text-text-secondary">+3</span>
                </div>
              </button>
            </div>

            {/* Right portion: Search, Notifications, Avatar */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              {/* Search button pretending to be an input - collapsed on mobile */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="flex items-center justify-center md:justify-between w-8 h-8 md:w-52 md:h-8 px-2 md:px-2.5 border hover:border-accent/40 rounded-md text-[10.5px] transition-all text-left bg-bg-overlay hover:bg-bg-subtle border-border-dim text-text-secondary"
                title="Search Command Palette"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Ask HAL anything...</span>
                </div>
                <kbd className="hidden md:inline-block px-1 rounded text-[8.5px] border font-mono bg-bg-base border-border-dim">⌘K</kbd>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="p-1.5 rounded-md border transition-colors relative bg-bg-overlay hover:bg-bg-subtle border-border-dim text-text-secondary hover:text-text-primary"
                  title="System Notifications & Alerts"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-accent border-2 border-bg-base animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-84 border rounded-lg shadow-xl p-4 space-y-3 z-50 text-xs bg-bg-raised border-border-dim">
                    <div className="flex justify-between items-center border-b pb-2 border-border-dim">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-text-primary">OPERATIONAL ALERTS</span>
                        {unreadNotificationsCount > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent-dim text-accent font-bold">
                            {unreadNotificationsCount}
                          </span>
                        )}
                      </div>
                      {unreadNotificationsCount > 0 && (
                        <button 
                          onClick={clearNotifications}
                          className="text-[9px] font-mono text-accent hover:text-accent/80 transition-colors font-bold cursor-pointer"
                        >
                          MARK ALL READ
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-0.5">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center space-y-1">
                          <p className="text-[11px] font-sans text-text-secondary">All caught up</p>
                          <p className="text-[9.5px] font-mono text-text-tertiary">No pending system or territory events.</p>
                        </div>
                      ) : (
                        notifications.map(n => {
                          const target = n.targetTab || (
                            n.type.includes('lead') ? 'leads' :
                            n.type.includes('campaign') ? 'campaigns' :
                            n.type.includes('revenue') || n.type.includes('forecast') ? 'forecasts' :
                            n.type.includes('mission') ? 'missions' :
                            n.type.includes('job') || n.type.includes('scheduler') ? 'scheduler' :
                            'overview'
                          );

                          return (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                setActiveTab(target);
                                setShowNotificationDropdown(false);
                              }}
                              className="p-2.5 rounded-lg border leading-relaxed text-[11px] bg-bg-subtle/40 hover:bg-bg-subtle border-border-dim cursor-pointer transition-all hover:border-accent/40 group"
                            >
                              <div className="flex justify-between items-center font-mono text-[9px] mb-1">
                                <span className="text-accent font-bold uppercase truncate max-w-[170px]">{n.title}</span>
                                <span className="text-text-tertiary">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-text-secondary group-hover:text-text-primary text-[10.5px]">{n.message}</p>
                              <div className="flex justify-end items-center gap-1 text-[9px] font-mono text-accent font-bold mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>Go to {target.toUpperCase()}</span>
                                <ArrowUpRight className="w-2.5 h-2.5" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Circle / Profile Photo */}
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt="Profile" 
                  onClick={() => setActiveTab('credentials')}
                  className="w-8 h-8 rounded-full border border-indigo-500/20 object-cover cursor-pointer hover:border-indigo-500 transition-all shadow-md shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  onClick={() => setActiveTab('credentials')}
                  className="w-8 h-8 rounded-full border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center text-xs text-indigo-400 font-bold uppercase cursor-pointer hover:border-indigo-500 transition-all shadow-md shrink-0"
                  title="Profile & Settings"
                >
                  {contractorFirstName.slice(0, 2)}
                </div>
              )}

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md border transition-all bg-transparent hover:bg-bg-subtle border-transparent hover:border-border-dim/20 text-text-secondary hover:text-text-primary"
                title="Logout session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>

            </div>
          </header>

          {/* THE HAL INTELLIGENCE SIGNATURE BAR (1px, scan) */}
          <div className="hal-intelligence-bar shrink-0" />

          {/* WORKSPACE AREA */}
          <main className="flex-1 overflow-y-auto flex flex-col relative transition-colors bg-bg-base min-w-0">
            <div className="p-3 sm:p-5 md:p-6 w-full flex-1 max-w-[1300px] mx-auto min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="panel h-full"
                >
                  <ErrorBoundary>
                    {activeTab === 'overview' && (
                    <OverviewPanel 
                      leads={leads}
                      campaigns={campaigns}
                      revenues={revenues}
                      forecasts={forecasts}
                      setActiveTab={setActiveTab}
                      theme={theme}
                    />
                  )}

                  {activeTab === 'missions' && (
                    <MissionsPanel 
                      token={token}
                      leads={leads}
                      onRefreshLeads={fetchAllData}
                    />
                  )}

                  {activeTab === 'skills' && (
                    <SkillsPanel 
                      token={token}
                    />
                  )}

                  {activeTab === 'leads' && (
                    <LeadsPanel 
                      leads={leads}
                      token={token}
                      onRefresh={fetchAllData}
                    />
                  )}

                  {activeTab === 'map' && (
                    <MapPanel 
                      leads={leads}
                      token={token}
                    />
                  )}

                  {activeTab === 'board' && (
                    <BoardPanel 
                      leads={leads}
                      token={token}
                      onRefresh={fetchAllData}
                    />
                  )}

                  {activeTab === 'delivery' && (
                    <DeliveryHub 
                      token={token}
                      leads={leads}
                    />
                  )}

                  {activeTab === 'financials' && (
                    <FinancialsPanel 
                      token={token}
                    />
                  )}

                  {activeTab === 'campaigns' && (
                    <CampaignsPanel 
                      campaigns={campaigns}
                      leads={leads}
                      token={token}
                      onRefresh={fetchAllData}
                    />
                  )}

                  {activeTab === 'forecasts' && (
                    <IntelligencePanel 
                      forecasts={forecasts}
                      learningInsights={learningInsights}
                      token={token}
                      onRefresh={fetchAllData}
                    />
                  )}

                  {activeTab === 'scheduler' && (
                    <HalOpsPanel 
                      jobs={schedulerJobs}
                      recommendations={recommendations}
                      token={token}
                      onRefresh={fetchAllData}
                    />
                  )}

                  {activeTab === 'revenue-intelligence' && (
                    <RevenueIntelligenceView token={token} />
                  )}

                  {activeTab === 'loop-engine' && (
                    <HalLoopOperationsView token={token} />
                  )}

                  {activeTab === 'credentials' && (
                    <SettingsPanel 
                      token={token}
                      theme={theme}
                      profilePhoto={profilePhoto}
                      companyLogo={companyLogo}
                      onProfilePhotoUpdate={handleProfilePhotoUpdate}
                      onCompanyLogoUpdate={handleCompanyLogoUpdate}
                      onRefresh={fetchAllData}
                    />
                  )}

                  {activeTab === 'connectors' && (
                    <ConnectorsPanel />
                  )}

                  {(activeTab === 'neural' || activeTab === 'synaptic') && (
                    <NeuralPanel />
                  )}

                  {activeTab === 'debrief' && (
                    <DebriefModule />
                  )}

                  {activeTab === 'health' && (
                    <SystemHealthPanel token={token} />
                  )}

                  {activeTab === 'bible' && (
                    <HalBiblePanel />
                  )}

                  {activeTab === 'drive' && (
                    <GoogleDrivePanel />
                  )}
                  </ErrorBoundary>
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

      </div>

      {/* METICULOUS BOTTOM STATUS BAR */}
      <footer className="h-6 shrink-0 border-t border-border-dim/50 bg-bg-overlay text-text-secondary flex items-center justify-between px-4 text-[9.5px] font-mono transition-colors select-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('bible')} 
            className="text-accent font-semibold hover:underline cursor-pointer"
          >
            HAL v2.0
          </button>
          <span className="text-text-tertiary">|</span>
          <button 
            onClick={() => setActiveTab('credentials')} 
            className="hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
          >
            DATABASE: {typeof window !== 'undefined' && localStorage.getItem('halbiz_postgres_url') ? 'NEON_POSTGRES' : 'SECURE_SQLITE'}
          </button>
          <span className="text-text-tertiary">|</span>
          <button 
            onClick={() => setActiveTab('leads')} 
            className="hover:text-accent hover:underline cursor-pointer"
          >
            RECORDS: {leads.length} PROSPECTS
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('connectors')} 
            className="hover:text-accent hover:underline cursor-pointer"
          >
            REALTIME_STREAM: ACTIVE
          </button>
          <span className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
        </div>
      </footer>

      {/* APP INSTALLATION MODAL (ADAPTIVE MOBILE & DESKTOP) */}
      <AnimatePresence>
        {showDesktopInstallModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDesktopInstallModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`relative max-w-lg w-full rounded-xl border border-border-dim/80 shadow-2xl overflow-hidden p-6 text-center z-50 ${
                isDark ? 'bg-[#0b0e14] text-text-primary border-accent/20' : 'bg-white text-gray-900 border-gray-200'
              }`}
            >
              <button
                onClick={() => setShowDesktopInstallModal(false)}
                className="absolute top-4 right-4 p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-all cursor-pointer border border-transparent hover:border-border-dim"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon Container */}
              <div className="relative w-20 h-20 mx-auto mb-4">
                <img
                  src="/icon.jpg"
                  alt="HALBiz App Icon"
                  className="w-20 h-20 rounded-2xl border-2 border-accent/40 shadow-xl shadow-accent/10 object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 bg-accent text-black rounded-full p-1.5 border border-bg-raised">
                  {deviceInfo.isMobile ? (
                    <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <Monitor className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                </span>
              </div>

              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-text-primary">
                {deviceInfo.isMobile ? 'HALBiz Mobile Application' : 'HALBiz Desktop Application Matrix'}
              </h2>
              <p className="text-[10.5px] text-text-secondary mt-1.5 font-sans max-w-xs mx-auto leading-relaxed">
                {deviceInfo.isMobile 
                  ? 'Add HALBiz to your home screen for standalone, full-screen mobile execution and instant offline intelligence.' 
                  : 'Connect your business intelligence engine directly to your desktop workspace for standalone, borders-free execution.'}
              </p>

              {/* Mobile-Specific Installation Interface */}
              {deviceInfo.isMobile ? (
                <div className="mt-5 text-left space-y-3.5">
                  {deviceInfo.isIOS ? (
                    <div className="border border-border-dim/80 rounded-xl p-4 bg-bg-base/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-accent" />
                        <span className="text-xs font-mono font-bold uppercase tracking-wide text-text-primary">iOS Safari Setup</span>
                      </div>
                      <ol className="text-[11px] font-sans text-text-secondary space-y-2 list-decimal list-inside leading-relaxed">
                        <li>
                          Tap the <span className="font-semibold text-text-primary border border-border-dim px-1.5 py-0.5 rounded bg-bg-overlay font-mono">Share</span> icon (box with upward arrow ⎋) in your Safari toolbar.
                        </li>
                        <li>
                          Scroll down and tap <span className="font-semibold text-accent border border-accent/20 px-1.5 py-0.5 rounded bg-accent/10 font-mono">Add to Home Screen ⊞</span>.
                        </li>
                        <li>
                          Tap <span className="font-semibold text-text-primary font-mono">Add</span> in the top right corner to complete installation.
                        </li>
                      </ol>
                    </div>
                  ) : (
                    <div className="border border-border-dim/80 rounded-xl p-4 bg-bg-base/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-accent" />
                        <span className="text-xs font-mono font-bold uppercase tracking-wide text-text-primary">Android / Chrome Setup</span>
                      </div>
                      {deferredPrompt ? (
                        <button
                          onClick={handleInstallClick}
                          className="w-full py-2.5 bg-accent hover:bg-accent/90 text-black font-mono font-bold text-xs rounded-lg shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          INSTALL HALBIZ TO HOME SCREEN
                        </button>
                      ) : (
                        <ol className="text-[11px] font-sans text-text-secondary space-y-2 list-decimal list-inside leading-relaxed">
                          <li>
                            Tap the <span className="font-semibold text-text-primary font-mono">⋮ Menu</span> in the top right of Chrome.
                          </li>
                          <li>
                            Select <span className="font-semibold text-accent font-mono">Install app</span> or <span className="font-semibold text-accent font-mono">Add to Home screen</span>.
                          </li>
                        </ol>
                      )}
                    </div>
                  )}

                  <button
                    onClick={markAsInstalled}
                    className="w-full py-2 border border-border-dim hover:border-accent hover:bg-bg-subtle text-text-secondary hover:text-text-primary font-mono text-[11px] rounded-lg transition-all cursor-pointer font-semibold"
                  >
                    I've Added It to My Home Screen
                  </button>
                </div>
              ) : (
                /* Desktop Installation Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-left">
                  {/* Method 1: Progressive Web App (PWA) */}
                  <div className="border border-border-dim/60 rounded-lg p-3.5 bg-bg-base/40 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-accent" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-primary">Chrome / Edge PWA</span>
                    </div>
                    <p className="text-[9.5px] text-text-secondary leading-relaxed font-sans">
                      Run HALBiz as a standalone borderless app on Mac, Windows, or Linux. Excellent performance and seamless offline sync.
                    </p>
                    <ol className="text-[9px] font-mono text-text-tertiary list-decimal list-inside space-y-0.5 leading-normal">
                      <li>Look at the browser address bar</li>
                      <li>Click the <span className="text-accent font-bold">Install</span> icon (⊕)</li>
                      <li>Select "Install App" to complete</li>
                    </ol>
                    {deferredPrompt && (
                      <button
                        onClick={handleInstallClick}
                        className="w-full mt-2 py-1.5 bg-accent hover:bg-accent/80 text-black text-[9.5px] font-mono font-bold rounded shadow transition-all cursor-pointer"
                      >
                        INSTALL NATIVE PWA
                      </button>
                    )}
                  </div>

                  {/* Method 2: Offline Desktop Launchers */}
                  <div className="border border-border-dim/60 rounded-lg p-3.5 bg-bg-base/40 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-accent animate-bounce" style={{ animationDuration: '3s' }} />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-primary">Direct Shortcuts</span>
                    </div>
                    <p className="text-[9.5px] text-text-secondary leading-relaxed font-sans">
                      Download specialized shortcut files designed for direct launch from your local desktop screen.
                    </p>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <button
                        onClick={downloadWindowsShortcut}
                        className="w-full text-center py-1 bg-accent hover:bg-accent/80 text-black text-[9.5px] font-mono font-bold rounded shadow transition-all cursor-pointer"
                      >
                        DOWNLOAD WINDOWS (.URL)
                      </button>
                      <button
                        onClick={downloadMacShortcut}
                        className="w-full text-center py-1 bg-bg-raised border border-border-dim hover:border-text-tertiary text-text-secondary hover:text-text-primary text-[9.5px] font-mono font-bold rounded transition-all cursor-pointer"
                      >
                        DOWNLOAD MACOS (.WEBLOC)
                      </button>
                      <button
                        onClick={downloadLinuxShortcut}
                        className="w-full text-center py-1 bg-bg-raised border border-border-dim hover:border-text-tertiary text-text-secondary hover:text-text-primary text-[9.5px] font-mono font-bold rounded transition-all cursor-pointer"
                      >
                        DOWNLOAD LINUX (.DESKTOP)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer notice */}
              <div className="mt-5 pt-3 border-t border-border-dim flex items-center justify-between text-[8px] font-mono text-text-tertiary">
                <span>LICENSED TO HAL OS v2.0.0</span>
                <span>SECURED & ISOLATED</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
