import assert from 'node:assert/strict'
import { categories, filterProducts, products } from './catalog.js'

assert.equal(filterProducts(products, { query: 'RTX 4060' }).length, 2)
assert.ok(filterProducts(products, { maxPrice: 1000 }).every(product => product.price <= 1000))
assert.deepEqual(filterProducts(products, { sort: 'low' }).map(product => product.price), [...products].map(product => product.price).sort((a, b) => a - b))
assert.equal(new Set(products.find(product => product.id === 'logitech-g733').variants.map(variant => variant.image)).size, 4)
assert.ok(['Placas madre', 'Refrigeración', 'Fuentes de poder', 'Gabinetes'].every(category => categories.includes(category)))
assert.equal(products.find(product => product.id === 'ccl-b650-atx-wifi').socket, 'AM5')
assert.ok(products.find(product => product.id === 'ccl-power-750-gold').wattage >= products.find(product => product.id === 'msi-rtx-4070-ventus').recommendedWattage)
console.log('catalog checks passed')
