import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'
import { Notify } from 'quasar'
import { useStoreUsuarios } from './usuarios'

// Guarda el último resumen en memoria: al volver al home se muestra al instante
// mientras se actualiza por detrás.
export const useStoreDashboard = defineStore('Dashboard', () => {
  const datos = ref(null)
  const loading = ref(false)

  const obtenerDashboard = async ({ fresco = false } = {}) => {
    loading.value = true
    try {
      const { data } = await axios.get('api/dashboard', {
        params: fresco ? { fresco: 1 } : {},
        headers: { 'x-token': useStoreUsuarios().token },
      })
      datos.value = data
      return data
    } catch (error) {
      console.error('No se pudo cargar el resumen', error)
      Notify.create({
        type: 'negative',
        message: error.response?.data?.mensaje || 'No se pudo cargar el resumen',
      })
      return datos.value
    } finally {
      loading.value = false
    }
  }

  const limpiar = () => {
    datos.value = null
  }

  return { datos, loading, obtenerDashboard, limpiar }
})