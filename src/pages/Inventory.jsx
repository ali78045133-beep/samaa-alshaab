import { useEffect, useState } from 'react'
import { AlertTriangle, Package, ArrowUpDown, Search, Filter, History } from 'lucide-react'
import { query, run } from '../db.js'
import { formatCurrency, formatDateTime } from '../utils/helpers.js'
import Modal from '../components/Modal.jsx'

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = () => {
    setProducts(query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.quantity ASC
    `))
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
    const matchFilter = !filter ||
      (filter === 'low' && p.quantity <= p.min_stock && p.quantity > 0) ||
      (filter === 'out' && p.quantity <= 0) ||
      (filter === 'ok' && p.quantity > p.min_stock)
    return matchSearch && matchFilter
  })

  const openAdjustModal = (product) => {
    setSelectedProduct(product)
    setAdjustQty(product.quantity.toString())
    setAdjustReason('')
    setLogModalOpen(false)
  }

  const saveAdjustment = () => {
    if (!selectedProduct) return
    const newQty = parseInt(adjustQty)
    if (isNaN(newQty) || newQty < 0) return alert('الكمية غير صحيحة')

    const current = query("SELECT quantity FROM products WHERE id = ?", [selectedProduct.id])
    const oldQty = current[0]?.quantity || 0

    run("UPDATE products SET quantity = ? WHERE id = ?", [newQty, selectedProduct.id])
    run(`INSERT INTO inventory_log (product_id, type, quantity, old_quantity, new_quantity, reference_type, notes) 
         VALUES (?, 'adjustment', ?, ?, ?, 'manual', ?)`,
      [selectedProduct.id, newQty - oldQty, oldQty, newQty, adjustReason || 'تعديل يدوي'])

    setSelectedProduct(null)
    setAdjustQty('')
    setAdjustReason('')
    loadData()
  }

  const viewLogs = (productId) => {
    const productLogs = query(`
      SELECT l.*, p.name as product_name 
      FROM inventory_log l 
      JOIN products p ON l.product_id = p.id 
      WHERE l.product_id = ? 
      ORDER BY l.created_at DESC 
      LIMIT 50
    `, [productId])
    setLogs(productLogs)
    setLogModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">المخزون</h1>
        <p className="text-gray-500">متابعة وإدارة المخزون</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="بحث بالاسم أو الباركود..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm">
            <option value="">كل المنتجات</option>
            <option value="ok">متوفر</option>
            <option value="low">منخفض</option>
            <option value="out">نفذ من المخزون</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(p => {
          const isLow = p.quantity <= p.min_stock && p.quantity > 0
          const isOut = p.quantity <= 0
          return (
            <div key={p.id} className={`bg-white rounded-xl shadow-sm border p-4 transition-all hover:shadow-md ${isOut ? 'border-red-300 bg-red-50' : isLow ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900 line-clamp-1 flex-1">{p.name}</h3>
                {isOut ? <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" /> : isLow ? <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" /> : <Package className="w-5 h-5 text-green-500 shrink-0" />}
              </div>
              <p className="text-sm text-gray-500 mb-3">{p.category_name || 'بدون تصنيف'}</p>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className={`text-2xl font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>{p.quantity}</span>
                  <span className="text-sm text-gray-500 mr-1">{p.unit}</span>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">الحد: {p.min_stock}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{formatCurrency(p.sale_price)}</span>
                <div className="flex gap-2">
                  <button onClick={() => viewLogs(p.id)} className="text-gray-500 hover:text-primary-600 text-xs flex items-center gap-1">
                    <History className="w-3 h-3" /> السجل
                  </button>
                  <button onClick={() => openAdjustModal(p)} className="text-primary-600 hover:underline text-xs">تعديل</button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <div className="col-span-full text-center py-8 text-gray-500">لا توجد منتجات</div>}
      </div>

      {/* Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg mb-4">تعديل مخزون: {selectedProduct.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">الكمية الحالية: {selectedProduct.quantity}</label>
                <input type="number" min="0" value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">السبب</label>
                <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                  placeholder="مثال: تلف، هدايا، جرد..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setSelectedProduct(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">إلغاء</button>
              <button onClick={saveAdjustment} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      <Modal isOpen={logModalOpen} onClose={() => setLogModalOpen(false)} title="سجل المخزون" size="lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-right">التاريخ</th>
                <th className="px-3 py-2 text-right">النوع</th>
                <th className="px-3 py-2 text-right">الكمية</th>
                <th className="px-3 py-2 text-right">من</th>
                <th className="px-3 py-2 text-right">إلى</th>
                <th className="px-3 py-2 text-right">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr><td colSpan="6" className="px-3 py-4 text-center text-gray-500">لا توجد سجلات</td></tr>
              ) : (
                logs.map(l => (
                  <tr key={l.id}>
                    <td className="px-3 py-2 text-gray-500">{formatDateTime(l.created_at)}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        l.type === 'sale' ? 'bg-red-100 text-red-800' :
                        l.type === 'purchase' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {l.type === 'sale' ? 'بيع' : l.type === 'purchase' ? 'شراء' : 'تعديل'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium">{l.quantity > 0 ? `+${l.quantity}` : l.quantity}</td>
                    <td className="px-3 py-2">{l.old_quantity}</td>
                    <td className="px-3 py-2">{l.new_quantity}</td>
                    <td className="px-3 py-2 text-gray-500">{l.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  )
}
