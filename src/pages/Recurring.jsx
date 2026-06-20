import React, { useEffect, useState, useContext } from 'react';
import { db } from '../services/db';
import { WorkspaceContext } from '../contexts/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { DatePicker } from '../components/ui/datePicker';
import { formatCurrency, toPersianNumbers } from '../lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ToggleLeft, ToggleRight, Play, Trash2, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';

const recurringSchema = z.object({
  name: z.string().min(3, 'نام الگو باید حداقل ۳ کاراکتر باشد'),
  amount: z.preprocess((val) => Number(val), z.number({
    invalid_type_error: 'مبلغ باید یک عدد باشد'
  }).positive('مبلغ باید بیشتر از صفر باشد')),
  currency: z.enum(['AFN', 'USD']),
  type: z.enum(['income', 'expense']),
  accountId: z.string().min(1, 'انتخاب حساب الزامی است'),
  categoryId: z.string().min(1, 'انتخاب دسته‌بندی الزامی است'),
  frequency: z.enum(['روزانه', 'هفتگی', 'ماهانه', 'سالانه']),
  startDate: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, 'تاریخ شروع کار باید در قالب سال/ماه/روز باشد'),
  nextRunDate: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, 'تاریخ اجرای بعدی باید در قالب سال/ماه/روز باشد'),
  description: z.string().optional().or(z.literal(''))
});

