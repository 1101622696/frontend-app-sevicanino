<template>
  <q-page class="bg-grey-2">
    <q-pull-to-refresh color="primary" @refresh="refrescar">
      <div class="q-pa-md">
        <!-- Manejador: estado del aseo de SU ciudad, lo único que necesita saber al entrar -->
        <div v-if="!useUsuario.esAdmin && ultimoDeMiCiudad" class="estado-ciudad row items-center no-wrap q-mb-md">
          <q-avatar size="44px" v-bind="avatarEstado(ultimoDeMiCiudad._estado)" icon="cleaning_services" class="q-mr-md" />
          <div class="col">
            <div class="text-body2 text-weight-medium">
              Próximo aseo: {{ formatearFecha(ultimoDeMiCiudad.fecha_proxima_aseo) }}
            </div>
            <div class="text-caption text-grey-7">
              {{ ultimoDeMiCiudad._badge.etiqueta }}. Último aseo el {{ formatearFecha(ultimoDeMiCiudad.fecha_aseo) }}.
            </div>
          </div>
        </div>

        <!-- Admin: ciudades con el aseo vencido o próximo -->
        <div v-if="useUsuario.esAdmin && (resumen.vencidos || resumen.proximos)" class="row q-gutter-sm q-mb-md">
          <q-btn
            v-if="resumen.vencidos"
            unelevated
            rounded
            no-caps
            color="red-1"
            text-color="red-9"
            icon="error_outline"
            :label="plural(resumen.vencidos, 'ciudad con aseo vencido', 'ciudades con aseo vencido')"
            @click="filtrarPorAlerta(ESTADOS_VENCIMIENTO.VENCIDO)"
          />
          <q-btn
            v-if="resumen.proximos"
            unelevated
            rounded
            no-caps
            color="orange-1"
            text-color="orange-9"
            icon="schedule"
            :label="plural(resumen.proximos, 'ciudad con aseo próximo', 'ciudades con aseo próximo')"
            @click="filtrarPorAlerta(ESTADOS_VENCIMIENTO.PROXIMO)"
          />
        </div>

        <BarraFiltros
          :filtros="filtrosVisibles"
          :tipo-activo="tipoLista"
          :opciones="opcionesFiltro"
          :tiene-valor="tieneValor"
          :opciones-orden="opcionesOrden"
          v-model:valor="valorFiltro"
          v-model:orden="orden"
          v-model:busqueda="busqueda"
          placeholder-busqueda="Buscar en los detalles o por quién registró"
          class="q-mb-md"
          @seleccionar="seleccionarFiltro"
        />

        <EncabezadoLista
          :titulo="filtroActual.titulo"
          :detalle="etiquetaValorFiltro"
          :icono="filtroActual.icono"
          :color="filtroActual.color"
          :total="listaFiltrada.length"
        />

        <EstadoLista
          :cargando="cargandoInicial"
          :vacio="!cargandoInicial && !listaFiltrada.length"
          :hay-filtros="hayFiltros"
          icono="cleaning_services"
          texto-vacio="Aún no hay chequeos de aseo registrados"
          texto-ayuda="Al registrar un aseo, la app calcula la fecha del siguiente (tres meses después)."
          texto-accion="Registrar aseo"
          @accion="abrirCrear"
          @limpiar="reiniciar"
        />

        <div v-if="!cargandoInicial" class="column q-gutter-y-sm lista-con-fab">
          <TarjetaRegistro
            v-for="registro in listaFiltrada"
            :key="registro.consecutivo"
            :titulo="`Aseo del ${formatearFecha(registro.fecha_aseo)}`"
            :subtitulo="storeCiudades.nombreCiudad(registro.ciudad_id)"
            :lineas="lineasTarjeta(registro)"
            :badges="[registro._badge]"
            icono="cleaning_services"
            v-bind="coloresPorEstado(registro._estado)"
            @click="verDetalle(registro)"
          />
        </div>
      </div>
    </q-pull-to-refresh>

    <!-- Detalle -->
    <DialogoDetalle
      v-model="mostrarDetalle"
      :titulo="detalle ? `Aseo del ${formatearFecha(detalle.fecha_aseo)}` : ''"
      :subtitulo="detalle ? storeCiudades.nombreCiudad(detalle.ciudad_id) : ''"
      icono="cleaning_services"
      v-bind="coloresPorEstado(detalle?._estado)"
      :badges="detalle ? [detalle._badge] : []"
      :campos="camposDetalle"
      :enlace="detalle?.link || ''"
      texto-enlace="Ver fotos del aseo"
      @editar="abrirEditar"
    >
      <template #superior>
        <q-banner v-if="detalle?._reemplazado" dense rounded class="bg-grey-3 text-grey-8 q-mb-md">
          <template #avatar>
            <q-icon name="history" />
          </template>
          Esta ciudad tiene un aseo más reciente. Este registro queda como histórico.
        </q-banner>
      </template>
    </DialogoDetalle>

    <!-- Formulario -->
    <DialogoFormulario
      v-model="mostrarFormulario"
      :titulo="esEdicion ? 'Editar chequeo' : 'Registrar aseo'"
      subtitulo="Fecha del aseo y lo que se revisó"
      :cargando="storeChequeos.loading"
      :texto-guardar="esEdicion ? 'Guardar cambios' : 'Registrar aseo'"
      :icono-guardar="esEdicion ? 'save' : 'add'"
      @guardar="guardar"
      @cerrar="resetear"
    >
      <div class="seccion-formulario">Aseo</div>

      <CampoCiudad v-model="formulario.ciudad_id" :bloqueada="!useUsuario.esAdmin" />

      <CampoFecha v-model="formulario.fecha_aseo" label="Fecha del aseo" :maximo="hoy()" />

      <div v-if="formulario.fecha_aseo" class="aviso-proximo row items-center no-wrap">
        <q-icon name="event_repeat" color="primary" class="q-mr-sm" />
        <span class="text-body2">
          El próximo aseo quedará para el <strong>{{ formatearFecha(sumarMeses(formulario.fecha_aseo, 3)) }}</strong>
        </span>
      </div>

      <div class="seccion-formulario">Qué se revisó</div>

      <!-- Atajos: agregan una línea al detalle; el texto se puede editar libremente -->
      <div class="row q-gutter-xs">
        <q-chip
          v-for="item in ITEMS_REVISION"
          :key="item"
          clickable
          :outline="!detallesIncluye(item)"
          :color="detallesIncluye(item) ? 'primary' : 'grey-7'"
          :text-color="detallesIncluye(item) ? 'white' : undefined"
          :icon="detallesIncluye(item) ? 'check' : 'add'"
          @click="alternarItem(item)"
        >
          {{ item }}
        </q-chip>
      </div>

      <q-input
        v-model="formulario.detalles"
        label="Detalles"
        type="textarea"
        autogrow
        outlined
        rounded
        dense
        bg-color="white"
        hint="Use los botones de arriba o escriba lo que se hizo y cualquier novedad."
      />

      <div class="seccion-formulario">Soporte</div>

      <CampoArchivos v-model="formulario.archivos" label="Fotos del aseo" :link-actual="formulario.link" />
    </DialogoFormulario>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" aria-label="Registrar aseo" @click="abrirCrear" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStoreChequeos } from '../stores/chequeos'
