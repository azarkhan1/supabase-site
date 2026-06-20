import React from 'react';
import { cn } from '../../lib/utils';

export function Badge({
  className,
  variant = 'default',
  ...props
}) {
  const variants = {
    default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    danger: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    info: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold select-none leading-5",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
