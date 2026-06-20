import React, { useContext, useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../contexts/ThemeContext';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { db } from '../../services/db';
import { 
  Bell, Sun, Moon, Menu, LogOut, ChevronDown, User, 
  Building, Plus, ShieldCheck, HelpCircle, Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { workspaces, activeWorkspace, switchWorkspace, createWorkspace } = useContext(WorkspaceContext);
  
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [showReminders, setShowReminders] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWsMenu, setShowWsMenu] = useState(false);

  // Load reminders
  useEffect(() => {
    const loadReminders = () => {
      const allReminders = db.getAll('reminders', r => r.isActive);
      setReminders(allReminders);
    };

    loadReminders();
    
    // Check every 30 seconds
    const interval = setInterval(loadReminders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('با موفقیت خارج شدید');
    navigate('/login');
  };

  const handleWorkspaceChange = (wsId) => {
    switchWorkspace(wsId);
    setShowWsMenu(false);
    toast.success('فضای کاری تغییر یافت');
  };

  const handleDismissReminder = (id) => {
    db.update('reminders', id, { isActive: false });
    setReminders(prev => prev.filter(r => r.id !== id));
    toast.success('یادآور بایگانی شد');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 shadow-sm">
      
      {/* Left section: Drawer Toggle + Page title / Workspace */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Workspace Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowWsMenu(!showWsMenu)}
            className="flex items-center space-x-2 space-x-reverse px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 transition-all"
          >
            <Building className="h-4 w-4 text-[#1e40af]" />
            <span>{activeWorkspace ? activeWorkspace.name : 'انتخاب شرکت'}</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {showWsMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowWsMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg z-20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-2 space-y-1">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => handleWorkspaceChange(ws.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-right text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span>{ws.name}</span>
                      {activeWorkspace && activeWorkspace.id === ws.id && (
                        <Check className="h-4 w-4 text-[#166534]" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="p-2">
                  <Link
                    to="/settings"
                    onClick={() => setShowWsMenu(false)}
                    className="w-full flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg text-right text-xs font-bold text-[#1e40af] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>ایجاد فضای کاری جدید</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right section: Actions (Theme, Reminders, User) */}
      <div className="flex items-center space-x-3 space-x-reverse">
        
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-[#1e40af]" />}
        </button>

        {/* Reminders Bell */}
        <div className="relative">
          <button
            onClick={() => setShowReminders(!showReminders)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="یادآورها"
          >
            <Bell className="h-5 w-5" />
            {reminders.length > 0 && (
              <span className="absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white font-sans ring-2 ring-white dark:ring-slate-900">
                {reminders.length}
              </span>
            )}
          </button>

          {showReminders && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowReminders(false)} />
              <div className="absolute left-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg z-20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">یادآورها و هشدارها</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold font-sans">{reminders.length} مورد فعال</span>
                </div>
                
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {reminders.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">یادآور فعالی وجود ندارد</div>
                  ) : (
                    reminders.map((rem) => (
                      <div key={rem.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 flex justify-between items-start gap-2">
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{rem.title}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{rem.description}</p>
                          <p className="text-[9px] text-[#854d0e] font-sans">{rem.datetime}</p>
                        </div>
                        <button
                          onClick={() => handleDismissReminder(rem.id)}
                          className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold shrink-0 bg-slate-100 dark:bg-slate-800 p-1 rounded hover:bg-rose-50"
                        >
                          بایگانی
                        </button>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="p-2 text-center">
                  <Link
                    to="/reminders"
                    onClick={() => setShowReminders(false)}
                    className="text-[10px] font-bold text-[#1e40af] hover:underline"
                  >
                    مدیریت همه یادآورها
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 space-x-reverse p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName}
                className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#1e40af] to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                {user?.fullName?.charAt(0) || 'م'}
              </div>
            )}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{user?.fullName}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-none">
                {user?.role === 'owner' ? 'مالک سیستم' : user?.role === 'admin' ? 'مدیر ارشد' : user?.role === 'accountant' ? 'حسابدار' : 'مشاهده‌گر'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute left-0 mt-2 w-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg z-20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-2 space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center space-x-2 space-x-reverse w-full px-3 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <User className="h-4 w-4 text-slate-500" />
                    <span>مشاهده پروفایل</span>
                  </Link>
                  
                  {user?.role === 'owner' && (
                    <Link
                      to="/admin/users"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center space-x-2 space-x-reverse w-full px-3 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4 text-slate-500" />
                      <span>پنل مدیریت</span>
                    </Link>
                  )}
                </div>
                
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 space-x-reverse w-full px-3 py-2 text-right text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>خروج از حساب کاربری</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
