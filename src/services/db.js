// Offline-First Database Layer using localStorage
const PREFIX = 'fms_';

const defaultCategories = [
  { id: 'cat-1', name: 'خوراک', type: 'expense', color: '#e11d48', icon: 'Utensils' },
  { id: 'cat-2', name: 'حمل‌ونقل', type: 'expense', color: '#0284c7', icon: 'Car' },
  { id: 'cat-3', name: 'قبوض', type: 'expense', color: '#d97706', icon: 'FileText' },
  { id: 'cat-4', name: 'اجاره', type: 'expense', color: '#7c3aed', icon: 'Home' },
  { id: 'cat-5', name: 'حقوق', type: 'expense', color: '#16a34a', icon: 'DollarSign' },
  { id: 'cat-6', name: 'تفریح', type: 'expense', color: '#db2777', icon: 'Smile' },
  { id: 'cat-7', name: 'سلامت', type: 'expense', color: '#ea580c', icon: 'HeartPulse' },
  { id: 'cat-8', name: 'سایر', type: 'expense', color: '#4b5563', icon: 'Layers' },
  { id: 'cat-9', name: 'درآمد خدمات', type: 'income', color: '#16a34a', icon: 'TrendingUp' },
  { id: 'cat-10', name: 'سرمایه‌گذاری', type: 'income', color: '#2563eb', icon: 'TrendingUp' }
];

