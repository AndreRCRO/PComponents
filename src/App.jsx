import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { filterProducts, formatPrice } from './catalog.js'
import { fetchCatalog } from './api.js'
import { getProductPerformance } from './performanceEstimate.js'
import Lightfall from './components/Lightfall.jsx'
import PCBuilderPage from './PCBuilder.jsx'

const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))

const WHATSAPP = '59170000000'
const whatsappLink = product => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola CCL Tech Store, quisiera consultar por ${product}.`)}`
const whatsappOrderLink = items => {
  const lines = items.map(item => `${item.quantity}× ${item.name} — ${formatPrice(item.price * item.quantity)}`).join('\n')
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola CCL Tech Store, quisiera confirmar este pedido:\n\n${lines}\n\nTotal estimado: ${formatPrice(total)}`)}`
}

const icons = {
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  whatsapp: <><path d="M20.5 11.7a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.4-4.9A8.4 8.4 0 1 1 20.5 11.7Z"/><path d="M8.2 7.7c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4-.1.6l-.6.8c-.2.2-.1.5.1.8.8 1.3 1.8 2.2 3.2 2.8.3.1.5.1.7-.1l.9-1.1c.2-.2.4-.3.7-.2l1.9.9c.3.1.4.3.4.5 0 .4-.2 1.5-1 2.1-.7.6-1.6.8-2.7.5-1.1-.3-2.8-.9-4.7-2.5-2.4-2-3.8-4.6-3.9-5.7 0-.5.2-.9.6-1.2Z"/></>,
  cart: <><path d="M3 4h2l2.2 9.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  filter: <path d="M4 6h16M7 12h10M10 18h4"/>,
  grid: <><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  minus: <path d="M5 12h14"/>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/><path d="M10 11v5M14 11v5"/></>,
}

function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>
}

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  const hash = new URL(path, window.location.href).hash
  requestAnimationFrame(() => hash ? document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }) : window.scrollTo({ top: 0, behavior: 'smooth' }))
}

function Link({ to, children, className = '', onClick, ...props }) {
  return <a href={to} className={className} {...props} onClick={event => {
    onClick?.(event)
    if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
      event.preventDefault()
      navigate(to)
    }
  }} {...props}>{children}</a>
}

function Logo() {
  return <Link to="/" className="logo" aria-label="CCL Tech Store, inicio"><span className="logo-symbol">C</span><span><strong>CCL</strong> Tech Store</span></Link>
}

