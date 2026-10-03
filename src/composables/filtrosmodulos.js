import {
  filtroTodos,
  filtroPorCampo,
  filtroCanino,
  filtroCiudadPorCanino,
  filtroCiudadDirecta,
  filtroVencimiento,
} from './filtrosComunes'
import { useStoreCaninos } from '../stores/caninos'
import { ESTADOS_TRATAMIENTO } from '../utils/fechas'

// Cada módulo exporta { config, opcionesLista } para useFiltrosLista(config, registros, opcionesLista).
// `esAdmin` se agrega en la página: { ...FILTROS_X.opcionesLista, esAdmin: () => useUsuario.esAdmin }

const nombreDelCanino = (registro) => useStoreCaninos().nombreCanino(registro.canino_id)

export const FILTROS_VACUNACION = {
  config: {
    todos: filtroTodos('Todas las vacunaciones', 'vaccines'),
    canino: filtroCanino(),
    alertas: filtroVencimiento({ titulo: 'Refuerzos', etiquetaChip: 'Refuerzos' }), // requiere _estado
    vacuna: filtroPorCampo({ campo: 'vacuna', titulo: 'Por vacuna', etiquetaChip: 'Vacuna', icono: 'medication', color: 'teal' }),
    ciudad: filtroCiudadPorCanino(),
  },
  opcionesLista: {
    campoOrden: 'fecha',
    camposBusqueda: ['vacuna', 'lote', 'veterinario', nombreDelCanino],
  },
}

export const FILTROS_PROFILAXIS = {
  config: {
    todos: filtroTodos('Toda la profilaxis', 'sanitizer'),
    canino: filtroCanino(),
    tipo: filtroPorCampo({ campo: 'tipo', titulo: 'Por tipo', etiquetaChip: 'Tipo', icono: 'category', color: 'indigo' }),
    ciudad: filtroCiudadPorCanino(),
  },
  opcionesLista: {
    campoOrden: 'fecha',
    camposBusqueda: ['tipo', 'observaciones', 'realizado_por', nombreDelCanino],
  },
}

export const FILTROS_REVISIONES = {
  config: {
    todos: filtroTodos('Todas las revisiones', 'fact_check'),
    canino: filtroCanino(),
    tipo: filtroPorCampo({ campo: 'tipo', titulo: 'Por tipo', etiquetaChip: 'Tipo', icono: 'category', color: 'indigo' }),
    ciudad: filtroCiudadPorCanino(),
  },
  opcionesLista: {
    campoOrden: 'fecha',
    camposBusqueda: ['tipo', 'descripcion', 'resultado_revision', 'veterinario', nombreDelCanino],
  },
}

export const FILTROS_SINIESTROS = {
  config: {
    todos: filtroTodos('Todos los siniestros', 'report'),
    canino: filtroCanino(),
    tipo: filtroPorCampo({ campo: 'tipo', titulo: 'Por tipo', etiquetaChip: 'Tipo', icono: 'category', color: 'indigo' }),
    ciudad: filtroCiudadPorCanino(),
  },
  opcionesLista: {
    campoOrden: 'fecha',
    camposBusqueda: ['tipo', 'descripcion', nombreDelCanino],
  },
}

export const FILTROS_TRATAMIENTOS = {
  config: {
    todos: filtroTodos('Todos los tratamientos', 'medication'),
    canino: filtroCanino(),
    estado: filtroPorCampo({
      campo: '_estado', // requiere _estado calculado con estadoTratamiento()
      titulo: 'Por estado',
      etiquetaChip: 'Estado',
      icono: 'timelapse',
      color: 'green',
      opciones: [
        { valor: ESTADOS_TRATAMIENTO.EN_CURSO, etiqueta: 'En curso' },
        { valor: ESTADOS_TRATAMIENTO.PROGRAMADO, etiqueta: 'Programados' },
        { valor: ESTADOS_TRATAMIENTO.FINALIZADO, etiqueta: 'Finalizados' },
      ],
    }),
    ciudad: filtroCiudadPorCanino(),
  },
  opcionesLista: {
    campoOrden: 'fecha_inicio',
    camposBusqueda: ['medicamento', 'motivo', 'veterinario', 'dosis', nombreDelCanino],
  },
}

export const FILTROS_ACTIVIDADES = {
  config: {
    todos: filtroTodos('Todas las actividades', 'event_note'),
    canino: filtroCanino(),
    manejador: filtroPorCampo({
      campo: 'usuario_manejador',
      titulo: 'Por manejador',
      etiquetaChip: 'Manejador',
      icono: 'badge',
      color: 'purple',
    }),
    ciudad: filtroCiudadPorCanino(),
  },
  opcionesLista: {
    campoOrden: 'fecha_hora',
    camposBusqueda: ['asunto', 'detalle', 'usuario_manejador', nombreDelCanino],
  },
}

export const FILTROS_ALIMENTACION = {
  config: {
    todos: filtroTodos('Todos los ingresos', 'inventory_2'),
    ciudad: filtroCiudadDirecta(),
  },
  opcionesLista: {
    campoOrden: 'fecha_ingreso',
    camposBusqueda: ['ingresado_por', 'kg_ingresados'],
  },
}

export const FILTROS_CHEQUEOS = {
  config: {
    todos: filtroTodos('Todos los chequeos', 'cleaning_services'),
    alertas: filtroVencimiento({ titulo: 'Próximo aseo', etiquetaChip: 'Próximo aseo' }), // requiere _estado
    ciudad: filtroCiudadDirecta(),
  },
  opcionesLista: {
    campoOrden: 'fecha_aseo',
    camposBusqueda: ['detalles', 'registrado_por'],
  },
}