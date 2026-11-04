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
import { ProviderBrandIcon } from './ProviderBrandIcon';

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
          mode: 'blank'
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
  const [postgresStatus, setPostgresStatus] = useState<{ connected: boolean; schemaReady?: boolean; message: string; version?: string; provider?: string; latencyMs?: number } | null>(null);

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
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      const previewResponse = await fetch('/api/system/postgres-sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'preview' })
      });
      const preview = await previewResponse.json();
      if (!previewResponse.ok || !preview.success) {
        throw new Error(preview.error || preview.message || 'Could not preview the Neon sync.');
      }

      const leadsToInsert = Number(preview.leadsToInsert || 0);
      const winLossToInsert = Number(preview.winLossToInsert || 0);
      if (leadsToInsert === 0 && winLossToInsert === 0) {
        setPostgresSuccess('Neon preview complete: no missing lead or win/loss records were found. No data was changed.');
        setTimeout(() => setPostgresSuccess(null), 8000);
        return;
      }

      const approved = window.confirm(
        `Neon sync preview:\\n\\n${leadsToInsert} missing leads\\n${winLossToInsert} missing win/loss records\\n\\nOnly missing IDs will be inserted. Existing Neon rows will not be overwritten. Unknown intelligence metrics will remain blank. Continue?`
      );
      if (!approved) {
        setPostgresSuccess('Neon sync cancelled. No data was changed.');
        setTimeout(() => setPostgresSuccess(null), 5000);
        return;
      }

      const commitResponse = await fetch('/api/system/postgres-sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'commit', confirm: true })
      });
      const result = await commitResponse.json();
      if (!commitResponse.ok || !result.success) {
        throw new Error(result.error || result.message || 'Neon additive sync failed.');
      }
      setPostgresSuccess(
        `Additive sync complete: inserted ${result.syncedLeads} leads and ${result.syncedWinLoss} win/loss records. Existing Neon records were not overwritten.`
      );
      setTimeout(() => setPostgresSuccess(null), 10000);
    } catch (err: any) {
      setPostgresSuccess(`Sync failed: ${err.message}`);
    } finally {
      setPostgresSyncing(false);
    }
  };

  const handleSavePostgres = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostgresSuccess('Running a one-time PostgreSQL connection check. No production database settings are being changed.');
    await handleTestPostgres();
    setTimeout(() => setPostgresSuccess(null), 5000);
  };

  // Real connector API keys configuration state
  const [connectorKeys, setConnectorKeys] = useState({
    gemini: '',
    openai: '',
    anthropic: '',
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
  const [connectorSaving, setConnectorSaving] = useState<Record<string, boolean>>({});

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
    if (!value) {
      setConnectorKeySuccess('Enter a credential before saving.');
      return;
    }

    setConnectorSaving(prev => ({ ...prev, [service]: true }));
    setConnectorKeySuccess(null);
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
      setConnectorKeySuccess(`${service.toUpperCase()} credential saved securely. Provider connectivity has not been tested.`);
    } catch (err: any) {
      setConnectorKeySuccess(`Could not save ${service.toUpperCase()} credential: ${err.message || 'request failed'}`);
    } finally {
      setConnectorSaving(prev => ({ ...prev, [service]: false }));
      setTimeout(() => setConnectorKeySuccess(null), 5000);
    }
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordFeedback(null);
    if (newPassword.length < 12) {
      setPasswordFeedback({ type: 'error', message: 'Use at least 12 characters for your new password.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFeedback({ type: 'error', message: 'The new passwords do not match.' });
      return;
    }
    setPasswordSaving(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Password could not be changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordFeedback({ type: 'success', message: result.message || 'Password updated successfully.' });
    } catch (error: any) {
      setPasswordFeedback({ type: 'error', message: error?.message || 'Password could not be changed. Please try again.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Password reset state

  const textPrimary = 'text-text-primary';  const textSecondary = 'text-text-secondary';
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
          {activeSubTab === 'about' ? 'PRODUCT GUIDE' : 'WORKSPACE SETTINGS'}
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
          <span className="text-xs font-mono uppercase tracking-wider font-bold">Workspace and company profile</span>
          <span className="ml-auto text-[11px] px-2 py-0.5 bg-brand/10 text-brand font-mono border border-brand/20 rounded font-semibold uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Custom branding
          </span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed max-w-3xl font-mono">
          Set the market, service category and company details used across your workspace.
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
              </div>            </div>          </div>
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
        <details className={`border rounded-lg ${cardBg}`}>
          <summary className="cursor-pointer list-none p-5 font-mono text-xs font-bold uppercase tracking-wider">Advanced · PostgreSQL connection diagnostics</summary>
          <div className="px-5 pb-5">
        {/* PostgreSQL Database Section */}
        <div className={`border rounded-lg p-5 space-y-6 ${cardBg}`}>
          <div className="flex flex-wrap items-center gap-2 border-b pb-3 border-inherit">
            <Database className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold">External PostgreSQL Connection Test</span>
          </div>

          <p className="text-xs text-inherit opacity-80 leading-relaxed font-sans">
            This diagnostic tests a PostgreSQL URI for reachability and reports schema status. It does not switch HAL's live production database or persist a new application connection. A buyer-owned database migration requires a separate, backed-up handover process.
          </p>

          {postgresSuccess && (
            <div className="p-3 bg-accent/10 border border-accent/20 text-accent text-xs rounded-sm font-mono leading-relaxed font-bold uppercase tracking-wider">
              {postgresSuccess}
            </div>
          )}

          <form onSubmit={handleSavePostgres} className="space-y-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="block text-[11px] font-mono opacity-80 uppercase tracking-wider font-bold">PostgreSQL Connection URI (admin only)</label>
              <p className="text-[11px] text-text-secondary">One-time diagnostic only. The URI is not saved by this form or written to browser storage. The live application database remains server-managed.</p>
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
                Validate Connection
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
              postgresStatus.connected && postgresStatus.schemaReady !== false
                ? 'bg-positive/10 border-positive/30 text-positive'
                : postgresStatus.connected
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-negative-dim border-negative/30 text-negative'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span>{postgresStatus.connected
                  ? postgresStatus.schemaReady === false ? 'DATABASE REACHABLE · SCHEMA INCOMPLETE' : 'POSTGRESQL ONLINE'
                  : 'CONNECTION TEST RESULT'}</span>
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
          </div>
        </details>

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

      <details className={`border rounded-lg ${cardBg} mt-6`}>
        <summary className="cursor-pointer list-none p-5 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-xs font-bold uppercase tracking-wider">Integration credentials</span>
          <span className="text-[11px] text-text-secondary">Manage saved credentials</span>
        </summary>
        <div className="px-5 pb-5">
      {/* Integration credentials */}
      <div className={`border rounded-lg p-5 space-y-6 ${cardBg} mt-2`}>
        <div className="flex flex-wrap items-center gap-2 border-b pb-3 border-inherit">
          <Globe className="w-4 h-4 text-accent" />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">Integration credentials</span>
        </div>

        <p className="text-xs text-inherit opacity-80 leading-relaxed font-sans">
          Add credentials only for integrations that your workspace is authorized to use. Saved secrets are encrypted server-side. A saved key is not proof of provider connectivity or an enabled feature.
        </p>
        <p className="text-[11px] text-inherit opacity-70 leading-relaxed">Gemini is used by supported HAL AI workflows when a valid server or tenant credential is available. OpenAI and Anthropic credentials can be stored, but their runtime adapters are not active. Provider status must not be inferred from a saved-key indicator.</p>

          {connectorKeySuccess && (
            <div className="p-3 bg-accent/10 border border-accent/20 text-accent text-xs rounded-sm font-mono leading-relaxed font-bold uppercase tracking-wider flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              {connectorKeySuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            {([
              { id: 'gemini', label: 'Google Gemini', placeholder: 'Google AI Studio API key', env: 'GEMINI_API_KEY', brand: 'googlegemini' },
              { id: 'openai', label: 'OpenAI', placeholder: 'OpenAI API key', env: 'OPENAI_API_KEY', brand: 'openai' },
              { id: 'anthropic', label: 'Anthropic Claude', placeholder: 'Anthropic API key', env: 'ANTHROPIC_API_KEY', brand: 'anthropic' }
            ] as const).map(provider => (
              <div key={provider.id} className={`border p-4 rounded-xl space-y-3 transition-colors hover:border-accent/40 ${innerBg} ${borderCol}`}>
                <div className="flex justify-between items-center">
                  <span className="flex min-w-0 items-center gap-2.5"><ProviderBrandIcon brand={provider.brand} label={provider.label} /><span className="font-semibold text-[12px] text-text-primary normal-case tracking-normal">{provider.label}</span></span>
                  <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorConfigured[provider.id] ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                    {connectorConfigured[provider.id] ? 'Configured' : 'Unconfigured'}
                  </span>
                </div>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={connectorKeys[provider.id]}
                  onChange={(e) => setConnectorKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                  placeholder={provider.placeholder}
                  className={`w-full border rounded-lg p-3 focus:outline-none focus:border-accent text-inherit text-sm ${innerBg} ${borderCol}`}
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-text-secondary">{connectorConfigured[provider.id] ? 'Credential saved' : 'Not saved'}</span>
                  <button type="button" onClick={() => handleSaveConnectorKey(provider.id, connectorKeys[provider.id])} disabled={connectorSaving[provider.id] || !connectorKeys[provider.id].trim()} className="px-3 py-2 rounded-md bg-accent text-black text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/85 transition-colors">
                    {connectorSaving[provider.id] ? 'Saving…' : 'Save credential'}
                  </button>
                </div>
                <span className="text-[11px] text-text-secondary block">Stored encrypted. Saving does not test provider access.</span>
              </div>
            ))}
            {/* Stripe */}
            <div className={`border p-4 rounded-xl space-y-3 transition-colors hover:border-accent/40 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2.5"><ProviderBrandIcon brand="stripe" label="Stripe" /><span className="text-[12px] font-semibold normal-case tracking-normal text-text-primary">Stripe Billing</span></span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.stripe ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.stripe || connectorKeys.stripe ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.stripe}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, stripe: e.target.value }))}
                placeholder="sk_live_..."
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <div className="flex justify-end">
                <button type="button" onClick={() => handleSaveConnectorKey('stripe', connectorKeys.stripe)} disabled={connectorSaving.stripe || !connectorKeys.stripe.trim()} className="px-3 py-2 rounded-md bg-accent text-black text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/85 transition-colors">
                  {connectorSaving.stripe ? 'Saving…' : 'Save credential'}
                </button>
              </div>
              <span className="text-[11px] text-inherit opacity-60 block">Key: STRIPE_SECRET_KEY</span>
            </div>

            {/* Twilio */}
            <div className={`border p-4 rounded-xl space-y-3 transition-colors hover:border-accent/40 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2.5"><ProviderBrandIcon brand="twilio" label="Twilio" /><span className="text-[12px] font-semibold normal-case tracking-normal text-text-primary">Twilio SMS</span></span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.twilio ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.twilio || connectorKeys.twilio ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.twilio}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, twilio: e.target.value }))}
                placeholder="AC... (Auth Token)"
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <div className="flex justify-end">
                <button type="button" onClick={() => handleSaveConnectorKey('twilio', connectorKeys.twilio)} disabled={connectorSaving.twilio || !connectorKeys.twilio.trim()} className="px-3 py-2 rounded-md bg-accent text-black text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/85 transition-colors">
                  {connectorSaving.twilio ? 'Saving…' : 'Save credential'}
                </button>
              </div>
              <span className="text-[11px] text-inherit opacity-60 block">Key: TWILIO_AUTH_TOKEN</span>
            </div>

            {/* SendGrid */}
            <div className={`border p-4 rounded-xl space-y-3 transition-colors hover:border-accent/40 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2.5"><ProviderBrandIcon brand="sendgrid" label="SendGrid" /><span className="text-[12px] font-semibold normal-case tracking-normal text-text-primary">SendGrid Mail</span></span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.sendgrid ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.sendgrid || connectorKeys.sendgrid ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.sendgrid}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, sendgrid: e.target.value }))}
                placeholder="SG..."
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <div className="flex justify-end">
                <button type="button" onClick={() => handleSaveConnectorKey('sendgrid', connectorKeys.sendgrid)} disabled={connectorSaving.sendgrid || !connectorKeys.sendgrid.trim()} className="px-3 py-2 rounded-md bg-accent text-black text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/85 transition-colors">
                  {connectorSaving.sendgrid ? 'Saving…' : 'Save credential'}
                </button>
              </div>
              <span className="text-[11px] text-inherit opacity-60 block">Key: SENDGRID_API_KEY</span>
            </div>

            {/* Google Maps */}
            <div className={`border p-4 rounded-xl space-y-3 transition-colors hover:border-accent/40 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2.5"><ProviderBrandIcon brand="googlemaps" label="Google Maps" /><span className="text-[12px] font-semibold normal-case tracking-normal text-text-primary">Google Maps Platform</span></span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.googleMaps ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.googleMaps || connectorKeys.googleMaps ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.googleMaps}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, googleMaps: e.target.value }))}
                placeholder="AIza..."
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <div className="flex justify-end">
                <button type="button" onClick={() => handleSaveConnectorKey('googleMaps', connectorKeys.googleMaps)} disabled={connectorSaving.googleMaps || !connectorKeys.googleMaps.trim()} className="px-3 py-2 rounded-md bg-accent text-black text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/85 transition-colors">
                  {connectorSaving.googleMaps ? 'Saving…' : 'Save credential'}
                </button>
              </div>
              <span className="text-[11px] text-inherit opacity-60 block">Key: VITE_GOOGLE_MAPS_API_KEY</span>
            </div>

            {/* Google Ads */}
            <div className={`border p-4 rounded-xl space-y-3 transition-colors hover:border-accent/40 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2.5"><ProviderBrandIcon brand="googleads" label="Google Ads" /><span className="text-[12px] font-semibold normal-case tracking-normal text-text-primary">Google Ads</span></span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.googleAds ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.googleAds || connectorKeys.googleAds ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.googleAds}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, googleAds: e.target.value }))}
                placeholder="Developer Token / Client ID"
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <div className="flex justify-end">
                <button type="button" onClick={() => handleSaveConnectorKey('googleAds', connectorKeys.googleAds)} disabled={connectorSaving.googleAds || !connectorKeys.googleAds.trim()} className="px-3 py-2 rounded-md bg-accent text-black text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/85 transition-colors">
                  {connectorSaving.googleAds ? 'Saving…' : 'Save credential'}
                </button>
              </div>
              <span className="text-[11px] text-inherit opacity-60 block">Key: GOOGLE_ADS_DEVELOPER_TOKEN</span>
            </div>

            {/* Meta Ads */}
            <div className={`border p-4 rounded-xl space-y-3 transition-colors hover:border-accent/40 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2.5"><ProviderBrandIcon brand="meta" label="Meta" /><span className="text-[12px] font-semibold normal-case tracking-normal text-text-primary">Meta Marketing</span></span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.metaAds ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.metaAds || connectorKeys.metaAds ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.metaAds}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, metaAds: e.target.value }))}
                placeholder="EAAG..."
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <div className="flex justify-end">
                <button type="button" onClick={() => handleSaveConnectorKey('metaAds', connectorKeys.metaAds)} disabled={connectorSaving.metaAds || !connectorKeys.metaAds.trim()} className="px-3 py-2 rounded-md bg-accent text-black text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/85 transition-colors">
                  {connectorSaving.metaAds ? 'Saving…' : 'Save credential'}
                </button>
              </div>
              <span className="text-[11px] text-inherit opacity-60 block">Key: META_SYSTEM_USER_TOKEN</span>
            </div>

            {/* GA4 / Search Console */}
            <div className={`border p-4 rounded-xl space-y-3 transition-colors hover:border-accent/40 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2.5"><ProviderBrandIcon brand="googleanalytics" label="Google Analytics" /><span className="text-[12px] font-semibold normal-case tracking-normal text-text-primary">GA4 & Search Console</span></span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.ga4 ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.ga4 || connectorKeys.ga4 ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.ga4}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, ga4: e.target.value }))}
                placeholder="Service Account JSON Token"
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <div className="flex justify-end">
                <button type="button" onClick={() => handleSaveConnectorKey('ga4', connectorKeys.ga4)} disabled={connectorSaving.ga4 || !connectorKeys.ga4.trim()} className="px-3 py-2 rounded-md bg-accent text-black text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/85 transition-colors">
                  {connectorSaving.ga4 ? 'Saving…' : 'Save credential'}
                </button>
              </div>
              <span className="text-[11px] text-inherit opacity-60 block">Key: GOOGLE_SERVICE_ACCOUNT</span>
            </div>

            {/* Slack Webhook */}
            <div className={`border p-4 rounded-xl space-y-3 transition-colors hover:border-accent/40 ${innerBg} ${borderCol}`}>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2.5"><ProviderBrandIcon brand="slack" label="Slack" /><span className="text-[12px] font-semibold normal-case tracking-normal text-text-primary">Slack Operations</span></span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${connectorKeys.slack ? 'bg-positive/20 text-positive' : 'bg-warning-dim text-warning'}`}>
                  {connectorConfigured.slack || connectorKeys.slack ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <input
                type="password"
                value={connectorKeys.slack}
                onChange={(e) => setConnectorKeys(prev => ({ ...prev, slack: e.target.value }))}
                placeholder="https://hooks.slack.com/services/..."
                className={`w-full border rounded p-2 focus:outline-none focus:border-accent text-inherit font-mono text-xs ${innerBg} ${borderCol}`}
              />
              <div className="flex justify-end">
                <button type="button" onClick={() => handleSaveConnectorKey('slack', connectorKeys.slack)} disabled={connectorSaving.slack || !connectorKeys.slack.trim()} className="px-3 py-2 rounded-md bg-accent text-black text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/85 transition-colors">
                  {connectorSaving.slack ? 'Saving…' : 'Save credential'}
                </button>
              </div>
              <span className="text-[11px] text-inherit opacity-60 block">Key: SLACK_WEBHOOK_URL</span>
            </div>

            {/* Workspace OAuth is configured in deployment settings, not through a pasted key here. */}
            <div className={`border p-4 rounded space-y-2 ${innerBg} ${borderCol}`}>
              <span className="font-bold uppercase font-mono text-[11px] text-accent">Google Workspace OAuth</span>
              <p className="text-[11px] text-inherit opacity-70 leading-relaxed">
                Configure the Firebase web app and Google provider in the deployment environment using VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID. Then authorize Drive, Calendar, and Gmail from Connectors → Workspace. Do not paste OAuth secrets into this settings field.
              </p>
            </div>
          </div>
        </div>
        </div>
      </details>

        {/* Account Security Password Reset */}
        <div className={`border rounded-lg p-5 space-y-6 ${cardBg}`}>
          <div className="flex flex-wrap items-center gap-2 border-b pb-3 border-inherit">
            <Lock className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold">Password and account security</span>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed font-sans">
            Change the password for this account. HAL verifies your current password and stores the new password as a server-side hash. This form is for email-and-password accounts; Google sign-in passwords are managed in your Google Account.
          </p>

          {passwordFeedback && (
            <div role="status" className={`p-3 rounded-md border text-sm ${passwordFeedback.type === 'success' ? 'border-positive/30 bg-positive/10 text-positive' : 'border-negative/30 bg-negative-dim text-negative'}`}>
              {passwordFeedback.message}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <label className="space-y-1.5 text-sm">
              <span className="block text-text-secondary">Current password</span>
              <input type="password" autoComplete="current-password" required value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className={`w-full border rounded-md p-3 text-sm ${innerBg} ${borderCol}`} />
            </label>
            <div className="hidden md:block" />
            <label className="space-y-1.5 text-sm">
              <span className="block text-text-secondary">New password</span>
              <input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={newPassword} onChange={event => setNewPassword(event.target.value)} className={`w-full border rounded-md p-3 text-sm ${innerBg} ${borderCol}`} />
              <span className="text-xs text-text-secondary">Use 12–128 characters.</span>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="block text-text-secondary">Confirm new password</span>
              <input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmNewPassword} onChange={event => setConfirmNewPassword(event.target.value)} className={`w-full border rounded-md p-3 text-sm ${innerBg} ${borderCol}`} />
            </label>
            <div className="md:col-span-2">
              <button type="submit" disabled={passwordSaving || !currentPassword || !newPassword || !confirmNewPassword} className="px-4 py-2.5 rounded-md bg-accent text-black text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/85 transition-colors">
                {passwordSaving ? 'Updating password…' : 'Update password'}
              </button>
            </div>
          </form>
          <p className="text-xs text-text-secondary leading-relaxed max-w-3xl">
            Your current session stays active after the change. Other devices may remain signed in until their sessions expire; sign them out separately if you no longer trust them.
          </p>
        </div>
      {/* PUBLIC SHARE & REDDIT TESTING SHIELD */}      <div className={`border rounded-lg p-5 mt-6 space-y-5 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-inherit">
          <div className="flex items-center gap-2">            <Globe className="w-4 h-4 text-brand" />
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
              <div className={`w-full border rounded p-2 text-xs font-mono uppercase tracking-wider ${innerBg} ${borderCol}`}>
                Blank slate only · real sourced data required
              </div>
            </div>
          </div>

          <div className="p-4 bg-negative-dim border border-negative/20 rounded-md space-y-3">
            <div className="flex gap-2 items-center text-negative font-mono text-[11px] uppercase font-bold tracking-wider">
              <AlertTriangle className="w-4 h-4 text-negative" />
              <span>Critical Administrative Override Action</span>
            </div>
            <p className="text-[11px] opacity-75 leading-relaxed">
              This action is irreversible. It clears the tenant's lead pipeline, campaign and performance records, revenue entries, forecasts, recommendations, missions and chat messages in the authoritative database. Client delivery projects are protected; if any exist, the reset is blocked. Open work tasks linked to removed leads are cancelled and retained in the work history. HAL will not generate synthetic business data.
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