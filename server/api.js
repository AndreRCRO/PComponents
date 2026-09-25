import { randomUUID } from 'node:crypto'
import { mkdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import express from 'express'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import multer from 'multer'
import sharp from 'sharp'
import { ZodError } from 'zod'
import { createAuth, DUMMY_PASSWORD_HASH, verifyPassword } from './auth.js'
import { createCategoryId, createProductId } from './store.js'
import { categorySchema, productSchema, validationMessage } from './validation.js'

const supportedImageTypes = new Set(['jpeg', 'png', 'webp', 'avif'])
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter: (_request, file, done) => {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype)) return done(new Error('Solo se permiten imágenes JPEG, PNG, WebP o AVIF.'))
  done(null, true)
} })

export function createApp(store, { uploadDir = 'data/uploads', serveFrontend = false, appOrigin = '', secureCookies = false } = {}) {
  const app = express()
  app.set('trust proxy', 'loopback')
  const auth = createAuth(store, { secureCookies })
  const mediaPath = resolve(uploadDir)
  app.disable('x-powered-by')
  app.use(helmet({ contentSecurityPolicy: serveFrontend ? {
    directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], fontSrc: ["'self'", 'https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"] },
  } : false }))
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())
  app.use((request, response, next) => {
    if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') return next()
    const origin = request.get('origin')
    if (!origin) return next()
    if (appOrigin) return origin === appOrigin ? next() : response.status(403).json({ error: 'Origen no autorizado.' })
    try {
      return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname) ? next() : response.status(403).json({ error: 'Origen no autorizado.' })
    } catch { return response.status(403).json({ error: 'Origen no autorizado.' }) }
  })
  app.use('/api/admin', (_request, response, next) => { response.set('Cache-Control', 'no-store'); next() })

  app.get('/api/health', (_request, response) => response.json({ ok: true }))
  app.get('/api/catalog', (_request, response) => {
    response.set('Cache-Control', 'no-store')
    response.json({ products: store.allProducts(), categories: store.allCategories().map(({ id, name }) => ({ id, name })) })
  })
  app.get('/media/:file', async (request, response) => {
    if (!/^[a-f0-9-]{36}\.webp$/.test(request.params.file)) return response.sendStatus(404)
    try {
      const bytes = await readFile(join(mediaPath, request.params.file))
      response.set({ 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' }).send(bytes)
    } catch { response.sendStatus(404) }
  })

  app.post('/api/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Demasiados intentos. Espera 15 minutos antes de volver a probar.' } }), async (request, response) => {
    const username = typeof request.body?.username === 'string' ? request.body.username.trim() : ''
    const password = typeof request.body?.password === 'string' ? request.body.password : ''
    if (!username || !password || username.length > 80 || password.length > 256) return response.status(400).json({ error: 'Introduce usuario y contraseña.' })
    const admin = store.db.prepare('SELECT id, username, password_hash FROM admins WHERE username=?').get(username)
    const valid = await verifyPassword(password, admin?.password_hash || DUMMY_PASSWORD_HASH)
    if (!admin || !valid) return response.status(401).json({ error: 'Usuario o contraseña incorrectos.' })
    response.json(auth.login(response, admin))
  })
  app.get('/api/admin/session', auth.requireAdmin, (request, response) => response.json({ user: { id: request.admin.id, username: request.admin.username }, csrfToken: request.admin.csrfToken }))
  app.post('/api/admin/logout', auth.requireAdmin, auth.requireCsrf, (request, response) => { auth.logout(request, response); response.sendStatus(204) })

  app.use('/api/admin', auth.requireAdmin)
  app.get('/api/admin/dashboard', (_request, response) => response.json(store.dashboard()))
  app.get('/api/admin/categories', (_request, response) => response.json({ items: store.allCategories() }))
  app.post('/api/admin/categories', auth.requireCsrf, (request, response) => {
    const { name } = categorySchema.parse(request.body)
    const id = createCategoryId(name, store)
    const createdId = store.createCategory(id, name)
    response.status(201).json({ id: createdId, name })
  })
  app.put('/api/admin/categories/:id', auth.requireCsrf, (request, response) => {
    const { name } = categorySchema.parse(request.body)
    if (!store.updateCategory(request.params.id, name)) return response.status(404).json({ error: 'Categoría no encontrada.' })
    response.json({ id: request.params.id, name })
  })
  app.delete('/api/admin/categories/:id', auth.requireCsrf, (request, response) => {
    const result = store.deleteCategory(request.params.id)
    if (result.error) return response.status(409).json(result)
    if (!result.deleted) return response.status(404).json({ error: 'Categoría no encontrada.' })
    response.sendStatus(204)
  })

  app.get('/api/admin/products', (request, response) => {
    const page = Math.max(1, Math.min(100000, Number.parseInt(request.query.page, 10) || 1))
    const limit = Math.max(1, Math.min(50, Number.parseInt(request.query.limit, 10) || 20))
    const search = String(request.query.q || '').trim().toLowerCase().slice(0, 100)
    const categoryId = String(request.query.category || '')
    const status = String(request.query.status || 'all')
    response.json(store.searchProducts({ page, limit, search, categoryId, status }))
  })
  app.get('/api/admin/products/:id', (request, response) => {
    const product = store.productById(request.params.id, { includeInactive: true })
    return product ? response.json(product) : response.status(404).json({ error: 'Producto no encontrado.' })
  })
  app.post('/api/admin/products', auth.requireCsrf, (request, response) => {
    const product = productSchema.parse(request.body)
    const id = createProductId(product.name, store)
    const result = store.saveProduct(id, product, { create: true })
    return result.error ? response.status(400).json(result) : response.status(201).json(result.product)
  })
  app.put('/api/admin/products/:id', auth.requireCsrf, (request, response) => {
    const product = productSchema.parse(request.body)
    const result = store.saveProduct(request.params.id, product)
    return result.error ? response.status(400).json(result) : response.json(result.product)
  })
  app.delete('/api/admin/products/:id', auth.requireCsrf, (request, response) =>
    store.deleteProduct(request.params.id) ? response.sendStatus(204) : response.status(404).json({ error: 'Producto no encontrado.' }))

  app.post('/api/admin/media', auth.requireCsrf, imageUpload.single('image'), async (request, response) => {
    if (!request.file) return response.status(400).json({ error: 'Selecciona una imagen.' })
    try {
      const metadata = await sharp(request.file.buffer, { limitInputPixels: 30_000_000 }).metadata()
      if (!supportedImageTypes.has(metadata.format) || !metadata.width || !metadata.height || metadata.width > 6000 || metadata.height > 6000) return response.status(400).json({ error: 'Formato o dimensiones de imagen no válidos.' })
      const filename = `${randomUUID()}.webp`
      await mkdir(mediaPath, { recursive: true })
      await sharp(request.file.buffer, { limitInputPixels: 30_000_000 }).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(mediaPath, filename))
      response.status(201).json({ url: `/media/${filename}` })
    } catch { response.status(400).json({ error: 'No pudimos procesar la imagen. Prueba con otro archivo.' }) }
  })

  if (serveFrontend) {
    const dist = resolve('dist')
    app.use(express.static(dist, { index: false }))
    app.get(/^(?!\/api\/|\/media\/).*/, (_request, response) => response.sendFile(join(dist, 'index.html')))
  }
  app.use((error, _request, response, _next) => {
    if (error instanceof ZodError) return response.status(400).json({ error: validationMessage(error) })
    if (error instanceof multer.MulterError) return response.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'La imagen no puede superar 5 MB.' : 'Archivo no válido.' })
    if (error.code?.startsWith('SQLITE_CONSTRAINT')) return response.status(409).json({ error: 'Ya existe un registro con ese nombre.' })
    if (error.message?.startsWith('Solo se permiten imágenes')) return response.status(400).json({ error: error.message })
    console.error(error)
    response.status(500).json({ error: 'Ocurrió un error en el servidor. Inténtalo de nuevo.' })
  })
  return app
}
