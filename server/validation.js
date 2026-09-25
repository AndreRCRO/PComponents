import { z } from 'zod'

const text = (max = 200) => z.string().trim().min(1).max(max)
const optionalText = (max = 2000) => z.string().trim().max(max).default('')
const imagePath = z.string().regex(/^\/(?:products\/[a-zA-Z0-9_-][a-zA-Z0-9._-]*\.(?:png|jpe?g|webp|avif)|media\/[a-f0-9-]{36}\.webp)$/).or(z.literal(''))
const positiveNumber = z.number().finite().min(0).max(1_000_000)
const optionalNumber = z.coerce.number().finite().min(0).max(1_000_000).optional()

export const categorySchema = z.object({ name: text(80) })

export const productSchema = z.object({
  name: text(180),
  brand: text(80),
  brands: z.array(text(80)).max(12).default([]),
  categoryId: text(100),
  description: text(500),
  longDescription: optionalText(4000),
  builderNote: optionalText(300),
  price: positiveNumber.int(),
  stock: z.number().int().min(0).max(1_000_000),
  active: z.boolean().default(false),
  image: imagePath.default(''),
  gallery: z.array(imagePath).max(12).default([]),
  specs: z.array(z.tuple([text(80), text(250)])).max(30).default([]),
  variants: z.array(z.object({ name: text(80), color: z.string().regex(/^#[0-9a-fA-F]{6}$/), image: imagePath.refine(Boolean, 'Selecciona una imagen') })).max(20).default([]),
  socket: optionalText(30),
  sockets: z.array(text(30)).max(20).default([]),
  memoryType: optionalText(30),
  formFactor: optionalText(30),
  formFactors: z.array(text(30)).max(20).default([]),
  maxCoolerHeight: optionalNumber,
  maxGpuLength: optionalNumber,
  maxRadiatorSize: optionalNumber,
  coolingCapacity: optionalNumber,
  coolerHeight: optionalNumber,
  radiatorSize: optionalNumber,
  length: optionalNumber,
  powerDraw: optionalNumber,
  recommendedWattage: optionalNumber,
  wattage: optionalNumber,
  capacity: optionalNumber,
  recommended: z.boolean().default(false),
  sales: z.coerce.number().int().min(0).max(1_000_000).default(0),
  newRank: z.coerce.number().int().min(0).max(1_000_000).default(0),
}).superRefine((product, context) => {
  if (product.active && !product.image) context.addIssue({ code: 'custom', path: ['image'], message: 'Un producto visible necesita una imagen principal.' })
  if (product.variants.some(variant => !variant.image)) context.addIssue({ code: 'custom', path: ['variants'], message: 'Cada variante necesita una imagen.' })
})

export function validationMessage(error) {
  return error.issues?.map(issue => `${issue.path.join('.') || 'Datos'}: ${issue.message}`).join(' · ') || 'Datos inválidos.'
}

const builderRequired = {
  gabinetes: ['formFactors', 'maxCoolerHeight', 'maxGpuLength', 'maxRadiatorSize'],
  'placas-madre': ['socket', 'memoryType', 'formFactor'],
  procesadores: ['socket', 'powerDraw'],
  refrigeracion: ['sockets', 'coolingCapacity'],
  ram: ['memoryType', 'capacity'],
  'tarjetas-graficas': ['powerDraw', 'length'],
  ssd: ['capacity'],
  'fuentes-de-poder': ['wattage'],
}

const builderFieldNames = {
  formFactors: 'tamaños de placa compatibles', maxCoolerHeight: 'altura máxima del disipador',
  maxGpuLength: 'largo máximo de tarjeta gráfica', maxRadiatorSize: 'tamaño máximo del radiador',
  socket: 'conector del procesador (socket)', memoryType: 'tipo de memoria RAM',
  formFactor: 'tamaño de la placa', powerDraw: 'consumo eléctrico', sockets: 'conectores compatibles',
  coolingCapacity: 'capacidad de disipación', capacity: 'capacidad', length: 'largo de la tarjeta',
  wattage: 'potencia de la fuente',
}

export function builderValidationMessage(product) {
  if (!product.active) return ''
  const missing = (builderRequired[product.categoryId] || []).filter(key => {
    const value = product[key]
    return value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
  })
  if (product.categoryId === 'refrigeracion' && !product.coolerHeight && !product.radiatorSize) missing.push('altura del disipador o tamaño del radiador')
  return missing.length ? `Completa los datos de compatibilidad antes de publicar: ${missing.map(key => builderFieldNames[key] || key).join(', ')}.` : ''
}
