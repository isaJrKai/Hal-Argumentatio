import React, { createContext, useContext, useState, useEffect } from 'react';
import { INDUSTRY_TAXONOMY, IndustryProfile, getIndustryProfile } from '../config/industryTaxonomy';
import { GLOBAL_REGIONS, RegionalProfile, resolveRegionalProfile } from '../config/worldModel';

export interface WorkspaceConfig {
  agencyName: string;
  operatorName: string;
  agencyLogoUrl?: string;
  brandColor: string;
  tagline: string;
  bookingUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  customCities: string[];
  customNiches: string[];
  ltvMultiplier: number; // Formula tuning multiplier (e.g. 1.0)
  targetCAC: number; // Configurable operational target CAC
  budgetMultiplier: number; // Budget scaling factor
  autoDeployHermesAssets: boolean; // Dynamic cross-system deployment
}

export interface BusinessContextType {
  // Industry & Niche Taxonomy
  activeIndustry: IndustryProfile;
  activeCity: string;
  activeNiche: string;
  
  // World Model & Regional Heuristics
  regionalProfile: RegionalProfile;
  setRegionalProfileByCity: (city: string, country?: string) => void;
  formatCurrency: (amount: number) => string;
  
  // State setters
  setActiveIndustry: (industryId: string) => void;
  setActiveCity: (city: string) => void;
  setActiveNiche: (niche: string) => void;
  
  // Taxonomy lists
  supportedIndustries: IndustryProfile[];
  supportedCities: string[];
  supportedNiches: string[];
  globalRegions: Record<string, RegionalProfile>;

  // Dynamic customization actions
  addCustomCity: (city: string) => void;
  addCustomNiche: (niche: string) => void;

  // White-Label Workspace Configuration
  workspaceConfig: WorkspaceConfig;
  updateWorkspaceConfig: (updates: Partial<WorkspaceConfig>) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default Base Lists spanning diverse global proving grounds
  const defaultCities = ['Dallas', 'Winnipeg', 'Columbus', 'Dubai', 'Kampala', 'London', 'Calgary', 'Toronto'];

  // Persistent Active Industry
  const [activeIndustryId, setActiveIndustryIdState] = useState<string>(() => {
    return localStorage.getItem('hal_active_industry_id') || 'builders_construction';
  });

  const activeIndustry = getIndustryProfile(activeIndustryId);

  // Persistent Active City
  const [activeCity, setActiveCityState] = useState<string>(() => {
    return localStorage.getItem('hal_active_city') || 'Dallas';
  });

  // Derived Dynamic World Model Regional Profile
  const [regionalProfile, setRegionalProfile] = useState<RegionalProfile>(() => {
    return resolveRegionalProfile(activeCity);
  });

  // Persistent Active Niche
  const [activeNiche, setActiveNicheState] = useState<string>(() => {
    return localStorage.getItem('hal_active_niche') || activeIndustry.defaultNiches[0];
  });

