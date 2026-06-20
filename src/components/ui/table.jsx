import React from 'react';
import { cn } from '../../lib/utils';

export function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table
        className={cn("w-full text-right text-sm border-collapse", className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }) {
  return (
    <thead
      className={cn("bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800", className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }) {
  return (
    <tbody
      className={cn("divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/50", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-right align-middle font-semibold text-slate-700 dark:text-slate-300 [&:has([role=checkbox])]:pr-3",
        className
      )}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors [&:has([role=checkbox])]:pr-3",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }) {
  return (
    <td
      className={cn(
        "p-4 align-middle text-slate-600 dark:text-slate-300 [&:has([role=checkbox])]:pr-3",
        className
      )}
      {...props}
    />
  );
}
