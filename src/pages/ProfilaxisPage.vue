<template>
  <q-page class="bg-grey-2">
    <q-pull-to-refresh color="primary" @refresh="refrescar">
      <div class="q-pa-md">
        <BarraFiltros
          :filtros="filtrosVisibles"
          :tipo-activo="tipoLista"
          :opciones="opcionesFiltro"
          :tiene-valor="tieneValor"
          :opciones-orden="opcionesOrden"
          v-model:valor="valorFiltro"
          v-model:orden="orden"
          v-model:busqueda="busqueda"
          placeholder-busqueda="Buscar por tipo, observaciones o canino"
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
          icono="sanitizer"
          texto-vacio="Aún no hay registros de profilaxis"
          texto-ayuda="Registre desparasitaciones, baños medicados y demás cuidados preventivos."
          texto-accion="Registrar profilaxis"
          @accion="abrirCrear"
          @limpiar="reiniciar"
        />

        <div v-if="!cargandoInicial" class="column q-gutter-y-sm lista-con-fab">
          <TarjetaRegistro
            v-for="registro in listaFiltrada"
            :key="registro.consecutivo"
            :titulo="registro.tipo || 'Profilaxis'"
            :subtitulo="storeCaninos.nombreCanino(registro.canino_id)"
            :lineas="[formatearFecha(registro.fecha), registro.realizado_por ? `Por ${registro.realizado_por}` : '']"
            icono="sanitizer"
            color-avatar="indigo-1"
            color-texto-avatar="indigo-9"
            @click="verDetalle(registro)"
          />
        </div>
      </div>
    </q-pull-to-refresh>

    <!-- Detalle -->
    <DialogoDetalle
      v-model="mostrarDetalle"
      :titulo="detalle?.tipo || 'Profilaxis'"
      :subtitulo="detalle ? storeCaninos.nombreCanino(detalle.canino_id) : ''"
      icono="sanitizer"
      color-avatar="indigo-1"
      color-texto-avatar="indigo-9"
      :campos="camposDetalle"
      :enlace="detalle?.link || ''"
      texto-enlace="Ver soporte"
      @editar="abrirEditar"
    >
      <template #acciones>
        <q-btn
          v-if="detalle"
          flat
          no-caps
          color="primary"
          icon="content_copy"
          label="Repetir"
          @click="abrirRepetir"
        />
      </template>
    </DialogoDetalle>

    <!-- Formulario -->
    <DialogoFormulario
      v-model="mostrarFormulario"
      :titulo="esEdicion ? 'Editar profilaxis' : 'Registrar profilaxis'"
      :subtitulo="formulario.canino_id ? storeCaninos.nombreCanino(formulario.canino_id) : 'Complete los datos del procedimiento'"
      :cargando="storeProfilaxis.loading"
      :texto-guardar="esEdicion ? 'Guardar cambios' : 'Registrar profilaxis'"
      :icono-guardar="esEdicion ? 'save' : 'add'"
      @guardar="guardar"
      @cerrar="resetear"
    >
      <div class="seccion-formulario">Procedimiento</div>

      <SelectCanino v-model="formulario.canino_id" />

      <CampoSugerencias v-model="formulario.tipo" label="Tipo" icono="category" :sugerencias="sugerenciasTipo" />

      <CampoFecha v-model="formulario.fecha" label="Fecha" :maximo="hoy()" />

      <CampoSugerencias
        v-model="formulario.realizado_por"
        label="Realizado por"
        icono="person"
        :sugerencias="sugerenciasRealizadoPor"
      />

      <q-input
        v-model="formulario.observaciones"
        label="Observaciones"
        type="textarea"
        autogrow
        outlined
        rounded
        dense
        bg-color="white"
      />

      <div class="seccion-formulario">Soporte</div>

      <CampoArchivos v-model="formulario.archivos" label="Foto o soporte" :link-actual="formulario.link" />
    </DialogoFormulario>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" aria-label="Registrar profilaxis" @click="abrirCrear" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStoreProfilaxis } from '../stores/profilaxis'
import { useStoreCaninos } from '../stores/caninos'
import { useStoreCiudades } from '../stores/ciudades'
import { useStoreUsuarios } from '../stores/usuarios'
import { useFiltrosLista } from '../composables/useFiltrosLista'
import { FILTROS_PROFILAXIS } from '../composables/filtrosmodulos'
import { hoy, formatearFecha, normalizarFecha } from '../utils/fechas'
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

