import initSqlJs from 'sql.js'
import sqlWasmPath from 'sql.js/dist/sql-wasm.wasm?url'

let db = null
let SQL = null

const DB_KEY = 'samaa_al_shaab_db'

export async function initDB() {
  if (db) return db

  SQL = await initSqlJs({
    locateFile: () => sqlWasmPath
  })

  // Try to load existing database from localStorage
  const saved = localStorage.getItem(DB_KEY)
  if (saved) {
    try {
      const uint8Array = new Uint8Array(JSON.parse(saved))
      db = new SQL.Database(uint8Array)
    } catch (e) {
      console.warn('Failed to load saved DB, creating new one')
      db = new SQL.Database()
    }
  } else {
    db = new SQL.Database()
  }

  createTables()
  seedDefaultData()
  saveDB()
  return db
}

function createTables() {
  // Users
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'cashier',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`)

  // Categories
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`)

  // Products
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT UNIQUE,
    name TEXT NOT NULL,
    category_id INTEGER,
    cost_price REAL DEFAULT 0,
    sale_price REAL DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    unit TEXT DEFAULT 'قطعة',
    supplier_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  )`)

  // Suppliers
  db.run(`CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`)

  // Customers
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`)

  // Purchases
  db.run(`CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER,
    total REAL DEFAULT 0,
    paid REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  )`)

  // Purchase Items
  db.run(`CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    cost_price REAL NOT NULL,
    total REAL NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`)

  // Sales
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    total REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    paid REAL DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  )`)

  // Sale Items
  db.run(`CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    sale_price REAL NOT NULL,
    total REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`)

  // Settings
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`)

  // Inventory Log
  db.run(`CREATE TABLE IF NOT EXISTS inventory_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    type TEXT,
    quantity INTEGER,
    old_quantity INTEGER,
    new_quantity INTEGER,
    reference_id INTEGER,
    reference_type TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`)
}

function seedDefaultData() {
  // Default admin user
  const users = db.exec("SELECT COUNT(*) as count FROM users")
  if (!users.length || users[0].values[0][0] === 0) {
    db.run("INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)", 
      ["admin", "admin123", "المدير", "admin"])
  }

  // Default settings
  const settings = db.exec("SELECT COUNT(*) as count FROM settings")
  if (!settings.length || settings[0].values[0][0] === 0) {
    const defaults = [
      ["store_name", "سماء الشعب"],
      ["store_phone", ""],
      ["store_address", ""],
      ["currency", "ريال"],
      ["tax_rate", "0"],
      ["low_stock_alert", "5"],
      ["receipt_header", "سماء الشعب\nشكراً لتسوقكم معنا"],
      ["receipt_footer", "الرجاء الاحتفاظ بالفاتورة"]
    ]
    defaults.forEach(([k, v]) => {
      db.run("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", [k, v])
    })
  }

  // Default categories
  const cats = db.exec("SELECT COUNT(*) as count FROM categories")
  if (!cats.length || cats[0].values[0][0] === 0) {
    const defaultCats = ["مأكولات", "مشروبات", "منظفات", "عناية شخصية", "مواد غذائية", "أخرى"]
    defaultCats.forEach(name => {
      db.run("INSERT INTO categories (name) VALUES (?)", [name])
    })
  }
}

export function saveDB() {
  if (!db) return
  const data = db.export()
  const array = Array.from(data)
  localStorage.setItem(DB_KEY, JSON.stringify(array))
}

export function getDB() {
  return db
}

export function query(sql, params = []) {
  if (!db) throw new Error("Database not initialized")
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const results = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

export function run(sql, params = []) {
  if (!db) throw new Error("Database not initialized")
  db.run(sql, params)
  saveDB()
}

export function exec(sql) {
  if (!db) throw new Error("Database not initialized")
  return db.exec(sql)
}

export function exportDB() {
  if (!db) return null
  const data = db.export()
  return new Blob([data], { type: 'application/octet-stream' })
}

export function importDB(fileData) {
  if (!SQL) throw new Error("SQL.js not initialized")
  db = new SQL.Database(fileData)
  createTables()
  seedDefaultData()
  saveDB()
  return db
}

export function getLastInsertId() {
  const res = query("SELECT last_insert_rowid() as id")
  return res[0]?.id
}
