import { expandedBuilderProducts } from './builderInventory.js'

export const products = [
  {
    id: 'asus-rtx-4060-dual', brand: 'ASUS', brands: ['ASUS', 'NVIDIA'], category: 'Tarjetas gráficas',
    name: 'ASUS GeForce RTX 4060 Dual 8GB', description: 'Gráficos fluidos en 1080p con DLSS 3 y refrigeración de doble ventilador.',
    price: 2990, stock: 7, sales: 98, newRank: 8, image: '/products/asus-rtx4060.webp', recommendedWattage: 550, powerDraw: 115, performanceIndex: 1, length: 227,
    gallery: ['/products/asus-rtx4060.webp', '/products/asus-rtx4060-front.webp', '/products/asus-rtx4060-box.webp'],
    specs: [['Memoria', '8GB GDDR6'], ['Interfaz', 'PCI Express 4.0'], ['Resolución máxima', '7680 × 4320'], ['Refrigeración', 'Dual Fan Axial-tech']],
    longDescription: 'La ASUS Dual GeForce RTX 4060 combina la arquitectura NVIDIA Ada Lovelace con un diseño compacto de 2.5 ranuras. Es una opción equilibrada para jugar en 1080p con alta calidad, acelerar tareas creativas y mantener temperaturas controladas con bajo nivel de ruido.'
  },
  {
    id: 'msi-rtx-4070-ventus', brand: 'MSI', brands: ['MSI', 'NVIDIA'], category: 'Tarjetas gráficas',
    name: 'MSI GeForce RTX 4070 Ventus 2X 12GB', description: 'Rendimiento para 1440p, 12GB GDDR6X y sistema térmico TORX FAN 4.0.',
    price: 5190, stock: 3, sales: 74, newRank: 9, image: '/products/msi-rtx4070.png', recommendedWattage: 650, powerDraw: 200, performanceIndex: 1.45, length: 242,
    specs: [['Memoria', '12GB GDDR6X'], ['Interfaz', 'PCI Express 4.0'], ['Resolución máxima', '7680 × 4320'], ['Refrigeración', 'TORX FAN 4.0']],
    longDescription: 'Diseñada para jugar en 1440p y crear contenido con aceleración por GPU. Su sistema de doble ventilador concentra el flujo de aire sobre el disipador y mantiene un formato compatible con una amplia variedad de gabinetes.'
  },
  {
    id: 'amd-ryzen-7-7800x3d', brand: 'AMD', brands: ['AMD'], category: 'Procesadores',
    name: 'AMD Ryzen 7 7800X3D', description: '8 núcleos, 16 hilos y 96MB de caché L3 con tecnología 3D V-Cache.',
    price: 3200, stock: 5, sales: 93, newRank: 7, image: '/products/amd-ryzen7.jpg', socket: 'AM5', memoryType: 'DDR5', powerDraw: 120, performanceFactor: 1.08,
    specs: [['Núcleos / hilos', '8 / 16'], ['Frecuencia máxima', 'Hasta 5.0 GHz'], ['Socket', 'AM5'], ['Caché L3', '96MB']],
    longDescription: 'Un procesador orientado a gaming de alto rendimiento que aprovecha la memoria caché 3D V-Cache para reducir latencias. Su plataforma AM5 ofrece soporte para memoria DDR5 y una ruta de actualización moderna.'
  },
  {
    id: 'intel-core-i7-14700k', brand: 'Intel', brands: ['Intel'], category: 'Procesadores',
    name: 'Intel Core i7-14700K', description: '20 núcleos híbridos, 28 hilos y frecuencia turbo de hasta 5.6 GHz.',
    price: 3550, stock: 4, sales: 81, newRank: 10, image: '/products/intel-i7.jpg', socket: 'LGA1700', memoryType: 'DDR5', powerDraw: 253, performanceFactor: 1.03,
    specs: [['Núcleos / hilos', '20 / 28'], ['Frecuencia máxima', 'Hasta 5.6 GHz'], ['Socket', 'LGA1700'], ['Caché inteligente', '33MB']],
    longDescription: 'Procesador desbloqueado de 14.ª generación para equipos de alto rendimiento. Su arquitectura híbrida distribuye juegos y cargas productivas entre núcleos de rendimiento y eficiencia.'
  },
  {
    id: 'kingston-fury-ddr5-32gb', brand: 'Kingston', brands: ['Kingston'], category: 'RAM',
    name: 'Kingston Fury Beast DDR5 32GB', description: 'Kit 2×16GB a 6000MT/s con perfiles AMD EXPO e Intel XMP.',
    price: 850, stock: 12, sales: 88, newRank: 6, image: '/products/kingston-fury.png', memoryType: 'DDR5', capacity: 32, powerDraw: 9,
    specs: [['Capacidad', '32GB (2×16GB)'], ['Velocidad', '6000MT/s'], ['Latencia', 'CL36'], ['Formato', 'DDR5 DIMM']],
    longDescription: 'Memoria de alto rendimiento para plataformas de nueva generación. Sus perfiles preconfigurados facilitan alcanzar velocidades optimizadas sin ajustes manuales complejos.'
  },
  {
    id: 'samsung-990-pro-2tb', brand: 'Samsung', brands: ['Samsung'], category: 'SSD',
    name: 'Samsung 990 PRO NVMe 2TB', description: 'SSD PCIe 4.0 de alto rendimiento con lectura secuencial de hasta 7,450 MB/s.',
    price: 1280, stock: 9, sales: 86, newRank: 5, image: '/products/samsung-990pro.png', capacity: 2, powerDraw: 8,
    specs: [['Capacidad', '2TB'], ['Interfaz', 'PCIe 4.0 ×4, NVMe 2.0'], ['Lectura', 'Hasta 7,450 MB/s'], ['Formato', 'M.2 2280']],
    longDescription: 'Almacenamiento rápido para sistemas operativos, aplicaciones exigentes y bibliotecas de juegos. Su controlador optimiza rendimiento y eficiencia térmica durante cargas sostenidas.'
  },
  {
    id: 'logitech-g502-x', brand: 'Logitech', brands: ['Logitech'], category: 'Periféricos',
    name: 'Logitech G502 X', description: 'Mouse de 89 gramos con sensor HERO 25K y switches híbridos LIGHTFORCE.',
    price: 520, stock: 11, sales: 79, newRank: 4, image: '/products/logitech-g502x.png',
    specs: [['Sensor', 'HERO 25K'], ['Resolución', '100-25,600 DPI'], ['Peso', '89 g'], ['Conexión', 'USB cableado']],
    longDescription: 'Una evolución ligera del diseño G502 con controles programables, rueda de doble modo y precisión sin suavizado. Adecuado para juegos y flujos de trabajo que requieren múltiples accesos rápidos.'
  },
  {
    id: 'logitech-g733', brand: 'Logitech', brands: ['Logitech'], category: 'Periféricos',
    name: 'Logitech G733 LIGHTSPEED', description: 'Auriculares inalámbricos ultraligeros con sonido PRO-G y LIGHTSYNC RGB.',
    price: 1090, stock: 8, sales: 91, newRank: 11, image: '/products/logitech-g733-black.webp',
    variants: [
      { name: 'Negro', color: '#17191d', image: '/products/logitech-g733-black.webp' },
      { name: 'Blanco', color: '#f0f1f4', image: '/products/logitech-g733-white.webp' },
      { name: 'Azul', color: '#1687c8', image: '/products/logitech-g733-blue.webp' },
      { name: 'Lila', color: '#a8a6e8', image: '/products/logitech-g733-lilac.webp' },
    ],
    specs: [['Drivers', 'PRO-G de 40 mm'], ['Conexión', 'LIGHTSPEED inalámbrica'], ['Autonomía', 'Hasta 29 horas'], ['Peso', '278 g']],
    longDescription: 'Auriculares inalámbricos diseñados para jugar con libertad y comodidad. Integran sonido envolvente, micrófono desmontable con filtros de voz y una iluminación configurable desde Logitech G HUB.'
  },
  {
    id: 'corsair-k70-core', brand: 'Corsair', brands: ['Corsair'], category: 'Periféricos',
    name: 'Corsair K70 Core RGB', description: 'Teclado mecánico con switches MLX Red, control multimedia y reposamuñecas.',
    price: 790, stock: 6, sales: 69, newRank: 3, image: '/products/corsair-k70.webp',
    specs: [['Switches', 'Corsair MLX Red'], ['Formato', 'Tamaño completo'], ['Conexión', 'USB cableado'], ['Iluminación', 'RGB por tecla']],
    longDescription: 'Teclado mecánico de tamaño completo con pulsación lineal y controles multimedia directos. Su estructura sólida y el reposamuñecas ofrecen comodidad para sesiones prolongadas.'
  },
  {
    id: 'asus-tuf-vg27aq1a', brand: 'ASUS', brands: ['ASUS'], category: 'Monitores',
    name: 'ASUS TUF Gaming VG27AQ1A 27”', description: 'Monitor QHD IPS de 27 pulgadas, 170Hz, 1ms y compatibilidad G-SYNC.',
    price: 2450, stock: 4, sales: 77, newRank: 2, image: '/products/asus-vg27.webp',
    specs: [['Panel', '27” IPS QHD'], ['Resolución', '2560 × 1440'], ['Frecuencia', 'Hasta 170Hz'], ['Respuesta', '1ms MPRT']],
    longDescription: 'Monitor QHD con alta frecuencia de actualización para juegos fluidos y trabajo visual detallado. El panel IPS ofrece amplios ángulos de visión y compatibilidad con sincronización adaptativa.'
  },
  {
    id: 'ccl-b650-atx-wifi', brand: 'CCL', brands: ['CCL', 'AMD'], category: 'Placas madre',
    name: 'CCL B650 ATX WiFi', description: 'Placa ATX para Ryzen serie 7000 con DDR5, PCIe 4.0 y conectividad WiFi 6.',
    price: 1650, stock: 6, sales: 72, newRank: 12, image: '/products/ccl-motherboard-v2.webp', socket: 'AM5', memoryType: 'DDR5', formFactor: 'ATX', powerDraw: 55,
    specs: [['Socket', 'AM5'], ['Memoria', 'DDR5'], ['Formato', 'ATX'], ['Conectividad', 'WiFi 6 y 2.5GbE']],
    longDescription: 'Una base equilibrada para procesadores AMD Ryzen de plataforma AM5, con cuatro ranuras DDR5 y expansión suficiente para una PC gamer actual.'
  },
  {
    id: 'ccl-b760-atx-wifi', brand: 'CCL', brands: ['CCL', 'Intel'], category: 'Placas madre',
    name: 'CCL B760 ATX WiFi', description: 'Placa ATX para Intel LGA1700 con DDR5, PCIe 4.0 y conectividad WiFi 6.',
    price: 1490, stock: 5, sales: 67, newRank: 13, image: '/products/ccl-motherboard-v2.webp', socket: 'LGA1700', memoryType: 'DDR5', formFactor: 'ATX', powerDraw: 55,
    specs: [['Socket', 'LGA1700'], ['Memoria', 'DDR5'], ['Formato', 'ATX'], ['Conectividad', 'WiFi 6 y 2.5GbE']],
    longDescription: 'Plataforma estable para procesadores Intel de 12.ª a 14.ª generación, con memoria DDR5 y conectividad moderna para gaming y productividad.'
  },
  {
    id: 'ccl-airflow-220', brand: 'CCL', brands: ['CCL'], category: 'Refrigeración',
    name: 'CCL Airflow 220', description: 'Disipador de torre con seis heatpipes y ventilador PWM silencioso de 120 mm.',
    price: 520, stock: 9, sales: 58, newRank: 14, image: '/products/ccl-cooler-v2.webp', sockets: ['AM5', 'LGA1700'], coolingCapacity: 220, coolerHeight: 158, powerDraw: 5,
    specs: [['Tipo', 'Aire de torre'], ['Ventilador', '120 mm PWM'], ['Compatibilidad', 'AM5 / LGA1700'], ['Altura', '158 mm']],
    longDescription: 'Refrigeración por aire para procesadores gamer y de productividad, con montaje compatible con las dos plataformas disponibles en el configurador.'
  },
  {
    id: 'ccl-airflow-260', brand: 'CCL', brands: ['CCL'], category: 'Refrigeración',
    name: 'CCL Airflow 260 Dual', description: 'Disipador de doble torre con dos ventiladores PWM para cargas sostenidas.',
    price: 790, stock: 4, sales: 51, newRank: 15, image: '/products/ccl-cooler-v2.webp', sockets: ['AM5', 'LGA1700'], coolingCapacity: 260, coolerHeight: 160, powerDraw: 7,
    specs: [['Tipo', 'Aire de doble torre'], ['Ventiladores', '2 × 120 mm PWM'], ['Compatibilidad', 'AM5 / LGA1700'], ['Altura', '160 mm']],
    longDescription: 'Solución de mayor capacidad térmica para procesadores exigentes, pensada para mantener frecuencias estables durante juego y creación de contenido.'
  },
  {
    id: 'ccl-power-750-gold', brand: 'CCL', brands: ['CCL'], category: 'Fuentes de poder',
    name: 'CCL Power 750W Gold', description: 'Fuente modular de 750W con certificación 80 Plus Gold y conector PCIe 5.0.',
    price: 890, stock: 8, sales: 64, newRank: 16, image: '/products/ccl-psu-v2.webp', wattage: 750,
    specs: [['Potencia', '750W'], ['Certificación', '80 Plus Gold'], ['Cableado', 'Modular'], ['Protecciones', 'OVP / OCP / SCP']],
    longDescription: 'Fuente eficiente y modular con margen para configuraciones gamer de gama media y alta, cableado ordenado y protecciones eléctricas integradas.'
  },
  {
    id: 'ccl-power-850-gold', brand: 'CCL', brands: ['CCL'], category: 'Fuentes de poder',
    name: 'CCL Power 850W Gold', description: 'Fuente modular de 850W con certificación 80 Plus Gold y margen para futuras mejoras.',
    price: 1050, stock: 7, sales: 61, newRank: 17, image: '/products/ccl-psu-v2.webp', wattage: 850,
    specs: [['Potencia', '850W'], ['Certificación', '80 Plus Gold'], ['Cableado', 'Modular'], ['Protecciones', 'OVP / OCP / SCP']],
    longDescription: 'Una fuente con reserva de potencia para tarjetas gráficas exigentes y futuras ampliaciones, sin sacrificar eficiencia ni orden interno.'
  },
  {
    id: 'ccl-forge-airflow', brand: 'CCL', brands: ['CCL'], category: 'Gabinetes',
    name: 'CCL Forge Airflow', description: 'Gabinete ATX con frontal ventilado, vidrio templado y cuatro ventiladores incluidos.',
    price: 980, stock: 6, sales: 62, newRank: 18, image: '/products/ccl-case-v2.webp', formFactors: ['ATX', 'Micro-ATX'], maxCoolerHeight: 165, maxGpuLength: 360, maxRadiatorSize: 240, powerDraw: 10,
    specs: [['Formato', 'ATX Mid Tower'], ['Ventiladores', '4 × 120 mm incluidos'], ['GPU máxima', 'Hasta 360 mm'], ['Panel', 'Vidrio templado']],
    longDescription: 'Gabinete de flujo de aire directo con espacio para componentes de tamaño completo y gestión de cables posterior.'
  },
  {
    id: 'ccl-forge-airflow-xl', brand: 'CCL', brands: ['CCL'], category: 'Gabinetes',
    name: 'CCL Forge Airflow XL', description: 'Gabinete ATX amplio con siete posiciones de ventilador y gran espacio interior.',
    price: 1250, stock: 4, sales: 55, newRank: 19, image: '/products/ccl-case-xl-v2.webp', formFactors: ['E-ATX', 'ATX', 'Micro-ATX'], maxCoolerHeight: 180, maxGpuLength: 400, maxRadiatorSize: 360, powerDraw: 14,
    specs: [['Formato', 'ATX Mid Tower XL'], ['Ventiladores', '4 × 140 mm incluidos'], ['GPU máxima', 'Hasta 400 mm'], ['Panel', 'Vidrio templado']],
    longDescription: 'Chasis amplio para equipos de alto rendimiento, refrigeración de gran tamaño y una ruta de actualización cómoda.'
  },
  ...expandedBuilderProducts,
]

