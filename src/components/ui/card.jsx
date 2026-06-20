import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6 border-b border-slate-100 dark:border-slate-800/50", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        "text-lg font-bold leading-none tracking-tight text-slate-900 dark:text-white",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn("text-sm text-slate-500 dark:text-slate-400 font-medium", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0 border-t border-slate-100 dark:border-slate-800/50 mt-6", className)}
      {...props}
    />
  );
}
