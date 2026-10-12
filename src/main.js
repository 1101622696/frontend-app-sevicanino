import { createApp } from 'vue'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createPinia } from 'pinia'
import { Quasar, Notify } from 'quasar'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import '@quasar/extras/material-icons/material-icons.css'
import Swal from 'sweetalert2'
import { useStoreUsuarios } from './stores/usuarios'

// axios.defaults.baseURL = 'http://localhost:4000/'
axios.defaults.baseURL = 'https://backend-app-canino.onrender.com'
// Render gratis tarda en despertar; más de 60 s ya es un problema de red
axios.defaults.timeout = 60000

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// ─────────────────────────────────────────────────────────────
// Spinner global. Las peticiones con { sinSpinner: true } no lo muestran
// (refresco de sesión al abrir la app, actualizaciones en segundo plano).
// ─────────────────────────────────────────────────────────────
let pendientes = 0

const mostrarSpinner = () => {
  pendientes++
  if (pendientes === 1) {
    Swal.fire({
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
    })
  }
}

const ocultarSpinner = () => {
  pendientes = Math.max(0, pendientes - 1)
  if (pendientes === 0) Swal.close()
}

axios.interceptors.request.use((config) => {
  if (!config.sinSpinner) mostrarSpinner()
  return config
})

// ─────────────────────────────────────────────────────────────
// Cierre de sesión SOLO cuando el backend dice que el token no sirve (401).
// Errores de red, 503 (hoja no disponible) o 500 no cierran la sesión.
// ─────────────────────────────────────────────────────────────
let cerrandoSesion = false

axios.interceptors.response.use(
  (response) => {
    if (!response.config?.sinSpinner) ocultarSpinner()
    return response
  },
  (error) => {
    if (!error.config?.sinSpinner) ocultarSpinner()

    const estado = error.response?.status
    const esLogin = error.config?.url?.includes('usuarios/login')

    if (estado === 401 && !esLogin && !cerrandoSesion) {
      cerrandoSesion = true
      const usuario = useStoreUsuarios(pinia)
      if (usuario.token) {
        Notify.create({
          type: 'warning',
          message: error.response?.data?.msg || 'Su sesión terminó. Inicie sesión de nuevo.',
        })
      }
      usuario.cerrarSesion()
      router.replace('/').finally(() => {
        cerrandoSesion = false
      })
    } else if (estado === 503) {
      Notify.create({
        type: 'warning',
        message: error.response?.data?.msg || 'El servidor no está disponible. Intente de nuevo en un momento.',
      })
    } else if (!error.response && !esLogin) {
      Notify.create({
        type: 'warning',
        message: 'Sin conexión con el servidor. Revise su internet e intente de nuevo.',
      })
    }

    return Promise.reject(error)
  },
)

const myApp = createApp(App)
myApp.use(pinia)
myApp.use(router)
myApp.use(Quasar, {
  plugins: { Notify },
  config: {
    notify: {
      position: 'top',
      timeout: 2500,
      textColor: 'white',
      actions: [{ icon: 'close', color: 'white' }],
      color: 'red',
    },
  },
})

myApp.mount('#app')