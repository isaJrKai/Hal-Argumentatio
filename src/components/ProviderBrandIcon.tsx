import React, { useState } from 'react';

type ProviderBrand = 'googlegemini' | 'openai' | 'anthropic' | 'nvidia' | 'stripe' | 'twilio' | 'sendgrid' | 'googlemaps' | 'meta' | 'googleanalytics' | 'slack';

const BRAND_PATH: Record<ProviderBrand, string> = {
  googlegemini: 'https://cdn.simpleicons.org/googlegemini',
  openai: 'https://cdn.simpleicons.org/openai',
  anthropic: 'https://cdn.simpleicons.org/anthropic',
  nvidia: 'https://cdn.simpleicons.org/nvidia',
  stripe: 'https://cdn.simpleicons.org/stripe',
  twilio: 'https://cdn.simpleicons.org/twilio',
  sendgrid: 'https://cdn.simpleicons.org/sendgrid',
  googlemaps: 'https://cdn.simpleicons.org/googlemaps',
  meta: 'https://cdn.simpleicons.org/meta',
  googleanalytics: 'https://cdn.simpleicons.org/googleanalytics',
  slack: 'https://cdn.simpleicons.org/slack'
};

interface ProviderBrandIconProps {
  brand: ProviderBrand;
  label: string;
  className?: string;
}

export function ProviderBrandIcon({ brand, label, className = '' }: ProviderBrandIconProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span aria-hidden="true" className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-border-dim bg-bg-subtle text-[10px] font-semibold text-text-secondary ${className}`}>{label.slice(0, 2).toUpperCase()}</span>;
  }

  return (
    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-border-dim bg-white p-1.5 ${className}`}>
      <img
        src={BRAND_PATH[brand]}
        alt={`${label} logo`}
        className="h-full w-full object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
