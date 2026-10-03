import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'
import { Notify } from 'quasar'
import { useStoreUsuarios } from './usuarios'

/**
 * Los cuatro certificados tienen las mismas columnas
 * (consecutivo, canino_id, fecha_emision, fecha_vencimiento, link)
 * y los mismos endpoints; solo cambia la ruta base.
 */
export const TIPOS_CERTIFICADO = [
  { clave: 'adiestramiento', titulo: 'Certificado de adiestramiento', ruta: 'certadiestramiento', icono: 'school' },
  { clave: 'svvsp', titulo: 'Código SVVSP', ruta: 'codigosvvsp', icono: 'verified' },
  { clave: 'etologico', titulo: 'Certificado etológico', ruta: 'etologico', icono: 'psychology' },
  { clave: 'poliza', titulo: 'Póliza de responsabilidad', ruta: 'poliza', icono: 'shield' },
]

const RESUMEN_VACIO = () => ({
  certificados: { adiestramiento: null, svvsp: null, etologico: null, poliza: null },
  traslados: [],
})

export const useStoreCertificados = defineStore('Certificados', () => {
  const loading = ref(false)

  const headers = () => ({ 'x-token': useStoreUsuarios().token })

  const notificarError = (error, mensajePorDefecto) => {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.mensaje || mensajePorDefecto,
    })
  }

  /** Hoja de vida del canino: último certificado de cada tipo + traslados. Nunca lanza error */
  const obtenerResumen = async (caninoId) => {
    try {
      const { data } = await axios.get(`api/caninos/resumen/${caninoId}`, { headers: headers() })
      return {
        certificados: { ...RESUMEN_VACIO().certificados, ...(data?.certificados || {}) },
        traslados: Array.isArray(data?.traslados) ? data.traslados : [],
      }
    } catch (error) {
      console.error('No se pudo obtener el resumen del canino', error)
      notificarError(error, 'No se pudieron cargar los certificados del canino')
      return null
    }
  }

  /** Crea (sin consecutivo) o edita (con consecutivo) un certificado del tipo indicado */
  const guardarCertificado = async (clave, formData, consecutivo = null) => {
    const tipo = TIPOS_CERTIFICADO.find((t) => t.clave === clave)
    if (!tipo) throw new Error(`Tipo de certificado desconocido: ${clave}`)

    loading.value = true
    try {
      const url = consecutivo ? `api/${tipo.ruta}/editar/${consecutivo}` : `api/${tipo.ruta}/crear`
      const response = await axios({
        method: consecutivo ? 'put' : 'post',
        url,
        data: formData,
        headers: headers(),
      })
      Notify.create({
        message: consecutivo ? `${tipo.titulo} actualizado` : `${tipo.titulo} registrado`,
        color: 'positive',
        position: 'bottom',
      })
      return response
    } catch (error) {
      console.error('Error al guardar certificado', error)
      notificarError(error, `Error al guardar ${tipo.titulo.toLowerCase()}`)
      throw error
    } finally {
      loading.value = false
    }
  }

  return { loading, obtenerResumen, guardarCertificado }
})