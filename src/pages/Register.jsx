import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../schemas/auth';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Landmark, User, Lock, Building } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

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
      await registerUser(data);
      toast.success('ثبت‌نام شما با موفقیت انجام شد! اکنون می‌توانید وارد شوید.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'خطا در فرآیند ثبت‌نام');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 py-8">
      <Card className="w-full max-w-lg shadow-xl border border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-[#1e40af] p-3.5 rounded-2xl w-14 h-14 flex items-center justify-center text-white shadow-md">
            <Landmark className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-black">عضویت در سامانه مالی</CardTitle>
          <CardDescription>
            برای ثبت‌نام به عنوان همکار جدید، اطلاعات زیر را با دقت تکمیل کنید.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-right">
            
            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-4">
              <h3 className="text-xs font-bold text-[#1e40af] dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-2">اطلاعات سازمان و شرکت</h3>
              
              <Input
                label="نام شرکت / سازمان"
                placeholder="مثال: شرکت تجارت برتر"
                icon={<Building className="h-4 w-4" />}
                error={errors.companyName?.message}
                {...register('companyName')}
              />

              <Select
                label="ارز مرجع اصلی"
                error={errors.currency?.message}
                {...register('currency')}
              >
                <option value="AFN">افغانی (AFN)</option>
                <option value="USD">دلار ایالات متحده (USD)</option>
              </Select>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-4">
              <h3 className="text-xs font-bold text-[#1e40af] dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-2">حساب کاربری جدید</h3>
              
              <Input
                label="نام و نام خانوادگی شما"
                placeholder="مثال: رضا محمدی"
                icon={<User className="h-4 w-4" />}
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              <Input
                label="نام کاربری (کاراکترهای انگلیسی)"
                placeholder="مثال: reza_m"
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
              className="w-full h-11 text-sm font-bold mt-2"
              isLoading={isSubmitting}
            >
              ثبت‌نام و عضویت
            </Button>
            
            <div className="text-center pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                قبلاً حساب کاربری ساخته‌اید؟{' '}
                <Link to="/login" className="text-[#1e40af] dark:text-blue-400 hover:underline">
                  وارد شوید
                </Link>
              </span>
            </div>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
