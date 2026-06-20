import { db } from './db';

const CURRENT_USER_KEY = 'fms_current_user';
const TOKEN_KEY = 'fms_token';

export const authService = {
  login(username, password) {
    const users = db.getAll('users');
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user || user.password !== password) {
      throw new Error('نام کاربری یا رمز عبور اشتباه است');
    }

    if (user.status === 'banned') {
      throw new Error('حساب کاربری شما مسدود شده است');
    }

    // Generate fake JWT token safely using only ASCII credentials to prevent Latin1 encoding errors in btoa
    const tokenPayload = JSON.stringify({ id: user.id, username: user.username });
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(tokenPayload) + '.signature';
    localStorage.setItem(TOKEN_KEY, fakeToken);
    
    const updatedUser = db.update('users', user.id, { lastLogin: new Date().toISOString() });
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    
    db.logAction('login', 'users', user.id, `ورود کاربر ${user.fullName} به سیستم`);
    
    return updatedUser;
  },

  logout() {
    const user = this.getCurrentUser();
    if (user) {
      db.logAction('logout', 'users', user.id, `خروج کاربر ${user.fullName} از سیستم`);
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  getCurrentUser() {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY) && !!this.getCurrentUser();
  },

  register(userData) {
    const users = db.getAll('users');
    const exists = users.some(u => u.username.toLowerCase() === userData.username.toLowerCase());
    
    if (exists) {
      throw new Error('نام کاربری قبلاً انتخاب شده است');
    }

    const newUser = db.insert('users', {
      username: userData.username,
      password: userData.password,
      fullName: userData.fullName,
      isAdmin: false,
      role: 'accountant', // Default role for registration
      plan: 'free',
      customPermissions: [],
      status: 'active',
      lastLogin: null
    });

    db.logAction('register', 'users', newUser.id, `ثبت‌نام کاربر جدید: ${newUser.fullName}`);
    return newUser;
  },

  updateProfile(userId, updates) {
    const updatedUser = db.update('users', userId, updates);
    
    // If the updated user is the currently logged in user, update the current user in session
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }
    
    return updatedUser;
  },

  changePassword(userId, oldPassword, newPassword) {
    const user = db.getById('users', userId);
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    if (user.password !== oldPassword) {
      throw new Error('رمز عبور فعلی اشتباه است');
    }

    const updatedUser = db.update('users', userId, { password: newPassword });
    
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }

    return true;
  },

  deleteAccount(userId) {
    const result = db.delete('users', userId);
    if (result) {
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        this.logout();
      }
    }
    return result;
  }
};
