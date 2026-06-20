import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { fileService } from '../services/fileService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema } from '../schemas/auth';
import { User, Lock, KeyRound, AlertTriangle, LogOut, Trash2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const navigate = useNavigate();
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      avatar: user?.avatar || '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = fileService.validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    try {
      const base64 = await fileService.fileToBase64(file);
      setAvatarPreview(base64);
      setValue('avatar', base64);
      toast.success('تصویر پروفایل با موفقیت بارگذاری شد');
    } catch (err) {
      toast.error('خطا در پردازش تصویر پروفایل');
    }
  };

  const handleSaveProfile = async (data) => {
    try {
      // 1. Save general profile changes
      const profileUpdates = {
        fullName: data.fullName,
        avatar: data.avatar || user.avatar
      };
      updateProfile(profileUpdates);

      // 2. Check if password change is requested
      if (data.newPassword && data.newPassword.length > 0) {
        if (!data.currentPassword) {
          toast.error('وارد کردن رمز عبور فعلی برای تغییر رمز الزامی است');
          return;
        }
        await changePassword(data.currentPassword, data.newPassword);
        toast.success('پروفایل و رمز عبور شما با موفقیت بروزرسانی شد');
      } else {
        toast.success('پروفایل با موفقیت بروزرسانی شد');
      }
    } catch (err) {
      toast.error('خطا در بروزرسانی پروفایل: ' + err.message);
    }
  };

  const handleDeleteAccount = () => {
    try {
      const result = deleteAccount();
      if (result) {
        toast.success('حساب کاربری شما با موفقیت حذف شد');
        navigate('/wizard');
      }
    } catch (err) {
      toast.error('خطا در حذف حساب: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 text-right">
      
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">پروفایل من</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">مدیریت اطلاعات کاربری، آپلود تصویر پروفایل و تنظیمات امنیتی رمز عبور</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card & Avatar */}
        <Card className="border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center py-8">
          <CardContent className="space-y-4">
            
            <div className="relative group mx-auto w-24 h-24">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-100 dark:border-slate-750 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#1e40af] to-indigo-600 text-white flex items-center justify-center font-black text-4xl shadow-md">
                  {user?.fullName?.charAt(0) || 'م'}
                </div>
              )}
              
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 left-0 bg-[#1e40af] text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-indigo-700 transition-colors"
                title="تغییر عکس پروفایل"
              >
                <Camera className="h-4 w-4" />
              </label>
              <input 
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-950 dark:text-white">{user?.fullName}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold font-sans">@{user?.username}</p>
            </div>

            <div className="pt-2">
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/20 text-[#1e40af] dark:text-blue-400 text-xs font-bold rounded-full">
                نقش: {
                  user?.role === 'owner' ? 'مالک سیستم' : user?.role === 'admin' ? 'مدیر سیستم' : user?.role === 'accountant' ? 'حسابدار' : 'مشاهده‌گر'
                }
              </span>
            </div>

          </CardContent>
        </Card>

        {/* Edit Form Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm">ویرایش اطلاعات پروفایل</CardTitle>
              <CardDescription>جهت تغییر رمز عبور، بخش دوم را با دقت پر کنید.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleSaveProfile)} className="space-y-6 text-right">
                
                {/* General Settings */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#1e40af] dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>مشخصات عمومی</span>
                  </h3>
                  
                  <Input
                    label="نام کامل و نام خانوادگی"
                    placeholder="مثال: رضا کریمی"
                    error={errors.fullName?.message}
                    {...register('fullName')}
                  />
                </div>

                {/* Password Settings */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#1e40af] dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>امنیت و تغییر رمز عبور (اختیاری)</span>
                  </h3>
                  
                  <Input
                    label="رمز عبور فعلی (جهت تایید تغییر رمز)"
                    type="password"
                    placeholder="••••••"
                    error={errors.currentPassword?.message}
                    {...register('currentPassword')}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="رمز عبور جدید"
                      type="password"
                      placeholder="••••••"
                      error={errors.newPassword?.message}
                      {...register('newPassword')}
                    />
                    <Input
                      label="تکرار رمز عبور جدید"
                      type="password"
                      placeholder="••••••"
                      error={errors.confirmNewPassword?.message}
                      {...register('confirmNewPassword')}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsDeleteOpen(true)}
                    className="text-xs font-bold text-rose-650 hover:text-rose-700 hover:underline flex items-center space-x-1.5 space-x-reverse text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>لغو عضویت و حذف حساب من</span>
                  </button>

                  <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto font-bold text-xs">
                    ذخیره تغییرات پروفایل
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogHeader onOpenChange={setIsDeleteOpen}>
          <DialogTitle className="text-rose-650 flex items-center gap-2 text-rose-650 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
            <span>هشدار بسیار مهم امنیتی!</span>
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed text-right">
            <p>شما در حال حذف کامل حساب کاربری خود از سامانه مالی هستید. با تایید این عمل:</p>
            <ul className="list-disc list-inside mr-4 space-y-1.5 text-rose-800 dark:text-rose-400">
              <li>کلیه دسترسی‌های شما به فایل‌ها و فضای کاری مسدود می‌گردد.</li>
              <li>در صورت عدم وجود مدیر دیگر در کل پایگاه داده، سیستم مجددا به صفحه راه‌اندازی اولیه منتقل می‌شود.</li>
            </ul>
            <p>آیا از انجام لغو دائم عضویت اطمینان دارید؟</p>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>خیر، انصراف</Button>
            <Button variant="danger" onClick={handleDeleteAccount}>بله، حساب من حذف شود</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
