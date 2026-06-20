import React, { useEffect, useState, useContext } from 'react';
import { db } from '../services/db';
import { WorkspaceContext } from '../contexts/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { formatCurrency, toPersianNumbers } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, Edit, Trash2, CheckCircle2, Wallet, 
  Landmark, CreditCard, PiggyBank, DollarSign 
} from 'lucide-react';
import { toast } from 'sonner';

const accountSchema = z.object({
  name: z.string().min(2, 'نام حساب باید حداقل ۲ کاراکتر باشد'),
  type: z.enum(['بانک', 'کارت', 'صندوق', 'سرمایه‌گذاری']),
  initialBalance: z.preprocess((val) => Number(val), z.number({
    invalid_type_error: 'موجودی اولیه باید عدد باشد'
  }).min(0, 'موجودی نمی‌تواند منفی باشد')),
  currency: z.enum(['AFN', 'USD']),
  color: z.string().min(4, 'کد رنگ الزامی است'),
  icon: z.string().min(2, 'آیکون الزامی است'),
  isDefault: z.boolean().default(false)
});

export default function Accounts() {
  const { activeWorkspace } = useContext(WorkspaceContext);
  const [accounts, setAccounts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'بانک',
      initialBalance: 0,
      currency: 'AFN',
      color: '#1e40af',
      icon: 'Landmark',
      isDefault: false
    }
  });

  const loadAccounts = () => {
    if (!activeWorkspace) return;
    
    const allAccounts = db.getAll('accounts');
    const allTransactions = db.getAll('transactions');

    // Auto-calculate real-time balance
    const accountsWithBalances = allAccounts.map(acc => {
      const txs = allTransactions.filter(t => t.accountId === acc.id && t.status === 'approved');
      const sum = txs.reduce((tot, t) => {
        if (t.type === 'income') return tot + t.amount;
        return tot - t.amount;
      }, 0);
      
      return {
        ...acc,
        currentBalance: acc.initialBalance + sum
      };
    });

    setAccounts(accountsWithBalances);
  };

  useEffect(() => {
    loadAccounts();
  }, [activeWorkspace]);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    reset({
      name: '',
      type: 'بانک',
      initialBalance: 0,
      currency: activeWorkspace?.currency || 'AFN',
      color: '#1e40af',
      icon: 'Landmark',
      isDefault: false
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (acc) => {
    setEditingAccount(acc);
    reset({
      name: acc.name,
      type: acc.type,
      initialBalance: acc.initialBalance,
      currency: acc.currency,
      color: acc.color,
      icon: acc.icon,
      isDefault: acc.isDefault || false
    });
    setIsOpen(true);
  };

  const handleSave = (data) => {
    try {
      if (editingAccount) {
        // Edit flow
        db.update('accounts', editingAccount.id, data);
        
        // If set as default, unset other defaults
        if (data.isDefault) {
          const others = accounts.filter(a => a.id !== editingAccount.id && a.isDefault);
          others.forEach(o => db.update('accounts', o.id, { isDefault: false }));
        }
        
        toast.success('حساب مالی با موفقیت ویرایش شد');
      } else {
        // Add flow
        const newAcc = db.insert('accounts', data);
        
        // If set as default, unset other defaults
        if (data.isDefault) {
          const others = accounts.filter(a => a.isDefault);
          others.forEach(o => db.update('accounts', o.id, { isDefault: false }));
        }
        
        toast.success('حساب مالی جدید با موفقیت اضافه شد');
      }
      
      setIsOpen(false);
      loadAccounts();
    } catch (err) {
      toast.error('خطا در ذخیره‌سازی اطلاعات حساب: ' + err.message);
    }
  };

  const handleDelete = (acc) => {
    // Check if account has transactions
    const txs = db.getAll('transactions', t => t.accountId === acc.id);
    if (txs.length > 0) {
      toast.error('حساب دارای تراکنش است و قابل حذف نمی‌باشد. ابتدا تراکنش‌ها را انتقال دهید.');
      return;
    }

    if (confirm(`آیا از حذف حساب مالی "${acc.name}" اطمینان دارید؟`)) {
      db.delete('accounts', acc.id);
      toast.success('حساب مالی با موفقیت حذف شد');
      loadAccounts();
    }
  };

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'Wallet':
        return Wallet;
      case 'Landmark':
        return Landmark;
      case 'CreditCard':
        return CreditCard;
      case 'PiggyBank':
        return PiggyBank;
      default:
        return Wallet;
    }
  };

  return (
    <div className="space-y-6 text-right">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">مدیریت حساب‌های مالی</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">حساب‌های بانکی، کارت‌ها، صندوق نقدی و سرمایه‌گذاری‌ها</p>
        </div>
        <Button onClick={handleOpenAdd} className="flex items-center space-x-1 space-x-reverse text-xs font-bold">
          <Plus className="h-4 w-4" />
          <span>افزودن حساب جدید</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accounts.map((acc) => {
          const Icon = getIconComponent(acc.icon);
          return (
            <Card key={acc.id} className="relative overflow-hidden group border border-slate-200 dark:border-slate-800">
              <div className="absolute top-0 right-0 left-0 h-1.5" style={{ backgroundColor: acc.color }} />
              
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                    <Icon className="h-5 w-5" style={{ color: acc.color }} />
                  </div>
                  <div className="text-right">
                    <h2 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                      {acc.name}
                      {acc.isDefault && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" title="حساب پیش‌فرض" />
                      )}
                    </h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">{acc.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 space-x-reverse">
                  <button
                    onClick={() => handleOpenEdit(acc)}
                    className="p-1 text-slate-400 hover:text-[#1e40af] hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(acc)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="pt-2">
                <div className="flex justify-between items-end mt-4">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-500 font-bold">موجودی فعلی (کل):</p>
                    <p className="text-lg font-black font-sans text-slate-900 dark:text-white leading-none">
                      {formatCurrency(acc.currentBalance, acc.currency)}
                    </p>
                  </div>
                  
                  <div className="text-left text-[10px] text-slate-400 font-semibold font-sans space-y-0.5">
                    <p>موجودی اولیه: {toPersianNumbers(acc.initialBalance.toLocaleString())}</p>
                    <p>ارز: {acc.currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogHeader onOpenChange={setIsOpen}>
          <DialogTitle>{editingAccount ? 'ویرایش حساب مالی' : 'افزودن حساب مالی جدید'}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4 text-right">
            
            <Input
              label="نام حساب"
              placeholder="مثال: بانک ملی شعبه مرکزی"
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="نوع حساب"
                error={errors.type?.message}
                {...register('type')}
              >
                <option value="بانک">بانک</option>
                <option value="کارت">کارت بانکی</option>
                <option value="صندوق">صندوق نقدی</option>
                <option value="سرمایه‌گذاری">سرمایه‌گذاری</option>
              </Select>

              <Select
                label="ارز حساب"
                error={errors.currency?.message}
                {...register('currency')}
              >
                <option value="AFN">افغانی (AFN)</option>
                <option value="USD">دلار (USD)</option>
              </Select>
            </div>

            <Input
              label="موجودی اولیه حساب"
              type="number"
              placeholder="0"
              error={errors.initialBalance?.message}
              {...register('initialBalance')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="آیکون نمایش"
                error={errors.icon?.message}
                {...register('icon')}
              >
                <option value="Landmark">بانک (Landmark)</option>
                <option value="Wallet">صندوق/کیف‌پول (Wallet)</option>
                <option value="CreditCard">کارت بانکی (CreditCard)</option>
                <option value="PiggyBank">قلک/پس‌انداز (PiggyBank)</option>
              </Select>

              <Select
                label="رنگ تمایز حساب"
                error={errors.color?.message}
                {...register('color')}
              >
                <option value="#1e40af">آبی کلاسیک</option>
                <option value="#166534">سبز یشمی</option>
                <option value="#991b1b">قرمز جگری</option>
                <option value="#854d0e">خردلی</option>
                <option value="#7c3aed">بنفش</option>
                <option value="#db2777">صورتی</option>
              </Select>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse py-2">
              <input
                type="checkbox"
                id="isDefault"
                className="rounded border-slate-300 dark:border-slate-700 text-[#1e40af] focus:ring-[#1e40af] h-4 w-4"
                {...register('isDefault')}
              />
              <label htmlFor="isDefault" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                تنظیم به عنوان حساب پیش‌فرض شرکت
              </label>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsOpen(false)}>انصراف</Button>
              <Button type="submit" variant="primary">ذخیره حساب</Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
