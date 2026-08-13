import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Shield, User, Lock } from 'lucide-react'
import { query, run } from '../db.js'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', full_name: '', role: 'cashier' })

  useEffect(() => { loadData() }, [])

  const loadData = () => {
    setUsers(query("SELECT * FROM users ORDER BY created_at DESC"))
  }

  const filtered = users.filter(u => 
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.username?.includes(search)
  )

  const openModal = (u = null) => {
    if (u) {
      setEditingId(u.id)
      setForm({ username: u.username, password: '', full_name: u.full_name, role: u.role })
    } else {
      setEditingId(null)
      setForm({ username: '', password: '', full_name: '', role: 'cashier' })
    }
    setModalOpen(true)
  }

  const saveUser = () => {
    if (!form.username || !form.full_name) return
    if (editingId) {
      if (form.password) {
        run("UPDATE users SET username=?, password=?, full_name=?, role=? WHERE id=?",
          [form.username, form.password, form.full_name, form.role, editingId])
      } else {
        run("UPDATE users SET username=?, full_name=?, role=? WHERE id=?",
          [form.username, form.full_name, form.role, editingId])
      }
    } else {
      if (!form.password) return alert('كلمة المرور مطلوبة للمستخدم الجديد')
      run("INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)",
        [form.username, form.password, form.full_name, form.role])
    }
    setModalOpen(false)
    loadData()
  }

  const deleteUser = () => {
    if (deleteId) {
      if (deleteId === currentUser?.id) {
        alert('لا يمكنك حذف حسابك الحالي')
        return
      }
      run("DELETE FROM users WHERE id = ?", [deleteId])
      loadData()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المستخدمين</h1>
          <p className="text-gray-500">إدارة حسابات المستخدمين</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm">
          <Plus className="w-4 h-4" /> مستخدم جديد
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="بحث بالاسم أو اسم المستخدم..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-700">#</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الاسم</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">اسم المستخدم</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الدور</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">تاريخ الإنشاء</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">{u.id}</td>
                  <td className="px-4 py-3 font-medium">{u.full_name}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {u.role === 'admin' ? 'مدير' : 'كاشير'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString('ar-SA')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openModal(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setDeleteId(u.id); setConfirmOpen(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="p-4 text-center text-gray-500">لا يوجد مستخدمين</p>}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'تعديل مستخدم' : 'مستخدم جديد'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل *</label>
            <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم *</label>
            <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور {editingId ? '(اتركها فارغة للإبقاء على الحالية)' : '*'}
            </label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm">
              <option value="cashier">كاشير</option>
              <option value="admin">مدير</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors">إلغاء</button>
            <button onClick={saveUser} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm transition-colors">حفظ</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={deleteUser}
        title="حذف مستخدم" message="هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء." />
    </div>
  )
}
