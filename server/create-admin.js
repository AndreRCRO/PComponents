import { input, password } from '@inquirer/prompts'
import { resolve } from 'node:path'
import { hashPassword, validateAdminPassword } from './auth.js'
import { createStore } from './store.js'

const store = createStore(resolve(process.env.DATA_DIR || 'data', 'store.sqlite'))
try {
  const username = (await input({ message: 'Usuario administrador:', validate: value => /^[a-zA-Z0-9._-]{3,40}$/.test(value.trim()) || 'Usa 3–40 letras, números, puntos, guiones o guiones bajos.' })).trim()
  if (store.db.prepare('SELECT 1 FROM admins WHERE username=?').get(username)) throw new Error('Ese usuario ya existe.')
  const secret = await password({ message: 'Contraseña (mínimo 15 caracteres):', mask: '*', validate: validateAdminPassword })
  const confirmation = await password({ message: 'Repite la contraseña:', mask: '*' })
  if (secret !== confirmation) throw new Error('Las contraseñas no coinciden.')
  store.db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, await hashPassword(secret))
  console.log(`Administrador ${username} creado. Ya puedes entrar en /admin.`)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally { store.close() }
