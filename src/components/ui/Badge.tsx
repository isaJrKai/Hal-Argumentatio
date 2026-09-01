import React from 'react';

export interface BadgeProps {
  variant?: 'new' | 'active' | 'warning' | 'danger' | 'neutral' | 'info' | 'ai';
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

export function Badge({
  variant = 'neutral',
  size = 'sm',
  className = '',
  children
}: BadgeProps) {
  const variantClasses = {
    neutral: 'bg-bg-subtle text-text-secondary border border-border-dim',
    new: 'bg-accent-dim text-accent border border-accent/20',
    active: 'bg-positive-dim text-positive border border-positive/20',
    warning: 'bg-warning-dim text-warning border border-warning/20',
    danger: 'bg-negative-dim text-negative border border-negative/20',
    info: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    ai: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
  };

  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5 tracking-wider font-semibold font-mono uppercase rounded-xs',
    md: 'text-[11px] px-2 py-1 tracking-wider font-semibold font-mono uppercase rounded-xs'
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 border select-none transition-colors duration-100
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {variant === 'active' && <span className="w-1 h-1 rounded-full bg-positive" />}
      {variant === 'danger' && <span className="w-1 h-1 rounded-full bg-negative" />}
      {variant === 'warning' && <span className="w-1 h-1 rounded-full bg-warning" />}
      {variant === 'ai' && <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />}
      
      <span>{children}</span>
    </span>
  );
}