defineOptions({ name: 'ProfilaxisPage' })

const route = useRoute()
const storeProfilaxis = useStoreProfilaxis()
const storeCaninos = useStoreCaninos()
const storeCiudades = useStoreCiudades()
const useUsuario = useStoreUsuarios()

const TIPOS_COMUNES = [
  'Desparasitación interna',
  'Desparasitación externa',
  'Control de pulgas y garrapatas',
  'Baño medicado',
  'Limpieza dental',
  'Limpieza de oídos',
  'Corte de uñas',
]

// ── Lista ──
const registros = ref([])
const cargando = ref(false)
const cargandoInicial = computed(() => cargando.value && !registros.value.length)

async function cargar() {
  cargando.value = true
  try {
    const [lista] = await Promise.all([
      storeProfilaxis.obtenerProfilaxis(),
      storeCaninos.obtenerCaninos().catch(() => []),
    ])
    registros.value = Array.isArray(lista) ? lista : []
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
} = useFiltrosLista(FILTROS_PROFILAXIS.config, registros, {
  ...FILTROS_PROFILAXIS.opcionesLista,
  esAdmin: () => useUsuario.esAdmin,
})

const hayFiltros = computed(() => tipoLista.value !== 'todos' || Boolean(busqueda.value))

function aplicarFiltroDesdeRuta() {
  if (!route.query.canino) return
  seleccionarFiltro('canino')
  valorFiltro.value = String(route.query.canino)
}

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
    { etiqueta: 'Canino', valor: storeCaninos.nombreCanino(d.canino_id), completo: true },
    { etiqueta: 'Fecha', valor: formatearFecha(d.fecha) },
    { etiqueta: 'Realizado por', valor: d.realizado_por },
    { etiqueta: 'Observaciones', valor: d.observaciones, completo: true },
  ]
})

// ── Formulario ──
const mostrarFormulario = ref(false)
const esEdicion = ref(false)

const nuevoFormulario = () => ({
  consecutivo: '',
  canino_id: '',
  tipo: '',
  fecha: hoy(),
  realizado_por: useUsuario.nombreUsuario, // casi siempre lo hace quien registra; se puede cambiar
  observaciones: '',
  link: '',
  archivos: [],
})

const formulario = ref(nuevoFormulario())

const sugerenciasTipo = computed(() => [...TIPOS_COMUNES, ...registros.value.map((r) => r.tipo)])
const sugerenciasRealizadoPor = computed(() => [useUsuario.nombreUsuario, ...registros.value.map((r) => r.realizado_por)])

function abrirCrear() {
  esEdicion.value = false
  formulario.value = nuevoFormulario()
  if (tipoLista.value === 'canino' && valorFiltro.value) formulario.value.canino_id = valorFiltro.value
  mostrarFormulario.value = true
}

/** Mismo procedimiento, mismo canino, fecha de hoy (ej. desparasitación de cada mes) */
function abrirRepetir() {
  const d = detalle.value
  if (!d) return
  esEdicion.value = false
  formulario.value = { ...nuevoFormulario(), canino_id: d.canino_id, tipo: d.tipo }
  mostrarDetalle.value = false
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
  base.fecha = normalizarFecha(base.fecha)
  formulario.value = base
  mostrarFormulario.value = true
}

function resetear() {
  formulario.value = nuevoFormulario()
  esEdicion.value = false
}

async function guardar() {
  const reglas = [
    { campo: 'canino_id', mensaje: 'Seleccione el canino' },
    { campo: 'tipo', mensaje: 'Escriba el tipo de procedimiento' },
    { campo: 'fecha', mensaje: 'Seleccione la fecha' },
  ]
  if (!validarRequeridos(formulario.value, reglas)) return

  const datos = construirFormData(formulario.value, {
    archivos: formulario.value.archivos,
    excluir: ['consecutivo', 'link'],
  })

  try {
    if (esEdicion.value) {
      await storeProfilaxis.putProfilaxis(formulario.value.consecutivo, datos)
    } else {
      await storeProfilaxis.postProfilaxis(datos)
    }
    mostrarFormulario.value = false
    mostrarDetalle.value = false
    resetear()
    await cargar()
  } catch {
    // el store ya notificó
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