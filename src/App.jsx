import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('nematnoorzai558@gmail.com');
  const [password, setPassword] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('deposit');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // چک کردن لاگین
  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) loadTransactions(currentUser.uid);
    });
  }, []);

  // لاگین
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert('ایمیل یا پسورد اشتباهه: ' + err.message);
    }
    setLoading(false);
  };

  // خروج
  const handleLogout = () => signOut(auth);

  // ذخیره تراکنش
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!amount) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: Number(amount),
        type: type,
        createdAt: new Date()
      });
      setAmount('');
      loadTransactions(user.uid);
    } catch (err) {
      alert('خطا در ذخیره: ' + err.message);
    }
    setLoading(false);
  };

  // گرفتن تراکنش‌ها
  const loadTransactions = async (uid) => {
    const q = query(collection(db, 'transactions'), where('userId', '==', uid));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTransactions(data.sort((a, b) => b.createdAt - a.createdAt));
  };

  // اگه لاگین نکرده
  if (!user) {
    return (
      <div style={{ padding: 40, maxWidth: 400, margin: 'auto' }}>
        <h2>ورود به پنل نورزایی</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="ایمیل" 
            style={{ width: '100%', padding: 8, marginBottom: 10 }} 
          />
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="پسورد" 
            style={{ width: '100%', padding: 8, marginBottom: 10 }} 
          />
          <button disabled={loading} style={{ width: '100%', padding: 10 }}>
            {loading ? 'صبر کن...' : 'ورود'}
          </button>
        </form>
      </div>
    );
  }

  // اگه لاگین کرده
  return (
    <div style={{ padding: 40, maxWidth: 600, margin: 'auto' }}>
      <button onClick={handleLogout} style={{ float: 'left' }}>خروج</button>
      <h2>خوش اومدی {user.email}</h2>
      
      <form onSubmit={handleAdd} style={{ marginTop: 30, marginBottom: 30 }}>
        <input 
          type="number" 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
          placeholder="مبلغ" 
          style={{ padding: 8, marginLeft: 10 }} 
        />
        <select value={type} onChange={e => setType(e.target.value)} style={{ padding: 8, marginLeft: 10 }}>
          <option value="deposit">واریز</option>
          <option value="withdraw">برداشت</option>
        </select>
        <button disabled={loading} style={{ padding: 8 }}>
          {loading ? '...' : 'ثبت'}
        </button>
      </form>

      <h3>تراکنش‌های شما:</h3>
      {transactions.length === 0 ? <p>تراکنشی نیست</p> : (
        <table border="1" cellPadding="10" style={{ width: '100%' }}>
          <thead>
            <tr><th>نوع</th><th>مبلغ</th><th>تاریخ</th></tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td>{t.type === 'deposit' ? 'واریز' : 'برداشت'}</td>
                <td>{t.amount.toLocaleString()}</td>
                <td>{new Date(t.createdAt.seconds * 1000).toLocaleString('fa-IR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;