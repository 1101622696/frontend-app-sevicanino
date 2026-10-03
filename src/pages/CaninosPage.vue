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
          placeholder-busqueda="Buscar por nombre, microchip o raza"
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
          icono="pets"
          texto-vacio="Aún no hay caninos registrados"
          :texto-ayuda="
            useUsuario.esAdmin
              ? 'Registre el primer canino para empezar.'
              : 'Cuando el administrador registre caninos en su ciudad, aparecerán aquí.'
          "
          :texto-accion="useUsuario.esAdmin ? 'Registrar canino' : ''"
          @accion="abrirCrear"
          @limpiar="reiniciar"
        />

        <div v-if="!cargandoInicial" class="column q-gutter-y-sm lista-con-fab">
          <TarjetaRegistro
            v-for="canino in listaFiltrada"
            :key="canino.consecutivo"
            :titulo="canino.nombre || 'Sin nombre'"
            :subtitulo="canino.raza"
            :lineas="lineasTarjeta(canino)"
            :badges="[badgeEstado(canino)]"
            :avatar="iniciales(canino.nombre)"
            v-bind="coloresAvatar(canino)"
            @click="verDetalle(canino)"
          />
        </div>
      </div>
    </q-pull-to-refresh>

    <!-- Detalle -->
    <DialogoDetalle
      v-model="mostrarDetalle"
      :titulo="detalle?.nombre || ''"
      :subtitulo="subtituloDetalle"
      :avatar="iniciales(detalle?.nombre)"
      v-bind="coloresAvatar(detalle)"
      :badges="detalle ? [badgeEstado(detalle)] : []"
      :campos="camposDetalle"
      :puede-editar="Boolean(detalle)"
      @editar="abrirEditar"
    >
      <template #superior>
        <FotoDrive
          v-if="detalle?.foto_drive_id"
          :referencia="detalle.foto_drive_id"
          :alt="`Foto de ${detalle.nombre}`"
          :titulo-visor="detalle.nombre"
          alto="220px"
          class="q-mb-md"
        />
      </template>

      <template v-if="detalle">
        <q-btn
          v-if="detalle.procedencia_drive"
          outline
          rounded
          no-caps
          color="primary"
          icon="folder_open"
          label="Documentos de procedencia"
          class="full-width q-mt-md"
          @click="abrirEnlace(detalle.procedencia_drive, `Procedencia de ${detalle.nombre}`)"
        />

