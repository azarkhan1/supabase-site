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
import { toPersianNumbers } from '../lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bell, Plus, BellRing, BellOff, Trash2, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';

const reminderSchema = z.object({
  title: z.string().min(3, 'عنوان یادآور باید حداقل ۳ کاراکتر باشد'),
  datetime: z.string().regex(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/, 'فرمت زمان باید سال/ماه/روز ساعت:دقیقه (مثال: ۱۴۰۴/۱۰/۲۵ ۱۲:۳۰) باشد'),
  description: z.string().optional().or(z.literal('')),
  linkedType: z.enum(['transaction', 'commitment', 'employee', 'none']),
  notifyBefore: z.enum(['5min', '1hour', '1day'])
});

export default function Reminders() {
  const { activeWorkspace } = useContext(WorkspaceContext);
  const [reminders, setReminders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: '',
      datetime: '1404/10/25 10:00',
      description: '',
      linkedType: 'none',
      notifyBefore: '1hour'
    }
  });

  const loadReminders = () => {
    if (!activeWorkspace) return;
    setReminders(db.getAll('reminders'));
  };

  useEffect(() => {
    loadReminders();

    // Browser Notification API Permission Check
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [activeWorkspace]);

  const handleOpenAdd = () => {
    reset({
      title: '',
      datetime: '1404/10/25 10:00',
      description: '',
      linkedType: 'none',
      notifyBefore: '1hour'
    });
    setIsOpen(true);
  };

  const handleSave = (data) => {
    try {
      db.insert('reminders', {
        ...data,
        isActive: true
      });
      toast.success('یادآور جدید با موفقیت برنامه‌ریزی شد');
      setIsOpen(false);
      loadReminders();
    } catch (err) {
      toast.error('خطا در ثبت یادآور: ' + err.message);
    }
  };

  const handleToggleActive = (rem) => {
    const updated = db.update('reminders', rem.id, { isActive: !rem.isActive });
    if (updated) {
      toast.success(rem.isActive ? 'یادآور غیرفعال شد' : 'یادآور مجدداً فعال شد');
      loadReminders();
    }
  };

  const handleDelete = (id) => {
    if (confirm('آیا از حذف این یادآور اطمینان دارید؟')) {
      db.delete('reminders', id);
      toast.success('یادآور حذف شد');
      loadReminders();
    }
  };

  return (
    <div className="space-y-6 text-right">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">مدیریت یادآورها و هشدارها</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">برنامه‌ریزی هشدار برای تعهدات مالی، جلسات حسابرسی یا پرداخت‌های مهم پرسنل</p>
        </div>
        
        <Button onClick={handleOpenAdd} className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold">
          <Plus className="h-4 w-4" />
          <span>برنامه‌ریزی یادآور جدید</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reminders.map((rem) => (
          <Card key={rem.id} className="relative overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className={`p-2 rounded-lg ${
                    rem.isActive ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' : 'bg-slate-550/20 text-slate-400'
                  }`}>
                    {rem.isActive ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white">{rem.title}</h2>
                    <p className="text-[9px] text-[#854d0e] font-sans font-bold mt-0.5">{rem.datetime}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleToggleActive(rem)}
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    rem.isActive 
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' 
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {rem.isActive ? 'فعال' : 'غیرفعال'}
                </button>
              </div>

              {rem.description && (
                <p className="text-xs text-slate-500 leading-relaxed min-h-12 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  {rem.description}
                </p>
              )}

              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>اطلاع‌رسانی: {
                  rem.notifyBefore === '5min' ? '۵ دقیقه قبل' : rem.notifyBefore === '1hour' ? '۱ ساعت قبل' : '۱ روز قبل'
                }</span>
                
                <button
                  onClick={() => handleDelete(rem.id)}
                  className="text-rose-600 hover:text-rose-700 flex items-center space-x-1 space-x-reverse"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>حذف یادآور</span>
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogHeader onOpenChange={setIsOpen}>
          <DialogTitle>برنامه‌ریزی هشدار / یادآور جدید</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4 text-right">
            
            <Input
              label="عنوان یادآور"
              placeholder="مثال: بررسی سررسید نهایی چک سابا"
              error={errors.title?.message}
              {...register('title')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="زمان اجرا (سال/ماه/روز ساعت:دقیقه)"
                placeholder="مثال: ۱۴۰۴/۱۰/۲۵ ۱۲:۳۰"
                error={errors.datetime?.message}
                {...register('datetime')}
              />

              <Select
                label="بازه پیش‌هشدار"
                error={errors.notifyBefore?.message}
                {...register('notifyBefore')}
              >
                <option value="5min">۵ دقیقه قبل از زمان</option>
                <option value="1hour">۱ ساعت قبل از زمان</option>
                <option value="1day">۱ روز قبل از زمان</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Select
                label="نوع ارتباط سیستمی"
                error={errors.linkedType?.message}
                {...register('linkedType')}
              >
                <option value="none">بدون ارتباط (یادداشت عمومی)</option>
                <option value="transaction">ارتباط با سند تراکنش</option>
                <option value="commitment">ارتباط با تعهد مالی (بدهی/طلب)</option>
                <option value="employee">ارتباط با پرونده کارمند</option>
              </Select>
            </div>

            <Input
              label="شرح یادداشت یادآور"
              placeholder="جزئیات تسویه، شماره پیگیری یا تلفن تماس که در هشدار نمایش یابد..."
              error={errors.description?.message}
              {...register('description')}
            />

            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsOpen(false)}>انصراف</Button>
              <Button type="submit" variant="primary">ذخیره هشدار</Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
