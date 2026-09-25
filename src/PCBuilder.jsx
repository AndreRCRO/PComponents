import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { formatPrice } from './catalog.js'
import { getPowerEstimate } from './builderPower.js'
import { getPerformanceEstimate } from './performanceEstimate.js'
import './builder.css'

const WHATSAPP = '59170000000'
const STORAGE_KEY = 'ccl-pc-builder-v4'
const COMPLETE_DISCOUNT_RATE = .05
const categoryOptions = (categoryId, products) => products
  .filter(product => product.categoryId === categoryId)
  .map(product => ({ ...product, builderNote: product.builderNote || product.description }))
  .sort((a, b) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended)) || b.sales - a.sales)

export const builderSteps = [
  { key: 'case', label: 'Gabinete', short: 'Gabinete', description: 'Empieza por la estructura. El modelo elegido será la base visual de todo el armado.', options: (_selected, products) => categoryOptions('gabinetes', products) },
  { key: 'motherboard', label: 'Placa madre', short: 'Placa', description: 'Define la plataforma. Mostramos únicamente formatos que caben en el gabinete elegido.', options: (selected, products) => categoryOptions('placas-madre', products).filter(option => !selected.case || selected.case.formFactors?.includes(option.formFactor)) },
  { key: 'cpu', label: 'Procesador', short: 'CPU', description: 'Elige el cerebro del equipo. Solo mostramos opciones compatibles con el socket de la placa.', options: (selected, products) => categoryOptions('procesadores', products).filter(option => !selected.motherboard || option.socket === selected.motherboard.socket) },
  { key: 'cooling', label: 'Refrigeración', short: 'Cooler', description: 'Filtramos socket, capacidad térmica y espacio para disipador o radiador.', options: (selected, products) => categoryOptions('refrigeracion', products).filter(option => (!selected.cpu || option.sockets?.includes(selected.cpu.socket)) && (!selected.cpu || option.coolingCapacity >= selected.cpu.powerDraw) && (!selected.case || (option.radiatorSize ? option.radiatorSize <= selected.case.maxRadiatorSize : option.coolerHeight <= selected.case.maxCoolerHeight))) },
  { key: 'ram', label: 'Memoria RAM', short: 'RAM', description: 'Capacidad para juegos, multitarea y creación de contenido sin interrupciones.', options: (selected, products) => categoryOptions('ram', products).filter(option => !selected.motherboard || option.memoryType === selected.motherboard.memoryType) },
  { key: 'gpu', label: 'Tarjeta gráfica', short: 'GPU', description: 'Filtramos por la longitud máxima admitida por el gabinete elegido.', options: (selected, products) => categoryOptions('tarjetas-graficas', products).filter(option => !selected.case || !option.length || option.length <= selected.case.maxGpuLength) },
  { key: 'storage', label: 'Almacenamiento', short: 'SSD', description: 'Espacio NVMe rápido para Windows, programas y tu biblioteca de juegos.', options: (_selected, products) => categoryOptions('ssd', products) },
  { key: 'power', label: 'Fuente de poder', short: 'Fuente', description: 'Elige una fuente compatible con los componentes de tu configuración.', options: (_selected, products) => categoryOptions('fuentes-de-poder', products).sort((a, b) => a.wattage - b.wattage) },
]

const presetDefinitions = [
  { id: 'gamer-1080p', eyebrow: 'Mejor relación precio / FPS', name: 'Gamer 1080p', description: 'Calidad alta y FPS competitivos sin pagar potencia que no usarás.', build: { case: 'ccl-forge-airflow', motherboard: 'ccl-b650-atx-wifi', cpu: 'amd-ryzen-7-7800x3d', cooling: 'ccl-airflow-220', ram: 'kingston-fury-ddr5-32gb', gpu: 'asus-rtx-4060-dual', storage: 'samsung-990-pro-2tb', power: 'ccl-power-750-gold' } },
  { id: 'gamer-1440p', eyebrow: 'Más detalle y fluidez', name: 'Gamer 1440p', description: 'Una configuración equilibrada para monitores QHD de alta frecuencia.', build: { case: 'ccl-forge-airflow-xl', motherboard: 'ccl-b650-atx-wifi', cpu: 'amd-ryzen-7-7800x3d', cooling: 'ccl-airflow-260', ram: 'kingston-fury-ddr5-32gb', gpu: 'msi-rtx-4070-ventus', storage: 'samsung-990-pro-2tb', power: 'ccl-power-850-gold' } },
  { id: 'creator', eyebrow: 'Edición, streaming y 3D', name: 'Creador de contenido', description: 'Más núcleos, memoria y almacenamiento para cargas profesionales.', build: { case: 'ccl-forge-airflow-xl', motherboard: 'ccl-b760-atx-wifi', cpu: 'intel-core-i7-14700k', cooling: 'ccl-airflow-260', ram: 'kingston-fury-ddr5-64gb', gpu: 'msi-rtx-4070-ventus', storage: 'samsung-990-pro-4tb', power: 'ccl-power-850-gold' } },
]

