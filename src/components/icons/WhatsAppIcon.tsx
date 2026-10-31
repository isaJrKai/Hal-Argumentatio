import React from 'react';

/**
 * Authentic, full-color official WhatsApp icon.
 * Features the signature WhatsApp emerald (#25D366) circle and white telephone handset.
 */
export const WhatsAppIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className = 'w-5 h-5', ...props }) => (
  <svg 
    viewBox="0 0 48 48" 
    className={className}
    aria-label="WhatsApp" 
    role="img" 
    {...props}
  >
    {/* WhatsApp Green Circular Background */}
    <circle cx="24" cy="24" r="22" fill="#25D366" />
    {/* Chat bubble tail and telephone handset in crisp white */}
    <path
      fill="#FFFFFF"
      d="M34.8 28.6c-.5-.3-2.9-1.4-3.3-1.6-.4-.2-.8-.3-1.1.3-.3.5-1.3 1.6-1.6 1.9-.3.3-.6.4-1.1.1-.5-.3-2.1-.8-4-2.5-1.5-1.3-2.5-3-2.8-3.5-.3-.5 0-.8.2-1 .2-.2.5-.6.7-.9.2-.3.3-.5.5-.8.2-.3.1-.6 0-.8-.1-.3-1.1-2.7-1.5-3.7-.4-1-.8-.8-1.1-.8h-1c-.3 0-.9.1-1.3.6-.5.5-1.7 1.7-1.7 4.1 0 2.4 1.8 4.8 2 5.1.3.3 3.5 5.3 8.4 7.5 1.2.5 2.1.8 2.8 1 1.2.4 2.3.3 3.1.2 1-.1 2.9-1.2 3.3-2.3.4-1.2.4-2.1.3-2.3-.1-.2-.4-.3-.9-.6zm-10.8 7.3c-2.3 0-4.6-.6-6.6-1.8l-.5-.3-4.9 1.3 1.3-4.8-.3-.5c-1.3-2.1-2-4.5-2-7 0-7.4 6-13.4 13.4-13.4 3.6 0 6.9 1.4 9.5 3.9 2.5 2.5 3.9 5.9 3.9 9.5 0 7.4-6.1 13.1-13.8 13.1z"
    />
  </svg>
);
