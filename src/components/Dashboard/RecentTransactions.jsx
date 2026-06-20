import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { formatCurrency, isoToJalali } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { Eye, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function RecentTransactions({ transactions = [], categories = [], accounts = [] }) {
  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'سایر';
  };

  const getAccountName = (accId) => {
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.name : 'حساب نامشخص';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">تایید شده</Badge>;
      case 'pending':
        return <Badge variant="warning">در انتظار تایید</Badge>;
      case 'rejected':
        return <Badge variant="danger">رد شده</Badge>;
      default:
        return <Badge>نامشخص</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1 text-right">
          <CardTitle>تراکنش‌های اخیر</CardTitle>
          <CardDescription>۵ تراکنش آخر ثبت شده در سیستم</CardDescription>
        </div>
        <Link 
          to="/transactions" 
          className="text-xs font-bold text-[#1e40af] hover:underline"
        >
          مشاهده همه
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">تراکنشی ثبت نشده است</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>شرح تراکنش</TableHead>
                <TableHead>حساب</TableHead>
                <TableHead>دسته‌بندی</TableHead>
                <TableHead>مبلغ</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-semibold">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {tx.type === 'income' ? (
                        <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 shrink-0">
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="p-1 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600 shrink-0">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <span className="truncate max-w-[200px]">{tx.description}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold">{getAccountName(tx.accountId)}</TableCell>
                  <TableCell className="text-xs font-semibold">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-slate-400" style={{ backgroundColor: categories.find(c => c.id === tx.categoryId)?.color }}>
                      {getCategoryName(tx.categoryId)}
                    </span>
                  </TableCell>
                  <TableCell className="font-sans font-bold">
                    <span className={tx.type === 'income' ? 'text-[#166534] dark:text-emerald-400' : 'text-[#991b1b] dark:text-rose-400'}>
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-sans font-semibold">{tx.date}</TableCell>
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell>
                    <Link
                      to={`/transactions/${tx.id}`}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-[#1e40af] inline-flex items-center justify-center"
                      title="مشاهده جزئیات"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
