<template>
  <q-page class="bg-grey-2">
    <q-pull-to-refresh color="primary" @refresh="refrescar">
      <div class="q-pa-md">
        <!-- Resumen: tratamientos activos ahora mismo -->
        <div v-if="enCurso" class="q-mb-md">
          <q-btn
            unelevated
            rounded
            no-caps
            color="green-1"
            text-color="green-9"
            icon="medication"
            :label="plural(enCurso, 'tratamiento en curso', 'tratamientos en curso')"
            @click="filtrarPorEstado(ESTADOS_TRATAMIENTO.EN_CURSO)"
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
          placeholder-busqueda="Buscar por medicamento, motivo, veterinario o canino"
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
          icono="medication"
          texto-vacio="Aún no hay tratamientos registrados"
          texto-ayuda="Registre medicamentos, dosis y la duración de cada tratamiento."
          texto-accion="Registrar tratamiento"
          @accion="abrirCrear"
          @limpiar="reiniciar"
        />

        <div v-if="!cargandoInicial" class="column q-gutter-y-sm lista-con-fab">
          <TarjetaRegistro
            v-for="registro in listaFiltrada"
            :key="registro.consecutivo"
            :titulo="registro.medicamento || 'Tratamiento'"
            :subtitulo="storeCaninos.nombreCanino(registro.canino_id)"
            :lineas="[registro.dosis, textoPeriodo(registro)]"
            :badges="[registro._badge]"
            icono="medication"
            v-bind="coloresPorEstado(registro._estado)"
            @click="verDetalle(registro)"
          />
        </div>
      </div>
    </q-pull-to-refresh>

    <!-- Detalle -->
    <DialogoDetalle
      v-model="mostrarDetalle"
      :titulo="detalle?.medicamento || 'Tratamiento'"
      :subtitulo="detalle ? storeCaninos.nombreCanino(detalle.canino_id) : ''"
      icono="medication"
      v-bind="coloresPorEstado(detalle?._estado)"
      :badges="detalle ? [detalle._badge] : []"
      :campos="camposDetalle"
      :enlace="detalle?.link || ''"
      texto-enlace="Ver fórmula médica"
      @editar="abrirEditar"
    >
      <template #acciones>
        <q-btn
          v-if="detalle?._estado === ESTADOS_TRATAMIENTO.EN_CURSO"
          flat
          no-caps
          color="primary"
          icon="task_alt"
          label="Finalizar hoy"
          :loading="finalizando"
          @click="finalizarHoy"
        />
      </template>
    </DialogoDetalle>

    <!-- Formulario -->
    <DialogoFormulario
      v-model="mostrarFormulario"
      :titulo="esEdicion ? 'Editar tratamiento' : 'Registrar tratamiento'"
      :subtitulo="formulario.canino_id ? storeCaninos.nombreCanino(formulario.canino_id) : 'Complete los datos del tratamiento'"
      :cargando="storeTratamientos.loading"
      :texto-guardar="esEdicion ? 'Guardar cambios' : 'Registrar tratamiento'"
      :icono-guardar="esEdicion ? 'save' : 'add'"
      @guardar="guardar"
      @cerrar="resetear"
    >
      <div class="seccion-formulario">Medicamento</div>

      <SelectCanino v-model="formulario.canino_id" />

      <CampoSugerencias
        v-model="formulario.medicamento"
        label="Medicamento"
        icono="medication"
        :sugerencias="sugerenciasMedicamento"
      />

      <q-input
        v-model.trim="formulario.dosis"
        label="Dosis"
        hint="Ej.: 1 tableta cada 12 horas"
        outlined
        rounded
        dense
        bg-color="white"
      />

      <q-input
        v-model="formulario.motivo"
        label="Motivo"
        type="textarea"
        autogrow
        outlined
        rounded
        dense
        bg-color="white"
      />

      <CampoSugerencias
        v-model="formulario.veterinario"
        label="Veterinario que lo formuló"
        icono="medical_services"
        :sugerencias="sugerenciasVeterinario"
      />

      <div class="seccion-formulario">Duración</div>

      <CampoFecha v-model="formulario.fecha_inicio" label="Fecha de inicio" />

      <CampoFecha
        v-model="formulario.fecha_fin"
        label="Fecha de fin"
        :minimo="formulario.fecha_inicio"
        clearable
        hint="Déjela vacía si el tratamiento es continuo."
      />

      <div class="row q-gutter-sm">
        <q-chip
          v-for="dias in ATAJOS_DIAS"
          :key="dias"
          clickable
          outline
          color="primary"
          :disable="!formulario.fecha_inicio"
          icon="date_range"
          @click="formulario.fecha_fin = sumarDias(formulario.fecha_inicio, dias - 1)"
        >
          {{ dias }} días
        </q-chip>
      </div>

      <div class="seccion-formulario">Soporte</div>

      <CampoArchivos v-model="formulario.archivos" label="Fórmula médica" :link-actual="formulario.link" />
    </DialogoFormulario>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" aria-label="Registrar tratamiento" @click="abrirCrear" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStoreTratamientos } from '../stores/tratamientos'
import { useStoreCaninos } from '../stores/caninos'
import { useStoreCiudades } from '../stores/ciudades'
import { useStoreUsuarios } from '../stores/usuarios'
import { useFiltrosLista } from '../composables/useFiltrosLista'
import { FILTROS_TRATAMIENTOS } from '../composables/filtrosmodulos'
import { plural } from '../utils/texto'
import {
  hoy,
  formatearFecha,
  normalizarFecha,
  compararFechas,
  estadoTratamiento,
  ESTADOS_TRATAMIENTO,
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

defineOptions({ name: 'TratamientosPage' })

const route = useRoute()
const storeTratamientos = useStoreTratamientos()
const storeCaninos = useStoreCaninos()
const storeCiudades = useStoreCiudades()
const useUsuario = useStoreUsuarios()

const ATAJOS_DIAS = [5, 7, 10, 15]

/** 'YYYY-MM-DD' + n días. "7 días" desde el lunes termina el domingo (inicio + 6) */
function sumarDias(fecha, dias) {
  const iso = normalizarFecha(fecha)
  if (!iso) return ''
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10)
}

