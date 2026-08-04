import { useState, useEffect } from 'react'
import { Download, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const Reports = () => {
  const [activeReport, setActiveReport] = useState('sales')
  const [data, setData] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)

  const reports = [
    { id: 'sales', label: 'المبيعات' },
    { id: 'profits', label: 'الأرباح' },
    { id: 'products', label: 'أفضل المنتجات' },
    { id: 'purchases', label: 'المشتريات' },
  ]

  useEffect(() => { fetchReportData() }, [activeReport, dateFrom, dateTo])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      if (activeReport === 'sales' || activeReport === 'profits') {
        let query = supabase.from('sales').select('*')
        if (dateFrom) query = query.gte('created_at', dateFrom)
        if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')
        const { data: salesData } = await query
        const grouped = {}
        salesData?.forEach(s => {
          const date = new Date(s.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
          grouped[date] = (grouped[date] || 0) + (activeReport === 'profits' ? (s.profit || 0) : (s.total_amount || 0))
        })
        setData(Object.entries(grouped).map(([name, value]) => ({ name, value })))
      } else if (activeReport === 'products') {
        const { data: itemsData } = await supabase.from('sale_items').select('*, products(name)')
        const grouped = {}
        itemsData?.forEach(item => {
          const name = item.products?.name || 'منتج'
          grouped[name] = (grouped[name] || 0) + (item.quantity || 0)
        })
        setData(Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10))
      } else if (activeReport === 'purchases') {
        let query = supabase.from('purchases').select('*')
        if (dateFrom) query = query.gte('created_at', dateFrom)
        if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')
        const { data: purchasesData } = await query
        const grouped = {}
        purchasesData?.forEach(p => {
          const date = new Date(p.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
          grouped[date] = (grouped[date] || 0) + (p.total_amount || 0)
        })
        setData(Object.entries(grouped).map(([name, value]) => ({ name, value })))
      }
    } catch (error) { console.error('خطأ:', error) }
    finally { setLoading(false) }
  }

  const exportToCSV = () => {
    const headers = ['البيان', 'القيمة']
    const rows = data.map(d => [d.name, d.value])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${activeReport}_report.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">التقارير</h1>
        <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2"><Download className="w-4 h-4" /> تصدير CSV</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {reports.map(r => (
          <button key={r.id} onClick={() => setActiveReport(r.id)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeReport === r.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>{r.label}</button>
        ))}
      </div>
      <div className="flex gap-4">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field" />
      </div>
      <div className="card">
        <h3 className="font-bold mb-4">{reports.find(r => r.id === activeReport)?.label}</h3>
        {loading ? (
          <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
        ) : data.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-500">لا توجد بيانات</div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" name="القيمة" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports