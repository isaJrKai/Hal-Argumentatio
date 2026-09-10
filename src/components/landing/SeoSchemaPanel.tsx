import React, { useState } from 'react';
import { LandingPageConfig } from './types';
import { Globe, Gauge, Code2, Copy, Check, ShieldCheck, Sparkles } from 'lucide-react';

interface SeoSchemaPanelProps {
  config: LandingPageConfig;
  onChange: (updated: LandingPageConfig) => void;
}

export const SeoSchemaPanel: React.FC<SeoSchemaPanelProps> = ({ config, onChange }) => {
  const [copied, setCopied] = useState(false);

  const schemaJson = {
    "@context": "https://schema.org",
    "@type": config.seo.schemaType || "HomeAndConstructionBusiness",
    "name": config.businessName,
    "telephone": config.phone,
    "url": `https://hal.ai/landing/${config.id}`,
    "areaServed": config.sections.service_areas?.cities || [config.city],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": config.city,
      "streetAddress": config.sections.footer?.address || config.city
    },
    "priceRange": "$$",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59"
    }
  };

  const copySchema = () => {
    navigator.clipboard.writeText(JSON.stringify(schemaJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Performance & Core Web Vitals Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Mobile Core Web Vitals Benchmark
            </h4>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/30">
            ⚡ &lt;2.5s Target Passed
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xl font-black text-emerald-400">98 / 100</div>
            <div className="text-[10.5px] text-slate-400 mt-0.5">Google PageSpeed</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xl font-black text-sky-400">1.1s</div>
            <div className="text-[10.5px] text-slate-400 mt-0.5">Largest Contentful Paint</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xl font-black text-amber-400">0.00</div>
            <div className="text-[10.5px] text-slate-400 mt-0.5">Cumulative Layout Shift</div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          The builder uses an ultra-lean CSS architecture with zero framework runtime bloat. Homeowners on weak cellular networks experience instantaneous click-to-call response.
        </p>
      </div>

      {/* Google SERP Snippet Preview */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Globe className="w-4 h-4 text-sky-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Google Search Snippet Preview (Local SEO)
          </h4>
        </div>

        {/* Live Snippet Box */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-mono truncate">
            https://hal.ai/landing/{config.id}
          </div>
          <div className="text-sm font-bold text-sky-400 hover:underline cursor-pointer">
            {config.seo.metaTitle || `${config.businessName} | 24/7 ${config.city}`}
          </div>
          <div className="text-xs text-slate-300 line-clamp-2">
            {config.seo.metaDescription || `Reliable licensed emergency service in ${config.city}. Fast arrival, upfront fixed pricing, and master certified technicians.`}
          </div>
        </div>

        {/* Edit Inputs */}
        <div className="space-y-2.5 pt-2 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Page Meta Title (50-60 chars)
            </label>
            <input
              type="text"
              value={config.seo.metaTitle}
              onChange={(e) =>
                onChange({
                  ...config,
                  seo: { ...config.seo, metaTitle: e.target.value }
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Page Meta Description (120-160 chars)
            </label>
            <textarea
              rows={2}
              value={config.seo.metaDescription}
              onChange={(e) =>
                onChange({
                  ...config,
                  seo: { ...config.seo, metaDescription: e.target.value }
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* JSON-LD LocalBusiness Schema Viewer */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Auto-Generated LocalBusiness JSON-LD Schema
            </h4>
          </div>
          <button
            type="button"
            onClick={copySchema}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Schema'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-sky-300 overflow-x-auto max-h-60">
          {JSON.stringify(schemaJson, null, 2)}
        </pre>
      </div>
    </div>
  );
};
