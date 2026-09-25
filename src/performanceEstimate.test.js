import assert from 'node:assert/strict'
import { products } from './catalog.js'
import { getPerformanceEstimate, getProductPerformance } from './performanceEstimate.js'

const cpu = products.find(product => product.id === 'amd-ryzen-7-7800x3d')
const gpu = products.find(product => product.id === 'asus-rtx-4060-dual')
const strongerGpu = products.find(product => product.id === 'msi-rtx-4070-ventus')

const estimate = getPerformanceEstimate({ cpu, gpu })
assert.equal(estimate.games.length, 4)
assert.equal(estimate.resolution, '1080p · calidad alta')
assert.ok(getPerformanceEstimate({ cpu, gpu: strongerGpu }).games[0][1] > estimate.games[0][1])
assert.equal(getPerformanceEstimate({ cpu, gpu: { ...gpu, performanceIndex: undefined } }), null)
assert.equal(getProductPerformance(gpu, products).system, `${cpu.name} + ${gpu.name} · 32GB RAM`)
assert.equal(getProductPerformance({ ...gpu, performanceIndex: undefined }, products), null)
assert.equal(getProductPerformance(products.find(product => product.category === 'RAM'), products), null)
console.log('performance estimate checks passed')
