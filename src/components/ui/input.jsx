import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({
  className,
  type = 'text',
  label,
  error,
  icon,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm placeholder-slate-400 focus:border-[#1e40af] focus:outline-none focus:ring-1 focus:ring-[#1e40af] dark:focus:border-[#1e40af] dark:focus:ring-[#1e40af] disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            icon && "pr-10",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-500 dark:focus:border-rose-500 dark:focus:ring-rose-500",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
