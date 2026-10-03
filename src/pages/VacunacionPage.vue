<template>
  <q-page class="bg-grey-2">
    <q-pull-to-refresh color="primary" @refresh="refrescar">
      <div class="q-pa-md">
        <!-- Resumen de alertas: un toque filtra la lista -->
        <div v-if="resumen.vencidos || resumen.proximos" class="row q-gutter-sm q-mb-md">
          <q-btn
            v-if="resumen.vencidos"
            unelevated
            rounded
            no-caps
            color="red-1"
            text-color="red-9"
            icon="error_outline"
            :label="plural(resumen.vencidos, 'refuerzo vencido', 'refuerzos vencidos')"
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
            :label="plural(resumen.proximos, 'refuerzo próximo', 'refuerzos próximos')"
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
          placeholder-busqueda="Buscar por vacuna, lote, veterinario o canino"
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
          icono="vaccines"
          texto-vacio="Aún no hay vacunaciones registradas"
          texto-ayuda="Registre la primera para empezar a controlar los refuerzos."
          texto-accion="Registrar vacunación"
          @accion="abrirCrear"
          @limpiar="reiniciar"
        />

        <div v-if="!cargandoInicial" class="column q-gutter-y-sm lista-con-fab">
          <TarjetaRegistro
            v-for="registro in listaFiltrada"
            :key="registro.consecutivo"
            :titulo="registro.vacuna || 'Vacuna sin nombre'"
            :subtitulo="storeCaninos.nombreCanino(registro.canino_id)"
            :lineas="lineasTarjeta(registro)"
            :badges="[registro._badge]"
            icono="vaccines"
            v-bind="coloresPorEstado(registro._estado)"
            @click="verDetalle(registro)"
          />
        </div>
      </div>
    </q-pull-to-refresh>

    <!-- Detalle -->
    <DialogoDetalle
      v-model="mostrarDetalle"
      :titulo="detalle?.vacuna || ''"
      :subtitulo="detalle ? storeCaninos.nombreCanino(detalle.canino_id) : ''"
      icono="vaccines"
      v-bind="coloresPorEstado(detalle?._estado)"
      :badges="detalle ? [detalle._badge] : []"
      :campos="camposDetalle"
      :enlace="detalle?.link || ''"
      texto-enlace="Ver soporte de la vacunación"
      @editar="abrirEditar"
    >
      <template #superior>
        <q-banner v-if="detalle?._reemplazado" dense rounded class="bg-grey-3 text-grey-8 q-mb-md">
          <template #avatar>
            <q-icon name="history" />
          </template>
          Este canino tiene una aplicación más reciente de esta vacuna. Este registro queda como histórico y no
          genera alertas.
        </q-banner>
      </template>

      <template #acciones>
        <q-btn
          v-if="detalle && !detalle._reemplazado"
          flat
          no-caps
          color="primary"
          icon="add"
          label="Registrar refuerzo"
          @click="abrirRefuerzo"
        />
      </template>
    </DialogoDetalle>

    <!-- Formulario -->
    <DialogoFormulario
      v-model="mostrarFormulario"
      :titulo="tituloFormulario"
      :subtitulo="subtituloFormulario"
      :cargando="storeVacunacion.loading"
      :texto-guardar="esEdicion ? 'Guardar cambios' : 'Registrar vacunación'"
      :icono-guardar="esEdicion ? 'save' : 'add'"
      @guardar="guardar"
      @cerrar="resetear"
    >
      <div class="seccion-formulario">Aplicación</div>

      <SelectCanino v-model="formulario.canino_id" />

      <CampoSugerencias
        v-model="formulario.vacuna"
        label="Vacuna"
        icono="vaccines"
        :sugerencias="sugerenciasVacuna"
      />

      <CampoFecha v-model="formulario.fecha" label="Fecha de aplicación" :maximo="hoy()" />

      <q-input v-model.trim="formulario.lote" label="Lote" outlined rounded dense bg-color="white" />

      <CampoSugerencias
        v-model="formulario.veterinario"
        label="Veterinario"
        icono="medical_services"
        :sugerencias="sugerenciasVeterinario"
      />

      <div class="seccion-formulario">Próximo refuerzo</div>

      <CampoFecha
        v-model="formulario.proximo_refuerzo"
        label="Fecha del próximo refuerzo"
        :minimo="formulario.fecha"
        clearable
        hint="Déjelo vacío si esta vacuna no requiere refuerzo."
      />

      <div class="row q-gutter-sm">
        <q-chip
          v-for="atajo in ATAJOS_REFUERZO"
          :key="atajo.meses"
          clickable
          outline
          color="primary"
          :disable="!formulario.fecha"
          icon="event_repeat"
          @click="formulario.proximo_refuerzo = sumarMeses(formulario.fecha, atajo.meses)"
        >
          {{ atajo.etiqueta }}
        </q-chip>
      </div>

      <div class="seccion-formulario">Soporte</div>

      <CampoArchivos
        v-model="formulario.archivos"
        label="Carné o soporte de la vacunación"
        :link-actual="formulario.link"
      />
    </DialogoFormulario>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" aria-label="Registrar vacunación" @click="abrirCrear" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStoreVacunacion } from '../stores/vacunacion'
