import { useState, useEffect, useRef } from 'react'
import { Search, Trash2, Printer, ShoppingCart, Minus, Plus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const Sales = () => {
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [discount, setDiscount] = useState(0)
  const [paidAmount, setPaidAmount] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const searchRef = useRef(null)

  useEffect(() => {
    fetchProducts()
    fetchCustomers()
    searchRef.current?.focus()
  }, [])

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name')
    setProducts(data || [])
  }

  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('name')
    setCustomers(data || [])
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.includes(searchQuery)
  )

  const addToCart = (product) => {
    if (product.quantity <= 0) { alert('المنتج غير متوفر في المخزون'); return }
    const existing = cart.find(item => item.product_id === product.id)
    if (existing) {
      if (existing.quantity >= product.quantity) { alert('الكمية المتاحة غير كافية'); return }
      setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, { product_id: product.id, name: product.name, price: product.sale_price, quantity: 1, purchase_price: product.purchase_price }])
    }
    setSearchQuery('')
    searchRef.current?.focus()
  }

  const updateQty = (id, delta) => {
    const product = products.find(p => p.id === id)
    setCart(cart.map(item => {
      if (item.product_id === id) {
        const newQty = item.quantity + delta
        if (newQty > product.quantity) { alert('الكمية المتاحة غير كافية'); return item }
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (id) => { setCart(cart.filter(item => item.product_id !== id)) }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal - discountAmount
  const change = (parseFloat(paidAmount) || 0) - total

  const handleComplete = async () => {
    if (cart.length === 0) return
    try {
      const { data: sale, error } = await supabase.from('sales').insert([{
        customer_id: selectedCustomer || null,
        total_amount: total,
        discount: discountAmount,
        paid_amount: parseFloat(paidAmount) || total,
        profit: cart.reduce((sum, item) => sum + ((item.price - item.purchase_price) * item.quantity), 0),
      }]).select().single()
      if (error) throw error

      const items = cart.map(item => ({ sale_id: sale.id, product_id: item.product_id, quantity: item.quantity, price: item.price }))
      await supabase.from('sale_items').insert(items)

      for (const item of cart) {
        const { data: product } = await supabase.from('products').select('quantity').eq('id', item.product_id).single()
        await supabase.from('products').update({ quantity: (product?.quantity || 0) - item.quantity }).eq('id', item.product_id)
        await supabase.from('stock_movements').insert([{ product_id: item.product_id, type: 'out', quantity: item.quantity, reference_type: 'sale', reference_id: sale.id }])
      }

      setLastSale({ ...sale, items: cart, customer: customers.find(c => c.id === selectedCustomer) })
      setShowReceipt(true)
      setCart([]); setDiscount(0); setPaidAmount(''); setSelectedCustomer('')
      fetchProducts()
    } catch (err) { alert('خطأ: ' + err.message) }
  }

  const printReceipt = () => { window.print() }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">نقطة البيع</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field pr-10 text-lg" placeholder="ابحث بالاسم أو الباركود..." autoFocus />
          </div>
          {searchQuery && (
            <div className="card p-0 max-h-64 overflow-y-auto">
              {filteredProducts.slice(0, 10).map(product => (
                <button key={product.id} onClick={() => addToCart(product)} className="flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 text-right">
                  <div><p className="font-medium">{product.name}</p><p className="text-sm text-gray-500">{product.sale_price} ر.س | مخزون: {product.quantity}</p></div>
                  <Plus className="w-5 h-5 text-primary-600" />
                </button>
              ))}
            </div>
          )}
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><ShoppingCart className="w-5 h-5 text-primary-600" /><h2 className="font-bold text-lg">السلة</h2></div>
            {cart.length === 0 ? (
              <p className="text-center text-gray-400 py-8">السلة فارغة</p>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.product_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1"><p className="font-medium">{item.name}</p><p className="text-sm text-gray-500">{item.price} ر.س</p></div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.product_id, -1)} className="p-1 rounded bg-gray-200 dark:bg-gray-600"><Minus className="w-4 h-4" /></button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product_id, 1)} className="p-1 rounded bg-gray-200 dark:bg-gray-600"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="w-24 text-left"><p className="font-bold">{(item.price * item.quantity).toFixed(2)}</p></div>
                    <button onClick={() => removeFromCart(item.product_id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">العميل</label>
              <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="input-field">
                <option value="">عميل نقدي</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2 pt-4 border-t dark:border-gray-700">
              <div className="flex justify-between"><span>المجموع:</span><span>{subtotal.toFixed(2)} ر.س</span></div>
              <div className="flex items-center justify-between gap-2"><span>الخصم (%):</span><input type="number" min="0" max="100" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-20 input-field py-1" /></div>
              <div className="flex justify-between font-bold text-lg text-primary-600"><span>الإجمالي:</span><span>{total.toFixed(2)} ر.س</span></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">المبلغ المستلم</label><input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="input-field text-lg font-bold" placeholder="0.00" /></div>
            {paidAmount && (
              <div className={`flex justify-between font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}><span>{change >= 0 ? 'الباقي:' : 'المتبقي:'}</span><span>{Math.abs(change).toFixed(2)} ر.س</span></div>
            )}
            <button onClick={handleComplete} disabled={cart.length === 0} className="w-full btn-primary py-4 text-lg font-bold disabled:opacity-50">إتمام البيع</button>
          </div>
        </div>
      </div>
      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50" onClick={() => setShowReceipt(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 print-only">
            <div className="text-center mb-4"><h2 className="text-xl font-bold">سماء الشعب</h2><p className="text-sm text-gray-500">فاتورة مبيعات</p><p className="text-xs text-gray-400">#{lastSale.id?.toString().slice(-4)}</p></div>
            <div className="space-y-2 text-sm border-t border-b py-4 my-4">
              {lastSale.items.map((item, i) => (
                <div key={i} className="flex justify-between"><span>{item.name} × {item.quantity}</span><span>{(item.price * item.quantity).toFixed(2)}</span></div>
              ))}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>الإجمالي:</span><span>{(lastSale.total_amount + lastSale.discount).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>الخصم:</span><span>{lastSale.discount?.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>الصافي:</span><span>{lastSale.total_amount?.toFixed(2)}</span></div>
            </div>
            <div className="mt-6 text-center text-xs text-gray-400"><p>شكراً لتسوقكم</p></div>
            <div className="flex gap-2 mt-6 no-print">
              <button onClick={printReceipt} className="flex-1 btn-primary flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> طباعة</button>
              <button onClick={() => setShowReceipt(false)} className="flex-1 btn-secondary">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sales