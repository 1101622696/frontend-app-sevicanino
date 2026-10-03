import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'
import { Notify } from 'quasar'
import { useStoreUsuarios } from './usuarios'

export const useStoreProfilaxis = defineStore(
  'Profilaxis',
  () => {
    let loading = ref(false)
    let profilaxis = ref([])

    const obtenerProfilaxis = async () => {
      const useUsuario = useStoreUsuarios()
      loading.value = true
      try {
        let response = await axios.get(`api/profilaxis/`, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (error) {
        console.error('No se pudo obtener los profilaxis', error)
        return { resumen: null }
      } finally {
        loading.value = false
      }
    }

    const obtenerProfilaxisOrdenados = async (tipo = 'fecha', orden = 'desc') => {
      const useUsuario = useStoreUsuarios()

      loading.value = true
      try {
        const response = await axios.get(`api/profilaxis/ordenados`, {
          params: { tipo, orden },
          headers: {
            'x-token': useUsuario.token,
          },
        })

        return response.data
      } catch (err) {
        console.error(`No se pudo obtener los profilaxis ordenados por ${tipo}:`, err)
        throw err
      } finally {
        loading.value = false
      }
    }

    const obtenerProfilaxisFiltrados = async (tipo, valor) => {
      const useUsuario = useStoreUsuarios()
      loading.value = true
      try {
        const response = await axios.get(`api/profilaxis/filtrados`, {
          params: { tipo, valor },
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (err) {
        console.error(`No se pudo obtener los profilaxis filtrados por ${tipo}:`, err)
        console.error('Detalles del error:', err.response?.data || err.message)
        throw err
      } finally {
        loading.value = false
      }
    }

    const obtenerdatodeProfilaxis = async (consecutivo) => {
      const useUsuario = useStoreUsuarios()
      try {
        let response = await axios.get(`api/profilaxis/obtenerdatosprofilaxis/${consecutivo}`, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        return response.data
      } catch (error) {
        console.error('No se pudo obtener los datos del profilaxis', error)
        return null
      } finally {
        loading.value = false
      }
    }

    const postProfilaxis = async (formData) => {
      const useUsuario = useStoreUsuarios()
      try {
        loading.value = true
        const response = await axios.post('api/profilaxis/crear', formData, {
          headers: {
            'x-token': useUsuario.token,
          },
        })
        Notify.create({
          message: 'Profilaxis creado correctamente',
          color: 'positive',
          position: 'bottom',
        })

        return response
      } catch (error) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.mensaje || 'Error al registrar profilaxis',
        })
        // loading.value = true
        console.log(error)
        throw error
      } finally {
        loading.value = false
      }
    }

    const putProfilaxis = async (consecutivo, formData) => {
      const useUsuario = useStoreUsuarios()
      try {
        loading.value = true
        const response = await axios.put(`api/profilaxis/editar/${consecutivo}`, formData, {
          headers: {
            'x-token': useUsuario.token,
          },
        })

        Notify.create({
          message: 'Profilaxis editado correctamente',
          color: 'positive',
          position: 'bottom',
        })

        return response
      } catch (error) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.mensaje || 'Error al editar profilaxis',
        })
        // loading.value = true
        console.log(error)
        throw error
      } finally {
        loading.value = false
      }
    }

    return {
      obtenerdatodeProfilaxis,
      obtenerProfilaxis,
      obtenerProfilaxisFiltrados,
      obtenerProfilaxisOrdenados,
      postProfilaxis,
      putProfilaxis,
      loading,
      profilaxis,
    }
  },
  // { persist: true },
)
