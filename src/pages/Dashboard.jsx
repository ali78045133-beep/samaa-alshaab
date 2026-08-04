import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
  <div className="card hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
)

const Dashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    monthlySales: 0,
    totalProfit: 0,
    inventoryValue: 0,
    productsCount: 0,
    suppliersCount: 0,
  })
  const [lowStock, setLowStock] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

      // مبيعات اليوم
      const { data: todaySalesData } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', today)

      const todaySales = todaySalesData?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0

      // مبيعات الشهر
      const { data: monthlySalesData } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', firstDayOfMonth)

      const monthlySales = monthlySalesData?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0

      // إجمالي الأرباح
      const { data: profitData } = await supabase
        .from('sales')
        .select('profit')

      const totalProfit = profitData?.reduce((sum, s) => sum + (s.profit || 0), 0) || 0

      // عدد المنتجات
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      // عدد الموردين
      const { count: suppliersCount } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })

      // قيمة المخزون
      const { data: inventoryData } = await supabase
        .from('products')
        .select('quantity, purchase_price')

      const inventoryValue = inventoryData?.reduce((sum, p) => 
        sum + ((p.quantity || 0) * (p.purchase_price || 0)), 0
      ) || 0

      // منتجات قاربت على النفاد
      const { data: lowStockData } = await supabase
        .from('products')
        .select('name, quantity, min_stock')
        .lte('quantity', supabase.rpc('get_min_stock'))
        .order('quantity', { ascending: true })
        .limit(5)

      // أحدث المبيعات
      const { data: recentSalesData } = await supabase
        .from('sales')
        .select('*, customers(name)')
        .order('created_at', { ascending: false })
        .limit(5)

      // بيانات الرسم البياني (آخر 7 أيام)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d.toISOString().split('T')[0]
      })

      const chartDataPromises = last7Days.map(async (date) => {
        const { data } = await supabase
          .from('sales')
          .select('total_amount')
          .gte('created_at', date)
          .lt('created_at', date + 'T23:59:59')

        const total = data?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0
        return {
          date: new Date(date).toLocaleDateString('ar-SA', { weekday: 'short' }),
          sales: total,
        }
      })

      const chartResult = await Promise.all(chartDataPromises)

      setStats({
        todaySales,
        monthlySales,
        totalProfit,
        inventoryValue,
        productsCount: productsCount || 0,
        suppliersCount: suppliersCount || 0,
      })
      setLowStock(lowStockData || [])
      setRecentSales(recentSalesData || [])
      setChartData(chartResult)
    } catch (error) {
      console.error('خطأ في جلب بيانات لوحة التحكم:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
        <button 
          onClick={fetchDashboardData}
          className="btn-secondary text-sm"
        >
          تحديث
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="مبيعات اليوم"
          value={`${stats.todaySales.toFixed(2)} ر.س`}
          icon={DollarSign}
          trend="up"
          trendValue="+12%"
          color="bg-green-500"
        />
        <StatCard
          title="مبيعات الشهر"
          value={`${stats.monthlySales.toFixed(2)} ر.س`}
          icon={TrendingUp}
          trend="up"
          trendValue="+8%"
          color="bg-blue-500"
        />
        <StatCard
          title="إجمالي الأرباح"
          value={`${stats.totalProfit.toFixed(2)} ر.س`}
          icon={DollarSign}
          color="bg-purple-500"
        />
        <StatCard
          title="قيمة المخزون"
          value={`${stats.inventoryValue.toFixed(2)} ر.س`}
          icon={Package}
          color="bg-orange-500"
        />
        <StatCard
          title="عدد المنتجات"
          value={stats.productsCount}
          icon={Package}
          color="bg-cyan-500"
        />
        <StatCard
          title="عدد الموردين"
          value={stats.suppliersCount}
          icon={Users}
          color="bg-pink-500"
        />
      </div>

      {/* Chart & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            مبيعات آخر 7 أيام
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    direction: 'rtl'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#0ea5e9" 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  name="المبيعات"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              منتجات قاربت على النفاد
            </h3>
          </div>

          {lowStock.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              لا توجد منتجات ناقصة حالياً
            </p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((product, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      الحد الأدنى: {product.min_stock}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded">
                    {product.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            أحدث عمليات البيع
          </h3>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>العميل</th>
                <th>المبلغ</th>
                <th>التاريخ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    لا توجد مبيعات حالياً
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="font-medium">#{sale.id?.toString().slice(-4)}</td>
                    <td>{sale.customers?.name || 'عميل نقدي'}</td>
                    <td className="font-bold text-primary-600">
                      {sale.total_amount?.toFixed(2)} ر.س
                    </td>
                    <td>
                      {new Date(sale.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                        مكتملة
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard