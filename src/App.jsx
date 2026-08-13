import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.js'
import { initDB } from './db.js'
import { useEffect, useState } from 'react'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Products from './pages/Products.jsx'
import Categories from './pages/Categories.jsx'
import Suppliers from './pages/Suppliers.jsx'
import Customers from './pages/Customers.jsx'
import Purchases from './pages/Purchases.jsx'
import Cashier from './pages/Cashier.jsx'
import Inventory from './pages/Inventory.jsx'
import Reports from './pages/Reports.jsx'
import Users from './pages/Users.jsx'
import Settings from './pages/Settings.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center text-gray-600">جارٍ التحميل...</div>
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/cashier" element={<Cashier />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    initDB()
      .then(() => setReady(true))
      .catch(err => {
        console.error('DB init error:', err)
        setError('فشل تهيئة قاعدة البيانات. يرجى تحديث الصفحة.')
        setReady(true)
      })
  }, [])

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جارٍ تهيئة قاعدة البيانات...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md text-center">
          <p className="font-bold mb-2">خطأ</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