import { useStoreCaninos } from '../stores/caninos'
import { useStoreCiudades } from '../stores/ciudades'
import { useStoreUsuarios } from '../stores/usuarios'
import { useFiltrosLista } from '../composables/useFiltrosLista'
import { FILTROS_VACUNACION } from '../composables/filtrosmodulos'
import { normalizar, plural } from '../utils/texto'
import {
  hoy,
  formatearFecha,
  normalizarFecha,
  sumarMeses,
  mesesEntre,
  compararFechas,
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
import SelectCanino from '../components/SelectCanino.vue'
import CampoFecha from '../components/CampoFecha.vue'
import CampoArchivos from '../components/CampoArchivos.vue'
import CampoSugerencias from '../components/CampoSugerencias.vue'

defineOptions({ name: 'VacunacionPage' })

const route = useRoute()
const storeVacunacion = useStoreVacunacion()
const storeCaninos = useStoreCaninos()
const storeCiudades = useStoreCiudades()
const useUsuario = useStoreUsuarios()

// Base de sugerencias; se suman las vacunas que ya se hayan registrado
const VACUNAS_COMUNES = [
  'Rabia',
  'Múltiple (DHPPi-L)',
  'Parvovirus',
  'Moquillo',
  'Leptospirosis',
  'Tos de las perreras (Bordetella)',
  'Coronavirus canino',
]

const ATAJOS_REFUERZO = [
  { etiqueta: 'En 6 meses', meses: 6 },
  { etiqueta: 'En 1 año', meses: 12 },
]

// ─────────────────────────────────────────────────────────────
// Lista
// ─────────────────────────────────────────────────────────────

const registros = ref([])
const cargando = ref(false)
const cargandoInicial = computed(() => cargando.value && !registros.value.length)

/**
 * Calcula los campos internos (_estado, _badge, _reemplazado) que usan las tarjetas y los filtros.
 * Una vacuna con un refuerzo más reciente del mismo canino queda como histórica: no genera alerta.
 */
function prepararRegistros(lista) {
  const claveGrupo = (r) =>
    r.canino_id && r.vacuna ? `${normalizar(r.canino_id)}|${normalizar(r.vacuna)}` : ''

  return marcarReemplazados(lista, claveGrupo, 'fecha').map((registro) => {
    const estado = estadoVencimiento(registro.proximo_refuerzo, { reemplazado: registro._reemplazado })
    const badge =
      estado.estado === ESTADOS_VENCIMIENTO.SIN_FECHA ? { ...estado, etiqueta: 'Sin refuerzo' } : estado
    return { ...registro, _estado: estado.estado, _badge: badge }
  })
}

async function cargar() {
  cargando.value = true
  try {
    const [lista] = await Promise.all([
      storeVacunacion.obtenerVacunaciones(),
      // Los nombres y la ciudad de cada canino salen del caché de caninos
      storeCaninos.obtenerCaninos().catch(() => []),
    ])
    registros.value = prepararRegistros(Array.isArray(lista) ? lista : [])
  } finally {
    cargando.value = false
  }
}

async function refrescar(terminar) {
  await Promise.all([cargar(), storeCaninos.obtenerCaninos({ forzar: true }).catch(() => [])])
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
} = useFiltrosLista(FILTROS_VACUNACION.config, registros, {
  ...FILTROS_VACUNACION.opcionesLista,
  esAdmin: () => useUsuario.esAdmin,
})

const hayFiltros = computed(() => tipoLista.value !== 'todos' || Boolean(busqueda.value))

const resumen = computed(() => ({
  vencidos: registros.value.filter((r) => r._estado === ESTADOS_VENCIMIENTO.VENCIDO).length,
  proximos: registros.value.filter((r) => r._estado === ESTADOS_VENCIMIENTO.PROXIMO).length,
}))

function filtrarPorAlerta(estado) {
  seleccionarFiltro('alertas')
  valorFiltro.value = estado
}

/** Desde el detalle del canino (bloque 7) se llega con ?canino=ID */
function aplicarFiltroDesdeRuta() {
  const caninoId = route.query.canino
  if (!caninoId) return
  seleccionarFiltro('canino')
  valorFiltro.value = String(caninoId)
}

// ─────────────────────────────────────────────────────────────
// Presentación
// ─────────────────────────────────────────────────────────────

const COLORES_ESTADO = {
  [ESTADOS_VENCIMIENTO.VENCIDO]: { colorAvatar: 'red-1', colorTextoAvatar: 'red-9' },
  [ESTADOS_VENCIMIENTO.PROXIMO]: { colorAvatar: 'orange-1', colorTextoAvatar: 'orange-9' },
  [ESTADOS_VENCIMIENTO.VIGENTE]: { colorAvatar: 'teal-1', colorTextoAvatar: 'teal-9' },
}
const coloresPorEstado = (estado) => COLORES_ESTADO[estado] || { colorAvatar: 'grey-3', colorTextoAvatar: 'grey-7' }

const lineasTarjeta = (registro) => [
  `Aplicada el ${formatearFecha(registro.fecha)}`,
  registro.proximo_refuerzo && !registro._reemplazado
    ? `Refuerzo: ${formatearFecha(registro.proximo_refuerzo)}`
    : '',
]

// ─────────────────────────────────────────────────────────────
// Detalle
// ─────────────────────────────────────────────────────────────

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
    { etiqueta: 'Canino', valor: storeCaninos.nombreCanino(d.canino_id), completo: true },
    { etiqueta: 'Aplicada el', valor: formatearFecha(d.fecha) },
    { etiqueta: 'Próximo refuerzo', valor: d.proximo_refuerzo ? formatearFecha(d.proximo_refuerzo) : 'No requiere' },
    { etiqueta: 'Lote', valor: d.lote },
    { etiqueta: 'Veterinario', valor: d.veterinario },
    { etiqueta: 'Ciudad del canino', valor: storeCiudades.nombreCiudad(storeCaninos.ciudadDeCanino(d.canino_id)), ocultarSiVacio: true },
  ]
})

