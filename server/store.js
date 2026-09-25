import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { categories as initialCategories, products as initialProducts } from '../src/catalog.js'
import { builderValidationMessage } from './validation.js'

const slug = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const parseProduct = row => {
  const details = JSON.parse(row.data_json)
  delete details.performance
  return { ...details, id: row.id, categoryId: row.category_id, category: row.category_name, name: row.name, brand: row.brand, price: row.price, stock: row.stock, active: Boolean(row.active) }
}

export function createStore(dbPath = 'data/store.sqlite', { seed = true } = {}) {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      position INTEGER NOT NULL DEFAULT 0, deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES categories(id),
      name TEXT NOT NULL, brand TEXT NOT NULL, price INTEGER NOT NULL CHECK(price >= 0),
      stock INTEGER NOT NULL CHECK(stock >= 0), active INTEGER NOT NULL CHECK(active IN (0,1)),
      data_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id, deleted_at, active);
    CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at DESC);
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY, username TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY, admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      csrf_token TEXT NOT NULL, expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);
  `)

  if (seed && !db.prepare("SELECT 1 FROM settings WHERE key = 'seeded'").get()) {
    db.transaction(() => {
      const addCategory = db.prepare('INSERT INTO categories (id, name, position) VALUES (?, ?, ?)')
      initialCategories.forEach((name, index) => addCategory.run(slug(name), name, index))
      const addProduct = db.prepare('INSERT INTO products (id, category_id, name, brand, price, stock, active, data_json) VALUES (?, ?, ?, ?, ?, ?, 1, ?)')
      initialProducts.forEach(product => addProduct.run(product.id, slug(product.category), product.name, product.brand, product.price, product.stock, JSON.stringify(product)))
      db.prepare("INSERT INTO settings (key, value) VALUES ('seeded', '1')").run()
    })()
  }

  const productColumns = 'p.*, c.name AS category_name'
  const productJoin = 'FROM products p JOIN categories c ON c.id = p.category_id'
  const allProducts = ({ includeInactive = false } = {}) => db.prepare(`SELECT ${productColumns} ${productJoin} WHERE p.deleted_at IS NULL ${includeInactive ? '' : 'AND p.active = 1 AND c.deleted_at IS NULL'} ORDER BY p.updated_at DESC, p.id`).all().map(parseProduct)
  const productById = (id, { includeInactive = false } = {}) => {
    const row = db.prepare(`SELECT ${productColumns} ${productJoin} WHERE p.id = ? AND p.deleted_at IS NULL ${includeInactive ? '' : 'AND p.active = 1 AND c.deleted_at IS NULL'}`).get(id)
    return row ? parseProduct(row) : null
  }
  const searchProducts = ({ page = 1, limit = 20, search = '', categoryId = '', status = 'all' } = {}) => {
    const conditions = ['p.deleted_at IS NULL']
    const parameters = []
    if (search) { conditions.push("(p.name LIKE ? ESCAPE '\\' OR p.brand LIKE ? ESCAPE '\\' OR p.id LIKE ? ESCAPE '\\')"); const term = `%${search.replace(/[\\%_]/g, '\\$&')}%`; parameters.push(term, term, term) }
    if (categoryId) { conditions.push('p.category_id = ?'); parameters.push(categoryId) }
    if (status === 'active' || status === 'inactive') { conditions.push('p.active = ?'); parameters.push(Number(status === 'active')) }
    const where = conditions.join(' AND ')
    const total = db.prepare(`SELECT COUNT(*) AS count ${productJoin} WHERE ${where}`).get(...parameters).count
    const items = db.prepare(`SELECT ${productColumns} ${productJoin} WHERE ${where} ORDER BY p.updated_at DESC, p.id LIMIT ? OFFSET ?`).all(...parameters, limit, (page - 1) * limit).map(parseProduct)
    return { items, total, page, pageCount: Math.max(1, Math.ceil(total / limit)) }
  }
  const allCategories = ({ includeDeleted = false } = {}) => db.prepare(`SELECT c.id, c.name, c.position, COUNT(p.id) AS productCount FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL WHERE ${includeDeleted ? '1=1' : 'c.deleted_at IS NULL'} GROUP BY c.id ORDER BY c.position, c.name`).all()

  const insertProduct = db.prepare('INSERT INTO products (id, category_id, name, brand, price, stock, active, data_json) VALUES (@id, @categoryId, @name, @brand, @price, @stock, @active, @data)')
  const updateProduct = db.prepare('UPDATE products SET category_id=@categoryId, name=@name, brand=@brand, price=@price, stock=@stock, active=@active, data_json=@data, updated_at=CURRENT_TIMESTAMP WHERE id=@id AND deleted_at IS NULL')
  const saveProduct = (id, product, { create = false } = {}) => {
    const category = db.prepare('SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL').get(product.categoryId)
    if (!category) return { error: 'La categoría seleccionada no existe.' }
    const compatibilityError = builderValidationMessage(product)
    if (compatibilityError) return { error: compatibilityError }
    const existing = create ? null : productById(id, { includeInactive: true })
    if (!create && !existing) return { error: 'Producto no encontrado.' }
    const referenceScores = existing ? {
      ...(existing.performanceFactor ? { performanceFactor: existing.performanceFactor } : {}),
      ...(existing.performanceIndex ? { performanceIndex: existing.performanceIndex } : {}),
    } : {}
    const data = JSON.stringify({ ...product, ...referenceScores })
    const values = { id, categoryId: product.categoryId, name: product.name, brand: product.brand, price: product.price, stock: product.stock, active: Number(product.active), data }
    if (create) insertProduct.run(values)
    else if (!updateProduct.run(values).changes) return { error: 'Producto no encontrado.' }
    return { product: productById(id, { includeInactive: true }) }
  }

  return {
    db,
    close: () => db.close(),
    allProducts,
    productById,
    searchProducts,
    allCategories,
    saveProduct,
    deleteProduct: id => db.prepare('UPDATE products SET deleted_at=CURRENT_TIMESTAMP, active=0 WHERE id=? AND deleted_at IS NULL').run(id).changes > 0,
    createCategory: (id, name) => {
      const existing = db.prepare('SELECT id, deleted_at FROM categories WHERE name=?').get(name)
      if (existing?.deleted_at) { db.prepare('UPDATE categories SET deleted_at=NULL WHERE id=?').run(existing.id); return existing.id }
      const position = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM categories').get().next
      db.prepare('INSERT INTO categories (id, name, position) VALUES (?, ?, ?)').run(id, name, position)
      return id
    },
    updateCategory: (id, name) => db.prepare('UPDATE categories SET name=? WHERE id=? AND deleted_at IS NULL').run(name, id).changes > 0,
    deleteCategory: id => {
      if (db.prepare('SELECT 1 FROM products WHERE category_id=? AND deleted_at IS NULL LIMIT 1').get(id)) return { error: 'Mueve o elimina los productos de esta categoría antes de borrarla.' }
      return { deleted: db.prepare('UPDATE categories SET deleted_at=CURRENT_TIMESTAMP WHERE id=? AND deleted_at IS NULL').run(id).changes > 0 }
    },
    dashboard: () => ({
      products: db.prepare('SELECT COUNT(*) AS count FROM products WHERE deleted_at IS NULL').get().count,
      active: db.prepare('SELECT COUNT(*) AS count FROM products WHERE deleted_at IS NULL AND active=1').get().count,
      outOfStock: db.prepare('SELECT COUNT(*) AS count FROM products WHERE deleted_at IS NULL AND stock=0').get().count,
      categories: db.prepare('SELECT COUNT(*) AS count FROM categories WHERE deleted_at IS NULL').get().count,
      recent: db.prepare(`SELECT ${productColumns} ${productJoin} WHERE p.deleted_at IS NULL ORDER BY p.updated_at DESC, p.id LIMIT 5`).all().map(parseProduct),
    }),
  }
}

export function createProductId(name, store) {
  const base = slug(name) || 'producto'
  let id = base === 'nuevo' ? 'nuevo-producto' : base
  for (let index = 2; store.productById(id, { includeInactive: true }) || store.db.prepare('SELECT 1 FROM products WHERE id=?').get(id); index++) id = `${base}-${index}`
  return id
}

export function createCategoryId(name, store) {
  const base = slug(name) || 'categoria'
  let id = base
  for (let index = 2; store.db.prepare('SELECT 1 FROM categories WHERE id=?').get(id); index++) id = `${base}-${index}`
  return id
}
