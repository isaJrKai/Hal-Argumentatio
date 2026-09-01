import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  whyEmpty: string;
  whatNext: string;
  expectedOutcome: string;
  actionLabel?: string;
  onActionClick?: () => void;
  className?: string;
}

export function EmptyState({
  icon = <HelpCircle className="w-5 h-5 text-text-secondary" />,
  title,
  whyEmpty,
  whatNext,
  expectedOutcome,
  actionLabel,
  onActionClick,
  className = ''
}: EmptyStateProps) {
  return (
    <div 
      className={`
        border border-dashed border-border-default bg-bg-raised/40 rounded-md p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4 select-none
        ${className}
      `}
    >
      {/* Icon Holder */}
      <div className="w-10 h-10 rounded-full bg-bg-subtle border border-border-dim flex items-center justify-center shrink-0">
        {icon}
      </div>

      {/* Structured Text Content */}
      <div className="space-y-3">
        <h3 className="font-sans font-medium text-xs md:text-sm text-text-primary uppercase tracking-wider">
          {title}
        </h3>
        
        <div className="space-y-2 text-[11px] md:text-xs text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">Status:</strong> {whyEmpty}
          </p>
          <p>
            <strong className="text-text-primary">Action Required:</strong> {whatNext}
          </p>
          <p className="opacity-80">
            <strong className="text-text-primary">Outcome:</strong> {expectedOutcome}
          </p>
        </div>
      </div>

      {/* Optional action */}
      {actionLabel && onActionClick && (
        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={onActionClick}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
