import React from 'react';
import { toPersianNumbers, formatCurrency } from '../../lib/utils';

export default function InvoiceTemplate({ transaction, company, account, category }) {
  if (!transaction) return null;

  const invoiceNo = toPersianNumbers(transaction.id.substring(0, 8).toUpperCase());
  const todayJalali = toPersianNumbers(new Date().toLocaleDateString('fa-IR'));

  // QR Code ساده
  const generateMockQR = () => {
    return (
      <svg width="64" height="64" viewBox="0 0 29 29" style={{ backgroundColor: '#ffffff', padding: '4px', border: '1px solid #e2e8f0' }}>
        <path d="M0 0h7v1H0zm0 6h7v1H0zm0-5h1v4H0zm6 0h1v4H6zm2 0h1v1H8zm2 0h2v1h-2zm3 0h1v3h-1zm2 0h2v1h-2zm3 0h1v2h-1zm2 0h5v1h-5z" fill="#000000" />
        <path d="M0 8h1v5H0zm2 0h2v1H2zm3 0h4v1H5zm5 0h1v2h-1zm2 0h2v1h-2zm3 0h4v1h-4zm5 0h1v1h-1zm2 0h3v1h-3zm-20 6h7v1H0zm0 6h7v1H0zm0-5h1v4H0zm6 0h1v4H6zm16-5h1v4h-1zm6 0h1v4h-1z" fill="#000000" />
        <path d="M8 10v2h1v-2zm2 1v1h2v-1zm4 0v2h3v-2zm4 0v1h1v-1zm2 1v2h1v-2zm-14 3h2v1H8zm3 0h1v2h-1zm3 0v1h1v-1zm2 0h3v1h-3zm5 0h2v1h-2z" fill="#000000" />
        <path d="M9 16h1v3H9zm2 0h2v1h-2zm3 0v2h1v-2zm2 0h3v1h-3zm4 0h1v1h-1zm2 0v2h2v-2zm-12 3v1h3v-1zm4 0h1v1h-1zm2 0h2v1h-2zm5 0v1h3v-1z" fill="#000000" />
      </svg>
    );
  };

  return (
    <div
      id="invoice-pdf-template"
      style={{
        width: '800px',
        padding: '32px',
        backgroundColor: '#ffffff',
        color: '#000000',
        textAlign: 'right',
        lineHeight: '1.6',
        fontFamily: 'Vazirmatn, sans-serif',
        border: '1px solid #e2e8f0',
        margin: '0 auto'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {company?.logo ? (
            <img src={company.logo} alt="Logo" style={{ height: '56px', width: '56px', objectFit: 'contain' }} />
          ) : (
            <div style={{ height: '56px', width: '56px', borderRadius: '12px', backgroundColor: '#1e40af', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '24px' }}>
              F
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#000000', margin: 0 }}>{company?.companyName || 'شرکت توسعه فناوری آریا'}</h1>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '500' }}>سند رسمی حسابداری مالی</p>
          </div>
        </div>
        
        <div style={{ textAlign: 'left', fontSize: '12px', color: '#475569', fontWeight: '600' }}>
          <p style={{ margin: '0 0 4px 0' }}>شماره فاکتور: <span style={{ fontWeight: '700', color: '#000000' }}>{invoiceNo}</span></p>
          <p style={{ margin: '0 0 4px 0' }}>تاریخ ثبت: <span style={{ fontWeight: '700', color: '#000000' }}>{transaction.date}</span></p>
          <p style={{ margin: 0 }}>تاریخ چاپ: <span style={{ fontWeight: '700', color: '#000000' }}>{todayJalali}</span></p>
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', margin: '24px 0', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9', fontSize: '12px' }}>
        <div>
          <h2 style={{ fontWeight: '700', color: '#000000', fontSize: '14px', margin: '0 0 8px 0' }}>مشخصات صادرکننده:</h2>
          <p style={{ margin: '0 0 4px 0' }}><span style={{ color: '#64748b' }}>شرکت:</span> {company?.companyName || '   مدیرت مالی نورزی'}</p>
          <p style={{ margin: '0 0 4px 0' }}><span style={{ color: '#64748b' }}>کد اقتصادی:</span> {toPersianNumbers(company?.taxId || '001')}</p>
          <p style={{ margin: '0 0 4px 0' }}><span style={{ color: '#64748b' }}>نشانی:</span> {company?.address || 'کابل،   افغانستان'}</p>
          <p style={{ margin: 0 }}><span style={{ color: '#64748b' }}>شماره تماس:</span> {toPersianNumbers(company?.phone || '0792266556')}</p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontWeight: '700', color: '#000000', fontSize: '14px', margin: '0 0 8px 0' }}>جزئیات تسویه مالی:</h2>
          <p style={{ margin: '0 0 4px 0' }}><span style={{ color: '#64748b' }}>وضعیت سند:</span> <span style={{ fontWeight: '700', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>تایید شده رسمی</span></p>
          <p style={{ margin: '0 0 4px 0' }}><span style={{ color: '#64748b' }}>منبع مالی:</span> {account?.name || 'حساب پیش‌فرض'}</p>
          <p style={{ margin: '0 0 4px 0' }}><span style={{ color: '#64748b' }}>نوع ارز پرداخت:</span> {transaction.currency === 'USD' ? 'دلار ایالات متحده' : 'افغانی'}</p>
          <p style={{ margin: 0 }}><span style={{ color: '#64748b' }}>صادرکننده سند:</span> {transaction.approvedBy || 'نعمت االله نورزی '}</p>
        </div>
      </div>

      {/* Table */}
      <div style={{ margin: '24px 0' }}>
        <table style={{ width: '100%', textAlign: 'right', fontSize: '12px', border: '1px solid #e2e8f0', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#334155', fontWeight: '700' }}>
              <th style={{ padding: '12px', width: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>ردیف</th>
              <th style={{ padding: '12px', border: '1px solid #e2e8f0' }}>شرح تراکنش</th>
              <th style={{ padding: '12px', width: '128px', border: '1px solid #e2e8f0' }}>دسته‌بندی</th>
              <th style={{ padding: '12px', width: '96px', textAlign: 'center', border: '1px solid #e2e8f0' }}>نوع</th>
              <th style={{ padding: '12px', width: '144px', textAlign: 'left', border: '1px solid #e2e8f0' }}>مبلغ کل</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>۱</td>
              <td style={{ padding: '12px', fontWeight: '600', color: '#000000', border: '1px solid #e2e8f0' }}>{transaction.description}</td>
              <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ backgroundColor: '#f1f5f9', color: '#000000', padding: '4px 10px', borderRadius: '4px', fontWeight: '700' }}>{category?.name || 'سایر'}</span>
              </td>
              <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                {transaction.type === 'income' ? (
                  <span style={{ color: '#166534', fontWeight: '700' }}>دریافت</span>
                ) : (
                  <span style={{ color: '#991b1b', fontWeight: '700' }}>پرداخت</span>
                )}
              </td>
              <td style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#000000', fontSize: '14px', border: '1px solid #e2e8f0' }}>
                {formatCurrency(transaction.amount, transaction.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', margin: '32px 0', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: '12px' }}>
          <h3 style={{ fontWeight: '700', color: '#000000', margin: '0 0 8px 0' }}>توضیحات:</h3>
          <p style={{ color: '#64748b', lineHeight: '1.8', margin: '0 0 16px 0' }}>
            این فاکتور به صورت الکترونیکی صادر شده و فاقد خدشه می‌باشد.
          </p>
          <div>
            {generateMockQR()}
            <p style={{ fontSize: '9px', color: '#94a3b8', margin: '4px 0 0 0' }}>UUID: {transaction.id}</p>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '280px', marginRight: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '12px' }}>
            <span style={{ color: '#64748b' }}>جمع کل:</span>
            <span style={{ fontWeight: '700', color: '#000000' }}>{formatCurrency(transaction.amount, transaction.currency)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '12px' }}>
            <span style={{ color: '#64748b' }}>مالیات (۰٪):</span>
            <span style={{ fontWeight: '700', color: '#000000' }}>۰</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontSize: '14px' }}>
            <span style={{ color: '#000000' }}>مبلغ قابل تسویه:</span>
            <span style={{ color: '#1e40af' }}>{formatCurrency(transaction.amount, transaction.currency)}</span>
          </div>
        </div>
      </div>

      {/* Signature */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '700' }}>
        <div style={{ width: '192px', textAlign: 'center' }}>
          <p style={{ color: '#64748b', margin: '0 0 16px 0' }}>محل مهر و امضای صادرکننده</p>
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="100" height="40" style={{ color: '#2563eb' }}>
              <path d="M10 20 C 30 5, 40 40, 50 20 C 60 5, 80 35, 90 20" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <p style={{ color: '#000000', margin: '16px 0 0 0' }}>{transaction.approvedBy || 'مدیر مالی'}</p>
        </div>

        <div style={{ width: '192px', textAlign: 'center' }}>
          <p style={{ color: '#64748b', margin: '0 0 16px 0' }}>محل امضای دریافت‌کننده</p>
          <div style={{ height: '64px' }} />
          <p style={{ color: '#cbd5e1', margin: '16px 0 0 0' }}>............................</p>
        </div>
      </div>
    </div>
  );
}