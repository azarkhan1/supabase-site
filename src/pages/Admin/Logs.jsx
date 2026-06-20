import React, { useEffect, useState, useContext } from 'react';
import { db } from '../../services/db';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { formatCurrency, toPersianNumbers, isoToJalaliWithTime } from '../../lib/utils';
import { FileSpreadsheet, History, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function SystemLogs() {
  const { activeWorkspace } = useContext(WorkspaceContext);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const loadLogs = () => {
    let list = db.getAll('logs');

    // Apply search/filters
    if (search) {
      list = list.filter(l => 
        l.username.toLowerCase().includes(search.toLowerCase()) ||
        l.table.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterAction) {
      list = list.filter(l => l.action === filterAction);
    }

    // Sort by timestamp desc (newest first)
    list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    setLogs(list);
  };

  useEffect(() => {
    loadLogs();
  }, [activeWorkspace, search, filterAction]);

  const handleClearLogs = () => {
    if (confirm('آیا از پاک کردن کامل تاریخچه لاگ‌های سیستم اطمینان دارید؟ این عمل غیرقابل بازگشت است.')) {
      db.setRaw('logs', []);
      toast.success('تمامی لاگ‌های سیستم با موفقیت پاک شدند');
      loadLogs();
    }
  };

  const handleExportExcel = () => {
    const data = logs.map((l, idx) => ({
      'ردیف': idx + 1,
      'زمان ثبت': isoToJalaliWithTime(l.timestamp),
      'کاربر': l.username,
      'نوع عملیات': l.action,
      'بخش / جدول': l.table,
      'شناسه رکورد': l.recordId,
      'جزئیات': l.details ? JSON.parse(l.details).text : '',
      'آدرس IP': l.ip
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'لاگ‌های سیستم');
    XLSX.writeFile(wb, `System_Audit_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('فایل اکسل لاگ‌ها با موفقیت دانلود شد');
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'create':
        return <Badge variant="success">ایجاد</Badge>;
      case 'update':
        return <Badge variant="warning">ویرایش</Badge>;
      case 'delete':
        return <Badge variant="danger">حذف</Badge>;
      case 'login':
        return <Badge variant="primary">ورود</Badge>;
      case 'logout':
        return <Badge>خروج</Badge>;
      default:
        return <Badge variant="info">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Title & Actions */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">لاگ‌ها و ممیزی سیستم (Audit Logs)</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">ردیابی و ممیزی زنده کلیه اقدامات کاربران، تغییرات پایگاه داده و مبادلات مالی</p>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <Button onClick={handleClearLogs} variant="danger" className="text-xs font-bold flex items-center space-x-1.5 space-x-reverse">
            <Trash2 className="h-4 w-4" />
            <span>پاکسازی لاگ‌ها</span>
          </Button>
          
          <Button onClick={handleExportExcel} variant="outline" className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold border-slate-300 dark:border-slate-700">
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            <span>خروجی اکسل</span>
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardContent className="py-4 flex flex-wrap gap-4 text-right">
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">جستجو در کاربران و بخش‌ها</label>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="مثال: admin، transactions..."
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pr-9 pl-3 py-2.5 focus:outline-none focus:border-[#1e40af]"
              />
            </div>
          </div>

          <div className="w-full sm:w-48">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">نوع عملیات</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 focus:outline-none focus:border-[#1e40af]"
            >
              <option value="">همه انواع</option>
              <option value="create">ایجاد (Create)</option>
              <option value="update">ویرایش (Update)</option>
              <option value="delete">حذف (Delete)</option>
              <option value="login">ورود کاربر</option>
              <option value="logout">خروج کاربر</option>
            </select>
          </div>

        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-semibold">هیچ رویدادی در دفتر ممیزی ثبت نشده است</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>زمان ثبت</TableHead>
                  <TableHead>کاربر مسئول</TableHead>
                  <TableHead>عملیات</TableHead>
                  <TableHead>بخش / جدول</TableHead>
                  <TableHead>شرح جزئیات اقدام</TableHead>
                  <TableHead className="w-32 text-left">آدرس IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const detailsText = log.details ? JSON.parse(log.details).text : '';
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-sans text-xs font-semibold">
                        {isoToJalaliWithTime(log.timestamp)}
                      </TableCell>
                      <TableCell className="font-bold text-xs">@{log.username}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="text-xs font-semibold font-mono text-slate-500">{log.table}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-800 dark:text-slate-200">{detailsText}</TableCell>
                      <TableCell className="text-left font-sans text-xs text-slate-500">{log.ip}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
