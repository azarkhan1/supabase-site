import React, { useState, useEffect, useContext } from 'react';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Check, X, Award, Sparkles } from 'lucide-react';
import { db } from '../../services/db';

export default function PlansManagement() {
  const { activeWorkspace } = useContext(WorkspaceContext);
  
  // Default Offline Feature Flags Mock Database
  const plansData = [
    {
      key: 'free',
      label: 'طرح برنزی (رایگان)',
      price: 'رایگان',
      features: {
        transactions: true,
        reports: true,
        recurring: false,
        workspace: false,
        treasury: false,
        approval: false,
        export: false,
        employees: false,
        attachments: false
      }
    },
    {
      key: 'pro',
      label: 'طرح نقره‌ای (حرفه‌ای)',
      price: '۴۹ دلار / ماهانه',
      features: {
        transactions: true,
        reports: true,
        recurring: true,
        workspace: true,
        treasury: true,
        approval: false,
        export: true,
        employees: true,
        attachments: true
      }
    },
    {
      key: 'business',
      label: 'طرح طلایی (تجاری)',
      price: '۹۹ دلار / ماهانه',
      features: {
        transactions: true,
        reports: true,
        recurring: true,
        workspace: true,
        treasury: true,
        approval: true,
        export: true,
        employees: true,
        attachments: true
      }
    }
  ];

  return (
    <div className="space-y-6 text-right">
      
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">طرح‌های اشتراک و پرچم ویژگی‌ها (Feature Flags)</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">پایش طرح‌های تجاری فعال سازمان، مقایسه ویژگی‌ها و شبیه‌سازی لایسنسینگ آفلاین</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plansData.map((plan) => (
          <Card key={plan.key} className={`border ${
            plan.key === 'business' ? 'border-[#1e40af] ring-2 ring-[#1e40af]/10' : 'border-slate-200 dark:border-slate-800'
          }`}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-blue-50 dark:bg-blue-950/20 p-2.5 rounded-full w-10 h-10 flex items-center justify-center text-[#1e40af] mb-2">
                <Award className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">{plan.label}</CardTitle>
              <CardDescription className="font-sans font-bold text-[#1e40af] mt-1">{plan.price}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 border-t border-slate-100 dark:border-slate-800">
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="p-3 flex justify-between">
                  <span>ثبت سند تراکنش:</span>
                  <span>{plan.features.transactions ? <Check className="h-4 w-4 text-[#166534]" /> : <X className="h-4 w-4 text-[#991b1b]" />}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span>گزارشات و سود و زیان:</span>
                  <span>{plan.features.reports ? <Check className="h-4 w-4 text-[#166534]" /> : <X className="h-4 w-4 text-[#991b1b]" />}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span>تراکنش‌های دوره‌ای خودکار:</span>
                  <span>{plan.features.recurring ? <Check className="h-4 w-4 text-[#166534]" /> : <X className="h-4 w-4 text-[#991b1b]" />}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span>چندین فضای کاری:</span>
                  <span>{plan.features.workspace ? <Check className="h-4 w-4 text-[#166534]" /> : <X className="h-4 w-4 text-[#991b1b]" />}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span>ماژول خزانه‌داری کل:</span>
                  <span>{plan.features.treasury ? <Check className="h-4 w-4 text-[#166534]" /> : <X className="h-4 w-4 text-[#991b1b]" />}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span>روال ممیزی و تایید رسمی:</span>
                  <span>{plan.features.approval ? <Check className="h-4 w-4 text-[#166534]" /> : <X className="h-4 w-4 text-[#991b1b]" />}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span>پرونده پرسنل و حقوق:</span>
                  <span>{plan.features.employees ? <Check className="h-4 w-4 text-[#166534]" /> : <X className="h-4 w-4 text-[#991b1b]" />}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span>پیوست اسناد فایلی (<span className="font-sans">5MB</span>):</span>
                  <span>{plan.features.attachments ? <Check className="h-4 w-4 text-[#166534]" /> : <X className="h-4 w-4 text-[#991b1b]" />}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