import { useStoreCiudades } from '../stores/ciudades'
import { useStoreUsuarios } from '../stores/usuarios'
import { useFiltrosLista } from '../composables/useFiltrosLista'
import { FILTROS_CHEQUEOS } from '../composables/filtrosmodulos'
import { normalizar, plural } from '../utils/texto'
import {
  hoy,
  formatearFecha,
  normalizarFecha,
  sumarMeses,
  marcarReemplazados,
  estadoVencimiento,
  ESTADOS_VENCIMIENTO,
} from '../utils/fechas'
import { construirFormData, validarRequeridos } from '../utils/formulario'

import BarraFiltros from '../components/BarraFiltros.vue'
import EncabezadoLista from '../components/EncabezadoLista.vue'
import EstadoLista from '../components/EstadoLista.vue'
import TarjetaRegistro from '../components/TarjetaRegistro.vue'
import DialogoDetalle from '../components/DialogoDetalle.vue'
import DialogoFormulario from '../components/DialogoFormulario.vue'
import CampoFecha from '../components/CampoFecha.vue'
import CampoArchivos from '../components/CampoArchivos.vue'
import CampoCiudad from '../components/CampoCiudad.vue'

defineOptions({ name: 'ChequeosPage' })

const storeChequeos = useStoreChequeos()
const storeCiudades = useStoreCiudades()
const useUsuario = useStoreUsuarios()

