import { useState, useEffect } from 'react'
import { Save, Store, DollarSign, Percent } from 'lucide-react'
import { supabase } from '../lib/supabase'

const Settings = () => {
  const [settings, setSettings] = useState({ store_name: 'سماء الشعب', currency: 'ر.س', tax_rate: 15, logo_url: '' })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').single()
    if (data) setSettings(data)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.from('settings').upsert({ id: 1, ...settings })
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) { alert('خطأ: ' + err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الإعدادات</h1>
      <div className="card max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم البقالة</label>
          <div className="relative">
            <Store className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={settings.store_name} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })} className="input-field pr-10" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العملة</label>
          <div className="relative">
            <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="input-field pr-10" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نسبة الضريبة (%)</label>
          <div className="relative">
            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="number" value={settings.tax_rate} onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })} className="input-field pr-10" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رابط الشعار</label>
          <input type="url" value={settings.logo_url} onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })} className="input-field" placeholder="https://..." />
        </div>
        <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
        {saved && <p className="text-green-600 text-sm">تم الحفظ بنجاح</p>}
      </div>
    </div>
  )
}

export default Settings