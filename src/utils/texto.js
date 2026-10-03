// Compara sin importar mayúsculas, espacios ni tildes ("Bogotá" === "bogota")
export const normalizar = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

export const capitalizar = (texto) => {
  const limpio = String(texto ?? '').trim()
  return limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1) : ''
}

export const iniciales = (nombre) => {
  if (!nombre) return '?'
  return String(nombre)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase()
}

export const plural = (cantidad, singular, pluralTexto = `${singular}s`) =>
  `${cantidad} ${Math.abs(cantidad) === 1 ? singular : pluralTexto}`

// ['macho', 'hembra'] → [{ valor: 'macho', etiqueta: 'Macho' }, ...]
export const aOpcionesFiltro = (lista, etiqueta = capitalizar) =>
  lista.map((valor) => ({ valor, etiqueta: etiqueta(valor) }))