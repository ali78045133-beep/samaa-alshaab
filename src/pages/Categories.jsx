import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { query, run } from '../db.js'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => { loadData() }, [])

  const loadData = () => {
    const cats = query(`
      SELECT c.*, COUNT(p.id) as products_count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id 
      GROUP BY c.id 
      ORDER BY c.name
    `)
    setCategories(cats)
  }

  const filtered = categories.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()))

  const openModal = (cat = null) => {
    if (cat) {
      setEditingId(cat.id)
      setForm({ name: cat.name, description: cat.description || '' })
    } else {
      setEditingId(null)
      setForm({ name: '', description: '' })
    }
    setModalOpen(true)
  }

  const saveCategory = () => {
    if (!form.name) return
    if (editingId) {
      run("UPDATE categories SET name=?, description=? WHERE id=?", [form.name, form.description, editingId])
    } else {
      run("INSERT INTO categories (name, description) VALUES (?, ?)", [form.name, form.description])
    }
    setModalOpen(false)
    loadData()
  }

  const deleteCategory = () => {
    if (deleteId) {
      run("DELETE FROM categories WHERE id = ?", [deleteId])
      loadData()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التصنيفات</h1>
          <p className="text-gray-500">إدارة تصنيفات المنتجات</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm">
          <Plus className="w-4 h-4" />
          <span>تصنيف جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(cat => (
          <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{cat.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{cat.description || 'لا يوجد وصف'}</p>
                <p className="text-sm text-primary-600 mt-2">{cat.products_count} منتج</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openModal(cat)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => { setDeleteId(cat.id); setConfirmOpen(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">لا توجد تصنيفات</div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'تعديل تصنيف' : 'تصنيف جديد'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" rows="3" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">إلغاء</button>
            <button onClick={saveCategory} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">حفظ</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={deleteCategory}
        title="حذف تصنيف" message="هل أنت متأكد من حذف هذا التصنيف؟" />
    </div>
  )
}
