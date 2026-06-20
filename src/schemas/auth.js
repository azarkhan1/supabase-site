import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد'),
  password: z.string().min(4, 'رمز عبور باید حداقل ۴ کاراکتر باشد')
});

export const registerSchema = z.object({
  username: z.string().min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
  confirmPassword: z.string(),
  fullName: z.string().min(3, 'نام کامل باید حداقل ۳ کاراکتر باشد'),
  companyName: z.string().min(2, 'نام شرکت باید حداقل ۲ کاراکتر باشد'),
  currency: z.enum(['AFN', 'USD'], {
    errorMap: () => ({ message: 'لطفاً یک ارز را انتخاب کنید' })
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'رمز عبور و تایید آن همخوانی ندارند',
  path: ['confirmPassword']
});

export const profileSchema = z.object({
  fullName: z.string().min(3, 'نام کامل باید حداقل ۳ کاراکتر باشد'),
  avatar: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional()
}).refine((data) => {
  if (data.newPassword && data.newPassword.length > 0) {
    return data.newPassword.length >= 6;
  }
  return true;
}, {
  message: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد',
  path: ['newPassword']
}).refine((data) => {
  if (data.newPassword && data.newPassword.length > 0) {
    return data.newPassword === data.confirmNewPassword;
  }
  return true;
}, {
  message: 'رمز عبور جدید و تایید آن همخوانی ندارند',
  path: ['confirmNewPassword']
});
