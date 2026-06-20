import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendType = 'neutral', // 'up' | 'down' | 'neutral'
  className,
  color = 'blue' // 'blue' | 'emerald' | 'rose' | 'amber'
}) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-950/20 text-[#1e40af] dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/20 text-[#166534] dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
    rose: 'bg-rose-50 dark:bg-rose-950/20 text-[#991b1b] dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
    amber: 'bg-amber-50 dark:bg-amber-950/20 text-[#854d0e] dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
  };

  const textColors = {
    blue: 'text-[#1e40af]',
    emerald: 'text-[#166534]',
    rose: 'text-[#991b1b]',
    amber: 'text-[#854d0e]'
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 text-right">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
              {value}
            </p>
          </div>
          <div className={cn("p-3 rounded-xl border", colors[color])}>
            {Icon && <Icon className="h-6 w-6" />}
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center space-x-1.5 space-x-reverse text-xs font-semibold">
            <span className={cn(
              trendType === 'up' && "text-[#166534] dark:text-emerald-400",
              trendType === 'down' && "text-[#991b1b] dark:text-rose-400",
              trendType === 'neutral' && "text-slate-500"
            )}>
              {trend}
            </span>
            <span className="text-slate-400">نسبت به ماه گذشته</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