<HojaDeVidaCanino :canino="detalle" @trasladado="alTrasladar" />

        <div v-if="useUsuario.esAdmin" class="fila-activacion row items-center q-mt-md">
          <div class="col">
            <div class="text-body2 text-weight-medium">Canino activo</div>
            <div class="text-caption text-grey-7">
              Los caninos inactivos no aparecen al registrar vacunas, tratamientos ni actividades.
            </div>
          </div>
          <q-toggle
            :model-value="detalle.estado === 'activo'"
            :disable="cambiandoEstado"
            color="positive"
            @update:model-value="cambiarEstado"
          />
        </div>
      </template>
    </DialogoDetalle>

    <!-- Formulario -->
    <DialogoFormulario
      v-model="mostrarFormulario"
      :titulo="esEdicion ? 'Editar canino' : 'Registrar canino'"
      :subtitulo="esEdicion ? formulario.nombre : 'Complete la información del canino'"
      :cargando="storeCaninos.loading"
      :texto-guardar="esEdicion ? 'Guardar cambios' : 'Registrar canino'"
      :icono-guardar="esEdicion ? 'save' : 'add'"
      @guardar="guardar"
      @cerrar="resetear"
    >
      <div class="seccion-formulario">Identificación</div>

      <q-input v-model.trim="formulario.nombre" label="Nombre" outlined rounded dense bg-color="white" />

      <q-input v-model.trim="formulario.microchip" label="Microchip" outlined rounded dense bg-color="white" />

      <div>
        <div class="text-caption text-grey-7 q-mb-xs q-px-sm">Sexo</div>
        <q-btn-toggle
          v-model="formulario.sexo"
          :options="OPCIONES_SEXO"
          spread
          no-caps
          rounded
          unelevated
          color="white"
          text-color="grey-8"
          toggle-color="primary"
          class="toggle-borde"
        />
      </div>

      <q-select
        v-model="formulario.raza"
        :options="RAZAS"
        label="Raza"
        outlined
        rounded
        dense
        bg-color="white"
      />

      <q-select
        v-model="formulario.color"
        :options="COLORES"
        :option-label="capitalizar"
        label="Color"
        outlined
        rounded
        dense
        bg-color="white"
      />

      <CampoFecha v-model="formulario.fecha_nacimiento" label="Fecha de nacimiento" :maximo="hoy()" clearable />

      <div class="seccion-formulario">Servicio</div>

      <q-select
        v-if="!esEdicion"
        v-model="formulario.ciudad_id"
        :options="storeCiudades.opcionesCiudades"
        label="Ciudad"
        emit-value
        map-options
        outlined
        rounded
        dense
        bg-color="white"
      />
      <q-input
        v-else
        :model-value="storeCiudades.nombreCiudad(formulario.ciudad_id)"
        label="Ciudad"
        readonly
        outlined
        rounded
        dense
        bg-color="white"
        hint="La ciudad solo se cambia con un traslado, para que quede en el historial."
      />

      <q-select
        v-model="formulario.especialidad"
        :options="ESPECIALIDADES"
        label="Especialidad"
        outlined
        rounded
        dense
        bg-color="white"
      />

      <!-- Sugiere los contratos que ya existen para evitar "Contrato 1" y "contrato 01" -->
      <q-select
        :model-value="formulario.contrato"
        :options="contratosVisibles"
        label="Contrato"
        use-input
        hide-selected
        fill-input
        input-debounce="0"
        outlined
        rounded
        dense
        bg-color="white"
        @filter="filtrarContratos"
        @input-value="(valor) => (formulario.contrato = valor)"
        @update:model-value="(valor) => (formulario.contrato = valor || '')"
      />

      <q-input
        v-model="formulario.gramos_dia"
        label="Alimento por día"
        type="number"
        inputmode="numeric"
        min="0"
        suffix="g"
        outlined
        rounded
        dense
        bg-color="white"
      />

      <div class="seccion-formulario">Salud y procedencia</div>

      <div>
        <div class="text-caption text-grey-7 q-mb-xs q-px-sm">Procedencia</div>
        <q-btn-toggle
          v-model="formulario.procedencia_tipo"
          :options="OPCIONES_PROCEDENCIA"
          spread
          no-caps
          rounded
          unelevated
          color="white"
          text-color="grey-8"
          toggle-color="primary"
          class="toggle-borde"
        />
      </div>

      <div>
        <div class="text-caption text-grey-7 q-mb-xs q-px-sm">¿Está esterilizado?</div>
        <q-btn-toggle
          v-model="formulario.esterilizado"
          :options="OPCIONES_SI_NO"
          spread
          no-caps
          rounded
          unelevated
          color="white"
          text-color="grey-8"
          toggle-color="primary"
          class="toggle-borde"
        />
      </div>

      <CampoFecha
        v-if="formulario.esterilizado === 'si'"
        v-model="formulario.fecha_esterilizacion"
        label="Fecha de esterilización"
        :minimo="formulario.fecha_nacimiento"
        :maximo="hoy()"
        clearable
      />

      <q-input
        v-model="formulario.senales_particulares"
        label="Señales particulares"
        type="textarea"
        autogrow
        outlined
        rounded
        dense
        bg-color="white"
      />

      <div class="seccion-formulario">Archivos</div>

      <CampoArchivos
        v-model="formulario.foto"
        label="Foto del canino"
        accept="image/*"
        :link-actual="formulario.foto_drive_id"
      />

      <CampoArchivos
        v-model="formulario.documentos"
        label="Documentos de procedencia"
        multiple
        :link-actual="formulario.procedencia_drive"
      />
    </DialogoFormulario>

    <q-page-sticky v-if="useUsuario.esAdmin" position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" aria-label="Registrar canino" @click="abrirCrear" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ref, computed, watch, onMounted } from 'vue'
import { useStoreCaninos } from '../stores/caninos'
import { useStoreCiudades } from '../stores/ciudades'
import { useStoreUsuarios } from '../stores/usuarios'
import { useFiltrosLista } from '../composables/useFiltrosLista'
import { CONFIG_FILTROS, OPCIONES_LISTA_CANINOS } from '../composables/filtroscaninos'
import { SEXOS, RAZAS, COLORES, ESPECIALIDADES } from '../composables/catalogos'
import { capitalizar, iniciales, normalizar } from '../utils/texto'
import { hoy, formatearFecha, calcularEdad, normalizarFecha } from '../utils/fechas'
import { construirFormData, validarRequeridos } from '../utils/formulario'
import { abrirEnlace } from '../utils/enlaces'

import HojaDeVidaCanino from '../components/HojaDeVidaCanino.vue'
import BarraFiltros from '../components/BarraFiltros.vue'
import EncabezadoLista from '../components/EncabezadoLista.vue'
import EstadoLista from '../components/EstadoLista.vue'
import TarjetaRegistro from '../components/TarjetaRegistro.vue'
import DialogoDetalle from '../components/DialogoDetalle.vue'
import DialogoFormulario from '../components/DialogoFormulario.vue'
import CampoFecha from '../components/CampoFecha.vue'
import CampoArchivos from '../components/CampoArchivos.vue'
import FotoDrive from '../components/FotoDrive.vue'

