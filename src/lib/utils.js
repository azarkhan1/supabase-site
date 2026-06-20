import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Convert English numbers to Persian/Arabic numbers
export function toPersianNumbers(num) {
  if (num === null || num === undefined) return '';
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, w => persianDigits[+w]);
}

// Format numbers with thousands separators
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) return '۰';
  const val = Number(num).toFixed(decimals);
  const parts = val.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Convert to Persian digits
  return toPersianNumbers(parts.join('.'));
}

// Format currency with symbol and amount
export function formatCurrency(amount, currency = 'AFN') {
  const formatted = formatNumber(amount);
  if (currency === 'USD') {
    return `$${formatted} (دلار)`;
  }
  return `${formatted} افغانی`;
}

// Simple Jalali date converter helper if needed, or date parsing
export function getTodayJalali() {
  const today = new Date();
  // Using date-fns-jalali or standard Intl
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.format(today).split('/');
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  } catch (e) {
    return '1404/10/25'; // Fallback
  }
}

// Parse ISO date to Jalali
export function isoToJalali(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date);
  } catch (e) {
    return '';
  }
}

// Parse ISO date to Jalali with time
export function isoToJalaliWithTime(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    return formatter.format(date);
  } catch (e) {
    return '';
  }
}
