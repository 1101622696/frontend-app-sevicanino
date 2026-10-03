<template>
  <q-page class="bg-grey-2">
    <q-pull-to-refresh color="primary" @refresh="refrescar">
      <div class="q-pa-md">
        <!-- Atajo para el manejador: ver solo lo que registró él -->
        <div v-if="!useUsuario.esAdmin" class="q-mb-md">
          <q-btn
            unelevated
            rounded
            no-caps
            :color="viendoSoloMias ? 'primary' : 'white'"
            :text-color="viendoSoloMias ? 'white' : 'grey-8'"
            icon="person"
            label="Solo mis actividades"
            class="boton-borde"
            @click="alternarSoloMias"
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
          placeholder-busqueda="Buscar por asunto, detalle, manejador o canino"
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
          icono="event_note"
          texto-vacio="Aún no hay actividades registradas"
          texto-ayuda="Registre entrenamientos, servicios y novedades para que el siguiente turno sepa qué pasó."
          texto-accion="Registrar actividad"
          @accion="abrirCrear"
          @limpiar="reiniciar"
        />

        <!-- Bitácora agrupada por día -->
        <div v-if="!cargandoInicial" class="lista-con-fab">
          <section v-for="grupo in grupos" :key="grupo.fecha" class="q-mb-md">
            <div class="row items-center q-mb-sm q-px-xs">
              <span class="text-body2 text-weight-medium">{{ etiquetaDia(grupo.fecha) }}</span>
              <span class="text-caption text-grey-6 q-ml-sm">{{ plural(grupo.registros.length, 'actividad', 'actividades') }}</span>
            </div>

            <div class="column q-gutter-y-sm">
              <TarjetaRegistro
                v-for="registro in grupo.registros"
                :key="registro.consecutivo"
                :titulo="registro.asunto || 'Actividad'"
                :subtitulo="storeCaninos.nombreCanino(registro.canino_id)"
                :lineas="[registro.detalle, registro.usuario_manejador ? `Por ${registro.usuario_manejador}` : '']"
                :badges="esMia(registro) ? [{ etiqueta: 'Mía', color: 'purple-1', textColor: 'purple-9' }] : []"
                icono="event_note"
                color-avatar="purple-1"
                color-texto-avatar="purple-9"
                @click="verDetalle(registro)"
              />
            </div>
          </section>
        </div>
      </div>
    </q-pull-to-refresh>

    <!-- Detalle -->
    <DialogoDetalle
      v-model="mostrarDetalle"
      :titulo="detalle?.asunto || 'Actividad'"
      :subtitulo="detalle ? storeCaninos.nombreCanino(detalle.canino_id) : ''"
      icono="event_note"
      color-avatar="purple-1"
      color-texto-avatar="purple-9"
      :campos="camposDetalle"
      :enlace="detalle?.link || ''"
      texto-enlace="Ver soporte"
      :puede-editar="Boolean(detalle) && puedeEditar(detalle)"
      @editar="abrirEditar"
    >
      <div v-if="detalle && !puedeEditar(detalle)" class="text-caption text-grey-7 q-mt-md">
        Solo {{ detalle.usuario_manejador || 'quien la registró' }} puede editar esta actividad.
      </div>
    </DialogoDetalle>

    <!-- Formulario -->
    <DialogoFormulario
      v-model="mostrarFormulario"
      :titulo="esEdicion ? 'Editar actividad' : 'Registrar actividad'"
      :subtitulo="formulario.canino_id ? storeCaninos.nombreCanino(formulario.canino_id) : 'Qué se hizo y con qué canino'"
      :cargando="storeActividades.loading"
      :texto-guardar="esEdicion ? 'Guardar cambios' : 'Registrar actividad'"
      :icono-guardar="esEdicion ? 'save' : 'add'"
      @guardar="guardar"
      @cerrar="resetear"
    >
      <div class="seccion-formulario">Actividad</div>

      <SelectCanino v-model="formulario.canino_id" />

      <CampoFecha v-model="formulario.fecha_hora" label="Fecha" :maximo="hoy()" />

      <CampoSugerencias v-model="formulario.asunto" label="Asunto" icono="title" :sugerencias="sugerenciasAsunto" />

      <q-input
        v-model="formulario.detalle"
        label="Detalle"
        type="textarea"
        autogrow
        outlined
        rounded
        dense
        bg-color="white"
        hint="Qué se hizo, cómo respondió el canino y cualquier novedad para el siguiente turno."
      />

      <div class="seccion-formulario">Soporte</div>

      <CampoArchivos v-model="formulario.archivos" label="Foto o soporte" :link-actual="formulario.link" />
    </DialogoFormulario>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" aria-label="Registrar actividad" @click="abrirCrear" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStoreActividades } from '../stores/actividades'
import { useStoreCaninos } from '../stores/caninos'
import { useStoreCiudades } from '../stores/ciudades'
import { useStoreUsuarios } from '../stores/usuarios'
import { useFiltrosLista } from '../composables/useFiltrosLista'
import { FILTROS_ACTIVIDADES } from '../composables/filtrosmodulos'
import { normalizar, plural } from '../utils/texto'
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

