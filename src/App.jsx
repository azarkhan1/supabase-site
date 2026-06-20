import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
  }, [])

  async function signIn() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nematnoorzai558@gmail.com',
      password: '123123',
    })
    if (error) alert('خطا: ' + error.message)
    else setUser(data.user)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) return <h2 style={{color: 'white', textAlign: 'center'}}>صبر کن...</h2>

  const buttonStyle = {
    padding: '15px 30px',
    fontSize: '18px',
    backgroundColor: 'white',
    color: 'blue',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '20px'
  }

  return (
    <div style={{ 
      textAlign: 'center', 
      marginTop: '100px',
      color: 'white',
      fontFamily: 'Tahoma'
    }}>
      {user ? (
        <>
          <h1>خوش اومدی {user.email}</h1>
          <p>لاگین شدی از Supabase ✅</p>
          <button style={buttonStyle} onClick={signOut}>خروج</button>
        </>
      ) : (
        <>
          <h1>لاگین تست Supabase</h1>
          <button style={buttonStyle} onClick={signIn}>ورود با ایمیل نعمت</button>
        </>
      )}
    </div>
  )
}

export default App