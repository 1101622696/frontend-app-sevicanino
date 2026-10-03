import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'
import { Notify } from 'quasar'
import { useStoreUsuarios } from './usuarios'

export const useStoreChequeos = defineStore(
  'Chequeo',
  () => {
    let loading = ref(false)
    let chequeos = ref([])

    const obtenerChequeos = async () => {
      const useUsuario = useStoreUsuarios()
      loading.value = true
      try {
        let response = await axios.get(`api/chequeos/`, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (error) {
        console.error('No se pudo obtener el chequeo', error)
        return { resumen: null }
      } finally {
        loading.value = false
      }
    }

    const obtenerChequeosOrdenados = async (tipo = 'fecha', orden = 'desc') => {
      const useUsuario = useStoreUsuarios()

      loading.value = true
      try {
        const response = await axios.get(`api/chequeos/ordenados`, {
          params: { tipo, orden },
          headers: {
            'x-token': useUsuario.token,
          },
        })

        return response.data
      } catch (err) {
        console.error(`No se pudo obtener los chequeos ordenados por ${tipo}:`, err)
        throw err
      } finally {
        loading.value = false
      }
    }

    const obtenerChequeosFiltrados = async (tipo, valor) => {
      const useUsuario = useStoreUsuarios()
      loading.value = true
      try {
        const response = await axios.get(`api/chequeos/filtrados`, {
          params: { tipo, valor },
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (err) {
        console.error(`No se pudo obtener los chequeos filtrados por ${tipo}:`, err)
        console.error('Detalles del error:', err.response?.data || err.message)
        throw err
      } finally {
        loading.value = false
      }
    }

    const obtenerdatosChequeo = async (consecutivo) => {
      const useUsuario = useStoreUsuarios()
      try {
        let response = await axios.get(`api/chequeos/obtenerdatoschequeo/${consecutivo}`, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (error) {
        console.error('No se pudo obtener los datos del chequeo', error)
        return null
      } finally {
        loading.value = false
      }
    }

    const postChequeo = async (formData) => {
      const useUsuario = useStoreUsuarios()
      try {
        loading.value = true
        const response = await axios.post('api/chequeos/crear', formData, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        Notify.create({
          message: 'Chequeo creado correctamente',
          color: 'positive',
          position: 'bottom',
        })

        return response
      } catch (error) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.mensaje || 'Error al registrar chequeo',
        })
        // loading.value = true
        console.log(error)
        throw error
      } finally {
        loading.value = false
      }
    }

    const putChequeo = async (consecutivo, formData) => {
      const useUsuario = useStoreUsuarios()
      try {
        loading.value = true
        const response = await axios.put(`api/chequeos/editar/${consecutivo}`, formData, {
          headers: {
            'x-token': useUsuario.token,
          },
        })

        Notify.create({
          message: 'Chequeo editado correctamente',
          color: 'positive',
          position: 'bottom',
        })

        return response
      } catch (error) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.mensaje || 'Error al editar chequeo',
        })
        // loading.value = true
        console.log(error)
        throw error
      } finally {
        loading.value = false
      }
    }

    return {
      obtenerdatosChequeo,
      obtenerChequeos,
      obtenerChequeosFiltrados,
      obtenerChequeosOrdenados,
      postChequeo,
      putChequeo,
      loading,
      chequeos,
    }
  },
)
