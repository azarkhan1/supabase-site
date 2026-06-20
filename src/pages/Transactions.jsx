import React, { useEffect, useState, useContext } from 'react';
import { db } from '../services/db';
import { WorkspaceContext } from '../contexts/WorkspaceContext';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { DatePicker } from '../components/ui/datePicker';
import { FileUpload } from '../components/ui/fileUpload';
import { formatCurrency, toPersianNumbers } from '../lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema } from '../schemas/transaction';
import { 
  Plus, Search, SlidersHorizontal, ArrowDownLeft, ArrowUpRight, 
  Eye, FileSpreadsheet, FileText, CheckCircle2, XCircle, Trash2, Tag, Paperclip
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function Transactions() {
  const { activeWorkspace } = useContext(WorkspaceContext);
  const { user } = useAuth();
  const canApprove = usePermission('APPROVE_TRANSACTION');
  
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterHasAttachment, setFilterHasAttachment] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      currency: 'AFN',
      type: 'expense',
      accountId: '',
      categoryId: '',
      date: '1404/10/25',
      description: '',
      tags: '',
      status: 'pending'
    }
  });

  const loadData = () => {
    if (!activeWorkspace) return;
    
    setAccounts(db.getAll('accounts'));
    setCategories(db.getAll('categories'));
    
    let txList = db.getAll('transactions');

    // Apply Filters
    if (search) {
      txList = txList.filter(t => 
        t.description.toLowerCase().includes(search.toLowerCase()) || 
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
      );
    }
    if (filterType) {
      txList = txList.filter(t => t.type === filterType);
    }
    if (filterCategory) {
      txList = txList.filter(t => t.categoryId === filterCategory);
    }
    if (filterAccount) {
      txList = txList.filter(t => t.accountId === filterAccount);
    }
    if (filterStatus) {
      txList = txList.filter(t => t.status === filterStatus);
    }
    if (filterHasAttachment) {
      txList = txList.filter(t => t.attachments && t.attachments.length > 0);
    }

    // Sort
    txList.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    setTransactions(txList);
    setSelectedIds([]);
  };

  useEffect(() => {
    loadData();
    setCurrentPage(1);
  }, [activeWorkspace, search, filterType, filterCategory, filterAccount, filterStatus, filterHasAttachment, sortField, sortDirection]);

  // Form setup for Add
  const handleOpenAdd = () => {
    setSelectedTx(null);
    
    const defaultAcc = accounts.find(a => a.isDefault)?.id || (accounts[0]?.id || '');
    
    reset({
      amount: 0,
      currency: activeWorkspace?.currency || 'AFN',
      type: 'expense',
      accountId: defaultAcc,
      categoryId: categories[0]?.id || '',
      date: '1404/10/25',
      description: '',
      tags: '',
      status: activeWorkspace?.approvalRequired ? 'pending' : 'approved',
      attachments: []
    });
    setIsOpen(true);
  };

  // Submit Handler
  const handleSave = (data) => {
    try {
      const tagsArray = typeof data.tags === 'string' 
        ? data.tags.split(',').map(t => t.trim()).filter(Boolean) 
        : [];
      
      const payload = {
        ...data,
        tags: tagsArray,
        attachments: data.attachments || []
      };

      if (payload.status === 'approved') {
        payload.approvedBy = user?.fullName || 'سیستم';
        payload.approvedAt = new Date().toISOString();
      }

      db.insert('transactions', payload);
      toast.success('تراکنش با موفقیت ثبت شد');
      
      setIsOpen(false);
      loadData();
    } catch (err) {
      toast.error('خطا در ثبت تراکنش: ' + err.message);
    }
  };

  // Bulk Actions
  const handleBulkApprove = () => {
    if (!canApprove) {
      toast.error('شما دسترسی تایید تراکنش‌ها را ندارید');
      return;
    }

    if (selectedIds.length === 0) return;

    db.transaction((database) => {
      selectedIds.forEach(id => {
        database.update('transactions', id, {
          status: 'approved',
          approvedBy: user?.fullName || 'مدیر سیستم',
          approvedAt: new Date().toISOString()
        });
      });
    });

    toast.success(`${toPersianNumbers(selectedIds.length)} تراکنش با موفقیت تایید شدند`);
    loadData();
  };

  const handleBulkDelete = () => {
    if (user?.role !== 'owner' && !user?.isAdmin) {
      toast.error('فقط مدیر کل یا مالک می‌تواند تراکنش‌ها را حذف کند');
      return;
    }

    if (selectedIds.length === 0) return;

    if (confirm(`آیا از حذف ${selectedIds.length} تراکنش انتخابی اطمینان دارید؟`)) {
      db.transaction((database) => {
        selectedIds.forEach(id => {
          database.delete('transactions', id);
        });
      });
      toast.success('تراکنش‌ها با موفقیت حذف شدند');
      loadData();
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pageIds = paginatedTxs.map(t => t.id);
      setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
    } else {
      const pageIds = paginatedTxs.map(t => t.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    const dataToExport = transactions.map((t, idx) => {
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
        'دسته‌بندی': cat ? cat.name : 'نامشخص',
        'وضعیت': t.status === 'approved' ? 'تایید شده' : t.status === 'pending' ? 'در انتظار' : 'رد شده',
        'تایید کننده': t.approvedBy || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تراکنش‌ها');
    XLSX.writeFile(wb, `FMS_Transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('خروجی اکسل با موفقیت تولید شد');
  };

  // Pagination calculations
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTxs = transactions.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">تایید شده</Badge>;
      case 'pending':
        return <Badge variant="warning">در انتظار تایید</Badge>;
      case 'rejected':
        return <Badge variant="danger">رد شده</Badge>;
      default:
        return <Badge>نامشخص</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Title & Add Actions */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">تراکنش‌های مالی</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">ثبت و بایگانی کلیه دریافتی‌ها و پرداختی‌های شرکت</p>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button onClick={handleExportExcel} variant="outline" className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold border-slate-300 dark:border-slate-700">
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            <span>خروجی اکسل</span>
          </Button>
          <Button onClick={handleOpenAdd} className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold">
            <Plus className="h-4 w-4" />
            <span>ثبت تراکنش جدید</span>
          </Button>
        </div>
      </div>

      {/* Advanced Filters Card */}
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader className="py-4">
          <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-700 dark:text-slate-300">
            <SlidersHorizontal className="h-4 w-4" />
            <span>جستجو و فیلترهای پیشرفته</span>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-0 text-right">
          
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">جستجو در شرح و برچسب‌ها</label>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="مثال: اجاره، قرارداد، حقوق..."
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pr-9 pl-3 py-2 focus:border-[#1e40af] focus:outline-none"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">نوع تراکنش</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:border-[#1e40af] focus:outline-none"
            >
              <option value="">همه انواع</option>
              <option value="income">درآمد (دریافتی)</option>
              <option value="expense">هزینه (پرداختی)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">دسته‌بندی</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:border-[#1e40af] focus:outline-none"
            >
              <option value="">همه دسته‌ها</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">حساب مالی</label>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:border-[#1e40af] focus:outline-none"
            >
              <option value="">همه حساب‌ها</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">وضعیت تایید</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:border-[#1e40af] focus:outline-none"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="approved">تایید شده</option>
              <option value="pending">در انتظار تایید</option>
              <option value="rejected">رد شده</option>
            </select>
          </div>

        </CardContent>
        
        {/* Sort & Quick Filter footer */}
        <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <input
                type="checkbox"
                id="hasAttachment"
                checked={filterHasAttachment}
                onChange={(e) => setFilterHasAttachment(e.target.checked)}
                className="rounded border-slate-300 text-[#1e40af] focus:ring-[#1e40af] h-3.5 w-3.5"
              />
              <label htmlFor="hasAttachment" className="font-bold text-slate-600 dark:text-slate-400 cursor-pointer">فقط تراکنش‌های دارای پیوست فایلی</label>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-slate-500 font-semibold">مرتب‌سازی بر اساس:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 focus:border-[#1e40af] focus:outline-none"
            >
              <option value="date">تاریخ تراکنش</option>
              <option value="amount">مبلغ تراکنش</option>
            </select>
            <select
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value)}
              className="text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 focus:border-[#1e40af] focus:outline-none"
            >
              <option value="desc">نزولی (جدیدترین / بیشترین)</option>
              <option value="asc">صعودی</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Bulk Actions Header Alert */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl text-xs font-bold">
          <span className="text-[#1e40af] dark:text-blue-400">
            {toPersianNumbers(selectedIds.length)} تراکنش انتخاب شده است
          </span>
          <div className="flex items-center space-x-2 space-x-reverse">
            {canApprove && (
              <Button onClick={handleBulkApprove} variant="success" size="sm" className="flex items-center space-x-1 space-x-reverse">
                <CheckCircle2 className="h-4 w-4" />
                <span>تایید گروهی</span>
              </Button>
            )}
            <Button onClick={handleBulkDelete} variant="danger" size="sm" className="flex items-center space-x-1 space-x-reverse">
              <Trash2 className="h-4 w-4" />
              <span>حذف گروهی</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          {paginatedTxs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-semibold space-y-4">
              <p>هیچ تراکنشی یافت نشد</p>
              <Button variant="outline" size="sm" onClick={handleOpenAdd}>ثبت اولین تراکنش</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-[#1e40af] focus:ring-[#1e40af] h-3.5 w-3.5"
                      checked={paginatedTxs.every(t => selectedIds.includes(t.id))}
                      onChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>شرح و توضیحات</TableHead>
                  <TableHead>حساب</TableHead>
                  <TableHead>دسته‌بندی</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="w-16 text-center">جزئیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTxs.map((tx) => {
                  const acc = accounts.find(a => a.id === tx.accountId);
                  const cat = categories.find(c => c.id === tx.categoryId);
                  
                  return (
                    <TableRow key={tx.id} className={selectedIds.includes(tx.id) ? "bg-blue-50/20 dark:bg-blue-950/10" : ""}>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-[#1e40af] focus:ring-[#1e40af] h-3.5 w-3.5"
                          checked={selectedIds.includes(tx.id)}
                          onChange={(e) => handleSelectOne(tx.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell className="font-sans text-xs font-semibold">{tx.date}</TableCell>
                      <TableCell className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {tx.type === 'income' ? (
                            <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/20 text-[#166534] dark:text-emerald-400 shrink-0">
                              <ArrowDownLeft className="h-3.5 w-3.5" />
                            </div>
                          ) : (
                            <div className="p-1 rounded bg-rose-50 dark:bg-rose-950/20 text-[#991b1b] dark:text-rose-400 shrink-0">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </div>
                          )}
                          <span className="truncate max-w-[200px]">{tx.description}</span>
                          {tx.attachments && tx.attachments.length > 0 && (
                            <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" title="دارای فایل پیوست" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{acc ? acc.name : 'نامشخص'}</TableCell>
                      <TableCell>
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: cat ? cat.color : '#64748b' }}
                        >
                          {cat ? cat.name : 'نامشخص'}
                        </span>
                      </TableCell>
                      <TableCell className="font-sans font-bold text-xs">
                        <span className={tx.type === 'income' ? 'text-[#166534] dark:text-emerald-400' : 'text-[#991b1b] dark:text-rose-400'}>
                          {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount, tx.currency)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="text-center">
                        <a
                          href={`/transactions/${tx.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/transactions/${tx.id}`;
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded text-slate-500 hover:text-[#1e40af] inline-flex items-center justify-center"
                          title="مشاهده جزئیات تراکنش"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      {transactions.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400 px-2">
          <span>
            نمایش {toPersianNumbers(startIndex + 1)}-{toPersianNumbers(Math.min(startIndex + itemsPerPage, transactions.length))} از {toPersianNumbers(transactions.length)} تراکنش ثبت شده
          </span>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              قبلی
            </Button>
            <div className="flex items-center space-x-1 space-x-reverse">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 flex items-center justify-center rounded-md font-sans border ${
                    currentPage === i + 1 
                      ? 'bg-[#1e40af] border-[#1e40af] text-white' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {toPersianNumbers(i + 1)}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              بعدی
            </Button>
          </div>
        </div>
      )}

      {/* Add Transaction Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogHeader onOpenChange={setIsOpen}>
          <DialogTitle>ثبت سند حسابداری / تراکنش جدید</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4 text-right">
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="نوع تراکنش"
                error={errors.type?.message}
                {...register('type')}
              >
                <option value="expense">هزینه (خروجی/پرداخت)</option>
                <option value="income">درآمد (ورودی/دریافت)</option>
              </Select>

              <Select
                label="ارز تراکنش"
                error={errors.currency?.message}
                {...register('currency')}
              >
                <option value="AFN">افغانی (AFN)</option>
                <option value="USD">دلار (USD)</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="مبلغ تراکنش"
                type="number"
                placeholder="0"
                error={errors.amount?.message}
                {...register('amount')}
              />
              
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="تاریخ تراکنش (جلالی)"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.date?.message}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="حساب مالی منبع/مقصد"
                error={errors.accountId?.message}
                {...register('accountId')}
              >
                <option value="">انتخاب حساب...</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                ))}
              </Select>

              <Select
                label="دسته‌بندی موضوعی"
                error={errors.categoryId?.message}
                {...register('categoryId')}
              >
                <option value="">انتخاب دسته‌بندی...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>

            <Input
              label="شرح کامل تراکنش (بابت)"
              placeholder="مثال: خرید مایع دستشویی و ملزومات آبدارخانه"
              error={errors.description?.message}
              {...register('description')}
            />

            <Input
              label="برچسب‌ها (با کاما جدا کنید)"
              placeholder="مثال: ملزومات, بهداشتی, اداری"
              error={errors.tags?.message}
              {...register('tags')}
            />

            {/* File Upload attachments */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                پیوست فایل‌ها و اسناد مثبته (حداکثر ۵ فایل)
              </label>
              <Controller
                name="attachments"
                control={control}
                render={({ field }) => (
                  <FileUpload
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsOpen(false)}>انصراف</Button>
              <Button type="submit" variant="primary">ثبت سند</Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
