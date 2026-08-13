import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, Search, Edit2, Trash2, Barcode, Scan, Filter,
  Download, FileText, Package
} from 'lucide-react'
import { query, run, getLastInsertId } from '../db.js'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import BarcodeScanner from '../components/BarcodeScanner.jsx'
import { formatCurrency, generateBarcode, downloadFile } from '../utils/helpers.js'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStock, setFilterStock] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({
    barcode: '', name: '', category_id: '', cost_price: '', sale_price: '',
    quantity: '', min_stock: '', unit: 'قطعة', supplier_id: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const prods = query(`
      SELECT p.*, c.name as category_name, s.name as supplier_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN suppliers s ON p.supplier_id = s.id 
      ORDER BY p.id DESC
    `)
    setProducts(prods)
    setCategories(query("SELECT * FROM categories ORDER BY name"))
    setSuppliers(query("SELECT * FROM suppliers ORDER BY name"))
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
    const matchCat = !filterCategory || p.category_id == filterCategory
    const matchStock = !filterStock || 
      (filterStock === 'low' && p.quantity <= p.min_stock) ||
      (filterStock === 'out' && p.quantity <= 0) ||
      (filterStock === 'ok' && p.quantity > p.min_stock)
    return matchSearch && matchCat && matchStock
  })

  const openModal = (product = null) => {
    if (product) {
      setEditingId(product.id)
      setForm({
        barcode: product.barcode || '',
        name: product.name || '',
        category_id: product.category_id || '',
        cost_price: product.cost_price || '',
        sale_price: product.sale_price || '',
        quantity: product.quantity || '',
        min_stock: product.min_stock || '',
        unit: product.unit || 'قطعة',
        supplier_id: product.supplier_id || ''
      })
    } else {
      setEditingId(null)
      setForm({
        barcode: generateBarcode(), name: '', category_id: '', cost_price: '',
        sale_price: '', quantity: '', min_stock: '5', unit: 'قطعة', supplier_id: ''
      })
    }
    setModalOpen(true)
  }

  const saveProduct = () => {
    if (!form.name) return
    if (editingId) {
      run(`UPDATE products SET barcode=?, name=?, category_id=?, cost_price=?, sale_price=?, 
           quantity=?, min_stock=?, unit=?, supplier_id=? WHERE id=?`,
        [form.barcode, form.name, form.category_id || null, form.cost_price || 0, form.sale_price || 0,
         form.quantity || 0, form.min_stock || 5, form.unit, form.supplier_id || null, editingId])
    } else {
      run(`INSERT INTO products (barcode, name, category_id, cost_price, sale_price, quantity, min_stock, unit, supplier_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [form.barcode, form.name, form.category_id || null, form.cost_price || 0, form.sale_price || 0,
         form.quantity || 0, form.min_stock || 5, form.unit, form.supplier_id || null])
    }
    setModalOpen(false)
    loadData()
  }

  const deleteProduct = () => {
    if (deleteId) {
      run("DELETE FROM products WHERE id = ?", [deleteId])
      loadData()
    }
  }

  const handleScan = (barcode) => {
    setForm(prev => ({ ...prev, barcode }))
    setModalOpen(true)
  }

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'l' })
    doc.setFont('helvetica')
    doc.text('قائمة المنتجات - سماء الشعب', 14, 15)
    doc.autoTable({
      head: [['#', 'الباركود', 'الاسم', 'التصنيف', 'سعر التكلفة', 'سعر البيع', 'الكمية', 'الحد الأدنى', 'الوحدة']],
      body: filtered.map((p, i) => [
        i + 1, p.barcode || '-', p.name, p.category_name || '-',
        formatCurrency(p.cost_price), formatCurrency(p.sale_price),
        p.quantity, p.min_stock, p.unit
      ]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [22, 163, 74] }
    })
    doc.save('products.pdf')
  }

  const exportExcel = () => {
    const data = filtered.map(p => ({
      'الباركود': p.barcode,
      'الاسم': p.name,
      'التصنيف': p.category_name,
      'سعر التكلفة': p.cost_price,
      'سعر البيع': p.sale_price,
      'الكمية': p.quantity,
      'الحد الأدنى': p.min_stock,
      'الوحدة': p.unit
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'المنتجات')
    XLSX.writeFile(wb, 'products.xlsx')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المنتجات</h1>
          <p className="text-gray-500">إدارة منتجات المتجر</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setScannerOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
            <Scan className="w-4 h-4" />
            <span className="hidden sm:inline">مسح باركود</span>
          </button>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm">
            <Plus className="w-4 h-4" />
            <span>منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الباركود..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
            />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm">
            <option value="">كل التصنيفات</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterStock} onChange={e => setFilterStock(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm">
            <option value="">حالة المخزون</option>
            <option value="ok">متوفر</option>
            <option value="low">منخفض</option>
            <option value="out">نفذ</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button onClick={exportExcel} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-700">#</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الباركود</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الاسم</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">التصنيف</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">سعر البيع</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الكمية</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الحالة</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">لا توجد منتجات</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">{p.id}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.barcode || '-'}</td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.category_name || '-'}</td>
                    <td className="px-4 py-3">{formatCurrency(p.sale_price)}</td>
                    <td className="px-4 py-3">{p.quantity} {p.unit}</td>
                    <td className="px-4 py-3">
                      {p.quantity <= 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">نفذ</span>
                      ) : p.quantity <= p.min_stock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">منخفض</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">متوفر</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openModal(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setDeleteId(p.id); setConfirmOpen(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'تعديل منتج' : 'منتج جديد'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الباركود</label>
              <div className="flex gap-2">
                <input type="text" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                <button onClick={() => setScannerOpen(true)} className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
                  <Scan className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
              <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm">
                <option value="">اختر التصنيف</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المورد</label>
              <select value={form.supplier_id} onChange={e => setForm({...form, supplier_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm">
                <option value="">اختر المورد</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سعر التكلفة</label>
              <input type="number" step="0.01" value={form.cost_price} onChange={e => setForm({...form, cost_price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سعر البيع</label>
              <input type="number" step="0.01" value={form.sale_price} onChange={e => setForm({...form, sale_price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
              <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى</label>
              <input type="number" value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label>
              <input type="text" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">إلغاء</button>
            <button onClick={saveProduct} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">حفظ</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog 
        isOpen={confirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={deleteProduct}
        title="حذف منتج"
        message="هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
      />

      <BarcodeScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />
    </div>
  )
}
