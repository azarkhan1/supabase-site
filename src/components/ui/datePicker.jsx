import React from 'react';
import { cn, getTodayJalali } from '../../lib/utils';
import { Calendar } from 'lucide-react';

export const DatePicker = React.forwardRef(({
  className,
  label,
  error,
  onChange,
  value,
  ...props
}, ref) => {
  const handleTodayClick = () => {
    if (onChange) {
      onChange(getTodayJalali());
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        {label && (
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={handleTodayClick}
          className="text-xs text-[#1e40af] dark:text-blue-400 hover:underline font-semibold"
        >
          انتخاب امروز
        </button>
      </div>
      <div className="relative rounded-lg shadow-sm">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <Calendar className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="۱۴۰۴/۱۰/۰۵"
          value={value}
          onChange={(e) => {
            if (onChange) {
              onChange(e.target.value);
            }
          }}
          className={cn(
            "block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pr-10 pl-3 py-2 text-sm placeholder-slate-400 focus:border-[#1e40af] focus:outline-none focus:ring-1 focus:ring-[#1e40af] dark:focus:border-[#1e40af] dark:focus:ring-[#1e40af] disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500",
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

DatePicker.displayName = 'DatePicker';
