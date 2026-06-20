import React, { useEffect, useState, useContext } from 'react';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { formatCurrency, toPersianNumbers, isoToJalaliWithTime } from '../../lib/utils';
import {
  Users, ShieldAlert, KeyRound, Ban,
  Trash2, Award, Sparkles, CheckSquare, Square, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

// DB رو آوردیم اینجا که دیگه ایمپورت نخاد
const db = {
  getAll: (table) => {
    try {
      const data = localStorage.getItem(table);
      return data? JSON.parse(data) : [];
    } catch (err) {
      console.error('خطا در خواندن دیتا:', err);
      return [];
    }
  },

  create: (table, item) => {
    try {
      const items = db.getAll(table);
      const newItem = {
        id: `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...item
      };
      items.push(newItem);
      localStorage.setItem(table, JSON.stringify(items));
      return newItem;
    } catch (err) {
      console.error('خطا در ساخت:', err);
      throw new Error('مشکلی در ذخیره کاربر پیش اومد');
    }
  },

  update: (table, id, updates) => {
    try {
      const items = db.getAll(table);
      const index = items.findIndex(i => i.id === id);
      if (index === -1) throw new Error('کاربر پیدا نشد');
      items[index] = {...items[index],...updates };
      localStorage.setItem(table, JSON.stringify(items));
      return items[index];
    } catch (err) {
      console.error('خطا در آپدیت:', err);
      throw err;
    }
  },

  delete: (table, id) => {
    try {
      const items = db.getAll(table).filter(i => i.id!== id);
      localStorage.setItem(table, JSON.stringify(items));
    } catch (err) {
      console.error('خطا در حذف:', err);
      throw new Error('مشکلی در حذف کاربر پیش اومد');
    }
  }
};

export default function UsersManagement() {
  const { activeWorkspace } = useContext(WorkspaceContext);
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Add User Dialog
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'accountant',
    plan: 'free'
  });

  // Custom Permissions Dialog
  const [isPermsOpen, setIsPermsOpen] = useState(false);
  const [customPerms, setCustomPerms] = useState([]);

  // Reset Password Dialog
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const loadUsers = () => {
    setUsers(db.getAll('users'));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ساده: هش پسورد. تو پروژه واقعی از bcrypt استفاده کن
  const hashPassword = (password) => {
    // فعلا خام میریزیم. بعدا باید bcrypt باشه
    return password;
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.fullName ||!newUser.username ||!newUser.password) {
      toast.error('نام، نام کاربری و رمز عبور الزامی است');
      return;
    }
    if (newUser.password.length < 6) {
      toast.error('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    // چک کن یوزرنیم تکراری نباشه
    const exists = users.find(u => u.username === newUser.username);
    if (exists) {
      toast.error('این نام کاربری قبلا ثبت شده');
      return;
    }

    try {
      db.create('users', {
        fullName: newUser.fullName,
        username: newUser.username,
        password: hashPassword(newUser.password),
        role: newUser.role,
        plan: newUser.plan,
        status: 'active',
        avatar: null,
        customPermissions: [],
        lastLogin: null,
        createdAt: new Date().toISOString()
      });
      toast.success(`کاربر ${newUser.fullName} با موفقیت ساخته شد`);
      setIsAddUserOpen(false);
      setNewUser({ fullName: '', username: '', password: '', role: 'accountant', plan: 'free' });
      loadUsers();
    } catch (err) {
      toast.error('خطا در ساخت کاربر: ' + err.message);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    try {
      db.update('users', userId, { role: newRole });
      toast.success('نقش امنیتی کاربر تغییر یافت');
      loadUsers();
    } catch (err) {
      toast.error('خطا در تغییر نقش: ' + err.message);
    }
  };

  const handlePlanChange = (userId, newPlan) => {
    try {
      db.update('users', userId, { plan: newPlan });
      toast.success('طرح اشتراک کاربر با موفقیت تغییر یافت');
      loadUsers();
    } catch (err) {
      toast.error('خطا در تغییر طرح: ' + err.message);
    }
  };

  const handleBanToggle = (userObj) => {
    if (userObj.id === currentUser.id) {
      toast.error('شما نمی‌توانید حساب کاربری خود را مسدود کنید');
      return;
    }

    const newStatus = userObj.status === 'banned'? 'active' : 'banned';
    db.update('users', userObj.id, { status: newStatus });

    toast.success(newStatus === 'banned'? 'کاربر با موفقیت مسدود شد' : 'کاربر با موفقیت فعال گردید');
    loadUsers();
  };

  const handleDelete = (userId) => {
    if (userId === currentUser.id) {
      toast.error('شما نمی‌توانید حساب کاربری خود را حذف کنید');
      return;
    }

    if (confirm('آیا از حذف دائم این کاربر اطمینان دارید؟ تمام دسترسی‌های وی مسدود خواهد شد.')) {
      db.delete('users', userId);
      toast.success('کاربر با موفقیت حذف شد');
      loadUsers();
    }
  };

  // Custom Permissions handling
  const handleOpenPerms = (userObj) => {
    setSelectedUser(userObj);
    setCustomPerms(userObj.customPermissions || []);
    setIsPermsOpen(true);
  };

  const handleTogglePerm = (perm) => {
    setCustomPerms(prev => {
      if (prev.includes(perm)) {
        return prev.filter(p => p!== perm);
      }
      return [...prev, perm];
    });
  };

  const handleSavePerms = () => {
    try {
      db.update('users', selectedUser.id, { customPermissions: customPerms });
      toast.success('مجوزهای شخصی‌سازی شده کاربر با موفقیت ذخیره شد');
      setIsPermsOpen(false);
      loadUsers();
    } catch (err) {
      toast.error('خطا در ذخیره مجوزها');
    }
  };

  // Reset password handling
  const handleOpenPassword = (userObj) => {
    setSelectedUser(userObj);
    setNewPassword('');
    setIsPasswordOpen(true);
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('رمز عبور جدید باید حداقل ۶ کاراکتر باشد');
      return;
    }

    try {
      db.update('users', selectedUser.id, { password: hashPassword(newPassword) });
      toast.success(`رمز عبور کاربر ${selectedUser.fullName} با موفقیت بازنشانی شد`);
      setIsPasswordOpen(false);
    } catch (err) {
      toast.error('خطا در تغییر رمز عبور');
    }
  };

  return (
    <div className="space-y-6 text-right">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">مدیریت کاربران و دسترسی‌ها</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">پایش کاربران سامانه، تغییر سطوح دسترسی (RBAC)، کنترل طرح‌های اشتراک و اقدامات امنیتی</p>
        </div>
        <Button onClick={() => setIsAddUserOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          افزودن کاربر جدید
        </Button>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام کامل</TableHead>
                <TableHead>نام کاربری</TableHead>
                <TableHead>نقش سیستم</TableHead>
                <TableHead>طرح کاربری</TableHead>
                <TableHead>آخرین ورود</TableHead>
                <TableHead className="text-center">وضعیت</TableHead>
                <TableHead className="w-56 text-center">عملیات مدیریتی</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-bold text-xs">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {u.avatar? (
                        <img src={u.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 flex items-center justify-center font-black text-xs">
                          {u.fullName.charAt(0)}
                        </div>
                      )}
                      <span>{u.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold font-sans text-slate-600 dark:text-slate-400">@{u.username}</TableCell>

                  <TableCell>
                    {u.id === currentUser.id? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {u.role === 'owner'? 'مالک سیستم' : u.role}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 focus:outline-none font-bold"
                      >
                        <option value="owner">مالک سیستم</option>
                        <option value="admin">مدیر کل</option>
                        <option value="accountant">حسابدار</option>
                        <option value="viewer">مشاهده‌گر</option>
                      </select>
                    )}
                  </TableCell>

                  <TableCell>
                    <select
                      value={u.plan}
                      onChange={(e) => handlePlanChange(u.id, e.target.value)}
                      className="text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 focus:outline-none font-bold"
                    >
                      <option value="free">طرح رایگان (Free)</option>
                      <option value="pro">طرح حرفه‌ای (Pro)</option>
                      <option value="business">طرح تجاری (Business)</option>
                    </select>
                  </TableCell>

                  <TableCell className="font-sans text-[10px] text-slate-500">
                    {u.lastLogin? isoToJalaliWithTime(u.lastLogin) : 'هرگز'}
                  </TableCell>

                  <TableCell className="text-center">
                    {u.status === 'banned'? (
                      <Badge variant="danger">مسدود شده</Badge>
                    ) : (
                      <Badge variant="success">فعال</Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                      <Button
                        onClick={() => handleOpenPerms(u)}
                        size="sm"
                        variant="secondary"
                        className="text-[10px] py-1 px-2 font-bold"
                      >
                        مجوزها
                      </Button>
                      <Button
                        onClick={() => handleOpenPassword(u)}
                        size="sm"
                        variant="secondary"
                        className="text-[10px] py-1 px-2 font-bold"
                      >
                        رمز عبور
                      </Button>
                      <button
                        onClick={() => handleBanToggle(u)}
                        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                          u.status === 'banned'? 'text-emerald-600' : 'text-amber-600'
                        }`}
                        title={u.status === 'banned'? 'رفع مسدودیت' : 'مسدود کردن کاربر'}
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-rose-600"
                        title="حذف کامل کاربر"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogHeader>
          <DialogTitle>افزودن کاربر جدید به سیستم</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleAddUser} className="space-y-4 text-right">
            <Input
              label="نام و نام خانوادگی"
              placeholder="مثلا: علی رضایی"
              value={newUser.fullName}
              onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
              required
            />
            <Input
              label="نام کاربری"
              placeholder="مثلا: ali.rezaei"
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              required
            />
            <Input
              label="رمز عبور اولیه"
              type="password"
              placeholder="حداقل ۶ کاراکتر"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">نقش سیستم</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:outline-none"
                >
                  <option value="admin">مدیر کل</option>
                  <option value="accountant">حسابدار</option>
                  <option value="viewer">مشاهده‌گر</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">طرح کاربری</label>
                <select
                  value={newUser.plan}
                  onChange={(e) => setNewUser({...newUser, plan: e.target.value})}
                  className="w-full text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:outline-none"
                >
                  <option value="free">رایگان</option>
                  <option value="pro">حرفه‌ای</option>
                  <option value="business">تجاری</option>
                </select>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="secondary" type="button" onClick={() => setIsAddUserOpen(false)}>انصراف</Button>
              <Button type="submit" variant="primary">ساخت کاربر</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPermsOpen} onOpenChange={setIsPermsOpen}>
        <DialogHeader>
          <DialogTitle>تنظیم مجوزهای شخصی‌سازی شده: {selectedUser?.fullName}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4 text-right">
            <p className="text-xs text-slate-500 font-bold mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
              شما می‌توانید به جای نقش‌های پیش‌فرض، دسترسی‌های فردی به کاربر اعطا کنید:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'CREATE_TRANSACTION', label: 'حق ثبت تراکنش جدید' },
                { key: 'APPROVE_TRANSACTION', label: 'حق تایید/ممیزی اسناد' },
                { key: 'VIEW_REPORTS', label: 'دسترسی به گزارشات جامع' },
                { key: 'MANAGE_ACCOUNTS', label: 'مدیریت حساب‌های خزانه' },
                { key: 'MANAGE_USERS', label: 'مدیریت کاربران و دسترسی‌ها' },
                { key: 'EXPORT_DATA', label: 'خروجی اکسل/پی‌دی‌اف' },
                { key: 'MANAGE_SETTINGS', label: 'مدیریت تنظیمات کل شرکت' }
              ].map((perm) => {
                const isChecked = customPerms.includes(perm.key);
                return (
                  <button
                    key={perm.key}
                    type="button"
                    onClick={() => handleTogglePerm(perm.key)}
                    className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-750 dark:text-slate-255 text-right p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    {isChecked? (
                      <CheckSquare className="h-4.5 w-4.5 text-[#1e40af]" />
                    ) : (
                      <Square className="h-4.5 w-4.5 text-slate-400" />
                    )}
                    <span>{perm.label}</span>
                  </button>
                );
              })}
            </div>

            <DialogFooter className="mt-6">
              <Button variant="secondary" onClick={() => setIsPermsOpen(false)}>انصراف</Button>
              <Button variant="primary" onClick={handleSavePerms}>ذخیره تغییرات مجوزها</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogHeader>
          <DialogTitle>تغییر رمز عبور کاربر: {selectedUser?.fullName}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSavePassword} className="space-y-4 text-right">

            <Input
              label="رمز عبور جدید"
              type="password"
              placeholder="••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsPasswordOpen(false)}>انصراف</Button>
              <Button type="submit" variant="primary">تغییر رمز عبور</Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}