function Header({ query, setQuery, cartCount, path, onCartOpen, products }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const suggestions = useMemo(() => query.trim().length > 1 ? filterProducts(products, { query }).slice(0, 4) : [], [query])
  const submitSearch = event => { event.preventDefault(); setSearchOpen(false); navigate('/productos') }
  const menu = [['Inicio', '/'], ['Catálogo', '/productos'], ['Arma tu PC', '/arma-tu-pc'], ['Categorías', '/#categorias'], ['Ofertas', '/#ofertas'], ['Contacto', '/#contacto']]
  const isActive = to => to === '/' ? path === '/' : to === '/productos' ? path.startsWith('/producto') : to === '/arma-tu-pc' && path === to

  useEffect(() => {
    document.body.classList.toggle('no-scroll', menuOpen)
    return () => document.body.classList.remove('no-scroll')
  }, [menuOpen])

  return <>
    <header className="site-header">
      <div className="header-main container">
        <button className="icon-button menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Abrir menú"><Icon name="menu"/></button>
        <Logo/>
        <nav className="desktop-nav" aria-label="Navegación principal">{menu.map(([label, to]) => <Link key={label} to={to} className={isActive(to) ? 'active' : ''} aria-current={isActive(to) ? 'page' : undefined}>{label}</Link>)}</nav>
        <div className="search-shell" onFocus={() => setSearchOpen(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false) }}>
          <form className="search" role="search" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="site-search">Buscar productos</label>
            <Icon name="search"/>
            <input id="site-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar GPU, procesador, monitor..." autoComplete="off"/>
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Limpiar búsqueda"><Icon name="close" size={17}/></button>}
          </form>
          {searchOpen && query.trim().length > 1 && <div className="search-suggestions" aria-label="Sugerencias de búsqueda">{suggestions.length ? <>{suggestions.map(product => <Link to={`/producto/${product.id}`} key={product.id} onClick={() => setSearchOpen(false)}><img src={product.image} alt="" width="54" height="46"/><span><strong>{product.name}</strong><small>{formatPrice(product.price)}</small></span></Link>)}<button type="button" onClick={submitSearch}>Ver todos los resultados <Icon name="chevron" size={15}/></button></> : <p>No encontramos coincidencias. Prueba con otra palabra.</p>}</div>}
        </div>
        <div className="header-actions"><a className="whatsapp-link" href={whatsappLink('un producto')} target="_blank" rel="noreferrer"><Icon name="whatsapp"/><span>WhatsApp</span></a><button className="cart-summary" onClick={onCartOpen} aria-label={`Abrir carrito, ${cartCount} productos`}><Icon name="cart"/>{cartCount > 0 && <b>{cartCount}</b>}</button></div>
      </div>
    </header>
    <div className={`overlay ${menuOpen ? 'show' : ''}`} onClick={() => setMenuOpen(false)}/>
    <aside className={`mobile-menu ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
      <div><Logo/><button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><Icon name="close"/></button></div>
      <nav>{menu.map(([label, to]) => <Link key={label} to={to} onClick={() => setMenuOpen(false)}>{label}<Icon name="chevron" size={17}/></Link>)}</nav>
      <a className="button button-whatsapp" href={whatsappLink('un producto')} target="_blank" rel="noreferrer"><Icon name="whatsapp"/>Hablar con un asesor</a>
    </aside>
  </>
}

function CartDrawer({ open, items, onClose, onQuantity, onRemove }) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const unavailable = items.some(item => item.available === false)

  useEffect(() => {
    document.body.classList.toggle('no-scroll', open)
    return () => document.body.classList.remove('no-scroll')
  }, [open])

  return <><div className={`overlay cart-overlay ${open ? 'show' : ''}`} onClick={onClose}/><aside className={`cart-drawer ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="cart-title" aria-hidden={!open}><header><div><span>Tu compra</span><h2 id="cart-title">Carrito</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar carrito"><Icon name="close"/></button></header>{items.length ? <><div className="cart-items">{items.map(item => <article key={item.key}><img src={item.image} alt="" width="76" height="68"/><div className="cart-item-copy"><strong>{item.name}</strong>{item.available === false && <small className="cart-unavailable">No disponible; quítalo para continuar</small>}{item.bundleDiscount && <small className="cart-bundle-label">Precio PC completa · −{item.bundleDiscount}%</small>}<span>{formatPrice(item.price)}</span><div className="cart-item-controls"><div className="quantity-control" aria-label={`Cantidad de ${item.name}`}><button onClick={() => onQuantity(item.key, -1)} aria-label={`Quitar una unidad de ${item.name}`}><Icon name="minus" size={15}/></button><b>{item.quantity}</b><button onClick={() => onQuantity(item.key, 1)} aria-label={`Agregar una unidad de ${item.name}`}><Icon name="plus" size={15}/></button></div><button className="remove-item" onClick={() => onRemove(item.key)} aria-label={`Eliminar ${item.name}`}><Icon name="trash" size={17}/></button></div></div></article>)}</div><footer><div><span>Subtotal</span><strong>{formatPrice(total)}</strong></div><p>{unavailable ? 'Retira los productos no disponibles para continuar.' : 'El precio final y la entrega se confirman con un asesor.'}</p>{unavailable ? <button className="button button-primary" disabled>Revisar productos</button> : <a className="button button-primary" href={whatsappOrderLink(items)} target="_blank" rel="noreferrer"><Icon name="whatsapp"/>Finalizar por WhatsApp</a>}<button className="continue-shopping" onClick={onClose}>Seguir comprando</button></footer></> : <div className="cart-empty"><Icon name="cart" size={34}/><h3>Tu carrito está vacío</h3><p>Agrega componentes y revisa aquí tu pedido.</p><button className="button button-primary" onClick={() => { onClose(); navigate('/productos') }}>Explorar productos</button></div>}</aside></>
}

