import React from 'react';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function MissionTitle({ children, className = '', ...props }: TypographyProps) {
  return (
    <h1
      className={`font-sans font-light text-2xl md:text-3xl tracking-tight text-text-primary ${className}`}
      {...props}
    >
      {children}
    </h1>
  );
}

export function SectionTitle({ children, className = '', ...props }: TypographyProps) {
  return (
    <h2
      className={`font-sans font-medium text-sm md:text-base text-text-primary tracking-tight uppercase ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
}

export function CardTitle({ children, className = '', ...props }: TypographyProps) {
  return (
    <h3
      className={`font-sans font-medium text-xs md:text-sm text-text-primary tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function MetadataText({ children, className = '', ...props }: TypographyProps) {
  return (
    <span
      className={`font-mono text-[9px] md:text-[10px] text-text-secondary tracking-widest uppercase block ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export function ProseText({ children, className = '', ...props }: TypographyProps) {
  return (
    <p
      className={`font-sans text-[11px] md:text-xs text-text-secondary leading-relaxed ${className}`}
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
