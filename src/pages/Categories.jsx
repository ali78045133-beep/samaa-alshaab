import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Tags } from 'lucide-react'
import { supabase } from '../lib/supabase'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('categories').select('*').order('name')
      if (error) throw error
      setCategories(data || [])
    } catch (error) { console.error('خطأ:', error) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await supabase.from('categories').update(formData).eq('id', editingCategory.id)
      } else {
        await supabase.from('categories').insert([formData])
      }
      setShowModal(false); setEditingCategory(null); setFormData({ name: '', description: '' })
      fetchCategories()
    } catch (error) { alert('حدث خطأ: ' + error.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد؟')) return
    try { await supabase.from('categories').delete().eq('id', id); fetchCategories() }
    catch (error) { alert('حدث خطأ: ' + error.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة التصنيفات</h1>
        <button onClick={() => { setEditingCategory(null); setFormData({ name: '', description: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /><span>إضافة تصنيف</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></div>
        ) : categories.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">لا توجد تصنيفات</div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg"><Tags className="w-5 h-5 text-primary-600" /></div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{cat.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cat.description || 'لا يوجد وصف'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingCategory(cat); setFormData({ name: cat.name, description: cat.description || '' }); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingCategory ? 'تعديل تصنيف' : 'إضافة تصنيف'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" rows="3" /></div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary">{editingCategory ? 'حفظ' : 'إضافة'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories