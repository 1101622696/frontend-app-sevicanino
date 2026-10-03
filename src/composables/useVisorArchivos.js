import { ref } from 'vue'
import axios from 'axios'
import { Notify } from 'quasar'
import { useStoreUsuarios } from '../stores/usuarios'
import { abrirConOtraApp } from '../utils/archivosNativos'

// ─────────────────────────────────────────────────────────────
// Estado COMPARTIDO (fuera de la función): hay un solo visor montado en MainLayout
// y cualquier página lo abre con abrirArchivos(link, titulo).
// ─────────────────────────────────────────────────────────────

const abierto = ref(false)
const titulo = ref('')
const archivos = ref([])
const cargando = ref(false)
const error = ref('')
const indice = ref(-1) // -1 = lista de archivos; >= 0 = viendo ese archivo
let ultimaReferencia = null

// Caché de archivos descargados (blob + objectURL). Máximo 20; se liberan los más viejos.
const MAX_CACHE = 20
const cacheArchivos = new Map()

const headers = () => ({ 'x-token': useStoreUsuarios().token })

/**
 * Acepta todo lo que guardan las hojas:
 *  - https://drive.google.com/drive/folders/ID   (subcarpetas de revisiones/siniestros)
 *  - https://drive.google.com/file/d/ID/view     (un archivo)
 *  - ...?id=ID
 *  - ID crudo (foto_drive_id, procedencia_drive de caninos) → el backend detecta si es carpeta
 */
export const resolverReferencia = (referencia) => {
  const texto = String(referencia ?? '').trim()
  if (!texto) return null

  const carpeta = texto.match(/folders\/([a-zA-Z0-9_-]+)/)
  if (carpeta) return { folderId: carpeta[1] }

  const archivo = texto.match(/\/d\/([a-zA-Z0-9_-]+)/) || texto.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (archivo) return { fileId: archivo[1] }

  if (/^[a-zA-Z0-9_-]{10,}$/.test(texto)) return { id: texto }

  return null
}

export const tipoArchivo = (mimeType = '') => {
  if (mimeType.startsWith('image/')) return 'imagen'
  if (mimeType === 'application/pdf') return 'pdf'
  return 'otro'
}

/** Descarga el archivo con el token y devuelve { blob, url }. Usa caché */
export async function obtenerArchivo(fileId) {
  if (cacheArchivos.has(fileId)) {
    // Lo mueve al final para que sea el último en liberarse
    const entrada = cacheArchivos.get(fileId)
    cacheArchivos.delete(fileId)
    cacheArchivos.set(fileId, entrada)
    return entrada
  }

  const { data } = await axios.get(`api/drive/archivo/${fileId}`, {
    responseType: 'blob',
    headers: headers(),
  })

  const entrada = { blob: data, url: URL.createObjectURL(data) }
  cacheArchivos.set(fileId, entrada)

  if (cacheArchivos.size > MAX_CACHE) {
    const [clave, vieja] = cacheArchivos.entries().next().value
    URL.revokeObjectURL(vieja.url)
    cacheArchivos.delete(clave)
  }

  return entrada
}

/** Llamar al cerrar sesión */
export function limpiarCacheArchivos() {
  cacheArchivos.forEach((entrada) => URL.revokeObjectURL(entrada.url))
  cacheArchivos.clear()
}

export function useVisorArchivos() {
  async function abrirArchivos(referencia, tituloVisor = 'Archivos adjuntos') {
    const params = resolverReferencia(referencia)

    if (!params) {
      Notify.create({ type: 'warning', message: 'Este registro no tiene archivos adjuntos', position: 'bottom' })
      return
    }

    ultimaReferencia = { referencia, tituloVisor }
    titulo.value = tituloVisor
    archivos.value = []
    error.value = ''
    indice.value = -1
    cargando.value = true
    abierto.value = true

    try {
      const { data } = await axios.get('api/drive/archivos', { params, headers: headers() })
      archivos.value = Array.isArray(data) ? data : data?.archivos || []
      // Con un solo archivo, se abre directo sin pasar por la lista
      if (archivos.value.length === 1) indice.value = 0
    } catch (e) {
      console.error('Error al cargar archivos de Drive:', e)
      error.value =
        e.response?.status === 404
          ? 'No se encontraron los archivos. Es posible que se hayan eliminado de Drive.'
          : 'No se pudieron cargar los archivos. Revise su conexión e intente de nuevo.'
    } finally {
      cargando.value = false
    }
  }

  function reintentar() {
    if (ultimaReferencia) abrirArchivos(ultimaReferencia.referencia, ultimaReferencia.tituloVisor)
  }

  function cerrar() {
    abierto.value = false
    indice.value = -1
  }

  const verArchivo = (posicion) => {
    indice.value = posicion
  }

  const volverALista = () => {
    indice.value = -1
  }

  async function abrirExterno(archivo) {
    if (!archivo) return
    try {
      const { blob } = await obtenerArchivo(archivo.id)
      await abrirConOtraApp(blob, archivo.name, archivo.mimeType)
    } catch (e) {
      console.error('No se pudo abrir con otra app:', e)
      Notify.create({
        type: 'negative',
        message: 'No hay una aplicación instalada que pueda abrir este archivo',
        position: 'bottom',
      })
    }
  }

  return {
    abierto,
    titulo,
    archivos,
    cargando,
    error,
    indice,
    abrirArchivos,
    reintentar,
    cerrar,
    verArchivo,
    volverALista,
    abrirExterno,
    obtenerArchivo,
  }
}