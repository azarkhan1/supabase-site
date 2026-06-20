import { z } from 'zod';

export const employeeSchema = z.object({
  name: z.string().min(3, 'نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد'),
  position: z.string().min(2, 'سمت کاری باید حداقل ۲ کاراکتر باشد'),
  salary: z.preprocess((val) => Number(val), z.number({
    invalid_type_error: 'حقوق ناخالص باید یک عدد باشد'
  }).positive('حقوق ناخالص باید بیشتر از صفر باشد')),
  currency: z.enum(['AFN', 'USD'], {
    errorMap: () => ({ message: 'لطفاً نوع ارز حقوق را انتخاب کنید' })
  }),
  startDate: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, 'تاریخ شروع کار باید در قالب سال/ماه/روز باشد'),
  phone: z.string().min(5, 'شماره تماس معتبر الزامی است'),
  nationalId: z.string().min(5, 'کد ملی/تذکره الزامی است'),
  avatar: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true)
});

export const dailyExpenseSchema = z.object({
  date: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, 'تاریخ باید در قالب سال/ماه/روز باشد'),
  description: z.string().min(3, 'توضیحات باید حداقل ۳ کاراکتر باشد'),
  amount: z.preprocess((val) => Number(val), z.number({
    invalid_type_error: 'مبلغ باید عدد باشد'
  }).positive('مبلغ باید بیشتر از صفر باشد')),
  currency: z.enum(['AFN', 'USD'], {
    errorMap: () => ({ message: 'لطفاً ارز را انتخاب کنید' })
  }),
  categoryId: z.string().min(1, 'انتخاب دسته‌بندی الزامی است'),
  employeeId: z.string().min(1, 'انتخاب کارمند پرداخت‌کننده الزامی است')
});
