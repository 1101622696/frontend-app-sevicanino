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
          placeholder-busqueda="Buscar ciudad"
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
          icono="location_city"
          texto-vacio="Aún no hay ciudades registradas"
          texto-ayuda="Cree las ciudades donde hay puestos con caninos para poder asignar manejadores y caninos."
          texto-accion="Crear ciudad"
          @accion="abrirCrear"
          @limpiar="reiniciar"
        />

        <div v-if="!cargandoInicial" class="column q-gutter-y-sm lista-con-fab">
          <TarjetaRegistro
            v-for="ciudad in listaFiltrada"
            :key="ciudad.consecutivo"
            :titulo="ciudad.nombre"
            :subtitulo="ciudad.consecutivo"
            :lineas="[textoConteos(ciudad)]"
            :badges="[badgeEstado(ciudad)]"
            icono="location_city"
            color-avatar="red-1"
            color-texto-avatar="red-9"
            :clickable="false"
          />
        </div>
      </div>
    </q-pull-to-refresh>

    <DialogoFormulario
      v-model="mostrarFormulario"
      titulo="Crear ciudad"
      subtitulo="Después podrá asignarle manejadores y caninos"
      :cargando="storeCiudades.loading"
      texto-guardar="Crear ciudad"
      icono-guardar="add"
      @guardar="guardar"
      @cerrar="nombre = ''"
    >
      <q-input
        v-model.trim="nombre"
        label="Nombre de la ciudad"
        outlined
        rounded
        dense
        bg-color="white"
        autofocus
        @keyup.enter="guardar"
      />
    </DialogoFormulario>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" aria-label="Crear ciudad" @click="abrirCrear" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStoreCiudades } from '../stores/ciudades'
import { useStoreCaninos } from '../stores/caninos'
import { useStoreUsuarios } from '../stores/usuarios'
import { useFiltrosLista } from '../composables/useFiltrosLista'
import { filtroTodos, filtroPorCampo } from '../composables/filtrosComunes'
import { ESTADOS_REGISTRO } from '../composables/catalogos'
import { aOpcionesFiltro, capitalizar, normalizar, plural } from '../utils/texto'
import { validarRequeridos } from '../utils/formulario'

import BarraFiltros from '../components/BarraFiltros.vue'
import EncabezadoLista from '../components/EncabezadoLista.vue'
import EstadoLista from '../components/EstadoLista.vue'
import TarjetaRegistro from '../components/TarjetaRegistro.vue'
import DialogoFormulario from '../components/DialogoFormulario.vue'

defineOptions({ name: 'CiudadesPage' })

const storeCiudades = useStoreCiudades()
const storeCaninos = useStoreCaninos()
const useUsuario = useStoreUsuarios()

const CONFIG_FILTROS = {
  todos: filtroTodos('Todas las ciudades', 'location_city'),
  estado: filtroPorCampo({
    campo: 'estado',
    titulo: 'Ciudades por estado',
    etiquetaChip: 'Estado',
    icono: 'toggle_on',
    color: 'green',
    opciones: aOpcionesFiltro(ESTADOS_REGISTRO),
  }),
}

// ── Datos ──
const cargando = ref(false)
const usuarios = ref([])
const registros = computed(() => storeCiudades.ciudades)
const cargandoInicial = computed(() => cargando.value && !registros.value.length)

async function cargar(forzar = false) {
  cargando.value = true
  try {
    const [, , listaUsuarios] = await Promise.all([
      storeCiudades.obtenerCiudades({ forzar }),
      storeCaninos.obtenerCaninos({ forzar }).catch(() => []),
      useUsuario.listarUsuario(),
    ])
    usuarios.value = listaUsuarios
  } finally {
    cargando.value = false
  }
}

async function refrescar(terminar) {
  await cargar(true)
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
} = useFiltrosLista(CONFIG_FILTROS, registros, {
  compararOrden: (a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'),
  ordenInicial: 'asc',
  etiquetasOrden: { asc: 'A → Z', desc: 'Z → A' },
  camposBusqueda: ['nombre', 'consecutivo'],
  esAdmin: () => true,
})

const hayFiltros = computed(() => tipoLista.value !== 'todos' || Boolean(busqueda.value))

// ── Presentación ──
// Cuántos caninos activos y manejadores tiene cada ciudad: ayuda a ver dónde falta personal
const conteos = computed(() => {
  const mapa = new Map()
  const sumar = (ciudadId, campo) => {
    const clave = normalizar(ciudadId)
    if (!mapa.has(clave)) mapa.set(clave, { caninos: 0, manejadores: 0 })
    mapa.get(clave)[campo] += 1
  }
  storeCaninos.caninos
    .filter((c) => normalizar(c.estado || 'activo') === 'activo')
    .forEach((c) => sumar(c.ciudad_id, 'caninos'))
  usuarios.value
    .filter((u) => u.perfil === 'manejador' && normalizar(u.estado || 'activo') === 'activo')
    .forEach((u) => sumar(u.ciudad_id, 'manejadores'))
  return mapa
})

function textoConteos(ciudad) {
  const datos = conteos.value.get(normalizar(ciudad.consecutivo)) || { caninos: 0, manejadores: 0 }
  return `${plural(datos.caninos, 'canino activo', 'caninos activos')}, ${plural(datos.manejadores, 'manejador', 'manejadores')}`
}

const badgeEstado = (ciudad) =>
  normalizar(ciudad.estado || 'activo') === 'activo'
    ? { etiqueta: 'Activa', color: 'green-1', textColor: 'green-9' }
    : { etiqueta: capitalizar(ciudad.estado), color: 'grey-3', textColor: 'grey-7' }

// ── Crear ──
const mostrarFormulario = ref(false)
const nombre = ref('')

function abrirCrear() {
  nombre.value = ''
  mostrarFormulario.value = true
}

async function guardar() {
  const datos = { nombre: nombre.value }
  const reglas = [
    { campo: 'nombre', mensaje: 'Escriba el nombre de la ciudad' },
    {
      campo: 'nombre',
      mensaje: 'Ya existe una ciudad con ese nombre',
      validar: (valor) => !registros.value.some((c) => normalizar(c.nombre) === normalizar(valor)),
    },
  ]
  if (!validarRequeridos(datos, reglas)) return

  try {
    await storeCiudades.postCiudad(datos)
    mostrarFormulario.value = false
    nombre.value = ''
    await storeCiudades.obtenerCiudades({ forzar: true })
  } catch {
    // el store ya notificó
  }
}

onMounted(() => cargar())
</script>

<style scoped>
.lista-con-fab {
  padding-bottom: 80px;
}
</style>