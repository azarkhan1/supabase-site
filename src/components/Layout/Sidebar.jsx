import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { 
  LayoutDashboard, CreditCard, ArrowLeftRight, FileCheck, 
  RefreshCw, Bell, Users, Wallet, Landmark, BarChart3, 
  Settings, Shield, ChevronDown, ChevronUp, History, KeyRound, 
  Award, Menu, X, Landmark as TreasuryIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const [openWorkspace, setOpenWorkspace] = useState(location.pathname.startsWith('/workspace'));
  const [openAdmin, setOpenAdmin] = useState(location.pathname.startsWith('/admin'));

  const navItems = [
    { to: '/', label: 'داشبورد', icon: LayoutDashboard },
    { to: '/accounts', label: 'حساب‌های مالی', icon: CreditCard },
    { to: '/transactions', label: 'تراکنش‌ها', icon: ArrowLeftRight },
    { to: '/commitments', label: 'تعهدات (بدهی/طلب)', icon: FileCheck },
    { to: '/recurring', label: 'تراکنش‌های دوره‌ای', icon: RefreshCw },
    { to: '/reminders', label: 'یادآورها', icon: Bell },
  ];

  const workspaceItems = [
    { to: '/workspace/company', label: 'پروفایل شرکت', icon: Landmark },
    { to: '/workspace/treasury', label: 'خزانه‌داری کل', icon: TreasuryIcon },
    { to: '/workspace/employees', label: 'کارمندان و حقوق', icon: Users },
    { to: '/workspace/daily-expenses', label: 'هزینه‌های روزمره', icon: Wallet },
  ];

  const adminItems = [
    { to: '/admin/users', label: 'مدیریت کاربران', icon: Users },
    { to: '/admin/roles', label: 'ماتریس دسترسی‌ها', icon: KeyRound },
    { to: '/admin/plans', label: 'طرح‌های کاربری', icon: Award },
    { to: '/admin/logs', label: 'لاگ‌های سیستم', icon: History },
  ];

  const renderLink = (item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={onClose}
        className={({ isActive }) => cn(
          "flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg text-xs font-bold transition-all",
          isActive 
            ? "bg-[#1e40af] text-white shadow-md shadow-blue-900/10" 
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 right-0 z-40 h-screen w-64 -translate-x-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-transform lg:sticky lg:translate-x-0 flex flex-col justify-between shadow-sm overflow-y-auto",
          isOpen && "translate-x-0"
        )}
      >
        <div className="space-y-6">
          {/* Logo / Header */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e40af] text-white font-bold text-lg shadow-md shadow-blue-900/20">
                F
              </div>
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
               مدیرت مالی نورزی
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(renderLink)}

            {/* Workspace Section */}
            <div className="space-y-1">
              <button
                onClick={() => setOpenWorkspace(!openWorkspace)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Landmark className="h-4 w-4 shrink-0" />
                  <span>فضای کاری شرکت</span>
                </div>
                {openWorkspace ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {openWorkspace && (
                <div className="mr-4 border-r border-slate-200 dark:border-slate-800 pr-2 py-1 space-y-1">
                  {workspaceItems.map(renderLink)}
                </div>
              )}
            </div>

            {/* Reports */}
            <NavLink
              to="/reports"
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg text-xs font-bold transition-all",
                isActive 
                  ? "bg-[#1e40af] text-white shadow-md" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>گزارشات جامع</span>
            </NavLink>

            {/* Settings */}
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg text-xs font-bold transition-all",
                isActive 
                  ? "bg-[#1e40af] text-white shadow-md" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>تنظیمات سیستم</span>
            </NavLink>

            {/* Admin Section */}
            {(user?.role === 'owner' || user?.isAdmin) && (
              <div className="space-y-1">
                <button
                  onClick={() => setOpenAdmin(!openAdmin)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Shield className="h-4 w-4 shrink-0" />
                    <span>پنل مدیریت سیستم</span>
                  </div>
                  {openAdmin ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {openAdmin && (
                  <div className="mr-4 border-r border-slate-200 dark:border-slate-800 pr-2 py-1 space-y-1">
                    {adminItems.map(renderLink)}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Footer Area */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-3 flex items-center space-x-3 space-x-reverse">
            <div className="h-9 w-9 rounded-full bg-blue-100 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-300 flex items-center justify-center font-black font-sans text-xs shrink-0">
              {user?.fullName?.charAt(0) || 'م'}
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.username}@</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
