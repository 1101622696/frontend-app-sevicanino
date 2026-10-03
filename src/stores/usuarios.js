import { defineStore } from 'pinia'
import axios from 'axios'
import { ref, computed } from 'vue'
import { Notify } from 'quasar'
import useNotifications from '../composables/useNotifications'
import { useStoreCaninos } from './caninos'
import { useStoreCiudades } from './ciudades'
import { useStoreDashboard } from './dashboard'

export const useStoreUsuarios = defineStore(
  'Usuarios',
  () => {
    const token = ref('')
    const loading = ref(false)
    const usuarios = ref([])
    const user = ref({})
    const perfile = ref('')
    const correo = ref('')
   const isAuthenticated = computed(() => Boolean(token.value))
    // ── Sesión: úsalos en las páginas en vez de leer user.value a mano ──
    const esAdmin = computed(() => (user.value?.perfil || perfile.value) === 'administrador')
    const ciudadUsuario = computed(() => user.value?.ciudad_id || '')
    const nombreUsuario = computed(() => user.value?.nombre || '')
    const emailUsuario = computed(() => user.value?.email || correo.value || '')

    const headers = () => ({ 'x-token': token.value })

    const notificarError = (error, mensajePorDefecto) => {
      Notify.create({
        type: 'negative',
        message: error.response?.data?.mensaje || mensajePorDefecto,
      })
    }

    // Para crear / editar / activar / inactivar
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

    // ── Lecturas ──
    // Admin: todos. Manejador: el backend devuelve solo su propio usuario.
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

    // Se deja por compatibilidad con UsuariosPage; hace lo mismo que obtenerUsuariosPorEmail
    const listardatosUsuario = (email) => obtenerUsuariosPorEmail(email)

    const obtenerUsuariosFiltrados = async (tipo, valor) => {
      loading.value = true
      try {
        const { data } = await axios.get('api/usuarios/filtrados', {
          params: { tipo, valor },
          headers: headers(),
        })
        return data
      } catch (error) {
        console.error(`No se pudo obtener los usuarios filtrados por ${tipo}:`, error)
        throw error
      } finally {
        loading.value = false
      }
    }

    // ── Escrituras ──
    const postUsuario = (data) =>
      enviar(
        'post',
        'api/usuarios/crear',
        data,
        'Usuario creado correctamente',
        'Error al registrar usuario',
      )

    const putUsuarios = (email, data) =>
      enviar(
        'put',
        `api/usuarios/editar/${email}`,
        data,
        'Usuario actualizado correctamente',
        'Error al actualizar usuario',
      )

    const putActivarUsuario = (email) =>
      enviar(
        'put',
        `api/usuarios/activar/${email}`,
        {},
        'Usuario activado',
        'Error al activar usuario',
      )

    const putInactivarUsuario = (email) =>
      enviar(
        'put',
        `api/usuarios/inactivar/${email}`,
        {},
        'Usuario inactivado',
        'Error al inactivar usuario',
      )

    const putUsuariospassword = async (email, data) => {
      loading.value = true
      try {
        return await axios.put(`api/usuarios/editarpassword/${email}`, data, { headers: headers() })
      } catch (error) {
        console.log('No se pudo actualizar la contraseña', error)
        return error
      } finally {
        loading.value = false
      }
    }

    // ── Notificaciones push ──
    const registrarTokenFCM = async (tokenFCM) => {
      try {
        loading.value = true
        const tokenActual = localStorage.getItem('fcm-token')

        if (tokenActual === tokenFCM) {
          console.log('El token FCM ya está registrado')
          return { success: true }
        }

        localStorage.setItem('fcm-token', tokenFCM)

        const response = await axios.post(
          'api/usuarios/registrar-token-fcm',
          { token: tokenFCM },
          { headers: { 'x-token': localStorage.getItem('x-token') } },
        )

        Notify.create({
          message: 'Notificaciones activadas correctamente',
          color: 'positive',
          position: 'bottom',
        })

        return response.data
      } catch (error) {
        Notify.create({
          type: 'negative',
          message: error.response?.data?.msg || 'Error al registrar notificaciones',
        })
        console.error(error)
        return { success: false }
      } finally {
        loading.value = false
      }
    }

    // ── Sesión ──
    const setToken = (newToken) => {
      token.value = newToken
      localStorage.setItem('x-token', newToken)
    }

    const eliminarToken = () => {
      token.value = ''
      localStorage.removeItem('x-token')
      localStorage.removeItem('usuarios-store')
      user.value = {}
      perfile.value = ''
      correo.value = ''
      usuarios.value = []

      // Si otro usuario inicia sesión en el mismo celular, no debe ver el caché del anterior
      useStoreCaninos().limpiar()
      useStoreCiudades().limpiar()
      useStoreDashboard().limpiar()
    }

    // login, validaremail, recuperación y cambio de contraseña conservan `return error`
    // porque LoginPage depende de ese comportamiento. Se ajustan cuando hagamos el tema del hash.
    const login = async (email, password) => {
      try {
        const res = await axios.post(
          'api/usuarios/login',
          { email, password },
          {
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            withCredentials: true,
          },
        )

        setToken(res.data.token)
        user.value = res.data.usuario
        perfile.value = res.data.usuario.perfil
        correo.value = res.data.usuario.email

        Notify.create({
          message: 'Bienvenido ' + res.data.usuario.nombre,
          color: 'positive',
          position: 'top',
        })

        setTimeout(async () => {
          try {
            const { inicializarNotificaciones } = useNotifications()
            await inicializarNotificaciones()
          } catch (error) {
            console.log('Error al inicializar notificaciones:', error)
          }
        }, 1000)

        return res
      } catch (error) {
        console.error('Error en el login:', error)
        const errorMessage =
          error.response?.data?.errors?.[0]?.msg ||
          error.response?.data?.error ||
          'Usuario o contraseña incorrecta'

        Notify.create({ type: 'negative', message: errorMessage })
        return error
      }
    }

    const validaremail = async (email) => {
      try {
        const res = await axios.get(`api/usuarios/email?email=${email}`)
        localStorage.setItem('x-token', res.data.token)
        return res
      } catch (error) {
        console.error('No se pudo obtener la informacion requerida', error)
        return error
      }
    }

    const solicitarRecuperacion = async (email) => {
      loading.value = true
      try {
        return await axios.post('api/usuarios/recuperar-password', { email })
      } catch (error) {
        notificarError(error, 'Error al enviar código')
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
        notificarError(error, 'Error al cambiar contraseña')
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
      isAuthenticated,
      // sesión
      esAdmin,
      ciudadUsuario,
      nombreUsuario,
      emailUsuario,
      // lecturas
      listarUsuario,
      obtenerUsuariosPorEmail,
      listardatosUsuario,
      obtenerUsuariosFiltrados,
      // escrituras
      postUsuario,
      putUsuarios,
      putActivarUsuario,
      putInactivarUsuario,
      putUsuariospassword,
      registrarTokenFCM,
      // auth
      login,
      validaremail,
      verificarCodigo,
      solicitarRecuperacion,
      cambiarPassword,
      eliminarToken,
    }
  },
  {
    // Sintaxis de pinia-plugin-persistedstate v4: `pick` (antes `paths`) y `afterHydrate` (antes `afterRestore`)
    persist: {
      key: 'usuarios-store',
      storage: localStorage,
      pick: ['token', 'user', 'perfile', 'correo'],
      afterHydrate: (ctx) => {
        console.log('Store rehidratado:', ctx.store.perfile)
      },
    },
  },
)