function Breadcrumb({ items }) {
  return <nav className="breadcrumb" aria-label="Migas de pan"><Link to="/">Inicio</Link>{items.map((item, index) => <span key={item}><Icon name="chevron" size={14}/>{index === items.length - 1 ? <b>{item}</b> : item}</span>)}</nav>
}

function FilterGroup({ title, items, selected, onToggle }) {
  return <fieldset><legend>{title}</legend>{items.map(item => <label className="check-row" key={item}><input type="checkbox" checked={selected.includes(item)} onChange={() => onToggle(item)}/><span><Icon name="check" size={14}/></span>{item}</label>)}</fieldset>
}

function FilterSidebar({ filters, setFilters, onClose, categories, brands, maxPriceCap }) {
  const toggle = key => item => setFilters(current => ({ ...current, [key]: current[key].includes(item) ? current[key].filter(value => value !== item) : [...current[key], item] }))
  const activeCount = filters.categories.length + filters.brands.length + (filters.maxPrice < maxPriceCap ? 1 : 0)
  return <aside className="filter-sidebar" aria-label="Filtros de productos">
    <div className="filter-title"><div><h2>Filtros</h2>{activeCount > 0 && <span>{activeCount} activos</span>}</div>{onClose && <button className="icon-button" onClick={onClose} aria-label="Cerrar filtros"><Icon name="close"/></button>}</div>
    <FilterGroup title="Categoría" items={categories} selected={filters.categories} onToggle={toggle('categories')}/>
    <FilterGroup title="Marca" items={brands} selected={filters.brands} onToggle={toggle('brands')}/>
    <fieldset className="price-filter"><legend>Precio máximo</legend><div><strong>{formatPrice(filters.maxPrice)}</strong><span>{formatPrice(maxPriceCap)}</span></div><input type="range" min="0" max={maxPriceCap} step="100" value={filters.maxPrice} onChange={event => setFilters(current => ({ ...current, maxPrice: Number(event.target.value) }))} aria-label="Precio máximo"/><div className="range-labels"><span>Bs 0</span><span>{formatPrice(maxPriceCap)}</span></div></fieldset>
    <button className="clear-filters" onClick={() => setFilters({ categories: [], brands: [], maxPrice: maxPriceCap })}>Limpiar filtros</button>
  </aside>
}

function ProductCard({ product, onBuy }) {
  const available = product.stock > 0
  return <article className="product-card">
    <Link to={`/producto/${product.id}`} className="product-image"><img src={product.image} alt={product.name} width="420" height="300" loading="lazy"/></Link>
    <div className="product-body"><div className="product-kicker"><span className="product-brand">{product.brand}</span><span className="availability"><span/>{available ? 'Disponible' : 'Agotado'}</span></div><Link to={`/producto/${product.id}`}><h2>{product.name}</h2></Link><p>{product.description}</p><div className="product-specs">{(product.specs || []).slice(0, 2).map(([label, value]) => <span key={label}><small>{label}</small>{value}</span>)}</div><strong className="product-price">{formatPrice(product.price)}</strong><div className="product-actions"><button type="button" className="button button-primary" onClick={() => onBuy(product)} disabled={!available}><Icon name="cart" size={17}/>{available ? 'Agregar' : 'Agotado'}</button><Link to={`/producto/${product.id}`} className="button button-secondary">Ver detalles</Link></div><a className="product-whatsapp" href={whatsappLink(product.name)} target="_blank" rel="noreferrer" aria-label={`Consultar ${product.name} por WhatsApp`}><Icon name="whatsapp" size={16}/>Consultar por WhatsApp</a></div>
  </article>
}

function ProductGrid({ items, onBuy, onReset }) {
  if (!items.length) return <div className="empty-state"><Icon name="search" size={32}/><h2>No encontramos productos</h2><p>Prueba con otro término o restablece los filtros.</p>{onReset && <button className="button button-primary" onClick={onReset}>Restablecer búsqueda</button>}</div>
  return <div className="product-grid">{items.map(product => <ProductCard key={product.id} product={product} onBuy={onBuy}/>)}</div>
}

const featuredCategoryIds = ['tarjetas-graficas', 'procesadores', 'ram', 'ssd', 'monitores', 'perifericos']