const resolveBuild = (ids, products) => {
  const resolved = {}
  builderSteps.forEach(step => {
    const id = ids?.[step.key]
    const option = id && step.options(resolved, products).find(candidate => candidate?.id === id)
    if (option) resolved[step.key] = option
  })
  if (resolved.power && resolved.power.wattage < getPowerEstimate(resolved).recommendedWattage) delete resolved.power
  return resolved
}

const encodeBuild = selected => builderSteps.filter(step => selected[step.key]).map(step => `${step.key}:${selected[step.key].id}`).join(',')
const decodeBuild = value => Object.fromEntries((value || '').split(',').flatMap(pair => {
  const separator = pair.indexOf(':')
  return separator < 1 ? [] : [[pair.slice(0, separator), pair.slice(separator + 1)]]
}))

const loadSavedBuild = products => {
  try {
    const shared = new URLSearchParams(window.location.search).get('build')
    if (shared) return resolveBuild(decodeBuild(shared), products)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
    return resolveBuild(Object.fromEntries(Object.entries(saved).map(([key, value]) => [key, value?.id || value])), products)
  } catch { return {} }
}

const getTotals = selected => {
  const subtotal = Object.values(selected).reduce((sum, product) => sum + (product?.price || 0), 0)
  const complete = builderSteps.every(step => selected[step.key])
  const discount = complete ? Math.round(subtotal * COMPLETE_DISCOUNT_RATE) : 0
  return { subtotal, discount, finalTotal: subtotal - discount, complete }
}

