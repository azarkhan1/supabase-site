import React, { useContext, useState } from 'react';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { formatCurrency, toPersianNumbers } from '../../lib/utils';
import { 
  Building, ShieldCheck, Mail, Phone, Users, 
  MapPin, Check, UserPlus, Trash2, Edit 
} from 'lucide-react';
import { toast } from 'sonner';

export default function CompanyProfile() {
  const { user } = useAuth();
  const { activeWorkspace, members, inviteMember, changeMemberRole, removeMember } = useContext(WorkspaceContext);
  
  const [isOpen, setIsOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteUsername) {
      toast.error('لطفاً نام کاربری را وارد کنید');
      return;
    }

    try {
      inviteMember(inviteUsername, inviteRole);
      toast.success('همکار جدید با موفقیت به فضای کاری دعوت شد');
      setIsOpen(false);
      setInviteUsername('');
      setInviteRole('viewer');
    } catch (err) {
      toast.error(err.message || 'خطا در دعوت کاربر');
    }
  };

  const handleRoleChange = (membershipId, newRole) => {
    try {
      changeMemberRole(membershipId, newRole);
      toast.success('نقش عضو در فضای کاری تغییر یافت');
    } catch (err) {
      toast.error(err.message || 'خطا در تغییر نقش');
    }
  };

  const handleRemove = (membershipId) => {
    if (confirm('آیا از حذف این عضو از فضای کاری شرکت اطمینان دارید؟')) {
      try {
        removeMember(membershipId);
        toast.success('عضو با موفقیت از فضای کاری شرکت حذف شد');
      } catch (err) {
        toast.error(err.message || 'خطا در حذف عضو');
      }
    }
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">پرونده حقوقی و همکاران شرکت</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">پیکربندی اطلاعات ثبتی، نشانی دفتر مرکزی و مدیریت سطوح دسترسی پرسنل</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Legal details */}
        <Card className="border border-slate-200 dark:border-slate-800 h-fit">
          <CardHeader className="text-center flex flex-col items-center justify-center pb-2">
            {activeWorkspace?.logo ? (
              <img 
                src={activeWorkspace.logo} 
                alt="Logo" 
                className="h-16 w-16 object-contain rounded-lg border border-slate-100 dark:border-slate-800"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-[#1e40af] text-white flex items-center justify-center font-black text-3xl shadow-sm">
                F
              </div>
            )}
            
            <h2 className="text-base font-black text-slate-950 dark:text-white mt-4">{activeWorkspace?.name || 'شرکت نمونه'}</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">شناسه حقوقی فضای کاری: {activeWorkspace?.id}</p>
          </CardHeader>
          
          <CardContent className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="flex items-center space-x-3 space-x-reverse">
              <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <span>نشانی: {activeWorkspace?.address || ' کابل ،افغانستان'}</span>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <span>شماره تماس: <span className="font-sans">{toPersianNumbers(activeWorkspace?.phone || '0792266556')}</span></span>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              <Building className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <span>کد اقتصادی/مالیاتی: <span className="font-sans">{toPersianNumbers(activeWorkspace?.taxId || '001--')}</span></span>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              <ShieldCheck className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <span>سال مالیاتی جاری: از <span className="font-sans">{toPersianNumbers(activeWorkspace?.fiscalYearStart || '۰۱/۰۱')}</span></span>
            </div>
          </CardContent>
        </Card>

        {/* Right column: Workspace Members */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1 text-right">
                <CardTitle className="text-sm">مدیریت تیم و همکاران</CardTitle>
                <CardDescription>تعیین دسترسی‌های پرسنل دعوت شده به دفاتر مالی شرکت</CardDescription>
              </div>
              
              {(user?.role === 'owner' || user?.role === 'admin' || user?.isAdmin) && (
                <Button onClick={() => setIsOpen(true)} className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold">
                  <UserPlus className="h-4 w-4" />
                  <span>دعوت همکار جدید</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام همکار</TableHead>
                    <TableHead>نام کاربری</TableHead>
                    <TableHead>نقش در شرکت</TableHead>
                    <TableHead className="w-24 text-center">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-bold text-xs">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {m.avatar ? (
                            <img src={m.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 flex items-center justify-center font-black text-xs">
                              {m.fullName.charAt(0)}
                            </div>
                          )}
                          <span>{m.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold font-sans text-slate-600 dark:text-slate-400">@{m.username}</TableCell>
                      <TableCell>
                        {(user?.role === 'owner' || user?.isAdmin) && m.role !== 'owner' ? (
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            className="text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 focus:border-[#1e40af] focus:outline-none font-bold"
                          >
                            <option value="admin">مدیر مالی</option>
                            <option value="accountant">حسابدار</option>
                            <option value="viewer">مشاهده‌گر</option>
                          </select>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold">
                            {
                              m.role === 'owner' ? 'مالک شرکت' : m.role === 'admin' ? 'مدیر مالی' : m.role === 'accountant' ? 'حسابدار' : 'مشاهده‌گر'
                            }
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {m.role !== 'owner' && (user?.role === 'owner' || user?.isAdmin) && (
                          <button
                            onClick={() => handleRemove(m.id)}
                            className="p-1.5 text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-rose-650 font-bold text-xs"
                            title="لغو عضویت"
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Invite Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogHeader onOpenChange={setIsOpen}>
          <DialogTitle>دعوت همکار جدید به فضای کاری شرکت</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleInvite} className="space-y-4 text-right">
            
            <Input
              label="نام کاربری همکار در سامانه"
              placeholder="مثال: reza_k"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
            />

            <Select
              label="نقش و سطح دسترسی"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="admin">مدیر مالی (حق ثبت و تایید اسناد)</option>
              <option value="accountant">حسابدار (حق ثبت اسناد جدید)</option>
              <option value="viewer">مشاهده‌گر (فقط دسترسی به گزارشات)</option>
            </Select>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsOpen(false)}>انصراف</Button>
              <Button type="submit" variant="primary">ارسال دعوتنامه</Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
