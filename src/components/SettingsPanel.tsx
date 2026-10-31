import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Lock, 
  ShieldAlert,
  Upload,
  User,
  Building,
  Image as ImageIcon,
  Trash2,
  Copy,
  Check,
  Database,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Hammer,
  Trees,
  Wrench,
  Zap,
  Home,
  Car,
  Briefcase,
  Plus,
  Paintbrush,
  Sparkles,
  Globe,
  BookOpen,
  Sliders
} from 'lucide-react';
import { useBusinessContext } from '../context/BusinessContext';
import { IndustryProfile } from '../config/industryTaxonomy';
import HalBiblePanel from './HalBiblePanel';

interface SettingsPanelProps {
  token: string | null;
  theme: 'dark' | 'light';
  profilePhoto: string | null;
  companyLogo: string | null;
  onProfilePhotoUpdate: (photo: string | null) => void;
  onCompanyLogoUpdate: (logo: string | null) => void;
  onRefresh?: () => void;
  initialSubTab?: 'settings' | 'about';
  initialDocId?: string;
}

export default function SettingsPanel({ 
  token, 
  profilePhoto,
  companyLogo,
  onProfilePhotoUpdate,
  onCompanyLogoUpdate,
  onRefresh,
  initialSubTab = 'settings',
  initialDocId
}: SettingsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'about'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const { 
    activeIndustry, 
    activeCity, 
    activeNiche, 
    setActiveCity, 
    setActiveNiche,
    supportedCities,
    supportedNiches,
    addCustomCity,
    addCustomNiche,
    workspaceConfig,
    updateWorkspaceConfig
  } = useBusinessContext();

  // Custom city & niche inline inputs
  const [newCityInput, setNewCityInput] = useState('');
  const [newNicheInput, setNewNicheInput] = useState('');

  // Local state for workspace white-label inputs
  const [agencyNameInput, setAgencyNameInput] = useState(workspaceConfig.agencyName);
  const [operatorNameInput, setOperatorNameInput] = useState(workspaceConfig.operatorName);
  const [brandColorInput, setBrandColorInput] = useState(workspaceConfig.brandColor);
  const [taglineInput, setTaglineInput] = useState(workspaceConfig.tagline);
  const [bookingUrlInput, setBookingUrlInput] = useState(workspaceConfig.bookingUrl || '');
  const [contactPhoneInput, setContactPhoneInput] = useState(workspaceConfig.contactPhone || '');
  const [stripePaymentUrlInput, setStripePaymentUrlInput] = useState(workspaceConfig.stripePaymentUrl || '');
  const [saveWorkspaceSuccess, setSaveWorkspaceSuccess] = useState<string | null>(null);

  // Campaign Pivot / Reset State
  const [resetCity, setResetCity] = useState(activeCity);
  const [resetNiche, setResetNiche] = useState(activeNiche);
  const [resetMode, setResetMode] = useState<'blank' | 'mock'>('blank');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Public Link & Reddit Testing Shield State
  const [publicLinkMode, setPublicLinkMode] = useState<'safe_sandbox' | 'disabled' | 'open'>('disabled');
  const [publicLinkLoading, setPublicLinkLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [publicLinkError, setPublicLinkError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public-link/status')
      .then(res => res.json())
      .then(data => {
        if (data && data.mode) setPublicLinkMode(data.mode);
        setSharedUrl(typeof data?.sharedUrl === 'string' && data.sharedUrl.trim() ? data.sharedUrl.trim() : null);
      })
      .catch(() => {});
  }, []);

  const handleUpdatePublicLinkMode = async (newMode: 'safe_sandbox' | 'disabled' | 'open') => {
    setPublicLinkLoading(true);
    try {
      const res = await fetch('/api/public-link/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mode: newMode })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Public link setting was not changed.');
      setPublicLinkMode(newMode);
      setPublicLinkError(null);
    } catch (e: any) {
      setPublicLinkError(e?.message || 'Public link setting was not changed.');
    } finally {
      setPublicLinkLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const cardBg = 'bg-bg-raised border-border-dim text-text-primary';
  const innerBg = 'bg-bg-base';
  const borderCol = 'border-border-dim';

  const handleSaveWorkspaceSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkspaceConfig({
      agencyName: agencyNameInput,
      operatorName: operatorNameInput,
      brandColor: brandColorInput,
      tagline: taglineInput,
      bookingUrl: bookingUrlInput,
      contactPhone: contactPhoneInput,
      stripePaymentUrl: stripePaymentUrlInput
    });
    setSaveWorkspaceSuccess('White-label workspace and operator profile saved successfully.');
    setTimeout(() => setSaveWorkspaceSuccess(null), 4000);
  };

  const handleAddCustomCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCityInput.trim()) {
      addCustomCity(newCityInput.trim());
      setResetCity(newCityInput.trim());
      setNewCityInput('');
    }
  };

  const handleAddCustomNicheSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNicheInput.trim()) {
      addCustomNiche(newNicheInput.trim());
      setResetNiche(newNicheInput.trim());
      setNewNicheInput('');
    }
  };

  const handleCampaignReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((resetConfirm || '').trim().toUpperCase() !== (resetCity || '').trim().toUpperCase()) {
      setResetError(`Verification code mismatch. Please type "${(resetCity || '').toUpperCase()}" exactly in ALL CAPS to confirm reset.`);
      return;
    }

    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const res = await fetch('/api/system/campaign-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          city: resetCity,
          niche: resetNiche,
          mode: resetMode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to pivot campaign');
      }

      // Sync active context globally
      setActiveCity(resetCity);
      setActiveNiche(resetNiche);

      setResetSuccess(`Campaign pivoted successfully! Ledger has been re-initialized for ${resetCity} (${resetNiche}).`);
      setResetConfirm('');
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      setResetError(err.message || 'Network error occurred during reset.');
    } finally {
      setResetLoading(false);
    }
  };

  // Postgres and token copy states
  const [postgresUrl, setPostgresUrl] = useState('');
  const [postgresSuccess, setPostgresSuccess] = useState<string | null>(null);
  const [postgresTesting, setPostgresTesting] = useState(false);
  const [postgresSyncing, setPostgresSyncing] = useState(false);
  const [postgresStatus, setPostgresStatus] = useState<{ connected: boolean; message: string; version?: string; provider?: string; latencyMs?: number } | null>(null);

  const handleTestPostgres = async () => {
    setPostgresTesting(true);
    setPostgresStatus(null);
    try {
      const res = await fetch('/api/system/postgres-connect', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ databaseUrl: postgresUrl })
      });
      const data = await res.json();
      setPostgresStatus(data);
    } catch (err: any) {
      setPostgresStatus({ connected: false, message: err.message || 'Connection failed' });
    } finally {
      setPostgresTesting(false);
    }
  };

  const handleSyncToPostgres = async () => {
    setPostgresSyncing(true);
    try {
      const res = await fetch('/api/system/postgres-sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      const data = await res.json();
      if (data.success) {
        setPostgresSuccess(`Successfully synchronized ${data.syncedLeads} leads and neural weights to Neon PostgreSQL!`);
      } else {
        setPostgresSuccess(`Sync response: ${data.message || data.error}`);
      }
      setTimeout(() => setPostgresSuccess(null), 6000);
    } catch (err: any) {
      setPostgresSuccess(`Sync failed: ${err.message}`);
    } finally {
      setPostgresSyncing(false);
    }
  };

  const handleSavePostgres = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostgresSuccess('Neon PostgreSQL database link configured. Validating connection...');
    await handleTestPostgres();
    setTimeout(() => setPostgresSuccess(null), 5000);
  };

  // Real connector API keys configuration state
  const [connectorKeys, setConnectorKeys] = useState({
    stripe: '',
    twilio: '',
    sendgrid: '',
    googleMaps: '',
    googleDrive: '',
    linkedin: '',
    salesforce: '',
    hubspot: '',
    mailchimp: '',
    notion: '',
    googleAds: '',
    metaAds: '',
    ga4: '',
    quickbooks: '',
    slack: ''
  });
  const [connectorKeySuccess, setConnectorKeySuccess] = useState<string | null>(null);
  const [connectorConfigured, setConnectorConfigured] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Remove any legacy browser-stored database URI; production credentials belong in server env.
    localStorage.removeItem('halbiz_postgres_url');
  }, []);

  useEffect(() => {
    const fetchCreds = async (retry = 1) => {
      try {
        const token = localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || '';
        const res = await fetch('/api/connectors/credentials', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object' && !data.error) {
            setConnectorConfigured(data.configured && typeof data.configured === 'object' ? data.configured : {});
          }
        } else if (retry > 0) {
          setTimeout(() => fetchCreds(retry - 1), 600);
        }
      } catch (err) {
        if (retry > 0) {
          setTimeout(() => fetchCreds(retry - 1), 600);
        } else {
          console.warn('Connector credentials sync pending:', err);
        }
      }
    };
    fetchCreds();
  }, []);

  const handleSaveConnectorKey = async (service: string, keyVal: string) => {
    const value = keyVal.trim();
    if (!value) return;

    try {
      const res = await fetch('/api/connectors/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ service, keyVal: value })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Credential was not saved.');

      setConnectorConfigured(prev => ({ ...prev, [service]: true }));
      setConnectorKeys(prev => ({ ...prev, [service]: '' }));
      setConnectorKeySuccess(`${service.toUpperCase()} credential saved securely. The secret is not returned to the browser.`);
    } catch (err: any) {
      setConnectorKeySuccess(`Could not save ${service.toUpperCase()} credential: ${err.message || 'request failed'}`);
    }
    setTimeout(() => setConnectorKeySuccess(null), 5000);
  };

  // Password reset state



  const textPrimary = 'text-text-primary';
  const textSecondary = 'text-text-secondary';
  const textTertiary = 'text-text-tertiary';

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onProfilePhotoUpdate(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCompanyLogoUpdate(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher: Settings & Keys vs About & Operating Manual */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-inherit">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('settings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex flex-wrap items-center gap-2 cursor-pointer ${
              activeSubTab === 'settings'
                ? 'bg-brand text-accent-contrast shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings & API Keys</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('about')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex flex-wrap items-center gap-2 cursor-pointer ${
              activeSubTab === 'about'
                ? 'bg-brand text-accent-contrast shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>About & Operating Manual</span>
          </button>
        </div>
        <div className="text-[11px] font-mono text-text-tertiary hidden sm:block min-w-0 break-words text-right">
          {activeSubTab === 'about' ? 'HAL CONSTITUTION & ROADMAP' : 'ENTERPRISE SYSTEM CONFIGURATION'}
        </div>
      </div>

      {activeSubTab === 'about' ? (
        <div className="pt-2">
          <HalBiblePanel initialDocId={initialDocId} />
        </div>
      ) : (
        <>
      {/* MULTI-INDUSTRY & WHITE-LABEL WORKSPACE MANAGER */}
      <div className={`border rounded-lg p-6 space-y-6 min-w-0 ${cardBg}`}>
        <div className="flex flex-wrap items-center gap-2 border-b pb-3 border-inherit">
          <Briefcase className="w-4 h-4 text-brand" />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">White-Label Workspace Configurator</span>
          <span className="ml-auto text-[11px] px-2 py-0.5 bg-brand/10 text-brand font-mono border border-brand/20 rounded font-semibold uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> WHITE-LABEL READY
          </span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed max-w-3xl font-mono">
          Configure your target sub-niche, primary operating city territory, and white-label agency branding settings below.
        </p>

        {/* SUB-NICHE & CITY TERRITORY CUSTOMIZATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
          {/* Sub-Niche Selector & Custom Niche Adder */}
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-text-primary uppercase tracking-wider">
                TARGET SUB-NICHE
              </label>
              <span className="text-[11px] text-brand">{activeNiche}</span>
            </div>

            <div className="flex gap-2">
              <select
                value={activeNiche}
                onChange={(e) => setActiveNiche(e.target.value)}
                className="flex-1 bg-bg-subtle border border-border-dim text-text-primary rounded-sm p-2 text-xs font-mono focus:outline-none focus:border-brand"
              >
                {supportedNiches.map((n) => (
                  <option key={n} value={n}>
                    {(n || '').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Niche Adder Form */}
            <form onSubmit={handleAddCustomNicheSubmit} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Or add custom trade niche..."
                value={newNicheInput}
                onChange={(e) => setNewNicheInput(e.target.value)}
                className="flex-1 bg-bg-dark border border-border-dim text-text-primary rounded-sm p-1.5 text-xs font-mono focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-bg-subtle hover:bg-brand hover:text-accent-contrast border border-border-dim text-text-primary text-xs font-mono font-bold rounded-sm flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> ADD
              </button>
            </form>
          </div>

          {/* Territory City Selector & Custom City Adder */}
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-text-primary uppercase tracking-wider">
                TARGET CITY / TERRITORY
              </label>
              <span className="text-[11px] text-text-dim flex items-center gap-1">
                <Globe className="w-3 h-3" /> ACTIVE: {(activeCity || '').toUpperCase()}
              </span>
            </div>

            <div className="flex gap-2">
              <select
                value={activeCity}
                onChange={(e) => {
                  setActiveCity(e.target.value);
                  setResetCity(e.target.value);
                }}
                className="flex-1 bg-bg-subtle border border-border-dim text-text-primary rounded-sm p-2 text-xs font-mono focus:outline-none focus:border-brand"
              >
                {supportedCities.map((c) => (
                  <option key={c} value={c}>
                    {(c || '').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom City Adder Form */}
            <form onSubmit={handleAddCustomCitySubmit} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Or add custom city/region..."
                value={newCityInput}
                onChange={(e) => setNewCityInput(e.target.value)}
                className="flex-1 bg-bg-dark border border-border-dim text-text-primary rounded-sm p-1.5 text-xs font-mono focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-bg-subtle hover:bg-brand hover:text-accent-contrast border border-border-dim text-text-primary text-xs font-mono font-bold rounded-sm flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> ADD
              </button>
            </form>
          </div>
        </div>

        {/* 3. WHITE-LABEL OPERATOR & AGENCY BRANDING SETTINGS */}
        <div className="p-5 bg-bg-subtle border border-border-dim rounded-sm space-y-4 pt-4 border-t border-border-dim">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono">
              <Paintbrush className="w-4 h-4 text-brand" />
              <span className="text-xs font-bold text-text-primary uppercase">
                WHITE-LABEL OPERATOR & AGENCY BRANDING
              </span>
            </div>
            <span className="text-[11px] font-mono text-text-dim">
              Tailors pitch deck exports & audit headers
            </span>
          </div>

          {saveWorkspaceSuccess && (
            <div className="p-2.5 bg-positive/10 border border-positive/30 text-positive text-xs font-mono font-bold rounded-sm">
              {saveWorkspaceSuccess}
            </div>
          )}

          <form onSubmit={handleSaveWorkspaceSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-[11px] text-text-secondary uppercase font-bold">
                Agency / Business Name
              </label>
              <input
                type="text"
                required
                value={agencyNameInput}
                onChange={(e) => setAgencyNameInput(e.target.value)}
                placeholder="e.g. Apex Operating Intelligence"
                className="w-full bg-bg-dark border border-border-dim text-text-primary rounded-sm p-2 focus:outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-text-secondary uppercase font-bold">
                Operator / Representative Name
              </label>
              <input
                type="text"
                required
                value={operatorNameInput}
                onChange={(e) => setOperatorNameInput(e.target.value)}
                placeholder="e.g. Workspace Principal"
                className="w-full bg-bg-dark border border-border-dim text-text-primary rounded-sm p-2 focus:outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-text-secondary uppercase font-bold flex items-center justify-between">
                <span>Brand Accent Color</span>
                <span className="text-[11px] font-mono text-accent">Active Theme Accent</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandColorInput}
                  onChange={(e) => {
                    setBrandColorInput(e.target.value);
                    updateWorkspaceConfig({ brandColor: e.target.value });
                  }}
                  className="w-9 h-9 rounded-md bg-transparent cursor-pointer border border-border-dim p-0.5"
                  title="Pick custom hex color"
                />
                <input
                  type="text"
                  value={brandColorInput}
                  onChange={(e) => {
                    setBrandColorInput(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      updateWorkspaceConfig({ brandColor: e.target.value });
                    }
                  }}
                  className="flex-1 bg-bg-dark border border-border-dim text-text-primary rounded-md p-2 focus:outline-none focus:border-accent font-mono uppercase text-xs"
                />
              </div>

              {/* Quick Brand Accent Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] font-mono text-text-tertiary uppercase">Presets:</span>
                {[
                  { name: 'Volt Lime', color: '#c8f542' },
                  { name: 'Cyber Indigo', color: '#6366f1' },
                  { name: 'Emerald Peak', color: '#10b981' },
                  { name: 'Amber Core', color: '#f59e0b' },
                  { name: 'Electric Cyan', color: '#06b6d4' },
                  { name: 'Rose Impact', color: '#f43f5e' }
                ].map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => {
                      setBrandColorInput(preset.color);
                      updateWorkspaceConfig({ brandColor: preset.color });
                    }}
                    className="w-5 h-5 rounded-full border border-border-dim hover:scale-110 transition-transform cursor-pointer shadow-xs"
                    style={{ backgroundColor: preset.color }}
                    title={`${preset.name} (${preset.color})`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-text-secondary uppercase font-bold">
                Agency Tagline
              </label>
              <input
                type="text"
                value={taglineInput}
                onChange={(e) => setTaglineInput(e.target.value)}
                placeholder="e.g. Territory Conquest & Business Intelligence"
                className="w-full bg-bg-dark border border-border-dim text-text-primary rounded-sm p-2 focus:outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-text-secondary uppercase font-bold">
                Meeting Booking Link (Cal.com / Calendly / Meet)
              </label>
              <input
                type="url"
                value={bookingUrlInput}
                onChange={(e) => setBookingUrlInput(e.target.value)}
                placeholder="https://cal.com/your-name or https://calendly.com/your-link"
                className="w-full bg-bg-dark border border-border-dim text-text-primary rounded-sm p-2 focus:outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-text-secondary uppercase font-bold">
                Public Contact / Phone Line
              </label>
              <input
                type="text"
                value={contactPhoneInput}
                onChange={(e) => setContactPhoneInput(e.target.value)}
                placeholder="Enter business phone number"
                className="w-full bg-bg-dark border border-border-dim text-text-primary rounded-sm p-2 focus:outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[11px] text-text-secondary uppercase font-bold">
                Default Stripe / Payment Checkout URL
              </label>
              <input
                type="url"
                value={stripePaymentUrlInput}
                onChange={(e) => setStripePaymentUrlInput(e.target.value)}
                placeholder="https://buy.stripe.com/your_checkout_link"
                className="w-full bg-bg-dark border border-border-dim text-text-primary rounded-sm p-2 focus:outline-none focus:border-brand"
              />
            </div>

            <div className="md:col-span-2 pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-accent-contrast text-xs font-mono font-bold rounded-sm transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" /> SAVE WHITE-LABEL BRANDING
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* BRANDING & IDENTITY WORKSPACE (Pitch feature) */}
      <div className={`border rounded-lg p-6 space-y-6 min-w-0 ${cardBg}`}>
        <div className="flex flex-wrap items-center gap-2 border-b pb-3 border-inherit">
          <ImageIcon className="w-4 h-4 text-accent" />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">Organizational Branding & Visual Identity</span>
          <span className="ml-auto text-[11px] px-1.5 py-0.5 bg-accent/10 text-accent font-mono border border-accent/20 rounded font-semibold uppercase">PITCH DECK ASSET</span>
        </div>

        <p className="text-xs text-inherit leading-relaxed max-w-2xl">
          Customize corporate brand styling and personal representative photography for the executive workspace interface. This establishes full agency presence when pitching to roofing and enterprise clients.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Personal Profile Representative Photo */}
          <div className={`p-5 rounded border flex flex-col justify-between ${innerBg} ${borderCol}`}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                <span className="text-xs font-mono font-bold uppercase tracking-wide text-inherit">Executive Profile Image</span>
              </div>
              <p className="text-[11px] text-inherit opacity-80 leading-normal">
                Upload a professional avatar image to represent the agency principal on headers and meeting consoles.
              </p>
            </div>

            <div className="flex items-center gap-5 mt-5">
              {profilePhoto ? (
                <div className="relative group shrink-0">
                  <img 
                    src={profilePhoto} 
                    alt="Profile Preview" 
                    className="w-16 h-16 rounded-full border border-accent/30 object-cover shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => onProfilePhotoUpdate(null)}
                    className="absolute -top-1 -right-1 p-1 bg-negative hover:bg-negative/90 text-accent-contrast rounded-full transition-colors shadow-md"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full border border-dashed border-accent/30 bg-accent/5 flex flex-col items-center justify-center text-accent shrink-0">
                  <User className="w-6 h-6 stroke-[1.5]" />
                </div>
              )}

              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-3 h-8 bg-accent hover:bg-accent/90 text-accent-contrast font-mono text-[11px] font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm ">
                  <Upload className="w-3 h-3" />
                  <span>Choose Photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleProfileUpload}
                    className="hidden" 
                  />
                </label>
                <div className="text-[11px] mt-1.5 text-inherit opacity-60">PNG, JPG or WEBP. Max size 2MB.</div>
              </div>
            </div>
          </div>

          {/* Company Brand Logo Uploader */}
          <div className={`p-5 rounded border flex flex-col justify-between ${innerBg} ${borderCol}`}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-positive" />
                <span className="text-xs font-mono font-bold uppercase tracking-wide text-inherit">Corporate Branding Logo</span>
              </div>
              <p className="text-[11px] text-inherit opacity-80 leading-normal">
                Upload your custom agency or client logo to completely skin the system launcher sidebar.
              </p>
            </div>

            <div className="flex items-center gap-5 mt-5">
              {companyLogo ? (
                <div className="relative group shrink-0">
                  <img 
                    src={companyLogo} 
                    alt="Company Preview" 
                    className="w-16 h-16 rounded-lg border border-positive/30 object-cover shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => onCompanyLogoUpdate(null)}
                    className="absolute -top-1 -right-1 p-1 bg-negative hover:bg-negative/90 text-accent-contrast rounded-full transition-colors shadow-md"
                    title="Remove Logo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border border-dashed border-positive/30 bg-positive-dim flex flex-col items-center justify-center text-positive shrink-0">
                  <Building className="w-6 h-6 stroke-[1.5]" />
                </div>
              )}

              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-3 h-8 bg-positive hover:bg-positive/90 text-accent-contrast font-mono text-[11px] font-bold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm">
                  <Upload className="w-3 h-3" />
                  <span>Choose Logo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleCompanyLogoUpload}
                    className="hidden" 
                  />
                </label>
                <div className="text-[11px] mt-1.5 text-inherit opacity-60">Ideal format: Square icon or custom wordmark.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIRECT INTEGRATION GATEWAY: POSTGRESQL & JWT SECURITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* PostgreSQL Database Section */}
        <div className={`border rounded-lg p-5 space-y-6 ${cardBg}`}>
          <div className="flex flex-wrap items-center gap-2 border-b pb-3 border-inherit">
            <Database className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold">Neon PostgreSQL Database Link</span>
          </div>

          <p className="text-xs text-inherit opacity-80 leading-relaxed font-sans">
            Connects HAL directly to your external Neon or PostgreSQL relational database. Clicking <strong className="text-text-primary">Test Connection</strong> performs an immediate live latency ping, while <strong className="text-text-primary">Sync Leads &amp; Neural Weights</strong> runs real SQL migrations to persist your local leads, win/loss records, and Bayesian model weights into the cloud.
          </p>

          {postgresSuccess && (
            <div className="p-3 bg-accent/10 border border-accent/20 text-accent text-xs rounded-sm font-mono leading-relaxed font-bold uppercase tracking-wider">
              {postgresSuccess}
            </div>
          )}

          <form onSubmit={handleSavePostgres} className="space-y-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="block text-[11px] font-mono opacity-80 uppercase tracking-wider font-bold">PostgreSQL Connection URI (admin only)</label>
              <p className="text-[11px] text-text-secondary">Used only for this settings session; it is not saved in browser storage. Configure DATABASE_URL in the server environment for persistent production connections.</p>
              <textarea
                rows={3}
                required
                value={postgresUrl}
                onChange={(e) => setPostgresUrl(e.target.value)}
                placeholder="postgresql://username:password@host:5432/dbname?sslmode=require"
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-[11px] leading-normal ${innerBg} ${borderCol}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="bg-accent text-black hover:bg-accent/80 py-2 px-4 rounded font-mono text-xs font-bold uppercase transition-colors tracking-wider shadow-sm cursor-pointer"
              >
                Save & Verify URI
              </button>

              <button
                type="button"
                onClick={handleTestPostgres}
                disabled={postgresTesting}
                className="bg-bg-subtle hover:bg-bg-subtle/80 border border-border-dim text-text-primary py-2 px-4 rounded font-mono text-xs font-bold uppercase transition-colors tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${postgresTesting ? 'animate-spin' : ''}`} />
                {postgresTesting ? 'Testing Link...' : 'Test Connection'}
              </button>

              <button
                type="button"
                onClick={handleSyncToPostgres}
                disabled={postgresSyncing}
                className="bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent py-2 px-4 rounded font-mono text-xs font-bold uppercase transition-colors tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Database className={`w-3.5 h-3.5 text-accent ${postgresSyncing ? 'animate-bounce' : ''}`} />
                {postgresSyncing ? 'Syncing to Neon...' : 'Sync Leads & Neural Weights'}
              </button>
            </div>
          </form>

          {postgresStatus && (
            <div className={`p-3 border text-xs rounded-sm font-mono leading-relaxed ${
              postgresStatus.connected 
                ? 'bg-positive/10 border-positive/30 text-positive'
                : 'bg-negative-dim border-negative/30 text-negative'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span>{postgresStatus.connected ? 'POSTGRESQL ONLINE' : 'CONNECTION TEST RESULT'}</span>
                {postgresStatus.latencyMs !== undefined && (
                  <span className="text-[11px] px-1.5 py-0.5 bg-bg-dark rounded border border-border-dim text-text-secondary">{postgresStatus.latencyMs}ms</span>
                )}
              </div>
              <div className="text-[11px] mt-1">{postgresStatus.message}</div>
              {postgresStatus.version && (
                <div className="text-[11px] opacity-75 mt-0.5 break-words">{postgresStatus.version}</div>
              )}
            </div>
          )}


        </div>

        {/* Session credentials are intentionally not exposed in the settings UI. */}
        <div className={`border rounded-lg p-5 space-y-3 ${cardBg}`}>
          <div className="flex items-center gap-2 border-b pb-3 border-inherit">
            <Lock className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold">Session security</span>
          </div>
          <p className="text-xs text-inherit opacity-80 leading-relaxed font-sans">
            Your active session is managed securely by HAL. Session credentials are not displayed or made copyable in this settings screen.
          </p>
        </div>
      </div>

      {/* Connected Business Services & Third-Party API Credentials */}
      <div className={`border rounded-lg p-5 space-y-6 ${cardBg} mt-6`}>
        <div className="flex flex-wrap items-center gap-2 border-b pb-3 border-inherit">
          <Globe className="w-4 h-4 text-accent" />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">Connected Business Services & Third-Party API Credentials</span>
        </div>

        <p className="text-xs text-inherit opacity-80 leading-relaxed font-sans">
          Configure real API credentials for external integrations. When saved, keys are encrypted and stored in your isolated database tier to power billing, SMS notifications, ad spend syncs, and territory intelligence.
        </p>

          {connectorKeySuccess && (
            <div className="p-3 bg-accent/10 border border-accent/20 text-accent text-xs rounded-sm font-mono leading-relaxed font-bold uppercase tracking-wider flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              {connectorKeySuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            {/* Stripe */}
            <div className={`border p-3.5 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase font-mono text-[11px] text-accent">Stripe Billing API</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.stripe ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.stripe || connectorKeys.stripe ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.stripe}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, stripe: e.target.value }))}
                onBlur={() => handleSaveConnectorKey('stripe', connectorKeys.stripe)}
                placeholder="sk_live_..."
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <span className="text-[11px] text-inherit opacity-60 block">Key: STRIPE_SECRET_KEY</span>
            </div>

            {/* Twilio */}
            <div className={`border p-3.5 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase font-mono text-[11px] text-accent">Twilio SMS Gateway</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.twilio ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.twilio || connectorKeys.twilio ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.twilio}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, twilio: e.target.value }))}
                onBlur={() => handleSaveConnectorKey('twilio', connectorKeys.twilio)}
                placeholder="AC... (Auth Token)"
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <span className="text-[11px] text-inherit opacity-60 block">Key: TWILIO_AUTH_TOKEN</span>
            </div>

            {/* SendGrid */}
            <div className={`border p-3.5 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase font-mono text-[11px] text-accent">SendGrid Mail API</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.sendgrid ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.sendgrid || connectorKeys.sendgrid ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.sendgrid}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, sendgrid: e.target.value }))}
                onBlur={() => handleSaveConnectorKey('sendgrid', connectorKeys.sendgrid)}
                placeholder="SG..."
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <span className="text-[11px] text-inherit opacity-60 block">Key: SENDGRID_API_KEY</span>
            </div>

            {/* Google Maps */}
            <div className={`border p-3.5 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase font-mono text-[11px] text-accent">Google Maps Platform</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.googleMaps ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.googleMaps || connectorKeys.googleMaps ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.googleMaps}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, googleMaps: e.target.value }))}
                onBlur={() => handleSaveConnectorKey('googleMaps', connectorKeys.googleMaps)}
                placeholder="AIza..."
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <span className="text-[11px] text-inherit opacity-60 block">Key: VITE_GOOGLE_MAPS_API_KEY</span>
            </div>

            {/* Google Ads */}
            <div className={`border p-3.5 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase font-mono text-[11px] text-accent">Google Ads API</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.googleAds ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.googleAds || connectorKeys.googleAds ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.googleAds}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, googleAds: e.target.value }))}
                onBlur={() => handleSaveConnectorKey('googleAds', connectorKeys.googleAds)}
                placeholder="Developer Token / Client ID"
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <span className="text-[11px] text-inherit opacity-60 block">Key: GOOGLE_ADS_DEVELOPER_TOKEN</span>
            </div>

            {/* Meta Ads */}
            <div className={`border p-3.5 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase font-mono text-[11px] text-accent">Meta Marketing API</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.metaAds ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.metaAds || connectorKeys.metaAds ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.metaAds}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, metaAds: e.target.value }))}
                onBlur={() => handleSaveConnectorKey('metaAds', connectorKeys.metaAds)}
                placeholder="EAAG..."
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <span className="text-[11px] text-inherit opacity-60 block">Key: META_SYSTEM_USER_TOKEN</span>
            </div>

            {/* GA4 / Search Console */}
            <div className={`border p-3.5 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase font-mono text-[11px] text-accent">GA4 & Search Console</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.ga4 ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.ga4 || connectorKeys.ga4 ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.ga4}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, ga4: e.target.value }))}
                onBlur={() => handleSaveConnectorKey('ga4', connectorKeys.ga4)}
                placeholder="Service Account JSON Token"
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <span className="text-[11px] text-inherit opacity-60 block">Key: GOOGLE_SERVICE_ACCOUNT</span>
            </div>

            {/* Slack Webhook */}
            <div className={`border p-3.5 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase font-mono text-[11px] text-accent">Slack Operations Webhook</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.slack ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.slack || connectorKeys.slack ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.slack}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, slack: e.target.value }))}
                onBlur={() => handleSaveConnectorKey('slack', connectorKeys.slack)}
                placeholder="https://hooks.slack.com/services/..."
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <span className="text-[11px] text-inherit opacity-60 block">Key: SLACK_WEBHOOK_URL</span>
            </div>

            {/* Google Drive */}
            <div className={`border p-3.5 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase font-mono text-[11px] text-accent">Google Drive Asset Cloud</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.googleDrive ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.googleDrive || connectorKeys.googleDrive ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.googleDrive}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, googleDrive: e.target.value }))}
                onBlur={() => handleSaveConnectorKey('googleDrive', connectorKeys.googleDrive)}
                placeholder="OAuth Client ID / Secret"
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <span className="text-[11px] text-inherit opacity-60 block">Key: GOOGLE_DRIVE_CLIENT_ID</span>
            </div>

            {/* LinkedIn */}
            <div className={`border p-3.5 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase font-mono text-[11px] text-accent">LinkedIn Sales Integrator</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.linkedin ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.linkedin || connectorKeys.linkedin ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.linkedin}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, linkedin: e.target.value }))}
                onBlur={() => handleSaveConnectorKey('linkedin', connectorKeys.linkedin)}
                placeholder="AQV..."
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <span className="text-[11px] text-inherit opacity-60 block">Key: LINKEDIN_API_TOKEN</span>
            </div>

            {/* Salesforce */}
            <div className={`border p-3.5 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase font-mono text-[11px] text-accent">Salesforce CRM Bridge</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.salesforce ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.salesforce || connectorKeys.salesforce ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.salesforce}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, salesforce: e.target.value }))}
                onBlur={() => handleSaveConnectorKey('salesforce', connectorKeys.salesforce)}
                placeholder="3MVG9..."
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <span className="text-[11px] text-inherit opacity-60 block">Key: SALESFORCE_CONSUMER_KEY</span>
            </div>

            {/* HubSpot */}
            <div className={`border p-3.5 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase font-mono text-[11px] text-accent">HubSpot Marketing Sync</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.hubspot ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.hubspot || connectorKeys.hubspot ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.hubspot}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, hubspot: e.target.value }))}
                onBlur={() => handleSaveConnectorKey('hubspot', connectorKeys.hubspot)}
                placeholder="pat-na1-..."
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <span className="text-[11px] text-inherit opacity-60 block">Key: HUBSPOT_ACCESS_TOKEN</span>
            </div>

            {/* Mailchimp */}
            <div className={`border p-3.5 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase font-mono text-[11px] text-accent">Mailchimp Newsletter API</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.mailchimp ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.mailchimp || connectorKeys.mailchimp ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.mailchimp}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, mailchimp: e.target.value }))}
                onBlur={() => handleSaveConnectorKey('mailchimp', connectorKeys.mailchimp)}
                placeholder="...-us20"
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <span className="text-[11px] text-inherit opacity-60 block">Key: MAILCHIMP_API_KEY</span>
            </div>

            {/* Notion */}
            <div className={`border p-3.5 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase font-mono text-[11px] text-accent">Notion Workspace Sync</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.notion ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.notion || connectorKeys.notion ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.notion}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, notion: e.target.value }))}
                onBlur={() => handleSaveConnectorKey('notion', connectorKeys.notion)}
                placeholder="ntn_..."
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <span className="text-[11px] text-inherit opacity-60 block">Key: NOTION_INTEGRATION_SECRET</span>
            </div>
          </div>
        </div>

        {/* Account Security Password Reset */}
        <div className={`border rounded-lg p-5 space-y-6 ${cardBg}`}>
          <div className="flex flex-wrap items-center gap-2 border-b pb-3 border-inherit">
            <Lock className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold">Identity Security Reset</span>
          </div>

          <p className="text-xs text-inherit opacity-80 leading-relaxed font-sans">
            Reset password to update identity security policies. Performing this update immediately invalidates all active sessions except your current authenticated window.
          </p>

          <div className="p-4 border border-warning/30 bg-warning-dim rounded text-xs leading-relaxed">
            Password changes are unavailable in this deployment because a secure authenticated change-password flow has not been implemented. No password will be submitted from this screen.
          </div>


          <div className={`border p-4 rounded flex gap-3.5 items-start ${innerBg} ${borderCol}`}>
            <ShieldAlert className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold font-sans">Cryptographic Hashing Standard</span>
              <p className="text-inherit opacity-80 leading-normal font-sans text-[11px]">
                Password hashing is handled server-side. This screen does not expose a password-change operation until the complete authenticated workflow is available.
              </p>
            </div>
          </div>
        </div>

      {/* PUBLIC SHARE & REDDIT TESTING SHIELD */}
      <div className={`border rounded-lg p-5 mt-6 space-y-5 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-inherit">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold">Public Link Controls</span>
          </div>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
            publicLinkMode === 'safe_sandbox' 
              ? 'bg-positive-dim text-positive border-positive/30'
              : publicLinkMode === 'disabled'
              ? 'bg-negative-dim text-negative border-negative/30'
              : 'bg-warning-dim text-warning border-warning/30'
          }`}>
            {publicLinkMode === 'safe_sandbox' && '🟢 Safe Sandbox Active'}
            {publicLinkMode === 'disabled' && '🔴 Link Deactivated'}
            {publicLinkMode === 'open' && '🟡 Unrestricted Access'}
          </span>
        </div>

        <p className="text-xs text-inherit opacity-85 leading-relaxed font-sans">
          Public-link controls are best-effort and must not be treated as an authentication boundary. A verified deployment URL is shown only when APP_URL is configured. Public demo access is disabled by default; do not share a link until deployment and access controls have been tested.
        </p>
        {publicLinkError && <div role="alert" className="p-3 text-xs rounded border border-negative/30 text-negative">{publicLinkError}</div>}
        {/* Share Link Bar */}
        <div className={`border rounded p-3 flex items-center justify-between gap-3 ${innerBg} ${borderCol}`}>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-mono opacity-70 uppercase tracking-wider font-bold mb-1">
              Configured deployment URL
            </div>
            <div className="text-xs font-mono text-brand break-all whitespace-normal font-bold">
              {sharedUrl || 'No verified public URL configured'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => sharedUrl && copyToClipboard(sharedUrl)}
            disabled={!sharedUrl}
            className="px-3 py-1.5 rounded bg-brand/15 hover:bg-brand/25 border border-brand/40 text-brand text-xs font-mono font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            title={sharedUrl ? 'Copy configured public URL' : 'Configure APP_URL before sharing'}
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-positive" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'COPIED' : 'COPY LINK'}</span>
          </button>
        </div>

        {/* Mode Selector Buttons */}
        <div className="space-y-2">
          <label className="block text-[11px] font-mono opacity-80 uppercase tracking-wider font-bold">
            Public Traffic Control Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              disabled={publicLinkLoading}
              onClick={() => handleUpdatePublicLinkMode('safe_sandbox')}
              className={`p-3 rounded border text-left transition-all cursor-pointer ${
                publicLinkMode === 'safe_sandbox'
                  ? 'border-positive bg-positive-dim text-positive shadow-sm'
                  : 'border-inherit hover:border-positive/50 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="text-xs font-mono font-bold flex items-center gap-1.5">
                <span>🛡️ Safe Sandbox</span>
              </div>
              <p className="text-[11px] opacity-75 mt-1 font-sans leading-normal">
                Recommended for Reddit. Rate-limited, AI quota shield active, isolated data.
              </p>
            </button>

            <button
              type="button"
              disabled={publicLinkLoading}
              onClick={() => handleUpdatePublicLinkMode('disabled')}
              className={`p-3 rounded border text-left transition-all cursor-pointer ${
                publicLinkMode === 'disabled'
                  ? 'border-negative bg-negative-dim text-negative shadow-sm'
                  : 'border-inherit hover:border-negative/50 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="text-xs font-mono font-bold flex items-center gap-1.5">
                <span>🔒 Killswitch (Disabled)</span>
              </div>
              <p className="text-[11px] opacity-75 mt-1 font-sans leading-normal">
                Blocks all public shared traffic with an HTTP 403 Deactivated page.
              </p>
            </button>

            <button
              type="button"
              disabled={publicLinkLoading}
              onClick={() => handleUpdatePublicLinkMode('open')}
              className={`p-3 rounded border text-left transition-all cursor-pointer ${
                publicLinkMode === 'open'
                  ? 'border-warning bg-warning-dim text-warning shadow-sm'
                  : 'border-inherit hover:border-warning/50 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="text-xs font-mono font-bold flex items-center gap-1.5">
                <span>🌐 Open Unrestricted</span>
              </div>
              <p className="text-[11px] opacity-75 mt-1 font-sans leading-normal">
                Normal production routing without special public visitor rate limiters.
              </p>
            </button>
          </div>
        </div>

        {/* Security Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-inherit text-[11px] font-mono opacity-80">
          <div className="flex items-center gap-1.5">
            <Check className="w-3 h-3 text-positive" />
            <span>Rate limiting: in-process best effort</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3 h-3 text-positive" />
            <span>AI throttling: best effort</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3 h-3 text-positive" />
            <span>Encryption depends on configured key</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3 h-3 text-positive" />
            <span>Public demo access disabled by default</span>
          </div>
        </div>
      </div>

      {/* Campaign Reset & Territory Pivot */}
      <div className={`border rounded-lg p-5 mt-6 space-y-6 ${cardBg}`}>
        <div className="flex flex-wrap items-center gap-2 border-b pb-3 border-inherit">
          <RotateCcw className="w-4 h-4 text-negative" />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">Campaign Reset & Territory Pivot</span>
        </div>

        <p className="text-xs text-inherit opacity-80 leading-relaxed font-sans">
          Redirect HAL's cognitive intelligence and campaign tracking engines to a brand new market. 
          Resetting will securely purge all current leads, outreach event timelines, closed revenue ledgers, and chat histories associated with your contractor profile. This allows you to start a completely fresh campaign in another city.
        </p>

        {resetSuccess && (
          <div className="p-3 bg-positive/10 border border-positive/20 text-positive text-xs rounded-sm font-mono leading-relaxed font-bold uppercase tracking-wider flex items-center gap-2">
            <Check className="w-4 h-4 text-positive" />
            {resetSuccess}
          </div>
        )}

        {resetError && (
          <div className="p-3 bg-negative-dim border border-negative/20 text-negative text-xs rounded-sm font-mono leading-relaxed font-bold uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-negative shrink-0" />
            {resetError}
          </div>
        )}

        <form onSubmit={handleCampaignReset} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-mono opacity-80 uppercase tracking-wider font-bold">Target City / Region</label>
              <input
                type="text"
                required
                value={resetCity}
                onChange={(e) => setResetCity(e.target.value)}
                placeholder="e.g., Calgary"
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit ${innerBg} ${borderCol}`}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-mono opacity-80 uppercase tracking-wider font-bold">Industry Niche / Service Type</label>
              <input
                type="text"
                required
                value={resetNiche}
                onChange={(e) => setResetNiche(e.target.value)}
                placeholder="e.g., plumbing"
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit ${innerBg} ${borderCol}`}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-mono opacity-80 uppercase tracking-wider font-bold">Ledger Inception Mode</label>
              <select
                value={resetMode}
                onChange={(e) => setResetMode(e.target.value as 'blank' | 'mock')}
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit ${innerBg} ${borderCol}`}
              >
                <option value="mock">Simulated Seeding (5 Mock Leads + Active Campaign)</option>
                <option value="blank">Blank Slate Ledger (Zero Data - Ready for Deep Scrapes)</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-negative-dim border border-negative/20 rounded-md space-y-3">
            <div className="flex gap-2 items-center text-negative font-mono text-[11px] uppercase font-bold tracking-wider">
              <AlertTriangle className="w-4 h-4 text-negative" />
              <span>Critical Administrative Override Action</span>
            </div>
            <p className="text-[11px] opacity-75 leading-relaxed">
              This action is irreversible. All current leads, converted client metrics, activity streams, and system snapshots under your ID will be cleared permanently. If you choose **Simulated Seeding**, we will pre-populate the dashboard with realistic target business accounts for {resetCity} ({resetNiche}). If you choose **Blank Slate**, your ledger will be completely empty.
            </p>

            <div className="space-y-1 pt-1">
              <label className="block text-[11px] font-mono uppercase tracking-wider font-bold opacity-80 text-inherit">
                To confirm reset, type the target city name in ALL CAPS (<strong className="text-negative">"{(resetCity || '').toUpperCase()}"</strong>):
              </label>
              <input
                type="text"
                required
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                placeholder={`Type "${(resetCity || '').toUpperCase()}"`}
                className={`w-full border rounded p-2 focus:outline-none focus:border-negative text-inherit font-mono uppercase tracking-wider ${innerBg} border-negative/30`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={resetLoading}
            className={`bg-negative-dim border border-negative text-negative hover:bg-negative-dim py-2 px-5 rounded font-mono text-xs font-bold uppercase transition-colors tracking-wider shadow-sm flex items-center gap-2 ${
              resetLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {resetLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Resetting Ledger...
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                Execute Campaign Reset & Wipe
              </>
            )}
          </button>
        </form>
      </div>
      </>
      )}
    </div>
  );
}