const defaultAccounts = [
  { id: 'acc-1', name: 'صندوق AFN', type: 'صندوق', initialBalance: 50000, currency: 'AFN', color: '#1e40af', icon: 'Wallet', isDefault: true },
  { id: 'acc-2', name: 'بانک ملی AFN', type: 'بانک', initialBalance: 250000, currency: 'AFN', color: '#166534', icon: 'Briefcase', isDefault: false },
  { id: 'acc-3', name: 'حساب دالری USD', type: 'سرمایه‌گذاری', initialBalance: 10000, currency: 'USD', color: '#854d0e', icon: 'DollarSign', isDefault: false }
];

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const db = {
  getRaw(table) {
    const key = PREFIX + table;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  setRaw(table, data) {
    const key = PREFIX + table;
    localStorage.setItem(key, JSON.stringify(data));
  },

  getAll(table, filterFn = null) {
    const items = this.getRaw(table);
    return filterFn ? items.filter(filterFn) : items;
  },

  getById(table, id) {
    const items = this.getRaw(table);
    return items.find(item => item.id === id) || null;
  },

  insert(table, obj) {
    const items = this.getRaw(table);
    const newObj = {
      ...obj,
      id: obj.id || generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newObj);
    this.setRaw(table, items);
    this.logAction('create', table, newObj.id, `ایجاد رکورد جدید در جدول ${table}`);
    return newObj;
  },

  update(table, id, updates) {
    const items = this.getRaw(table);
    let updatedObj = null;
    const newItems = items.map(item => {
      if (item.id === id) {
        updatedObj = {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        return updatedObj;
      }
      return item;
    });
    if (updatedObj) {
      this.setRaw(table, newItems);
      this.logAction('update', table, id, `ویرایش رکورد در جدول ${table}`);
    }
    return updatedObj;
  },

  delete(table, id) {
    const items = this.getRaw(table);
    const exists = items.some(item => item.id === id);
    if (exists) {
      const newItems = items.filter(item => item.id !== id);
      this.setRaw(table, newItems);
      this.logAction('delete', table, id, `حذف رکورد از جدول ${table}`);
      return true;
    }
    return false;
  },

  query(table, { where, orderBy, limit, offset } = {}) {
    let items = this.getRaw(table);
    if (where) {
      items = items.filter(where);
    }
    if (orderBy) {
      // orderBy: { field, direction: 'asc'|'desc' }
      const { field, direction = 'asc' } = orderBy;
      items.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        if (typeof valA === 'string') {
          return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return direction === 'asc' ? valA - valB : valB - valA;
      });
    }
    if (offset !== undefined) {
      items = items.slice(offset);
    }
    if (limit !== undefined) {
      items = items.slice(0, limit);
    }
    return items;
  },

  transaction(callback) {
    // Basic local storage transaction mechanism
    const snapshot = {};
    const tables = ['users', 'accounts', 'categories', 'transactions', 'commitments', 'payments', 'recurring', 'reminders', 'employees', 'dailyExpenses', 'workspaces', 'workspaceMembers', 'logs', 'settings'];
    
    // Save snapshot
    tables.forEach(table => {
      snapshot[table] = localStorage.getItem(PREFIX + table);
    });

    try {
      const result = callback(this);
      return result;
    } catch (error) {
      // Rollback on error
      tables.forEach(table => {
        if (snapshot[table] !== null) {
          localStorage.setItem(PREFIX + table, snapshot[table]);
        } else {
          localStorage.removeItem(PREFIX + table);
        }
      });
      console.error('Database transaction rolled back due to error:', error);
      throw error;
    }
  },

  logAction(action, table, recordId, detailsText) {
    try {
      // Avoid logging log actions to prevent infinite loop
      if (table === 'logs') return;
      
      const currentUserData = localStorage.getItem(PREFIX + 'current_user');
      const user = currentUserData ? JSON.parse(currentUserData) : null;
      
      const logEntry = {
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        userId: user ? user.id : 'system',
        username: user ? user.username : 'سیستم',
        action,
        table,
        recordId,
        details: JSON.stringify({ text: detailsText, time: new Date().toLocaleTimeString('fa-IR') }),
        ip: '192.168.1.' + Math.floor(Math.random() * 254 + 1)
      };

      const logs = this.getRaw('logs');
      logs.push(logEntry);
      this.setRaw('logs', logs);
    } catch (e) {
      console.error('Failed to write action log:', e);
    }
  }
};

// Seed database on first load if settings are empty
export const seedDatabase = () => {
  const isSeeded = localStorage.getItem(PREFIX + 'settings');
  if (isSeeded) return;

  console.log('Seeding initial database...');

  // 1. Settings
  db.setRaw('settings', {
    companyName: 'شرکت توسعه فناوری آریا',
    logo: '',
    currency: 'AFN',
    secondaryCurrency: 'USD',
    exchangeRate: 70,
    approvalRequired: true
  });

  // 2. Users (Admin/Owner)
  const adminId = 'user-admin-id';
  db.setRaw('users', [
    {
      id: adminId,
      username: 'admin',
      password: '123456', // Simple password for offline/demo
      fullName: 'مدیر سیستم',
      isAdmin: true,
      role: 'owner',
      plan: 'business',
      customPermissions: [],
      status: 'active',
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-accountant-id',
      username: 'accountant',
      password: '123456',
      fullName: 'حسابدار ارشد',
      isAdmin: false,
      role: 'accountant',
      plan: 'pro',
      customPermissions: ['CREATE_TRANSACTION', 'VIEW_REPORTS'],
      status: 'active',
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  ]);

  // 3. Categories
  db.setRaw('categories', defaultCategories);

  // 4. Accounts
  db.setRaw('accounts', defaultAccounts);

  // 5. Employees
  db.setRaw('employees', [
    {
      id: 'emp-1',
      name: 'احمد کریمی',
      position: 'توسعه‌دهنده ارشد',
      salary: 1200,
      currency: 'USD',
      startDate: '1402/01/15',
      phone: '0799123456',
      nationalId: '123456789',
      avatar: '',
      isActive: true
    },
    {
      id: 'emp-2',
      name: 'سارا احمدی',
      position: 'مدیر مارکتینگ',
      salary: 45000,
      currency: 'AFN',
      startDate: '1402/03/01',
      phone: '0788123456',
      nationalId: '987654321',
      avatar: '',
      isActive: true
    }
  ]);

  // 6. Commitments
  db.setRaw('commitments', [
    {
      id: 'com-1',
      title: 'خرید تجهیزات اداری',
      type: 'بدهی',
      contactName: 'فروشگاه کامپیوتر صبا',
      contactPhone: '0777123456',
      totalAmount: 50000,
      currency: 'AFN',
      dueDate: '1402/10/01',
      description: 'خرید لپ‌تاپ و مانیتور اداری',
      attachments: []
    },
    {
      id: 'com-2',
      title: 'طلب از شرکت مهندسی آریا',
      type: 'طلب',
      contactName: 'مهندس علوی',
      contactPhone: '0766123456',
      totalAmount: 3000,
      currency: 'USD',
      dueDate: '1406/05/20',
      description: 'پیش‌پرداخت پروژه توسعه نرم‌افزار مالی',
      attachments: []
    },
    {
      id: 'com-3',
      title: 'تسویه با پیمانکار دکوراسیون',
      type: 'بدهی',
      contactName: 'آقای حسینی',
      contactPhone: '0755123456',
      totalAmount: 80000,
      currency: 'AFN',
      dueDate: '1402/08/10',
      description: 'رنگ‌آمیزی دفتر مرکزی و ساخت پارتیشن‌ها',
      attachments: []
    }
  ]);

  // 7. Payments
  db.setRaw('payments', [
    {
      id: 'pay-1',
      commitmentId: 'com-2',
      amount: 1200,
      date: '1404/02/10',
      note: 'بخش اول قسط طلب',
      attachment: null
    },
    {
      id: 'pay-2',
      commitmentId: 'com-3',
      amount: 80000,
      date: '1402/08/10',
      note: 'تسویه نهایی با پیمانکار دکوراسیون',
      attachment: null
    }
  ]);

  // 8. Workspaces
  db.setRaw('workspaces', [
    {
      id: 'ws-1',
      name: 'دفتر مرکزی کابل',
      logo: '',
      currency: 'AFN',
      secondaryCurrency: 'USD',
      exchangeRate: 70,
      isDefault: true
    }
  ]);

  db.setRaw('workspaceMembers', [
    {
      id: 'wm-1',
      workspaceId: 'ws-1',
      userId: adminId,
      role: 'owner'
    },
    {
      id: 'wm-2',
      workspaceId: 'ws-1',
      userId: 'user-accountant-id',
      role: 'accountant'
    }
  ]);

  // 9. Transactions (10 sample transactions: 5 approved, 3 pending, 2 rejected)
  db.setRaw('transactions', [
    {
      id: 'tx-1',
      amount: 150000,
      currency: 'AFN',
      type: 'income',
      accountId: 'acc-2',
      categoryId: 'cat-9',
      date: '1404/10/05',
      description: 'درآمد حاصل از قرارداد مشاوره ماه دی',
      tags: ['مشاوره', 'درآمد'],
      status: 'approved',
      approvedBy: 'مدیر سیستم',
      approvedAt: new Date().toISOString(),
      attachments: []
    },
    {
      id: 'tx-2',
      amount: 25000,
      currency: 'AFN',
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-4',
      date: '1404/10/01',
      description: 'اجاره دفتر ماه جاری صندوق کابل',
      tags: ['اجاره', 'دفتر'],
      status: 'approved',
      approvedBy: 'مدیر سیستم',
      approvedAt: new Date().toISOString(),
      attachments: []
    },
    {
      id: 'tx-3',
      amount: 1200,
      currency: 'USD',
      type: 'expense',
      accountId: 'acc-3',
      categoryId: 'cat-5',
      date: '1404/10/10',
      description: 'پرداخت حقوق احمد کریمی',
      tags: ['حقوق', 'پرسنل'],
      status: 'approved',
      approvedBy: 'مدیر سیستم',
      approvedAt: new Date().toISOString(),
      attachments: []
    },
    {
      id: 'tx-4',
      amount: 3500,
      currency: 'AFN',
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-1',
      date: '1404/10/12',
      description: 'هزینه ناهار مهمانان شرکت',
      tags: ['خوراک', 'مهمانی'],
      status: 'approved',
      approvedBy: 'مدیر سیستم',
      approvedAt: new Date().toISOString(),
      attachments: []
    },
    {
      id: 'tx-5',
      amount: 5000,
      currency: 'USD',
      type: 'income',
      accountId: 'acc-3',
      categoryId: 'cat-10',
      date: '1404/10/15',
      description: 'جذب سرمایه مرحله اول پروژه مالی',
      tags: ['سرمایه', 'دلار'],
      status: 'approved',
      approvedBy: 'مدیر سیستم',
      approvedAt: new Date().toISOString(),
      attachments: []
    },
    {
      id: 'tx-6',
      amount: 12000,
      currency: 'AFN',
      type: 'expense',
      accountId: 'acc-2',
      categoryId: 'cat-3',
      date: '1404/10/20',
      description: 'قبوض برق و اینترنت دفتر مرکزی',
      tags: ['قبوض', 'برق'],
      status: 'pending',
      attachments: []
    },
    {
      id: 'tx-7',
      amount: 45000,
      currency: 'AFN',
      type: 'expense',
      accountId: 'acc-2',
      categoryId: 'cat-5',
      date: '1404/10/22',
      description: 'پرداخت حقوق سارا احمدی',
      tags: ['حقوق', 'مارکتینگ'],
      status: 'pending',
      attachments: []
    },
    {
      id: 'tx-8',
      amount: 1500,
      currency: 'AFN',
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-2',
      date: '1404/10/24',
      description: 'هزینه تاکسی همکاران به اداره مالیات',
      tags: ['حمل‌ونقل'],
      status: 'pending',
      attachments: []
    },
    {
      id: 'tx-9',
      amount: 8500,
      currency: 'AFN',
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-6',
      date: '1404/09/25',
      description: 'خرید تنقلات و جوایز دوره‌ای تیم',
      tags: ['تفریح'],
      status: 'rejected',
      approvedBy: 'مدیر سیستم',
      approvedAt: new Date().toISOString(),
      attachments: []
    },
    {
      id: 'tx-10',
      amount: 30000,
      currency: 'AFN',
      type: 'income',
      accountId: 'acc-1',
      categoryId: 'cat-9',
      date: '1404/09/28',
      description: 'پیش پرداخت پروژه وبسایت مشتری ملکی',
      tags: ['درآمد'],
      status: 'rejected',
      approvedBy: 'مدیر سیستم',
      approvedAt: new Date().toISOString(),
      attachments: []
    }
  ]);

  // 10. Daily Expenses
  db.setRaw('dailyExpenses', [
    {
      id: 'de-1',
      date: '1404/10/18',
      description: 'خرید چای و قند برای آبدارخانه',
      amount: 1800,
      currency: 'AFN',
      categoryId: 'cat-1',
      employeeId: 'emp-2',
      attachment: null
    }
  ]);

  // 11. Recurring Transactions
  db.setRaw('recurring', [
    {
      id: 'rec-1',
      name: 'اجاره ماهانه دفتر',
      amount: 25000,
      currency: 'AFN',
      type: 'expense',
      categoryId: 'cat-4',
      accountId: 'acc-1',
      frequency: 'ماهانه',
      interval: 1,
      startDate: '1404/10/01',
      endDate: '1405/10/01',
      isActive: true,
      nextRunDate: '1404/11/01',
      description: 'تولید خودکار سند اجاره دفتر کابل'
    }
  ]);

  // 12. Reminders
  db.setRaw('reminders', [
    {
      id: 'rem-1',
      title: 'بررسی تعهدات سررسید شده',
      datetime: '1404/11/01 10:00',
      description: 'بررسی بدهی‌های معوق و تماس با طلبکاران',
      linkedType: 'commitment',
      linkedId: 'com-1',
      isActive: true,
      notifyBefore: '1hour'
    }
  ]);

  // 13. System Logs
  db.setRaw('logs', [
    {
      id: 'log-1',
      timestamp: new Date().toISOString(),
      userId: 'system',
      username: 'سیستم',
      action: 'seed',
      table: 'settings',
      recordId: 'system',
      details: JSON.stringify({ text: 'داده‌های اولیه سیستم با موفقیت نصب و بارگذاری شد.', time: new Date().toLocaleTimeString('fa-IR') }),
      ip: '127.0.0.1'
    }
  ]);

  console.log('Database seeding completed successfully.');
};

// Auto-run seed
seedDatabase();
