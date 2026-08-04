import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Users, Phone, Wallet, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'

const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({ name: '', phone: '', balance: '', notes: '' })

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('customers').select('*').order('name')
      if (error) throw error
      setCustomers(data || [])
    } catch (error) { console.error('خطأ:', error) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...formData, balance: parseFloat(formData.balance) || 0 }
      if (editingCustomer) {
        await supabase.from('customers').update(data).eq('id', editingCustomer.id)
      } else {
        await supabase.from('customers').insert([data])
      }
      setShowModal(false); setEditingCustomer(null); setFormData({ name: '', phone: '', balance: '', notes: '' })
      fetchCustomers()
    } catch (error) { alert('حدث خطأ: ' + error.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد؟')) return
    try { await supabase.from('customers').delete().eq('id', id); fetchCustomers() }
    catch (error) { alert('حدث خطأ: ' + error.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة العملاء</h1>
        <button onClick={() => { setEditingCustomer(null); setFormData({ name: '', phone: '', balance: '', notes: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /><span>إضافة عميل</span>
        </button>
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>الاسم</th><th>الهاتف</th><th>الرصيد</th><th>الملاحظات</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">لا يوجد عملاء</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td><div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary-600" /><span className="font-medium">{c.name}</span></div></td>
                    <td><div className="flex items-center gap-1 text-gray-500"><Phone className="w-4 h-4" /><span>{c.phone || '-'}</span></div></td>
                    <td><div className="flex items-center gap-1"><Wallet className="w-4 h-4 text-gray-500" /><span className={`font-bold ${c.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{c.balance?.toFixed(2)} ر.س</span></div></td>
                    <td><div className="flex items-center gap-1 text-gray-500"><FileText className="w-4 h-4" /><span className="truncate max-w-[150px]">{c.notes || '-'}</span></div></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingCustomer(c); setFormData({ name: c.name, phone: c.phone || '', balance: c.balance?.toString() || '', notes: c.notes || '' }); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingCustomer ? 'تعديل عميل' : 'إضافة عميل'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الهاتف</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الرصيد</label><input type="number" step="0.01" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الملاحظات</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field" rows="3" /></div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary">{editingCustomer ? 'حفظ' : 'إضافة'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers