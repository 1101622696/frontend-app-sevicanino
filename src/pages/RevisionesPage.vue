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
          placeholder-busqueda="Buscar por tipo, resultado, veterinario o canino"
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
          icono="fact_check"
          texto-vacio="Aún no hay revisiones ni exámenes registrados"
          texto-ayuda="Registre controles veterinarios y exámenes con sus resultados."
          texto-accion="Registrar revisión"
          @accion="abrirCrear"
          @limpiar="reiniciar"
        />

        <div v-if="!cargandoInicial" class="column q-gutter-y-sm lista-con-fab">
          <TarjetaRegistro
            v-for="registro in listaFiltrada"
            :key="registro.consecutivo"
            :titulo="registro.tipo || 'Revisión'"
            :subtitulo="storeCaninos.nombreCanino(registro.canino_id)"
            :lineas="[formatearFecha(registro.fecha), registro.veterinario]"
            :badges="registro.resultado_revision ? [badgeResultado(registro.resultado_revision)] : []"
            icono="fact_check"
            color-avatar="cyan-1"
            color-texto-avatar="cyan-9"
            @click="verDetalle(registro)"
          />
        </div>
      </div>
    </q-pull-to-refresh>

    <!-- Detalle -->
    <DialogoDetalle
      v-model="mostrarDetalle"
      :titulo="detalle?.tipo || 'Revisión'"
      :subtitulo="detalle ? storeCaninos.nombreCanino(detalle.canino_id) : ''"
      icono="fact_check"
      color-avatar="cyan-1"
      color-texto-avatar="cyan-9"
      :badges="detalle?.resultado_revision ? [badgeResultado(detalle.resultado_revision)] : []"
      :campos="camposDetalle"
      :enlace="detalle?.link || ''"
      texto-enlace="Ver exámenes y soportes"
      @editar="abrirEditar"
    />

    <!-- Formulario -->
    <DialogoFormulario
      v-model="mostrarFormulario"
      :titulo="esEdicion ? 'Editar revisión' : 'Registrar revisión'"
      :subtitulo="formulario.canino_id ? storeCaninos.nombreCanino(formulario.canino_id) : 'Complete los datos de la revisión'"
      :cargando="storeRevisiones.loading"
      :texto-guardar="esEdicion ? 'Guardar cambios' : 'Registrar revisión'"
      :icono-guardar="esEdicion ? 'save' : 'add'"
      @guardar="guardar"
      @cerrar="resetear"
    >
      <div class="seccion-formulario">Revisión</div>

      <SelectCanino v-model="formulario.canino_id" />

      <CampoSugerencias v-model="formulario.tipo" label="Tipo de revisión o examen" icono="category" :sugerencias="sugerenciasTipo" />

      <CampoFecha v-model="formulario.fecha" label="Fecha" :maximo="hoy()" />

      <CampoSugerencias
        v-model="formulario.veterinario"
        label="Veterinario"
        icono="medical_services"
        :sugerencias="sugerenciasVeterinario"
      />

      <div class="seccion-formulario">Resultado</div>

      <q-input
        v-model="formulario.descripcion"
        label="Descripción"
        type="textarea"
        autogrow
        outlined
        rounded
        dense
        bg-color="white"
      />

      <CampoSugerencias
        v-model="formulario.resultado_revision"
        label="Resultado"
        icono="assignment_turned_in"
        :sugerencias="sugerenciasResultado"
        hint="Ej.: Normal, Requiere seguimiento, Apto para servicio"
      />

      <div class="seccion-formulario">Soportes</div>

      <CampoArchivos
        v-model="formulario.archivos"
        label="Exámenes, radiografías, fórmulas"
        multiple
        :link-actual="formulario.link"
      />
    </DialogoFormulario>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" aria-label="Registrar revisión" @click="abrirCrear" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStoreRevisiones } from '../stores/revisiones'
