import { useCallback, useEffect, useState } from 'react'
import { adminRequest } from '../api.js'
import { formatPrice } from '../catalog.js'
import ProductEditor from './ProductEditor.jsx'
import './admin.css'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async event => {
    event.preventDefault()
    setBusy(true); setError('')
    try { onLogin(await adminRequest('/login', { method: 'POST', body: { username, password } })) }
    catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }
  return <main className="admin-login-page"><div className="admin-login-brand"><span className="admin-mark">C</span><span>CCL Tech Store <small>Administración</small></span></div><section className="admin-login-card" aria-labelledby="login-title"><h1 id="login-title">Acceso privado</h1><p>Gestiona el catálogo y la disponibilidad de la tienda desde un solo lugar.</p><form onSubmit={submit}><label>Usuario<input autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required autoFocus/></label><label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required/></label>{error && <p className="admin-error" role="alert">{error}</p>}<button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Comprobando acceso…' : 'Entrar al panel'}</button></form><a href="/" className="admin-back-store">Volver a la tienda</a></section></main>
}

function Dashboard({ request, go }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { request('/dashboard').then(setData).catch(issue => setError(issue.message)) }, [request])
  return <section className="admin-page"><div className="admin-page-heading"><div><h1>Resumen de la tienda</h1><p>Estado actual del catálogo público.</p></div><button className="button button-primary" onClick={() => go('/admin/productos/nuevo')}>Agregar producto</button></div>{error && <p className="admin-error" role="alert">{error}</p>}{!data ? <div className="admin-loading">Cargando resumen…</div> : <><div className="admin-stats"><div><span>Productos</span><strong>{data.products}</strong></div><div><span>Publicados</span><strong>{data.active}</strong></div><div><span>Sin stock</span><strong>{data.outOfStock}</strong></div><div><span>Categorías</span><strong>{data.categories}</strong></div></div><div className="admin-panel"><div className="admin-panel-heading"><h2>Actualizados recientemente</h2><button onClick={() => go('/admin/productos')}>Ver productos</button></div><div className="admin-recent-list">{data.recent.map(product => <button key={product.id} onClick={() => go(`/admin/productos/${product.id}`)}><span><strong>{product.name}</strong><small>{product.category} · {product.brand}</small></span><b>{formatPrice(product.price)}</b><em>{product.active ? 'Publicado' : 'Oculto'}</em></button>)}</div></div></>}</section>
}

function Products({ request, categories, go }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [busyId, setBusyId] = useState('')
  const [confirmId, setConfirmId] = useState('')
  const [error, setError] = useState('')
  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20', q: query, category, status })
    request(`/products?${params}`).then(setResult).catch(issue => setError(issue.message))
  }, [request, page, query, category, status])
  useEffect(() => { load() }, [load])
  const update = async (product, action) => {
    setBusyId(product.id); setError('')
    try {
      if (action === 'delete') await request(`/products/${product.id}`, { method: 'DELETE' })
      else await request(`/products/${product.id}`, { method: 'PUT', body: { ...product, active: !product.active } })
      setConfirmId(''); load()
    } catch (issue) { setError(issue.message) }
    finally { setBusyId('') }
  }
  return <section className="admin-page"><div className="admin-page-heading"><div><h1>Productos</h1><p>Precios, contenido y visibilidad del catálogo.</p></div><button className="button button-primary" onClick={() => go('/admin/productos/nuevo')}>Agregar producto</button></div><div className="admin-list-toolbar"><label><span className="sr-only">Buscar productos</span><input type="search" placeholder="Buscar nombre, marca o código" value={query} onChange={event => { setQuery(event.target.value); setPage(1) }}/></label><select aria-label="Filtrar por categoría" value={category} onChange={event => { setCategory(event.target.value); setPage(1) }}><option value="">Todas las categorías</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select aria-label="Filtrar por estado" value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}><option value="all">Todos los estados</option><option value="active">Publicados</option><option value="inactive">Ocultos</option></select></div>{error && <p className="admin-error" role="alert">{error}</p>}{!result ? <div className="admin-loading">Cargando productos…</div> : <div className="admin-panel admin-product-panel"><div className="admin-panel-heading"><h2>{result.total} productos</h2><span>Página {result.page} de {result.pageCount}</span></div>{result.items.length ? <div className="admin-product-list"><div className="admin-product-header"><span>Producto</span><span>Precio</span><span>Stock</span><span>Estado</span><span>Acciones</span></div>{result.items.map(product => <div className="admin-product-row" key={product.id}><div className="admin-product-identity">{product.image ? <img src={product.image} alt="" width="54" height="54"/> : <span className="admin-image-empty">Sin imagen</span>}<span><strong>{product.name}</strong><small>{product.category} · {product.brand}</small></span></div><strong className="admin-price">{formatPrice(product.price)}</strong><span className={product.stock ? '' : 'admin-low-stock'}>{product.stock} uds.</span><span className={`admin-status ${product.active ? 'active' : ''}`}>{product.active ? 'Publicado' : 'Oculto'}</span><div className="admin-row-actions"><button type="button" onClick={() => go(`/admin/productos/${product.id}`)}>Editar</button><button type="button" onClick={() => update(product, 'toggle')} disabled={busyId === product.id}>{product.active ? 'Ocultar' : 'Publicar'}</button>{confirmId === product.id ? <span className="admin-inline-confirm">¿Eliminar? <button type="button" onClick={() => update(product, 'delete')} disabled={busyId === product.id}>Sí</button><button type="button" onClick={() => setConfirmId('')}>No</button></span> : <button type="button" className="danger" onClick={() => setConfirmId(product.id)}>Eliminar</button>}</div></div>)}</div> : <div className="admin-empty"><strong>No hay productos para estos filtros.</strong><p>Prueba otra búsqueda o agrega el primer producto.</p></div>}<div className="admin-pagination"><button disabled={page === 1} onClick={() => setPage(value => value - 1)}>Anterior</button><span>{result.page} / {result.pageCount}</span><button disabled={page >= result.pageCount} onClick={() => setPage(value => value + 1)}>Siguiente</button></div></div>}</section>
}