const heroSlides = [
  { eyebrow: 'Configurador interactivo', title: 'Arma tu PC, pieza por pieza', text: 'Elige componentes de la tienda y controla el precio mientras completas tu equipo.', image: '/products/pc-pro.webp', alt: 'Torre gamer para configurar una PC', to: '/arma-tu-pc', cta: 'Comenzar armado', tone: 'builder' },
  { productId: 'asus-rtx-4060-dual', title: 'Potencia para jugar en 1080p', tone: 'blue' },
  { productId: 'logitech-g502-x', title: 'Cada movimiento cuenta', tone: 'light' },
  { productId: 'logitech-g733', title: 'Juega a tu manera', tone: 'violet' },
]
const lightfallColors = ['#dff58a', '#a8c737', '#718a1f']

function HeroCarousel({ products }) {
  const [active, setActive] = useState(0)
  const slides = heroSlides.flatMap(item => {
    if (!item.productId) return [item]
    const product = products.find(candidate => candidate.id === item.productId)
    return product ? [{ ...item, text: product.description, image: product.image, alt: product.name, to: `/producto/${product.id}` }] : []
  })
  const slide = slides[active % slides.length]
  const move = step => setActive(index => (index + step + slides.length) % slides.length)
  return <section className={`hero-carousel ${slide.tone}`} aria-roledescription="carrusel" aria-label="Productos destacados"><Lightfall className="hero-lightfall" colors={lightfallColors} backgroundColor="#1a1f17" speed={.25} streakCount={3} streakWidth={.75} streakLength={1.15} glow={.56} density={.48} twinkle={.42} zoom={3.8} backgroundGlow={.2} opacity={.28} mouseStrength={.16} mouseRadius={.7}/><div className="hero-slide container" key={slide.title}><div className="hero-copy"><h1>{slide.title}</h1><p>{slide.text}</p><Link to={slide.to} className="button button-primary">{slide.cta || 'Ver producto'}</Link></div><div className="hero-visual"><img src={slide.image} alt={slide.alt} width="760" height="540" fetchPriority="high"/></div><button className="carousel-arrow prev" onClick={() => move(-1)} aria-label="Producto anterior"><Icon name="chevron"/></button><button className="carousel-arrow next" onClick={() => move(1)} aria-label="Producto siguiente"><Icon name="chevron"/></button><div className="carousel-dots">{slides.map((item, index) => <button key={item.title} className={index === active ? 'active' : ''} onClick={() => setActive(index)} aria-label={`Mostrar ${item.title}`} aria-current={index === active ? 'true' : undefined}/>)}</div></div></section>
}