  // White-Label Workspace Config State
  const [workspaceConfig, setWorkspaceConfigState] = useState<WorkspaceConfig>(() => {
    const saved = localStorage.getItem('hal_workspace_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved workspace config:', e);
      }
    }
    return {
      agencyName: 'HAL Intelligence',
      operatorName: 'Workspace Operator',
      brandColor: '#2563eb',
      tagline: 'AI Business Operating Intelligence Platform',
      bookingUrl: 'https://cal.com/hal-strategy',
      contactPhone: '(214) 555-0199',
      contactEmail: 'advisory@hal-operating.com',
      customCities: [],
      customNiches: [],
      ltvMultiplier: 1.0,
      targetCAC: 145,
      budgetMultiplier: 1.0,
      autoDeployHermesAssets: true
    };
  });

  // Combined Cities & Niches
  const supportedCities = Array.from(new Set([...defaultCities, ...(workspaceConfig.customCities || [])]));
  const supportedNiches = Array.from(new Set([...activeIndustry.defaultNiches, ...(workspaceConfig.customNiches || [])]));

  // Actions
  const setActiveIndustry = (industryId: string) => {
    const profile = getIndustryProfile(industryId);
    setActiveIndustryIdState(profile.id);
    localStorage.setItem('hal_active_industry_id', profile.id);

    // Auto-set first niche for new industry if current niche is not in new industry default list
    if (!profile.defaultNiches.includes(activeNiche)) {
      const firstNiche = profile.defaultNiches[0];
      setActiveNicheState(firstNiche);
      localStorage.setItem('hal_active_niche', firstNiche);
    }
  };

  const setActiveCity = (city: string) => {
    const cleanCity = city.trim();
    if (!cleanCity) return;
    setActiveCityState(cleanCity);
    localStorage.setItem('hal_active_city', cleanCity);

    // Synchronize the World Model regional profile immediately
    const resolved = resolveRegionalProfile(cleanCity);
    setRegionalProfile(resolved);
  };

  const setRegionalProfileByCity = (city: string, country?: string) => {
    const cleanCity = city.trim();
    if (!cleanCity) return;
    setActiveCityState(cleanCity);
    localStorage.setItem('hal_active_city', cleanCity);
    const resolved = resolveRegionalProfile(cleanCity, country);
    setRegionalProfile(resolved);
  };

  const formatCurrency = (amount: number) => {
    return regionalProfile.currencyFormat(amount);
  };

  const setActiveNiche = (niche: string) => {
    const cleanNiche = niche.trim().toLowerCase();
    if (!cleanNiche) return;
    setActiveNicheState(cleanNiche);
    localStorage.setItem('hal_active_niche', cleanNiche);
  };

  const addCustomCity = (city: string) => {
    const clean = city.trim();
    if (!clean || supportedCities.includes(clean)) return;

    const nextCustom = [...(workspaceConfig.customCities || []), clean];
    updateWorkspaceConfig({ customCities: nextCustom });
    setActiveCity(clean);
  };

  const addCustomNiche = (niche: string) => {
    const clean = niche.trim().toLowerCase();
    if (!clean || supportedNiches.includes(clean)) return;

    const nextCustom = [...(workspaceConfig.customNiches || []), clean];
    updateWorkspaceConfig({ customNiches: nextCustom });
    setActiveNiche(clean);
  };

  const updateWorkspaceConfig = (updates: Partial<WorkspaceConfig>) => {
    setWorkspaceConfigState((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('hal_workspace_config', JSON.stringify(updated));
      return updated;
    });
  };

  // Dynamically synchronize the workspace brand accent color with CSS variables
  useEffect(() => {
    if (typeof document !== 'undefined' && workspaceConfig.brandColor) {
      const hex = workspaceConfig.brandColor;
      const root = document.documentElement;
      
      let r = 37, g = 99, b = 235;
      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
      }
      
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      const contrastText = yiq >= 150 ? '#05070c' : '#ffffff';

      root.style.setProperty('--accent', hex);
      root.style.setProperty('--color-accent', hex);
      root.style.setProperty('--color-brand', hex);
      root.style.setProperty('--accent-dim', `rgba(${r}, ${g}, ${b}, 0.1)`);
      root.style.setProperty('--accent-mid', `rgba(${r}, ${g}, ${b}, 0.2)`);
      root.style.setProperty('--accent-contrast', contrastText);
    }
  }, [workspaceConfig.brandColor]);

  // Keep Regional Profile synchronized with activeCity
  useEffect(() => {
    const resolved = resolveRegionalProfile(activeCity);
    setRegionalProfile(resolved);
  }, [activeCity]);

  return (
    <BusinessContext.Provider value={{
      activeIndustry,
      activeCity,
      activeNiche,
      regionalProfile,
      setRegionalProfileByCity,
      formatCurrency,
      setActiveIndustry,
      setActiveCity,
      setActiveNiche,
      supportedIndustries: INDUSTRY_TAXONOMY,
      supportedCities,
      supportedNiches,
      globalRegions: GLOBAL_REGIONS,
      addCustomCity,
      addCustomNiche,
      workspaceConfig,
      updateWorkspaceConfig
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusinessContext = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusinessContext must be used within a BusinessProvider');
  }
  return context;
};
