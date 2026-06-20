import React, { useEffect, useState, useContext } from 'react';
import { db } from '../services/db';
import { WorkspaceContext } from '../contexts/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { DatePicker } from '../components/ui/datePicker';
import { formatCurrency, toPersianNumbers } from '../lib/utils';
import { FileSpreadsheet, FileText, BarChart3, TrendingUp, Landmark } from 'lucide-react';
import ReportTemplate from '../components/PDF/ReportTemplate';
import { pdfGenerator } from '../lib/pdfGenerator';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function Reports() {
  const { activeWorkspace } = useContext(WorkspaceContext);
  const [activeTab, setActiveTab] = useState('timeline');
  
  // Date range filters
  const [startDate, setStartDate] = useState('1404/01/01');
  const [endDate, setEndDate] = useState('1404/12/29');
  const [selectedCurrency, setSelectedCurrency] = useState('AFN');

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Summary Stats
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0
  });

  // Category summary Drilldown
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [selectedCategoryTxs, setSelectedCategoryTxs] = useState(null);

  const loadReportData = () => {
    if (!activeWorkspace) return;

    const allTransactions = db.getAll('transactions', t => t.status === 'approved');
    const allCategories = db.getAll('categories');
    const allAccounts = db.getAll('accounts');
    const allEmployees = db.getAll('employees');

    setCategories(allCategories);
    setAccounts(allAccounts);
    setEmployees(allEmployees);

    // Apply date range and currency filters
    const filteredTxs = allTransactions.filter(t => {
      const inDateRange = t.date >= startDate && t.date <= endDate;
      const matchCurrency = t.currency === selectedCurrency;
      return inDateRange && matchCurrency;
    });

    setTransactions(filteredTxs);

    // Calculate Summary stats
    const income = filteredTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    setSummary({
      totalIncome: income,
      totalExpense: expense,
      netProfit: income - expense,
      currency: selectedCurrency
    });

    // Category breakdown logic
    const catMap = {};
    filteredTxs.forEach(t => {
      const cat = allCategories.find(c => c.id === t.categoryId);
      const name = cat ? cat.name : 'سایر';
      const color = cat ? cat.color : '#4b5563';
      if (!catMap[t.categoryId]) {
        catMap[t.categoryId] = { id: t.categoryId, name, color, type: t.type, total: 0, count: 0 };
      }
      catMap[t.categoryId].total += t.amount;
      catMap[t.categoryId].count++;
    });

    const breakdown = Object.values(catMap).sort((a, b) => b.total - a.total);
    setCategoryBreakdown(breakdown);
    setSelectedCategoryTxs(null); // Reset drilldown
  };

  useEffect(() => {
    loadReportData();
  }, [activeWorkspace, startDate, endDate, selectedCurrency]);

  const handleCategoryClick = (catId) => {
    const txs = transactions.filter(t => t.categoryId === catId);
    const catName = categories.find(c => c.id === catId)?.name || 'سایر';
    setSelectedCategoryTxs({ catName, txs });
  };

  const handleExportPDF = async () => {
    // Generate Report PDF using ReportTemplate
    await pdfGenerator.exportToPDF('report-pdf-template', `Financial_Report_${startDate.replace(/\//g, '-')}_to_${endDate.replace(/\//g, '-')}.pdf`);
  };

  const handleExportExcel = () => {
    const data = transactions.map((t, idx) => {
      const acc = accounts.find(a => a.id === t.accountId);
      const cat = categories.find(c => c.id === t.categoryId);
      return {
        'ردیف': idx + 1,
        'تاریخ': t.date,
        'شرح': t.description,
        'نوع': t.type === 'income' ? 'درآمد' : 'هزینه',
        'مبلغ': t.amount,
        'ارز': t.currency,
        'حساب': acc ? acc.name : 'نامشخص',
        'دسته‌بندی': cat ? cat.name : 'نامشخص'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'گزارش مالی');
    XLSX.writeFile(wb, `Report_${startDate.replace(/\//g, '_')}_to_${endDate.replace(/\//g, '_')}.xlsx`);
    toast.success('فایل اکسل با موفقیت بارگذاری شد');
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Title & Global Export Buttons */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">گزارشات جامع مالی</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">تجزیه و تحلیل جریان نقدینگی، سود و زیان و عملکرد پرسنل</p>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button onClick={handleExportExcel} variant="outline" className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold border-slate-300 dark:border-slate-700">
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            <span>خروجی اکسل</span>
          </Button>
          <Button onClick={handleExportPDF} className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold">
            <FileText className="h-4 w-4" />
            <span>خروجی رسمی PDF</span>
          </Button>
        </div>
      </div>

      {/* Global Period Selector */}
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardContent className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
          <div>
            <DatePicker
              label="از تاریخ (شروع بازه)"
              value={startDate}
              onChange={setStartDate}
            />
          </div>
          <div>
            <DatePicker
              label="تا تاریخ (پایان بازه)"
              value={endDate}
              onChange={setEndDate}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">انتخاب ارز گزارش</label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 focus:border-[#1e40af] focus:outline-none"
            >
              <option value="AFN">افغانی (AFN)</option>
              <option value="USD">دلار (USD)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Scoreboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardContent className="p-6 text-center">
            <p className="text-xs font-bold text-slate-500">جمع کل دریافتی‌ها (درآمد)</p>
            <p className="text-xl font-black text-[#1e40af] dark:text-blue-400 font-sans mt-3">
              {formatCurrency(summary.totalIncome, selectedCurrency)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardContent className="p-6 text-center">
            <p className="text-xs font-bold text-slate-500">جمع کل پرداختی‌ها (هزینه)</p>
            <p className="text-xl font-black text-[#991b1b] dark:text-rose-400 font-sans mt-3">
              {formatCurrency(summary.totalExpense, selectedCurrency)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-[#166534] bg-emerald-50/10 dark:border-emerald-900/30">
          <CardContent className="p-6 text-center">
            <p className="text-xs font-bold text-[#166534] dark:text-emerald-400">تراز سود و زیان ناخالص (P&L)</p>
            <p className="text-xl font-black text-[#166534] dark:text-emerald-400 font-sans mt-3">
              {formatCurrency(summary.netProfit, selectedCurrency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detail Tabs */}
      <Tabs defaultValue="timeline" onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="timeline" className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            شرح زمانی
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            تفکیک دسته‌بندی و مته‌کاری
          </TabsTrigger>
          <TabsTrigger value="pnl" className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            تراز سود و زیان (P&L)
          </TabsTrigger>
        </TabsList>

        {/* 1. Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm">دفتر روزنامه تراکنش‌ها</CardTitle>
              <CardDescription>کلیه اسناد تایید شده در بازه زمانی انتخابی</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>شرح سند</TableHead>
                    <TableHead>حساب بانکی</TableHead>
                    <TableHead>دسته‌بندی</TableHead>
                    <TableHead className="text-left">مبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-sans text-xs font-semibold">{tx.date}</TableCell>
                      <TableCell className="font-bold text-xs">{tx.description}</TableCell>
                      <TableCell className="text-xs">{accounts.find(a => a.id === tx.accountId)?.name || 'نامشخص'}</TableCell>
                      <TableCell className="text-xs">{categories.find(c => c.id === tx.categoryId)?.name || 'نامشخص'}</TableCell>
                      <TableCell className={`text-left font-sans font-bold text-xs ${
                        tx.type === 'income' ? 'text-[#166534] dark:text-emerald-400' : 'text-[#991b1b] dark:text-rose-400'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount, tx.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Drilldown Categories Tab */}
        <TabsContent value="categories">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Category summary */}
            <Card className="border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm">هزینه و درآمد به تفکیک دسته</CardTitle>
                <CardDescription>جهت مشاهده اسناد روی دسته‌بندی کلیک کنید (Drill-down)</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>دسته‌بندی</TableHead>
                      <TableHead>ماهیت دسته</TableHead>
                      <TableHead className="text-center">تعداد تراکنش</TableHead>
                      <TableHead className="text-left">جمع مبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryBreakdown.map((cat) => (
                      <TableRow 
                        key={cat.id} 
                        onClick={() => handleCategoryClick(cat.id)}
                        className="cursor-pointer hover:bg-blue-50/10 dark:hover:bg-blue-950/10"
                      >
                        <TableCell className="font-bold text-xs">
                          <span className="px-2 py-0.5 rounded text-white" style={{ backgroundColor: cat.color }}>
                            {cat.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{cat.type === 'income' ? 'درآمدها' : 'مخارج/هزینه‌ها'}</TableCell>
                        <TableCell className="text-center font-sans text-xs">{toPersianNumbers(cat.count)}</TableCell>
                        <TableCell className="text-left font-sans font-bold text-xs text-[#991b1b]">
                          {formatCurrency(cat.total, selectedCurrency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Drilldown List */}
            <Card className="border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm">
                  {selectedCategoryTxs 
                    ? `تراکنش‌های دسته "${selectedCategoryTxs.catName}"` 
                    : 'ریز تراکنش‌های مته‌کاری (Drill-down)'}
                </CardTitle>
                <CardDescription>لیست تراکنش‌های متناظر با دسته انتخاب شده</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!selectedCategoryTxs ? (
                  <div className="p-12 text-center text-xs text-slate-500 font-semibold">
                    جهت مشاهده اسناد مربوطه، روی یکی از دسته‌های جدول روبرو کلیک نمایید.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>تاریخ</TableHead>
                        <TableHead>شرح سند</TableHead>
                        <TableHead className="text-left">مبلغ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCategoryTxs.txs.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-sans text-xs">{tx.date}</TableCell>
                          <TableCell className="font-bold text-xs truncate max-w-[200px]">{tx.description}</TableCell>
                          <TableCell className="text-left font-sans font-bold text-xs">
                            {formatCurrency(tx.amount, tx.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* 3. Profit & Loss (P&L) Tab */}
        <TabsContent value="pnl">
          <Card className="border border-slate-200 dark:border-slate-800 max-w-2xl mx-auto">
            <CardHeader className="text-center border-b border-slate-100 dark:border-slate-850">
              <CardTitle className="text-lg font-black">ترازنامه سود و زیان دوره کل (P&L)</CardTitle>
              <CardDescription>از تاریخ {startDate} تا {endDate}</CardDescription>
            </CardHeader>
            <CardContent className="py-6 space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#1e40af] dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-2">درآمدهای عملیاتی:</h3>
                
                <div className="flex justify-between items-center text-xs font-bold px-3">
                  <span>جمع درآمدهای حاصل از فروش و خدمات:</span>
                  <span className="font-sans text-[#166534] font-bold">
                    {formatCurrency(summary.totalIncome, selectedCurrency)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#991b1b] dark:text-rose-400 border-b border-slate-100 dark:border-slate-800 pb-2">هزینه‌های جاری و بهای تمام شده:</h3>
                
                <div className="flex justify-between items-center text-xs font-semibold px-3 text-slate-750 dark:text-slate-300">
                  <span>هزینه‌های اداری، عمومی و فروش:</span>
                  <span className="font-sans font-bold">
                    {formatCurrency(summary.totalExpense, selectedCurrency)}
                  </span>
                </div>
              </div>

              <div className="border-t-2 border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center text-sm font-black">
                <span className="text-slate-900 dark:text-white">سود / زیان خالص دوره عملکرد (Net Income):</span>
                <span className={`font-sans ${
                  summary.netProfit >= 0 ? 'text-[#166534]' : 'text-[#991b1b]'
                }`}>
                  {formatCurrency(summary.netProfit, selectedCurrency)}
                </span>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Render off-screen (instead of display: none) so html2canvas can capture it offline */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}>
        <div id="report-pdf-template">
          <ReportTemplate
            title="گزارش عملکرد مالی شرکت"
            dateRange={`از ${startDate} تا ${endDate}`}
            filters={{ type: '', category: '', status: 'approved' }}
            summary={summary}
            transactions={transactions}
            company={activeWorkspace}
            categories={categories}
          />
        </div>
      </div>

    </div>
  );
}