function HomePage({ onBuy, products, categories }) {
  const featured = filterProducts(products, { sort: 'popular' }).slice(0, 6)
  const visibleHomeCategories = [...categories].sort((a, b) => {
    const rank = id => featuredCategoryIds.includes(id) ? featuredCategoryIds.indexOf(id) : 100
    return rank(a.id) - rank(b.id)
  }).filter(category => products.some(product => product.categoryId === category.id)).slice(0, 6)
  const pcs = [
    { name: 'PC Starter', image: '/products/pc-starter.webp', specs: ['Ryzen 5', '16GB RAM', 'SSD 512GB'], price: 'Bs 4.500' },
    { name: 'PC Pro', image: '/products/pc-pro.webp', specs: ['Ryzen 7', 'RTX 4060', '32GB RAM'], price: 'Bs 7.500' },
    { name: 'PC Ultra', image: '/products/pc-ultra.webp', specs: ['Ryzen 9', 'RTX 4080', '64GB RAM'], price: 'Bs 14.000' },
  ]
  return <main className="home-page">
    <HeroCarousel products={products}/>
    <section className="home-section container" id="categorias"><div className="section-heading split"><h2>Encuentra lo que necesitas</h2><Link to="/productos">Ver todo <Icon name="chevron" size={15}/></Link></div><div className="category-accordion">{visibleHomeCategories.map(category => <Link to={`/productos?categoria=${encodeURIComponent(category.name)}`} key={category.id}><img src={products.find(product => product.categoryId === category.id)?.image} alt="" width="420" height="520" loading="lazy"/><span><strong>{category.name}</strong><small>Explorar categoría</small></span></Link>)}</div></section>
    <section className="home-section home-featured"><div className="container"><div className="section-heading split"><h2>Productos destacados</h2><Link to="/productos">Catálogo completo <Icon name="chevron" size={15}/></Link></div><ProductGrid items={featured} onBuy={onBuy}/></div></section>
    <section className="weekly-offers" id="ofertas"><div className="container"><div className="section-heading"><h2>Ofertas de la semana</h2><p>Precios especiales en componentes seleccionados.</p></div><div className="offer-grid">{products.slice(4, 7).map(product => <Link to={`/producto/${product.id}`} key={product.id}><img src={product.image} alt={product.name} width="250" height="170" loading="lazy"/><div><span>Oferta limitada</span><strong>{product.name}</strong><del>{formatPrice(Math.round(product.price * 1.12 / 10) * 10)}</del><b>{formatPrice(product.price)}</b></div></Link>)}</div></div></section>
    <section className="home-section container" id="pcs"><div className="section-heading split"><div><h2>PC Gamer listas para jugar</h2><p>Configuraciones equilibradas para distintos niveles de rendimiento.</p></div><Link to="/arma-tu-pc">Arma la tuya <Icon name="chevron" size={15}/></Link></div><div className="pc-grid">{pcs.map((pc, index) => <article className={index === 1 ? 'featured' : ''} key={pc.name}>{index === 1 && <span>Más elegida</span>}<div className="pc-image"><img src={pc.image} alt={`Torre ${pc.name}`} width="520" height="520" loading="lazy"/></div><div className="pc-content"><h3>{pc.name}</h3><ul>{pc.specs.map(spec => <li key={spec}>{spec}</li>)}</ul><strong>{pc.price}</strong><a href={whatsappLink(pc.name)} className="button button-primary" target="_blank" rel="noreferrer">Consultar equipo</a></div></article>)}</div></section>
  </main>
}

function CatalogPage({ query, setQuery, onBuy, products, categories, brands }) {
  const categoryParam = new URLSearchParams(window.location.search).get('categoria')
  const maxPriceCap = Math.max(6000, Math.ceil(Math.max(...products.map(product => product.price), 0) / 500) * 500)
  const defaultFilters = { categories: categories.includes(categoryParam) ? [categoryParam] : [], brands: [], maxPrice: maxPriceCap }
  const [filters, setFilters] = useState(defaultFilters)
  const [sort, setSort] = useState('popular')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const visibleProducts = useMemo(() => filterProducts(products, { query, ...filters, sort }), [query, filters, sort])

  useEffect(() => {
    const hash = window.location.hash
    if (hash) requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView())
  }, [])

  return <main className="catalog-page">
    <div className="page-head container"><Breadcrumb items={['Componentes']}/><div className="page-title"><div><h1>Catálogo de productos</h1><p>Componentes, periféricos y equipos seleccionados.</p></div><div className="catalog-meta"><strong>{visibleProducts.length}</strong><span>productos disponibles</span></div></div></div>
    <section className="catalog container" id="categorias">
      <div className={`filter-drawer ${filtersOpen ? 'open' : ''}`}><FilterSidebar filters={filters} setFilters={setFilters} onClose={() => setFiltersOpen(false)} categories={categories} brands={brands} maxPriceCap={maxPriceCap}/></div>
      <div className={`overlay filter-overlay ${filtersOpen ? 'show' : ''}`} onClick={() => setFiltersOpen(false)}/>
      <div className="desktop-filters"><FilterSidebar filters={filters} setFilters={setFilters} categories={categories} brands={brands} maxPriceCap={maxPriceCap}/></div>
      <div className="catalog-results">
        <div className="catalog-toolbar"><button className="filter-button" onClick={() => setFiltersOpen(true)}><Icon name="filter"/>Filtros</button><span><Icon name="grid" size={18}/>{visibleProducts.length} resultados</span><label>Ordenar por<select value={sort} onChange={event => setSort(event.target.value)}><option value="popular">Más vendidos</option><option value="low">Precio menor</option><option value="high">Precio mayor</option><option value="new">Nuevos productos</option></select></label></div>
        {query && <div className="search-note">Resultados para <strong>“{query}”</strong></div>}
        <ProductGrid items={visibleProducts} onBuy={onBuy} onReset={() => { setFilters({ categories: [], brands: [], maxPrice: maxPriceCap }); setQuery('') }}/>
      </div>
    </section>
    <section className="catalog-band" id="ofertas"><div className="container"><div><h2>Precios especiales y lanzamientos</h2><p>Consulta promociones vigentes directamente con un asesor.</p></div><a className="button button-primary" href={whatsappLink('las ofertas disponibles')} target="_blank" rel="noreferrer"><Icon name="whatsapp"/>Consultar ofertas</a></div></section>
  </main>
}

