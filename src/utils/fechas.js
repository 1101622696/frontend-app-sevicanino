import { plural } from './texto'

// ─────────────────────────────────────────────────────────────
// Regla del proyecto:
//   - Se GUARDA como 'YYYY-MM-DD'   (usar MASK_FECHA en todos los q-date)
//   - Se MUESTRA como 'DD/MM/YYYY'  (formatearFecha)
// ─────────────────────────────────────────────────────────────

export const MASK_FECHA = 'YYYY-MM-DD'
const ZONA_HORARIA = 'America/Bogota'
const MS_DIA = 24 * 60 * 60 * 1000

/** Hoy en Colombia: 'YYYY-MM-DD' */
export const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: ZONA_HORARIA })

/** Acepta 'YYYY-MM-DD', 'YYYY/MM/DD' y 'MM-DD-YYYY' (datos viejos). Devuelve 'YYYY-MM-DD' o '' */
export const normalizarFecha = (fecha) => {
  if (!fecha) return ''
  const texto = String(fecha).trim().replace(/\//g, '-')

  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10)

  const legado = texto.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (legado) return `${legado[3]}-${legado[1]}-${legado[2]}`

  return ''
}

const aUTC = (iso) => {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return Date.UTC(anio, mes - 1, dia)
}

/** 'YYYY-MM-DD' → 'DD/MM/YYYY' */
export const formatearFecha = (fecha, vacio = '—') => {
  const iso = normalizarFecha(fecha)
  if (!iso) return fecha || vacio
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
}

/** Días desde hoy hasta la fecha (negativo si ya pasó). null si no hay fecha válida */
export const diasHasta = (fecha) => {
  const iso = normalizarFecha(fecha)
  if (!iso) return null
  return Math.round((aUTC(iso) - aUTC(hoy())) / MS_DIA)
}

/** Para ordenar. Las fechas vacías quedan al final en orden descendente */
export const compararFechas = (a, b) => normalizarFecha(a).localeCompare(normalizarFecha(b))

/**
 * Suma meses a 'YYYY-MM-DD'. Si el día no existe en el mes destino (31 → junio),
 * usa el último día de ese mes. Misma lógica que el backend.
 */
export const sumarMeses = (fecha, meses) => {
  const iso = normalizarFecha(fecha)
  if (!iso) return ''
  const [anio, mes, dia] = iso.split('-').map(Number)
  const resultado = new Date(Date.UTC(anio, mes - 1 + meses, dia))
  if (resultado.getUTCDate() !== dia) resultado.setUTCDate(0)
  return resultado.toISOString().slice(0, 10)
}

/** Meses completos entre dos fechas (para repetir el intervalo de un refuerzo) */
export const mesesEntre = (desde, hasta) => {
  const a = normalizarFecha(desde)
  const b = normalizarFecha(hasta)
  if (!a || !b) return 0
  const [anioA, mesA] = a.split('-').map(Number)
  const [anioB, mesB] = b.split('-').map(Number)
  return (anioB - anioA) * 12 + (mesB - mesA)
}

/** Edad legible a partir de la fecha de nacimiento: '3 años, 2 meses' */
export const calcularEdad = (fechaNacimiento) => {
  const iso = normalizarFecha(fechaNacimiento)
  if (!iso) return '—'

  const [anioN, mesN, diaN] = iso.split('-').map(Number)
  const [anioH, mesH, diaH] = hoy().split('-').map(Number)

  let meses = (anioH - anioN) * 12 + (mesH - mesN)
  if (diaH < diaN) meses -= 1
  if (meses < 0) return '—'

  const anios = Math.floor(meses / 12)
  const resto = meses % 12

  if (anios === 0) return plural(resto, 'mes', 'meses')
  if (resto === 0) return plural(anios, 'año')
  return `${plural(anios, 'año')}, ${plural(resto, 'mes', 'meses')}`
}

// ─────────────────────────────────────────────────────────────
// Estados para badges
// ─────────────────────────────────────────────────────────────

export const ESTADOS_VENCIMIENTO = {
  VENCIDO: 'vencido',
  PROXIMO: 'proximo',
  VIGENTE: 'vigente',
  REEMPLAZADO: 'reemplazado',
  SIN_FECHA: 'sin_fecha',
}

/**
 * Estado de una fecha límite (refuerzo de vacuna, próximo aseo, vencimiento de certificado).
 * reemplazado = existe un registro más reciente del mismo grupo, así que este ya no genera alerta.
 */
export const estadoVencimiento = (fecha, { diasAviso = 30, reemplazado = false } = {}) => {
  if (reemplazado) {
    return {
      estado: ESTADOS_VENCIMIENTO.REEMPLAZADO,
      etiqueta: 'Histórico',
      color: 'grey-3',
      textColor: 'grey-7',
      dias: null,
    }
  }

  const dias = diasHasta(fecha)

  if (dias === null) {
    return { estado: ESTADOS_VENCIMIENTO.SIN_FECHA, etiqueta: 'Sin fecha', color: 'grey-3', textColor: 'grey-7', dias }
  }
  if (dias < 0) {
    return {
      estado: ESTADOS_VENCIMIENTO.VENCIDO,
      etiqueta: `Vencido hace ${plural(-dias, 'día')}`,
      color: 'red-1',
      textColor: 'red-9',
      dias,
    }
  }
  if (dias <= diasAviso) {
    return {
      estado: ESTADOS_VENCIMIENTO.PROXIMO,
      etiqueta: dias === 0 ? 'Vence hoy' : `Vence en ${plural(dias, 'día')}`,
      color: 'orange-1',
      textColor: 'orange-9',
      dias,
    }
  }
  return { estado: ESTADOS_VENCIMIENTO.VIGENTE, etiqueta: 'Al día', color: 'green-1', textColor: 'green-9', dias }
}

export const ESTADOS_TRATAMIENTO = {
  PROGRAMADO: 'programado',
  EN_CURSO: 'en_curso',
  FINALIZADO: 'finalizado',
}

/** Sin fecha de fin = sigue en curso */
export const estadoTratamiento = (fechaInicio, fechaFin) => {
  const inicio = diasHasta(fechaInicio)
  const fin = diasHasta(fechaFin)

  if (inicio !== null && inicio > 0) {
    return { estado: ESTADOS_TRATAMIENTO.PROGRAMADO, etiqueta: 'Programado', color: 'blue-1', textColor: 'blue-9' }
  }
  if (fin !== null && fin < 0) {
    return { estado: ESTADOS_TRATAMIENTO.FINALIZADO, etiqueta: 'Finalizado', color: 'grey-3', textColor: 'grey-7' }
  }
  return { estado: ESTADOS_TRATAMIENTO.EN_CURSO, etiqueta: 'En curso', color: 'green-1', textColor: 'green-9' }
}

/**
 * Marca con _reemplazado = true los registros que tienen otro más reciente en su mismo grupo.
 * Ej.: vacunación agrupada por canino + vacuna → solo el último refuerzo genera alerta.
 *      chequeos agrupados por ciudad          → solo el último aseo genera alerta.
 */
export const marcarReemplazados = (registros, claveGrupo, campoFecha) => {
  const ultimos = new Map()

  registros.forEach((registro) => {
    const clave = claveGrupo(registro)
    if (!clave) return
    const actual = ultimos.get(clave)
    if (!actual || compararFechas(registro[campoFecha], actual[campoFecha]) > 0) {
      ultimos.set(clave, registro)
    }
  })

  return registros.map((registro) => {
    const clave = claveGrupo(registro)
    return { ...registro, _reemplazado: Boolean(clave) && ultimos.get(clave) !== registro }
  })
}