import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'
import { Notify } from 'quasar'
import { useStoreUsuarios } from './usuarios'

export const useStoreActividades = defineStore(
  'Actividad',
  () => {
    let loading = ref(false)
    let actividades = ref([])

    const obtenerActividades = async () => {
      const useUsuario = useStoreUsuarios()
      loading.value = true
      try {
        let response = await axios.get(`api/actividades/`, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (error) {
        console.error('No se pudo obtener la actividad', error)
        return { resumen: null }
      } finally {
        loading.value = false
      }
    }

    const obtenerActividadesOrdenadas = async (tipo = 'fecha', orden = 'desc') => {
      const useUsuario = useStoreUsuarios()

      loading.value = true
      try {
        const response = await axios.get(`api/actividades/ordenados`, {
          params: { tipo, orden },
          headers: {
            'x-token': useUsuario.token,
          },
        })

        return response.data
      } catch (err) {
        console.error(`No se pudo obtener las actividades ordenadas por ${tipo}:`, err)
        throw err
      } finally {
        loading.value = false
      }
    }

    const obtenerActividadesFiltradas = async (tipo, valor) => {
      const useUsuario = useStoreUsuarios()
      loading.value = true
      try {
        const response = await axios.get(`api/actividades/filtrados`, {
          params: { tipo, valor },
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (err) {
        console.error(`No se pudo obtener las actividades filtradas por ${tipo}:`, err)
        console.error('Detalles del error:', err.response?.data || err.message)
        throw err
      } finally {
        loading.value = false
      }
    }

    const obtenerdatodeactividad = async (consecutivo) => {
      const useUsuario = useStoreUsuarios()
      try {
        let response = await axios.get(`api/actividades/obtenerdatosactividad/${consecutivo}`, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (error) {
        console.error('No se pudo obtener los datos de la actividad', error)
        return null
      } finally {
        loading.value = false
      }
    }

    const postActividad = async (formData) => {
      const useUsuario = useStoreUsuarios()
      try {
        loading.value = true
        const response = await axios.post('api/actividades/crear', formData, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        Notify.create({
          message: 'Actividad creada correctamente',
          color: 'positive',
          position: 'bottom',
        })

        return response
      } catch (error) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.mensaje || 'Error al registrar actividad',
        })
        // loading.value = true
        console.log(error)
        throw error
      } finally {
        loading.value = false
      }
    }

    const putActividad = async (consecutivo, formData) => {
      const useUsuario = useStoreUsuarios()
      try {
        loading.value = true
        const response = await axios.put(`api/actividades/editar/${consecutivo}`, formData, {
          headers: {
            'x-token': useUsuario.token,
          },
        })

        Notify.create({
          message: 'Actividad editada correctamente',
          color: 'positive',
          position: 'bottom',
        })

        return response
      } catch (error) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.mensaje || 'Error al editar actividad',
        })
        // loading.value = true
        console.log(error)
        throw error
      } finally {
        loading.value = false
      }
    }

    return {
      obtenerdatodeactividad,
      obtenerActividades,
      obtenerActividadesFiltradas,
      obtenerActividadesOrdenadas,
      postActividad,
      putActividad,
      loading,
      actividades,
    }
  },
)