// ─────────────────────────────────────────────────────────────
// Formulario
// ─────────────────────────────────────────────────────────────

const mostrarFormulario = ref(false)
const esEdicion = ref(false)
const esRefuerzo = ref(false)

const nuevoFormulario = () => ({
  consecutivo: '',
  canino_id: '',
  vacuna: '',
  fecha: hoy(),
  lote: '',
  veterinario: '',
  proximo_refuerzo: '',
  link: '', // solo para avisar si ya tiene soporte
  archivos: [],
})

const formulario = ref(nuevoFormulario())

const tituloFormulario = computed(() => {
  if (esEdicion.value) return 'Editar vacunación'
  return esRefuerzo.value ? 'Registrar refuerzo' : 'Registrar vacunación'
})

const subtituloFormulario = computed(() =>
  formulario.value.canino_id ? storeCaninos.nombreCanino(formulario.value.canino_id) : 'Complete los datos de la aplicación',
)

const sugerenciasVacuna = computed(() => [...VACUNAS_COMUNES, ...registros.value.map((r) => r.vacuna)])
const sugerenciasVeterinario = computed(() => registros.value.map((r) => r.veterinario))

function abrirCrear() {
  esEdicion.value = false
  esRefuerzo.value = false
  formulario.value = nuevoFormulario()
  // Si la lista está filtrada por un canino, se preselecciona
  if (tipoLista.value === 'canino' && valorFiltro.value) formulario.value.canino_id = valorFiltro.value
  mostrarFormulario.value = true
}

