import { defineStore } from 'pinia'
import axios from 'axios'
import { ref, computed } from 'vue'
import { Notify } from 'quasar'
import useNotifications from '../composables/useNotifications'
import { useStoreCaninos } from './caninos'
import { useStoreCiudades } from './ciudades'
import { useStoreDashboard } from './dashboard'
import { limpiarCacheArchivos } from '../composables/useVisorArchivos'

export const useStoreUsuarios = defineStore(
  'Usuarios',
  () => {
    const token = ref('')
    const loading = ref(false)
    const usuarios = ref([])
    const user = ref({})
    const perfile = ref('')
    const correo = ref('')

    // ── Sesión ──
    const isAuthenticated = computed(() => Boolean(token.value))
    const esAdmin = computed(() => (user.value?.perfil || perfile.value) === 'administrador')
    const ciudadUsuario = computed(() => user.value?.ciudad_id || '')
    const nombreUsuario = computed(() => user.value?.nombre || '')
    const emailUsuario = computed(() => user.value?.email || correo.value || '')

    const headers = () => ({ 'x-token': token.value })

    const notificarError = (error, mensajePorDefecto) => {
      Notify.create({
        type: 'negative',
        message: error.response?.data?.mensaje || error.response?.data?.error || mensajePorDefecto,
      })
    }

    const enviar = async (metodo, url, data, mensajeOk, mensajeError) => {
      loading.value = true
      try {
        const response = await axios({ method: metodo, url, data, headers: headers() })
        if (mensajeOk) Notify.create({ message: mensajeOk, color: 'positive', position: 'bottom' })
        return response
      } catch (error) {
        console.error(mensajeError, error)
        notificarError(error, mensajeError)
        throw error
      } finally {
        loading.value = false
      }
    }

    const guardarUsuarioSesion = (datos) => {
      if (!datos) return
      user.value = { ...user.value, ...datos }
      perfile.value = datos.perfil || perfile.value
      correo.value = datos.email || correo.value
    }

    const setToken = (nuevo) => {
      token.value = nuevo
      localStorage.setItem('x-token', nuevo)
    }

    // ── Lecturas ──
    const listarUsuario = async () => {
      loading.value = true
      try {
        const { data } = await axios.get('api/usuarios', { headers: headers() })
        return Array.isArray(data) ? data : data?.usuarios || []
      } catch (error) {
        console.error('No se pudo obtener los usuarios', error)
        notificarError(error, 'No se pudieron cargar los usuarios')
        return []
      } finally {
        loading.value = false
      }
    }

    const obtenerUsuariosPorEmail = async (email) => {
      loading.value = true
      try {
        const { data } = await axios.get(`api/usuarios/poremail/${email}`, { headers: headers() })
        return data
      } catch (error) {
        console.error('No se pudo obtener el usuario por email', error)
        notificarError(error, 'No se pudo cargar el usuario')
        return null
      } finally {
        loading.value = false
      }
    }

    const listardatosUsuario = (email) => obtenerUsuariosPorEmail(email)

    /**
     * Al abrir la app: trae perfil, ciudad y nombre actuales desde la hoja.
     * Si el admin cambió algo, se refleja sin volver a iniciar sesión.
     * Sin spinner y sin avisos: si falla por red, la sesión sigue igual.
     * Si el token ya no sirve (401), el interceptor de main.js cierra la sesión.
     */
    const refrescarSesion = async () => {
      if (!token.value) return
      try {
        const { data } = await axios.get('api/usuarios/yo', { headers: headers(), sinSpinner: true })
        guardarUsuarioSesion(data?.usuario)
      } catch {
        // red o 503: se conserva la sesión guardada
      }
    }

    // ── Escrituras ──
    const postUsuario = (data) =>
      enviar('post', 'api/usuarios/crear', data, 'Usuario creado correctamente', 'Error al registrar usuario')

    const putUsuarios = (email, data) =>
      enviar('put', `api/usuarios/editar/${email}`, data, 'Usuario actualizado correctamente', 'Error al actualizar usuario')

    const putActivarUsuario = (email) =>
      enviar('put', `api/usuarios/activar/${email}`, {}, 'Usuario activado', 'Error al activar usuario')

    const putInactivarUsuario = (email) =>
      enviar('put', `api/usuarios/inactivar/${email}`, {}, 'Usuario inactivado', 'Error al inactivar usuario')

    /** El usuario cambia su propia contraseña. Recibe un token nuevo para no cerrar sesión aquí */
    const cambiarMiPassword = async (passwordActual, passwordNueva) => {
      const { data } = await enviar(
        'put',
        `api/usuarios/editarpassword/${emailUsuario.value}`,
        { password_actual: passwordActual, password_nueva: passwordNueva },
        null,
        'No se pudo cambiar la contraseña',
      )
      if (data?.token) setToken(data.token)
      Notify.create({ message: data?.mensaje || 'Contraseña actualizada', color: 'positive', position: 'bottom' })
      return data
    }

    /** El admin restablece la contraseña de otro usuario (se le cierran sus sesiones) */
    const restablecerPassword = async (email, passwordNueva) => {
      const { data } = await enviar(
        'put',
        `api/usuarios/editarpassword/${email}`,
        { password_nueva: passwordNueva },
        null,
        'No se pudo restablecer la contraseña',
      )
      Notify.create({ message: data?.mensaje || 'Contraseña restablecida', color: 'positive', position: 'bottom' })
      return data
    }

    // ── Notificaciones push ──
    const registrarTokenFCM = async (tokenFCM) => {
      try {
        const tokenActual = localStorage.getItem('fcm-token')
        if (tokenActual === tokenFCM) return { success: true }

        const response = await axios.post(
          'api/usuarios/registrar-token-fcm',
          { token: tokenFCM },
          { headers: headers(), sinSpinner: true },
        )
        localStorage.setItem('fcm-token', tokenFCM)
        return response.data
      } catch (error) {
        console.error('Error al registrar notificaciones', error)
        return { success: false }
      }
    }

    // ── Login / logout ──
    // login sigue devolviendo el error (en vez de lanzarlo) porque LoginPage depende de eso
    const login = async (email, password) => {
      try {
        const res = await axios.post('api/usuarios/login', {
          email: String(email || '').trim().toLowerCase(),
          password,
        })

        setToken(res.data.token)
        user.value = res.data.usuario
        perfile.value = res.data.usuario.perfil
        correo.value = res.data.usuario.email

        Notify.create({
          message: `Bienvenido, ${res.data.usuario.nombre}`,
          color: 'positive',
          position: 'top',
        })

        setTimeout(async () => {
          try {
            await useNotifications().inicializarNotificaciones()
          } catch (error) {
            console.log('Error al inicializar notificaciones:', error)
          }
        }, 1000)

        return res
      } catch (error) {
        const mensaje = !error.response
          ? 'No hay conexión con el servidor. Si es la primera vez del día, espere unos segundos e intente de nuevo.'
          : error.response.data?.errors?.[0]?.msg || error.response.data?.error || 'Correo o contraseña incorrectos'

        Notify.create({ type: 'negative', message: mensaje })
        return error
      }
    }

    /** Borra la sesión y todos los cachés (si otro usuario entra en el mismo celular, no ve nada del anterior) */
    const cerrarSesion = () => {
      token.value = ''
      user.value = {}
      perfile.value = ''
      correo.value = ''
      usuarios.value = []
      localStorage.removeItem('x-token')
      localStorage.removeItem('usuarios-store')
      localStorage.removeItem('email')
      localStorage.removeItem('fcm-token')

      useStoreCaninos().limpiar()
      useStoreCiudades().limpiar()
      useStoreDashboard().limpiar()
      limpiarCacheArchivos()
    }

    // Nombre anterior, por compatibilidad con código que aún lo llame
    const eliminarToken = cerrarSesion

    // ── Recuperación de contraseña (sin sesión) ──
    const solicitarRecuperacion = async (email) => {
      loading.value = true
      try {
        return await axios.post('api/usuarios/recuperar-password', { email })
      } catch (error) {
        notificarError(error, 'Error al enviar el código')
        return error
      } finally {
        loading.value = false
      }
    }

    const verificarCodigo = async (email, codigo) => {
      loading.value = true
      try {
        return await axios.post('api/usuarios/verificar-codigo', { email, codigo })
      } catch (error) {
        notificarError(error, 'Código incorrecto')
        return error
      } finally {
        loading.value = false
      }
    }

    const cambiarPassword = async (email, codigo, nuevaPassword) => {
      loading.value = true
      try {
        return await axios.post('api/usuarios/cambiar-password', { email, codigo, nuevaPassword })
      } catch (error) {
        notificarError(error, 'Error al cambiar la contraseña')
        return error
      } finally {
        loading.value = false
      }
    }

    return {
      // estado
      token,
      loading,
      usuarios,
      user,
      perfile,
      correo,
      // sesión
      isAuthenticated,
      esAdmin,
      ciudadUsuario,
      nombreUsuario,
      emailUsuario,
      refrescarSesion,
      // lecturas
      listarUsuario,
      obtenerUsuariosPorEmail,
      listardatosUsuario,
      // escrituras
      postUsuario,
      putUsuarios,
      putActivarUsuario,
      putInactivarUsuario,
      cambiarMiPassword,
      restablecerPassword,
      registrarTokenFCM,
      // auth
      login,
      cerrarSesion,
      eliminarToken,
      solicitarRecuperacion,
      verificarCodigo,
      cambiarPassword,
    }
  },
  {
    persist: {
      key: 'usuarios-store',
      storage: localStorage,
      pick: ['token', 'user', 'perfile', 'correo'],
    },
  },
)