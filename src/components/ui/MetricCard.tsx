import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: number | string;
    isPositive: boolean;
  };
  sparkData?: { v: number }[];
  className?: string;
  onClick?: () => void;
  pulse?: boolean;
}

export function MetricCard({
  label,
  value,
  subtext,
  trend,
  sparkData,
  className = '',
  onClick,
  pulse = false,
}: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-bg-raised border border-border-dim rounded-md p-5 md:p-6 transition-all duration-200 select-none ${
        onClick ? 'cursor-pointer hover:border-border-strong hover:bg-bg-subtle hover:shadow-md' : ''
      } ${pulse ? 'border-red-500/50 bg-red-500/[0.02] animate-pulse' : ''} ${className}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="metric-label font-sans tracking-widest text-[10px] text-text-secondary">{label}</span>
        {trend && (
          <span className={`text-[11px] font-mono font-medium ${trend.isPositive ? 'text-positive' : 'text-negative'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <span className="metric-value font-mono text-3xl font-light tracking-tight text-text-primary">
          {value}
        </span>
        
        {sparkData && sparkData.length > 0 && (
          <div className="w-[80px] h-[32px] overflow-hidden opacity-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--color-accent)"
                  strokeWidth={1.5}
                  fill="var(--color-accent-dim)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {subtext && (
        <div className="text-[11px] font-sans text-text-secondary/80 mt-2 flex items-center gap-1.5">
          {pulse && <span className="w-1.5 h-1.5 rounded-full bg-negative" />}
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
}
