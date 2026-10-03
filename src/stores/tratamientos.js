import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'
import { Notify } from 'quasar'
import { useStoreUsuarios } from './usuarios'

export const useStoreTratamientos = defineStore(
  'Tratamiento',
  () => {
    let loading = ref(false)
    let tratamientos = ref([])

    const obtenerTratamientos = async () => {
      const useUsuario = useStoreUsuarios()
      loading.value = true
      try {
        let response = await axios.get(`api/tratamientos/`, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (error) {
        console.error('No se pudo obtener el tratamiento', error)
        return { resumen: null }
      } finally {
        loading.value = false
      }
    }

    const obtenerTratamientosOrdenados = async (tipo = 'fecha', orden = 'desc') => {
      const useUsuario = useStoreUsuarios()

      loading.value = true
      try {
        const response = await axios.get(`api/tratamientos/ordenados`, {
          params: { tipo, orden },
          headers: {
            'x-token': useUsuario.token,
          },
        })

        return response.data
      } catch (err) {
        console.error(`No se pudo obtener los tratamientos ordenados por ${tipo}:`, err)
        throw err
      } finally {
        loading.value = false
      }
    }

    const obtenerTratamientosFiltrados = async (tipo, valor) => {
      const useUsuario = useStoreUsuarios()
      loading.value = true
      try {
        const response = await axios.get(`api/tratamientos/filtrados`, {
          params: { tipo, valor },
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (err) {
        console.error(`No se pudo obtener los tratamientos filtrados por ${tipo}:`, err)
        console.error('Detalles del error:', err.response?.data || err.message)
        throw err
      } finally {
        loading.value = false
      }
    }

    const obtenerdatodetratamiento = async (consecutivo) => {
      const useUsuario = useStoreUsuarios()
      try {
        let response = await axios.get(`api/tratamientos/obtenerdatotratamiento/${consecutivo}`, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (error) {
        console.error('No se pudo obtener los datos del tratamiento', error)
        return null
      } finally {
        loading.value = false
      }
    }

    const postTratamiento = async (formData) => {
      const useUsuario = useStoreUsuarios()
      try {
        loading.value = true
        const response = await axios.post('api/tratamientos/crear', formData, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        Notify.create({
          message: 'Tratamiento creado correctamente',
          color: 'positive',
          position: 'bottom',
        })

        return response
      } catch (error) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.mensaje || 'Error al registrar tratamiento',
        })
        // loading.value = true
        console.log(error)
        throw error
      } finally {
        loading.value = false
      }
    }

    const putTratamiento = async (consecutivo, formData) => {
      const useUsuario = useStoreUsuarios()
      try {
        loading.value = true
        const response = await axios.put(`api/tratamientos/editar/${consecutivo}`, formData, {
          headers: {
            'x-token': useUsuario.token,
          },
        })

        Notify.create({
          message: 'Tratamiento editado correctamente',
          color: 'positive',
          position: 'bottom',
        })

        return response
      } catch (error) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.mensaje || 'Error al editar tratamiento',
        })
        // loading.value = true
        console.log(error)
        throw error
      } finally {
        loading.value = false
      }
    }

    return {
      obtenerdatodetratamiento,
      obtenerTratamientos,
      obtenerTratamientosFiltrados,
      obtenerTratamientosOrdenados,
      postTratamiento,
      putTratamiento,
      loading,
      tratamientos,
    }
  },
  // { persist: true },
)
