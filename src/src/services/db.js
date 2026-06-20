// src/services/db.js
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
        id: `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // این همیشه کار میکنه
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

export { db };