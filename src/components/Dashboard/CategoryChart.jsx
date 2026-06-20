import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toPersianNumbers, formatNumber } from '../../lib/utils';

export default function CategoryChart({ data, currency = 'AFN' }) {
  const COLORS = ['#e11d48', '#0284c7', '#d97706', '#7c3aed', '#16a34a', '#db2777', '#ea580c', '#4b5563', '#1e40af', '#854d0e'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg shadow-md text-right text-xs font-semibold">
          <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">{entry.name}</p>
          <p className="font-sans text-[#991b1b] dark:text-rose-400">
            مبلغ: {toPersianNumbers(formatNumber(entry.value))} {currency === 'USD' ? 'دلار' : 'افغانی'}
          </p>
          {entry.payload.percent !== undefined && (
            <p className="text-slate-500 font-sans mt-0.5">
              سهم: {toPersianNumbers((entry.payload.percent * 100).toFixed(1))}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const totalExpense = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>هزینه‌ها بر اساس دسته‌بندی</CardTitle>
        <CardDescription>توزیع مخارج در ماه جاری</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        {totalExpense === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-500 font-semibold">
            داده‌ای برای هزینه‌های این ماه ثبت نشده است
          </div>
        ) : (
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingRight: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-none">مجموع هزینه‌ها</p>
              <p className="text-sm font-black text-slate-800 dark:text-white font-sans mt-1.5 leading-none">
                {toPersianNumbers(formatNumber(totalExpense))}
              </p>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 leading-none">
                {currency === 'USD' ? 'USD' : 'AFN'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
