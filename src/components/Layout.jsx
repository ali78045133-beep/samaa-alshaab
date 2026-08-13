import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, Package, Tags, Truck, Users, ShoppingCart, 
  Calculator, Warehouse, BarChart3, Settings, UserCog, 
  LogOut, Menu, X, ChevronLeft, Bell, Search
} from 'lucide-react'
import { query } from '../db.js'

const menuItems = [
  { path: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { path: '/products', label: 'المنتجات', icon: Package },
  { path: '/categories', label: 'التصنيفات', icon: Tags },
  { path: '/suppliers', label: 'الموردين', icon: Truck },
  { path: '/customers', label: 'العملاء', icon: Users },
  { path: '/purchases', label: 'المشتريات', icon: ShoppingCart },
  { path: '/cashier', label: 'الكاشير', icon: Calculator },
  { path: '/inventory', label: 'المخزون', icon: Warehouse },
  { path: '/reports', label: 'التقارير', icon: BarChart3 },
  { path: '/users', label: 'المستخدمين', icon: UserCog },
  { path: '/settings', label: 'الإعدادات', icon: Settings },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const low = query("SELECT COUNT(*) as c FROM products WHERE quantity <= min_stock")
      setLowStockCount(low[0]?.c || 0)
    } catch (e) {}
  }, [user, navigate, location.pathname])

  if (!user) return null

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 leading-tight">سماء الشعب</h1>
              <p className="text-xs text-gray-500">نظام إدارة البقالة</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            const showBadge = item.path === '/inventory' && lowStockCount > 0
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-right">{item.label}</span>
                {showBadge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{lowStockCount}</span>
                )}
                {isActive && <ChevronLeft className="w-4 h-4" />}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <UserCog className="w-4 h-4 text-primary-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
              <p className="text-xs text-gray-500">{user.role === 'admin' ? 'مدير' : 'كاشير'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:justify-end">
          <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            {lowStockCount > 0 && (
              <button 
                onClick={() => navigate('/inventory')}
                className="relative p-2 rounded-lg hover:bg-gray-100"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {lowStockCount}
                </span>
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
              <Search className="w-4 h-4" />
              <span>Ctrl+K للبحث</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
