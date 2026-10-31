import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Sparkles, 
  Wand2, 
  RefreshCw, 
  Sliders, 
  ArrowRight, 
  History,
  FileText,
  Smartphone,
  Zap,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LandingPageConfig } from './types';
import { auditLandingPage, autoRemediateGate, QualityGateItem } from '../../services/landingQualityGate';
import { applyHumanizerPass, HumanizerDiff } from '../../services/landingHumanizer';

interface QualityGatePanelProps {
  config: LandingPageConfig;
  onChange: (updated: LandingPageConfig) => void;
  onNavigateToTab?: (tab: 'editor' | 'seo' | 'branding') => void;
}

export const QualityGatePanel: React.FC<QualityGatePanelProps> = ({ config, onChange, onNavigateToTab }) => {
  const [activeDiffs, setActiveDiffs] = useState<HumanizerDiff[] | null>(null);
  const [expandedGateId, setExpandedGateId] = useState<string | null>(null);
  const [lastHumanizedAt, setLastHumanizedAt] = useState<string | null>(null);

  const audit = auditLandingPage(config);

  const handleRunHumanizer = () => {
    const { cleanedConfig, diffs, previousScore, newScore } = applyHumanizerPass(config);
    onChange(cleanedConfig);
    setActiveDiffs(diffs);
    setLastHumanizedAt(new Date().toLocaleTimeString());
  };

  const handleAutoFix = (gateId: string) => {
    const fixed = autoRemediateGate(config, gateId);
    onChange(fixed);
  };

  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Score & Publish Readiness */}
      <div className="bg-bg-raised border border-border-dim rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl border ${
              audit.readyToPublish 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-text-primary tracking-tight">
                  Landing Page Quality Gates
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  audit.readyToPublish
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {audit.readyToPublish ? 'Ready to Publish' : 'Needs Optimization'}
                </span>
              </div>
              <p className="text-sm text-text-secondary mt-1 max-w-2xl">
                Enforcing the 8 Core Rules: Single primary goal, above-the-fold contract, anti-slop copy linter, token design purity, WCAG AA contrast, and tactile motion performance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 self-end md:self-center">
            <div className="text-right">
              <div className="text-3xl font-black text-text-primary">
                {audit.overallScore}<span className="text-lg text-text-tertiary font-normal">/100</span>
              </div>
              <div className="text-xs text-text-secondary font-medium">Compliance Score</div>
            </div>
            <button
              onClick={handleRunHumanizer}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-accent-contrast font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run Anti-Slop Pass</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border-dim text-sm">
          <div className="bg-bg-base/60 p-3 rounded-lg border border-border-dim">
            <div className="text-xs text-text-secondary">Passed Gates</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              {audit.passedCount} / {audit.totalCount}
            </div>
          </div>
          <div className="bg-bg-base/60 p-3 rounded-lg border border-border-dim">
            <div className="text-xs text-text-secondary">Humanizer Score</div>
            <div className={`text-lg font-bold mt-0.5 ${
              audit.humanizer.score >= 90 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {audit.humanizer.score}% Human
            </div>
          </div>
          <div className="bg-bg-base/60 p-3 rounded-lg border border-border-dim">
            <div className="text-xs text-text-secondary">Banned AI Words</div>
            <div className={`text-lg font-bold mt-0.5 ${
              audit.humanizer.bannedWordCount === 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {audit.humanizer.bannedWordCount} detected
            </div>
          </div>
          <div className="bg-bg-base/60 p-3 rounded-lg border border-border-dim">
            <div className="text-xs text-text-secondary">Critical Blockers</div>
            <div className={`text-lg font-bold mt-0.5 ${
              audit.failCount === 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {audit.failCount} failed
            </div>
          </div>
        </div>
      </div>

      {/* Humanizer Diff Viewer Modal / Card if diffs occurred */}
      {activeDiffs && (
        <div className="bg-bg-raised border border-amber-500/40 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-border-dim">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-text-primary text-base">
                Anti-Slop Humanizer Diff Log {lastHumanizedAt && `(${lastHumanizedAt})`}
              </h4>
            </div>
            <button
              onClick={() => setActiveDiffs(null)}
              className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded bg-bg-subtle"
            >
              Dismiss Diffs
            </button>
          </div>

          {activeDiffs.length === 0 ? (
            <p className="text-sm text-text-secondary mt-4">
              Pristine! No banned AI vocabulary, throat clearing, or weak CTAs were found in your content.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-amber-300 font-medium">
                Cleaned {activeDiffs.length} item(s) to adhere strictly to Rule 2 (No throat clearing, authentic contractor terminology):
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {activeDiffs.map((diff, i) => (
                  <div key={i} className="bg-bg-base p-3 rounded-lg border border-border-dim text-xs font-mono space-y-1">
                    <div className="text-text-secondary font-sans font-semibold">{diff.field} ({diff.reason}):</div>
                    <div className="text-rose-400/90 line-through bg-rose-950/30 px-2 py-1 rounded">
                      - {diff.before}
                    </div>
                    <div className="text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded">
                      + {diff.after}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9 Quality Gates Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Rule Compliance Gates (Section 7)
          </h4>
          <span className="text-xs text-text-tertiary">
            {audit.passedCount} of {audit.totalCount} passed
          </span>
        </div>

        <div className="space-y-3">
          {audit.gates.map((gate) => {
            const isExpanded = expandedGateId === gate.id;
            return (
              <div
                key={gate.id}
                className={`bg-bg-raised border rounded-xl transition-all ${
                  gate.status === 'fail'
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : gate.status === 'warning'
                    ? 'border-amber-500/30 bg-amber-950/10'
                    : 'border-border-dim'
                }`}
              >
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {getStatusIcon(gate.status)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-secondary">
                          RULE {gate.ruleNumber}
                        </span>
                        <span className="text-sm font-semibold text-text-primary">
                          {gate.title}
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5 truncate">
                        {gate.summary}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {gate.status !== 'pass' && gate.autoFixAvailable && (
                      <button
                        onClick={() => handleAutoFix(gate.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Auto-Fix</span>
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedGateId(isExpanded ? null : gate.id)}
                      className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-bg-subtle"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 text-xs border-t border-border-dim/80 text-text-secondary space-y-2 mt-1">
                    <p className="leading-relaxed">{gate.details}</p>
                    {gate.remedyHint && (
                      <div className="bg-bg-base/80 p-2.5 rounded border border-border-dim text-amber-300 flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{gate.remedyHint}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
