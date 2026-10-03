import { Notify } from 'quasar'

/**
 * Convierte el formulario en FormData para multer.
 * - Ignora campos internos que empiezan con "_" y los de `excluir`.
 * - Los archivos van todos bajo el mismo nombre de campo ('archivos' por defecto).
 */
export const construirFormData = (datos, { archivos = [], campoArchivos = 'archivos', excluir = [] } = {}) => {
  const formData = new FormData()

  Object.entries(datos).forEach(([clave, valor]) => {
    if (clave.startsWith('_') || excluir.includes(clave)) return
    if (valor === undefined || valor === null) return
    if (valor instanceof File || Array.isArray(valor) || typeof valor === 'object') return
    formData.append(clave, String(valor).trim())
  })

  archivos.forEach((archivo) => formData.append(campoArchivos, archivo))

  return formData
}

/**
 * Valida en orden y avisa SOLO el primer error (no una pila de notificaciones).
 * reglas: [{ campo: 'canino_id', mensaje: 'Seleccione el canino' },
 *          { campo: 'fecha_fin', mensaje: '...', validar: (valor, datos) => boolean }]
 */
export const validarRequeridos = (datos, reglas) => {
  for (const regla of reglas) {
    const valor = datos[regla.campo]
    const valido = regla.validar
      ? regla.validar(valor, datos)
      : valor !== undefined && valor !== null && String(valor).trim() !== ''

    if (!valido) {
      Notify.create({ type: 'negative', message: regla.mensaje, position: 'bottom' })
      return false
    }
  }
  return true
}