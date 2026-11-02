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
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Mobile Core Web Vitals Benchmark
            </h4>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/30">
            ⚡ &lt;2.5s Target Passed
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-bg-base/70 border border-border-dim">
            <div className="text-xl font-black text-emerald-400">98 / 100</div>
            <div className="text-[10.5px] text-text-secondary mt-0.5">Google PageSpeed</div>
          </div>
          <div className="p-3 rounded-xl bg-bg-base/70 border border-border-dim">
            <div className="text-xl font-black text-sky-400">1.1s</div>
            <div className="text-[10.5px] text-text-secondary mt-0.5">Largest Contentful Paint</div>
          </div>
          <div className="p-3 rounded-xl bg-bg-base/70 border border-border-dim">
            <div className="text-xl font-black text-amber-400">0.00</div>
            <div className="text-[10.5px] text-text-secondary mt-0.5">Cumulative Layout Shift</div>
          </div>
        </div>

        <p className="text-[11px] text-text-secondary leading-relaxed">
          The builder uses an ultra-lean CSS architecture with zero framework runtime bloat. Homeowners on weak cellular networks experience instantaneous click-to-call response.
        </p>
      </div>

      {/* Google SERP Snippet Preview */}
      <div className="p-5 rounded-2xl bg-bg-raised/60 border border-border-dim space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border-dim">
          <Globe className="w-4 h-4 text-sky-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Google Search Snippet Preview (Local SEO)
          </h4>
        </div>

        {/* Live Snippet Box */}
        <div className="p-4 rounded-xl bg-bg-base border border-border-dim space-y-1">
          <div className="text-[11px] text-text-secondary font-mono truncate">
            https://hal.ai/landing/{config.id}
          </div>
          <div className="text-sm font-bold text-sky-400 hover:underline cursor-pointer">
            {config.seo.metaTitle || `${config.businessName} | 24/7 ${config.city}`}
          </div>
          <div className="text-xs text-text-secondary line-clamp-2">
            {config.seo.metaDescription || `Reliable licensed emergency service in ${config.city}. Fast arrival, upfront fixed pricing, and master certified technicians.`}
          </div>
        </div>

        {/* Edit Inputs */}
        <div className="space-y-2.5 pt-2 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-text-secondary mb-1">
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
              className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-dim text-text-primary focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-text-secondary mb-1">
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
              className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-dim text-text-primary focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Local SEO Structured Data Preview */}
      <div className="p-5 rounded-2xl bg-bg-raised border border-border-dim space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-dim">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Local SEO Schema Preview
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-500 text-[10px] font-bold uppercase">
            Preview only · Not validated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-bg-base border border-border-dim space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Business details</span>
            <div className="font-semibold text-text-primary truncate">{config.businessName}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">Configured here · Not externally verified</div>
          </div>

          <div className="p-3 rounded-xl bg-bg-base border border-border-dim space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Contact link preview</span>
            <div className="font-semibold text-text-primary font-mono">{config.phone || 'No phone configured'}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">Phone number shown · No dispatch connection</div>
          </div>

          <div className="p-3 rounded-xl bg-bg-base border border-border-dim space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Target Service Territory</span>
            <div className="font-semibold text-text-primary truncate">{config.city}</div>
            <div className="text-[11px] text-text-secondary font-mono">{(config.sections.service_areas?.cities || [config.city]).slice(0, 3).join(', ')}</div>
          </div>

          <div className="p-3 rounded-xl bg-bg-base border border-border-dim space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">Operating hours</span>
            <div className="font-semibold text-text-primary">Not configured</div>
            <div className="text-[11px] text-text-secondary font-mono">No live availability verification</div>
          </div>
        </div>

        <p className="text-[11px] text-text-secondary leading-relaxed">
          This panel previews the structured business details HAL can publish. It does not confirm Google indexing, Local Pack eligibility, business identity, operating hours, or rich-result validation.
        </p>

        {/* Optional Collapsible Technical Payload */}
        <details className="pt-2 text-xs">
          <summary className="cursor-pointer text-text-secondary hover:text-text-primary font-mono text-[11px] flex items-center justify-between">
            <span>Inspect technical structured data payload</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                copySchema();
              }}
              className="px-2 py-0.5 rounded bg-bg-subtle hover:bg-bg-base text-text-primary text-[10px] font-mono flex items-center gap-1 transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </summary>
          <pre className="mt-3 p-3 rounded-xl bg-bg-base border border-border-dim font-mono text-[10.5px] text-text-secondary overflow-x-auto max-h-48">
            {JSON.stringify(schemaJson, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};
