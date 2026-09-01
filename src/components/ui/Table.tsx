import React from 'react';
import { HelpCircle } from 'lucide-react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function Table({ children, className = '', ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-md border border-border-dim bg-bg-raised custom-scrollbar select-none">
      <table className={`w-full border-collapse text-left text-xs ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }: any) {
  return (
    <thead className={`bg-bg-base/50 border-b border-border-dim sticky top-0 z-10 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }: any) {
  return (
    <tbody className={`divide-y divide-border-dim/50 bg-bg-raised ${className}`} {...props}>
      {children}
    </tbody>
  );
}

interface TableRowProps {
  children: React.ReactNode;
  isSelectable?: boolean;
  className?: string;
  [key: string]: any;
}

export function TableRow({ children, isSelectable = false, className = '', ...props }: TableRowProps) {
  return (
    <tr
      className={`
        transition-colors duration-100 hover:bg-bg-subtle/40
        ${isSelectable ? 'cursor-pointer active:bg-bg-subtle/80' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps {
  children: React.ReactNode;
  isSorted?: boolean;
  sortDirection?: 'asc' | 'desc';
  className?: string;
  [key: string]: any;
}

export function TableHead({ children, isSorted, sortDirection, className = '', ...props }: TableHeadProps) {
  return (
    <th
      className={`
        h-10 px-4 font-semibold font-mono text-[10px] text-text-secondary uppercase tracking-wider select-none align-middle
        ${className}
      `}
      {...props}
    >
      <div className="flex items-center gap-1.5">
        <span>{children}</span>
        {isSorted && (
          <span className="text-accent font-bold font-mono text-[8px]">
            {sortDirection === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </div>
    </th>
  );
}

export function TableCell({ children, className = '', ...props }: any) {
  return (
    <td
      className={`
        p-4 align-middle font-sans text-text-primary text-[11px] md:text-xs leading-normal
        ${className}
      `}
      {...props}
    >
      {children}
    </td>
  );
}

interface TableEmptyProps {
  colSpan: number;
  title?: string;
  description: string;
  action?: React.ReactNode;
}

export function TableEmptyState({
  colSpan,
  title = 'No records discovered',
  description,
  action
}: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 px-4 text-center">
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3.5">
          <div className="w-8 h-8 rounded-full bg-border-dim flex items-center justify-center text-text-secondary">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="font-sans font-medium text-xs text-text-primary uppercase tracking-wider">
              {title}
            </h4>
            <p className="font-sans text-[11px] text-text-secondary leading-normal">
              {description}
            </p>
          </div>
          {action && <div className="pt-2">{action}</div>}
        </div>
      </td>
    </tr>
  );
}
