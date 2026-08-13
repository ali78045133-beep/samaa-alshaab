import { useEffect, useState, useRef } from 'react'
import { Save, Download, Upload, Database, RotateCcw, Store, Receipt, AlertCircle } from 'lucide-react'
import { query, run, exportDB, importDB } from '../db.js'
import { readFileAsArrayBuffer } from '../utils/helpers.js'

export default function Settings() {
  const [settings, setSettings] = useState({})
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const fileRef = useRef(null)

  useEffect(() => {
    const rows = query("SELECT * FROM settings")
    const obj = {}
    rows.forEach(r => obj[r.key] = r.value)
    setSettings(obj)
  }, [])

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const showMessage = (msg, type = 'success') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 4000)
  }

  const saveSettings = () => {
    Object.entries(settings).forEach(([key, value]) => {
      run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value])
    })
    showMessage('تم حفظ الإعدادات بنجاح')
  }

  const exportDatabase = () => {
    try {
      const blob = exportDB()
      if (!blob) return showMessage('فشل تصدير قاعدة البيانات', 'error')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `samaa_backup_${new Date().toISOString().slice(0,10)}_${Date.now()}.db`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showMessage('تم تصدير قاعدة البيانات بنجاح')
    } catch (err) {
      showMessage('فشل تصدير قاعدة البيانات', 'error')
    }
  }

  const importDatabase = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!confirm('سيتم استبدال جميع البيانات الحالية بالملف المستورد. هل أنت متأكد؟')) return
    try {
      const buffer = await readFileAsArrayBuffer(file)
      const uint8Array = new Uint8Array(buffer)
      importDB(uint8Array)
      showMessage('تم استيراد قاعدة البيانات بنجاح. سيتم تحديث الصفحة...')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      showMessage('فشل استيراد الملف. تأكد من أن الملف صحيح.', 'error')
    }
    e.target.value = ''
  }

  const resetData = () => {
    if (!confirm('تحذير: سيتم حذف جميع البيانات وإعادة تعيين النظام. هل أنت متأكد؟')) return
    if (!confirm('هل أنت متأكد تماماً؟ لا يمكن استعادة البيانات بعد الحذف.')) return
    localStorage.removeItem('samaa_al_shaab_db')
    localStorage.removeItem('samaa_auth')
    showMessage('تم إعادة تعيين النظام. سيتم تحديث الصفحة...')
    setTimeout(() => window.location.reload(), 1500)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-gray-500">إعدادات المتجر والنسخ الاحتياطي</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
          messageType === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          <AlertCircle className="w-4 h-4" />
          {message}
        </div>
      )}

      {/* Store Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
          <Store className="w-5 h-5 text-primary-600" /> معلومات المتجر
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المتجر</label>
            <input type="text" value={settings.store_name || ''} onChange={e => updateSetting('store_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
            <input type="text" value={settings.currency || ''} onChange={e => updateSetting('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">هاتف المتجر</label>
            <input type="text" value={settings.store_phone || ''} onChange={e => updateSetting('store_phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المتجر</label>
            <input type="text" value={settings.store_address || ''} onChange={e => updateSetting('store_address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تنبيه المخزون المنخفض (قطع)</label>
            <input type="number" min="1" value={settings.low_stock_alert || ''} onChange={e => updateSetting('low_stock_alert', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4" /> إعدادات الفاتورة
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ترويسة الفاتورة</label>
              <textarea value={settings.receipt_header || ''} onChange={e => updateSetting('receipt_header', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" rows="2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تذييل الفاتورة</label>
              <textarea value={settings.receipt_footer || ''} onChange={e => updateSetting('receipt_footer', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" rows="2" />
            </div>
          </div>
        </div>

        <button onClick={saveSettings} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
          <Save className="w-4 h-4" /> حفظ الإعدادات
        </button>
      </div>

      {/* Backup */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
          <Database className="w-5 h-5 text-blue-600" /> النسخ الاحتياطي
        </h2>
        <p className="text-sm text-gray-500">يمكنك تصدير قاعدة البيانات كاملة إلى ملف أو استيراد نسخة سابقة</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportDatabase} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" /> تصدير قاعدة البيانات
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            <Upload className="w-4 h-4" /> استيراد قاعدة البيانات
          </button>
          <input type="file" ref={fileRef} onChange={importDatabase} accept=".db,.sqlite,.sqlite3" className="hidden" />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 space-y-4">
        <h2 className="font-bold text-red-700 flex items-center gap-2 text-lg">
          <RotateCcw className="w-5 h-5" /> منطقة الخطر
        </h2>
        <p className="text-sm text-gray-500">إعادة تعيين النظام سيحذف جميع البيانات بشكل نهائي</p>
        <button onClick={resetData} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
          <RotateCcw className="w-4 h-4" /> إعادة تعيين النظام
        </button>
      </div>
    </div>
  )
}
