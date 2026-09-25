import { useEffect, useState } from 'react'
import { formatPrice } from '../catalog.js'

const emptyProduct = categoryId => ({
  name: '', brand: '', categoryId, description: '', longDescription: '', builderNote: '',
  price: '', stock: '', active: false, image: '', gallery: [], specs: [], variants: [],
  socket: '', sockets: [], memoryType: '', formFactor: '', formFactors: [], recommended: false,
  sales: 0, newRank: 0,
})

const socketHelp = 'Es el conector físico entre procesador y placa madre. Ambos deben indicar el mismo, por ejemplo AM5 o LGA1700.'
const memoryHelp = 'El tipo de RAM que acepta la placa o memoria. DDR4 y DDR5 no se pueden mezclar.'
const powerHelp = 'Se suma al consumo del equipo para recomendar una fuente de poder; en procesadores también ayuda a elegir el cooler.'

const compatibilityFields = {
  gabinetes: [
    { key: 'formFactors', label: 'Tamaños de placa que caben', kind: 'list', hint: 'Ej.: ATX, Micro-ATX. Sepáralos con comas.' },
    { key: 'maxCoolerHeight', label: 'Altura máxima del disipador (mm)' },
    { key: 'maxGpuLength', label: 'Largo máximo de tarjeta gráfica (mm)' },
    { key: 'maxRadiatorSize', label: 'Tamaño máximo de radiador (mm)' },
    { key: 'powerDraw', label: 'Consumo de ventiladores (W)', hint: powerHelp },
  ],
  'placas-madre': [
    { key: 'socket', label: 'Conector del procesador (socket)', hint: socketHelp },
    { key: 'memoryType', label: 'Tipo de memoria RAM', hint: memoryHelp },
    { key: 'formFactor', label: 'Tamaño de la placa', hint: 'Ej.: ATX o Micro-ATX. Debe caber en el gabinete.' },
    { key: 'powerDraw', label: 'Consumo eléctrico de la placa (W)', hint: powerHelp },
  ],
  procesadores: [
    { key: 'socket', label: 'Conector del procesador (socket)', hint: socketHelp },
    { key: 'powerDraw', label: 'Consumo eléctrico del procesador (W)', hint: powerHelp },
  ],
  refrigeracion: [
    { key: 'sockets', label: 'Conectores de procesador compatibles', kind: 'list', hint: `${socketHelp} Sepáralos con comas.` },
    { key: 'coolingCapacity', label: 'Capacidad de disipación (W)', hint: 'Debe cubrir el consumo del procesador seleccionado.' },
    { key: 'coolerHeight', label: 'Altura del disipador (mm)', hint: 'Solo para cooler de aire. Debe caber en el gabinete.' },
    { key: 'radiatorSize', label: 'Tamaño del radiador (mm)', hint: 'Solo para refrigeración líquida. Debe caber en el gabinete.' },
    { key: 'powerDraw', label: 'Consumo eléctrico del cooler (W)', hint: powerHelp },
  ],
  ram: [
    { key: 'memoryType', label: 'Tipo de memoria RAM', hint: memoryHelp },
    { key: 'capacity', label: 'Capacidad (GB)' },
    { key: 'powerDraw', label: 'Consumo eléctrico (W)', hint: powerHelp },
  ],
  'tarjetas-graficas': [
    { key: 'length', label: 'Largo de la tarjeta (mm)', hint: 'Se compara con el espacio disponible en el gabinete.' },
    { key: 'powerDraw', label: 'Consumo eléctrico de la tarjeta (W)', hint: powerHelp },
    { key: 'recommendedWattage', label: 'Fuente mínima sugerida por fabricante (W)', hint: 'Se compara con el cálculo de consumo del equipo.' },
  ],
  ssd: [
    { key: 'capacity', label: 'Capacidad (TB)' },
    { key: 'powerDraw', label: 'Consumo eléctrico (W)', hint: powerHelp },
  ],
  'fuentes-de-poder': [
    { key: 'wattage', label: 'Potencia de la fuente (W)', hint: 'Debe igualar o superar la recomendación del configurador.' },
  ],
}

