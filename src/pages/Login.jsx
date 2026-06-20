import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/auth';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/db';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Landmark, User, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { login, hasUsers, setHasUsers } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const users = db.getAll('users');
    if (users.length === 0) {
      setHasUsers(false);
      navigate('/wizard');
    }
  }, [navigate, setHasUsers]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      await login(data.username, data.password);
      toast.success('خوش آمدید! ورود با موفقیت انجام شد.');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'نام کاربری یا رمز عبور اشتباه است');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4">
      <Card className="w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-[#1e40af] p-3.5 rounded-2xl w-14 h-14 flex items-center justify-center text-white shadow-md">
            <Landmark className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-black">سامانه مدیریت مالی شرکت</CardTitle>
          <CardDescription>
            برای دسترسی به پنل مدیریت مالی، اطلاعات کاربری خود را وارد کنید.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-right">
            
            <Input
              label="نام کاربری"
              placeholder="مثال: admin"
              icon={<User className="h-4 w-4" />}
              error={errors.username?.message}
              {...register('username')}
            />

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  رمز عبور
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#1e40af] dark:text-blue-400 hover:underline font-semibold"
                >
                  رمز عبور خود را فراموش کرده‌اید؟
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••"
                icon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold mt-2"
              isLoading={isSubmitting}
            >
              ورود به سیستم
            </Button>
            
            <div className="text-center pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                کاربر جدید هستید؟{' '}
                <Link to="/register" className="text-[#1e40af] dark:text-blue-400 hover:underline">
                  ایجاد حساب کاربری جدید
                </Link>
              </span>
            </div>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
