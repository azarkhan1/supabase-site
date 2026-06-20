import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../services/db';
import { WorkspaceContext } from '../contexts/WorkspaceContext';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { formatCurrency, isoToJalaliWithTime } from '../lib/utils';
import InvoiceTemplate from '../components/PDF/InvoiceTemplate';
import { pdfGenerator } from '../lib/pdfGenerator';
import {
  ArrowRight, FileText, CheckCircle2, XCircle,
  Trash2, Download, Paperclip, Calendar, User,
  Tag, Landmark
} from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeWorkspace } = useContext(WorkspaceContext);
  const { user } = useAuth();

  const canApprove = usePermission('APPROVE_TRANSACTION');

  const [transaction, setTransaction] = useState(null);
  const [account, setAccount] = useState(null);
  const [category, setCategory] = useState(null);

  const loadTransaction = () => {
    const tx = db.getById('transactions', id);
    if (!tx) {
      toast.error('تراکنش مورد نظر یافت نشد');
      navigate('/transactions');
      return;
    }

    setTransaction(tx);

    if (tx.accountId) {
      setAccount(db.getById('accounts', tx.accountId));
    }
    if (tx.categoryId) {
      setCategory(db.getById('categories', tx.categoryId));
    }
  };

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const handleApprove = () => {
    if (!canApprove) {
      toast.error('شما دسترسی تایید تراکنش را ندارید');
      return;
    }

    db.update('transactions', id, {
      status: 'approved',
      approvedBy: user?.fullName || 'مدیر مالی',
      approvedAt: new Date().toISOString()
    });

    toast.success('سند مالی با موفقیت تایید شد');
    loadTransaction();
  };

  const handleReject = () => {
    if (!canApprove) {
      toast.error('شما دسترسی تایید/رد تراکنش را ندارید');
      return;
    }

    db.update('transactions', id, {
      status: 'rejected',
      approvedBy: user?.fullName || 'مدیر مالی',
      approvedAt: new Date().toISOString()
    });

    toast.success('سند مالی رد شد');
    loadTransaction();
  };

  const handleDelete = () => {
    if (user?.role!== 'owner' &&!user?.isAdmin) {
      toast.error('فقط مدیر ارشد می‌تواند اسناد را حذف کند');
      return;
    }

    if (confirm('آیا از حذف دائم این سند اطمینان دارید؟')) {
      db.delete('transactions', id);
      toast.success('تراکنش حذف شد');
      navigate('/transactions');
    }
  };

  const handleExportPDF = async () => {
    await pdfGenerator.exportToPDF('invoice-pdf-template', `Receipt_${transaction.id.substring(0, 8)}.pdf`);
  };

  if (!transaction) return null;

  return (
    <div className="space-y-6 text-right">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <Link
          to="/transactions"
          className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowRight className="h-4 w-4" />
          <span>بازگشت به لیست تراکنش‌ها</span>
        </Link>

        <div className="flex items-center space-x-2 space-x-reverse">
          {(user?.role === 'owner' || user?.isAdmin) && (
            <Button onClick={handleDelete} variant="danger" size="sm" className="flex items-center space-x-1 space-x-reverse">
              <Trash2 className="h-4 w-4" />
              <span>حذف سند</span>
            </Button>
          )}

          {transaction.status === 'approved' && (
            <Button onClick={handleExportPDF} variant="outline" size="sm" className="flex items-center space-x-1.5 space-x-reverse border-slate-300 dark:border-slate-700">
              <FileText className="h-4 w-4 text-[#1e40af]" />
              <span>چاپ سند رسمی (PDF)</span>
            </Button>
          )}

          {transaction.status === 'pending' && canApprove && (
            <>
              <Button onClick={handleReject} variant="danger" size="sm" className="flex items-center space-x-1 space-x-reverse">
                <XCircle className="h-4 w-4" />
                <span>رد سند</span>
              </Button>
              <Button onClick={handleApprove} variant="success" size="sm" className="flex items-center space-x-1 space-x-reverse">
                <CheckCircle2 className="h-4 w-4" />
                <span>تایید سند</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg">جزئیات سند مالی</CardTitle>
                  <CardDescription>شناسه منحصربه‌فرد سند: {transaction.id}</CardDescription>
                </div>
                <div>
                  {transaction.status === 'approved' && <Badge variant="success">تایید شده</Badge>}
                  {transaction.status === 'pending' && <Badge variant="warning">در انتظار تایید</Badge>}
                  {transaction.status === 'rejected' && <Badge variant="danger">رد شده</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 font-bold">مبلغ تراکنش:</p>
                  <p className="text-2xl font-black font-sans text-slate-950 dark:text-white">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 font-bold">نوع و ماهیت حسابداری:</p>
                  <p className={`text-sm font-bold ${
                    transaction.type === 'income'? 'text-[#166534]' : 'text-[#991b1b]'
                  }`}>
                    {transaction.type === 'income'? 'درآمد (بستانکار / ورودی به خزانه)' : 'هزینه (بدهکار / خروجی از خزانه)'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Calendar className="h-4.5 w-4.5 text-slate-400" />
                  <div>
                    <p className="text-[9px] text-slate-500">تاریخ ثبت سند:</p>
                    <p className="font-sans font-bold mt-0.5">{transaction.date}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse">
                  <Landmark className="h-4.5 w-4.5 text-slate-400" />
                  <div>
                    <p className="text-[9px] text-slate-500">حساب مالی مبدا/مقصد:</p>
                    <p className="font-bold mt-0.5">{account? account.name : 'نامشخص'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse">
                  <Tag className="h-4.5 w-4.5 text-slate-400" />
                  <div>
                    <p className="text-[9px] text-slate-500">دسته‌بندی موضوعی:</p>
                    <p className="font-bold mt-0.5">{category? category.name : 'نامشخص'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse">
                  <User className="h-4.5 w-4.5 text-slate-400" />
                  <div>
                    <p className="text-[9px] text-slate-500">صادرکننده / ممیز:</p>
                    <p className="font-bold mt-0.5">{transaction.approvedBy || 'سیستم خودکار'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                <p className="text-[10px] text-slate-500 font-bold">بابت (شرح سند):</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed">
                  {transaction.description}
                </p>
              </div>

              {transaction.tags && transaction.tags.length > 0 && (
                <div className="flex items-center flex-wrap gap-2 pt-2">
                  <span className="text-[10px] text-slate-500 font-bold">برچسب‌ها:</span>
                  {transaction.tags.map((tag, idx) => (
                    <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Paperclip className="h-4.5 w-4.5 text-slate-400" />
                <CardTitle className="text-sm">پیوست‌ها و مدارک مثبته</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!transaction.attachments || transaction.attachments.length === 0? (
                <div className="p-6 text-center text-xs text-slate-500 font-semibold">فایلی برای این سند پیوست نشده است</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {transaction.attachments.map((file) => {
                    const isImage = file.type.startsWith('image/');
                    return (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 rounded-lg"
                      >
                        <div className="flex items-center space-x-3 space-x-reverse min-w-0">
                          {isImage? (
                            <img
                              src={file.base64}
                              alt={file.name}
                              className="h-12 w-12 object-cover rounded border border-slate-200 dark:border-slate-800"
                            />
                          ) : (
                            <div className="h-12 w-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-800">
                              <FileText className="h-6 w-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-1">{file.name}</p>
                            <p className="text-[10px] text-slate-500 font-sans mt-0.5 pr-1">تاریخ آپلود: {isoToJalaliWithTime(file.uploadedAt)}</p>
                          </div>
                        </div>

                        <a
                          href={file.base64}
                          download={file.name}
                          className="p-2 text-slate-500 hover:text-[#1e40af] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          title="دانلود فایل"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm">وضعیت ممیزی و ممیزین</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs text-slate-500 font-bold">وضعیت نهایی:</span>
                <div>
                  {transaction.status === 'approved' && <Badge variant="success">تایید و قطعی شده</Badge>}
                  {transaction.status === 'pending' && <Badge variant="warning">در انتظار تایید</Badge>}
                  {transaction.status === 'rejected' && <Badge variant="danger">رد شده رسمی</Badge>}
                </div>
              </div>

              {transaction.approvedBy && (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">ممیز تایید کننده:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{transaction.approvedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">تاریخ و زمان ممیزی:</span>
                    <span className="font-sans font-bold text-slate-800 dark:text-slate-200">
                      {isoToJalaliWithTime(transaction.approvedAt)}
                    </span>
                  </div>
                </div>
              )}

              {transaction.status === 'pending' && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 text-xs font-semibold text-amber-850 leading-relaxed text-right">
                  این تراکنش به علت لزوم بررسی مدیریت هنوز در دفاتر کل ثبت نشده است.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* این div مخفی برای PDF هست - درست قبل از div اصلی بسته میشه */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
        <InvoiceTemplate
          transaction={transaction}
          company={activeWorkspace}
          account={account}
          category={category}
        />
      </div>
    </div>
  );
}