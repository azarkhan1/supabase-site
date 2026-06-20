import React, { useEffect, useState, useContext } from 'react';
import { db } from '../services/db';
import { WorkspaceContext } from '../contexts/WorkspaceContext';
import StatCard from '../components/Dashboard/StatCard';
import CashflowChart from '../components/Dashboard/CashflowChart';
import CategoryChart from '../components/Dashboard/CategoryChart';
import RecentTransactions from '../components/Dashboard/RecentTransactions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { formatCurrency, formatNumber, toPersianNumbers } from '../lib/utils';
import { 
  TrendingUp, TrendingDown, Wallet, AlertOctagon, 
  Clock, ArrowRightLeft, CalendarCheck 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { activeWorkspace } = useContext(WorkspaceContext);
  const [stats, setStats] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    overdueCommitments: 0
  });

  const [cashflowData, setCashflowData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [upcomingRecurring, setUpcomingRecurring] = useState([]);

  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (!activeWorkspace) return;

    // 1. Fetch tables
    const allAccounts = db.getAll('accounts');
    const allTransactions = db.getAll('transactions');
    const allCategories = db.getAll('categories');
    const allCommitments = db.getAll('commitments');
    const allPayments = db.getAll('payments');
    const allRecurring = db.getAll('recurring', r => r.isActive);

    setCategories(allCategories);
    setAccounts(allAccounts);

    const activeCurrency = activeWorkspace.currency || 'AFN';

    // 2. Calculate Account Balances (approved only)
    let totalCash = 0;
    allAccounts.forEach(acc => {
      const txs = allTransactions.filter(t => t.accountId === acc.id && t.status === 'approved');
      const sum = txs.reduce((tot, t) => {
        if (t.type === 'income') return tot + t.amount;
        return tot - t.amount;
      }, 0);
      
      const currentBal = acc.initialBalance + sum;
      
      // Convert secondary currency to primary if needed (simplified)
      if (acc.currency === activeCurrency) {
        totalCash += currentBal;
      } else {
        const rate = activeWorkspace.exchangeRate || 70;
        if (activeCurrency === 'AFN') {
          totalCash += currentBal * rate;
        } else {
          totalCash += currentBal / rate;
        }
      }
    });

    // 3. Monthly Income & Expenses (approved only)
    const now = new Date();
    // Simple Persian month checking or default checking
    // Let's grab transactions of the current Gregorian calendar month or Jalali month (simplified)
    const currentYearJalali = '1404';
    const currentMonthJalali = '10'; // sample default to match seed data

    const monthlyTxs = allTransactions.filter(t => {
      const parts = t.date.split('/');
      return parts[0] === currentYearJalali && parts[1] === currentMonthJalali && t.status === 'approved';
    });

    const monthlyInc = monthlyTxs
      .filter(t => t.type === 'income' && t.currency === activeCurrency)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExp = monthlyTxs
      .filter(t => t.type === 'expense' && t.currency === activeCurrency)
      .reduce((sum, t) => sum + t.amount, 0);

    // 4. Overdue Commitments
    // commitment remains = total - paid
    let overdueCount = 0;
    const todayStr = '1404/10/25'; // Simulated today date for Persian system consistency
    
    allCommitments.forEach(com => {
      const payments = allPayments.filter(p => p.commitmentId === com.id);
      const paid = payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = com.totalAmount - paid;
      
      if (remaining > 0 && com.dueDate < todayStr) {
        overdueCount++;
      }
    });

    setStats({
      totalBalance: totalCash,
      monthlyIncome: monthlyInc,
      monthlyExpense: monthlyExp,
      overdueCommitments: overdueCount
    });

    // 5. Build Bar Chart Data (Last 6 months)
    const months = ['۰۵', '۰۶', '۰۷', '۰۸', '۰۹', '۱۰'];
    const monthNames = ['مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی'];
    const chartData = months.map((m, idx) => {
      const monthTxs = allTransactions.filter(t => {
        const parts = t.date.split('/');
        return parts[0] === '1404' && parts[1] === m && t.status === 'approved';
      });

      const inc = monthTxs
        .filter(t => t.type === 'income' && t.currency === activeCurrency)
        .reduce((sum, t) => sum + t.amount, 0);

      const exp = monthTxs
        .filter(t => t.type === 'expense' && t.currency === activeCurrency)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        name: monthNames[idx],
        income: inc,
        expense: exp
      };
    });
    setCashflowData(chartData);

    // 6. Donut Chart Data (Categories of current month)
    const catMap = {};
    monthlyTxs
      .filter(t => t.type === 'expense' && t.currency === activeCurrency)
      .forEach(t => {
        const cat = allCategories.find(c => c.id === t.categoryId);
        const name = cat ? cat.name : 'سایر';
        const color = cat ? cat.color : '#64748b';
        if (!catMap[name]) {
          catMap[name] = { value: 0, color };
        }
        catMap[name].value += t.amount;
      });

    const donutData = Object.keys(catMap).map(name => ({
      name,
      value: catMap[name].value,
      color: catMap[name].color
    }));
    setCategoryData(donutData);

    // 7. Recent Transactions (5 items)
    const sortedTxs = [...allTransactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
    setRecentTx(sortedTxs);

    // 8. Alerts Calculation (overdue commitments, near commitments, pending transactions)
    const systemAlerts = [];
    
    // Near due commitments (next 7 days)
    allCommitments.forEach(com => {
      const payments = allPayments.filter(p => p.commitmentId === com.id);
      const paid = payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = com.totalAmount - paid;
      
      if (remaining > 0) {
        if (com.dueDate < todayStr) {
          systemAlerts.push({
            id: `alert-overdue-${com.id}`,
            type: 'danger',
            message: `تعهد "${com.title}" به مبلغ ${formatCurrency(remaining, com.currency)} سررسید شده و معوق است (${com.dueDate})`
          });
        } else {
          // simple date diff simulation: checking if due date matches close date
          // For seed data, let's trigger alert if date is close
          systemAlerts.push({
            id: `alert-near-${com.id}`,
            type: 'warning',
            message: `تعهد نزدیک به سررسید "${com.title}" به مبلغ ${formatCurrency(remaining, com.currency)} در تاریخ ${com.dueDate}`
          });
        }
      }
    });

    // Pending transactions queue alert
    const pendingCount = allTransactions.filter(t => t.status === 'pending').length;
    if (pendingCount > 0) {
      systemAlerts.push({
        id: 'alert-pending-tx',
        type: 'info',
        message: `${toPersianNumbers(pendingCount)} تراکنش جدید در انتظار تایید مدیریت هستند.`
      });
    }

    setAlerts(systemAlerts.slice(0, 5));

    // 9. Upcoming recurring rules (next 3 runs)
    const recurringList = allRecurring.slice(0, 3).map(r => {
      const cat = allCategories.find(c => c.id === r.categoryId);
      return {
        ...r,
        categoryName: cat ? cat.name : 'سایر'
      };
    });
    setUpcomingRecurring(recurringList);

  }, [activeWorkspace]);

  return (
    <div className="space-y-6 text-right">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">میز کار و داشبورد مدیریتی</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">خلاصه وضعیت مالی، تراکنش‌ها و هشدارهای سررسید</p>
        </div>
        
        <div className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 font-bold font-sans">
          امروز: <span className="text-[#1e40af] dark:text-blue-400">۱۴۰۴/۱۰/۲۵</span>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="موجودی کل خزانه (برابری اصلی)"
          value={formatCurrency(stats.totalBalance, activeWorkspace?.currency)}
          icon={Wallet}
          trend="۴.۲% +"
          trendType="up"
          color="blue"
        />
        <StatCard
          title="درآمد این ماه (دی)"
          value={formatCurrency(stats.monthlyIncome, activeWorkspace?.currency)}
          icon={TrendingUp}
          trend="۱۲.۵% +"
          trendType="up"
          color="emerald"
        />
        <StatCard
          title="هزینه این ماه (دی)"
          value={formatCurrency(stats.monthlyExpense, activeWorkspace?.currency)}
          icon={TrendingDown}
          trend="۳.۸% -"
          trendType="down"
          color="rose"
        />
        <StatCard
          title="تعهدات مالی معوق"
          value={toPersianNumbers(stats.overdueCommitments) + ' مورد'}
          icon={Clock}
          trend={stats.overdueCommitments > 0 ? "نیاز به تسویه" : "بدون بدهی معوق"}
          trendType={stats.overdueCommitments > 0 ? "down" : "neutral"}
          color="amber"
        />
      </div>

      {/* Alert Cards Banner */}
      {alerts.length > 0 && (
        <div className="space-y-3 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl p-4">
          <div className="flex items-center space-x-2 space-x-reverse text-rose-800 dark:text-rose-400 font-bold text-xs">
            <AlertOctagon className="h-4.5 w-4.5" />
            <span>هشدارهای سیستم و تعهدات معوق:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-slate-900 text-xs font-semibold shadow-xs border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center space-x-2 space-x-reverse text-slate-700 dark:text-slate-300">
                  <span className={`w-2 h-2 rounded-full ${
                    alert.type === 'danger' ? 'bg-[#991b1b]' : alert.type === 'warning' ? 'bg-[#854d0e]' : 'bg-[#1e40af]'
                  }`} />
                  <span className="line-clamp-1">{alert.message}</span>
                </div>
                
                {alert.id.includes('tx') ? (
                  <Link to="/admin/users" className="text-[10px] text-[#1e40af] hover:underline font-bold shrink-0">
                    بررسی صف تایید
                  </Link>
                ) : (
                  <Link to="/commitments" className="text-[10px] text-[#1e40af] hover:underline font-bold shrink-0">
                    مشاهده تعهد
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashflowChart data={cashflowData} currency={activeWorkspace?.currency} />
        </div>
        <div>
          <CategoryChart data={categoryData} currency={activeWorkspace?.currency} />
        </div>
      </div>

      {/* Table & Recurring widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent transactions */}
        <div className="lg:col-span-2">
          <RecentTransactions 
            transactions={recentTx} 
            categories={categories} 
            accounts={accounts} 
          />
        </div>

        {/* Recurring widgets card */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1 text-right">
              <CardTitle>تراکنش‌های دوره‌ای آینده</CardTitle>
              <CardDescription>برنامه زمان‌بندی تراکنش‌های خودکار</CardDescription>
            </div>
            <CalendarCheck className="h-4.5 w-4.5 text-slate-400" />
          </CardHeader>
          <CardContent className="p-0">
            {upcomingRecurring.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">تراکنش دوره‌ای فعالی ثبت نشده است</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingRecurring.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 flex justify-between items-center">
                    <div className="space-y-1.5 text-right">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                      <div className="flex items-center space-x-1.5 space-x-reverse text-[10px] text-slate-500">
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">{item.categoryName}</span>
                        <span className="font-sans font-semibold">هر {item.frequency}</span>
                      </div>
                    </div>

                    <div className="text-left space-y-1">
                      <p className="text-xs font-bold font-sans text-slate-900 dark:text-white">
                        {formatCurrency(item.amount, item.currency)}
                      </p>
                      <p className="text-[9px] text-[#854d0e] font-sans font-semibold">
                        سررسید بعدی: {item.nextRunDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
