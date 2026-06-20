import React from 'react';
import { cn } from '../../lib/utils';

export const Select = React.forwardRef(({
  className,
  label,
  error,
  options = [],
  placeholder = 'انتخاب کنید...',
  children,
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
        <select
          className={cn(
            "block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-[#1e40af] focus:outline-none focus:ring-1 focus:ring-[#1e40af] dark:focus:border-[#1e40af] dark:focus:ring-[#1e40af] disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-all",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-500 dark:focus:border-rose-500 dark:focus:ring-rose-500",
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children ? children : options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium font-sans">
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
