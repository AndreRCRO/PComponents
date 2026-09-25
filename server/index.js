import { resolve } from 'node:path'
import { createApp } from './api.js'
import { createStore } from './store.js'

const production = process.argv.includes('--production') || process.env.NODE_ENV === 'production'
if (production) {
  const origin = process.env.APP_ORIGIN
  let valid = false
  try {
    const parsed = new URL(origin)
    valid = parsed.protocol === 'https:' && parsed.origin === origin && !parsed.username && !parsed.password
  } catch { /* origen ausente o inválido */ }
  if (!valid) throw new Error('APP_ORIGIN debe ser un origen HTTPS exacto en producción (por ejemplo, https://tienda.example).')
}
const store = createStore(resolve(process.env.DATA_DIR || 'data', 'store.sqlite'))
const port = Number(process.env.PORT || 3001)
const app = createApp(store, {
  uploadDir: resolve(process.env.DATA_DIR || 'data', 'uploads'),
  serveFrontend: production,
  appOrigin: process.env.APP_ORIGIN || '',
  secureCookies: production,
})
app.listen(port, '127.0.0.1', () => console.log(`CCL API lista en http://127.0.0.1:${port}`))
