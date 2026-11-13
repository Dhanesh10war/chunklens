import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (options: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = options.duration ?? 3000;
      const newToast: ToastItem = { ...options, id };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, description?: string) => {
    addToast({ title, description, type: 'success' });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    addToast({ title, description, type: 'error' });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    addToast({ title, description, type: 'info' });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3 rounded-md bg-elevated border border-border-default shadow-elevated text-xs transition-all animate-in fade-in slide-in-from-bottom-2 duration-150'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="h-4 w-4 text-status-success" />}
              {t.type === 'error' && <AlertCircle className="h-4 w-4 text-status-error" />}
              {(!t.type || t.type === 'info') && <Info className="h-4 w-4 text-text-tertiary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-primary">{t.title}</p>
              {t.description && <p className="text-xs text-text-secondary mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-text-tertiary hover:text-text-primary p-0.5 rounded transition-colors focus-ring"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
