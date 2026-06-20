import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '../services/db';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Landmark, User, Lock } from 'lucide-react';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
  username: z.string().min(3, 'نام کاربری نامعتبر است'),
  newPassword: z.string().min(6, 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد')
});

export default function ForgotPassword() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: '',
      newPassword: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      const users = db.getAll('users');
      const user = users.find(u => u.username.toLowerCase() === data.username.toLowerCase());
      
      if (!user) {
        toast.error('کاربری با این نام کاربری یافت نشد');
        return;
      }

      // Offline Reset
      db.update('users', user.id, { password: data.newPassword });
      db.logAction('reset_password', 'users', user.id, `بازیابی آفلاین رمز عبور برای کاربر ${user.fullName}`);
      
      toast.success('رمز عبور شما با موفقیت تغییر یافت. اکنون می‌توانید وارد شوید.');
      navigate('/login');
    } catch (err) {
      toast.error('خطا در بازیابی رمز عبور: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4">
      <Card className="w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-[#1e40af] p-3.5 rounded-2xl w-14 h-14 flex items-center justify-center text-white shadow-md">
            <Landmark className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-black">بازیابی رمز عبور</CardTitle>
          <CardDescription>
            برای بازنشانی رمز عبور خود، نام کاربری و رمز عبور جدید را وارد کنید.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-right">
            
            <Input
              label="نام کاربری شما"
              placeholder="مثال: admin"
              icon={<User className="h-4 w-4" />}
              error={errors.username?.message}
              {...register('username')}
            />

            <Input
              label="رمز عبور جدید"
              type="password"
              placeholder="••••••"
              icon={<Lock className="h-4 w-4" />}
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />

            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold mt-2"
              isLoading={isSubmitting}
            >
              تغییر رمز عبور و ورود
            </Button>
            
            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-[#1e40af] dark:text-blue-400 hover:underline font-semibold">
                بازگشت به صفحه ورود
              </Link>
            </div>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
