import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav className={`flex items-center gap-2 select-none py-1 md:py-2 overflow-x-auto whitespace-nowrap scrollbar-none ${className}`}>
      {/* Root logo icon element */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Home className="w-3.5 h-3.5 text-[#64748b] hover:text-accent cursor-pointer transition-colors" />
        <span className="font-mono text-[10px] text-text-secondary">HAL</span>
      </div>

      {items.length > 0 && <ChevronRight className="w-3 h-3 text-text-tertiary shrink-0" />}

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3 h-3 text-text-tertiary shrink-0" />}
            
            {item.onClick && !isLast ? (
              <span
                onClick={item.onClick}
                className="text-[10px] md:text-[11px] font-mono tracking-wider text-[#8a8a8a] hover:text-accent cursor-pointer transition-colors uppercase font-semibold"
              >
                {item.label}
              </span>
            ) : (
              <span
                className={`text-[10px] md:text-[11px] font-mono tracking-wider uppercase font-semibold ${
                  isLast ? 'text-accent font-bold' : 'text-[#8a8a8a]'
                }`}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
