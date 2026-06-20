import { z } from 'zod';

export const commitmentSchema = z.object({
  title: z.string().min(3, 'عنوان تعهد باید حداقل ۳ کاراکتر باشد'),
  type: z.enum(['بدهی', 'طلب'], {
    errorMap: () => ({ message: 'نوع تعهد باید "بدهی" یا "طلب" باشد' })
  }),
  contactName: z.string().min(3, 'نام مخاطب باید حداقل ۳ کاراکتر باشد'),
  contactPhone: z.string().optional().or(z.literal('')),
  totalAmount: z.preprocess((val) => Number(val), z.number({
    invalid_type_error: 'مبلغ کل باید یک عدد باشد'
  }).positive('مبلغ کل باید بیشتر از صفر باشد')),
  currency: z.enum(['AFN', 'USD'], {
    errorMap: () => ({ message: 'لطفاً ارز را انتخاب کنید' })
  }),
  dueDate: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, 'تاریخ باید در قالب سال/ماه/روز (مثلاً ۱۴۰۴/۱۰/۰۵) باشد'),
  description: z.string().optional().or(z.literal(''))
});

export const paymentSchema = z.object({
  amount: z.preprocess((val) => Number(val), z.number({
    invalid_type_error: 'مبلغ پرداختی باید یک عدد باشد'
  }).positive('مبلغ پرداختی باید بیشتر از صفر باشد')),
  date: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, 'تاریخ باید در قالب سال/ماه/روز باشد'),
  note: z.string().optional().or(z.literal(''))
});
