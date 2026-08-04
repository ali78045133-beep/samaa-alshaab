import { useState, useEffect } from 'react'
import { Warehouse, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

const Inventory = () => {
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [activeTab, setActiveTab] = useState('stock')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: productsData } = await supabase.from('products').select('*, categories(name)').order('quantity', { ascending: true })
      const { data: movementsData } = await supabase.from('stock_movements').select('*, products(name)').order('created_at', { ascending: false }).limit(50)
      setProducts(productsData || [])
      setMovements(movementsData || [])
    } catch (error) { console.error('خطأ:', error) }
    finally { setLoading(false) }
  }

  const lowStock = products.filter(p => p.quantity <= p.min_stock)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة المخزون</h1>
      <div className="flex gap-2 border-b dark:border-gray-700">
        {[{ id: 'stock', label: 'المخزون الحالي' }, { id: 'low', label: 'المنتجات الناقصة' }, { id: 'movements', label: 'حركة المخزون' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{tab.label}</button>
        ))}
      </div>
      {activeTab === 'stock' && (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>المنتج</th><th>التصنيف</th><th>الكمية</th><th>الحد الأدنى</th><th>الحالة</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></td></tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.name}</td>
                      <td>{p.categories?.name || '-'}</td>
                      <td className="font-bold">{p.quantity}</td>
                      <td>{p.min_stock}</td>
                      <td>{p.quantity <= p.min_stock ? <span className="flex items-center gap-1 text-red-600"><AlertTriangle className="w-4 h-4" /> ناقص</span> : <span className="text-green-600">متوفر</span>}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'low' && (
        <div className="space-y-4">
          {lowStock.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">لا توجد منتجات ناقصة</div>
          ) : (
            lowStock.map(p => (
              <div key={p.id} className="card border-r-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div><h3 className="font-bold">{p.name}</h3><p className="text-sm text-gray-500">الحد الأدنى: {p.min_stock}</p></div>
                  <div className="text-2xl font-bold text-red-600">{p.quantity}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {activeTab === 'movements' && (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>المنتج</th><th>النوع</th><th>الكمية</th><th>التاريخ</th></tr></thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id}>
                    <td>{m.products?.name}</td>
                    <td>{m.type === 'in' ? <span className="flex items-center gap-1 text-green-600"><ArrowUpRight className="w-4 h-4" /> دخول</span> : <span className="flex items-center gap-1 text-red-600"><ArrowDownRight className="w-4 h-4" /> خروج</span>}</td>
                    <td className="font-bold">{m.quantity}</td>
                    <td>{new Date(m.created_at).toLocaleString('ar-SA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory