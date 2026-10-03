import { defineStore } from 'pinia'
import axios from 'axios'
import { ref, computed } from 'vue'
import { Notify } from 'quasar'
import { useStoreUsuarios } from './usuarios'
import { normalizar } from '../utils/texto'

// Los caninos los usan todas las páginas (selector, nombres en cards, filtro por ciudad).
// Se cachean 2 minutos y el caché se invalida al crear/editar/activar/desactivar.
const VIGENCIA_CACHE_MS = 2 * 60 * 1000

export const useStoreCaninos = defineStore('Canino', () => {
  const loading = ref(false)
  const caninos = ref([])
  const cargadoEn = ref(0)
  let peticionEnCurso = null

  const headers = () => ({ 'x-token': useStoreUsuarios().token })

  const notificarError = (error, mensajePorDefecto) => {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.mensaje || mensajePorDefecto,
    })
  }

  const invalidarCache = () => {
    cargadoEn.value = 0
  }

  const limpiar = () => {
    caninos.value = []
    cargadoEn.value = 0
  }

  // ── Lecturas ──

  /** Lista ya restringida por ciudad desde el backend. Siempre devuelve un array */
  const obtenerCaninos = async ({ forzar = false } = {}) => {
    const vigente = Date.now() - cargadoEn.value < VIGENCIA_CACHE_MS
    if (!forzar && vigente && caninos.value.length) return caninos.value

    if (peticionEnCurso) return peticionEnCurso

    loading.value = true
    peticionEnCurso = (async () => {
      try {
        const { data } = await axios.get('api/caninos/', { headers: headers() })
        const lista = Array.isArray(data) ? data : data?.caninos || []
        caninos.value = lista
        cargadoEn.value = Date.now()
        return lista
      } catch (error) {
        console.error('No se pudo obtener los caninos:', error.response?.data || error.message)
        notificarError(error, 'No se pudieron cargar los caninos')
        throw error
      } finally {
        loading.value = false
        peticionEnCurso = null
      }
    })()

    return peticionEnCurso
  }

  const obtenerdatodecanino = async (consecutivo) => {
    try {
      const { data } = await axios.get(`api/caninos/obtenerdatoscanino/${consecutivo}`, {
        headers: headers(),
      })
      return data
    } catch (error) {
      console.error('No se pudo obtener los datos del canino', error)
      notificarError(error, 'No se pudo cargar el canino')
      return null
    }
  }

  // ── Helpers para las demás páginas ──

  const mapaCaninos = computed(
    () => new Map(caninos.value.map((canino) => [normalizar(canino.consecutivo), canino])),
  )

  const buscarCanino = (caninoId) => mapaCaninos.value.get(normalizar(caninoId)) || null

  /** 'CAN-3' → 'Rocky'. Si no está en caché, muestra el id */
  const nombreCanino = (caninoId) => buscarCanino(caninoId)?.nombre || caninoId || 'Sin canino'

  /** Ciudad ACTUAL del canino (cambia con los traslados) */
  const ciudadDeCanino = (caninoId) => buscarCanino(caninoId)?.ciudad_id || ''

  /** Para SelectCanino: solo activos → { label, value, caption } */
  const opcionesCaninos = computed(() =>
    caninos.value
      .filter((canino) => normalizar(canino.estado || 'activo') === 'activo')
      .map((canino) => ({
        label: canino.nombre,
        value: canino.consecutivo,
        caption: [canino.raza, canino.microchip].filter(Boolean).join(' · '),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es')),
  )

  // ── Escrituras ──

  const enviar = async (metodo, url, data, mensajeOk, mensajeError) => {
    loading.value = true
    try {
      const response = await axios({ method: metodo, url, data, headers: headers() })
      Notify.create({ message: mensajeOk, color: 'positive', position: 'bottom' })
      invalidarCache()
      return response
    } catch (error) {
      console.error(mensajeError, error)
      notificarError(error, mensajeError)
      throw error
    } finally {
      loading.value = false
    }
  }

  const postCanino = (formData) =>
    enviar('post', 'api/caninos/crear', formData, 'Canino creado correctamente', 'Error al registrar canino')

  const putCanino = (consecutivo, formData) =>
    enviar('put', `api/caninos/editar/${consecutivo}`, formData, 'Canino editado correctamente', 'Error al editar canino')

  const putActivarCanino = (consecutivo) =>
    enviar('put', `api/caninos/activar/${consecutivo}`, {}, 'Canino activado correctamente', 'Error al activar canino')

  const putDesactivarCanino = (consecutivo) =>
    enviar('put', `api/caninos/desactivar/${consecutivo}`, {}, 'Canino desactivado correctamente', 'Error al desactivar canino')

  const postTraslado = (datos) =>
  enviar('post', 'api/traslados/crear', datos, 'Traslado registrado correctamente', 'Error al registrar el traslado')

  return {
    loading,
    caninos,
    obtenerCaninos,
    obtenerdatodecanino,
    buscarCanino,
    nombreCanino,
    ciudadDeCanino,
    opcionesCaninos,
    invalidarCache,
    limpiar,
    postCanino,
    putCanino,
    putActivarCanino,
    putDesactivarCanino,
    postTraslado
  }
})