export const categories = ['Procesadores', 'Placas madre', 'Refrigeración', 'RAM', 'Tarjetas gráficas', 'SSD', 'Fuentes de poder', 'Gabinetes', 'Monitores', 'Periféricos']
export const brands = ['ASUS', 'MSI', 'AMD', 'Intel', 'NVIDIA', 'Kingston', 'Samsung', 'Logitech', 'Corsair', 'CCL', 'NZXT', 'Lian Li', 'Gigabyte', 'G.Skill', 'DeepCool', 'Noctua', 'Sapphire', 'PowerColor', 'Crucial', 'Western Digital', 'Seasonic', 'be quiet!']

export function filterProducts(list, { query = '', categories: selectedCategories = [], brands: selectedBrands = [], maxPrice = Infinity, sort = 'popular' }) {
  const term = query.trim().toLowerCase()
  const filtered = list.filter(product => {
    const matchesQuery = !term || `${product.brand} ${product.name} ${product.category} ${product.description}`.toLowerCase().includes(term)
    return matchesQuery
      && (!selectedCategories.length || selectedCategories.includes(product.category))
      && (!selectedBrands.length || selectedBrands.some(brand => (product.brands?.length ? product.brands : [product.brand]).includes(brand)))
      && product.price <= maxPrice
  })

  return [...filtered].sort((a, b) => ({
    low: a.price - b.price,
    high: b.price - a.price,
    new: b.newRank - a.newRank,
    popular: b.sales - a.sales,
  })[sort] ?? b.sales - a.sales)
}

export const formatPrice = value => `Bs ${new Intl.NumberFormat('es-BO').format(value)}`
