import { useStoreCaninos } from '../stores/caninos'
import { useStoreCiudades } from '../stores/ciudades'
import { normalizar, capitalizar } from '../utils/texto'
import { ESTADOS_VENCIMIENTO } from '../utils/fechas'

// Piezas reutilizables para armar la config de filtros de cada módulo.

export const filtroTodos = (titulo, icono = 'list') => ({
  titulo,
  etiquetaChip: 'Todos',
  icono,
  color: 'primary',
})

/** Filtro por un campo de texto. Sin `opciones` → usa los valores distintos que existan */
export const filtroPorCampo = ({
  campo,
  titulo,
  etiquetaChip,
  icono = 'filter_list',
  color = 'blue',
  opciones,
  etiqueta = capitalizar,
  soloAdmin = false,
}) => ({ campo, titulo, etiquetaChip, icono, color, opciones, etiqueta, soloAdmin })

/** Solo muestra los caninos que tienen registros en la lista actual */
export const filtroCanino = (titulo = 'Por canino') => ({
  titulo,
  etiquetaChip: 'Canino',
  icono: 'pets',
  color: 'orange',
  campo: 'canino_id',
  opciones: (registros) => {
    const storeCaninos = useStoreCaninos()
    const ids = new Map()
    registros.forEach((registro) => {
      if (registro.canino_id) ids.set(normalizar(registro.canino_id), registro.canino_id)
    })
    return [...ids.values()]
      .map((id) => ({ valor: id, etiqueta: storeCaninos.nombreCanino(id) }))
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'))
  },
})

/** Para módulos con canino_id: compara contra la ciudad ACTUAL del canino (solo admin) */
export const filtroCiudadPorCanino = (titulo = 'Por ciudad') => ({
  titulo,
  etiquetaChip: 'Ciudad',
  icono: 'location_city',
  color: 'red',
  soloAdmin: true,
  opciones: () => useStoreCiudades().opcionesFiltroCiudades,
  comparar: (registro, valor) =>
    normalizar(useStoreCaninos().ciudadDeCanino(registro.canino_id)) === normalizar(valor),
})

/** Para módulos con ciudad_id propia: alimentación, chequeos, caninos (solo admin) */
export const filtroCiudadDirecta = (titulo = 'Por ciudad') => ({
  titulo,
  etiquetaChip: 'Ciudad',
  icono: 'location_city',
  color: 'red',
  soloAdmin: true,
  campo: 'ciudad_id',
  opciones: () => useStoreCiudades().opcionesFiltroCiudades,
})

/**
 * Filtro por estado de vencimiento. La página debe calcular `_estado` en cada registro
 * con estadoVencimiento() antes de pasarlos a useFiltrosLista.
 */
export const filtroVencimiento = ({ titulo, etiquetaChip = 'Alertas', icono = 'notification_important' }) => ({
  titulo,
  etiquetaChip,
  icono,
  color: 'deep-orange',
  campo: '_estado',
  opciones: [
    { valor: ESTADOS_VENCIMIENTO.VENCIDO, etiqueta: 'Vencidos' },
    { valor: ESTADOS_VENCIMIENTO.PROXIMO, etiqueta: 'Próximos a vencer' },
    { valor: ESTADOS_VENCIMIENTO.VIGENTE, etiqueta: 'Al día' },
  ],
})