import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export function Dialog({ open, onOpenChange, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-x-hidden overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onClick={() => onOpenChange(false)}
      />
      
      {/* Content wrapper */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-10 transition-all max-h-[90vh] flex flex-col">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ className, children, onOpenChange, ...props }) {
  return (
    <div className={cn("p-6 overflow-y-auto flex-1", className)} {...props}>
      {children}
    </div>
  );
}

export function DialogHeader({ className, children, onOpenChange, ...props }) {
  return (
    <div className={cn("flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800/50", className)} {...props}>
      <div className="flex flex-col space-y-1.5 text-right">
        {children}
      </div>
      {onOpenChange && (
        <button
          onClick={() => onOpenChange(false)}
          className="rounded-md p-1.5 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">بستن</span>
        </button>
      )}
    </div>
  );
}

export function DialogTitle({ className, ...props }) {
  return (
    <h2
      className={cn(
        "text-lg font-bold leading-none text-slate-900 dark:text-white",
        className
      )}
      {...props}
    />
  );
}

export function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 sm:space-x-reverse p-6 pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto",
        className
      )}
      {...props}
    />
  );
}
