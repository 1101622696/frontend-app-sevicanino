<template>
  <q-page class="bg-grey-2">
    <q-pull-to-refresh color="primary" @refresh="refrescar">
      <div class="q-pa-md">
        <!-- Total del mes según el filtro actual (el cálculo de días restantes va en el home) -->
        <div v-if="registros.length" class="resumen-mes row items-center no-wrap q-mb-md">
          <q-icon name="inventory_2" color="brown-6" size="28px" class="q-mr-md" />
          <div class="col">
            <div class="text-h6 text-weight-medium">{{ formatearKg(totalMes) }}</div>
            <div class="text-caption text-grey-7">Ingresados en {{ nombreMes }}{{ textoAlcanceResumen }}</div>
          </div>
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
          :con-busqueda="false"
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
          icono="inventory_2"
          texto-vacio="Aún no hay ingresos de alimento registrados"
          texto-ayuda="Registre cada entrega de alimento con su factura o remisión."
          texto-accion="Registrar ingreso"
          @accion="abrirCrear"
          @limpiar="reiniciar"
        />

        <div v-if="!cargandoInicial" class="column q-gutter-y-sm lista-con-fab">
          <TarjetaRegistro
            v-for="registro in listaFiltrada"
            :key="registro.consecutivo"
            :titulo="formatearKg(registro.kg_ingresados)"
            :subtitulo="storeCiudades.nombreCiudad(registro.ciudad_id)"
            :lineas="[formatearFecha(registro.fecha_ingreso), registro.ingresado_por ? `Por ${registro.ingresado_por}` : '']"
            :badges="registro.link ? [{ etiqueta: 'Con soporte', color: 'blue-1', textColor: 'blue-9' }] : []"
            icono="inventory_2"
            color-avatar="brown-1"
            color-texto-avatar="brown-8"
            @click="verDetalle(registro)"
          />
        </div>
      </div>
    </q-pull-to-refresh>

    <!-- Detalle -->
    <DialogoDetalle
      v-model="mostrarDetalle"
      :titulo="detalle ? formatearKg(detalle.kg_ingresados) : ''"
      :subtitulo="detalle ? storeCiudades.nombreCiudad(detalle.ciudad_id) : ''"
      icono="inventory_2"
      color-avatar="brown-1"
      color-texto-avatar="brown-8"
      :campos="camposDetalle"
      :enlace="detalle?.link || ''"
      texto-enlace="Ver factura o remisión"
      @editar="abrirEditar"
    />

    <!-- Formulario -->
    <DialogoFormulario
      v-model="mostrarFormulario"
      :titulo="esEdicion ? 'Editar ingreso' : 'Registrar ingreso de alimento'"
      subtitulo="Kilos que llegaron y la fecha de la entrega"
      :cargando="storeAlimentacion.loading"
      :texto-guardar="esEdicion ? 'Guardar cambios' : 'Registrar ingreso'"
      :icono-guardar="esEdicion ? 'save' : 'add'"
      @guardar="guardar"
      @cerrar="resetear"
    >
      <div class="seccion-formulario">Ingreso</div>

      <CampoCiudad v-model="formulario.ciudad_id" :bloqueada="!useUsuario.esAdmin" />

      <CampoFecha v-model="formulario.fecha_ingreso" label="Fecha de ingreso" :maximo="hoy()" />

      <q-input
        v-model="formulario.kg_ingresados"
        label="Kilos ingresados"
        inputmode="decimal"
        suffix="kg"
        hint="Puede usar coma o punto para los decimales: 12,5"
        outlined
        rounded
        dense
        bg-color="white"
      />

      <div class="seccion-formulario">Soporte</div>

      <CampoArchivos v-model="formulario.archivos" label="Factura o remisión" :link-actual="formulario.link" />
    </DialogoFormulario>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" aria-label="Registrar ingreso de alimento" @click="abrirCrear" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStoreAlimentacion } from '../stores/alimentacion'
import { useStoreCiudades } from '../stores/ciudades'
import { useStoreUsuarios } from '../stores/usuarios'
import { useFiltrosLista } from '../composables/useFiltrosLista'
import { FILTROS_ALIMENTACION } from '../composables/filtrosmodulos'
import { hoy, formatearFecha, normalizarFecha } from '../utils/fechas'
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

