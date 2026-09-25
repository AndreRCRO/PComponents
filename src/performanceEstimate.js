// Proyección relativa basada en los índices de referencia del catálogo inicial.
// Si un producto nuevo no tiene un índice validado, no se inventan FPS.
const gameBaselines = [
  ['Fortnite', 126],
  ['Call of Duty: Warzone', 91],
  ['Cyberpunk 2077', 66],
  ['Valorant', 278],
]

export function getPerformanceEstimate({ cpu, gpu }) {
  const cpuFactor = cpu?.performanceFactor
  const gpuFactor = gpu?.performanceIndex
  if (!Number.isFinite(cpuFactor) || cpuFactor <= 0 || !Number.isFinite(gpuFactor) || gpuFactor <= 0) return null

  const resolution = gpuFactor >= 2 ? '4K' : gpuFactor >= 1.35 ? '1440p' : '1080p'
  const resolutionLoad = resolution === '4K' ? .56 : resolution === '1440p' ? .72 : 1
  const scale = cpuFactor * gpuFactor * resolutionLoad
  return {
    resolution: `${resolution} · calidad alta`,
    games: gameBaselines.map(([name, baseline]) => [name, Math.round(baseline * scale)]),
  }
}

export function getProductPerformance(product, products) {
  let cpu
  let gpu
  if (product.categoryId === 'tarjetas-graficas' || product.category === 'Tarjetas gráficas') {
    gpu = product
    cpu = products.find(item => item.id === 'amd-ryzen-7-7800x3d') || products.find(item => (item.categoryId === 'procesadores' || item.category === 'Procesadores') && Number.isFinite(item.performanceFactor))
  } else if (product.categoryId === 'procesadores' || product.category === 'Procesadores') {
    cpu = product
    gpu = products.find(item => item.id === 'asus-rtx-4060-dual') || products.find(item => (item.categoryId === 'tarjetas-graficas' || item.category === 'Tarjetas gráficas') && Number.isFinite(item.performanceIndex))
  } else return null

  const estimate = getPerformanceEstimate({ cpu, gpu })
  return estimate ? { ...estimate, system: `${cpu.name} + ${gpu.name} · 32GB RAM` } : null
}
