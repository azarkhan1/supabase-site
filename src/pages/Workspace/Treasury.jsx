import React, { useEffect, useState, useContext } from 'react';
import { db } from '../../services/db';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { formatCurrency, formatNumber, toPersianNumbers } from '../../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Coins, TrendingUp, TrendingDown, Landmark, 
  ArrowUpRight, ArrowDownLeft, Scale 
} from 'lucide-react';

export default function Treasury() {
  const { activeWorkspace } = useContext(WorkspaceContext);
  
  const [totals, setTotals] = useState({
    totalAfn: 0,
    totalUsd: 0,
    inflowAfn: 0,
    inflowUsd: 0,
    outflowAfn: 0,
    outflowUsd: 0
  });

  const [trendData, setTrendData] = useState([]);
  const [accountBalances, setAccountBalances] = useState([]);

  useEffect(() => {
    if (!activeWorkspace) return;

    const allAccounts = db.getAll('accounts');
    const allTransactions = db.getAll('transactions');

    // 1. Calculate Individual Account Balances & Aggregates
    let totAfn = 0;
    let totUsd = 0;
    let inAfn = 0;
    let inUsd = 0;
    let outAfn = 0;
    let outUsd = 0;

    const accList = allAccounts.map(acc => {
      const txs = allTransactions.filter(t => t.accountId === acc.id && t.status === 'approved');
      
      const inflows = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const outflows = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const currentBalance = acc.initialBalance + inflows - outflows;

      // Add to global aggregates
      if (acc.currency === 'AFN') {
        totAfn += currentBalance;
        inAfn += inflows;
        outAfn += outflows;
      } else {
        totUsd += currentBalance;
        inUsd += inflows;
        outUsd += outflows;
      }

      return {
        ...acc,
        inflows,
        outflows,
        currentBalance
      };
    });

    setAccountBalances(accList);
    setTotals({
      totalAfn: totAfn,
      totalUsd: totUsd,
      inflowAfn: inAfn,
      inflowUsd: inUsd,
      outflowAfn: outAfn,
      outflowUsd: outUsd
    });

    // 2. Build 6-month historical trend data
    const months = ['۰۵', '۰۶', '۰۷', '۰۸', '۰۹', '۱۰'];
    const monthNames = ['مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی'];
    const trend = months.map((m, idx) => {
      // Filter transactions for that specific month
      const monthTxs = allTransactions.filter(t => {
        const parts = t.date.split('/');
        return parts[0] === '1404' && parts[1] === m && t.status === 'approved';
      });

      const inc = monthTxs
        .filter(t => t.type === 'income' && t.currency === 'AFN')
        .reduce((sum, t) => sum + t.amount, 0);

      const exp = monthTxs
        .filter(t => t.type === 'expense' && t.currency === 'AFN')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        name: monthNames[idx],
        'دریافتی (AFN)': inc,
        'پرداختی (AFN)': exp
      };
    });
    setTrendData(trend);

  }, [activeWorkspace]);

  // Recharts number formatting
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
              {entry.name}: {toPersianNumbers(formatNumber(entry.value))} افغانی
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 text-right">
      
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">خزانه‌داری و نقدینگی کل</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">پایش نقدینگی فعال، تفکیک ورودی/خروجی ارزهای مختلف و تراز کل خزانه</p>
      </div>

      {/* Main Multi-Currency Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-[#1e40af] bg-blue-50/10">
          <CardContent className="p-6 text-center space-y-2">
            <div className="mx-auto bg-blue-100 dark:bg-blue-905 p-3 rounded-full w-12 h-12 flex items-center justify-center text-[#1e40af]">
              <Coins className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-500">نقدینگی کل (افغانی - AFN)</p>
            <p className="text-2xl font-black font-sans text-slate-900 dark:text-white">
              {formatCurrency(totals.totalAfn, 'AFN')}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#854d0e] bg-amber-50/10">
          <CardContent className="p-6 text-center space-y-2">
            <div className="mx-auto bg-amber-100 dark:bg-amber-905 p-3 rounded-full w-12 h-12 flex items-center justify-center text-[#854d0e]">
              <Scale className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-500">نقدینگی کل (دلار - USD)</p>
            <p className="text-2xl font-black font-sans text-slate-900 dark:text-white">
              {formatCurrency(totals.totalUsd, 'USD')}
            </p>
          </CardContent>
        </Card>

        {/* Aggregate statistics */}
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardContent className="p-6 flex flex-col justify-center space-y-3 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="flex items-center gap-1.5"><ArrowDownLeft className="h-4 w-4 text-emerald-600" /> ورودی کل افغانی:</span>
              <span className="font-sans font-black text-[#166534] dark:text-emerald-450">{toPersianNumbers(totals.inflowAfn.toLocaleString())}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="flex items-center gap-1.5"><ArrowUpRight className="h-4 w-4 text-rose-650" /> خروجی کل افغانی:</span>
              <span className="font-sans font-black text-[#991b1b] dark:text-rose-450">{toPersianNumbers(totals.outflowAfn.toLocaleString())}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><ArrowDownLeft className="h-4 w-4 text-emerald-600" /> ورودی کل دالری:</span>
              <span className="font-sans font-black text-[#166534] dark:text-emerald-450">{toPersianNumbers(totals.inflowUsd.toLocaleString())}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Ledgers list */}
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm">تراز حساب‌های فعال خزانه</CardTitle>
          <CardDescription>جزئیات گردش مالی و مانده هر حساب بانکی یا صندوق به تفکیک</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام حساب</TableHead>
                <TableHead>نوع حساب</TableHead>
                <TableHead>ارز حساب</TableHead>
                <TableHead className="text-left">مجموع ورودی</TableHead>
                <TableHead className="text-left">مجموع خروجی</TableHead>
                <TableHead className="text-left">موجودی خالص فعلی</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountBalances.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-bold text-xs">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: acc.color }} />
                      <span>{acc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold">{acc.type}</TableCell>
                  <TableCell className="text-xs font-bold font-sans">{acc.currency}</TableCell>
                  <TableCell className="text-left font-sans font-semibold text-xs text-[#166534] dark:text-emerald-400">
                    {formatCurrency(acc.inflows, acc.currency)}
                  </TableCell>
                  <TableCell className="text-left font-sans font-semibold text-xs text-[#991b1b] dark:text-rose-450">
                    {formatCurrency(acc.outflows, acc.currency)}
                  </TableCell>
                  <TableCell className="text-left font-sans font-black text-xs text-slate-900 dark:text-white">
                    {formatCurrency(acc.currentBalance, acc.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cashflow Trend Chart */}
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm">روند توازن نقدینگی خزانه</CardTitle>
          <CardDescription>گردش مالی ماهانه خزانه‌داری در ۶ ماه اخیر (برحسب افغانی)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Bar name="دریافتی (AFN)" dataKey="دریافتی (AFN)" fill="#166534" radius={[4, 4, 0, 0]} />
                <Bar name="پرداختی (AFN)" dataKey="پرداختی (AFN)" fill="#991b1b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