defineOptions({ name: 'CaninosPage' })

const storeCaninos = useStoreCaninos()
const storeCiudades = useStoreCiudades()
const useUsuario = useStoreUsuarios()

// ── Opciones de formulario ──
const OPCIONES_SEXO = SEXOS.map((valor) => ({ label: capitalizar(valor), value: valor }))
const OPCIONES_SI_NO = [
  { label: 'Sí', value: 'si' },
  { label: 'No', value: 'no' },
]
const OPCIONES_PROCEDENCIA = [
  { label: 'Donación', value: 'donación' },
  { label: 'Compra', value: 'compra' },
]

// ── Lista ──
const route = useRoute()
const cargando = ref(false)
const registros = computed(() => storeCaninos.caninos)
const cargandoInicial = computed(() => cargando.value && !registros.value.length)

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
} = useFiltrosLista(CONFIG_FILTROS, registros, {
  ...OPCIONES_LISTA_CANINOS,
  esAdmin: () => useUsuario.esAdmin,
})

const hayFiltros = computed(() => tipoLista.value !== 'todos' || Boolean(busqueda.value))

async function cargar(forzar = false) {
  cargando.value = true
  try {
    await storeCaninos.obtenerCaninos({ forzar })
  } catch {
    // el store ya notificó
  } finally {
    cargando.value = false
  }
}

async function refrescar(terminar) {
  await Promise.all([cargar(true), storeCiudades.obtenerCiudades({ forzar: true })])
  terminar()
}

// ── Presentación ──
const badgeEstado = (canino) =>
  normalizar(canino?.estado) === 'activo'
    ? { etiqueta: 'Activo', color: 'green-1', textColor: 'green-9' }
    : { etiqueta: canino?.estado ? capitalizar(canino.estado) : 'Sin estado', color: 'grey-3', textColor: 'grey-7' }

const coloresAvatar = (canino) =>
  normalizar(canino?.sexo) === 'hembra'
    ? { colorAvatar: 'pink-1', colorTextoAvatar: 'pink-9' }
    : { colorAvatar: 'blue-1', colorTextoAvatar: 'blue-9' }

const lineasTarjeta = (canino) => [
  canino.especialidad,
  useUsuario.esAdmin ? storeCiudades.nombreCiudad(canino.ciudad_id) : '',
]

// ── Detalle ──
const mostrarDetalle = ref(false)
const detalle = ref(null)
const cambiandoEstado = ref(false)

// La lista ya trae todas las columnas: no hace falta pedir el canino otra vez
function verDetalle(canino) {
  detalle.value = { ...canino }
  mostrarDetalle.value = true
}

async function alTrasladar() {
  const id = detalle.value?.consecutivo
  await cargar(true)
  const actualizado = storeCaninos.buscarCanino(id)
  if (actualizado) detalle.value = { ...actualizado }
}

const subtituloDetalle = computed(() => {
  if (!detalle.value) return ''
  return [detalle.value.raza, capitalizar(detalle.value.sexo)].filter(Boolean).join(', ')
})

const camposDetalle = computed(() => {
  const d = detalle.value
  if (!d) return []

  const esterilizado = normalizar(d.esterilizado)
  let textoEsterilizado = ''
  if (esterilizado === 'si') {
    textoEsterilizado = d.fecha_esterilizacion ? `Sí, el ${formatearFecha(d.fecha_esterilizacion)}` : 'Sí'
  } else if (esterilizado === 'no') {
    textoEsterilizado = 'No'
  }

  return [
    { etiqueta: 'Microchip', valor: d.microchip },
    { etiqueta: 'Color', valor: capitalizar(d.color) },
    {
      etiqueta: 'Nacimiento',
      valor: d.fecha_nacimiento ? `${formatearFecha(d.fecha_nacimiento)} (${calcularEdad(d.fecha_nacimiento)})` : '',
      completo: true,
    },
    { etiqueta: 'Ciudad', valor: storeCiudades.nombreCiudad(d.ciudad_id) },
    { etiqueta: 'Contrato', valor: d.contrato },
    { etiqueta: 'Especialidad', valor: d.especialidad, completo: true },
    { etiqueta: 'Procedencia', valor: capitalizar(d.procedencia_tipo) },
    { etiqueta: 'Alimento por día', valor: d.gramos_dia ? `${d.gramos_dia} g` : '' },
    { etiqueta: 'Esterilizado', valor: textoEsterilizado, completo: true },
    { etiqueta: 'Señales particulares', valor: d.senales_particulares, completo: true },
    { etiqueta: 'Registrado el', valor: d.fecha_creacion ? formatearFecha(d.fecha_creacion) : '', ocultarSiVacio: true },
  ]
})