defineOptions({ name: 'ActividadesPage' })

const route = useRoute()
const storeActividades = useStoreActividades()
const storeCaninos = useStoreCaninos()
const storeCiudades = useStoreCiudades()
const useUsuario = useStoreUsuarios()

const ASUNTOS_COMUNES = [
  'Entrenamiento',
  'Servicio',
  'Paseo',
  'Baño',
  'Alimentación',
  'Novedad de salud',
  'Novedad de comportamiento',
]

// ── Lista ──
const registros = ref([])
const cargando = ref(false)
const cargandoInicial = computed(() => cargando.value && !registros.value.length)

async function cargar() {
  cargando.value = true
  try {
    const [lista] = await Promise.all([
      storeActividades.obtenerActividades(),
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
} = useFiltrosLista(FILTROS_ACTIVIDADES.config, registros, {
  ...FILTROS_ACTIVIDADES.opcionesLista,
  esAdmin: () => useUsuario.esAdmin,
})

const hayFiltros = computed(() => tipoLista.value !== 'todos' || Boolean(busqueda.value))

function aplicarFiltroDesdeRuta() {
  if (!route.query.canino) return
  seleccionarFiltro('canino')
  valorFiltro.value = String(route.query.canino)
}

// ── Permisos ──
// Todos los de la ciudad ven las actividades; cada uno edita solo las suyas (el admin, todas)
const esMia = (registro) => normalizar(registro?.correo_manejador) === normalizar(useUsuario.emailUsuario)
const puedeEditar = (registro) => useUsuario.esAdmin || esMia(registro)

const viendoSoloMias = computed(
  () => tipoLista.value === 'manejador' && normalizar(valorFiltro.value) === normalizar(useUsuario.nombreUsuario),
)

function alternarSoloMias() {
  if (viendoSoloMias.value) {
    reiniciar()
    return
  }
  seleccionarFiltro('manejador')
  valorFiltro.value = useUsuario.nombreUsuario
}

// ── Bitácora por día ──
// La lista ya viene ordenada por fecha; se agrupan los días consecutivos
const grupos = computed(() => {
  const resultado = []
  let actual = null
  listaFiltrada.value.forEach((registro) => {
    const fecha = normalizarFecha(registro.fecha_hora) || 'sin-fecha'
    if (!actual || actual.fecha !== fecha) {
      actual = { fecha, registros: [] }
      resultado.push(actual)
    }
    actual.registros.push(registro)
  })
  return resultado
})

function etiquetaDia(fecha) {
  if (fecha === 'sin-fecha') return 'Sin fecha'
  const dias = diasHasta(fecha)
  if (dias === 0) return 'Hoy'
  if (dias === -1) return 'Ayer'
  return formatearFecha(fecha)
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
    { etiqueta: 'Fecha', valor: formatearFecha(d.fecha_hora) },
    { etiqueta: 'Manejador', valor: d.usuario_manejador, completo: true },
    { etiqueta: 'Detalle', valor: d.detalle, completo: true },
    { etiqueta: 'Registrada el', valor: d.fecha_creacion ? formatearFecha(d.fecha_creacion) : '', ocultarSiVacio: true },
  ]
})

// ── Formulario ──
const mostrarFormulario = ref(false)
const esEdicion = ref(false)

// Manejador, correo y ciudad los pone el backend con el token
const nuevoFormulario = () => ({
  consecutivo: '',
  canino_id: '',
  fecha_hora: hoy(),
  asunto: '',
  detalle: '',
  link: '',
  archivos: [],
})

const formulario = ref(nuevoFormulario())

const sugerenciasAsunto = computed(() => [...ASUNTOS_COMUNES, ...registros.value.map((r) => r.asunto)])

function abrirCrear() {
  esEdicion.value = false
  formulario.value = nuevoFormulario()
  if (tipoLista.value === 'canino' && valorFiltro.value) formulario.value.canino_id = valorFiltro.value
  mostrarFormulario.value = true
}

function abrirEditar() {
  const d = detalle.value
  if (!d || !puedeEditar(d)) return
  esEdicion.value = true
  const base = nuevoFormulario()
  Object.keys(base).forEach((clave) => {
    if (!Array.isArray(base[clave]) && d[clave] !== undefined) base[clave] = d[clave]
  })
  base.fecha_hora = normalizarFecha(base.fecha_hora)
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
    { campo: 'fecha_hora', mensaje: 'Seleccione la fecha' },
    { campo: 'asunto', mensaje: 'Escriba el asunto' },
  ]
  if (!validarRequeridos(formulario.value, reglas)) return

  const datos = construirFormData(formulario.value, {
    archivos: formulario.value.archivos,
    excluir: ['consecutivo', 'link'],
  })

  try {
    if (esEdicion.value) {
      await storeActividades.putActividad(formulario.value.consecutivo, datos)
    } else {
      await storeActividades.postActividad(datos)
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

.boton-borde {
  border: 1px solid rgba(0, 0, 0, 0.08);
}
</style>