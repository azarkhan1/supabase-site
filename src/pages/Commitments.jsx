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
import { commitmentSchema, paymentSchema } from '../schemas/commitment';
import { 
  Plus, Calendar, Phone, FileText, CheckCircle2, 
  Clock, AlertTriangle, Coins, PlusCircle, Trash2, ArrowLeftRight 
} from 'lucide-react';
import { toast } from 'sonner';

export default function Commitments() {
  const { activeWorkspace } = useContext(WorkspaceContext);
  const [commitments, setCommitments] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState(null);

  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Main Commitment Form
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(commitmentSchema),
    defaultValues: {
      title: '',
      type: 'بدهی',
      contactName: '',
      contactPhone: '',
      totalAmount: 0,
      currency: 'AFN',
      dueDate: '1404/10/25',
      description: ''
    }
  });

  // Payment Form
  const {
    control: paymentControl,
    register: registerPayment,
    handleSubmit: handlePaymentSubmit,
    reset: resetPayment,
    formState: { errors: paymentErrors }
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      date: '1404/10/25',
      note: ''
    }
  });

  const loadCommitments = () => {
    if (!activeWorkspace) return;
    
    const allCommitments = db.getAll('commitments');
    const allPayments = db.getAll('payments');
    const todayStr = '1404/10/25'; // Simulated today date for Persian system consistency

    const list = allCommitments.map(com => {
      const payments = allPayments.filter(p => p.commitmentId === com.id);
      const paid = payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = com.totalAmount - paid;
      
      let status = 'pending';
      if (paid === com.totalAmount) {
        status = 'settled';
      } else if (paid > 0 && remaining > 0) {
        status = 'partial';
      } else if (remaining > 0 && com.dueDate < todayStr) {
        status = 'overdue';
      }

      return {
        ...com,
        paidAmount: paid,
        remainingAmount: remaining,
        status,
        payments
      };
    });

    // Apply Filter
    let filtered = list;
    if (filterType) {
      filtered = filtered.filter(c => c.type === filterType);
    }
    if (filterStatus) {
      filtered = filtered.filter(c => c.status === filterStatus);
    }

    setCommitments(filtered);
  };

  useEffect(() => {
    loadCommitments();
  }, [activeWorkspace, filterType, filterStatus]);

  const handleOpenAdd = () => {
    reset({
      title: '',
      type: 'بدهی',
      contactName: '',
      contactPhone: '',
      totalAmount: 0,
      currency: activeWorkspace?.currency || 'AFN',
      dueDate: '1404/10/25',
      description: ''
    });
    setIsOpen(true);
  };

  const handleSave = (data) => {
    try {
      db.insert('commitments', {
        ...data,
        attachments: []
      });
      toast.success('تعهد مالی جدید با موفقیت ثبت شد');
      setIsOpen(false);
      loadCommitments();
    } catch (err) {
      toast.error('خطا در ثبت تعهد: ' + err.message);
    }
  };

  const handleOpenPayment = (com) => {
    setSelectedCommitment(com);
    resetPayment({
      amount: com.remainingAmount,
      date: '1404/10/25',
      note: `قسط بابت تعهد ${com.title}`
    });
    setIsPaymentOpen(true);
  };

  const handleSavePayment = (data) => {
    try {
      if (data.amount > selectedCommitment.remainingAmount) {
        toast.error('مبلغ پرداختی نمی‌تواند بیشتر از مابه التفاوت تعهد باشد');
        return;
      }

      // Add payment entry
      const newPay = db.insert('payments', {
        commitmentId: selectedCommitment.id,
        amount: data.amount,
        date: data.date,
        note: data.note,
        attachment: null
      });

      // Automatically materialize this payment as an APPROVED transaction in the ledgers
      const defaultAccount = db.getAll('accounts', a => a.isDefault)[0] || db.getAll('accounts')[0];
      
      db.insert('transactions', {
        amount: data.amount,
        currency: selectedCommitment.currency,
        type: selectedCommitment.type === 'بدهی' ? 'expense' : 'income',
        accountId: defaultAccount ? defaultAccount.id : 'acc-1',
        categoryId: 'cat-8', // default to "other" category
        date: data.date,
        description: `تسویه/قسط تعهد: ${selectedCommitment.title} (${data.note || ''})`,
        tags: ['تعهدات', selectedCommitment.type],
        status: 'approved',
        approvedBy: 'مدیر سیستم',
        approvedAt: new Date().toISOString(),
        attachments: []
      });

      toast.success('قسط پرداخت ثبت گردید و تراکنش مالی متناظر صادر شد');
      setIsPaymentOpen(false);
      loadCommitments();
    } catch (err) {
      toast.error('خطا در ثبت پرداخت: ' + err.message);
    }
  };

  const handleDelete = (id) => {
    if (confirm('آیا از حذف این تعهد مالی اطمینان دارید؟ تمامی تاریخچه پرداخت‌ها حذف خواهد شد.')) {
      db.delete('commitments', id);
      const payments = db.getAll('payments', p => p.commitmentId === id);
      payments.forEach(p => db.delete('payments', p.id));
      
      toast.success('تعهد مالی با موفقیت حذف شد');
      loadCommitments();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'settled':
        return <Badge variant="success">تسویه شده</Badge>;
      case 'partial':
        return <Badge variant="warning">تسویه بخشی</Badge>;
      case 'overdue':
        return <Badge variant="danger">معوق/سررسید گذشته</Badge>;
      case 'pending':
        return <Badge variant="info">در انتظار پرداخت</Badge>;
      default:
        return <Badge>نامشخص</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Title & Actions */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">تعهدات مالی (بدهی و طلب‌ها)</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">پیگیری مطالبات از مشتریان و بدهی به تامین‌کنندگان و شرکا</p>
        </div>
        
        <Button onClick={handleOpenAdd} className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold">
          <Plus className="h-4 w-4" />
          <span>ثبت تعهد جدید</span>
        </Button>
      </div>

      {/* Quick Filters */}
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardContent className="py-4 flex flex-wrap gap-4 text-right">
          <div className="w-full sm:w-44">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">نوع تعهد</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:border-[#1e40af] focus:outline-none"
            >
              <option value="">همه انواع</option>
              <option value="بدهی">بدهی ما (پرداختی)</option>
              <option value="طلب">طلب ما (دریافتی)</option>
            </select>
          </div>

          <div className="w-full sm:w-44">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">وضعیت پرداخت</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:border-[#1e40af] focus:outline-none"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="pending">در انتظار پرداخت</option>
              <option value="partial">تسویه بخشی</option>
              <option value="settled">تسویه شده</option>
              <option value="overdue">معوق/سررسید گذشته</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Commitments */}
      {commitments.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <p>تعهد مالی در دسترسی یافت نشد</p>
          <Button variant="outline" size="sm" onClick={handleOpenAdd}>ایجاد اولین تعهد</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {commitments.map((com) => (
            <Card key={com.id} className="border border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden">
              <div className="p-6">
                
                {/* Top header */}
                <div className="flex justify-between items-start flex-wrap gap-2 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                        com.type === 'بدهی' ? 'bg-[#991b1b]' : 'bg-[#166534]'
                      }`}>
                        {com.type}
                      </span>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white">{com.title}</h2>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      مخاطب: {com.contactName} {com.contactPhone && `(${com.contactPhone})`}
                    </p>
                  </div>
                  
                  <div>{getStatusBadge(com.status)}</div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 my-4">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-500">مجموع پرداختی: {formatCurrency(com.paidAmount, com.currency)}</span>
                    <span className="text-slate-800 dark:text-slate-200">مجموع تعهد: {formatCurrency(com.totalAmount, com.currency)}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        com.type === 'بدهی' ? 'bg-[#991b1b]' : 'bg-[#166534]'
                      }`} 
                      style={{ width: `${Math.min((com.paidAmount / com.totalAmount) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300 py-3 my-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[9px] text-slate-500">سررسید پرداخت:</p>
                      <p className="font-sans font-bold mt-0.5">{com.dueDate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Coins className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[9px] text-slate-500">مانده تسویه نشده:</p>
                      <p className="font-sans font-bold mt-0.5 text-[#1e40af] dark:text-blue-400">
                        {formatCurrency(com.remainingAmount, com.currency)}
                      </p>
                    </div>
                  </div>
                </div>

                {com.description && (
                  <p className="text-xs text-slate-500 leading-relaxed mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {com.description}
                  </p>
                )}

                {/* Payments Table history */}
                {com.payments && com.payments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">تاریخچه اقساط پرداخت شده:</h3>
                    <div className="max-h-28 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-lg">
                      <table className="w-full text-right text-[10px] border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold sticky top-0">
                          <tr>
                            <th className="p-1.5">تاریخ پرداخت</th>
                            <th className="p-1.5">شرح</th>
                            <th className="p-1.5 text-left">مبلغ پرداختی</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {com.payments.map((p) => (
                            <tr key={p.id}>
                              <td className="p-1.5 font-sans">{p.date}</td>
                              <td className="p-1.5 text-slate-500">{p.note || 'بدون توضیح'}</td>
                              <td className="p-1.5 text-left font-sans font-bold text-slate-900 dark:text-white">
                                {formatCurrency(p.amount, com.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              {/* Actions footer */}
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
                <button
                  onClick={() => handleDelete(com.id)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1 space-x-reverse"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>حذف تعهد</span>
                </button>

                {com.status !== 'settled' && (
                  <Button 
                    onClick={() => handleOpenPayment(com)}
                    size="sm" 
                    className="flex items-center space-x-1 space-x-reverse text-[10px] font-bold"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>ثبت قسط / پرداخت جدید</span>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Commitment Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogHeader onOpenChange={setIsOpen}>
          <DialogTitle>ثبت تعهد مالی جدید (بدهی/طلب)</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4 text-right">
            
            <Input
              label="عنوان تعهد"
              placeholder="مثال: خرید ملزومات اداری کامپیوتری"
              error={errors.title?.message}
              {...register('title')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="نوع تعهد"
                error={errors.type?.message}
                {...register('type')}
              >
                <option value="بدهی">بدهی ما (پرداختی)</option>
                <option value="طلب">طلب ما (دریافتی)</option>
              </Select>

              <Select
                label="ارز تعهد"
                error={errors.currency?.message}
                {...register('currency')}
              >
                <option value="AFN">افغانی (AFN)</option>
                <option value="USD">دلار (USD)</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="مبلغ کل تعهد"
                type="number"
                placeholder="0"
                error={errors.totalAmount?.message}
                {...register('totalAmount')}
              />
              
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="تاریخ سررسید نهایی"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.dueDate?.message}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="نام طرف حساب (شخص/شرکت)"
                placeholder="مثال: مهندس حسینی"
                error={errors.contactName?.message}
                {...register('contactName')}
              />
              
              <Input
                label="شماره تماس مخاطب"
                placeholder="مثال: ۰۷۹۹۱۲۳۴۵۶"
                error={errors.contactPhone?.message}
                {...register('contactPhone')}
              />
            </div>

            <Input
              label="توضیحات تکمیلی"
              placeholder="شرح جزئیات نحوه تسویه یا اقساط تعهد..."
              error={errors.description?.message}
              {...register('description')}
            />

            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsOpen(false)}>انصراف</Button>
              <Button type="submit" variant="primary">ذخیره تعهد</Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogHeader onOpenChange={setIsPaymentOpen}>
          <DialogTitle>ثبت قسط / بازپرداخت تعهد مالی</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handlePaymentSubmit(handleSavePayment)} className="space-y-4 text-right">
            
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1">
              <p>تعهد جاری: <span className="font-bold text-slate-950 dark:text-white">{selectedCommitment?.title}</span></p>
              <p>مبلغ کل تعهد: <span className="font-sans font-bold">{selectedCommitment && formatCurrency(selectedCommitment.totalAmount, selectedCommitment.currency)}</span></p>
              <p>مابه‌التفاوت مانده: <span className="font-sans font-bold text-[#1e40af] dark:text-blue-400">{selectedCommitment && formatCurrency(selectedCommitment.remainingAmount, selectedCommitment.currency)}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="مبلغ پرداختی این قسط"
                type="number"
                placeholder="0"
                error={paymentErrors.amount?.message}
                {...registerPayment('amount')}
              />

              <Controller
                name="date"
                control={paymentControl}
                render={({ field }) => (
                  <DatePicker
                    label="تاریخ پرداخت قسط"
                    value={field.value}
                    onChange={field.onChange}
                    error={paymentErrors.date?.message}
                  />
                )}
              />
            </div>

            <Input
              label="توضیحات قسط (بابت)"
              placeholder="مثال: پرداخت قسط اول ماه دی"
              error={paymentErrors.note?.message}
              {...registerPayment('note')}
            />

            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsPaymentOpen(false)}>انصراف</Button>
              <Button type="submit" variant="success">ثبت قسط و کسر از مانده</Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
