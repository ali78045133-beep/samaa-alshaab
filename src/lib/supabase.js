import { createClient } from '@supabase/supabase-js'

// استبدل هذه القيم بمفاتيح مشروعك في Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// دالة مساعدة للتحقق من الاتصال
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('settings').select('count', { count: 'exact', head: true })
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// دالة لإنشاء الجداول تلقائياً
export const setupDatabase = async () => {
  // الجداول يتم إنشاؤها يدوياً في لوحة تحكم Supabase
  // هذا الملف يحتوي على دوال المساعدة فقط
  console.log('يرجى إنشاء الجداول في لوحة تحكم Supabase')
}