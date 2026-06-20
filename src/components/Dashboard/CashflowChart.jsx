import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { toPersianNumbers, formatNumber } from '../../lib/utils';

export default function CashflowChart({ data, currency = 'AFN' }) {
  // Format numbers for Y-axis and Tooltip
  const formatYAxis = (tick) => {
    return toPersianNumbers(formatNumber(tick));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-md text-right text-xs font-semibold">
          <p className="font-bold mb-1.5 text-slate-800 dark:text-slate-100">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-sans">
              {entry.name}: {toPersianNumbers(formatNumber(entry.value))} {currency === 'USD' ? 'دلار' : 'افغانی'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>مقایسه درآمد و هزینه</CardTitle>
        <CardDescription>روند ۱۲ ماه گذشته (به تفکیک درآمد و هزینه)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={formatYAxis} 
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
              />
              <Bar 
                name="درآمد" 
                dataKey="income" 
                fill="#1e40af" 
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                name="هزینه" 
                dataKey="expense" 
                fill="#991b1b" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