// ── Lista ──
const registros = ref([])
const cargando = ref(false)
const cargandoInicial = computed(() => cargando.value && !registros.value.length)

function prepararRegistros(lista) {
  return lista.map((registro) => {
    const estado = estadoTratamiento(registro.fecha_inicio, registro.fecha_fin)
    return { ...registro, _estado: estado.estado, _badge: estado }
  })
}

async function cargar() {
  cargando.value = true
  try {
    const [lista] = await Promise.all([
      storeTratamientos.obtenerTratamientos(),
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
} = useFiltrosLista(FILTROS_TRATAMIENTOS.config, registros, {
  ...FILTROS_TRATAMIENTOS.opcionesLista,
  esAdmin: () => useUsuario.esAdmin,
})

const hayFiltros = computed(() => tipoLista.value !== 'todos' || Boolean(busqueda.value))

const enCurso = computed(() => registros.value.filter((r) => r._estado === ESTADOS_TRATAMIENTO.EN_CURSO).length)

function filtrarPorEstado(estado) {
  seleccionarFiltro('estado')
  valorFiltro.value = estado
}

function aplicarFiltroDesdeRuta() {
  if (!route.query.canino) return
  seleccionarFiltro('canino')
  valorFiltro.value = String(route.query.canino)
}

// ── Presentación ──
const COLORES_ESTADO = {
  [ESTADOS_TRATAMIENTO.EN_CURSO]: { colorAvatar: 'green-1', colorTextoAvatar: 'green-9' },
  [ESTADOS_TRATAMIENTO.PROGRAMADO]: { colorAvatar: 'blue-1', colorTextoAvatar: 'blue-9' },
}
const coloresPorEstado = (estado) => COLORES_ESTADO[estado] || { colorAvatar: 'grey-3', colorTextoAvatar: 'grey-7' }

function textoPeriodo(registro) {
  const inicio = formatearFecha(registro.fecha_inicio, '')
  const fin = formatearFecha(registro.fecha_fin, '')
  if (inicio && fin) return `Del ${inicio} al ${fin}`
  if (inicio) return `Desde el ${inicio}, sin fecha de fin`
  return ''
}

// ── Detalle ──
const mostrarDetalle = ref(false)
const detalle = ref(null)
const finalizando = ref(false)

function verDetalle(registro) {
  detalle.value = registro
  mostrarDetalle.value = true
}

const camposDetalle = computed(() => {
  const d = detalle.value
  if (!d) return []
  return [
    { etiqueta: 'Canino', valor: storeCaninos.nombreCanino(d.canino_id), completo: true },
    { etiqueta: 'Dosis', valor: d.dosis, completo: true },
    { etiqueta: 'Inicio', valor: formatearFecha(d.fecha_inicio) },
    { etiqueta: 'Fin', valor: d.fecha_fin ? formatearFecha(d.fecha_fin) : 'Continuo' },
    { etiqueta: 'Veterinario', valor: d.veterinario, completo: true },
    { etiqueta: 'Motivo', valor: d.motivo, completo: true },
  ]
})

/** Cierra un tratamiento que se suspendió o terminó antes: solo envía la fecha de fin */
async function finalizarHoy() {
  const d = detalle.value
  if (!d) return
  finalizando.value = true
  try {
    const datos = new FormData()
    // Si se finaliza el mismo día que empezó, fin = inicio (no puede quedar antes)
    const fin = compararFechas(hoy(), d.fecha_inicio) < 0 ? normalizarFecha(d.fecha_inicio) : hoy()
    datos.append('fecha_fin', fin)
    await storeTratamientos.putTratamiento(d.consecutivo, datos)
    mostrarDetalle.value = false
    await cargar()
  } catch {
    // el store ya notificó
  } finally {
    finalizando.value = false
  }
}

// ── Formulario ──
const mostrarFormulario = ref(false)
const esEdicion = ref(false)

const nuevoFormulario = () => ({
  consecutivo: '',
  canino_id: '',
  medicamento: '',
  dosis: '',
  motivo: '',
  veterinario: '',
  fecha_inicio: hoy(),
  fecha_fin: '',
  link: '',
  archivos: [],
})

const formulario = ref(nuevoFormulario())

const sugerenciasMedicamento = computed(() => registros.value.map((r) => r.medicamento))
const sugerenciasVeterinario = computed(() => registros.value.map((r) => r.veterinario))

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
  base.fecha_inicio = normalizarFecha(base.fecha_inicio)
  base.fecha_fin = normalizarFecha(base.fecha_fin)
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
    { campo: 'medicamento', mensaje: 'Escriba el medicamento' },
    { campo: 'fecha_inicio', mensaje: 'Seleccione la fecha de inicio' },
    {
      campo: 'fecha_fin',
      mensaje: 'La fecha de fin no puede ser antes de la fecha de inicio',
      validar: (valor, datos) => !valor || compararFechas(valor, datos.fecha_inicio) >= 0,
    },
  ]
  if (!validarRequeridos(formulario.value, reglas)) return

  const datos = construirFormData(formulario.value, {
    archivos: formulario.value.archivos,
    excluir: ['consecutivo', 'link'],
  })

  try {
    if (esEdicion.value) {
      await storeTratamientos.putTratamiento(formulario.value.consecutivo, datos)
    } else {
      await storeTratamientos.postTratamiento(datos)
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