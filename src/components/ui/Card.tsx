import React from 'react';

interface CardProps {
  variant?: 'default' | 'subtle' | 'raised' | 'accent' | 'error' | 'warning' | 'success';
  isHoverable?: boolean;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function Card({
  variant = 'default',
  isHoverable = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const variantClasses = {
    default: 'bg-bg-raised border border-border-dim text-text-primary',
    subtle: 'bg-bg-base border border-border-dim/50 text-text-primary',
    raised: 'bg-bg-overlay border border-border-default text-text-primary shadow-lg',
    accent: 'bg-bg-raised border border-accent/20 text-text-primary hover:border-accent/40',
    error: 'bg-negative-dim/20 border border-negative/20 text-text-primary',
    warning: 'bg-warning-dim/20 border border-warning/20 text-text-primary',
    success: 'bg-positive-dim/20 border border-positive/20 text-text-primary'
  };

  const hoverClass = isHoverable 
    ? 'hover:border-border-strong hover:bg-bg-subtle transition-all duration-200 cursor-pointer active:scale-[0.99]'
    : 'transition-all duration-200';

  return (
    <div
      className={`
        rounded-md p-5 md:p-6 select-none overflow-hidden
        ${variantClasses[variant]}
        ${hoverClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
  ...props
}: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`} {...props}>
      <div className="space-y-1">
        <h3 className="font-sans font-medium text-sm md:text-base text-text-primary tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="font-mono text-[10px] text-text-secondary uppercase tracking-wider">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`text-sm text-text-secondary leading-relaxed ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={`flex items-center justify-between border-t border-border-dim pt-4 mt-4 text-xs text-text-secondary ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}
