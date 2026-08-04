import { useState, useEffect } from 'react'
import { Plus, Shield, User, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', role: 'employee' })

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setUsers(data || [])
    } catch (error) { console.error('خطأ:', error) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: formData.email, password: formData.password })
      if (authError) throw authError
      await supabase.from('users').insert([{ id: authData.user.id, email: formData.email, full_name: formData.full_name, role: formData.role }])
      setShowModal(false)
      setFormData({ email: '', password: '', full_name: '', role: 'employee' })
      fetchUsers()
    } catch (error) { alert('خطأ: ' + error.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة المستخدمين</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /><span>إضافة مستخدم</span></button>
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>المستخدم</th><th>البريد</th><th>الدور</th><th>تاريخ الإنشاء</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">لا يوجد مستخدمين</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td><div className="flex items-center gap-2"><User className="w-4 h-4 text-primary-600" /><span className="font-medium">{u.full_name || 'مستخدم'}</span></div></td>
                    <td>{u.email}</td>
                    <td><span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{u.role === 'admin' ? 'مدير' : 'موظف'}</span></td>
                    <td>{new Date(u.created_at).toLocaleDateString('ar-SA')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">إضافة مستخدم</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1">الاسم الكامل</label><input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-sm font-medium mb-1">البريد الإلكتروني</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" required dir="ltr" /></div>
              <div><label className="block text-sm font-medium mb-1">كلمة المرور</label><input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-sm font-medium mb-1">الدور</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="input-field"><option value="employee">موظف</option><option value="admin">مدير</option></select></div>
              <button type="submit" className="w-full btn-primary">إضافة مستخدم</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users