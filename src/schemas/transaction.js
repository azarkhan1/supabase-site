import { z } from 'zod';

export const transactionSchema = z.object({
  amount: z.preprocess((val) => Number(val), z.number({
    invalid_type_error: 'مبلغ باید یک عدد باشد'
  }).positive('مبلغ باید بیشتر از صفر باشد')),
  currency: z.enum(['AFN', 'USD'], {
    errorMap: () => ({ message: 'لطفاً ارز را انتخاب کنید' })
  }),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'نوع تراکنش نامعتبر است' })
  }),
  accountId: z.string().min(1, 'انتخاب حساب الزامی است'),
  categoryId: z.string().min(1, 'انتخاب دسته‌بندی الزامی است'),
  date: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, 'تاریخ باید در قالب سال/ماه/روز (مثلاً ۱۴۰۴/۱۰/۰۵) باشد'),
  description: z.string().min(3, 'توضیحات باید حداقل ۳ کاراکتر باشد'),
  tags: z.string().optional().or(z.array(z.string())),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending')
});

export const categorySchema = z.object({
  name: z.string().min(2, 'نام دسته‌بندی باید حداقل ۲ کاراکتر باشد'),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'نوع دسته‌بندی نامعتبر است' })
  }),
  color: z.string().min(4, 'کد رنگ الزامی است'),
  icon: z.string().min(2, 'انتخاب آیکون الزامی است')
});
