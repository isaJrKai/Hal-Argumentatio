import React from 'react';
import { ArrowLeft, ExternalLink, Layout, Users, Briefcase, Send, BarChart3, Settings } from 'lucide-react';

interface BlueprintViewerPanelProps {
  onBackToDashboard?: () => void;
}

const productAreas = [
  {
    title: 'Prospects',
    description: 'Manage prospect records, source details, qualification and follow-up status.',
    icon: Users
  },
  {
    title: 'Sales pipeline',
    description: 'Track opportunities, customer relationships and deal progress.',
    icon: Briefcase
  },
  {
    title: 'Outreach',
    description: 'Organize campaigns and keep communication activity with each prospect.',
    icon: Send
  },
  {
    title: 'Business assistant',
    description: 'Draft and review business content using the model provider selected in the workspace.',
    icon: Layout
  },
  {
    title: 'Financials',
    description: 'Review recorded revenue and pipeline information. Estimates should remain distinct from actual results.',
    icon: BarChart3
  },
  {
    title: 'Settings and integrations',
    description: 'Manage workspace details and provider credentials. A saved credential does not prove a successful connection.',
    icon: Settings
  }
];

export const BlueprintViewerPanel: React.FC<BlueprintViewerPanelProps> = ({ onBackToDashboard }) => {
  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border-dim pb-5">
        <div className="flex items-start gap-3">
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="mt-1 p-2 rounded-md border border-border-dim text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors"
              aria-label="Back to overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">Product architecture</h1>
            <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
              A practical overview of the main HAL workspace areas and how they fit together. This page describes the product; it is not a live system-health report.
            </p>
          </div>
        </div>
        <a
          href="/hal-app-overview.html"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border-default text-sm text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          Archived design reference
        </a>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {productAreas.map((area) => {
          const Icon = area.icon;
          return (
            <article key={area.title} className="bg-bg-raised border border-border-dim rounded-xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center text-accent">
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-text-primary">{area.title}</h2>
                <p className="text-sm text-text-secondary leading-relaxed">{area.description}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="bg-bg-raised border border-border-dim rounded-xl p-5 space-y-3">
        <h2 className="text-base font-semibold text-text-primary">Product boundaries</h2>
        <ul className="space-y-2 text-sm text-text-secondary leading-relaxed list-disc pl-5">
          <li>Provider credentials must be saved and their connections tested before an integration is described as working.</li>
          <li>Assistant output is a draft for the operator to review, not a completed business action.</li>
          <li>Recorded business results, estimates and forecasts must be clearly distinguished.</li>
          <li>Planned modules are not represented as available production features until their behavior is implemented and verified.</li>
        </ul>
      </section>
    </div>
  );
};
