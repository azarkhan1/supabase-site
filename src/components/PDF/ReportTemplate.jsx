import React from 'react';
import { toPersianNumbers, formatCurrency, formatNumber } from '../../lib/utils';

export default function ReportTemplate({ 
  title, 
  dateRange, 
  filters, 
  summary, 
  transactions = [], 
  company, 
  categories = [] 
}) {
  const todayJalali = toPersianNumbers(new Date().toLocaleDateString('fa-IR'));

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'سایر';
  };

  return (
    <div id="report-pdf-template" className="w-[800px] p-8 bg-white text-slate-800 text-right leading-relaxed font-sans border border-slate-200 shadow-sm mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-slate-300 pb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          {company?.logo ? (
            <img src={company.logo} alt="Logo" className="h-12 w-12 object-contain" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-[#1e40af] text-white flex items-center justify-center font-black text-xl">
              F
            </div>
          )}
          <div>
            <h1 className="text-lg font-black text-slate-900">{company?.companyName || 'شرکت توسعه فناوری آریا'}</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">گزارشات و تحلیل‌های دوره‌ای</p>
          </div>
        </div>
        
        <div className="text-left space-y-1 text-xs text-slate-600 font-semibold">
          <h2 className="text-sm font-black text-slate-900">{title || 'گزارش عملکرد مالی'}</h2>
          <p>بازه گزارش: <span className="font-sans font-bold text-slate-900">{dateRange || 'کل دوره'}</span></p>
          <p>تاریخ چاپ: <span className="font-sans font-bold text-slate-900">{todayJalali}</span></p>
        </div>
      </div>

      {/* Applied Filters Info */}
      <div className="bg-slate-50 dark:bg-slate-50 border border-slate-100 p-3 rounded-lg my-4 text-xs font-semibold text-slate-600 flex flex-wrap gap-4">
        <span>فیلترهای اعمال شده:</span>
        {filters?.type && <span>نوع: {filters.type === 'income' ? 'درآمدها' : 'هزینه‌ها'}</span>}
        {filters?.category && <span>دسته‌بندی: {filters.category}</span>}
        {filters?.status && <span>وضعیت: {filters.status === 'approved' ? 'تایید شده' : 'در انتظار'}</span>}
        {(!filters?.type && !filters?.category && !filters?.status) && <span>بدون فیلتر خاص</span>}
      </div>

      {/* Performance Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 my-6">
          <div className="border border-slate-200 rounded-xl p-4 text-center bg-blue-50/50">
            <p className="text-[10px] font-bold text-slate-500">جمع کل درآمدها</p>
            <p className="text-lg font-black text-[#1e40af] font-sans mt-2">
              {formatCurrency(summary.totalIncome || 0, summary.currency)}
            </p>
          </div>
          <div className="border border-slate-200 rounded-xl p-4 text-center bg-rose-50/50">
            <p className="text-[10px] font-bold text-slate-500">جمع کل هزینه‌ها</p>
            <p className="text-lg font-black text-[#991b1b] font-sans mt-2">
              {formatCurrency(summary.totalExpense || 0, summary.currency)}
            </p>
          </div>
          <div className="border border-slate-200 rounded-xl p-4 text-center bg-emerald-50/50">
            <p className="text-[10px] font-bold text-slate-500">سود خالص (P&L)</p>
            <p className="text-lg font-black text-[#166534] font-sans mt-2">
              {formatCurrency((summary.totalIncome || 0) - (summary.totalExpense || 0), summary.currency)}
            </p>
          </div>
        </div>
      )}

      {/* Transactions Data Table */}
      <div className="my-6">
        <h3 className="text-sm font-bold text-slate-950 mb-3">ریز تراکنش‌های مالی دوره:</h3>
        <table className="w-full text-right text-[11px] border border-slate-200">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <th className="p-2 w-12 text-center">ردیف</th>
              <th className="p-2 w-24">تاریخ</th>
              <th className="p-2">شرح تراکنش</th>
              <th className="p-2 w-28">دسته‌بندی</th>
              <th className="p-2 w-20 text-center">نوع</th>
              <th className="p-2 w-28 text-left">مبلغ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-slate-400">تراکنشی در این دوره یافت نشد</td>
              </tr>
            ) : (
              transactions.map((tx, idx) => (
                <tr key={tx.id}>
                  <td className="p-2 text-center font-sans">{idx + 1}</td>
                  <td className="p-2 font-sans font-semibold">{tx.date}</td>
                  <td className="p-2 font-medium text-slate-900">{tx.description}</td>
                  <td className="p-2">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">{getCategoryName(tx.categoryId)}</span>
                  </td>
                  <td className="p-2 text-center font-semibold">
                    {tx.type === 'income' ? (
                      <span className="text-emerald-700">درآمد</span>
                    ) : (
                      <span className="text-rose-700">هزینه</span>
                    )}
                  </td>
                  <td className="p-2 text-left font-sans font-bold text-slate-950">
                    {formatCurrency(tx.amount, tx.currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-200 text-[10px] text-slate-400 font-semibold font-sans">
        <span>تهیه شده توسط: سامانه مدیریت مالی شرکت</span>
        <span>صفحه ۱ از ۱</span>
      </div>
    </div>
  );
}
