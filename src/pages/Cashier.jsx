import { useEffect, useState } from 'react'
import { Calculator, Trash2, Plus, Minus, Scan, Printer, Save, User, CreditCard, Banknote } from 'lucide-react'
import { query, run, getLastInsertId } from '../db.js'
import BarcodeScanner from '../components/BarcodeScanner.jsx'
import { formatCurrency } from '../utils/helpers.js'

export default function Cashier() {
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [discount, setDiscount] = useState(0)
  const [paid, setPaid] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setProducts(query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.quantity > 0 
      ORDER BY p.name
    `))
    setCustomers(query("SELECT * FROM customers ORDER BY name"))
  }

  const filtered = products.filter(p => 
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
  )

  const addToCart = (product) => {
    if (product.quantity <= 0) return alert('المنتج غير متوفر في المخزون')
    const existing = cart.find(item => item.product_id === product.id)
    if (existing) {
      if (existing.quantity + 1 > product.quantity) return alert('الكمية المطلوبة غير متوفرة')
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.sale_price } 
          : item
      ))
    } else {
      setCart([...cart, { 
        product_id: product.id, 
        name: product.name, 
        sale_price: product.sale_price, 
        quantity: 1, 
        total: product.sale_price 
      }])
    }
  }

  const updateQty = (productId, delta) => {
    const item = cart.find(i => i.product_id === productId)
    const product = products.find(p => p.id === productId)
    if (!item || !product) return
    const newQty = item.quantity + delta
    if (newQty <= 0) {
      setCart(cart.filter(i => i.product_id !== productId))
    } else if (newQty > product.quantity) {
      alert('الكمية المطلوبة غير متوفرة')
    } else {
      setCart(cart.map(i => 
        i.product_id === productId 
          ? { ...i, quantity: newQty, total: newQty * i.sale_price } 
          : i
      ))
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const total = Math.max(0, subtotal - discount)
  const change = (parseFloat(paid) || 0) - total

  const handleScan = (barcode) => {
    const product = products.find(p => p.barcode === barcode)
    if (product) addToCart(product)
    else alert('المنتج غير موجود')
  }

  const completeSale = () => {
    if (cart.length === 0) return

    run("INSERT INTO sales (customer_id, total, discount, paid, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [selectedCustomer || null, total, discount, parseFloat(paid) || 0, paymentMethod, notes])
    const saleId = getLastInsertId()

    cart.forEach(item => {
      run("INSERT INTO sale_items (sale_id, product_id, quantity, sale_price, total) VALUES (?, ?, ?, ?, ?)",
        [saleId, item.product_id, item.quantity, item.sale_price, item.total])

      const current = query("SELECT quantity FROM products WHERE id = ?", [item.product_id])
      const newQty = Math.max(0, (current[0]?.quantity || 0) - item.quantity)
      run("UPDATE products SET quantity = ? WHERE id = ?", [newQty, item.product_id])

      run(`INSERT INTO inventory_log (product_id, type, quantity, old_quantity, new_quantity, reference_id, reference_type, notes) 
           VALUES (?, 'sale', ?, ?, ?, ?, 'sale', ?)`,
        [item.product_id, item.quantity, current[0]?.quantity || 0, newQty, saleId, notes])
    })

    setLastSale({ id: saleId, cart, total, discount, paid: parseFloat(paid) || 0, change: Math.max(0, change) })
    setShowReceipt(true)
    setCart([])
    setDiscount(0)
    setPaid('')
    setNotes('')
    setSelectedCustomer('')
    loadData()
  }

  const printReceipt = () => {
    const settings = query("SELECT * FROM settings")
    const storeName = settings.find(s => s.key === 'store_name')?.value || 'سماء الشعب'
    const currency = settings.find(s => s.key === 'currency')?.value || 'ريال'
    const header = settings.find(s => s.key === 'receipt_header')?.value || storeName
    const footer = settings.find(s => s.key === 'receipt_footer')?.value || 'شكراً لتسوقكم'

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html dir="rtl">
      <head><title>فاتورة #${lastSale?.id || Date.now()}</title>
      <style>
        @media print { body { width: 80mm; margin: 0 auto; } }
        body { font-family: system-ui, sans-serif; width: 80mm; margin: 0 auto; padding: 10px; }
        .center { text-align: center; }
        .line { border-bottom: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; font-size: 12px; border-collapse: collapse; }
        td { padding: 3px 0; }
        .bold { font-weight: bold; }
        .header { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
        .small { font-size: 11px; color: #555; }
      </style></head>
      <body>
        <div class="center header">${header.replace(/\n/g, '<br>')}</div>
        <div class="center small">${new Date().toLocaleString('ar-SA')}</div>
        <div class="line"></div>
        <table>
          <tr style="font-weight:bold;border-bottom:1px solid #ccc;">
            <td style="text-align:right;">المنتج</td>
            <td style="text-align:center;">الكمية</td>
            <td style="text-align:center;">السعر</td>
            <td style="text-align:left;">الإجمالي</td>
          </tr>
          ${(lastSale?.cart || cart).map(item => `
            <tr>
              <td style="text-align:right;">${item.name}</td>
              <td style="text-align:center;">${item.quantity}</td>
              <td style="text-align:center;">${item.sale_price.toFixed(2)}</td>
              <td style="text-align:left;">${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
        <div class="line"></div>
        <table>
          <tr><td style="text-align:right;">الإجمالي:</td><td style="text-align:left;font-weight:bold;">${(lastSale ? lastSale.total + lastSale.discount : subtotal).toFixed(2)} ${currency}</td></tr>
          ${(lastSale?.discount || discount) > 0 ? `<tr><td style="text-align:right;">الخصم:</td><td style="text-align:left;color:#d32f2f;">${(lastSale?.discount || discount).toFixed(2)}</td></tr>` : ''}
          <tr><td style="text-align:right;font-weight:bold;font-size:14px;">الصافي:</td><td style="text-align:left;font-weight:bold;font-size:14px;">${(lastSale?.total || total).toFixed(2)} ${currency}</td></tr>
          <tr><td style="text-align:right;">المبلغ المدفوع:</td><td style="text-align:left;">${(lastSale?.paid || parseFloat(paid) || 0).toFixed(2)}</td></tr>
          <tr><td style="text-align:right;">الباقي:</td><td style="text-align:left;">${(lastSale?.change || Math.max(0, change)).toFixed(2)}</td></tr>
        </table>
        <div class="line"></div>
        <div class="center small">${footer.replace(/\n/g, '<br>')}</div>
        <div class="center small" style="margin-top:8px;">فاتورة #${lastSale?.id || '---'}</div>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="space-y-4 h-[calc(100vh-120px)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">نقطة البيع</h1>
          <p className="text-gray-500">شاشة الكاشير</p>
        </div>
        <button onClick={() => setScannerOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
          <Scan className="w-4 h-4" /> مسح باركود
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Products List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="بحث بالاسم أو الباركود..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.quantity <= 0}
                className="p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-right disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="font-medium text-sm text-gray-900 line-clamp-2">{p.name}</p>
                <p className="text-primary-600 font-bold text-sm mt-1">{formatCurrency(p.sale_price)}</p>
                <p className="text-xs text-gray-400 mt-1">متوفر: {p.quantity} {p.unit}</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">لا توجد منتجات</div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="w-5 h-5" /> الفاتورة
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Calculator className="w-12 h-12 mb-2 opacity-30" />
                <p>لا توجد منتجات في السلة</p>
                <p className="text-sm">اختر منتجاً من القائمة</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(item.sale_price)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.product_id, -1)} className="w-7 h-7 flex items-center justify-center bg-white border rounded hover:bg-gray-100 transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product_id, 1)} className="w-7 h-7 flex items-center justify-center bg-white border rounded hover:bg-gray-100 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => updateQty(item.product_id, -item.quantity)} className="text-red-500 p-1 hover:bg-red-50 rounded transition-colors mr-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">العميل</label>
                <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">نقدي</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">طريقة الدفع</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="cash">نقدي</option>
                  <option value="card">بطاقة</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">الخصم</label>
                <input type="number" min="0" value={discount} onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">المبلغ المدفوع</label>
                <input type="number" min="0" value={paid} onChange={e => setPaid(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            </div>
            <div className="space-y-1 text-sm bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between"><span className="text-gray-600">الإجمالي:</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-red-600"><span>الخصم:</span><span>-{formatCurrency(discount)}</span></div>}
              <div className="flex justify-between font-bold text-lg text-primary-700 pt-1 border-t border-gray-200 mt-1">
                <span>الصافي:</span><span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>الباقي:</span>
                <span className={change >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {formatCurrency(Math.abs(change))} {change < 0 ? '(ناقص)' : ''}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={printReceipt} disabled={cart.length === 0 && !lastSale} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors disabled:opacity-50">
                <Printer className="w-4 h-4" /> طباعة
              </button>
              <button onClick={completeSale} disabled={cart.length === 0} className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" /> إتمام البيع
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowReceipt(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Save className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">تم حفظ الفاتورة بنجاح</h2>
            <p className="text-gray-500 mb-4">رقم الفاتورة: #{lastSale.id}</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-right space-y-1 text-sm">
              <div className="flex justify-between"><span>الإجمالي:</span><span>{formatCurrency(lastSale.total + lastSale.discount)}</span></div>
              {lastSale.discount > 0 && <div className="flex justify-between text-red-600"><span>الخصم:</span><span>{formatCurrency(lastSale.discount)}</span></div>}
              <div className="flex justify-between font-bold"><span>الصافي:</span><span>{formatCurrency(lastSale.total)}</span></div>
              <div className="flex justify-between"><span>المبلغ المدفوع:</span><span>{formatCurrency(lastSale.paid)}</span></div>
              <div className="flex justify-between"><span>الباقي:</span><span>{formatCurrency(lastSale.change)}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReceipt(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">إغلاق</button>
              <button onClick={() => { printReceipt(); setShowReceipt(false) }} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">طباعة</button>
            </div>
          </div>
        </div>
      )}

      <BarcodeScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />
    </div>
  )
}
