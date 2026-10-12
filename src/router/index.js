import { createRouter, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useStoreUsuarios } from '../stores/usuarios'

// Hash (#/) es lo más seguro en Capacitor. Si hoy usas otro modo y te funciona, conserva el tuyo
// y copia solo el beforeEach.
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

// ─────────────────────────────────────────────────────────────
// Guarda de sesión:
//  - Con token guardado, abrir la app (ruta '/') va directo al inicio, sin pasar por el login.
//  - Sin token, cualquier página protegida manda al login.
//  - Una página con meta.perfiles que no incluye el perfil del usuario lo devuelve al inicio.
// ─────────────────────────────────────────────────────────────
router.beforeEach((to) => {
  const usuario = useStoreUsuarios()
  const conSesion = usuario.isAuthenticated

  if (to.path === '/') {
    return conSesion ? { name: 'HomePage' } : true
  }

  if (!conSesion) return { path: '/' }

  const perfiles = to.meta?.perfiles
  const perfil = usuario.user?.perfil || usuario.perfile
  if (Array.isArray(perfiles) && perfiles.length && !perfiles.includes(perfil)) {
    return { name: 'HomePage' }
  }

  return true
})

export default router