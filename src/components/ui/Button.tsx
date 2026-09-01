import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps {
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: any;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  // Variant classes
  const variantClasses = {
    primary: 'bg-accent text-accent-contrast hover:bg-accent/85 active:scale-[0.98] border border-transparent shadow-xs focus:ring-2 focus:ring-accent/40',
    secondary: 'bg-bg-subtle text-text-primary border border-border-default hover:border-border-strong hover:bg-bg-overlay active:scale-[0.98] focus:ring-2 focus:ring-border-strong/40',
    outline: 'bg-transparent text-text-primary border border-border-default hover:border-border-strong hover:bg-bg-subtle active:scale-[0.98] focus:ring-2 focus:ring-border-strong/40',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-subtle active:scale-[0.98] border border-transparent focus:ring-2 focus:ring-border-strong/20',
    danger: 'bg-negative-dim text-negative border border-negative/20 hover:bg-negative-dim/80 hover:border-negative/40 active:scale-[0.98] focus:ring-2 focus:ring-negative/30',
    success: 'bg-positive-dim text-positive border border-positive/20 hover:bg-positive-dim/80 hover:border-positive/40 active:scale-[0.98] focus:ring-2 focus:ring-positive/30'
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-8 px-3 text-[10px] gap-1.5 font-semibold font-mono tracking-wider uppercase rounded-sm',
    md: 'h-9 px-4 text-[11px] gap-2 font-semibold font-mono tracking-wider uppercase rounded-sm',
    lg: 'h-11 px-6 text-[12px] gap-2.5 font-bold font-mono tracking-wider uppercase rounded-sm'
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-semibold text-center select-none cursor-pointer outline-none transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:transform-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      id={props.id}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-inherit shrink-0" />
      ) : leftIcon ? (
        <span className="inline-flex shrink-0 text-inherit">{leftIcon}</span>
      ) : null}
      
      <span className="truncate">{children}</span>

      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0 text-inherit">{rightIcon}</span>
      )}
    </button>
  );
}
