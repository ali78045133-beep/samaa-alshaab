import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, Calendar } from 'lucide-react'
import { query } from '../db.js'
import { formatCurrency, formatDate } from '../utils/helpers.js'
import StatCard from '../components/StatCard.jsx'

export default function Reports() {
  const [period, setPeriod] = useState('today')
  const [stats, setStats] = useState({ sales: 0, purchases: 0, profit: 0, itemsSold: 0, orders: 0 })
  const [topProducts, setTopProducts] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [salesByDay, setSalesByDay] = useState([])

  useEffect(() => {
    let dateFilter = "date(s.created_at) = date('now')"
    let purchaseFilter = "date(created_at) = date('now')"
    let dayFilter = "date(created_at) = date('now')"

    if (period === 'week') {
      dateFilter = "s.created_at >= date('now', '-7 days')"
      purchaseFilter = "created_at >= date('now', '-7 days')"
      dayFilter = "created_at >= date('now', '-7 days')"
    } else if (period === 'month') {
      dateFilter = "s.created_at >= date('now', '-30 days')"
      purchaseFilter = "created_at >= date('now', '-30 days')"
      dayFilter = "created_at >= date('now', '-30 days')"
    } else if (period === 'year') {
      dateFilter = "s.created_at >= date('now', '-365 days')"
      purchaseFilter = "created_at >= date('now', '-365 days')"
      dayFilter = "created_at >= date('now', '-365 days')"
    }

    const sales = query(`SELECT COALESCE(SUM(total), 0) as s FROM sales s WHERE ${dateFilter}`)
    const purchases = query(`SELECT COALESCE(SUM(total), 0) as s FROM purchases WHERE ${purchaseFilter}`)
    const itemsSold = query(`SELECT COALESCE(SUM(quantity), 0) as s FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE ${dateFilter}`)
    const ordersCount = query(`SELECT COUNT(*) as c FROM sales s WHERE ${dateFilter}`)

    setStats({
      sales: sales[0]?.s || 0,
      purchases: purchases[0]?.s || 0,
      profit: (sales[0]?.s || 0) - (purchases[0]?.s || 0),
      itemsSold: itemsSold[0]?.s || 0,
      orders: ordersCount[0]?.c || 0
    })

    setTopProducts(query(`
      SELECT p.name, SUM(si.quantity) as total_qty, SUM(si.total) as total_revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE ${dateFilter}
      GROUP BY p.id
      ORDER BY total_qty DESC
      LIMIT 10
    `))

    setRecentSales(query(`
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE ${dateFilter}
      ORDER BY s.created_at DESC
      LIMIT 20
    `))

    setSalesByDay(query(`
      SELECT date(created_at) as day, SUM(total) as total, COUNT(*) as orders
      FROM sales
      WHERE ${dayFilter}
      GROUP BY date(created_at)
      ORDER BY day DESC
      LIMIT 30
    `))
  }, [period])

  const periodLabels = { today: 'اليوم', week: 'آخر 7 أيام', month: 'آخر 30 يوم', year: 'آخر سنة' }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
          <p className="text-gray-500">إحصائيات وتحليلات المتجر</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-transparent text-sm focus:outline-none">
            <option value="today">اليوم</option>
            <option value="week">آخر 7 أيام</option>
            <option value="month">آخر 30 يوم</option>
            <option value="year">آخر سنة</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="المبيعات" value={formatCurrency(stats.sales)} icon={DollarSign} color="green" />
        <StatCard title="المشتريات" value={formatCurrency(stats.purchases)} icon={TrendingDown} color="red" />
        <StatCard title="الربح التقديري" value={formatCurrency(stats.profit)} icon={TrendingUp} color="primary" />
        <StatCard title="القطع المباعة" value={stats.itemsSold} icon={Package} color="blue" />
        <StatCard title="عدد الفواتير" value={stats.orders} icon={BarChart3} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">أكثر المنتجات مبيعاً - {periodLabels[period]}</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {topProducts.length === 0 ? (
              <p className="p-4 text-center text-gray-500">لا توجد بيانات</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="font-medium text-sm">{p.name}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">{p.total_qty} قطعة</p>
                    <p className="text-xs text-gray-500">{formatCurrency(p.total_revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sales by Day */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">المبيعات اليومية</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {salesByDay.length === 0 ? (
              <p className="p-4 text-center text-gray-500">لا توجد بيانات</p>
            ) : (
              salesByDay.map((d, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-gray-700">{formatDate(d.day)}</span>
                  <div className="text-left">
                    <p className="font-bold text-sm text-primary-600">{formatCurrency(d.total)}</p>
                    <p className="text-xs text-gray-500">{d.orders} فاتورة</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">آخر العمليات</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {recentSales.length === 0 ? (
              <p className="p-4 text-center text-gray-500">لا توجد عمليات</p>
            ) : (
              recentSales.map(s => (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-sm">فاتورة #{s.id}</p>
                    <p className="text-xs text-gray-500">{s.customer_name || 'نقدي'}</p>
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-primary-600">{formatCurrency(s.total)}</span>
                    <p className="text-xs text-gray-400">{formatDate(s.created_at)}</p>
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