function ProductGallery({ product, variant }) {
  const images = variant ? [variant.image] : product.gallery?.length ? product.gallery : [product.image]
  const [selected, setSelected] = useState(images[0])
  useEffect(() => setSelected(images[0]), [product.id, images[0]])
  return <div className="gallery"><div className="gallery-main"><img src={selected} alt={product.name} width="720" height="560"/></div><div className="thumbnails">{images.map((image, index) => <button key={image} className={selected === image ? 'active' : ''} onClick={() => setSelected(image)} aria-label={`Ver imagen ${index + 1} de ${product.name}`}><img src={image} alt="" width="100" height="78"/></button>)}</div></div>
}

function ProductInfo({ product, variant, onVariantChange, onBuy }) {
  return <div className="product-info"><span className="product-brand">{product.brand}</span><h1>{product.name}</h1><p className="product-summary">{product.description}</p><dl><div><dt>Marca</dt><dd>{product.brand}</dd></div><div><dt>Categoría</dt><dd>{product.category}</dd></div><div><dt>Disponibilidad</dt><dd className="in-stock"><span/>{product.stock > 0 ? 'Disponible' : 'Agotado'}</dd></div></dl>{product.variants?.length > 0 && <fieldset className="variant-picker"><legend>Color: <strong>{variant?.name}</strong></legend><div>{product.variants.map(option => <button key={option.name} className={variant?.name === option.name ? 'selected' : ''} onClick={() => onVariantChange(option)} aria-label={`Seleccionar color ${option.name}`} aria-pressed={variant?.name === option.name}><span style={{ background: option.color }}/>{option.name}</button>)}</div></fieldset>}<div className="detail-price"><small>Precio</small><strong>{formatPrice(product.price)}</strong></div><div className="detail-actions"><button className="button button-primary" onClick={() => onBuy({ ...product, name: variant ? `${product.name} ${variant.name}` : product.name, image: variant?.image || product.image })} disabled={product.stock === 0}><Icon name="cart"/>{product.stock > 0 ? 'Agregar al carrito' : 'Agotado'}</button><a className="button button-secondary" href={whatsappLink(variant ? `${product.name} color ${variant.name}` : product.name)} target="_blank" rel="noreferrer"><Icon name="whatsapp"/>Consultar por WhatsApp</a></div></div>
}

const buyingGuides = {
  'Tarjetas gráficas': ['Gaming, streaming y creación de contenido con aceleración por GPU.', 'Fuente de poder, conectores PCIe y espacio disponible en el gabinete.'],
  Procesadores: ['Gaming exigente, multitarea y aplicaciones de productividad.', 'Socket de la placa madre, memoria compatible y solución de refrigeración.'],
  RAM: ['Multitarea, gaming y aplicaciones que manejan archivos pesados.', 'Tipo DDR, capacidad máxima y perfiles XMP o EXPO de la placa madre.'],
  SSD: ['Sistema operativo, biblioteca de juegos y proyectos de carga rápida.', 'Ranura M.2 disponible, generación PCIe y soporte NVMe de tu equipo.'],
  Monitores: ['Gaming fluido, trabajo diario y contenido de alta resolución.', 'Puertos de video, resolución objetivo y rendimiento de tu tarjeta gráfica.'],
  Periféricos: ['Una experiencia cómoda y precisa durante sesiones prolongadas.', 'Tipo de conexión, sistema operativo y espacio disponible en tu escritorio.'],
}

function ProductGuide({ product }) {
  const [ideal, check] = buyingGuides[product.category] || ['Uso diario y actualización de tu equipo.', 'Compatibilidad con los componentes que ya tienes.']
  return <div className="buying-guide"><div><span>Ideal para</span><p>{ideal}</p></div><div><span>Antes de comprar</span><p>{check}</p></div></div>
}

