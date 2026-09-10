import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info, Sparkles } from 'lucide-react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger' | 'ai';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;          // What changed?
  description: string;    // Why does it matter?
  whatNext?: string;      // What should I do?
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

export interface ShowToastOptions {
  title?: string;
  message?: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'danger' | 'error' | 'ai';
  variant?: ToastVariant;
  whatNext?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, 'id'>) => void;
  showToast: (options: ShowToastOptions | string) => void;
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { ...options, id };
    
    setToasts((prev) => [...prev, newToast]);

    if (options.duration !== 0) {
      const delay = options.duration || 6000; // 6s default due to higher information content
      setTimeout(() => {
        removeToast(id);
      }, delay);
    }
  }, [removeToast]);

  const showToast = useCallback((options: ShowToastOptions | string) => {
    if (typeof options === 'string') {
      toast({
        variant: 'info',
        title: options,
        description: ''
      });
      return;
    }

    const variant: ToastVariant =
      options.variant ||
      (options.type === 'error' ? 'danger' : options.type as ToastVariant) ||
      'info';

    toast({
      variant,
      title: options.title || '',
      description: options.description || options.message || '',
      whatNext: options.whatNext,
      actionLabel: options.actionLabel,
      onAction: options.onAction,
      duration: options.duration
    });
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, showToast, toasts, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm md:max-w-md px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onClose={() => removeToast(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void; key?: string }) {
  const icons = {
    info: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-positive shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-warning shrink-0" />,
    danger: <AlertCircle className="w-4 h-4 text-negative shrink-0" />,
    ai: <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
  };

  const borders = {
    info: 'border-sky-500/20 bg-[#0c121c]/95 hover:border-sky-500/30',
    success: 'border-positive/20 bg-[#0c1712]/95 hover:border-positive/30',
    warning: 'border-warning/20 bg-[#17140c]/95 hover:border-warning/30',
    danger: 'border-negative/20 bg-[#170c0c]/95 hover:border-negative/30',
    ai: 'border-indigo-500/20 bg-[#110c1c]/95 hover:border-indigo-500/30'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
      className={`
        pointer-events-auto w-full border rounded-md p-4 shadow-xl flex items-start gap-3 select-none backdrop-blur-md transition-all duration-150
        ${borders[item.variant]}
      `}
    >
      {/* Visual icon representation */}
      <div className="mt-0.5">{icons[item.variant]}</div>

      {/* Contextual description */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="space-y-1">
          <h4 className="font-sans font-medium text-xs text-text-primary tracking-tight">
            {item.title}
          </h4>
          {item.description ? (
            <p className="font-sans text-[11px] text-text-secondary leading-normal">
              {item.description}
            </p>
          ) : null}
        </div>

        {/* Action item info */}
        {item.whatNext && (
          <div className="text-[10px] font-sans text-text-secondary border-t border-border-dim/50 pt-1.5 mt-1">
            <span className="font-semibold text-text-primary uppercase tracking-wide text-[9px] block mb-0.5">Recommended Next Action:</span>
            <span>{item.whatNext}</span>
          </div>
        )}

        {/* Action Button */}
        {item.actionLabel && item.onAction && (
          <div className="pt-1">
            <button
              onClick={() => {
                item.onAction?.();
                onClose();
              }}
              className="text-[9px] font-mono uppercase font-bold text-accent hover:underline tracking-wider"
            >
              {item.actionLabel}
            </button>
          </div>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={onClose}
        className="w-5 h-5 inline-flex items-center justify-center rounded-sm text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