export default function Recurring() {
  const { activeWorkspace } = useContext(WorkspaceContext);
  const [recurringRules, setRecurringRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      name: '',
      amount: 0,
      currency: 'AFN',
      type: 'expense',
      accountId: '',
      categoryId: '',
      frequency: 'ماهانه',
      startDate: '1404/10/01',
      nextRunDate: '1404/11/01',
      description: ''
    }
  });

  const loadRules = () => {
    if (!activeWorkspace) return;
    setRecurringRules(db.getAll('recurring'));
    setAccounts(db.getAll('accounts'));
    setCategories(db.getAll('categories'));
  };

  useEffect(() => {
    loadRules();
  }, [activeWorkspace]);

  const handleOpenAdd = () => {
    const defaultAcc = accounts.find(a => a.isDefault)?.id || (accounts[0]?.id || '');
    reset({
      name: '',
      amount: 0,
      currency: activeWorkspace?.currency || 'AFN',
      type: 'expense',
      accountId: defaultAcc,
      categoryId: categories[0]?.id || '',
      frequency: 'ماهانه',
      startDate: '1404/10/01',
      nextRunDate: '1404/11/01',
      description: ''
    });
    setIsOpen(true);
  };

  const handleSave = (data) => {
    try {
      db.insert('recurring', {
        ...data,
        isActive: true
      });
      toast.success('قاعده تراکنش دوره‌ای جدید با موفقیت اضافه شد');
      setIsOpen(false);
      loadRules();
    } catch (err) {
      toast.error('خطا در ثبت تراکنش دوره‌ای: ' + err.message);
    }
  };

  const handleToggleActive = (rule) => {
    const updated = db.update('recurring', rule.id, { isActive: !rule.isActive });
    if (updated) {
      toast.success(rule.isActive ? 'تراکنش دوره‌ای با موفقیت متوقف شد' : 'تراکنش دوره‌ای با موفقیت فعال شد');
      loadRules();
    }
  };

  const handleDelete = (id) => {
    if (confirm('آیا از حذف این تراکنش دوره‌ای اطمینان دارید؟ اسناد تولید شده قبلی حذف نخواهند شد.')) {
      db.delete('recurring', id);
      toast.success('الگو با موفقیت حذف شد');
      loadRules();
    }
  };

  // Helper calculation to run/materialize recurring rules immediately
  const handleForceRun = (rule) => {
    try {
      // Create transaction in ledgers
      db.insert('transactions', {
        amount: rule.amount,
        currency: rule.currency,
        type: rule.type,
        accountId: rule.accountId,
        categoryId: rule.categoryId,
        date: rule.nextRunDate,
        description: `${rule.name} (اجرای خودکار دوره‌ای - دستی)`,
        tags: ['دوره‌ای', rule.frequency],
        status: 'approved',
        approvedBy: 'سیستم',
        approvedAt: new Date().toISOString(),
        attachments: []
      });

      // Advance nextRunDate (simplified helper adding a month/week etc.)
      const parts = rule.nextRunDate.split('/');
      let year = parseInt(parts[0]);
      let month = parseInt(parts[1]);
      let day = parseInt(parts[2]);

      if (rule.frequency === 'روزانه') {
        day += 1;
      } else if (rule.frequency === 'هفتگی') {
        day += 7;
      } else if (rule.frequency === 'ماهانه') {
        month += 1;
      } else if (rule.frequency === 'سالانه') {
        year += 1;
      }

      // Check overflow
      if (day > 30) {
        day = 1;
        month += 1;
      }
      if (month > 12) {
        month = 1;
        year += 1;
      }

      const nextDateStr = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
      db.update('recurring', rule.id, { nextRunDate: nextDateStr });
      
      toast.success('سند مالی با موفقیت صادر شد و سررسید بعدی بروزرسانی گردید');
      loadRules();
    } catch (err) {
      toast.error('خطا در اجرای دستی: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 text-right">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">تراکنش‌های دوره‌ای خودکار</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">تعریف قواعد تولید اتوماتیک اسناد مالی مانند حقوق، اجاره، و سرویس‌های اشتراکی</p>
        </div>
        
        <Button onClick={handleOpenAdd} className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold">
          <Plus className="h-4 w-4" />
          <span>افزودن الگوی جدید</span>
        </Button>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          {recurringRules.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-semibold space-y-4">
              <p>هیچ قاعده دوره‌ای ثبت نشده است</p>
              <Button variant="outline" size="sm" onClick={handleOpenAdd}>تعریف اولین الگوی دوره‌ای</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان الگو</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>نوع</TableHead>
                  <TableHead>حساب و دسته</TableHead>
                  <TableHead>فرکانس تکرار</TableHead>
                  <TableHead>اجرای بعدی</TableHead>
                  <TableHead className="text-center">وضعیت</TableHead>
                  <TableHead className="w-28 text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringRules.map((rule) => {
                  const acc = accounts.find(a => a.id === rule.accountId);
                  const cat = categories.find(c => c.id === rule.categoryId);
                  return (
                    <TableRow key={rule.id}>
                      <TableCell className="font-bold text-xs">{rule.name}</TableCell>
                      <TableCell className="font-sans font-bold text-xs">
                        {formatCurrency(rule.amount, rule.currency)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {rule.type === 'income' ? (
                          <span className="text-[#166534] dark:text-emerald-400 font-bold">دریافت (درآمد)</span>
                        ) : (
                          <span className="text-[#991b1b] dark:text-rose-400 font-bold">پرداخت (هزینه)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{acc ? acc.name : 'نامشخص'}</p>
                          <p className="text-[10px] text-slate-400">{cat ? cat.name : 'نامشخص'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-600 dark:text-slate-400">هر {rule.frequency}</TableCell>
                      <TableCell className="font-sans text-xs font-bold text-[#854d0e]">{rule.nextRunDate}</TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleToggleActive(rule)}
                          className="focus:outline-none inline-flex items-center justify-center"
                        >
                          {rule.isActive ? (
                            <ToggleRight className="h-7 w-7 text-[#1e40af] dark:text-blue-400" />
                          ) : (
                            <ToggleLeft className="h-7 w-7 text-slate-450 dark:text-slate-600" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1 space-x-reverse">
                          <button
                            onClick={() => handleForceRun(rule)}
                            className="p-1 text-[#166534] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded"
                            title="صدور سند و فورس نوبت بعدی"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            className="p-1 text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-rose-600"
                            title="حذف الگو"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogHeader onOpenChange={setIsOpen}>
          <DialogTitle>تعریف قاعده تراکنش دوره‌ای جدید</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4 text-right">
            
            <Input
              label="عنوان الگو (مثال: حقوق پرسنل)"
              placeholder="شرح کوتاه برای سندهای صادره"
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="نوع تراکنش"
                error={errors.type?.message}
                {...register('type')}
              >
                <option value="expense">هزینه (پرداخت)</option>
                <option value="income">درآمد (دریافت)</option>
              </Select>

              <Select
                label="ارز الگو"
                error={errors.currency?.message}
                {...register('currency')}
              >
                <option value="AFN">افغانی (AFN)</option>
                <option value="USD">دلار (USD)</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="مبلغ هر بار تراکنش"
                type="number"
                placeholder="0"
                error={errors.amount?.message}
                {...register('amount')}
              />

              <Select
                label="تناوب تکرار"
                error={errors.frequency?.message}
                {...register('frequency')}
              >
                <option value="روزانه">روزانه</option>
                <option value="هفتگی">هفتگی</option>
                <option value="ماهانه">ماهانه</option>
                <option value="سالانه">سالانه</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="تاریخ شروع اعمال دوره‌ای"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.startDate?.message}
                  />
                )}
              />

              <Controller
                name="nextRunDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="تاریخ اولین نوبت اجرا"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.nextRunDate?.message}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="حساب مالی برای واریز/برداشت"
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
              label="توضیحات پیش‌فرض"
              placeholder="توضیحات تکمیلی اسناد صادر شده..."
              error={errors.description?.message}
              {...register('description')}
            />

            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsOpen(false)}>انصراف</Button>
              <Button type="submit" variant="primary">ذخیره الگو</Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
