<template>
  <q-page class="bg-grey-2">
    <q-pull-to-refresh color="primary" @refresh="refrescar">
      <div class="q-pa-md">
        <!-- Contexto rápido: cuántos siniestros hubo en el último mes -->
        <div v-if="recientes" class="row items-center q-mb-md resumen-reciente">
          <q-icon name="report" color="deep-orange" size="20px" class="q-mr-sm" />
          <span class="text-body2">
            {{ plural(recientes, 'siniestro', 'siniestros') }} en los últimos 30 días
          </span>
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
          placeholder-busqueda="Buscar por tipo, descripción o canino"
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
          icono="verified_user"
          texto-vacio="No hay siniestros registrados"
          texto-ayuda="Registre aquí mordeduras, lesiones en servicio, accidentes o cualquier incidente con un canino."
          texto-accion="Registrar siniestro"
          @accion="abrirCrear"
          @limpiar="reiniciar"
        />

        <div v-if="!cargandoInicial" class="column q-gutter-y-sm lista-con-fab">
          <TarjetaRegistro
            v-for="registro in listaFiltrada"
            :key="registro.consecutivo"
            :titulo="registro.tipo || 'Siniestro'"
            :subtitulo="storeCaninos.nombreCanino(registro.canino_id)"
            :lineas="[formatearFecha(registro.fecha), registro.descripcion]"
            :badges="registro.link ? [{ etiqueta: 'Con soportes', color: 'blue-1', textColor: 'blue-9' }] : []"
            icono="report"
            color-avatar="deep-orange-1"
            color-texto-avatar="deep-orange-9"
            @click="verDetalle(registro)"
          />
        </div>
      </div>
    </q-pull-to-refresh>

    <!-- Detalle -->
    <DialogoDetalle
      v-model="mostrarDetalle"
      :titulo="detalle?.tipo || 'Siniestro'"
      :subtitulo="detalle ? storeCaninos.nombreCanino(detalle.canino_id) : ''"
      icono="report"
      color-avatar="deep-orange-1"
      color-texto-avatar="deep-orange-9"
      :campos="camposDetalle"
      :enlace="detalle?.link || ''"
      texto-enlace="Ver fotos y soportes"
      @editar="abrirEditar"
    />

    <!-- Formulario -->
    <DialogoFormulario
      v-model="mostrarFormulario"
      :titulo="esEdicion ? 'Editar siniestro' : 'Registrar siniestro'"
      :subtitulo="formulario.canino_id ? storeCaninos.nombreCanino(formulario.canino_id) : 'Describa lo ocurrido'"
      :cargando="storeSiniestros.loading"
      :texto-guardar="esEdicion ? 'Guardar cambios' : 'Registrar siniestro'"
      :icono-guardar="esEdicion ? 'save' : 'add'"
      @guardar="guardar"
      @cerrar="resetear"
    >
      <div class="seccion-formulario">Siniestro</div>

      <SelectCanino v-model="formulario.canino_id" />

      <CampoSugerencias v-model="formulario.tipo" label="Tipo de siniestro" icono="category" :sugerencias="sugerenciasTipo" />

      <CampoFecha v-model="formulario.fecha" label="Fecha en que ocurrió" :maximo="hoy()" />

      <q-input
        v-model="formulario.descripcion"
        label="¿Qué pasó?"
        type="textarea"
        autogrow
        outlined
        rounded
        dense
        bg-color="white"
        hint="Lugar, personas involucradas, lesiones y acciones tomadas."
      />

      <div class="seccion-formulario">Soportes</div>

      <CampoArchivos
        v-model="formulario.archivos"
        label="Fotos, denuncia, informe"
        multiple
        :link-actual="formulario.link"
      />
    </DialogoFormulario>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" aria-label="Registrar siniestro" @click="abrirCrear" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStoreSiniestros } from '../stores/siniestros'
import { useStoreCaninos } from '../stores/caninos'
import { useStoreCiudades } from '../stores/ciudades'
import { useStoreUsuarios } from '../stores/usuarios'
import { useFiltrosLista } from '../composables/useFiltrosLista'
import { FILTROS_SINIESTROS } from '../composables/filtrosmodulos'
import { plural } from '../utils/texto'
import { hoy, formatearFecha, normalizarFecha, diasHasta } from '../utils/fechas'
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

defineOptions({ name: 'SiniestrosPage' })

const route = useRoute()
const storeSiniestros = useStoreSiniestros()
const storeCaninos = useStoreCaninos()
const storeCiudades = useStoreCiudades()
const useUsuario = useStoreUsuarios()

const TIPOS_COMUNES = [
  'Mordedura a persona',
  'Mordedura a otro animal',
  'Lesión en servicio',
  'Accidente de tránsito',
  'Intoxicación',
  'Fuga o extravío',
  'Daño a propiedad',
]

// ── Lista ──
const registros = ref([])
const cargando = ref(false)
const cargandoInicial = computed(() => cargando.value && !registros.value.length)

async function cargar() {
  cargando.value = true
  try {
    const [lista] = await Promise.all([
      storeSiniestros.obtenerSiniestros(),
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
} = useFiltrosLista(FILTROS_SINIESTROS.config, registros, {
  ...FILTROS_SINIESTROS.opcionesLista,
  esAdmin: () => useUsuario.esAdmin,
})

const hayFiltros = computed(() => tipoLista.value !== 'todos' || Boolean(busqueda.value))

const recientes = computed(
  () => registros.value.filter((r) => {
    const dias = diasHasta(r.fecha)
    return dias !== null && dias >= -30 && dias <= 0
  }).length,
)

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
    { etiqueta: 'Canino', valor: storeCaninos.nombreCanino(d.canino_id) },
    { etiqueta: 'Fecha', valor: formatearFecha(d.fecha) },
    {
      etiqueta: 'Ciudad del canino',
      valor: storeCiudades.nombreCiudad(storeCaninos.ciudadDeCanino(d.canino_id)),
      completo: true,
    },
    { etiqueta: 'Descripción', valor: d.descripcion, completo: true },
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
  descripcion: '',
  link: '',
  archivos: [],
})

const formulario = ref(nuevoFormulario())

const sugerenciasTipo = computed(() => [...TIPOS_COMUNES, ...registros.value.map((r) => r.tipo)])

function abrirCrear() {
  esEdicion.value = false
  formulario.value = nuevoFormulario()
  if (tipoLista.value === 'canino' && valorFiltro.value) formulario.value.canino_id = valorFiltro.value
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
    { campo: 'tipo', mensaje: 'Escriba el tipo de siniestro' },
    { campo: 'fecha', mensaje: 'Seleccione la fecha en que ocurrió' },
    { campo: 'descripcion', mensaje: 'Describa lo que pasó' },
  ]
  if (!validarRequeridos(formulario.value, reglas)) return

  const datos = construirFormData(formulario.value, {
    archivos: formulario.value.archivos,
    excluir: ['consecutivo', 'link'],
  })

  try {
    if (esEdicion.value) {
      await storeSiniestros.putSiniestro(formulario.value.consecutivo, datos)
    } else {
      await storeSiniestros.postSiniestro(datos)
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

.resumen-reciente {
  background: #fff3e0;
  border-radius: 10px;
  padding: 8px 12px;
}
</style>