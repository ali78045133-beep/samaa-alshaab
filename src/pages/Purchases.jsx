import { useState, useEffect } from 'react'
import { Plus, Trash2, X, ShoppingBag, Search, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'

const Purchases = () => {
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchProduct, setSearchProduct] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [cartItems, setCartItems] = useState([])

  useEffect(() => {
    fetchPurchases()
    fetchSuppliers()
    fetchProducts()
  }, [])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('purchases')
        .select('*, suppliers(name), purchase_items(*, products(name))')
        .order('created_at', { ascending: false })
      if (error) throw error
      setPurchases(data || [])
    } catch (error) { console.error('خطأ:', error) }
    finally { setLoading(false) }
  }

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('name')
    setSuppliers(data || [])
  }

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name')
    setProducts(data || [])
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.barcode?.includes(searchProduct)
  )

  const addToCart = (product) => {
    const existing = cartItems.find(item => item.product_id === product.id)
    if (existing) {
      setCartItems(cartItems.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        price: product.purchase_price || 0,
      }])
    }
  }

  const updateQuantity = (productId, qty) => {
    if (qty <= 0) {
      setCartItems(cartItems.filter(item => item.product_id !== productId))
    } else {
      setCartItems(cartItems.map(item => 
        item.product_id === productId ? { ...item, quantity: qty } : item
      ))
    }
  }

  const updatePrice = (productId, price) => {
    setCartItems(cartItems.map(item => 
      item.product_id === productId ? { ...item, price: parseFloat(price) || 0 } : item
    ))
  }

  const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)

  const handleSubmit = async () => {
    if (!selectedSupplier || cartItems.length === 0) {
      alert('يرجى اختيار المورد وإضافة منتجات')
      return
    }

    try {
      // إنشاء فاتورة الشراء
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          supplier_id: selectedSupplier,
          total_amount: total,
        }])
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // إضافة عناصر الفاتورة
      const items = cartItems.map(item => ({
        purchase_id: purchase.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }))

      const { error: itemsError } = await supabase.from('purchase_items').insert(items)
      if (itemsError) throw itemsError

      // تحديث المخزون
      for (const item of cartItems) {
        const { data: product } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', item.product_id)
          .single()

        await supabase
          .from('products')
          .update({ quantity: (product?.quantity || 0) + item.quantity })
          .eq('id', item.product_id)

        // تسجيل حركة المخزون
        await supabase.from('stock_movements').insert([{
          product_id: item.product_id,
          type: 'in',
          quantity: item.quantity,
          reference_type: 'purchase',
          reference_id: purchase.id,
        }])
      }

      setShowModal(false)
      setCartItems([])
      setSelectedSupplier('')
      setSearchProduct('')
      fetchPurchases()
      alert('تم إنشاء فاتورة الشراء بنجاح')
    } catch (error) {
      alert('حدث خطأ: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة المشتريات</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /><span>فاتورة شراء جديدة</span>
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>رقم الفاتورة</th><th>المورد</th><th>الإجمالي</th><th>التاريخ</th><th>عدد المنتجات</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">لا توجد فواتير شراء</td></tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">#{p.id?.toString().slice(-4)}</td>
                    <td><div className="flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-primary-600" /><span>{p.suppliers?.name || '-'}</span></div></td>
                    <td className="font-bold text-primary-600">{p.total_amount?.toFixed(2)} ر.س</td>
                    <td>{new Date(p.created_at).toLocaleDateString('ar-SA')}</td>
                    <td>{p.purchase_items?.length || 0} منتج</td>
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
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">فاتورة شراء جديدة</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">المورد *</label>
                <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="input-field">
                  <option value="">اختر المورد</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Products Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">البحث عن منتج</label>
                  <div className="relative mb-4">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)} className="input-field pr-10" placeholder="ابحث بالاسم أو الباركود..." />
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-64 overflow-y-auto">
                    {filteredProducts.slice(0, 10).map(product => (
                      <button key={product.id} onClick={() => addToCart(product)} className="flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 text-right">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{product.name}</span>
                        </div>
                        <Plus className="w-4 h-4 text-primary-600" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cart */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">المنتجات المضافة</label>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[200px]">
                    {cartItems.length === 0 ? (
                      <p className="text-center text-gray-400 py-8">لم تضف أي منتجات</p>
                    ) : (
                      <div className="space-y-3">
                        {cartItems.map((item) => (
                          <div key={item.product_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <input type="number" min="1" value={item.quantity} onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 0)} className="w-16 px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600" />
                                <span className="text-xs text-gray-500">×</span>
                                <input type="number" step="0.01" value={item.price} onChange={(e) => updatePrice(item.product_id, e.target.value)} className="w-20 px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600" />
                                <span className="text-xs text-gray-500">ر.س</span>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-primary-600">{(item.quantity * item.price).toFixed(2)}</p>
                              <button onClick={() => updateQuantity(item.product_id, 0)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <span className="font-bold text-lg text-gray-900 dark:text-white">الإجمالي:</span>
                <span className="font-bold text-2xl text-primary-600">{total.toFixed(2)} ر.س</span>
              </div>

              <div className="flex gap-3">
                <button onClick={handleSubmit} disabled={cartItems.length === 0 || !selectedSupplier} className="flex-1 btn-primary py-3 disabled:opacity-50">حفظ الفاتورة</button>
                <button onClick={() => { setCartItems([]); setSelectedSupplier(''); }} className="flex-1 btn-secondary">إفراغ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Purchases