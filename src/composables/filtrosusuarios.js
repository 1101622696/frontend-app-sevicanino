import { filtroTodos, filtroPorCampo, filtroCiudadDirecta } from './filtrosComunes'
import { aOpcionesFiltro } from '../utils/texto'
import { PERFILES, ESTADOS_REGISTRO } from './catalogos'

// Solo el admin ve la lista de usuarios; el manejador ve "Mi perfil"
export const FILTROS_USUARIOS = {
  config: {
    todos: filtroTodos('Todos los usuarios', 'group'),
    perfil: filtroPorCampo({
      campo: 'perfil',
      titulo: 'Usuarios por perfil',
      etiquetaChip: 'Perfil',
      icono: 'badge',
      color: 'purple',
      opciones: aOpcionesFiltro(PERFILES),
    }),
    estado: filtroPorCampo({
      campo: 'estado',
      titulo: 'Usuarios por estado',
      etiquetaChip: 'Estado',
      icono: 'toggle_on',
      color: 'green',
      opciones: aOpcionesFiltro(ESTADOS_REGISTRO),
    }),
    ciudad: filtroCiudadDirecta('Usuarios por ciudad'),
  },
  opcionesLista: {
    compararOrden: (a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'),
    ordenInicial: 'asc',
    etiquetasOrden: { asc: 'A → Z', desc: 'Z → A' },
    camposBusqueda: ['nombre', 'email', 'cedula'],
  },
}