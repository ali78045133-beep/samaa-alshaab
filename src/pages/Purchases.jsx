import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Package, Truck } from 'lucide-react'
import { query, run, getLastInsertId } from '../db.js'
import Modal from '../components/Modal.jsx'
import { formatCurrency, formatDateTime } from '../utils/helpers.js'

export default function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [cart, setCart] = useState([])
  const [notes, setNotes] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = () => {
    setPurchases(query(`
      SELECT p.*, s.name as supplier_name 
      FROM purchases p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id 
      ORDER BY p.created_at DESC
    `))
    setProducts(query("SELECT * FROM products ORDER BY name"))
    setSuppliers(query("SELECT * FROM suppliers ORDER BY name"))
  }

  const filtered = purchases.filter(p => 
    !search || p.supplier_name?.toLowerCase().includes(search.toLowerCase()) || p.id.toString().includes(search)
  )

  const addToCart = (productId, qty = 1) => {
    const product = products.find(p => p.id == productId)
    if (!product) return
    const existing = cart.find(item => item.product_id == productId)
    if (existing) {
      setCart(cart.map(item => item.product_id == productId ? { ...item, quantity: item.quantity + qty, total: (item.quantity + qty) * item.cost_price } : item))
    } else {
      setCart([...cart, { product_id: product.id, name: product.name, cost_price: product.cost_price || 0, quantity: qty, total: qty * (product.cost_price || 0) }])
    }
  }

  const updateCartQty = (productId, qty) => {
    if (qty <= 0) {
      setCart(cart.filter(item => item.product_id != productId))
    } else {
      setCart(cart.map(item => item.product_id == productId ? { ...item, quantity: qty, total: qty * item.cost_price } : item))
    }
  }

  const updateCartPrice = (productId, price) => {
    setCart(cart.map(item => item.product_id == productId ? { ...item, cost_price: price, total: item.quantity * price } : item))
  }

  const total = cart.reduce((sum, item) => sum + item.total, 0)

  const savePurchase = () => {
    if (!selectedSupplier || cart.length === 0) return

    run("INSERT INTO purchases (supplier_id, total, notes) VALUES (?, ?, ?)", 
      [selectedSupplier, total, notes])
    const purchaseId = getLastInsertId()

    cart.forEach(item => {
      run("INSERT INTO purchase_items (purchase_id, product_id, quantity, cost_price, total) VALUES (?, ?, ?, ?, ?)",
        [purchaseId, item.product_id, item.quantity, item.cost_price, item.total])

      // Update stock
      const current = query("SELECT quantity FROM products WHERE id = ?", [item.product_id])
      const newQty = (current[0]?.quantity || 0) + item.quantity
      run("UPDATE products SET quantity = ?, cost_price = ? WHERE id = ?", 
        [newQty, item.cost_price, item.product_id])

      // Log
      run(`INSERT INTO inventory_log (product_id, type, quantity, old_quantity, new_quantity, reference_id, reference_type, notes) 
           VALUES (?, 'purchase', ?, ?, ?, ?, 'purchase', ?)`,
        [item.product_id, item.quantity, current[0]?.quantity || 0, newQty, purchaseId, notes])
    })

    setModalOpen(false)
    setCart([])
    setSelectedSupplier('')
    setNotes('')
    loadData()
  }

  const deletePurchase = (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟ سيتم إرجاع الكميات للمخزون.')) return

    const items = query("SELECT * FROM purchase_items WHERE purchase_id = ?", [id])
    items.forEach(item => {
      const current = query("SELECT quantity FROM products WHERE id = ?", [item.product_id])
      const newQty = Math.max(0, (current[0]?.quantity || 0) - item.quantity)
      run("UPDATE products SET quantity = ? WHERE id = ?", [newQty, item.product_id])
    })

    run("DELETE FROM purchase_items WHERE purchase_id = ?", [id])
    run("DELETE FROM purchases WHERE id = ?", [id])
    loadData()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المشتريات</h1>
          <p className="text-gray-500">إدارة فواتير المشتريات</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
          <Plus className="w-4 h-4" /> فاتورة جديدة
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="بحث برقم الفاتورة أو المورد..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-700">#</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">المورد</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الإجمالي</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">التاريخ</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">لا توجد مشتريات</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">{p.id}</td>
                    <td className="px-4 py-3">{p.supplier_name || '-'}</td>
                    <td className="px-4 py-3 font-medium text-primary-600">{formatCurrency(p.total)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDateTime(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deletePurchase(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg mx-auto block">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="فاتورة شراء جديدة" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المورد *</label>
              <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm">
                <option value="">اختر المورد</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">إضافة منتج</label>
            <select onChange={e => { if(e.target.value) { addToCart(e.target.value); e.target.value = '' } }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm">
              <option value="">اختر منتجاً لإضافته</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.cost_price)}</option>)}
            </select>
          </div>

          {cart.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-right">المنتج</th>
                    <th className="px-3 py-2 text-right">السعر</th>
                    <th className="px-3 py-2 text-right">الكمية</th>
                    <th className="px-3 py-2 text-right">الإجمالي</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cart.map(item => (
                    <tr key={item.product_id}>
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">
                        <input type="number" step="0.01" value={item.cost_price} 
                          onChange={e => updateCartPrice(item.product_id, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.quantity} 
                          onChange={e => updateCartQty(item.product_id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </td>
                      <td className="px-3 py-2 font-medium">{formatCurrency(item.total)}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => updateCartQty(item.product_id, 0)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-bold">
                  <tr>
                    <td colSpan="3" className="px-3 py-2 text-left">الإجمالي:</td>
                    <td className="px-3 py-2 text-primary-600">{formatCurrency(total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">إلغاء</button>
            <button onClick={savePurchase} disabled={!selectedSupplier || cart.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50">
              حفظ الفاتورة
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