async function cambiarEstado(activar) {
  if (!detalle.value) return
  cambiandoEstado.value = true
  try {
    if (activar) {
      await storeCaninos.putActivarCanino(detalle.value.consecutivo)
    } else {
      await storeCaninos.putDesactivarCanino(detalle.value.consecutivo)
    }
    detalle.value.estado = activar ? 'activo' : 'inactivo'
    await cargar(true)
  } catch {
    // el store ya notificó; el toggle vuelve solo porque depende de detalle.estado
  } finally {
    cambiandoEstado.value = false
  }
}

// ── Formulario ──
const mostrarFormulario = ref(false)
const esEdicion = ref(false)

// Función, no objeto: cada formulario nuevo tiene sus propios arrays de archivos
const nuevoFormulario = () => ({
  consecutivo: '',
  nombre: '',
  microchip: '',
  sexo: '',
  raza: '',
  color: '',
  fecha_nacimiento: '',
  ciudad_id: '',
  especialidad: '',
  contrato: '',
  gramos_dia: '',
  procedencia_tipo: '',
  esterilizado: '',
  fecha_esterilizacion: '',
  senales_particulares: '',
  foto_drive_id: '', // solo para saber si ya tiene foto
  procedencia_drive: '', // solo para saber si ya tiene documentos
  foto: [],
  documentos: [],
})

const formulario = ref(nuevoFormulario())

watch(
  () => formulario.value.esterilizado,
  (valor) => {
    if (valor !== 'si') formulario.value.fecha_esterilizacion = ''
  },
)

function abrirCrear() {
  esEdicion.value = false
  formulario.value = nuevoFormulario()
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
  base.sexo = normalizar(base.sexo)
  base.esterilizado = normalizar(base.esterilizado)
  base.fecha_nacimiento = normalizarFecha(base.fecha_nacimiento)
  base.fecha_esterilizacion = normalizarFecha(base.fecha_esterilizacion)

  formulario.value = base
  mostrarFormulario.value = true
}

function resetear() {
  formulario.value = nuevoFormulario()
  esEdicion.value = false
}

// Contratos existentes como sugerencia
const textoContrato = ref('')
const contratosExistentes = computed(() => {
  const unicos = new Map()
  registros.value.forEach((canino) => {
    if (canino.contrato) unicos.set(normalizar(canino.contrato), canino.contrato)
  })
  return [...unicos.values()].sort((a, b) => a.localeCompare(b, 'es'))
})
const contratosVisibles = computed(() => {
  const texto = normalizar(textoContrato.value)
  return texto ? contratosExistentes.value.filter((c) => normalizar(c).includes(texto)) : contratosExistentes.value
})
function filtrarContratos(valor, actualizar) {
  actualizar(() => {
    textoContrato.value = valor
  })
}

async function guardar() {
  const reglas = [
    { campo: 'nombre', mensaje: 'Escriba el nombre del canino' },
    { campo: 'sexo', mensaje: 'Seleccione el sexo' },
    { campo: 'raza', mensaje: 'Seleccione la raza' },
    ...(esEdicion.value ? [] : [{ campo: 'ciudad_id', mensaje: 'Seleccione la ciudad' }]),
    {
      campo: 'gramos_dia',
      mensaje: 'El alimento por día debe ser un número mayor o igual a cero',
      validar: (valor) => valor === '' || valor === null || (Number(valor) >= 0 && !Number.isNaN(Number(valor))),
    },
  ]
  if (!validarRequeridos(formulario.value, reglas)) return

  const datos = construirFormData(formulario.value, {
    excluir: [
      'consecutivo',
      'foto_drive_id',
      'procedencia_drive',
      ...(esEdicion.value ? ['ciudad_id'] : []),
    ],
  })
  formulario.value.foto.forEach((archivo) => datos.append('foto', archivo))
  formulario.value.documentos.forEach((archivo) => datos.append('documentos_procedencia', archivo))

  try {
    if (esEdicion.value) {
      await storeCaninos.putCanino(formulario.value.consecutivo, datos)
    } else {
      await storeCaninos.postCanino(datos)
    }
    mostrarFormulario.value = false
    mostrarDetalle.value = false
    resetear()
    await cargar(true)
  } catch {
    // el store ya notificó; el formulario queda abierto para corregir
  }
}

onMounted(async () => {
  storeCiudades.obtenerCiudades()
  await cargar()
  if (route.query.ver) {
    const canino = storeCaninos.buscarCanino(String(route.query.ver))
    if (canino) verDetalle(canino)
  }
})
</script>

<style scoped>
.lista-con-fab {
  padding-bottom: 80px; /* que el botón flotante no tape la última tarjeta */
}

.toggle-borde {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.fila-activacion {
  background: #f5f6f8;
  border-radius: 10px;
  padding: 10px 12px;
}
</style>