import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const COOKIE = 'ccl_admin_sid'
const SESSION_MS = 12 * 60 * 60 * 1000
const parameters = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }
export const DUMMY_PASSWORD_HASH = `scrypt$${parameters.N}$${parameters.r}$${parameters.p}$${'0'.repeat(32)}$${'0'.repeat(128)}`
const tokenHash = value => createHash('sha256').update(value).digest('hex')

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = await scrypt(password, Buffer.from(salt, 'hex'), 64, parameters)
  return `scrypt$${parameters.N}$${parameters.r}$${parameters.p}$${salt}$${hash.toString('hex')}`
}

export async function verifyPassword(password, stored) {
  const [, n, r, p, salt, expected] = (stored || '').split('$')
  if (!n || !salt || !expected) return false
  const hash = await scrypt(password, Buffer.from(salt, 'hex'), 64, { N: Number(n), r: Number(r), p: Number(p), maxmem: parameters.maxmem })
  const expectedBytes = Buffer.from(expected, 'hex')
  return expectedBytes.length === hash.length && timingSafeEqual(hash, expectedBytes)
}

export function createAuth(store, { secureCookies = false } = {}) {
  const { db } = store
  const cookieOptions = { httpOnly: true, secure: secureCookies, sameSite: 'strict', path: '/api/admin', maxAge: SESSION_MS }
  const readSession = request => {
    const token = request.cookies?.[COOKIE]
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null
    const session = db.prepare(`SELECT s.token_hash, s.csrf_token, s.expires_at, a.id, a.username
      FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=?`).get(tokenHash(token))
    if (!session || session.expires_at <= Date.now()) return null
    return session
  }
  const login = (response, admin) => {
    db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(Date.now())
    const token = randomBytes(32).toString('hex')
    const csrfToken = randomBytes(32).toString('hex')
    db.prepare('INSERT INTO admin_sessions (token_hash, admin_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)').run(tokenHash(token), admin.id, csrfToken, Date.now() + SESSION_MS)
    response.cookie(COOKIE, token, cookieOptions)
    return { user: { id: admin.id, username: admin.username }, csrfToken }
  }
  const logout = (request, response) => {
    const token = request.cookies?.[COOKIE]
    if (token) db.prepare('DELETE FROM admin_sessions WHERE token_hash=?').run(tokenHash(token))
    response.clearCookie(COOKIE, { path: cookieOptions.path, sameSite: 'strict', secure: secureCookies })
  }
  const requireAdmin = (request, response, next) => {
    const session = readSession(request)
    if (!session) return response.status(401).json({ error: 'La sesión terminó. Vuelve a iniciar sesión.' })
    request.admin = { id: session.id, username: session.username, csrfToken: session.csrf_token }
    next()
  }
  const requireCsrf = (request, response, next) => {
    const submitted = request.get('x-csrf-token') || ''
    const expected = request.admin.csrfToken
    if (submitted.length !== expected.length || !timingSafeEqual(Buffer.from(submitted), Buffer.from(expected))) return response.status(403).json({ error: 'Sesión inválida. Recarga el panel y vuelve a intentarlo.' })
    next()
  }
  return { readSession, login, logout, requireAdmin, requireCsrf }
}

export function validateAdminPassword(password) {
  return typeof password === 'string' && password.length >= 15 && password.length <= 256
}
