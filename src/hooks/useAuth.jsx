import { useState, useEffect, createContext, useContext } from 'react'
import { query } from '../db.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('samaa_auth')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch (e) {
        localStorage.removeItem('samaa_auth')
      }
    }
    setLoading(false)
  }, [])

  const login = (username, password) => {
    const users = query("SELECT * FROM users WHERE username = ? AND password = ? AND is_active = 1", [username, password])
    if (users.length > 0) {
      const u = users[0]
      setUser(u)
      localStorage.setItem('samaa_auth', JSON.stringify(u))
      return { success: true }
    }
    return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('samaa_auth')
  }

  const hasRole = (role) => {
    if (!user) return false
    if (user.role === 'admin') return true
    return user.role === role
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
