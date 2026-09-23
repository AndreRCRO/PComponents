export function getPowerEstimate(selected) {
  const baseLoad = 35
  const componentRows = [
    ['CPU', selected.cpu?.powerDraw],
    ['GPU', selected.gpu?.powerDraw],
    ['Placa', selected.motherboard?.powerDraw],
    ['RAM', selected.ram?.powerDraw],
    ['SSD', selected.storage?.powerDraw],
    ['Cooler', selected.cooling?.powerDraw],
    ['Ventiladores', selected.case?.powerDraw],
  ].filter(([, watts]) => watts)
  const estimatedDraw = baseLoad + componentRows.reduce((sum, [, watts]) => sum + watts, 0)
  const calculated = Math.ceil((estimatedDraw * 1.35) / 50) * 50
  const recommendedWattage = Math.max(450, calculated, selected.gpu?.recommendedWattage || 0)
  const incomplete = !selected.cpu || !selected.gpu
  const selectedWattage = selected.power?.wattage || 0
  const status = !selected.power ? 'pending' : selectedWattage >= recommendedWattage ? 'good' : 'warning'
  return { componentRows, estimatedDraw, recommendedWattage, selectedWattage, status, incomplete, loadPercent: selectedWattage ? Math.round(estimatedDraw / selectedWattage * 100) : null }
}
