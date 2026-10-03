import { filtroTodos, filtroPorCampo, filtroCiudadDirecta } from './filtrosComunes'
import { aOpcionesFiltro } from '../utils/texto'
import { ESTADOS_REGISTRO } from './catalogos'

export const TIPOS_FILTRO = {
  TODOS: 'todos',
  ESTADO: 'estado',
  SEXO: 'sexo',
  RAZA: 'raza',
  ESPECIALIDAD: 'especialidad',
  CONTRATO: 'contrato',
  CIUDAD: 'ciudad',
}

// Sexo, raza, especialidad y contrato muestran solo los valores que existen en los caninos cargados
export const CONFIG_FILTROS = {
  [TIPOS_FILTRO.TODOS]: filtroTodos('Todos los caninos', 'pets'),

  [TIPOS_FILTRO.ESTADO]: filtroPorCampo({
    campo: 'estado',
    titulo: 'Caninos por estado',
    etiquetaChip: 'Estado',
    icono: 'toggle_on',
    color: 'green',
    opciones: aOpcionesFiltro(ESTADOS_REGISTRO),
  }),

  [TIPOS_FILTRO.SEXO]: filtroPorCampo({
    campo: 'sexo',
    titulo: 'Caninos por sexo',
    etiquetaChip: 'Sexo',
    icono: 'wc',
    color: 'purple',
  }),

  [TIPOS_FILTRO.RAZA]: filtroPorCampo({
    campo: 'raza',
    titulo: 'Caninos por raza',
    etiquetaChip: 'Raza',
    icono: 'pets',
    color: 'orange',
  }),

  [TIPOS_FILTRO.ESPECIALIDAD]: filtroPorCampo({
    campo: 'especialidad',
    titulo: 'Caninos por especialidad',
    etiquetaChip: 'Especialidad',
    icono: 'workspace_premium',
    color: 'blue',
  }),

  [TIPOS_FILTRO.CONTRATO]: filtroPorCampo({
    campo: 'contrato',
    titulo: 'Caninos por contrato',
    etiquetaChip: 'Contrato',
    icono: 'description',
    color: 'teal',
  }),

  [TIPOS_FILTRO.CIUDAD]: filtroCiudadDirecta('Caninos por ciudad'),
}

export const OPCIONES_LISTA_CANINOS = {
  compararOrden: (a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'),
  ordenInicial: 'asc',
  etiquetasOrden: { asc: 'A → Z', desc: 'Z → A' },
  camposBusqueda: ['nombre', 'microchip', 'raza'],
}