const buildWhatsappLink = (selected, totals) => {
  const chosen = builderSteps.map(step => selected[step.key] && `${step.label}: ${selected[step.key].name} (${formatPrice(selected[step.key].price)})`).filter(Boolean)
  const missing = builderSteps.filter(step => !selected[step.key]).map(step => step.label)
  const lines = chosen.length ? chosen.join('\n') : 'Todavía no elegí componentes.'
  const missingCopy = missing.length ? `\n\nMe faltan: ${missing.join(', ')}.` : '\n\nLa configuración está completa.'
  const discountCopy = totals.discount ? `\nDescuento por PC completa: -${formatPrice(totals.discount)}` : ''
  const message = `Hola CCL Tech Store, esta es mi configuración:\n\n${lines}${missingCopy}\n\nSubtotal: ${formatPrice(totals.subtotal)}${discountCopy}\nTotal estimado: ${formatPrice(totals.finalTotal)}\n\n¿Pueden revisar la compatibilidad y ayudarme con lo que falta?`
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`
}

const assemblyParts = [
  { key: 'motherboard', className: 'motherboard', label: 'Placa' }, { key: 'cpu', className: 'cpu', label: 'CPU' },
  { key: 'cooling', className: 'cooling', label: 'Cooler' }, { key: 'ram', className: 'ram', label: 'RAM' },
  { key: 'gpu', className: 'gpu', label: 'GPU' }, { key: 'storage', className: 'storage', label: 'SSD' },
  { key: 'power', className: 'power', label: 'Fuente' },
]

function PresetSelector({ presets, onApply }) {
  return <section className="builder-presets container" aria-labelledby="preset-title">
    <div className="builder-presets-intro"><h2 id="preset-title">Configuraciones recomendadas</h2><p>Carga una base probada y cambia cualquier pieza después.</p></div>
    {presets.length ? <div className="builder-preset-list">
      {presets.map(preset => <article className="builder-preset" key={preset.id}>
        <h3>{preset.name}</h3><p>{preset.description}</p>
        <div><span><s>{formatPrice(preset.subtotal)}</s><strong>{formatPrice(preset.finalTotal)}</strong></span><em>Ahorras {formatPrice(preset.discount)}</em></div>
        <button type="button" onClick={() => onApply(preset)}>Cargar configuración</button>
      </article>)}
    </div> : <p className="builder-presets-empty">Por ahora no hay configuraciones completas disponibles. Puedes armar tu equipo pieza por pieza.</p>}
  </section>
}

function ResetControl({ onReset, disabled }) {
  const [confirming, setConfirming] = useState(false)
  return <div className={`builder-reset-control${confirming ? ' confirming' : ''}`}>
    <button type="button" className="builder-reset" disabled={disabled} onClick={() => {
      if (confirming) { setConfirming(false); onReset() }
      else setConfirming(true)
    }}>{confirming ? 'Sí, reiniciar' : 'Reiniciar armado'}</button>
    {confirming && <><span role="status">Se borrarán todas las piezas elegidas.</span><button type="button" className="builder-reset-cancel" onClick={() => setConfirming(false)}>Cancelar</button></>}
  </div>
}

function BuildStage({ selected, totals, activeAction, onShare, shareStatus, onReset }) {
  const reduceMotion = useReducedMotion()
  const chosenCount = builderSteps.filter(step => selected[step.key]).length
  const caseProduct = selected.case
  const caseImage = caseProduct?.image || '/products/ccl-case-v2.webp'
  const actionStep = activeAction && builderSteps.find(step => step.key === activeAction.stepKey)
  const actionName = activeAction?.kind === 'preset' ? 'Configuración cargada' : actionStep?.label

  return <section className={`builder-stage${totals.complete ? ' complete' : ''}`} aria-label="Vista previa de la PC">
    <div className="builder-stage-head"><div><span>PC en armado</span><strong>{totals.complete ? 'Configuración completa' : `${chosenCount} de ${builderSteps.length} componentes`}</strong></div><span className="builder-stage-status">{totals.complete ? 'Lista para revisar' : 'En progreso'}</span></div>
    <div className="builder-machine">
      <motion.div className="builder-machine-glow" animate={reduceMotion ? undefined : { opacity: totals.complete ? .72 : .34, scale: 1 + chosenCount * .012 }} transition={{ duration: .4, ease: [0.16, 1, 0.3, 1] }}/>
      <div className="builder-assembly-scene">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img className={`builder-case-image${caseProduct ? ' selected' : ''}`} key={caseProduct?.id || 'case-preview'} src={caseImage} alt={caseProduct ? caseProduct.name : 'Vista previa de un gabinete para la PC'} width="640" height="640"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 70, rotateY: -28, scale: .9, filter: 'blur(12px)' }} animate={{ opacity: caseProduct ? 1 : .42, x: 0, rotateY: 0, scale: totals.complete ? 1.025 : 1, filter: 'blur(0px)' }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -48, rotateY: 22, scale: .94, filter: 'blur(8px)' }} transition={reduceMotion ? { duration: .16 } : { type: 'spring', stiffness: 170, damping: 24, mass: 1.05 }}/>
        </AnimatePresence>
        <div className="builder-schematic" aria-label="Mapa esquemático de componentes">
          {assemblyParts.map((part, index) => {
            const filled = Boolean(selected[part.key])
            const active = activeAction?.stepKey === part.key || activeAction?.kind === 'preset'
            return <motion.div className={`builder-slot slot-${part.className}${filled ? ' filled' : ''}`} key={part.key} animate={reduceMotion ? undefined : { opacity: filled ? 1 : .52, scale: active && filled ? [1, 1.055, 1] : 1 }} transition={{ duration: activeAction?.kind === 'preset' ? .5 : .34, delay: activeAction?.kind === 'preset' ? index * .045 : 0 }}><span/><small>{part.label}</small></motion.div>
          })}
        </div>
        <AnimatePresence>
          {activeAction && <motion.div className={`builder-action-feedback ${activeAction.kind}`} key={activeAction.id} initial={{ opacity: 0, y: reduceMotion ? 0 : 10, filter: reduceMotion ? 'none' : 'blur(5px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }} transition={{ duration: .2, ease: [0.16, 1, 0.3, 1] }}><span>{activeAction.kind === 'add' ? 'Acoplado' : activeAction.kind === 'remove' ? 'Retirado' : 'Lista para editar'}</span><strong>{actionName}</strong></motion.div>}
        </AnimatePresence>
        <AnimatePresence>
          {activeAction?.kind !== 'remove' && activeAction && <motion.div className="builder-assembly-wave" key={`wave-${activeAction.id}`} initial={{ opacity: .7, scale: .28 }} animate={{ opacity: 0, scale: 1.35 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? .18 : .72, ease: [0.16, 1, 0.3, 1] }}/>} 
        </AnimatePresence>
      </div>
    </div>
    <div className="builder-stage-total">
      <div><span>{totals.complete ? 'Total con descuento' : 'Subtotal de componentes'}</span><small>{totals.complete ? `Ahorras ${formatPrice(totals.discount)} por llevar la PC completa` : 'Completa los 8 componentes y recibe 5% de descuento'}</small></div>
      <AnimatePresence mode="wait" initial={false}><motion.strong key={totals.finalTotal} initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .18 }}>{formatPrice(totals.finalTotal)}</motion.strong></AnimatePresence>
      <div className="builder-stage-actions"><button type="button" onClick={onShare}>{shareStatus || 'Compartir configuración'}</button><ResetControl onReset={onReset} disabled={!chosenCount}/></div>
    </div>
  </section>
}

function ComponentOption({ option, selected, recommended, insufficient, onSelect }) {
  return <motion.button type="button" className={`builder-option${selected ? ' selected' : ''}`} onClick={onSelect} aria-pressed={selected} disabled={insufficient} whileTap={{ scale: .985 }} layout>
    <span className="builder-option-copy"><span className="builder-option-meta"><small>{option.brand}</small>{recommended && <em>Recomendada</em>}</span><strong>{option.name}</strong><span>{option.builderNote}</span><b>{formatPrice(option.price)}</b></span>
    <span className="builder-option-marker" aria-hidden="true">{insufficient ? 'No compatible' : selected ? 'Quitar selección' : 'Elegir'}</span>
  </motion.button>
}

function PerformanceEstimate({ estimate, selected }) {
  if (!estimate && selected.cpu && selected.gpu) return <section className="builder-performance builder-performance-unavailable container"><h2>Sin proyección de FPS para esta combinación</h2><p>Alguno de estos modelos aún no tiene datos de referencia. Puedes seguir armando la PC y revisar precio, consumo y compatibilidad.</p></section>
  return <AnimatePresence mode="wait">{estimate && <motion.section className="builder-performance container" key={estimate.resolution} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .28, ease: [0.16, 1, 0.3, 1] }}>
    <div className="builder-performance-copy"><h2>Rendimiento estimado</h2><p>{estimate.resolution}. Valores orientativos según la combinación de procesador y gráfica elegida.</p></div>
    <div className="builder-game-list">{estimate.games.map(([game, fps]) => <article key={game}><span>{game}</span><strong>≈ {fps} FPS</strong><small>promedio estimado</small></article>)}</div>
    <p className="builder-performance-note">Proyección matemática a partir de referencias del catálogo; no es una prueba de laboratorio. El resultado real varía según ajustes, controladores, temperatura y versión del juego.</p>
  </motion.section>}</AnimatePresence>
}

function BuildSummary({ selected, totals, estimate, onEdit, onReset, onAddBuild }) {
  const selectedProducts = builderSteps.map(step => selected[step.key]).filter(Boolean)
  const target = estimate?.resolution.split(' · ')[0]
  const cartProducts = totals.complete ? selectedProducts.map(product => ({ ...product, price: Math.round(product.price * (1 - COMPLETE_DISCOUNT_RATE)), bundleDiscount: 5 })) : selectedProducts
  return <div className="builder-summary">
    <div className="builder-summary-heading"><div><h2>{totals.complete ? 'Tu PC está lista para revisar' : 'Revisa y completa tu PC'}</h2><p>Puedes comprar una configuración parcial o volver a cualquier componente.</p></div><span>{estimate ? `Objetivo: ${target}` : totals.complete ? 'Rendimiento sin referencia' : 'Configuración parcial'}</span></div>
    <div className="builder-summary-list">{builderSteps.map((step, index) => {
      const product = selected[step.key]
      return <article className={product ? '' : 'empty'} key={step.key}><div><small>{step.label}</small><strong>{product?.name || 'Sin seleccionar'}</strong></div><b>{product ? formatPrice(product.price) : '—'}</b><button type="button" onClick={() => onEdit(index)}>{product ? 'Cambiar' : 'Elegir'}</button></article>
    })}</div>
    <div className="builder-summary-pricing"><div><span>Subtotal</span><b>{formatPrice(totals.subtotal)}</b></div>{totals.complete && <div className="discount"><span>Descuento PC completa</span><b>− {formatPrice(totals.discount)}</b></div>}<div className="total"><span>Total estimado</span><strong>{formatPrice(totals.finalTotal)}</strong></div></div>
    <p className="builder-compatibility">Filtramos socket, memoria, formato, espacio para GPU y cooler, y compatibilidad de la fuente. Un asesor valida la configuración final antes del pedido.</p>
    <div className="builder-final-actions"><button type="button" className="button button-primary" onClick={() => onAddBuild(cartProducts)} disabled={!selectedProducts.length}>Agregar selección al carrito</button><a className="button button-secondary" href={buildWhatsappLink(selected, totals)} target="_blank" rel="noreferrer">Consultar por WhatsApp</a><ResetControl onReset={onReset} disabled={!selectedProducts.length}/></div>
  </div>
}

export default function PCBuilderPage({ products, onAddBuild, onNavigate }) {
  const reduceMotion = useReducedMotion()
  const configRef = useRef(null)
  const contentRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [selected, setSelected] = useState(() => loadSavedBuild(products))
  const [activeAction, setActiveAction] = useState(null)
  const [shareStatus, setShareStatus] = useState('')
  const [optionQuery, setOptionQuery] = useState('')
  const [visibleLimit, setVisibleLimit] = useState(4)
  const isSummary = activeIndex === builderSteps.length
  const currentStep = builderSteps[activeIndex]
  const currentOptions = currentStep?.options(selected, products) || []
  const totals = useMemo(() => getTotals(selected), [selected])
  const estimate = useMemo(() => getPerformanceEstimate(selected), [selected])
  const power = useMemo(() => getPowerEstimate(selected), [selected])
  const presets = useMemo(() => presetDefinitions.map(preset => { const resolved = resolveBuild(preset.build, products); return { ...preset, ...getTotals(resolved), resolved } }).filter(preset => preset.complete), [products])
  const matchingOptions = useMemo(() => {
    const term = optionQuery.trim().toLowerCase()
    return !term ? currentOptions : currentOptions.filter(option => `${option.brand} ${option.name} ${option.builderNote}`.toLowerCase().includes(term))
  }, [currentOptions, optionQuery])
  const visibleOptions = useMemo(() => {
    const ordered = currentStep?.key === 'power' && !optionQuery.trim()
      ? [...matchingOptions].sort((a, b) => Number(a.wattage < power.recommendedWattage) - Number(b.wattage < power.recommendedWattage) || a.wattage - b.wattage)
      : matchingOptions
    const initial = ordered.slice(0, visibleLimit)
    const selectedOption = currentStep && selected[currentStep.key]
    return selectedOption && !initial.some(option => option.id === selectedOption.id) ? [selectedOption, ...initial] : initial
  }, [matchingOptions, optionQuery, selected, currentStep, visibleLimit, power.recommendedWattage])
  const recommendedPowerId = currentStep?.key === 'power' ? currentOptions.find(option => option.wattage >= power.recommendedWattage)?.id : null

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected))
    const url = new URL(window.location.href)
    const encoded = encodeBuild(selected)
    if (encoded) url.searchParams.set('build', encoded)
    else url.searchParams.delete('build')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }, [selected])
  useEffect(() => {
    if (!activeAction) return undefined
    const timer = window.setTimeout(() => setActiveAction(null), activeAction.kind === 'remove' ? 900 : 1450)
    return () => window.clearTimeout(timer)
  }, [activeAction])
  useEffect(() => {
    if (!shareStatus) return undefined
    const timer = window.setTimeout(() => setShareStatus(''), 2200)
    return () => window.clearTimeout(timer)
  }, [shareStatus])
  useEffect(() => { setOptionQuery(''); setVisibleLimit(4) }, [activeIndex])

  const scrollToOptions = () => {
    if (!window.matchMedia('(max-width: 640px)').matches) return
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => (contentRef.current || configRef.current)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })))
  }
  const goTo = index => { setActiveIndex(index); scrollToOptions() }
  const selectProduct = product => {
    const removing = selected[currentStep.key]?.id === product.id
    setSelected(current => {
      const nextSelected = { ...current }
      if (removing) delete nextSelected[currentStep.key]
      else nextSelected[currentStep.key] = product
      if (!removing && currentStep.key === 'case') {
        if (nextSelected.motherboard && !product.formFactors?.includes(nextSelected.motherboard.formFactor)) { delete nextSelected.motherboard; delete nextSelected.cpu; delete nextSelected.cooling }
        if (nextSelected.cooling && (nextSelected.cooling.radiatorSize ? nextSelected.cooling.radiatorSize > product.maxRadiatorSize : nextSelected.cooling.coolerHeight > product.maxCoolerHeight)) delete nextSelected.cooling
        if (nextSelected.gpu?.length > product.maxGpuLength) delete nextSelected.gpu
      }
      if (!removing && currentStep.key === 'motherboard') {
        if (nextSelected.cpu?.socket !== product.socket) { delete nextSelected.cpu; delete nextSelected.cooling }
        if (nextSelected.ram?.memoryType !== product.memoryType) delete nextSelected.ram
      }
      if (!removing && currentStep.key === 'cpu' && nextSelected.cooling?.coolingCapacity < product.powerDraw) delete nextSelected.cooling
      if (nextSelected.power && nextSelected.power.wattage < getPowerEstimate(nextSelected).recommendedWattage) delete nextSelected.power
      return nextSelected
    })
    setActiveAction({ id: Date.now(), kind: removing ? 'remove' : 'add', product, stepKey: currentStep.key })
  }
  const applyPreset = preset => {
    setSelected(preset.resolved); setActiveIndex(0); setActiveAction({ id: Date.now(), kind: 'preset' })
    window.requestAnimationFrame(() => document.querySelector('.builder-layout')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }))
  }
  const shareBuild = async () => {
    const url = new URL(window.location.href)
    const encoded = encodeBuild(selected)
    if (encoded) url.searchParams.set('build', encoded)
    else url.searchParams.delete('build')
    try { await navigator.clipboard.writeText(url.toString()); setShareStatus('Enlace copiado') }
    catch { window.prompt('Copia este enlace para compartir tu PC:', url.toString()) }
  }
  const next = () => goTo(Math.min(activeIndex + 1, builderSteps.length))
  const back = () => goTo(Math.max(0, activeIndex - 1))
  const reset = () => {
    setSelected({}); setActiveAction(null); setActiveIndex(0); setOptionQuery(''); setVisibleLimit(4); setShareStatus('')
    localStorage.removeItem(STORAGE_KEY)
    window.requestAnimationFrame(() => document.querySelector('.builder-layout')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }))
  }
  const progress = Math.round(((isSummary ? builderSteps.length : activeIndex + 1) / builderSteps.length) * 100)
  const hasSelection = builderSteps.some(step => selected[step.key])

  return <main className="pc-builder-page">
    <header className="builder-page-head container"><button type="button" className="builder-back" onClick={() => onNavigate('/')}>Volver a inicio</button><h1>Arma una PC que realmente encaje</h1><p>Empieza con una recomendación o construye la tuya. Puedes omitir, cambiar y volver a cualquier pieza.</p></header>
    <PresetSelector presets={presets} onApply={applyPreset}/>
    <div className="builder-layout container">
      <BuildStage selected={selected} totals={totals} activeAction={activeAction} onShare={shareBuild} shareStatus={shareStatus} onReset={reset}/>
      <section className="builder-config" aria-label="Configurador de PC" ref={configRef}>
        <div className="builder-mobile-progress"><button type="button" onClick={back} disabled={activeIndex === 0}>Atrás</button><div><span>{isSummary ? 'Revisión final' : `Paso ${activeIndex + 1} de ${builderSteps.length}`}</span><strong>{isSummary ? 'Resumen' : currentStep.label}</strong></div><b>{isSummary ? builderSteps.length : activeIndex + 1}/{builderSteps.length}</b><i><span style={{ transform: `scaleX(${progress / 100})` }}/></i></div>
        <nav className="builder-stepper" aria-label="Progreso del armado">
          {builderSteps.map((step, index) => { const done = Boolean(selected[step.key]); const current = index === activeIndex; return <button key={step.key} type="button" className={`${done ? 'done' : ''}${current ? ' current' : ''}`} onClick={() => goTo(index)} aria-current={current ? 'step' : undefined} aria-label={`${step.label}${done ? ', seleccionado' : ', pendiente'}`}><span>{index + 1}</span><small>{step.short}</small></button> })}
          <button type="button" className={isSummary ? 'current' : ''} onClick={() => goTo(builderSteps.length)}><span>{builderSteps.length + 1}</span><small>Resumen</small></button>
        </nav>
        <div className="builder-step-reset"><ResetControl onReset={reset} disabled={!hasSelection}/></div>
        <AnimatePresence mode="wait" initial={false}><motion.div ref={contentRef} className="builder-config-body" key={isSummary ? 'summary' : currentStep.key} initial={{ opacity: 0, x: reduceMotion ? 0 : 16, filter: reduceMotion ? 'none' : 'blur(3px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: reduceMotion ? 0 : -10, filter: reduceMotion ? 'none' : 'blur(2px)' }} transition={{ duration: .22, ease: [0.16, 1, 0.3, 1] }}>
          {isSummary ? <BuildSummary selected={selected} totals={totals} estimate={estimate} onEdit={goTo} onReset={reset} onAddBuild={onAddBuild}/> : <><div className="builder-step-heading"><span>Paso {activeIndex + 1} de {builderSteps.length}</span><h2>{currentStep.label}</h2><p>{currentStep.description}</p></div>
            {currentOptions.length > 4 && <div className="builder-option-tools"><label><span>Buscar en {currentStep.label.toLowerCase()}</span><input type="search" value={optionQuery} onChange={event => { setOptionQuery(event.target.value); setVisibleLimit(4) }} placeholder={`Buscar entre ${currentOptions.length} opciones`}/></label><div><small>{matchingOptions.length} modelos</small></div></div>}
            {visibleOptions.length ? <div className="builder-options" aria-label={`Opciones de ${currentStep.label}`}>{visibleOptions.map(option => <ComponentOption key={option.id} option={option} recommended={option.id === recommendedPowerId || option.recommended} insufficient={currentStep.key === 'power' && !power.incomplete && option.wattage < power.recommendedWattage} selected={selected[currentStep.key]?.id === option.id} onSelect={() => selectProduct(option)}/>)}</div> : <div className="builder-options-empty"><strong>No encontramos coincidencias</strong><p>Prueba con otra marca, modelo o capacidad.</p><button type="button" onClick={() => setOptionQuery('')}>Limpiar búsqueda</button></div>}
            {matchingOptions.length > visibleOptions.length && <button type="button" className="builder-load-more" onClick={() => setVisibleLimit(limit => limit + 6)}>Mostrar más ({matchingOptions.length - visibleOptions.length} restantes)</button>}
            <div className="builder-actions"><button type="button" className="button button-secondary" onClick={back} disabled={activeIndex === 0}>Atrás</button><button type="button" className="button button-primary" onClick={next}>{activeIndex === builderSteps.length - 1 ? 'Revisar PC' : 'Siguiente'}</button></div></>}
        </motion.div></AnimatePresence>
      </section>
    </div>
    <PerformanceEstimate estimate={estimate} selected={selected}/>
    <div className="builder-mobile-bar"><div className="builder-mobile-bar-details"><small>{totals.complete ? 'Total con descuento' : 'Subtotal'}</small><strong>{formatPrice(totals.finalTotal)}</strong><ResetControl onReset={reset} disabled={!hasSelection}/></div>{!isSummary && <button type="button" className="button button-primary" onClick={next}>{activeIndex === builderSteps.length - 1 ? 'Revisar' : 'Siguiente'}</button>}</div>
  </main>
}
