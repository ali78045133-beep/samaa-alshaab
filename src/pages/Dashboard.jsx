import { useEffect, useState } from 'react'
import { 
  Package, ShoppingCart, Users, TrendingUp, AlertTriangle,
  DollarSign, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { query } from '../db.js'
import StatCard from '../components/StatCard.jsx'
import { formatCurrency } from '../utils/helpers.js'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    todaySales: 0,
    todayPurchases: 0,
    totalCustomers: 0,
    totalSuppliers: 0
  })
  const [recentSales, setRecentSales] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])

  useEffect(() => {
    try {
      // Stats
      const products = query("SELECT COUNT(*) as c FROM products")
      const low = query("SELECT COUNT(*) as c FROM products WHERE quantity <= min_stock")
      const todaySalesQ = query("SELECT COALESCE(SUM(total), 0) as s FROM sales WHERE date(created_at) = date('now')")
      const todayPurchasesQ = query("SELECT COALESCE(SUM(total), 0) as s FROM purchases WHERE date(created_at) = date('now')")
      const customers = query("SELECT COUNT(*) as c FROM customers")
      const suppliers = query("SELECT COUNT(*) as c FROM suppliers")

      setStats({
        totalProducts: products[0]?.c || 0,
        lowStock: low[0]?.c || 0,
        todaySales: todaySalesQ[0]?.s || 0,
        todayPurchases: todayPurchasesQ[0]?.s || 0,
        totalCustomers: customers[0]?.c || 0,
        totalSuppliers: suppliers[0]?.c || 0
      })

      // Recent sales
      const recent = query(`
        SELECT s.*, c.name as customer_name 
        FROM sales s 
        LEFT JOIN customers c ON s.customer_id = c.id 
        ORDER BY s.created_at DESC 
        LIMIT 5
      `)
      setRecentSales(recent)

      // Low stock
      const lowItems = query(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.quantity <= p.min_stock 
        ORDER BY p.quantity ASC 
        LIMIT 5
      `)
      setLowStockItems(lowItems)
    } catch (e) {
      console.error('Dashboard error:', e)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">نظرة عامة على أداء المتجر</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard title="إجمالي المنتجات" value={stats.totalProducts} icon={Package} color="blue" />
        <StatCard title="مبيعات اليوم" value={formatCurrency(stats.todaySales)} icon={DollarSign} color="green" />
        <StatCard title="مشتريات اليوم" value={formatCurrency(stats.todayPurchases)} icon={ShoppingCart} color="primary" />
        <StatCard title="العملاء" value={stats.totalCustomers} icon={Users} color="purple" />
        <StatCard title="الموردين" value={stats.totalSuppliers} icon={TrendingUp} color="amber" />
        <StatCard title="منتجات منخفضة" value={stats.lowStock} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">آخر المبيعات</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentSales.length === 0 ? (
              <p className="p-4 text-center text-gray-500">لا توجد مبيعات حديثة</p>
            ) : (
              recentSales.map(sale => (
                <div key={sale.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">فاتورة #{sale.id}</p>
                    <p className="text-sm text-gray-500">{sale.customer_name || 'عميل نقدي'}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-primary-600">{formatCurrency(sale.total)}</p>
                    <p className="text-xs text-gray-400">{new Date(sale.created_at).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              تنبيهات المخزون المنخفض
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {lowStockItems.length === 0 ? (
              <p className="p-4 text-center text-gray-500">لا توجد منتجات منخفضة</p>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.category_name}</p>
                  </div>
                  <div className="text-left">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {item.quantity} / {item.min_stock}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
