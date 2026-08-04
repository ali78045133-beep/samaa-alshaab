import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const navigate = useNavigate()
  const { signIn, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login') // login | forgot
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn(email, password)
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error || 'خطأ في تسجيل الدخول')
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await resetPassword(email)
      if (result.success) {
        setResetSent(true)
      } else {
        setError(result.error || 'خطأ في إرسال رابط الاستعادة')
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-lg mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            سماء الشعب
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            نظام إدارة البقالة المتكامل
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {mode === 'login' ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                تسجيل الدخول
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pr-10"
                      placeholder="أدخل بريدك الإلكتروني"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pr-10 pl-10"
                      placeholder="أدخل كلمة المرور"
                      required
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>تسجيل الدخول</span>
                      <ArrowLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Forgot password */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setMode('forgot')
                    setError('')
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  هل نسيت كلمة المرور؟
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                استعادة كلمة المرور
              </h2>

              {resetSent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    تم إرسال رابط الاستعادة إلى بريدك الإلكتروني
                  </p>
                  <button
                    onClick={() => {
                      setMode('login')
                      setResetSent(false)
                    }}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    العودة لتسجيل الدخول
                  </button>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                    أدخل بريدك الإلكتروني لإرسال رابط استعادة كلمة المرور
                  </p>

                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        البريد الإلكتروني
                      </label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input-field pr-10"
                          placeholder="أدخل بريدك الإلكتروني"
                          required
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>إرسال رابط الاستعادة</span>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setMode('login')
                        setError('')
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      العودة لتسجيل الدخول
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          سماء الشعب © 2024 - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  )
}

export default Login