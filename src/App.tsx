import { lazy, Suspense, useState, useEffect, useRef } from 'react';
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
  Zap,
  Wrench,
  Mail,
  Globe,
  FileCheck,
  FileCheck2,
  Building2,
  Calculator,
  Layout,
  Bot,
  MessageSquare,
  LineChart,
  RefreshCw,
  Send
} from 'lucide-react';

import AuthPage from './components/AuthPage';
const OverviewPanel = lazy(() => import('./components/OverviewPanel'));
const LeadsPanel = lazy(() => import('./components/LeadsPanel'));
const BoardPanel = lazy(() => import('./components/BoardPanel'));
const CampaignsPanel = lazy(() => import('./components/CampaignsPanel'));
const IntelligencePanel = lazy(() => import('./components/IntelligencePanel'));
const HalOpsPanel = lazy(() => import('./components/HalOpsPanel'));
const SettingsPanel = lazy(() => import('./components/SettingsPanel'));
const MissionsPanel = lazy(() => import('./components/MissionsPanel'));
const SkillsPanel = lazy(() => import('./components/SkillsPanel'));
import CommandPalette from './components/CommandPalette';
const HalBiblePanel = lazy(() => import('./components/HalBiblePanel'));
const GoogleDrivePanel = lazy(() => import('./components/GoogleDrivePanel'));
const ConnectorsPanel = lazy(() => import('./components/ConnectorsPanel'));
const NeuralPanel = lazy(() => import('./components/NeuralPanel'));
const DebriefModule = lazy(() => import('./components/DebriefModule'));
const SystemHealthPanel = lazy(() => import('./components/SystemHealthPanel'));
const MapPanel = lazy(() => import('./components/MapPanel'));
import PublicAuditPage from './components/PublicAuditPage';
const DeliveryHub = lazy(() => import('./components/DeliveryHub'));
import PublicPortalPage from './components/PublicPortalPage';
const FinancialsPanel = lazy(() => import('./components/FinancialsPanel'));
const RevenueIntelligenceView = lazy(() => import('./components/RevenueIntelligenceView'));
const HalLoopOperationsView = lazy(() => import('./components/HalLoopOperationsView'));
const HermesLabPanel = lazy(() => import('./components/HermesLabPanel'));
const BlueprintViewerPanel = lazy(() => import('./components/BlueprintViewerPanel').then(module => ({ default: module.BlueprintViewerPanel })));
import { ErrorBoundary } from './components/ErrorBoundary';

