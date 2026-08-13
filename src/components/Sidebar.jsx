import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Truck, 
  Users, 
  ShoppingCart, 
  ShoppingBag, 
  Warehouse, 
  BarChart3, 
  Settings, 
  Shield, 
  X,
  Store
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const menuItems = [
  { path: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { path: '/sales', label: 'نقطة البيع', icon: ShoppingCart },
  { path: '/products', label: 'المنتجات', icon: Package },
  { path: '/categories', label: 'التصنيفات', icon: Tags },
  { path: '/suppliers', label: 'الموردين', icon: Truck },
  { path: '/customers', label: 'العملاء', icon: Users },
  { path: '/purchases', label: 'المشتريات', icon: ShoppingBag },
  { path: '/inventory', label: 'المخزون', icon: Warehouse },
  { path: '/reports', label: 'التقارير', icon: BarChart3 },
  { path: '/settings', label: 'الإعدادات', icon: Settings },
]

const Sidebar = ({ onClose }) => {
  const location = useLocation()
  const { isAdmin } = useAuth()

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-600 rounded-lg">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">سماء الشعب</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">نظام إدارة البقالة</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}

        {/* رابط المستخدمين - للمدير فقط */}
        {isAdmin && (
          <NavLink
            to="/users"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
              }`
            }
          >
            <Shield className="w-5 h-5" />
            <span>المستخدمون</span>
          </NavLink>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
          سماء الشعب © 2024
        </p>
      </div>
    </div>
  )
}

export default Sidebar