function Categories({ request, categories, refreshCategories }) {
  const [name, setName] = useState('')
  const [editing, setEditing] = useState('')
  const [editName, setEditName] = useState('')
  const [confirmId, setConfirmId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const create = async event => {
    event.preventDefault(); setBusy(true); setError('')
    try { await request('/categories', { method: 'POST', body: { name } }); setName(''); await refreshCategories() }
    catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }
  const save = async category => {
    setBusy(true); setError('')
    try { await request(`/categories/${category.id}`, { method: 'PUT', body: { name: editName } }); setEditing(''); await refreshCategories() }
    catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }
  const remove = async category => {
    setBusy(true); setError('')
    try { await request(`/categories/${category.id}`, { method: 'DELETE' }); setConfirmId(''); await refreshCategories() }
    catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }
  return <section className="admin-page"><div className="admin-page-heading"><div><h1>Categorías</h1><p>Organiza los productos que aparecen en la tienda y sus filtros.</p></div></div><div className="admin-category-layout"><form className="admin-panel admin-category-form" onSubmit={create}><h2>Nueva categoría</h2><label>Nombre<input value={name} onChange={event => setName(event.target.value)} placeholder="Ej. Refrigeración" maxLength="80" required/></label><button className="button button-primary" disabled={busy}>Crear categoría</button></form><div className="admin-panel admin-category-list"><div className="admin-panel-heading"><h2>{categories.length} categorías</h2></div>{categories.map(category => <div className="admin-category-row" key={category.id}>{editing === category.id ? <><input aria-label={`Nuevo nombre de ${category.name}`} value={editName} onChange={event => setEditName(event.target.value)} maxLength="80"/><button onClick={() => save(category)} disabled={busy}>Guardar</button><button onClick={() => setEditing('')}>Cancelar</button></> : <><span><strong>{category.name}</strong><small>{category.productCount} productos</small></span><button onClick={() => { setEditing(category.id); setEditName(category.name) }}>Editar</button>{confirmId === category.id ? <span className="admin-inline-confirm">¿Eliminar? <button onClick={() => remove(category)} disabled={busy}>Sí</button><button onClick={() => setConfirmId('')}>No</button></span> : <button className="danger" onClick={() => setConfirmId(category.id)}>Eliminar</button>}</>}</div>)}{!categories.length && <p className="admin-empty">Todavía no hay categorías.</p>}</div></div>{error && <p className="admin-error" role="alert">{error}</p>}</section>
}

export default function AdminApp() {
  const [path, setPath] = useState(window.location.pathname)
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    adminRequest('/session').then(setSession).catch(() => setSession(null)).finally(() => setChecking(false))
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  const request = useCallback(async (route, options = {}) => {
    try { return await adminRequest(route, { ...options, csrfToken: session?.csrfToken }) }
    catch (issue) { if (issue.status === 401) setSession(null); throw issue }
  }, [session?.csrfToken])
  const refreshCategories = useCallback(() => request('/categories').then(data => setCategories(data.items)).catch(issue => setError(issue.message)), [request])
  useEffect(() => { if (session) refreshCategories() }, [session, refreshCategories])
  const go = next => { window.history.pushState({}, '', next); setPath(next); window.scrollTo(0, 0) }
  const logout = async () => { try { await request('/logout', { method: 'POST' }); setSession(null); go('/admin') } catch (issue) { setError(issue.message) } }
  if (checking) return <main className="admin-login-page"><div className="admin-loading">Comprobando acceso…</div></main>
  if (!session) return <Login onLogin={data => { setSession(data); go('/admin') }}/>
  const productId = path.match(/^\/admin\/productos\/([^/]+)$/)?.[1]
  const current = productId ? 'products' : path === '/admin/categorias' ? 'categories' : path === '/admin/productos' ? 'products' : 'dashboard'
  const nav = [['Panel', '/admin', 'dashboard'], ['Productos', '/admin/productos', 'products'], ['Categorías', '/admin/categorias', 'categories']]
  return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-identity"><span className="admin-mark">C</span><span><strong>CCL Tech Store</strong><small>Administración</small></span></div><nav aria-label="Administración">{nav.map(([label, url, key]) => <button key={url} className={current === key ? 'active' : ''} onClick={() => go(url)} aria-current={current === key ? 'page' : undefined}>{label}</button>)}</nav><div className="admin-sidebar-bottom"><a href="/" target="_blank" rel="noreferrer">Ver tienda ↗</a><button onClick={logout}>Cerrar sesión</button></div></aside><div className="admin-workspace"><header className="admin-topbar"><div><strong>CCL / Administración</strong><span>Sesión de {session.user.username}</span></div><div className="admin-topbar-actions"><a href="/" target="_blank" rel="noreferrer">Abrir tienda ↗</a><button onClick={logout}>Cerrar sesión</button></div></header>{error && <p className="admin-error" role="alert">{error}</p>}{productId ? <ProductEditor key={productId} id={productId} request={request} categories={categories} go={go}/> : current === 'products' ? <Products request={request} categories={categories} go={go}/> : current === 'categories' ? <Categories request={request} categories={categories} refreshCategories={refreshCategories}/> : <Dashboard request={request} go={go}/>}</div></div>
}