import { useStoreCaninos } from '../stores/caninos'
import { useStoreCiudades } from '../stores/ciudades'
import { useStoreUsuarios } from '../stores/usuarios'
import { useFiltrosLista } from '../composables/useFiltrosLista'
import { FILTROS_REVISIONES } from '../composables/filtrosmodulos'
import { normalizar } from '../utils/texto'
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

defineOptions({ name: 'RevisionesPage' })

const route = useRoute()
const storeRevisiones = useStoreRevisiones()
const storeCaninos = useStoreCaninos()
const storeCiudades = useStoreCiudades()
const useUsuario = useStoreUsuarios()

const TIPOS_COMUNES = [
  'Control general',
  'Examen de sangre',
  'Coprológico',
  'Parcial de orina',
  'Radiografía',
  'Ecografía',
  'Examen dermatológico',
  'Examen oftalmológico',
  'Valoración de aptitud para servicio',
]

const RESULTADOS_COMUNES = [
  'Normal',
  'Requiere seguimiento',
  'Requiere tratamiento',
  'Apto para servicio',
  'No apto temporalmente',
]

// ── Lista ──
const registros = ref([])
const cargando = ref(false)
const cargandoInicial = computed(() => cargando.value && !registros.value.length)

async function cargar() {
  cargando.value = true
  try {
    const [lista] = await Promise.all([
      storeRevisiones.obtenerRevisiones(),
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
} = useFiltrosLista(FILTROS_REVISIONES.config, registros, {
  ...FILTROS_REVISIONES.opcionesLista,
  esAdmin: () => useUsuario.esAdmin,
})

const hayFiltros = computed(() => tipoLista.value !== 'todos' || Boolean(busqueda.value))

function aplicarFiltroDesdeRuta() {
  if (!route.query.canino) return
  seleccionarFiltro('canino')
  valorFiltro.value = String(route.query.canino)
}

// ── Presentación ──
// El resultado es texto libre: se colorea solo cuando es claramente bueno o claramente de cuidado
function badgeResultado(resultado) {
  const texto = normalizar(resultado)
  if (/(no apto|tratamiento|anormal|critic|grave)/.test(texto)) {
    return { etiqueta: resultado, color: 'red-1', textColor: 'red-9' }
  }
  if (/(seguimiento|control|pendiente)/.test(texto)) {
    return { etiqueta: resultado, color: 'orange-1', textColor: 'orange-9' }
  }
  if (/(normal|apto|bien|sano|negativo)/.test(texto)) {
    return { etiqueta: resultado, color: 'green-1', textColor: 'green-9' }
  }
  return { etiqueta: resultado, color: 'grey-3', textColor: 'grey-8' }
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
    { etiqueta: 'Veterinario', valor: d.veterinario },
    { etiqueta: 'Resultado', valor: d.resultado_revision, completo: true },
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
  veterinario: '',
  descripcion: '',
  resultado_revision: '',
  link: '',
  archivos: [],
})

const formulario = ref(nuevoFormulario())

const sugerenciasTipo = computed(() => [...TIPOS_COMUNES, ...registros.value.map((r) => r.tipo)])
const sugerenciasVeterinario = computed(() => registros.value.map((r) => r.veterinario))
const sugerenciasResultado = computed(() => [...RESULTADOS_COMUNES, ...registros.value.map((r) => r.resultado_revision)])

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
    { campo: 'tipo', mensaje: 'Escriba el tipo de revisión o examen' },
    { campo: 'fecha', mensaje: 'Seleccione la fecha' },
  ]
  if (!validarRequeridos(formulario.value, reglas)) return

  const datos = construirFormData(formulario.value, {
    archivos: formulario.value.archivos,
    excluir: ['consecutivo', 'link'],
  })

  try {
    if (esEdicion.value) {
      await storeRevisiones.putRevision(formulario.value.consecutivo, datos)
    } else {
      await storeRevisiones.postRevision(datos)
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