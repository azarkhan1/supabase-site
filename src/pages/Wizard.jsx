import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../schemas/auth';
import { AuthContext } from '../contexts/AuthContext';
import { db, seedDatabase } from '../services/db';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Landmark, User, Lock, Building, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function Wizard() {
  const { hasUsers, setHasUsers } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // If we already have users, redirect to login
    const users = db.getAll('users');
    if (users.length > 0) {
      setHasUsers(true);
      navigate('/login');
    }
  }, [hasUsers, navigate, setHasUsers]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      companyName: '',
      currency: 'AFN'
    }
  });

  const onSubmit = async (data) => {
    try {
      // 1. Create Settings
      db.setRaw('settings', {
        companyName: data.companyName,
        logo: '',
        currency: data.currency,
        secondaryCurrency: data.currency === 'AFN' ? 'USD' : 'AFN',
        exchangeRate: 70,
        approvalRequired: true
      });

      // 2. Create the first Admin/Owner User
      const adminUser = {
        username: data.username,
        password: data.password,
        fullName: data.fullName,
        isAdmin: true,
        role: 'owner',
        plan: 'business',
        customPermissions: [],
        status: 'active',
        lastLogin: new Date().toISOString()
      };
      
      const insertedAdmin = db.insert('users', adminUser);

      // 3. Create the Workspace
      const workspace = db.insert('workspaces', {
        name: data.companyName,
        logo: '',
        currency: data.currency,
        secondaryCurrency: data.currency === 'AFN' ? 'USD' : 'AFN',
        exchangeRate: 70,
        fiscalYearStart: '01/01',
        isDefault: true
      });

      // 4. Create Workspace Member association
      db.insert('workspaceMembers', {
        workspaceId: workspace.id,
        userId: insertedAdmin.id,
        role: 'owner'
      });

      // 5. Seed default categories & accounts
      const defaultCategories = [
        { id: 'cat-1', name: 'خوراک', type: 'expense', color: '#e11d48', icon: 'Utensils' },
        { id: 'cat-2', name: 'حمل‌ونقل', type: 'expense', color: '#0284c7', icon: 'Car' },
        { id: 'cat-3', name: 'قبوض', type: 'expense', color: '#d97706', icon: 'FileText' },
        { id: 'cat-4', name: 'اجاره', type: 'expense', color: '#7c3aed', icon: 'Home' },
        { id: 'cat-5', name: 'حقوق', type: 'expense', color: '#16a34a', icon: 'DollarSign' },
        { id: 'cat-6', name: 'تفریح', type: 'expense', color: '#db2777', icon: 'Smile' },
        { id: 'cat-7', name: 'سلامت', type: 'expense', color: '#ea580c', icon: 'HeartPulse' },
        { id: 'cat-8', name: 'سایر', type: 'expense', color: '#4b5563', icon: 'Layers' },
        { id: 'cat-9', name: 'درآمد خدمات', type: 'income', color: '#16a34a', icon: 'TrendingUp' },
        { id: 'cat-10', name: 'سرمایه‌گذاری', type: 'income', color: '#2563eb', icon: 'TrendingUp' }
      ];
      db.setRaw('categories', defaultCategories);

      const defaultAccounts = [
        { id: 'acc-1', name: `صندوق ${data.currency}`, type: 'صندوق', initialBalance: 0, currency: data.currency, color: '#1e40af', icon: 'Wallet', isDefault: true }
      ];
      db.setRaw('accounts', defaultAccounts);

      // Save active workspace ID in localStorage
      localStorage.setItem('fms_active_workspace_id', workspace.id);

      toast.success('تنظیمات اولیه با موفقیت انجام شد! اکنون وارد شوید.');
      setHasUsers(true);
      navigate('/login');
    } catch (err) {
      console.error(err);
      toast.error('خطا در انجام تنظیمات اولیه: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 py-8">
      <Card className="w-full max-w-lg shadow-xl border border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-[#1e40af] p-3.5 rounded-2xl w-14 h-14 flex items-center justify-center text-white shadow-md">
            <Landmark className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-black">راه‌اندازی اولیه سامانه مالی</CardTitle>
          <CardDescription>
            برای شروع کار با سامانه، اطلاعات اولیه شرکت و حساب مدیر ارشد را وارد نمایید.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-right">
            
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-4">
              <h3 className="text-xs font-bold text-[#1e40af] dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-2">اطلاعات حقوقی شرکت</h3>
              
              <Input
                label="نام شرکت / سازمان"
                placeholder="مثال: شرکت بازرگانی آریا"
                icon={<Building className="h-4 w-4" />}
                error={errors.companyName?.message}
                {...register('companyName')}
              />

              <Select
                label="ارز مرجع اصلی سیستم"
                error={errors.currency?.message}
                {...register('currency')}
              >
                <option value="AFN">افغانی (AFN)</option>
                <option value="USD">دلار ایالات متحده (USD)</option>
              </Select>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-4">
              <h3 className="text-xs font-bold text-[#1e40af] dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-2">حساب کاربری مدیر سیستم</h3>
              
              <Input
                label="نام و نام خانوادگی مدیر"
                placeholder="مثال: محمد احمدی"
                icon={<User className="h-4 w-4" />}
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              <Input
                label="نام کاربری (برای ورود)"
                placeholder="مثال: admin"
                icon={<User className="h-4 w-4" />}
                error={errors.username?.message}
                {...register('username')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="رمز عبور"
                  type="password"
                  placeholder="••••••"
                  icon={<Lock className="h-4 w-4" />}
                  error={errors.password?.message}
                  {...register('password')}
                />
                <Input
                  label="تکرار رمز عبور"
                  type="password"
                  placeholder="••••••"
                  icon={<Lock className="h-4 w-4" />}
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold"
              isLoading={isSubmitting}
            >
              ذخیره و راه‌اندازی سیستم
            </Button>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
