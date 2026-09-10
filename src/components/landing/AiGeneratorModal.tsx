import React, { useState } from 'react';
import { LandingPageConfig, TradeType } from './types';
import { Sparkles, Loader2, X, Wand2, Shield, Flame, CheckCircle, Scale } from 'lucide-react';

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onGenerated: (newConfig: LandingPageConfig) => void;
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  token,
  onGenerated
}) => {
  const [prompt, setPrompt] = useState('Emergency plumbing specialist in Austin handling burst pipes, slab leaks, drain backups, and water heaters');
  const [trade, setTrade] = useState<TradeType>('plumbing');
  const [city, setCity] = useState('Austin, TX');
  const [businessName, setBusinessName] = useState('Lone Star Precision Plumbing');
  const [phone, setPhone] = useState('(512) 555-0144');

  // Rule 6: Interview before inventing fields
  const [primaryGoal, setPrimaryGoal] = useState('Emergency Dispatch / Fast Arrival');
  const [audience, setAudience] = useState('Local Residential Homeowners');
  const [coreOffer, setCoreOffer] = useState('30-min arrival guarantee, $49 diagnostic waived with repair');
  const [proofAvailable, setProofAvailable] = useState('Master Plumber Lic #38491, BBB A+ Rating, $5M Insured');
  const [variantArchetype, setVariantArchetype] = useState<'emergency_dispatch' | 'master_craftsman' | 'flat_rate'>('emergency_dispatch');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/landing-pages/generate-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          prompt,
          trade,
          city,
          businessName,
          phone,
          audience,
          primaryGoal,
          coreOffer,
          proofAvailable,
          variantArchetype
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate landing page with AI.');
      }

      onGenerated(data.config);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI generator.');
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    {
      trade: 'plumbing' as TradeType,
      city: 'Austin, TX',
      name: 'Lone Star Emergency Plumbers',
      phone: '(512) 555-0199',
      archetype: 'emergency_dispatch' as const,
      offer: '30-min rapid dispatch, zero trip fee with repair',
      text: 'Family-owned plumbing company in Austin focused on emergency drain clearing, slab leak detection, and water heaters.'
    },
    {
      trade: 'hvac' as TradeType,
      city: 'Calgary, AB',
      name: 'Vanguard 24/7 Heating Pros',
      phone: '(403) 555-0188',
      archetype: 'master_craftsman' as const,
      offer: '10-year parts & labor warranty, 24/7 winter freeze dispatch',
      text: 'Emergency furnace repair specialist in Calgary handling winter no-heat emergencies, heat pumps, and AC tune-ups.'
    },
    {
      trade: 'roofing' as TradeType,
      city: 'Denver, CO',
      name: 'Apex Storm & Hail Roofers',
      phone: '(303) 555-0177',
      archetype: 'flat_rate' as const,
      offer: 'Free drone inspection, upfront written flat-rate estimates',
      text: 'Hail damage and storm restoration roofer in Denver offering emergency tarping and complete insurance claim walkthroughs.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Landing Page Builder: Guided Intake Interview
              </h3>
              <p className="text-xs text-slate-400">
                Rule 6 Enforced: Structured interview before inventing, 3 distinct directional archetypes, zero AI slop.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Preset Fillers */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">
              Quick Trade Presets (1-Click Fill):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {samplePrompts.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPrompt(s.text);
                    setTrade(s.trade);
                    setCity(s.city);
                    setBusinessName(s.name);
                    setPhone(s.phone);
                    setCoreOffer(s.offer);
                    setVariantArchetype(s.archetype);
                  }}
                  className="p-2.5 text-left rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-400/60 text-[11px] text-slate-300 transition group"
                >
                  <strong className="text-amber-400 block truncate group-hover:underline">{s.name}</strong>
                  <span className="text-slate-500 truncate block text-[10px] mt-0.5">{s.city} • {s.trade.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rule 6: Directional Archetype Variant Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Select Directional Archetype (Rule 6: 3 Distinct Layout & Tone Axes)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setVariantArchetype('emergency_dispatch')}
                className={`p-3 rounded-xl border text-left transition ${
                  variantArchetype === 'emergency_dispatch'
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                  <Flame className="w-4 h-4" />
                  <span>High-Urgency Dispatch</span>
                </div>
                <p className="text-[10.5px] leading-snug">
                  Emergency amber, 30-min window badge, lead capture above fold, instant dialer.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVariantArchetype('master_craftsman')}
                className={`p-3 rounded-xl border text-left transition ${
                  variantArchetype === 'master_craftsman'
                    ? 'bg-blue-500/15 border-blue-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-blue-400 font-bold mb-1">
                  <Shield className="w-4 h-4" />
                  <span>Master Craftsman</span>
                </div>
                <p className="text-[10.5px] leading-snug">
                  Trust navy, 10-year warranty badges, before/after project proof, BBB rating.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVariantArchetype('flat_rate')}
                className={`p-3 rounded-xl border text-left transition ${
                  variantArchetype === 'flat_rate'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                  <Scale className="w-4 h-4" />
                  <span>Modern Flat-Rate</span>
                </div>
                <p className="text-[10.5px] leading-snug">
                  Clean modern slate, transparent price cards, zero surprise fees guarantee.
                </p>
              </button>
            </div>
          </div>

          {/* Intake Interview Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Trade Category</label>
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value as TradeType)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="plumbing">Plumbing & Drains</option>
                <option value="hvac">Heating & Air Conditioning</option>
                <option value="roofing">Roofing & Exteriors</option>
                <option value="electrical">Electrical & Lighting</option>
                <option value="landscaping">Landscaping & Grounds</option>
                <option value="renovation">Remodeling & General</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">City & Territory</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Click-to-Call Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                One Primary Conversion Goal (Rule 1)
              </label>
              <input
                type="text"
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                placeholder="e.g. Emergency 24/7 Dispatch / Same-Day Booking"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Target Audience (Rule 6)
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. Suburban residential homeowners with plumbing emergencies"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Core Offer & Urgency (Rule 6)
              </label>
              <input
                type="text"
                value={coreOffer}
                onChange={(e) => setCoreOffer(e.target.value)}
                placeholder="e.g. 30-min arrival guarantee, zero overtime rates"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Real Proof Available (Rule 5 & 6)
              </label>
              <input
                type="text"
                value={proofAvailable}
                onChange={(e) => setProofAvailable(e.target.value)}
                placeholder="e.g. Master License #PRO-8812, BBB A+, $5M liability insurance"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Contractor Context & Specialty Services
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Family-owned local emergency plumbing service with fast response, sewer camera inspection, and flat-rate pricing..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Anti-Slop Linter & Humanizer Auto-Pass Active</span>
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleGenerate}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing (Anti-Slop Cleaned)...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generate Compliant Page</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
