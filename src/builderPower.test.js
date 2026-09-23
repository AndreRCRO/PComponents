import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { products } from './catalog.js'
import { getPowerEstimate } from './builderPower.js'

const byId = id => products.find(product => product.id === id)
const categories = ['Gabinetes', 'Placas madre', 'Procesadores', 'Refrigeración', 'RAM', 'Tarjetas gráficas', 'SSD', 'Fuentes de poder']
const minimumCounts = [5, 6, 8, 5, 6, 8, 6, 6]
categories.forEach((category, index) => assert.ok(products.filter(product => product.category === category).length >= minimumCounts[index], category))
assert.equal(new Set(products.map(product => product.id)).size, products.length)
products.filter(product => categories.includes(product.category)).forEach(product => {
  assert.ok(existsSync(new URL(`../public${product.image}`, import.meta.url)), `Missing image: ${product.id}`)
})
assert.equal(new Set(products.filter(product => product.category === 'Gabinetes').map(product => product.image)).size, 5)

const selected = {
  case: byId('ccl-forge-airflow-xl'),
  motherboard: byId('ccl-b760-atx-wifi'),
  cpu: byId('intel-core-i9-14900k'),
  cooling: byId('corsair-h150i-360'),
  ram: byId('kingston-fury-ddr5-64gb'),
  gpu: byId('msi-rtx-4080-super'),
  storage: byId('samsung-990-pro-4tb'),
}
const power = getPowerEstimate(selected)
assert.equal(power.estimatedDraw, 35 + 253 + 320 + 55 + 14 + 9 + 18 + 14)
assert.equal(power.recommendedWattage, 1000)
assert.equal(power.incomplete, false)
assert.equal(getPowerEstimate({ ...selected, power: byId('ccl-power-850-gold') }).status, 'warning')
assert.equal(getPowerEstimate({ ...selected, power: byId('corsair-rm1000x') }).status, 'good')
assert.equal(getPowerEstimate({ case: selected.case, cpu: selected.cpu }).incomplete, true)
console.log('builder power checks passed')