function Field({ label, hint, children }) {
  return <label className="admin-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}

function MediaPicker({ label, value, onUpload, onClear, busy }) {
  return <div className="admin-media-picker">
    <span>{label}</span>
    {value ? <div className="admin-media-preview"><img src={value} alt="Vista previa"/><button type="button" onClick={onClear}>Quitar imagen</button></div> : <div className="admin-media-placeholder">Sin imagen seleccionada</div>}
    <label className="admin-upload-button">{busy ? 'Procesando…' : 'Subir imagen'}
      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={event => {
        const file = event.target.files?.[0]
        if (file) onUpload(file)
        event.target.value = ''
      }}/>
    </label>
  </div>
}

function CompatibilityInput({ field, product, update }) {
  const { key, label, kind, hint } = field
  const value = product[key]
  const [listText, setListText] = useState(() => (value || []).join(', '))
  let input
  if (kind === 'list') {
    input = <input value={listText} onChange={event => {
      setListText(event.target.value)
      update(key, event.target.value.split(',').map(item => item.trim()).filter(Boolean))
    }} placeholder="Ej.: AM5, LGA1700"/>
  } else if (['socket', 'memoryType', 'formFactor'].includes(key)) {
    input = <input value={value || ''} onChange={event => update(key, event.target.value)} placeholder={key === 'socket' ? 'Ej.: AM5' : undefined}/>
  } else {
    input = <input type="number" min="0" step="any" value={value ?? ''} onChange={event => update(key, event.target.value === '' ? undefined : Number(event.target.value))}/>
  }
  return <Field label={label} hint={hint}>{input}</Field>
}

export default function ProductEditor({ id, request, categories, go }) {
  const isNew = id === 'nuevo'
  const [product, setProduct] = useState(() => emptyProduct(categories[0]?.id || ''))
  const [brandsText, setBrandsText] = useState('')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isNew) return
    request(`/products/${id}`).then(data => {
      setProduct(data)
      setBrandsText((data.brands || []).filter(brand => brand !== data.brand).join(', '))
    }).catch(issue => setError(issue.message)).finally(() => setLoading(false))
  }, [id, isNew, request])
  useEffect(() => {
    if (isNew && !product.categoryId && categories[0]) setProduct(current => ({ ...current, categoryId: categories[0].id }))
  }, [categories, isNew, product.categoryId])

  const update = (key, value) => setProduct(current => ({ ...current, [key]: value }))
  const updateItem = (key, index, value) => setProduct(current => ({ ...current, [key]: current[key].map((item, itemIndex) => itemIndex === index ? value : item) }))
  const removeItem = (key, index) => setProduct(current => ({ ...current, [key]: current[key].filter((_, itemIndex) => itemIndex !== index) }))
  const upload = async (file, apply, key) => {
    setUploading(key)
    setError('')
    const form = new FormData()
    form.append('image', file)
    try {
      const result = await request('/media', { method: 'POST', body: form })
      apply(result.url)
    } catch (issue) { setError(issue.message) }
    finally { setUploading('') }
  }
  const save = async event => {
    event.preventDefault()
    setError('')
    if (product.price === '' || product.stock === '') {
      setError('Indica el precio y las unidades disponibles antes de guardar.')
      return
    }
    setSaving(true)
    const brands = brandsText.split(',').map(value => value.trim()).filter(Boolean)
    const payload = {
      ...product,
      price: Number(product.price),
      stock: Number(product.stock),
      brands: [...new Set([product.brand.trim(), ...brands])],
      gallery: product.gallery.filter(Boolean),
    }
    try {
      await request(isNew ? '/products' : `/products/${id}`, { method: isNew ? 'POST' : 'PUT', body: payload })
      go('/admin/productos')
    } catch (issue) { setError(issue.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="admin-loading">Cargando producto…</div>
  const builderFields = compatibilityFields[product.categoryId]
  return <section className="admin-page admin-editor">
    <div className="admin-page-heading"><div><button className="admin-text-back" type="button" onClick={() => go('/admin/productos')}>← Volver a productos</button><h1>{isNew ? 'Nuevo producto' : 'Editar producto'}</h1><p>{isNew ? 'Guárdalo como borrador y publícalo cuando esté listo.' : product.name}</p></div><div className="admin-editor-total"><span>Precio</span><strong>{product.price === '' ? 'Sin definir' : formatPrice(Number(product.price))}</strong></div></div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <form onSubmit={save} className="admin-editor-form">
      <div className="admin-editor-main">
        <section className="admin-panel admin-form-section"><h2>Información principal</h2>
          <div className="admin-form-grid">
            <Field label="Nombre del producto"><input required maxLength="180" value={product.name} onChange={event => update('name', event.target.value)}/></Field>
            <Field label="Marca"><input required maxLength="80" value={product.brand} onChange={event => update('brand', event.target.value)}/></Field>
            <Field label="Categoría"><select required value={product.categoryId} onChange={event => update('categoryId', event.target.value)}><option value="">Selecciona una categoría</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
            <Field label="Otras marcas para filtros" hint="Opcional. Separa marcas con comas; por ejemplo, ASUS, NVIDIA."><input value={brandsText} onChange={event => setBrandsText(event.target.value)}/></Field>
            <Field label="Precio de venta (Bs)" hint="Importe final en bolivianos, sin escribir «Bs». Ejemplo: 2990."><input type="number" min="0" step="1" required value={product.price} onChange={event => update('price', event.target.value)}/></Field>
            <Field label="Unidades disponibles"><input type="number" min="0" step="1" required value={product.stock} onChange={event => update('stock', event.target.value)}/></Field>
          </div>
          <Field label="Resumen para catálogo" hint="Una o dos frases. Aparece en las tarjetas y junto al precio en la página del producto."><textarea required rows="3" maxLength="500" value={product.description} onChange={event => update('description', event.target.value)}/></Field>
          <Field label="Descripción ampliada (opcional)" hint="Aparece más abajo en la página del producto. Si la dejas vacía, se mostrará el resumen del catálogo."><textarea rows="5" maxLength="4000" value={product.longDescription || ''} onChange={event => update('longDescription', event.target.value)}/></Field>
        </section>

        <section className="admin-panel admin-form-section"><div className="admin-section-heading"><div><h2>Imágenes</h2><p>La principal aparece en el catálogo. JPEG, PNG, WebP o AVIF, hasta 5 MB.</p></div></div>
          <MediaPicker label="Imagen principal" value={product.image} busy={uploading === 'main'} onUpload={file => upload(file, url => update('image', url), 'main')} onClear={() => update('image', '')}/>
          <div className="admin-gallery"><h3>Galería adicional</h3><div className="admin-gallery-items">{product.gallery?.map((image, index) => <div key={`${image}-${index}`}><img src={image} alt={`Galería ${index + 1}`}/><button type="button" onClick={() => removeItem('gallery', index)}>Quitar</button></div>)}</div><label className="admin-upload-button">{uploading === 'gallery' ? 'Procesando…' : 'Añadir foto'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={Boolean(uploading)} onChange={event => { const file = event.target.files?.[0]; if (file) upload(file, url => setProduct(current => ({ ...current, gallery: [...(current.gallery || []), url] })), 'gallery'); event.target.value = '' }}/></label></div>
        </section>

        <section className="admin-panel admin-form-section"><div className="admin-section-heading"><div><h2>Ficha técnica</h2><p>Cada fila es una característica y su valor. Se verá en la página del producto; las primeras dos también aparecen en las tarjetas.</p></div><button type="button" onClick={() => update('specs', [...product.specs, ['', '']])}>Añadir característica</button></div>
          {product.specs.length > 0 && <div className="admin-spec-headers" aria-hidden="true"><span>Característica</span><span>Valor</span></div>}
          <div className="admin-repeater">{product.specs.map(([label, value], index) => <div key={index}><input required aria-label={`Característica ${index + 1}`} placeholder="Ej.: Memoria" value={label} onChange={event => updateItem('specs', index, [event.target.value, value])}/><input required aria-label={`Valor de ${label || `característica ${index + 1}`}`} placeholder="Ej.: 8 GB GDDR6" value={value} onChange={event => updateItem('specs', index, [label, event.target.value])}/><button type="button" onClick={() => removeItem('specs', index)}>Quitar</button></div>)}</div>
          {!product.specs.length && <p className="admin-empty-hint">Ejemplo: «Memoria» → «8 GB GDDR6». Puedes dejar esta sección vacía.</p>}
        </section>

        <section className="admin-panel admin-form-section"><div className="admin-section-heading"><div><h2>Colores y variantes</h2><p>Si el mismo modelo viene en varios colores, añade el nombre y una foto para cada uno.</p></div><button type="button" onClick={() => update('variants', [...product.variants, { name: '', color: '#1a1f17', image: '' }])}>Añadir color</button></div>
          <div className="admin-variants">{product.variants.map((variant, index) => <div key={index}><Field label={`Nombre del color ${index + 1}`}><input required placeholder="Ej.: Blanco" value={variant.name} onChange={event => updateItem('variants', index, { ...variant, name: event.target.value })}/></Field><Field label="Muestra"><input type="color" value={variant.color} onChange={event => updateItem('variants', index, { ...variant, color: event.target.value })}/></Field><MediaPicker label="Foto del color" value={variant.image} busy={uploading === `variant-${index}`} onUpload={file => upload(file, url => updateItem('variants', index, { ...variant, image: url }), `variant-${index}`)} onClear={() => updateItem('variants', index, { ...variant, image: '' })}/><button type="button" className="admin-remove-line" onClick={() => removeItem('variants', index)}>Quitar color</button></div>)}</div>
        </section>

        {builderFields && <section className="admin-panel admin-form-section"><h2>Compatibilidad con «Arma tu PC»</h2><p className="admin-section-help">Estos datos evitan combinaciones que no encajan y permiten calcular la potencia necesaria de la fuente. Los FPS se proyectan automáticamente cuando CPU y GPU tienen datos de referencia; si faltan, la proyección no se muestra.</p>
          <div className="admin-form-grid"><Field label="Nota breve para el configurador" hint="Una descripción sencilla de esta pieza durante el armado."><input value={product.builderNote || ''} onChange={event => update('builderNote', event.target.value)} maxLength="300"/></Field>{builderFields.map(field => <CompatibilityInput key={`${product.id || 'nuevo'}-${field.key}`} field={field} product={product} update={update}/>)}</div>
          <label className="admin-check"><input type="checkbox" checked={Boolean(product.recommended)} onChange={event => update('recommended', event.target.checked)}/>Destacar como recomendación en el configurador</label>
        </section>}
      </div>

      <aside className="admin-editor-side"><div className="admin-panel admin-publish"><h2>Publicación</h2><label className="admin-check"><input type="checkbox" checked={Boolean(product.active)} onChange={event => update('active', event.target.checked)}/>Visible en la tienda</label><p>{product.active ? 'Aparecerá en catálogo, búsqueda y, si corresponde, Arma tu PC.' : 'Quedará guardado como borrador, sin mostrarse al público.'}</p>{product.active && !product.image && <p className="admin-warning">Añade una imagen principal antes de publicar.</p>}<button className="button button-primary" type="submit" disabled={saving || Boolean(uploading) || !categories.length}>{saving ? 'Guardando…' : isNew ? 'Crear producto' : 'Guardar cambios'}</button><button className="admin-cancel" type="button" onClick={() => go('/admin/productos')}>Cancelar</button></div></aside>
    </form>
  </section>
}
