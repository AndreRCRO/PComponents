import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { createApp } from './api.js'
import { hashPassword } from './auth.js'
import { createStore } from './store.js'

test('catálogo y administración: autenticación, CSRF, CRUD y medios', async () => {
  const store = createStore(':memory:')
  const password = 'una-clave-de-prueba-segura'
  store.db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('encargado', await hashPassword(password))
  const temp = await mkdtemp(join(tmpdir(), 'ccl-admin-test-'))
  const server = createApp(store, { uploadDir: temp }).listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = `http://127.0.0.1:${server.address().port}`
  let cookie = ''
  let csrf = ''
  const call = async (path, { method = 'GET', body, auth = true, token = true } = {}) => {
    const headers = {}
    if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'
    if (auth && cookie) headers.Cookie = cookie
    if (token && csrf) headers['X-CSRF-Token'] = csrf
    const response = await fetch(base + path, { method, headers, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) })
    const data = response.status === 204 ? null : await response.json().catch(() => null)
    return { response, data }
  }
  try {
    const publicCatalog = await call('/api/catalog')
    assert.equal(publicCatalog.response.status, 200)
    assert.ok(publicCatalog.data.products.length >= 50)
    assert.equal((await call('/api/admin/dashboard')).response.status, 401)
    assert.equal((await call('/api/admin/login', { method: 'POST', body: { username: 'encargado', password: 'incorrecta' } })).response.status, 401)

    const login = await call('/api/admin/login', { method: 'POST', body: { username: 'encargado', password } })
    assert.equal(login.response.status, 200)
    cookie = login.response.headers.get('set-cookie').split(';')[0]
    csrf = login.data.csrfToken
    assert.match(login.response.headers.get('set-cookie'), /HttpOnly/)
    assert.match(login.response.headers.get('set-cookie'), /SameSite=Strict/)
    assert.equal((await call('/api/admin/dashboard')).data.products, publicCatalog.data.products.length)
    assert.equal((await call('/api/admin/categories', { method: 'POST', body: { name: 'Nuevos equipos' }, token: false })).response.status, 403)

    const category = await call('/api/admin/categories', { method: 'POST', body: { name: 'Nuevos equipos' } })
    assert.equal(category.response.status, 201)
    const categoryId = category.data.id
    const renamed = await call(`/api/admin/categories/${categoryId}`, { method: 'PUT', body: { name: 'Equipos nuevos' } })
    assert.equal(renamed.data.name, 'Equipos nuevos')

    const productBody = {
      name: 'Equipo de prueba', brand: 'CCL', categoryId, description: 'Equipo de prueba para el catálogo.',
      price: 2500, stock: 3, active: true, image: '/products/pc-pro.webp',
    }
    const emptyPrice = await call('/api/admin/products', { method: 'POST', body: { ...productBody, price: '' } })
    assert.equal(emptyPrice.response.status, 400)
    const created = await call('/api/admin/products', { method: 'POST', body: productBody })
    assert.equal(created.response.status, 201)
    assert.equal(created.data.category, 'Equipos nuevos')
    const id = created.data.id
    assert.equal((await call('/api/admin/products?q=Equipo%20de%20prueba')).data.total, 1)
    assert.ok((await call('/api/catalog')).data.products.some(product => product.id === id))
    assert.equal((await call(`/api/admin/categories/${categoryId}`, { method: 'DELETE' })).response.status, 409)

    const edited = await call(`/api/admin/products/${id}`, { method: 'PUT', body: { ...created.data, price: 2700, description: 'Descripción actualizada.', stock: 0 } })
    assert.equal(edited.response.status, 200)
    assert.equal((await call('/api/catalog')).data.products.find(product => product.id === id).price, 2700)
    const existingCpu = (await call('/api/admin/products/amd-ryzen-7-7800x3d')).data
    const cpuEdited = await call('/api/admin/products/amd-ryzen-7-7800x3d', { method: 'PUT', body: { ...existingCpu, performanceFactor: 999 } })
    assert.equal(cpuEdited.data.performanceFactor, existingCpu.performanceFactor)

    const hidden = await call(`/api/admin/products/${id}`, { method: 'PUT', body: { ...edited.data, active: false } })
    assert.equal(hidden.response.status, 200)
    assert.equal((await call('/api/catalog')).data.products.some(product => product.id === id), false)
    assert.ok((await call(`/api/admin/products/${id}`)).data)

    const invalidBuild = await call('/api/admin/products', { method: 'POST', body: { ...productBody, categoryId: 'gabinetes', name: 'Gabinete incompleto' } })
    assert.equal(invalidBuild.response.status, 400)
    assert.match(invalidBuild.data.error, /compatibilidad/)

    const image = await readFile(new URL('../public/products/kingston-fury.png', import.meta.url))
    const form = new FormData()
    form.append('image', new Blob([image], { type: 'image/png' }), 'ram.png')
    const uploaded = await call('/api/admin/media', { method: 'POST', body: form })
    assert.equal(uploaded.response.status, 201)
    assert.match(uploaded.data.url, /^\/media\/[a-f0-9-]{36}\.webp$/)
    const mediaResponse = await fetch(base + uploaded.data.url)
    assert.equal(mediaResponse.status, 200)
    assert.equal(mediaResponse.headers.get('content-type'), 'image/webp')

    assert.equal((await call(`/api/admin/products/${id}`, { method: 'DELETE' })).response.status, 204)
    assert.equal((await call(`/api/admin/categories/${categoryId}`, { method: 'DELETE' })).response.status, 204)
    const recreated = await call('/api/admin/categories', { method: 'POST', body: { name: 'Equipos nuevos' } })
    assert.equal(recreated.data.id, categoryId)
    assert.equal((await call('/api/admin/logout', { method: 'POST' })).response.status, 204)
    assert.equal((await call('/api/admin/dashboard')).response.status, 401)
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
    store.close()
    await rm(temp, { recursive: true, force: true })
  }
})
