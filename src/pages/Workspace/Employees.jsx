import React, { useEffect, useState, useContext } from 'react';
import { db } from '../../services/db';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { DatePicker } from '../../components/ui/datePicker';
import { formatCurrency, toPersianNumbers } from '../../lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeSchema } from '../../schemas/employee';
import { 
  Plus, Users, Briefcase, Phone, CreditCard, 
  Trash2, Edit, Award, Sparkles, CheckCircle2, XCircle 
} from 'lucide-react';
import { toast } from 'sonner';

export default function Employees() {
  const { activeWorkspace } = useContext(WorkspaceContext);
  const [employees, setEmployees] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  // Selected employee for detailed financial analysis card
  const [selectedEmp, setSelectedEmp] = useState(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      position: '',
      salary: 0,
      currency: 'AFN',
      startDate: '1404/10/01',
      phone: '',
      nationalId: '',
      avatar: '',
      isActive: true
    }
  });

  const loadEmployees = () => {
    if (!activeWorkspace) return;
    
    const allEmployees = db.getAll('employees');
    const allTransactions = db.getAll('transactions', t => t.status === 'approved');

    // Calculate total salary paid per employee
    const list = allEmployees.map(emp => {
      // Find transactions related to this employee's salary payments
      // Seed transactions contain tags like "حقوق" and descriptions containing employee name
      const salaryTxs = allTransactions.filter(t => 
        t.categoryId === 'cat-5' && t.description.includes(emp.name)
      );

      const totalPaid = salaryTxs.reduce((sum, t) => sum + t.amount, 0);

      return {
        ...emp,
        totalPaid,
        salaryCount: salaryTxs.length
      };
    });

    setEmployees(list);

    // Refresh selected employee detail card if active
    if (selectedEmp) {
      const refreshed = list.find(e => e.id === selectedEmp.id);
      setSelectedEmp(refreshed || null);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [activeWorkspace]);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    reset({
      name: '',
      position: '',
      salary: 0,
      currency: activeWorkspace?.currency || 'AFN',
      startDate: '1404/10/01',
      phone: '',
      nationalId: '',
      avatar: '',
      isActive: true
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    reset({
      name: emp.name,
      position: emp.position,
      salary: emp.salary,
      currency: emp.currency,
      startDate: emp.startDate,
      phone: emp.phone,
      nationalId: emp.nationalId,
      avatar: emp.avatar || '',
      isActive: emp.isActive
    });
    setIsOpen(true);
  };

  const handleSave = (data) => {
    try {
      if (editingEmployee) {
        db.update('employees', editingEmployee.id, data);
        toast.success('اطلاعات کارمند با موفقیت ویرایش شد');
      } else {
        db.insert('employees', data);
        toast.success('پرونده کارمند جدید با موفقیت ثبت شد');
      }
      setIsOpen(false);
      loadEmployees();
    } catch (err) {
      toast.error('خطا در ذخیره‌سازی اطلاعات: ' + err.message);
    }
  };

  const handleDelete = (emp) => {
    if (confirm(`آیا از حذف پرونده همکار "${emp.name}" اطمینان دارید؟ تاریخچه مالی حقوق‌های صادر شده حفظ خواهد شد.`)) {
      db.delete('employees', emp.id);
      toast.success('پرونده کارمند حذف شد');
      if (selectedEmp?.id === emp.id) {
        setSelectedEmp(null);
      }
      loadEmployees();
    }
  };

  // Pay Salary flow - automates financial ledger recording
  const handlePaySalary = (emp) => {
    try {
      const defaultAccount = db.getAll('accounts', a => a.isDefault)[0] || db.getAll('accounts')[0];
      
      if (!defaultAccount) {
        toast.error('هیچ حساب مالی فعالی در خزانه یافت نشد. ابتدا حساب بسازید.');
        return;
      }

      // Record transaction
      db.insert('transactions', {
        amount: emp.salary,
        currency: emp.currency,
        type: 'expense',
        accountId: defaultAccount.id,
        categoryId: 'cat-5', // Salary category
        date: '1404/10/25', // Simulated today date
        description: `پرداخت حقوق دی ماه کارمند: ${emp.name} (${emp.position})`,
        tags: ['حقوق', 'پرسنل'],
        status: 'approved',
        approvedBy: 'مدیر سیستم',
        approvedAt: new Date().toISOString(),
        attachments: []
      });

      toast.success(`حقوق ماه جاری برای ${emp.name} به مبلغ ${formatCurrency(emp.salary, emp.currency)} با موفقیت پرداخت و در دفتر کل ثبت شد.`);
      loadEmployees();
    } catch (err) {
      toast.error('خطا در ثبت پرداخت حقوق: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 text-right">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">مدیریت کارمندان و حقوق</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">تشکیل پرونده پرسنلی همکاران، ثبت سوابق استخدامی و واریز اتوماتیک حقوق ماهانه</p>
        </div>
        
        <Button onClick={handleOpenAdd} className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold">
          <Plus className="h-4 w-4" />
          <span>افزودن کارمند جدید</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left columns: Employees list */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm">پرونده پرسنلی همکاران فعال</CardTitle>
              <CardDescription>جهت مشاهده تحلیل مالی حقوق‌ها، روی نام کارمند کلیک کنید</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {employees.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 font-semibold space-y-4">
                  <p>پرونده پرسنلی ثبت نشده است</p>
                  <Button variant="outline" size="sm" onClick={handleOpenAdd}>ثبت اولین کارمند</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام همکار</TableHead>
                      <TableHead>سمت کاری</TableHead>
                      <TableHead>حقوق پایه</TableHead>
                      <TableHead className="text-center">وضعیت پرونده</TableHead>
                      <TableHead className="w-32 text-center">حقوق ماه جاری</TableHead>
                      <TableHead className="w-16 text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow 
                        key={emp.id}
                        onClick={() => setSelectedEmp(emp)}
                        className={`cursor-pointer ${selectedEmp?.id === emp.id ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''}`}
                      >
                        <TableCell className="font-bold text-xs">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-black text-xs shrink-0">
                              {emp.name.charAt(0)}
                            </div>
                            <span>{emp.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{emp.position}</TableCell>
                        <TableCell className="font-sans font-bold text-xs">{formatCurrency(emp.salary, emp.currency)}</TableCell>
                        <TableCell className="text-center">
                          {emp.isActive ? (
                            <Badge variant="success">شاغل</Badge>
                          ) : (
                            <Badge variant="danger">قطع همکاری</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          {emp.isActive ? (
                            <Button 
                              onClick={() => handlePaySalary(emp)}
                              size="sm" 
                              variant="success"
                              className="text-[10px] py-1 px-2 font-bold"
                            >
                              واریز حقوق
                            </Button>
                          ) : (
                            <span className="text-[10px] text-slate-455 font-semibold">غیرفعال</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center space-x-1 space-x-reverse">
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              className="p-1 text-slate-400 hover:text-[#1e40af] rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(emp)}
                              className="p-1 text-slate-450 hover:text-rose-650 rounded text-rose-650"
                            >
                              <Trash2 className="h-4 w-4 text-rose-600" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Employee Financial Card detail */}
        <div>
          {!selectedEmp ? (
            <Card className="border border-slate-200 dark:border-slate-800 text-center py-12 text-xs text-slate-500 font-semibold">
              <CardContent>
                جهت بررسی سوابق کامل استخدامی، واریزی‌های قبلی و پایش وضعیت مالی پرسنل، روی یکی از پرونده‌ها کلیک نمایید.
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-slate-200 dark:border-slate-800 space-y-4">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-sm">
                  {selectedEmp.name.charAt(0)}
                </div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white mt-3">{selectedEmp.name}</h2>
                <p className="text-[10px] text-[#1e40af] dark:text-blue-400 font-bold">{selectedEmp.position}</p>
              </CardHeader>
              <CardContent className="space-y-4 text-xs font-semibold text-slate-755 dark:text-slate-300">
                
                <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold">تلفن تماس:</p>
                    <p className="font-sans font-bold mt-0.5">{toPersianNumbers(selectedEmp.phone)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold">کد ملی/تذکره:</p>
                    <p className="font-sans font-bold mt-0.5">{toPersianNumbers(selectedEmp.nationalId)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold">شروع همکاری:</p>
                    <p className="font-sans font-bold mt-0.5">{selectedEmp.startDate}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold">حقوق پایه توافقی:</p>
                    <p className="font-sans font-bold mt-0.5 text-slate-950 dark:text-white">
                      {formatCurrency(selectedEmp.salary, selectedEmp.currency)}
                    </p>
                  </div>
                </div>

                {/* Financial payouts stats */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                  <h3 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>آمار پرداختی‌های حقوق:</span>
                  </h3>
                  <div className="flex justify-between">
                    <span className="text-slate-500">دفعات پرداخت شده:</span>
                    <span>{toPersianNumbers(selectedEmp.salaryCount)} مرتبه</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-100 dark:border-slate-800/50 pt-2 text-slate-950 dark:text-white">
                    <span>مجموع دریافتی کل:</span>
                    <span className="font-sans">{formatCurrency(selectedEmp.totalPaid, selectedEmp.currency)}</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          )}
        </div>

      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogHeader onOpenChange={setIsOpen}>
          <DialogTitle>{editingEmployee ? 'ویرایش پرونده کارمند' : 'ثبت پرونده کارمند جدید'}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4 text-right">
            
            <Input
              label="نام و نام خانوادگی کارمند"
              placeholder="مثال: احمد علوی"
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="سمت کاری (عنوان شغلی)"
                placeholder="مثال: طراح رابط کاربری"
                error={errors.position?.message}
                {...register('position')}
              />

              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="تاریخ شروع به کار (جلالی)"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.startDate?.message}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="مبلغ حقوق توافقی"
                type="number"
                placeholder="0"
                error={errors.salary?.message}
                {...register('salary')}
              />

              <Select
                label="ارز پرداختی حقوق"
                error={errors.currency?.message}
                {...register('currency')}
              >
                <option value="AFN">افغانی (AFN)</option>
                <option value="USD">دلار (USD)</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="شماره تماس معتبر"
                placeholder="مثال: ۰۷۹۹۱۲۳۴۵۶"
                error={errors.phone?.message}
                {...register('phone')}
              />

              <Input
                label="کد ملی / شماره تذکره"
                placeholder="مثال: ۱۲۳۴۵۶۷۸۹"
                error={errors.nationalId?.message}
                {...register('nationalId')}
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse py-2">
              <input
                type="checkbox"
                id="isActive"
                className="rounded border-slate-300 dark:border-slate-700 text-[#1e40af] focus:ring-[#1e40af] h-4 w-4"
                {...register('isActive')}
              />
              <label htmlFor="isActive" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                کارمند فعال و شاغل در سازمان است (وضعیت تایید حقوق فعال باشد)
              </label>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsOpen(false)}>انصراف</Button>
              <Button type="submit" variant="primary">ذخیره پرونده</Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