function PerformanceGuide({ estimate }) {
  if (!estimate) return null
  const [[featuredGame, featuredFps], ...otherGames] = estimate.games
  return <section className="performance-guide" id="rendimiento"><div className="performance-heading"><div><h2>Rendimiento calculado para esta combinación</h2><p>{estimate.system} · {estimate.resolution}</p></div><span>Proyección</span></div><div className="performance-layout"><article className="performance-featured"><span>{featuredGame}</span><strong>≈ {featuredFps} FPS</strong><small>{estimate.resolution}</small></article><div className="performance-list">{otherGames.map(([title, fps]) => <div key={title}><span><strong>{title}</strong><small>Calidad alta</small></span><b>≈ {fps} FPS</b></div>)}</div></div><p className="performance-note">Cálculo orientativo a partir de los índices de CPU y GPU de referencia del catálogo; no es una medición de este equipo. Los resultados reales varían según ajustes, controladores y juego.</p></section>
}

function RelatedProducts({ product, onBuy, products }) {
  const related = products.filter(item => item.id !== product.id).sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category)).slice(0, 4)
  return <section className="related container"><div className="section-heading"><h2>También puedes necesitar</h2></div><ProductGrid items={related} onBuy={onBuy}/></section>
}

function ProductDetailPage({ id, onBuy, products }) {
  const product = products.find(item => item.id === id)
  const [variant, setVariant] = useState(product?.variants?.[0] || null)
  useEffect(() => setVariant(product?.variants?.[0] || null), [product?.id])
  if (!product) return <main className="not-found container"><h1>Producto no encontrado</h1><p>El producto que buscas no existe o cambió de dirección.</p><Link to="/productos" className="button button-primary">Volver al catálogo</Link></main>

  const selectedProduct = { ...product, name: variant ? `${product.name} ${variant.name}` : product.name, image: variant?.image || product.image }
  const estimate = getProductPerformance(product, products)
  return <main className="product-detail-main"><div className="product-page container"><Breadcrumb items={[product.category, product.name]}/><section className="product-detail"><ProductGallery product={product} variant={variant}/><ProductInfo product={product} variant={variant} onVariantChange={setVariant} onBuy={onBuy}/></section><section className={`product-copy${estimate ? '' : ' no-performance'}`}><div className="product-description"><h2>Diseñado para rendir</h2><p>{product.longDescription || product.description}</p><ProductGuide product={product}/></div><div className="product-specification"><h2>Especificaciones</h2><dl className="spec-grid">{(product.specs || []).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div></section><PerformanceGuide estimate={estimate}/></div><RelatedProducts product={product} onBuy={onBuy} products={products}/><div className="mobile-buy-bar"><div><small>{product.name}</small><strong>{formatPrice(product.price)}</strong></div><button className="button button-primary" onClick={() => onBuy(selectedProduct)} disabled={product.stock === 0}><Icon name="cart" size={18}/>{product.stock > 0 ? 'Agregar' : 'Agotado'}</button></div></main>
}

function Footer() {
  return <footer id="contacto"><div className="container footer-grid"><div><Logo/><p>Componentes, periféricos y equipos con garantía y asesoramiento especializado.</p></div><div><h2>Tienda</h2><Link to="/productos">Productos</Link><Link to="/arma-tu-pc">Arma tu PC</Link><Link to="/productos#categorias">Categorías</Link><Link to="/productos#ofertas">Ofertas</Link></div><div><h2>Ayuda</h2><a href="#contacto">Envíos</a><a href="#contacto">Garantías</a><a href="#contacto">Cambios y devoluciones</a></div><div><h2>Contacto</h2><a href="tel:+59170000000">+591 700 00000</a><a href="mailto:ventas@ccltech.store">ventas@ccltech.store</a><span>La Paz, Bolivia</span></div></div><div className="footer-bottom container"><span>© 2026 CCL Tech Store</span><span>Precios expresados en bolivianos.</span></div></footer>
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [catalog, setCatalog] = useState(null)
  const [catalogError, setCatalogError] = useState('')
  const [query, setQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ccl-cart-items-v3') || '[]') }
    catch { return [] }
  })
  const [toast, setToast] = useState('')

  useEffect(() => {
    const update = () => setPath(window.location.pathname)
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  const loadCatalog = () => fetchCatalog().then(data => { setCatalog(data); setCatalogError('') }).catch(error => setCatalogError(error.message))
  useEffect(() => { loadCatalog() }, [])

  useEffect(() => {
    if (!catalog) return
    const current = new Map(catalog.products.map(product => [product.id, product]))
    setCartItems(items => items.map(item => {
      const product = current.get(item.id)
      if (!product) return { ...item, available: false }
      const discount = item.bundleDiscount ? (100 - item.bundleDiscount) / 100 : 1
      return { ...item, price: Math.round(product.price * discount), available: product.stock >= item.quantity, name: product.name }
    }))
  }, [catalog])

  useEffect(() => localStorage.setItem('ccl-cart-items-v3', JSON.stringify(cartItems)), [cartItems])

  const addProductsToCart = (productsToAdd, message) => {
    setCartItems(items => {
      const next = [...items]
      productsToAdd.forEach(product => {
        const key = `${product.id}:${product.name}${product.bundleDiscount ? ':pc-completa' : ''}`
        const index = next.findIndex(item => item.key === key)
        if (index >= 0) next[index] = { ...next[index], quantity: next[index].quantity + 1, available: product.stock >= next[index].quantity + 1 }
        else next.push({ key, id: product.id, name: product.name, image: product.image, price: product.price, quantity: 1, bundleDiscount: product.bundleDiscount, available: true })
      })
      return next
    })
    setToast(message)
    setCartOpen(true)
    window.setTimeout(() => setToast(''), 3000)
  }

  const buy = product => addProductsToCart([product], `${product.name} fue añadido al carrito`)

  const changeQuantity = (key, amount) => setCartItems(items => items.map(item => {
    if (item.key !== key) return item
    const quantity = Math.max(1, item.quantity + amount)
    const product = catalog?.products.find(candidate => candidate.id === item.id)
    return { ...item, quantity, available: Boolean(product && product.stock >= quantity) }
  }))
  const removeFromCart = key => setCartItems(items => items.filter(item => item.key !== key))
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  if (path.startsWith('/admin')) return <Suspense fallback={<main className="container" style={{ padding: 48 }}>Abriendo administración…</main>}><AdminApp/></Suspense>

  const products = catalog?.products || []
  const categoryRecords = catalog?.categories || []
  const categories = categoryRecords.map(item => item.name)
  const brands = [...new Set(products.flatMap(product => product.brands?.length ? product.brands : [product.brand]))].sort((a, b) => a.localeCompare(b))
  const productMatch = path.match(/^\/producto\/([^/]+)$/)
  return <>
    <a href="#contenido" className="skip-link">Saltar al contenido</a>
    <Header query={query} setQuery={setQuery} cartCount={cartCount} path={path} onCartOpen={() => setCartOpen(true)} products={products}/>
    <div id="contenido">{!catalog ? <main className="container" style={{ minHeight: '50vh', paddingBlock: 80 }}><h1>{catalogError ? 'No pudimos cargar la tienda' : 'Cargando catálogo…'}</h1>{catalogError && <><p>{catalogError}</p><button className="button button-primary" onClick={loadCatalog}>Reintentar</button></>}</main> : productMatch ? <ProductDetailPage id={productMatch[1]} onBuy={buy} products={products}/> : path === '/productos' ? <CatalogPage query={query} setQuery={setQuery} onBuy={buy} products={products} categories={categories} brands={brands}/> : path === '/arma-tu-pc' ? <PCBuilderPage products={products.filter(product => product.stock > 0)} onNavigate={navigate} onAddBuild={items => addProductsToCart(items, 'Tu configuración fue añadida al carrito')}/> : <HomePage onBuy={buy} products={products} categories={categoryRecords}/>}</div>
    <Footer/>
    <CartDrawer open={cartOpen} items={cartItems} onClose={() => setCartOpen(false)} onQuantity={changeQuantity} onRemove={removeFromCart}/>
    <div className={`toast ${toast && !cartOpen ? 'show' : ''}`} role="status" aria-live="polite"><Icon name="check"/>{toast}</div>
  </>
}

export default App