defineOptions({ name: 'AlimentacionPage' })

const storeAlimentacion = useStoreAlimentacion()
const storeCiudades = useStoreCiudades()
const useUsuario = useStoreUsuarios()

// ── Números ──
/** '12,5' o '12.5' → 12.5. Vacío o inválido → NaN */
const aNumero = (valor) => Number(String(valor ?? '').trim().replace(',', '.'))

const formatoKg = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })
const formatearKg = (valor) => {
  const numero = aNumero(valor)
  return Number.isNaN(numero) ? '— kg' : `${formatoKg.format(numero)} kg`
}

// ── Lista ──
const registros = ref([])
const cargando = ref(false)
const cargandoInicial = computed(() => cargando.value && !registros.value.length)

async function cargar() {
  cargando.value = true
  try {
    const lista = await storeAlimentacion.obtenerAlimentaciones()
    registros.value = Array.isArray(lista) ? lista : []
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
} = useFiltrosLista(FILTROS_ALIMENTACION.config, registros, {
  ...FILTROS_ALIMENTACION.opcionesLista,
  esAdmin: () => useUsuario.esAdmin,
})

const hayFiltros = computed(() => tipoLista.value !== 'todos')

// ── Resumen del mes ──
const mesActual = computed(() => hoy().slice(0, 7)) // 'YYYY-MM'

const nombreMes = computed(() =>
  new Date(`${mesActual.value}-15T12:00:00`).toLocaleDateString('es-CO', { month: 'long' }),
)

const totalMes = computed(() =>
  listaFiltrada.value
    .filter((r) => normalizarFecha(r.fecha_ingreso).startsWith(mesActual.value))
    .reduce((suma, r) => suma + (Number.isNaN(aNumero(r.kg_ingresados)) ? 0 : aNumero(r.kg_ingresados)), 0),
)

const textoAlcanceResumen = computed(() => {
  if (!useUsuario.esAdmin) return ''
  return tipoLista.value === 'ciudad' && etiquetaValorFiltro.value
    ? ` en ${etiquetaValorFiltro.value}`
    : ' en todas las ciudades'
})

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
    { etiqueta: 'Ciudad', valor: storeCiudades.nombreCiudad(d.ciudad_id) },
    { etiqueta: 'Fecha de ingreso', valor: formatearFecha(d.fecha_ingreso) },
    { etiqueta: 'Kilos', valor: formatearKg(d.kg_ingresados) },
    { etiqueta: 'Registrado por', valor: d.ingresado_por },
  ]
})

// ── Formulario ──
const mostrarFormulario = ref(false)
const esEdicion = ref(false)

// ingresado_por lo pone el backend con el nombre del token
const nuevoFormulario = () => ({
  consecutivo: '',
  ciudad_id: useUsuario.esAdmin ? '' : useUsuario.ciudadUsuario,
  fecha_ingreso: hoy(),
  kg_ingresados: '',
  link: '',
  archivos: [],
})

const formulario = ref(nuevoFormulario())

function abrirCrear() {
  esEdicion.value = false
  formulario.value = nuevoFormulario()
  // El admin con la lista filtrada por ciudad: se preselecciona
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
  base.fecha_ingreso = normalizarFecha(base.fecha_ingreso)
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
    { campo: 'fecha_ingreso', mensaje: 'Seleccione la fecha de ingreso' },
    {
      campo: 'kg_ingresados',
      mensaje: 'Escriba los kilos ingresados (un número mayor que cero)',
      validar: (valor) => aNumero(valor) > 0,
    },
  ]
  if (!validarRequeridos(formulario.value, reglas)) return

  // Se envía con punto decimal para que la hoja lo tome como número
  const datosFormulario = { ...formulario.value, kg_ingresados: String(aNumero(formulario.value.kg_ingresados)) }

  const datos = construirFormData(datosFormulario, {
    archivos: formulario.value.archivos,
    excluir: ['consecutivo', 'link'],
  })

  try {
    if (esEdicion.value) {
      await storeAlimentacion.putAlimentacion(formulario.value.consecutivo, datos)
    } else {
      await storeAlimentacion.postAlimentacion(datos)
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

.resumen-mes {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 12px 16px;
}
</style>