/** Refuerzo: copia canino, vacuna y veterinario, y repite el intervalo de la aplicación anterior */
function abrirRefuerzo() {
  const d = detalle.value
  if (!d) return
  const intervalo = mesesEntre(d.fecha, d.proximo_refuerzo)

  esEdicion.value = false
  esRefuerzo.value = true
  formulario.value = {
    ...nuevoFormulario(),
    canino_id: d.canino_id,
    vacuna: d.vacuna,
    veterinario: d.veterinario,
    proximo_refuerzo: intervalo > 0 ? sumarMeses(hoy(), intervalo) : '',
  }
  mostrarDetalle.value = false
  mostrarFormulario.value = true
}

function abrirEditar() {
  const d = detalle.value
  if (!d) return
  esEdicion.value = true
  esRefuerzo.value = false

  const base = nuevoFormulario()
  Object.keys(base).forEach((clave) => {
    if (!Array.isArray(base[clave]) && d[clave] !== undefined) base[clave] = d[clave]
  })
  base.fecha = normalizarFecha(base.fecha)
  base.proximo_refuerzo = normalizarFecha(base.proximo_refuerzo)

  formulario.value = base
  mostrarFormulario.value = true
}

function resetear() {
  formulario.value = nuevoFormulario()
  esEdicion.value = false
  esRefuerzo.value = false
}

async function guardar() {
  const reglas = [
    { campo: 'canino_id', mensaje: 'Seleccione el canino' },
    { campo: 'vacuna', mensaje: 'Escriba el nombre de la vacuna' },
    { campo: 'fecha', mensaje: 'Seleccione la fecha de aplicación' },
    {
      campo: 'proximo_refuerzo',
      mensaje: 'El próximo refuerzo no puede ser antes de la fecha de aplicación',
      validar: (valor, datos) => !valor || compararFechas(valor, datos.fecha) >= 0,
    },
  ]
  if (!validarRequeridos(formulario.value, reglas)) return

  const datos = construirFormData(formulario.value, {
    archivos: formulario.value.archivos,
    excluir: ['consecutivo', 'link'],
  })

  try {
    if (esEdicion.value) {
      await storeVacunacion.putVacunacion(formulario.value.consecutivo, datos)
    } else {
      await storeVacunacion.postVacunacion(datos)
    }
    mostrarFormulario.value = false
    mostrarDetalle.value = false
    resetear()
    await cargar()
  } catch {
    // el store ya notificó; el formulario queda abierto para corregir
  }
}

onMounted(async () => {
  storeCiudades.obtenerCiudades()
  await cargar()
  aplicarFiltroDesdeRuta()
})
</script>

<style scoped>
.lista-con-fab {
  padding-bottom: 80px;
}
</style>