// 4-Zone Workstation Shell & Tools
import { InspectorProvider } from './context/InspectorContext';
import { TopTelemetryBar } from './components/TopTelemetryBar';
import { RightInspector } from './components/RightInspector';
const EmailDesignerPanel = lazy(() => import('./components/EmailDesignerPanel').then(module => ({ default: module.EmailDesignerPanel })));
const LandingPageStudioPanel = lazy(() => import('./components/LandingPageStudioPanel').then(module => ({ default: module.LandingPageStudioPanel })));
const FormBuilderPanel = lazy(() => import('./components/FormBuilderPanel').then(module => ({ default: module.FormBuilderPanel })));
const ContractsStudioPanel = lazy(() => import('./components/ContractsStudioPanel').then(module => ({ default: module.ContractsStudioPanel })));
const WhiteLabelReportsStudioPanel = lazy(() => import('./components/WhiteLabelReportsStudioPanel').then(module => ({ default: module.WhiteLabelReportsStudioPanel })));
const DocumentStudioPanel = lazy(() => import('./components/DocumentStudioPanel').then(module => ({ default: module.DocumentStudioPanel })));
const CalculatorsSection = lazy(() => import('./components/CalculatorsSection'));
const ChatBotPanel = lazy(() => import('./components/ChatBotPanel').then(module => ({ default: module.ChatBotPanel })));
const UnifiedCommunicationsHub = lazy(() => import('./components/UnifiedCommunicationsHub').then(module => ({ default: module.UnifiedCommunicationsHub })));

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

  // Explicit UI review mode: append ?review=1 to inspect the workspace without signing in.
  // This never creates a session or grants backend/API access.
  const [reviewMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('review') === '1';
  });

  // Authentication State
  const [token, setToken] = useState<string | null>(() => {
    if (reviewMode) return null;
    return localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token');
  });
  const [contractor, setContractor] = useState<Contractor | null>(() => {
    if (reviewMode) {
      return { id: 'review-mode', email: 'review@halbiz.local', name: 'Workspace Preview', role: 'user' };
    }
    const saved = localStorage.getItem('halbiz_auth_contractor');
    return saved ? JSON.parse(saved) : null;
  });

  // Session rehydration and token validation on mount
  useEffect(() => {
    const existingToken = localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token');
    if (existingToken) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${existingToken}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Session invalid');
          return res.json();
        })
        .then(data => {
          if (data.contractor) {
            setContractor(data.contractor);
            localStorage.setItem('halbiz_auth_contractor', JSON.stringify(data.contractor));
          }
        })
        .catch(() => {
          console.warn('Session verification failed, requesting re-authentication.');
        });
    }
  }, []);

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
    return isStandaloneMode;
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showDesktopInstallModal, setShowDesktopInstallModal] = useState(false);

  // Theme & Identity States
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('hal_theme') as 'dark' | 'light' | null;
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
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

  // Follow OS theme changes live while the user has not picked a theme manually
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: light)');
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('hal_theme')) setTheme(e.matches ? 'light' : 'dark');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

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

  // Global fetch interceptor to attach auth tokens, handle transient network hiccups, and catch expired sessions
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let modifiedInit = init ? { ...init } : {};
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      // Auto-inject or repair Authorization header for /api requests if not an auth endpoint
      if (urlStr && urlStr.startsWith('/api') && !urlStr.startsWith('/api/auth/')) {
        const storedToken = localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token');
        if (storedToken) {
          const headers = new Headers(modifiedInit.headers || {});
          const existingAuth = headers.get('Authorization');
          const isInvalidAuth = !existingAuth ||
            existingAuth === 'Bearer' ||
            existingAuth === 'Bearer ' ||
            existingAuth === 'Bearer null' ||
            existingAuth === 'Bearer undefined' ||
            existingAuth.trim() === 'Bearer';

          if (isInvalidAuth) {
            headers.set('Authorization', `Bearer ${storedToken}`);
            modifiedInit.headers = headers;
          }
        }
      }

      // Execute request with resilient retry for ephemeral dev-server boot / network stalls
      let response: Response;
      try {
        response = await originalFetch(input, modifiedInit);
      } catch (networkErr: any) {
        const method = (modifiedInit.method || 'GET').toUpperCase();
        if (method === 'GET' && urlStr && urlStr.startsWith('/api')) {
          // Dev server / Vite middleware warm-up retry: wait 350ms and retry once
          await new Promise((resolve) => setTimeout(resolve, 350));
          try {
            response = await originalFetch(input, modifiedInit);
          } catch (retryErr) {
            // One final backoff attempt
            await new Promise((resolve) => setTimeout(resolve, 700));
            response = await originalFetch(input, modifiedInit);
          }
        } else {
          throw networkErr;
        }
      }

      // Gracefully handle genuinely expired authentication tokens across /api calls
      if (response.status === 401 && urlStr && urlStr.startsWith('/api') && !urlStr.startsWith('/api/auth/')) {
        const hasStoredSession = localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token');
        if (hasStoredSession) {
          console.warn('Session token expired or invalid; resetting authentication state.');
          localStorage.removeItem('halbiz_auth_token');
          localStorage.removeItem('token');
          localStorage.removeItem('halbiz_auth_contractor');
          setToken(null);
          setContractor(null);
          window.dispatchEvent(new Event('halbiz_auth_expired'));
        }
      }

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

      const safeFetchJson = async (url: string) => {
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      };

      const results = await Promise.allSettled([
        safeFetchJson('/api/leads'),
        safeFetchJson('/api/campaigns'),
        safeFetchJson('/api/revenues'),
        safeFetchJson('/api/forecasts'),
        safeFetchJson('/api/learning-insights'),
        safeFetchJson('/api/recommendations'),
        safeFetchJson('/api/scheduler/jobs')
      ]);

      const [leadsRes, campaignsRes, revenuesRes, forecastsRes, insightsRes, recsRes, jobsRes] = results;

      if (leadsRes.status === 'fulfilled') setLeads(leadsRes.value);
      if (campaignsRes.status === 'fulfilled') setCampaigns(campaignsRes.value);
      if (revenuesRes.status === 'fulfilled') setRevenues(revenuesRes.value);
      if (forecastsRes.status === 'fulfilled') setForecasts(forecastsRes.value);
      if (insightsRes.status === 'fulfilled') setLearningInsights(insightsRes.value);
      if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value);
      if (jobsRes.status === 'fulfilled') setSchedulerJobs(jobsRes.value);

      // If all failed (e.g. server rebooting or offline), trigger retry
      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) {
        throw new Error('All store endpoints rejected');
      }

    } catch (err) {
      if (retryCount < 3) {
        setTimeout(() => fetchAllData(retryCount + 1), 1500 * (retryCount + 1));
      } else {
        console.warn('Failed to fetch full application store after retries:', err);
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
    
    const token = localStorage.getItem('token');
    if (!token) return;

    const eventSource = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);

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

  // Public Community Sandbox indicator for shared link (ais-pre) or Reddit visitors
  const isSharedPreview = typeof window !== 'undefined' && (
    window.location.hostname.includes('ais-pre-') ||
    document.referrer.toLowerCase().includes('reddit.com') ||
    document.referrer.toLowerCase().includes('redd.it')
  );

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

  if ((!token || !contractor) && !reviewMode) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Structured navigation hierarchy for left panel (tools not represented in the top ribbon)
  const navigationGroups = [
    {
      group: 'OPERATING INTELLIGENCE',
      items: [
        { id: 'chat', label: 'HAL Copilot', icon: Bot },
        { id: 'loop-engine', label: 'Operating Loop', icon: RefreshCw },
        { id: 'hermes-lab', label: 'Hermes Studio', icon: Sparkles },
        { id: 'neural', label: 'Decision Engine', icon: Network },
      ]
    },
    {
      group: 'CLIENT & FIELD OPERATIONS',
      items: [
        { id: 'delivery', label: 'Client Work Orders', icon: Briefcase },
        { id: 'contracts', label: 'Contracts & Agreements', icon: FileCheck2 },
        { id: 'whitelabel-reports', label: 'Client Reports', icon: Building2 },
        { id: 'form-builder', label: 'Lead Capture Forms', icon: FileCheck },
        { id: 'debrief', label: 'Deal Logger', icon: Check },
      ]
    },
    {
      group: 'MARKETING & DESIGN STUDIO',
      items: [
        { id: 'communications', label: 'Outreach Hub', icon: Send },
        { id: 'document-studio', label: 'Document Studio', icon: FileText },
        { id: 'email-designer', label: 'Email Designer', icon: Mail },
        { id: 'landing-studio', label: 'Landing Pages', icon: Globe },
        { id: 'calculators', label: 'ROI Calculators', icon: Calculator },
      ]
    },
    {
      group: 'COMPANY KNOWLEDGE & TASKS',
      items: [
        { id: 'drive', label: 'Company Vault', icon: FileText },
        { id: 'skills', label: 'AI Business Skills', icon: Sparkles },
        { id: 'scheduler', label: 'Task Schedule', icon: Play },
      ]
    },
    {
      group: 'SETTINGS & INTEGRATIONS',
      items: [
        { id: 'connectors', label: 'Connected Apps', icon: Share2 },
        { id: 'credentials', label: 'Settings & Keys', icon: Settings },
        { id: 'about', label: 'Operating Manual', icon: BookOpen },
        { id: 'health', label: 'System Status', icon: Activity }
      ]
    }
  ];

  const unreadNotificationsCount = notifications.length;
  const contractorFirstName = contractor?.name ? contractor.name.split(' ')[0] : 'Operator';

  const isDark = theme === 'dark';
  const baseBg = 'bg-bg-base text-text-primary';
  const sidebarBg = 'bg-bg-raised border-border-dim/60';
  const headerBg = 'bg-bg-overlay border-border-dim/60';
  const footerBg = 'bg-bg-overlay border-border-dim/50';
  const innerBg = 'bg-bg-raised border-border-dim';

  return (
    <InspectorProvider>
      <div className={`h-screen flex flex-col font-sans overflow-hidden select-none selection:bg-accent/30 selection:text-white transition-colors duration-200 ${theme === 'light' ? 'light-theme' : 'dark-theme'} ${baseBg}`}>

      {/* PUBLIC COMMUNITY SANDBOX BANNER (REDDIT / SHARED LINK VISITORS) */}
      {isSharedPreview && (
        <div className="bg-brand/10 border-b border-brand/20 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-brand z-30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span className="font-bold tracking-wide">PUBLIC COMMUNITY TESTING SANDBOX</span>
            <span className="text-text-secondary hidden md:inline">— Live Telemetry, Isolated Demo Ledger & Gemini Rate Shield Active</span>
          </div>
          <span className="text-[10px] text-text-tertiary font-bold tracking-widest uppercase">Safe Mode</span>
        </div>
      )}
      
      {reviewMode && (
        <div role="status" className="bg-amber-950 border-b border-amber-700 px-4 py-2 text-amber-100 text-xs font-mono shrink-0">
          REVIEW MODE — UI inspection only. No account session is created; data and actions that require the server will not work until login is repaired. Do not enter real customer or business information.
        </div>
      )}

      {/* GLOBAL SSE TOAST ALERT SLIDE-IN */}
      <AnimatePresence>
        {toastAlert && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-12 right-6 z-50 max-w-sm border border-border-default shadow-lg rounded-lg p-4 flex gap-3 bg-bg-raised text-text-primary"
          >
            <div className="w-6 h-6 rounded bg-accent-dim border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-primary">{toastAlert.title}</span>
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
                {/* Mobile Header Bar with Close Button */}
                <div className="p-3 border-b flex items-center justify-between border-border-dim/40">
                  <span className="text-xs font-mono font-bold tracking-wider text-text-tertiary uppercase">Navigation</span>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close navigation menu"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-lg border text-text-secondary hover:text-text-primary transition-colors border-border-dim bg-bg-overlay hover:bg-bg-subtle active:scale-95 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
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
                            <span className="text-xs font-sans font-medium truncate">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer of Mobile Menu */}
              <div className="p-3.5 border-t bg-bg-overlay/60 flex items-center justify-between text-xs font-sans text-text-tertiary border-border-dim/40">
                <span className="font-semibold text-text-secondary text-xs">HAL Enterprise</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-dim text-accent font-bold">v2.0</span>
              </div>
            </motion.aside>
        )}
      </AnimatePresence>

      {/* ZONE 1: TOP NAVIGATION & TELEMETRY RIBBON */}
      <TopTelemetryBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        contractorName={contractor?.name}
        companyLogo={companyLogo}
        unreadNotificationsCount={unreadNotificationsCount}
        notifications={notifications}
        clearNotifications={clearNotifications}
        showNotifications={showNotificationDropdown}
        onToggleNotifications={() => setShowNotificationDropdown(prev => !prev)}
        onCloseNotifications={() => setShowNotificationDropdown(false)}
        onToggleTheme={toggleTheme}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        theme={theme}
        isAppInstalled={isAppInstalled || !deferredPrompt}
        onInstallClick={handleInstallClick}
        onLogout={handleLogout}
      />

      {/* MAIN CONTAINER (SIDEBAR NAV + HEADER + WORKSPACE + RIGHT INSPECTOR) */}
      <div className="flex-1 flex flex-row overflow-hidden w-full h-full min-w-0">
        
        {/* FIXED HIGH-DENSITY SIDEBAR NAV */}
        <aside className={`w-64 shrink-0 border-r flex flex-col justify-between hidden md:flex h-full select-none transition-colors ${sidebarBg}`}>
          
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Scrollable category list */}
            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
              {navigationGroups.map((group) => (
                <div key={group.group} className="space-y-0.5">
                  <div className="px-2.5 pb-1 text-[8px] font-mono font-bold tracking-widest text-text-tertiary uppercase opacity-85">
                    {group.group}
                  </div>
                  {group.items.map((item) => {
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center h-8 px-2.5 w-full text-left rounded-md transition-all border ${
                          active 
                            ? 'text-text-primary bg-bg-subtle border-border-dim/80 font-semibold shadow-xs'
                            : 'text-text-secondary hover:text-text-primary border-transparent hover:bg-bg-subtle/50'
                        }`}
                      >
                        <item.icon className={`w-3.5 h-3.5 shrink-0 transition-colors mr-2.5 ${
                          active ? 'text-accent' : 'text-text-secondary'
                        }`} />
                        <span className="text-[11.5px] font-sans font-medium text-inherit truncate">
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
          <div className="p-3 border-t bg-bg-overlay/60 space-y-2 border-border-dim/40">
            <div className="flex items-center justify-between text-xs font-sans text-text-tertiary">
              <span className="font-semibold text-text-secondary text-[11px]">HAL Enterprise</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-dim text-accent font-bold">v2.0</span>
            </div>

            {!isAppInstalled && (
              <button
                id="sidebar-download-app-btn"
                onClick={handleInstallClick}
                className="flex items-center justify-center gap-1.5 w-full h-8 px-2.5 rounded text-[10px] font-mono font-bold transition-all bg-accent hover:bg-accent/85 text-black shadow-xs cursor-pointer"
                title="Download HAL Desktop App (Disappears after download)"
              >
                <Download className="w-3.5 h-3.5 text-black" />
                <span>DOWNLOAD APP</span>
              </button>
            )}
          </div>
        </aside>

        {/* MAIN BODY AREA (WORKSPACE + RIGHT INSPECTOR) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          
          {/* THE HAL INTELLIGENCE SIGNATURE BAR (1px, scan) */}
          <div className="hal-intelligence-bar shrink-0" />

          {/* WORKSPACE AREA */}
          <main className="flex-1 overflow-y-auto flex flex-col relative transition-colors bg-bg-base min-w-0">
            <div className="p-2 sm:p-4 md:p-5 w-full flex-1 min-w-0">

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
                    <Suspense fallback={
                      <div className="h-full min-h-[240px] flex items-center justify-center text-xs font-mono text-text-tertiary">
                        Loading workspace module…
                      </div>
                    }>
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

                  {activeTab === 'blueprint' && (
                    <BlueprintViewerPanel 
                      onBackToDashboard={() => setActiveTab('overview')}
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

                  {activeTab === 'hermes-lab' && (
                    <HermesLabPanel token={token} />
                  )}

                  {activeTab === 'chat' && (
                    <ChatBotPanel token={token} />
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
                      initialSubTab="settings"
                    />
                  )}

                  {(activeTab === 'about' || activeTab === 'bible' || activeTab === 'roadmap') && (
                    <SettingsPanel 
                      token={token}
                      theme={theme}
                      profilePhoto={profilePhoto}
                      companyLogo={companyLogo}
                      onProfilePhotoUpdate={handleProfilePhotoUpdate}
                      onCompanyLogoUpdate={handleCompanyLogoUpdate}
                      onRefresh={fetchAllData}
                      initialSubTab="about"
                      initialDocId={activeTab === 'roadmap' ? '20' : undefined}
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

                  {activeTab === 'drive' && (
                    <GoogleDrivePanel />
                  )}

                  {/* ─── NEW PROFESSIONAL TOOLS SUITE ─── */}
                  {activeTab === 'communications' && (
                    <UnifiedCommunicationsHub
                      leads={leads}
                      token={token}
                      onRefresh={fetchAllData}
                    />
                  )}

                  {activeTab === 'document-studio' && (
                    <DocumentStudioPanel token={token} />
                  )}

                  {activeTab === 'email-designer' && (
                    <EmailDesignerPanel />
                  )}

                  {activeTab === 'landing-studio' && (
                    <LandingPageStudioPanel token={token} />
                  )}

                  {activeTab === 'form-builder' && (
                    <FormBuilderPanel />
                  )}

                  {activeTab === 'contracts' && (
                    <ContractsStudioPanel token={token} />
                  )}

                  {activeTab === 'whitelabel-reports' && (
                    <WhiteLabelReportsStudioPanel token={token} />
                  )}

                  {activeTab === 'calculators' && (
                    <CalculatorsSection />
                  )}
                    </Suspense>
                  </ErrorBoundary>
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* ZONE 4: CONTEXTUAL RIGHT INSPECTOR */}
        <RightInspector />
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
              className="relative max-w-lg w-full rounded-xl border border-border-default shadow-2xl overflow-hidden p-6 text-center z-50 bg-bg-raised text-text-primary"
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
                        className={`w-full text-center py-1.5 ${deviceInfo.isWindows || (!deviceInfo.isMac && !deviceInfo.isLinux) ? 'bg-accent hover:bg-accent/80 text-black font-bold' : 'bg-bg-raised border border-border-dim hover:border-text-tertiary text-text-secondary hover:text-text-primary'} text-[9.5px] font-mono rounded shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5`}
                      >
                        <Download className="w-3 h-3" />
                        <span>DOWNLOAD WINDOWS (.URL)</span>
                        {deviceInfo.isWindows && <span className="text-[8px] bg-black text-accent px-1 rounded">DETECTED</span>}
                      </button>
                      <button
                        onClick={downloadMacShortcut}
                        className={`w-full text-center py-1.5 ${deviceInfo.isMac ? 'bg-accent hover:bg-accent/80 text-black font-bold' : 'bg-bg-raised border border-border-dim hover:border-text-tertiary text-text-secondary hover:text-text-primary'} text-[9.5px] font-mono rounded transition-all cursor-pointer flex items-center justify-center gap-1.5`}
                      >
                        <Download className="w-3 h-3" />
                        <span>DOWNLOAD MACOS (.WEBLOC)</span>
                        {deviceInfo.isMac && <span className="text-[8px] bg-black text-accent px-1 rounded">DETECTED</span>}
                      </button>
                      <button
                        onClick={downloadLinuxShortcut}
                        className={`w-full text-center py-1.5 ${deviceInfo.isLinux ? 'bg-accent hover:bg-accent/80 text-black font-bold' : 'bg-bg-raised border border-border-dim hover:border-text-tertiary text-text-secondary hover:text-text-primary'} text-[9.5px] font-mono rounded transition-all cursor-pointer flex items-center justify-center gap-1.5`}
                      >
                        <Download className="w-3 h-3" />
                        <span>DOWNLOAD LINUX (.DESKTOP)</span>
                        {deviceInfo.isLinux && <span className="text-[8px] bg-black text-accent px-1 rounded">DETECTED</span>}
                      </button>
                    </div>
                    <div className="text-[8.5px] text-text-tertiary font-mono text-center pt-1">
                      ✓ Download button automatically disappears once downloaded
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

      {/* GLOBAL COMMAND PALETTE (CMD+K / DEEP SEARCH) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsCommandPaletteOpen(false);
        }}
        onRunSkill={() => {
          setActiveTab('skills');
          setIsCommandPaletteOpen(false);
        }}
        leads={leads}
        campaigns={campaigns}
      />
      </div>
    </InspectorProvider>
  );
}
