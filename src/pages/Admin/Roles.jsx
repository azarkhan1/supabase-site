import React, { useState, useEffect, useContext } from 'react';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Check, X, Shield, ShieldAlert, KeyRound } from 'lucide-react';
import { ROLE_PERMISSIONS, PERMISSIONS } from '../../lib/permissions';

export default function RolesMatrix() {
  const { activeWorkspace } = useContext(WorkspaceContext);

  const roles = [
    { key: 'owner', label: 'مالک شرکت (Owner)' },
    { key: 'admin', label: 'مدیر کل (Admin)' },
    { key: 'accountant', label: 'حسابدار (Accountant)' },
    { key: 'viewer', label: 'مشاهده‌گر (Viewer)' }
  ];

  const permissionList = [
    { key: PERMISSIONS.CREATE_TRANSACTION, label: 'ثبت تراکنش جدید', desc: 'امکان تعریف و ثبت سندهای هزینه‌ای و درآمدی جدید' },
    { key: PERMISSIONS.APPROVE_TRANSACTION, label: 'تایید و ممیزی تراکنش', desc: 'امکان تایید نهایی اسناد معلق در دفاتر کل' },
    { key: PERMISSIONS.VIEW_REPORTS, label: 'مشاهده گزارشات مالی', desc: 'دسترسی کامل به تحلیل سود و زیان و ترازهای جاری' },
    { key: PERMISSIONS.MANAGE_ACCOUNTS, label: 'مدیریت حساب‌های خزانه', desc: 'امکان تعریف، حذف و ویرایش حساب‌های بانکی و صندوق‌ها' },
    { key: PERMISSIONS.MANAGE_USERS, label: 'مدیریت کاربران', desc: 'دسترسی کامل به تغییر دسترسی همکاران سازمان' },
    { key: PERMISSIONS.EXPORT_DATA, label: 'خروجی اکسل/پی‌دی‌اف', desc: 'حق استخراج فایل‌ها و فاکتورها از سامانه' },
    { key: PERMISSIONS.MANAGE_SETTINGS, label: 'مدیریت تنظیمات', desc: 'حق پیکربندی نرخ ارزها و اطلاعات حقوقی شرکت' }
  ];

  return (
    <div className="space-y-6 text-right">
      
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">ماتریس دسترسی و نقش‌های امنیتی</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">مشاهده سطوح دسترسی پیش‌فرض نقش‌ها (RBAC) در کلان سیستم</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Quick guide */}
        <Card className="border border-slate-200 dark:border-slate-800 text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed h-fit">
          <CardHeader>
            <CardTitle className="text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-[#1e40af]" />
              <span>راهنمای سطوح دسترسی پیش‌فرض</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>مجوزهای نشان داده شده در جدول روبرو، سطوح دسترسی پیش‌فرضی هستند که بلافاصله پس از پیوستن همکار به فضای کاری سازمان، به وی اختصاص می‌یابند.</p>
            <p>در صورتی که همکار نیاز به دسترسی‌های استثنایی دارد، مدیر کل می‌تواند از بخش «مدیریت کاربران» مجوزهای فردی استثنایی بدون وابستگی به نقش برای وی اعمال کند.</p>
          </CardContent>
        </Card>

        {/* Right column: Role Matrix Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm">ماتریس کنترل دسترسی نقش‌محور</CardTitle>
              <CardDescription>بررسی دقیق دسترسی‌های پیش‌فرض هر نقش</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>شرح مجوز دسترسی</TableHead>
                    {roles.map((r) => (
                      <TableHead key={r.key} className="text-center w-24">
                        {r.label.split(' ')[0]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionList.map((perm) => (
                    <TableRow key={perm.key}>
                      <TableCell className="py-3 font-semibold text-xs text-slate-850 dark:text-slate-200">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{perm.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{perm.desc}</p>
                        </div>
                      </TableCell>
                      {roles.map((r) => {
                        const hasPerm = ROLE_PERMISSIONS[r.key]?.includes(perm.key);
                        return (
                          <TableCell key={r.key} className="text-center">
                            <div className="flex justify-center items-center">
                              {hasPerm ? (
                                <div className="p-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-[#166534] dark:text-emerald-400">
                                  <Check className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="p-1 rounded-full bg-rose-50 dark:bg-rose-950/20 text-[#991b1b] dark:text-rose-400">
                                  <X className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
