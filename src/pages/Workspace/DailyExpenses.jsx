import React, { useEffect, useState, useContext } from 'react';
import { db } from '../../services/db';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { DatePicker } from '../../components/ui/datePicker';
import { FileUpload } from '../../components/ui/fileUpload';
import { formatCurrency, toPersianNumbers } from '../../lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dailyExpenseSchema } from '../../schemas/employee';
import { Plus, Wallet, FileText, Download, Trash2, Paperclip } from 'lucide-react';
import { toast } from 'sonner';

export default function DailyExpenses() {
  const { activeWorkspace } = useContext(WorkspaceContext);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(dailyExpenseSchema),
    defaultValues: {
      date: '1404/10/25',
      description: '',
      amount: 0,
      currency: 'AFN',
      categoryId: '',
      employeeId: '',
      attachments: []
    }
  });

  const loadExpenses = () => {
    if (!activeWorkspace) return;
    setExpenses(db.getAll('dailyExpenses'));
    setCategories(db.getAll('categories', c => c.type === 'expense'));
    setEmployees(db.getAll('employees', e => e.isActive));
  };

  useEffect(() => {
    loadExpenses();
  }, [activeWorkspace]);

  const handleOpenAdd = () => {
    reset({
      date: '1404/10/25',
      description: '',
      amount: 0,
      currency: activeWorkspace?.currency || 'AFN',
      categoryId: categories[0]?.id || '',
      employeeId: employees[0]?.id || '',
      attachments: []
    });
    setIsOpen(true);
  };

  const handleSave = (data) => {
    try {
      // 1. Insert into Daily Expenses
      const payload = {
        ...data,
        attachments: data.attachments || []
      };
      
      const newExpense = db.insert('dailyExpenses', payload);

      // 2. Automatically seed this to the main Transactions ledger as APPROVED petty cash
      const defaultAccount = db.getAll('accounts', a => a.isDefault)[0] || db.getAll('accounts')[0];
      const employeeName = employees.find(e => e.id === data.employeeId)?.name || 'پرسنل';

      db.insert('transactions', {
        amount: data.amount,
        currency: data.currency,
        type: 'expense',
        accountId: defaultAccount ? defaultAccount.id : 'acc-1',
        categoryId: data.categoryId,
        date: data.date,
        description: `${data.description} (هزینه تنخواه‌گردان توسط: ${employeeName})`,
        tags: ['تنخواه', 'هزینه روزمره'],
        status: 'approved', // automatic approval for daily petty cash
        approvedBy: 'سیستم خودکار',
        approvedAt: new Date().toISOString(),
        attachments: data.attachments || []
      });

      toast.success('هزینه روزمره با موفقیت ثبت شد و سند متناظر در دفاتر کل تایید گردید');
      setIsOpen(false);
      loadExpenses();
    } catch (err) {
      toast.error('خطا در ثبت هزینه: ' + err.message);
    }
  };

  const handleDelete = (id) => {
    if (confirm('آیا از حذف این سند هزینه تنخواه اطمینان دارید؟ اسناد متناظر در دفاتر کل حذف نخواهند شد.')) {
      db.delete('dailyExpenses', id);
      toast.success('سند تنخواه حذف شد');
      loadExpenses();
    }
  };

  return (
    <div className="space-y-6 text-right">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">هزینه‌های روزمره و تنخواه</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">ثبت خریدهای خرد، هزینه‌های جاری شرکت و اسناد پرداخت شده از صندوق تنخواه‌گردان پرسنل</p>
        </div>
        
        <Button onClick={handleOpenAdd} className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold">
          <Plus className="h-4 w-4" />
          <span>ثبت هزینه جدید</span>
        </Button>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-semibold space-y-4">
              <p>هزینه‌ای در دفتر تنخواه ثبت نشده است</p>
              <Button variant="outline" size="sm" onClick={handleOpenAdd}>ثبت اولین هزینه تنخواه</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>شرح هزینه</TableHead>
                  <TableHead>دسته‌بندی</TableHead>
                  <TableHead>کارمند پرداخت کننده</TableHead>
                  <TableHead>مبلغ کل</TableHead>
                  <TableHead className="w-24 text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((item) => {
                  const cat = categories.find(c => c.id === item.categoryId);
                  const emp = employees.find(e => e.id === item.employeeId);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-sans text-xs font-semibold">{item.date}</TableCell>
                      <TableCell className="font-bold text-xs">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="truncate max-w-[200px]">{item.description}</span>
                          {item.attachments && item.attachments.length > 0 && (
                            <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" title="دارای رسید پیوست" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-slate-400" style={{ backgroundColor: cat?.color }}>
                          {cat ? cat.name : 'نامشخص'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{emp ? emp.name : 'نامشخص'}</TableCell>
                      <TableCell className="font-sans font-bold text-xs text-[#991b1b]">
                        {formatCurrency(item.amount, item.currency)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                          {item.attachments && item.attachments[0] && (
                            <a 
                              href={item.attachments[0].base64}
                              download={item.attachments[0].name}
                              className="p-1 text-[#1e40af] hover:bg-blue-50 rounded"
                              title="دانلود فاکتور/رسید خرید"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-rose-650"
                            title="حذف سند"
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
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
          <DialogTitle>ثبت سند هزینه تنخواه‌گردان جدید</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4 text-right">
            
            <Input
              label="شرح هزینه (مثال: خرید ملزومات بهداشتی)"
              placeholder="بابت خرید..."
              error={errors.description?.message}
              {...register('description')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="مبلغ کل هزینه"
                type="number"
                placeholder="0"
                error={errors.amount?.message}
                {...register('amount')}
              />

              <Select
                label="ارز فاکتور"
                error={errors.currency?.message}
                {...register('currency')}
              >
                <option value="AFN">افغانی (AFN)</option>
                <option value="USD">دلار (USD)</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="کارمند مسئول تنخواه"
                error={errors.employeeId?.message}
                {...register('employeeId')}
              >
                <option value="">انتخاب کارمند...</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.position})</option>
                ))}
              </Select>

              <Select
                label="دسته‌بندی مخارج"
                error={errors.categoryId?.message}
                {...register('categoryId')}
              >
                <option value="">انتخاب دسته‌بندی...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1">
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="تاریخ فاکتور / خرید (جلالی)"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.date?.message}
                  />
                )}
              />
            </div>

            {/* File Upload attachments */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                پیوست تصویر قبض / فاکتور خرید تنخواه
              </label>
              <Controller
                name="attachments"
                control={control}
                render={({ field }) => (
                  <FileUpload
                    value={field.value}
                    onChange={field.onChange}
                    maxFiles={2}
                  />
                )}
              />
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsOpen(false)}>انصراف</Button>
              <Button type="submit" variant="primary">ثبت سند تنخواه</Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
