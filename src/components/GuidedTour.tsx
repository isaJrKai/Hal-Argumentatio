import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface GuidedTourProps {
  isOpen: boolean;
  showWelcome: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onStart: () => void;
  onDismiss: () => void;
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    target: 'tab-overview',
    tab: 'overview',
    title: 'Your business at a glance',
    description: 'The Overview brings your key business activity together. See your current opportunities, revenue signals and recommended next actions without jumping between modules.',
  },
  {
    target: 'tab-leads',
    tab: 'leads',
    title: 'Find and qualify prospects',
    description: 'Use Prospects to review businesses, understand their needs and keep your pipeline grounded in real lead information.',
  },
  {
    target: 'tab-map',
    tab: 'map',
    title: 'Work your territory',
    description: 'The map gives you a geographic view of prospects and territory activity so you can plan where to focus your outreach.',
  },
  {
    target: 'tab-board',
    tab: 'board',
    title: 'Move opportunities towards a sale',
    description: 'The Sales Pipeline helps you track follow-ups, manage deal stages and understand what needs attention to move an opportunity forward.',
  },
  {
    target: 'tab-revenue-intelligence',
    tab: 'revenue-intelligence',
    title: 'Understand your finances',
    description: 'Financials brings revenue and business performance information into view so you can make more informed operating decisions.',
  },
  {
    target: 'tab-campaigns',
    tab: 'campaigns',
    title: 'Coordinate outreach',
    description: 'Use Outreach & Messages to organise campaigns and customer communication from the same workspace.',
  },
];

export default function GuidedTour({
  isOpen,
  showWelcome,
  activeTab,
  setActiveTab,
  onStart,
  onDismiss,
  onClose,
}: GuidedTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = TOUR_STEPS[stepIndex];

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      setTargetRect(null);
      return;
    }

    setActiveTab(step.tab);
    let frame = 0;
    const locateTarget = () => {
      const target = document.querySelector<HTMLElement>('[data-tour="' + step.target + '"]');
      if (!target) {
        setTargetRect(null);
        return;
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect.width > 0 && rect.height > 0 ? rect : null);
      });
    };

    locateTarget();
    const handleViewportChange = () => locateTarget();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, step, setActiveTab]);

  useEffect(() => {
    if (!isOpen) setStepIndex(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setStepIndex((current) => Math.min(current + 1, TOUR_STEPS.length - 1));
      if (event.key === 'ArrowLeft') setStepIndex((current) => Math.max(current - 1, 0));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (typeof document === 'undefined' || (!isOpen && !showWelcome)) return null;

  const goNext = () => {
    if (stepIndex === TOUR_STEPS.length - 1) {
      onClose();
      return;
    }
    setStepIndex((current) => Math.min(current + 1, TOUR_STEPS.length - 1));
  };

  const tooltipStyle: React.CSSProperties = targetRect
    ? {
        left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 376)),
        top: targetRect.bottom + 14 + 236 < window.innerHeight
          ? targetRect.bottom + 14
          : Math.max(16, targetRect.top - 250),
      }
    : {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      };

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: 10000 }}>
      <div className="absolute inset-0 bg-slate-950/65" />
      {showWelcome && !isOpen ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="hal-tour-welcome-title"
            className="w-full max-w-md rounded-2xl border border-border-default bg-bg-raised p-6 shadow-2xl text-text-primary"
          >
            <div className="flex items-center gap-3 mb-4">
              <img src="/hal-mark.svg" alt="" className="w-9 h-9 rounded-lg border border-border-dim" />
              <span className="text-xs font-semibold tracking-widest uppercase text-text-secondary">HALBiz product tour</span>
            </div>
            <h2 id="hal-tour-welcome-title" className="text-xl font-semibold tracking-tight">A quick tour of your workspace</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Take a short guided walkthrough of the main tools in HAL. We will highlight the real controls and explain how each part supports your day-to-day work.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button type="button" onClick={onDismiss} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-subtle">
                Not now
              </button>
              <button type="button" onClick={onStart} className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90">
                Start tour
              </button>
            </div>
          </section>
        </div>
      ) : isOpen ? (
        <>
          {targetRect && (
            <div
              aria-hidden="true"
              className="fixed rounded-lg border-2 border-accent"
              style={{
                left: targetRect.left - 4,
                top: targetRect.top - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                boxShadow: '0 0 0 9999px rgba(8, 13, 22, 0.66)',
                pointerEvents: 'none',
                zIndex: 10001,
              }}
            />
          )}
          <section
            role="dialog"
            aria-modal="true"
            aria-live="polite"
            aria-labelledby="hal-tour-step-title"
            className="fixed w-[min(360px,calc(100vw-32px))] rounded-xl border border-border-default bg-bg-raised p-5 shadow-2xl text-text-primary"
            style={{ ...tooltipStyle, zIndex: 10002 }}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-text-tertiary">
                Workspace tour · {stepIndex + 1} of {TOUR_STEPS.length}
              </span>
              <button type="button" onClick={onClose} aria-label="Close guided tour" className="text-text-tertiary hover:text-text-primary text-lg leading-none">×</button>
            </div>
            <div className="flex gap-1 mb-4" aria-hidden="true">
              {TOUR_STEPS.map((item, index) => (
                <span key={item.target} className="h-1 flex-1 rounded-full" style={{ background: index <= stepIndex ? 'var(--accent)' : 'var(--border-dim)' }} />
              ))}
            </div>
            <h2 id="hal-tour-step-title" className="text-base font-semibold tracking-tight">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{step.description}</p>
            <div className="mt-5 flex items-center justify-between gap-2">
              <button type="button" onClick={onClose} className="text-xs text-text-tertiary hover:text-text-primary">Skip tour</button>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setStepIndex((current) => Math.max(0, current - 1))} disabled={stepIndex === 0} className="px-3 py-2 rounded-lg border border-border-default text-xs text-text-secondary disabled:opacity-40">
                  Back
                </button>
                <button type="button" onClick={goNext} className="px-3 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:opacity-90">
                  {stepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>,
    document.body,
  );
}
