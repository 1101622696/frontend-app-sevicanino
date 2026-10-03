import { defineStore } from 'pinia'
import axios from 'axios'
import { ref, computed } from 'vue'
import { Notify } from 'quasar'
import { useStoreUsuarios } from './usuarios'
import { normalizar } from '../utils/texto'

// Las ciudades casi no cambian: se piden una vez cada 10 minutos como máximo
const VIGENCIA_CACHE_MS = 10 * 60 * 1000

export const useStoreCiudades = defineStore('Ciudad', () => {
  const loading = ref(false)
  const ciudades = ref([])
  const cargadoEn = ref(0)
  let peticionEnCurso = null

  const headers = () => ({ 'x-token': useStoreUsuarios().token })

  /** Devuelve SIEMPRE un array: [{ consecutivo, nombre, estado }] */
  const obtenerCiudades = async ({ forzar = false } = {}) => {
    const vigente = Date.now() - cargadoEn.value < VIGENCIA_CACHE_MS
    if (!forzar && vigente && ciudades.value.length) return ciudades.value

    // Si dos componentes la piden al mismo tiempo, comparten la misma petición
    if (peticionEnCurso) return peticionEnCurso

    loading.value = true
    peticionEnCurso = (async () => {
      try {
        const { data } = await axios.get('api/ciudades/', { headers: headers() })
        const lista = Array.isArray(data) ? data : data?.ciudades || []
        ciudades.value = lista
        cargadoEn.value = Date.now()
        return lista
      } catch (error) {
        console.error('No se pudo obtener las ciudades', error)
        Notify.create({
          type: 'negative',
          message: error.response?.data?.mensaje || 'No se pudieron cargar las ciudades',
        })
        return ciudades.value // si falla, devuelve lo que haya en caché
      } finally {
        loading.value = false
        peticionEnCurso = null
      }
    })()

    return peticionEnCurso
  }

  const mapaCiudades = computed(
    () => new Map(ciudades.value.map((ciudad) => [normalizar(ciudad.consecutivo), ciudad])),
  )

  /** 'C-1' → 'Bucaramanga'. Incluye ciudades inactivas para registros viejos */
  const nombreCiudad = (ciudadId) =>
    mapaCiudades.value.get(normalizar(ciudadId))?.nombre || (ciudadId ? ciudadId : 'Sin ciudad')

  /** Para q-select de formularios: solo activas → { label, value } */
  const opcionesCiudades = computed(() =>
    ciudades.value
      .filter((ciudad) => normalizar(ciudad.estado || 'activo') === 'activo')
      .map((ciudad) => ({ label: ciudad.nombre, value: ciudad.consecutivo }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es')),
  )

  /** Para filtros: todas → { valor, etiqueta } */
  const opcionesFiltroCiudades = computed(() =>
    ciudades.value
      .map((ciudad) => ({ valor: ciudad.consecutivo, etiqueta: ciudad.nombre }))
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es')),
  )

  const postCiudad = async (data) => {
    loading.value = true
    try {
      const response = await axios.post('api/ciudades/crear', data, { headers: headers() })
      Notify.create({ message: 'Ciudad creada correctamente', color: 'positive', position: 'bottom' })
      cargadoEn.value = 0
      return response
    } catch (error) {
      Notify.create({
        type: 'negative',
        message: error.response?.data?.mensaje || 'Error al crear la ciudad',
      })
      throw error
    } finally {
      loading.value = false
    }
  }

  const limpiar = () => {
    ciudades.value = []
    cargadoEn.value = 0
  }

  return {
    loading,
    ciudades,
    obtenerCiudades,
    nombreCiudad,
    opcionesCiudades,
    opcionesFiltroCiudades,
    postCiudad,
    limpiar,
  }
})