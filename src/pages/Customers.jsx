import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react'
import { query, run } from '../db.js'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })

  useEffect(() => { loadData() }, [])

  const loadData = () => {
    setCustomers(query("SELECT * FROM customers ORDER BY name"))
  }

  const filtered = customers.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))

  const openModal = (c = null) => {
    if (c) {
      setEditingId(c.id)
      setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' })
    } else {
      setEditingId(null)
      setForm({ name: '', phone: '', email: '', address: '' })
    }
    setModalOpen(true)
  }

  const saveCustomer = () => {
    if (!form.name) return
    if (editingId) {
      run("UPDATE customers SET name=?, phone=?, email=?, address=? WHERE id=?", 
        [form.name, form.phone, form.email, form.address, editingId])
    } else {
      run("INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)", 
        [form.name, form.phone, form.email, form.address])
    }
    setModalOpen(false)
    loadData()
  }

  const deleteCustomer = () => {
    if (deleteId) { run("DELETE FROM customers WHERE id = ?", [deleteId]); loadData() }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العملاء</h1>
          <p className="text-gray-500">إدارة عملاء المتجر</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
          <Plus className="w-4 h-4" /> عميل جديد
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="بحث بالاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-gray-900">{c.name}</h3>
              <div className="flex gap-1">
                <button onClick={() => openModal(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => { setDeleteId(c.id); setConfirmOpen(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {c.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" />{c.phone}</div>}
              {c.email && <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" />{c.email}</div>}
              {c.address && <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4" />{c.address}</div>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-8 text-gray-500">لا يوجد عملاء</div>}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'تعديل عميل' : 'عميل جديد'}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
            <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
            <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" rows="2" /></div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">إلغاء</button>
            <button onClick={saveCustomer} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">حفظ</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={deleteCustomer}
        title="حذف عميل" message="هل أنت متأكد من حذف هذا العميل؟" />
    </div>
  )
}
