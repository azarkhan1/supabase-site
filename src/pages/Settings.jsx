import React, { useState, useEffect, useContext } from 'react';
import { db } from '../services/db';
import { WorkspaceContext } from '../contexts/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { fileService } from '../services/fileService';
import { 
  Building, Settings as SettingsIcon, Coins, Image, 
  HelpCircle, MonitorDown, Sparkles, Sliders 
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { activeWorkspace, updateWorkspace } = useContext(WorkspaceContext);
  
  // Settings Form state
  const [settings, setSettings] = useState({
    companyName: '',
    logo: '',
    currency: 'AFN',
    secondaryCurrency: 'USD',
    exchangeRate: 70,
    approvalRequired: true
  });

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    // Load Workspace settings
    if (activeWorkspace) {
      // Load global configurations
      const globalSettings = db.getAll('settings')[0] || {
        companyName: activeWorkspace.name,
        logo: activeWorkspace.logo,
        currency: activeWorkspace.currency,
        secondaryCurrency: activeWorkspace.secondaryCurrency,
        exchangeRate: activeWorkspace.exchangeRate,
        approvalRequired: true
      };
      
      setSettings({
        companyName: globalSettings.companyName || activeWorkspace.name,
        logo: globalSettings.logo || activeWorkspace.logo || '',
        currency: globalSettings.currency || activeWorkspace.currency || 'AFN',
        secondaryCurrency: globalSettings.secondaryCurrency || activeWorkspace.secondaryCurrency || 'USD',
        exchangeRate: globalSettings.exchangeRate || activeWorkspace.exchangeRate || 70,
        approvalRequired: globalSettings.approvalRequired !== undefined ? globalSettings.approvalRequired : true
      });
    }

    // PWA beforeinstallprompt handler
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [activeWorkspace]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = fileService.validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    try {
      const base64 = await fileService.fileToBase64(file);
      setSettings(prev => ({ ...prev, logo: base64 }));
      toast.success('لوگو با موفقیت انتخاب شد');
    } catch (err) {
      toast.error('خطا در پردازش لوگو');
    }
  };

  const handleSave = () => {
    try {
      if (!settings.companyName) {
        toast.error('نام شرکت نمی‌تواند خالی باشد');
        return;
      }

      // Update Workspace properties
      if (activeWorkspace) {
        updateWorkspace(activeWorkspace.id, {
          name: settings.companyName,
          logo: settings.logo,
          currency: settings.currency,
          secondaryCurrency: settings.secondaryCurrency,
          exchangeRate: settings.exchangeRate
        });
      }

      // Save global settings record
      db.setRaw('settings', settings);
      db.logAction('update_settings', 'settings', 'global', 'بروزرسانی تنظیمات عمومی مالی شرکت');
      
      toast.success('تنظیمات عمومی شرکت با موفقیت ذخیره شد');
    } catch (err) {
      toast.error('خطا در ذخیره تنظیمات: ' + err.message);
    }
  };

  const handlePWAInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('برنامه با موفقیت روی سیستم شما نصب گردید');
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="space-y-6 text-right">
      
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">تنظیمات سیستم</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">پیکربندی نرخ‌های برابری ارزها، تنظیمات سرور آفلاین و ابزارهای وب اپلیکیشن پیشرو (PWA)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: PWA installer card */}
        <div className="space-y-6">
          {showInstallBtn && (
            <Card className="border-2 border-dashed border-[#1e40af] dark:border-blue-500 bg-blue-50/10 dark:bg-blue-950/10">
              <CardHeader>
                <div className="flex items-center space-x-2 space-x-reverse text-[#1e40af] dark:text-blue-400">
                  <MonitorDown className="h-5 w-5" />
                  <CardTitle className="text-sm">نصب نسخه دسکتاپ و موبایل (PWA)</CardTitle>
                </div>
                <CardDescription>
                  این سامانه کاملا آفلاین کار می‌کند. برای دسترسی سریع‌تر، آن را بدون نیاز به اینترنت نصب کنید.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button onClick={handlePWAInstall} className="w-full font-bold flex items-center justify-center space-x-2 space-x-reverse text-xs">
                  <Sparkles className="h-4 w-4" />
                  <span>نصب اپلیکیشن روی دستگاه من</span>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            <CardHeader>
              <CardTitle className="text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5" />
                <span>سامانه مالی آفلاین‌محور</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <p>این نرم‌افزار به صورت ۱۰۰٪ آفلاین بوده و داده‌های شما صرفاً در فضای ذخیره‌سازی محلی مرورگر (Local Storage) در دستگاه فعلی قرار دارد.</p>
              <p className="text-rose-600 dark:text-rose-400">توصیه مهم: پاک کردن کش مرورگر و بازنشانی تنظیمات ممکن است داده‌های شما را از بین ببرد. برای حفظ امنیت، همواره از بخش پنل مدیریت نسخه پشتیبان بگیرید.</p>
            </CardContent>
          </Card>
        </div>

        {/* Right column: General Settings forms */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5 text-[#1e40af]" />
                <span>تنظیمات حقوقی و مالی سازمان</span>
              </CardTitle>
              <CardDescription>نام تجاری، ارز پیش‌فرض مبادلات، نرخ برابری و روال تایید تراکنش‌ها</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-right">
              
              {/* Org settings */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#1e40af] dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>شناسه حقوقی شرکت</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                  <Input
                    label="نام شرکت / سازمان تجاری"
                    value={settings.companyName}
                    onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                  />

                  {/* Logo select wrapper */}
                  <div className="space-y-1.5">
                    <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400">لوگو و نشان تجاری</span>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <label 
                        htmlFor="logo-upload-settings" 
                        className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center space-x-1.5 space-x-reverse cursor-pointer"
                      >
                        <Image className="h-4 w-4 text-slate-400" />
                        <span>آپلود لوگوی جدید</span>
                      </label>
                      <input 
                        id="logo-upload-settings"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      {settings.logo && (
                        <img 
                          src={settings.logo} 
                          alt="Logo Preview" 
                          className="h-10 w-10 object-contain border border-slate-200 dark:border-slate-800 rounded"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Currency settings */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#1e40af] dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  <span>تنظیمات ارزی و برابری</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Select
                    label="ارز اصلی (برابری مبنا)"
                    value={settings.currency}
                    onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    <option value="AFN">افغانی (AFN)</option>
                    <option value="USD">دلار ایالات متحده (USD)</option>
                  </Select>

                  <Select
                    label="ارز ثانویه تراز"
                    value={settings.secondaryCurrency}
                    onChange={(e) => setSettings(prev => ({ ...prev, secondaryCurrency: e.target.value }))}
                  >
                    <option value="USD">دلار ایالات متحده (USD)</option>
                    <option value="AFN">افغانی (AFN)</option>
                  </Select>

                  <Input
                    label="نرخ برابری (مثلا چند افغانی معادل یک دلار)"
                    type="number"
                    value={settings.exchangeRate}
                    onChange={(e) => setSettings(prev => ({ ...prev, exchangeRate: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Approval workflow settings */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#1e40af] dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  <span>روال ممیزی و حسابداری</span>
                </h3>

                <div className="flex items-center space-x-3 space-x-reverse py-1">
                  <input
                    type="checkbox"
                    id="approvalRequired"
                    checked={settings.approvalRequired}
                    onChange={(e) => setSettings(prev => ({ ...prev, approvalRequired: e.target.checked }))}
                    className="rounded border-slate-300 dark:border-slate-700 text-[#1e40af] focus:ring-[#1e40af] h-4.5 w-4.5"
                  />
                  <label htmlFor="approvalRequired" className="text-xs font-bold text-slate-750 dark:text-slate-200 cursor-pointer">
                    فعال‌سازی روال تایید/ممیزی مدیریت (تراکنش‌های جدید در وضعیت «در انتظار» ثبت شده و نیاز به تایید دارند)
                  </label>
                </div>
              </div>

              {/* Submit btn */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button onClick={handleSave} className="font-bold text-xs">
                  ذخیره پیکربندی عمومی سیستم
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
