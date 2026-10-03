import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'
import { Notify } from 'quasar'
import { useStoreUsuarios } from './usuarios'

export const useStoreSiniestros = defineStore(
  'Siniestros',
  () => {
    let loading = ref(false)
    let siniestros = ref([])

    const obtenerSiniestros = async () => {
      const useUsuario = useStoreUsuarios()
      loading.value = true
      try {
        let response = await axios.get(`api/siniestros/`, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (error) {
        console.error('No se pudo obtener los siniestros', error)
        return { resumen: null }
      } finally {
        loading.value = false
      }
    }

    const obtenerSiniestrosOrdenados = async (tipo = 'fecha', orden = 'desc') => {
      const useUsuario = useStoreUsuarios()

      loading.value = true
      try {
        const response = await axios.get(`api/siniestros/ordenados`, {
          params: { tipo, orden },
          headers: {
            'x-token': useUsuario.token,
          },
        })

        return response.data
      } catch (err) {
        console.error(`No se pudo obtener los siniestros ordenados por ${tipo}:`, err)
        throw err
      } finally {
        loading.value = false
      }
    }

    const obtenerSiniestrosFiltrados = async (tipo, valor) => {
      const useUsuario = useStoreUsuarios()
      loading.value = true
      try {
        const response = await axios.get(`api/siniestros/filtrados`, {
          params: { tipo, valor },
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (err) {
        console.error(`No se pudo obtener los siniestros filtrados por ${tipo}:`, err)
        console.error('Detalles del error:', err.response?.data || err.message)
        throw err
      } finally {
        loading.value = false
      }
    }

    const obtenerdatodeSiniestro = async (consecutivo) => {
      const useUsuario = useStoreUsuarios()
      try {
        let response = await axios.get(`api/siniestros/obtenerdatossiniestro/${consecutivo}`, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (error) {
        console.error('No se pudo obtener los datos del siniestro', error)
        return null
      } finally {
        loading.value = false
      }
    }

    const postSiniestro = async (formData) => {
      const useUsuario = useStoreUsuarios()
      try {
        loading.value = true
        const response = await axios.post('api/siniestros/crear', formData, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        Notify.create({
          message: 'Siniestro creado correctamente',
          color: 'positive',
          position: 'bottom',
        })

        return response
      } catch (error) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.mensaje || 'Error al registrar siniestro',
        })
        // loading.value = true
        console.log(error)
        throw error
      } finally {
        loading.value = false
      }
    }

    const putSiniestro = async (consecutivo, formData) => {
      const useUsuario = useStoreUsuarios()
      try {
        loading.value = true
        const response = await axios.put(`api/siniestros/editar/${consecutivo}`, formData, {
          headers: {
            'x-token': useUsuario.token,
          },
        })

        Notify.create({
          message: 'Siniestro editado correctamente',
          color: 'positive',
          position: 'bottom',
        })

        return response
      } catch (error) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.mensaje || 'Error al editar siniestro',
        })
        // loading.value = true
        console.log(error)
        throw error
      } finally {
        loading.value = false
      }
    }

    return {
      obtenerdatodeSiniestro,
      obtenerSiniestros,
      obtenerSiniestrosFiltrados,
      obtenerSiniestrosOrdenados,
      postSiniestro,
      putSiniestro,
      loading,
      siniestros,
    }
  },
  // { persist: true },
)
