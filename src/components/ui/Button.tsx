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
    primary: 'bg-accent text-accent-contrast hover:bg-accent/90 border border-transparent focus:ring-2 focus:ring-accent/30',
    secondary: 'bg-bg-subtle text-text-primary border border-border-default hover:border-border-strong hover:bg-bg-overlay focus:ring-2 focus:ring-border-strong/30',
    outline: 'bg-transparent text-text-primary border border-border-default hover:border-border-strong hover:bg-bg-subtle focus:ring-2 focus:ring-border-strong/30',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-subtle border border-transparent focus:ring-2 focus:ring-border-strong/20',
    danger: 'bg-negative-dim text-negative border border-negative/20 hover:bg-negative-dim/80 hover:border-negative/40 focus:ring-2 focus:ring-negative/30',
    success: 'bg-positive-dim text-positive border border-positive/20 hover:bg-positive-dim/80 hover:border-positive/40 focus:ring-2 focus:ring-positive/30'
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs gap-1.5 font-medium font-sans rounded-md',
    md: 'h-10 px-4 text-sm gap-2 font-semibold font-sans rounded-md',
    lg: 'h-11 px-5 text-sm gap-2.5 font-semibold font-sans rounded-md'
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-semibold text-center select-none cursor-pointer outline-none transition-colors duration-150
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
