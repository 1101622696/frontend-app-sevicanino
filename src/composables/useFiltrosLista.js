import { ref, computed, watch } from 'vue'
import { normalizar, capitalizar } from '../utils/texto'
import { compararFechas } from '../utils/fechas'

/**
 * Filtros, búsqueda y orden 100 % en el front, sobre una lista ya restringida por el backend.
 *
 * Cada filtro de la config puede tener:
 *   titulo, etiquetaChip, icono, color
 *   campo       → campo del registro a comparar
 *   opciones    → array [{ valor, etiqueta }] | función (registros) => array | ausente = valores distintos del campo
 *   etiqueta    → función (valor) => texto, para opciones dinámicas
 *   comparar    → función (registro, valor) => boolean, para filtros calculados (estado de vencimiento, ciudad del canino)
 *   soloAdmin   → true para ocultarlo al manejador
 * El filtro sin campo ni comparar (el de "todos") no filtra.
 *
 * @param {Object} configFiltros
 * @param {import('vue').Ref<Array>} registros
 * @param {Object} opciones
 *   campoOrden      → campo de fecha para ordenar
 *   compararOrden   → (a, b) => número, si no se ordena por fecha
 *   ordenInicial    → 'desc' | 'asc'
 *   etiquetasOrden  → { desc, asc }
 *   camposBusqueda  → ['campo', (registro) => texto, ...]
 *   esAdmin         → () => boolean
 */
export function useFiltrosLista(configFiltros, registros, opciones = {}) {
  const {
    campoOrden = null,
    compararOrden = null,
    ordenInicial = 'desc',
    etiquetasOrden = { desc: 'Más recientes', asc: 'Más antiguos' },
    camposBusqueda = [],
    esAdmin = () => false,
  } = opciones

  const tipoLista = ref('todos')
  const valorFiltro = ref(null)
  const orden = ref(ordenInicial)
  const busqueda = ref('')

  const filtrosVisibles = computed(() =>
    Object.fromEntries(
      Object.entries(configFiltros).filter(([, filtro]) => !filtro.soloAdmin || esAdmin()),
    ),
  )

  const filtroActual = computed(() => configFiltros[tipoLista.value] || configFiltros.todos)

  const tieneValor = computed(() =>
    Boolean(filtroActual.value?.campo || filtroActual.value?.comparar),
  )

  const valoresDistintos = (lista, campo, etiqueta = capitalizar) => {
    const unicos = new Map()
    lista.forEach((registro) => {
      const valor = registro[campo]
      if (valor && !unicos.has(normalizar(valor))) unicos.set(normalizar(valor), valor)
    })
    return [...unicos.values()]
      .map((valor) => ({ valor, etiqueta: etiqueta(valor) }))
      .sort((a, b) => String(a.etiqueta).localeCompare(String(b.etiqueta), 'es'))
  }

  const opcionesFiltro = computed(() => {
    if (!tieneValor.value) return []
    const filtro = filtroActual.value
    const lista = registros.value || []

    if (typeof filtro.opciones === 'function') return filtro.opciones(lista) || []
    if (Array.isArray(filtro.opciones)) return filtro.opciones
    return valoresDistintos(lista, filtro.campo, filtro.etiqueta)
  })

  // Si llegan datos nuevos y el valor seleccionado ya no existe, toma la primera opción
  watch(opcionesFiltro, (lista) => {
    if (!tieneValor.value) {
      valorFiltro.value = null
      return
    }
    const existe = lista.some((op) => normalizar(op.valor) === normalizar(valorFiltro.value))
    if (!existe) valorFiltro.value = lista[0]?.valor ?? null
  })

  function seleccionarFiltro(tipo) {
    tipoLista.value = tipo
    // opcionesFiltro es computed: ya está recalculado para el nuevo tipo
    valorFiltro.value = tieneValor.value ? (opcionesFiltro.value[0]?.valor ?? null) : null
  }

  const etiquetaValorFiltro = computed(() => {
    if (!tieneValor.value || valorFiltro.value == null) return ''
    const opcion = opcionesFiltro.value.find(
      (op) => normalizar(op.valor) === normalizar(valorFiltro.value),
    )
    return opcion?.etiqueta || valorFiltro.value
  })

  const comparador = compararOrden
    || (campoOrden ? (a, b) => compararFechas(a[campoOrden], b[campoOrden]) : null)

  const opcionesOrden = comparador
    ? [
        { value: 'desc', label: etiquetasOrden.desc },
        { value: 'asc', label: etiquetasOrden.asc },
      ]
    : []

  const listaFiltrada = computed(() => {
    let lista = Array.isArray(registros.value) ? registros.value : []
    const filtro = filtroActual.value

    if (tieneValor.value && valorFiltro.value != null && valorFiltro.value !== '') {
      lista = lista.filter((registro) =>
        filtro.comparar
          ? filtro.comparar(registro, valorFiltro.value)
          : normalizar(registro[filtro.campo]) === normalizar(valorFiltro.value),
      )
    }

    const texto = normalizar(busqueda.value)
    if (texto && camposBusqueda.length) {
      lista = lista.filter((registro) =>
        camposBusqueda.some((campo) => {
          const valor = typeof campo === 'function' ? campo(registro) : registro[campo]
          return normalizar(valor).includes(texto)
        }),
      )
    }

    if (comparador) {
      const signo = orden.value === 'desc' ? -1 : 1
      lista = [...lista].sort((a, b) => comparador(a, b) * signo)
    }

    return lista
  })

  function reiniciar() {
    tipoLista.value = 'todos'
    valorFiltro.value = null
    orden.value = ordenInicial
    busqueda.value = ''
  }

  return {
    tipoLista,
    valorFiltro,
    orden,
    busqueda,
    filtrosVisibles,
    filtroActual,
    tieneValor,
    opcionesFiltro,
    etiquetaValorFiltro,
    opcionesOrden,
    listaFiltrada,
    seleccionarFiltro,
    reiniciar,
  }
}