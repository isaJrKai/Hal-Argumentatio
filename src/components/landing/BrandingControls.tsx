import React from 'react';
import { LandingPageConfig, ColorPreset } from './types';
import { Palette, Phone, Shield, Sparkles, Type } from 'lucide-react';

interface BrandingControlsProps {
  config: LandingPageConfig;
  onChange: (updated: LandingPageConfig) => void;
}

const PRESETS: Array<{
  id: ColorPreset;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}> = [
  { id: 'emergency_amber', name: 'Emergency Amber', primary: '#0284c7', secondary: '#0f172a', accent: '#f59e0b' },
  { id: 'trust_navy', name: 'Trust Navy & Cyan', primary: '#2563eb', secondary: '#0f172a', accent: '#38bdf8' },
  { id: 'modern_slate', name: 'Modern Slate Blue', primary: '#0f172a', secondary: '#334155', accent: '#3b82f6' },
  { id: 'eco_green', name: 'Eco Emerald', primary: '#059669', secondary: '#064e3b', accent: '#10b981' },
  { id: 'electric_gold', name: 'High-Voltage Gold', primary: '#eab308', secondary: '#18181b', accent: '#f97316' },
];

export const BrandingControls: React.FC<BrandingControlsProps> = ({ config, onChange }) => {
  const applyPreset = (preset: typeof PRESETS[0]) => {
    onChange({
      ...config,
      branding: {
        ...config.branding,
        colorPreset: preset.id,
        primaryColor: preset.primary,
        secondaryColor: preset.secondary,
        accentColor: preset.accent
      }
    });
  };

  return (
    <div className="space-y-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <Palette className="w-4 h-4 text-amber-400" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Brand Identity & Emergency Contact
        </h4>
      </div>

      {/* Core Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Company / Trade Name</label>
          <input
            type="text"
            value={config.businessName}
            onChange={(e) => onChange({ ...config, businessName: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Primary City / Region</label>
          <input
            type="text"
            value={config.city}
            onChange={(e) => onChange({ ...config, city: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <Phone className="w-3 h-3 text-amber-400" />
            <span>Click-to-Call Phone Number</span>
          </label>
          <input
            type="text"
            value={config.phone}
            onChange={(e) => onChange({ ...config, phone: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <Shield className="w-3 h-3 text-sky-400" />
            <span>Master License / Bond #</span>
          </label>
          <input
            type="text"
            value={config.licenseNumber}
            onChange={(e) => onChange({ ...config, licenseNumber: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Color Presets */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-400 mb-2">
          One-Click Trade Color Palettes
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESETS.map((p) => {
            const isSelected = config.branding.colorPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`p-2 rounded-lg border text-left transition flex items-center gap-2 text-xs ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex gap-1 shrink-0">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.primary }} />
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.accent }} />
                </div>
                <span className="truncate text-[11px] font-medium">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Archetype */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
          <Type className="w-3 h-3 text-slate-400" />
          <span>Typographic Archetype</span>
        </label>
        <select
          value={config.branding.fontStyle}
          onChange={(e) =>
            onChange({
              ...config,
              branding: { ...config.branding, fontStyle: e.target.value as any }
            })
          }
          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
        >
          <option value="modern_sans">Modern Clean Sans (High Legibility)</option>
          <option value="impact_bold">Industrial Impact Bold (Contractor Power)</option>
          <option value="classic_authority">Classic Authority (Established Trust)</option>
        </select>
      </div>
    </div>
  );
};