const ITEMS_REVISION = [
  'Caniles',
  'Comederos y bebederos',
  'Patio o zona de paseo',
  'Desinfección',
  'Control de plagas',
  'Bodega de alimento',
]

// ── Lista ──
const registros = ref([])
const cargando = ref(false)
const cargandoInicial = computed(() => cargando.value && !registros.value.length)

/** Solo el último aseo de cada ciudad genera alerta; los anteriores quedan como históricos */
function prepararRegistros(lista) {
  return marcarReemplazados(lista, (r) => normalizar(r.ciudad_id), 'fecha_aseo').map((registro) => {
    const estado = estadoVencimiento(registro.fecha_proxima_aseo, {
      reemplazado: registro._reemplazado,
      diasAviso: 15,
    })
    return { ...registro, _estado: estado.estado, _badge: estado }
  })
}

async function cargar() {
  cargando.value = true
  try {
    const lista = await storeChequeos.obtenerChequeos()
    registros.value = prepararRegistros(Array.isArray(lista) ? lista : [])
  } finally {
    cargando.value = false
  }
}

async function refrescar(terminar) {
  await Promise.all([cargar(), storeCiudades.obtenerCiudades({ forzar: true })])
  terminar()
}

const {
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
} = useFiltrosLista(FILTROS_CHEQUEOS.config, registros, {
  ...FILTROS_CHEQUEOS.opcionesLista,
  esAdmin: () => useUsuario.esAdmin,
})

const hayFiltros = computed(() => tipoLista.value !== 'todos' || Boolean(busqueda.value))

// Cada ciudad tiene un solo registro vigente, así que contar registros = contar ciudades
const resumen = computed(() => ({
  vencidos: registros.value.filter((r) => r._estado === ESTADOS_VENCIMIENTO.VENCIDO).length,
  proximos: registros.value.filter((r) => r._estado === ESTADOS_VENCIMIENTO.PROXIMO).length,
}))

const ultimoDeMiCiudad = computed(() =>
  registros.value.find(
    (r) => !r._reemplazado && normalizar(r.ciudad_id) === normalizar(useUsuario.ciudadUsuario),
  ),
)

function filtrarPorAlerta(estado) {
  seleccionarFiltro('alertas')
  valorFiltro.value = estado
}

// ── Presentación ──
const COLORES_ESTADO = {
  [ESTADOS_VENCIMIENTO.VENCIDO]: { colorAvatar: 'red-1', colorTextoAvatar: 'red-9' },
  [ESTADOS_VENCIMIENTO.PROXIMO]: { colorAvatar: 'orange-1', colorTextoAvatar: 'orange-9' },
  [ESTADOS_VENCIMIENTO.VIGENTE]: { colorAvatar: 'teal-1', colorTextoAvatar: 'teal-9' },
}
const coloresPorEstado = (estado) => COLORES_ESTADO[estado] || { colorAvatar: 'grey-3', colorTextoAvatar: 'grey-7' }

const avatarEstado = (estado) => {
  const colores = coloresPorEstado(estado)
  return { color: colores.colorAvatar, textColor: colores.colorTextoAvatar }
}

const lineasTarjeta = (registro) => [
  !registro._reemplazado && registro.fecha_proxima_aseo ? `Próximo: ${formatearFecha(registro.fecha_proxima_aseo)}` : '',
  registro.registrado_por ? `Por ${registro.registrado_por}` : '',
]

