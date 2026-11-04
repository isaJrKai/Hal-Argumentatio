import React from 'react';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function MissionTitle({ children, className = '', ...props }: TypographyProps) {
  return (
    <h1
      className={`font-display font-semibold text-3xl md:text-4xl tracking-tight text-text-primary ${className}`}
      {...props}
    >
      {children}
    </h1>
  );
}

export function SectionTitle({ children, className = '', ...props }: TypographyProps) {
  return (
    <h2
      className={`font-sans font-semibold text-base md:text-lg text-text-primary tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
}

export function CardTitle({ children, className = '', ...props }: TypographyProps) {
  return (
    <h3
      className={`font-sans font-semibold text-sm md:text-base text-text-primary tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function MetadataText({ children, className = '', ...props }: TypographyProps) {
  return (
    <span
      className={`font-sans text-xs text-text-secondary tracking-normal block ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export function ProseText({ children, className = '', ...props }: TypographyProps) {
  return (
    <p
      className={`font-sans text-sm text-text-secondary leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export function MonoValue({ children, className = '', ...props }: TypographyProps) {
  return (
    <span
      className={`font-mono text-xs md:text-sm text-text-primary tracking-tight ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