// ── Detalle ──
const mostrarDetalle = ref(false)
const detalle = ref(null)

function verDetalle(registro) {
  detalle.value = registro
  mostrarDetalle.value = true
}

const camposDetalle = computed(() => {
  const d = detalle.value
  if (!d) return []
  return [
    { etiqueta: 'Fecha del aseo', valor: formatearFecha(d.fecha_aseo) },
    { etiqueta: 'Próximo aseo', valor: formatearFecha(d.fecha_proxima_aseo) },
    { etiqueta: 'Registrado por', valor: d.registrado_por },
    { etiqueta: 'Registrado el', valor: formatearFecha(d.fecha_registro) },
    { etiqueta: 'Detalles', valor: d.detalles, completo: true },
  ]
})

// ── Formulario ──
const mostrarFormulario = ref(false)
const esEdicion = ref(false)

// fecha_proxima_aseo, registrado_por y fecha_registro los calcula el backend
const nuevoFormulario = () => ({
  consecutivo: '',
  ciudad_id: useUsuario.esAdmin ? '' : useUsuario.ciudadUsuario,
  fecha_aseo: hoy(),
  detalles: '',
  link: '',
  archivos: [],
})

const formulario = ref(nuevoFormulario())

// Los atajos se guardan como líneas "- Caniles" dentro del texto
const lineaItem = (item) => `- ${item}`

const detallesIncluye = (item) =>
  formulario.value.detalles.split('\n').some((linea) => linea.trim() === lineaItem(item))

function alternarItem(item) {
  const lineas = formulario.value.detalles.split('\n')
  if (detallesIncluye(item)) {
    formulario.value.detalles = lineas.filter((linea) => linea.trim() !== lineaItem(item)).join('\n')
  } else {
    const texto = formulario.value.detalles.trim()
    formulario.value.detalles = texto ? `${texto}\n${lineaItem(item)}` : lineaItem(item)
  }
}

function abrirCrear() {
  esEdicion.value = false
  formulario.value = nuevoFormulario()
  if (useUsuario.esAdmin && tipoLista.value === 'ciudad' && valorFiltro.value) {
    formulario.value.ciudad_id = valorFiltro.value
  }
  mostrarFormulario.value = true
}

function abrirEditar() {
  const d = detalle.value
  if (!d) return
  esEdicion.value = true
  const base = nuevoFormulario()
  Object.keys(base).forEach((clave) => {
    if (!Array.isArray(base[clave]) && d[clave] !== undefined) base[clave] = d[clave]
  })
  base.fecha_aseo = normalizarFecha(base.fecha_aseo)
  base.detalles = base.detalles || ''
  formulario.value = base
  mostrarFormulario.value = true
}

function resetear() {
  formulario.value = nuevoFormulario()
  esEdicion.value = false
}

async function guardar() {
  const reglas = [
    { campo: 'ciudad_id', mensaje: 'Seleccione la ciudad' },
    { campo: 'fecha_aseo', mensaje: 'Seleccione la fecha del aseo' },
  ]
  if (!validarRequeridos(formulario.value, reglas)) return

  const datos = construirFormData(formulario.value, {
    archivos: formulario.value.archivos,
    excluir: ['consecutivo', 'link'],
  })

  try {
    if (esEdicion.value) {
      await storeChequeos.putChequeo(formulario.value.consecutivo, datos)
    } else {
      await storeChequeos.postChequeo(datos)
    }
    mostrarFormulario.value = false
    mostrarDetalle.value = false
    resetear()
    await cargar()
  } catch {
    // el store ya notificó
  }
}

onMounted(() => {
  storeCiudades.obtenerCiudades()
  cargar()
})
</script>

<style scoped>
.lista-con-fab {
  padding-bottom: 80px;
}

.estado-ciudad {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 12px 16px;
}

.aviso-proximo {
  background: #e3f2fd;
  border-radius: 10px;
  padding: 8px 12px;
}
</style>