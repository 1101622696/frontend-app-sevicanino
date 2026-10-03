<template>
  <div class="hoja-vida q-mt-lg">
    <!-- ═══ Certificados ═══ -->
    <div class="row items-center q-mb-sm">
      <span class="text-subtitle2">Certificados</span>
      <q-space />
      <q-spinner v-if="cargando" color="primary" size="16px" />
      <q-btn
        v-else-if="error"
        flat
        dense
        no-caps
        size="sm"
        color="primary"
        icon="refresh"
        label="Reintentar"
        @click="cargar"
      />
    </div>

    <q-list bordered separator class="hoja-vida__lista">
      <q-item
        v-for="tipo in TIPOS_CERTIFICADO"
        :key="tipo.clave"
        clickable
        :disable="cargando"
      >
        <q-item-section avatar>
          <q-avatar size="36px" v-bind="avatarCertificado(tipo.clave)" :icon="tipo.icono" />
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-body2">{{ tipo.titulo }}</q-item-label>
          <q-item-label caption>{{ textoVencimiento(tipo.clave) }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-badge v-bind="badgeCertificado(tipo.clave).props" rounded>
            {{ badgeCertificado(tipo.clave).etiqueta }}
          </q-badge>
        </q-item-section>

        <!-- Al tocar la fila: acciones disponibles para ese certificado -->
        <q-menu auto-close anchor="bottom right" self="top right">
          <q-list style="min-width: 220px">
            <q-item v-if="certificado(tipo.clave)?.link" clickable @click="verSoporte(tipo)">
              <q-item-section avatar><q-icon name="folder_open" /></q-item-section>
              <q-item-section>Ver soporte</q-item-section>
            </q-item>
            <q-item clickable @click="abrirNuevo(tipo)">
              <q-item-section avatar><q-icon name="add" /></q-item-section>
              <q-item-section>{{ certificado(tipo.clave) ? 'Registrar renovación' : 'Registrar certificado' }}</q-item-section>
            </q-item>
            <q-item v-if="certificado(tipo.clave)" clickable @click="abrirCorreccion(tipo)">
              <q-item-section avatar><q-icon name="edit" /></q-item-section>
              <q-item-section>Corregir datos</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>
    </q-list>

    <!-- ═══ Historial en los módulos ═══ -->
    <div class="text-subtitle2 q-mt-lg q-mb-sm">Historial</div>
    <div class="hoja-vida__accesos">
      <q-btn
        v-for="modulo in MODULOS_HISTORIAL"
        :key="modulo.ruta"
        outline
        no-caps
        align="left"
        color="grey-8"
        :icon="modulo.icono"
        :label="modulo.titulo"
        class="hoja-vida__acceso"
        @click="irAModulo(modulo.ruta)"
      />
    </div>

    <!-- ═══ Traslados ═══ -->
    <div class="row items-center q-mt-lg q-mb-sm">
      <span class="text-subtitle2">Traslados</span>
      <q-space />
      <q-btn
        v-if="useUsuario.esAdmin"
        flat
        dense
        no-caps
        color="primary"
        icon="swap_horiz"
        label="Trasladar"
        @click="abrirTraslado"
      />
    </div>

    <div v-if="!cargando && !traslados.length" class="text-caption text-grey-7 q-px-xs">
      Este canino no ha tenido traslados. Siempre ha estado en {{ storeCiudades.nombreCiudad(canino.ciudad_id) }}.
    </div>

    <q-list v-else-if="traslados.length" bordered separator class="hoja-vida__lista">
      <q-item v-for="traslado in traslados" :key="traslado.consecutivo">
        <q-item-section avatar>
          <q-icon name="swap_horiz" color="grey-6" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-body2">
            De {{ storeCiudades.nombreCiudad(traslado.ciudad_anterior_id) }} a
            {{ storeCiudades.nombreCiudad(traslado.ciudad_nueva_id) }}
          </q-item-label>
          <q-item-label caption>
            {{ formatearFecha(traslado.fecha_creacion) }}{{ traslado.realizado_por ? `, por ${traslado.realizado_por}` : '' }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- ═══ Formulario de certificado ═══ -->
    <DialogoFormulario
      v-model="mostrarFormCertificado"
      :titulo="tituloFormCertificado"
      :subtitulo="canino.nombre"
      :cargando="storeCertificados.loading"
      :texto-guardar="formCertificado.consecutivo ? 'Guardar cambios' : 'Registrar'"
      :icono-guardar="formCertificado.consecutivo ? 'save' : 'add'"
      @guardar="guardarCertificado"
      @cerrar="tipoActivo = null"
    >
      <div class="seccion-formulario">Vigencia</div>

      <CampoFecha v-model="formCertificado.fecha_emision" label="Fecha de emisión" :maximo="hoy()" />

      <CampoFecha
        v-model="formCertificado.fecha_vencimiento"
        label="Fecha de vencimiento"
        :minimo="formCertificado.fecha_emision"
      />

      <div class="row q-gutter-sm">
        <q-chip
          v-for="atajo in ATAJOS_VIGENCIA"
          :key="atajo.meses"
          clickable
          outline
          color="primary"
          icon="event_repeat"
          :disable="!formCertificado.fecha_emision"
          @click="formCertificado.fecha_vencimiento = sumarMeses(formCertificado.fecha_emision, atajo.meses)"
        >
          {{ atajo.etiqueta }}
        </q-chip>
      </div>

      <div class="seccion-formulario">Soporte</div>

      <CampoArchivos
        v-model="formCertificado.archivos"
        label="Certificado escaneado o foto"
        :link-actual="formCertificado.link"
      />
    </DialogoFormulario>

    <!-- ═══ Formulario de traslado (solo admin) ═══ -->
    <DialogoFormulario
      v-model="mostrarFormTraslado"
      titulo="Trasladar canino"
      :subtitulo="canino.nombre"
      :cargando="storeCaninos.loading"
      texto-guardar="Confirmar traslado"
      icono-guardar="swap_horiz"
      @guardar="guardarTraslado"
    >
      <q-input
        :model-value="storeCiudades.nombreCiudad(canino.ciudad_id)"
        label="Ciudad actual"
        readonly
        outlined
        rounded
        dense
        bg-color="white"
      />

      <q-select
        v-model="ciudadDestino"
        :options="ciudadesDestino"
        label="Trasladar a"
        emit-value
        map-options
        outlined
        rounded
        dense
        bg-color="white"
      >
        <template #prepend>
          <q-icon name="location_city" />
        </template>
      </q-select>

      <q-banner v-if="ciudadDestino" rounded class="bg-orange-1 text-orange-10">
        <template #avatar>
          <q-icon name="info" color="orange-8" />
        </template>
        {{ canino.nombre }} pasará a {{ storeCiudades.nombreCiudad(ciudadDestino) }}. Los manejadores de
        {{ storeCiudades.nombreCiudad(canino.ciudad_id) }} dejarán de verlo, y los de
        {{ storeCiudades.nombreCiudad(ciudadDestino) }} verán todo su historial.
      </q-banner>
    </DialogoFormulario>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStoreCertificados, TIPOS_CERTIFICADO } from '../stores/certificados'
import { useStoreCaninos } from '../stores/caninos'
import { useStoreCiudades } from '../stores/ciudades'
import { useStoreUsuarios } from '../stores/usuarios'
import { normalizar } from '../utils/texto'
import {
  hoy,
  formatearFecha,
  normalizarFecha,
  sumarMeses,
  mesesEntre,
  compararFechas,
  estadoVencimiento,
  ESTADOS_VENCIMIENTO,
} from '../utils/fechas'
import { construirFormData, validarRequeridos } from '../utils/formulario'
import { abrirEnlace } from '../utils/enlaces'

import DialogoFormulario from './DialogoFormulario.vue'
import CampoFecha from './CampoFecha.vue'
import CampoArchivos from './CampoArchivos.vue'

const props = defineProps({
  canino: { type: Object, required: true }, // fila completa del canino
})

const emit = defineEmits(['trasladado'])

const router = useRouter()
const storeCertificados = useStoreCertificados()
const storeCaninos = useStoreCaninos()
const storeCiudades = useStoreCiudades()
const useUsuario = useStoreUsuarios()

const MODULOS_HISTORIAL = [
  { titulo: 'Vacunación', icono: 'vaccines', ruta: 'VacunacionPage' },
  { titulo: 'Tratamientos', icono: 'medication', ruta: 'TratamientosPage' },
  { titulo: 'Revisiones', icono: 'fact_check', ruta: 'RevisionesPage' },
  { titulo: 'Profilaxis', icono: 'sanitizer', ruta: 'ProfilaxisPage' },
  { titulo: 'Siniestros', icono: 'report', ruta: 'SiniestrosPage' },
  { titulo: 'Actividades', icono: 'event_note', ruta: 'ActividadesPage' },
]

const ATAJOS_VIGENCIA = [
  { etiqueta: '1 año', meses: 12 },
  { etiqueta: '2 años', meses: 24 },
]

// ─────────────────────────────────────────────────────────────
// Carga
// ─────────────────────────────────────────────────────────────

const cargando = ref(false)
const error = ref(false)
const certificados = ref({})
const traslados = ref([])

async function cargar() {
  if (!props.canino?.consecutivo) return
  cargando.value = true
  error.value = false
  const resumen = await storeCertificados.obtenerResumen(props.canino.consecutivo)
  if (resumen) {
    certificados.value = resumen.certificados
    traslados.value = resumen.traslados
  } else {
    error.value = true
  }
  cargando.value = false
}

watch(() => props.canino?.consecutivo, cargar, { immediate: true })

// ─────────────────────────────────────────────────────────────
// Presentación de certificados
// ─────────────────────────────────────────────────────────────

const certificado = (clave) => certificados.value[clave] || null

const estadoCertificado = (clave) => {
  const c = certificado(clave)
  return c ? estadoVencimiento(c.fecha_vencimiento, { diasAviso: 30 }) : null
}

function textoVencimiento(clave) {
  if (cargando.value && !certificado(clave)) return 'Cargando...'
  const c = certificado(clave)
  if (!c) return 'Sin registrar'
  const estado = estadoCertificado(clave)
  return estado?.estado === ESTADOS_VENCIMIENTO.VENCIDO
    ? `Venció el ${formatearFecha(c.fecha_vencimiento)}`
    : `Vence el ${formatearFecha(c.fecha_vencimiento)}`
}

function badgeCertificado(clave) {
  const estado = estadoCertificado(clave)
  if (!estado) {
    return { etiqueta: 'Falta', props: { color: 'grey-3', textColor: 'grey-8' } }
  }
  const etiquetas = {
    [ESTADOS_VENCIMIENTO.VENCIDO]: 'Vencido',
    [ESTADOS_VENCIMIENTO.PROXIMO]: 'Por vencer',
    [ESTADOS_VENCIMIENTO.VIGENTE]: 'Vigente',
  }
  return {
    etiqueta: etiquetas[estado.estado] || 'Sin fecha',
    props: { color: estado.color, textColor: estado.textColor },
  }
}

function avatarCertificado(clave) {
  const estado = estadoCertificado(clave)
  if (!estado) return { color: 'grey-2', textColor: 'grey-6' }
  return { color: estado.color, textColor: estado.textColor }
}

function verSoporte(tipo) {
  const c = certificado(tipo.clave)
  if (c?.link) abrirEnlace(c.link, `${tipo.titulo} de ${props.canino.nombre}`)
}

// ─────────────────────────────────────────────────────────────
// Navegación a los módulos filtrados por este canino
// ─────────────────────────────────────────────────────────────

function irAModulo(nombreRuta) {
  router.push({ name: nombreRuta, query: { canino: props.canino.consecutivo } })
}

// ─────────────────────────────────────────────────────────────
// Formulario de certificado
// ─────────────────────────────────────────────────────────────

const mostrarFormCertificado = ref(false)
const tipoActivo = ref(null)

const nuevoFormCertificado = () => ({
  consecutivo: '',
  fecha_emision: hoy(),
  fecha_vencimiento: '',
  link: '',
  archivos: [],
})

const formCertificado = ref(nuevoFormCertificado())

const tituloFormCertificado = computed(() => {
  if (!tipoActivo.value) return ''
  if (formCertificado.value.consecutivo) return `Corregir ${tipoActivo.value.titulo.toLowerCase()}`
  return certificado(tipoActivo.value.clave) ? 'Registrar renovación' : `Registrar ${tipoActivo.value.titulo.toLowerCase()}`
})

/** Nuevo o renovación: si ya había uno, repite su duración (si duraba 2 años, sugiere 2 años) */
function abrirNuevo(tipo) {
  const anterior = certificado(tipo.clave)
  const duracion = anterior ? mesesEntre(anterior.fecha_emision, anterior.fecha_vencimiento) : 12

  tipoActivo.value = tipo
  formCertificado.value = {
    ...nuevoFormCertificado(),
    fecha_vencimiento: sumarMeses(hoy(), duracion > 0 ? duracion : 12),
  }
  mostrarFormCertificado.value = true
}

function abrirCorreccion(tipo) {
  const c = certificado(tipo.clave)
  if (!c) return
  tipoActivo.value = tipo
  formCertificado.value = {
    consecutivo: c.consecutivo,
    fecha_emision: normalizarFecha(c.fecha_emision),
    fecha_vencimiento: normalizarFecha(c.fecha_vencimiento),
    link: c.link || '',
    archivos: [],
  }
  mostrarFormCertificado.value = true
}

async function guardarCertificado() {
  const reglas = [
    { campo: 'fecha_emision', mensaje: 'Seleccione la fecha de emisión' },
    { campo: 'fecha_vencimiento', mensaje: 'Seleccione la fecha de vencimiento' },
    {
      campo: 'fecha_vencimiento',
      mensaje: 'El vencimiento debe ser después de la emisión',
      validar: (valor, datos) => compararFechas(valor, datos.fecha_emision) > 0,
    },
  ]
  if (!validarRequeridos(formCertificado.value, reglas)) return

  const datos = construirFormData(
    { ...formCertificado.value, canino_id: props.canino.consecutivo },
    { archivos: formCertificado.value.archivos, excluir: ['consecutivo', 'link'] },
  )

  try {
    await storeCertificados.guardarCertificado(
      tipoActivo.value.clave,
      datos,
      formCertificado.value.consecutivo || null,
    )
    mostrarFormCertificado.value = false
    tipoActivo.value = null
    await cargar()
  } catch {
    // el store ya notificó
  }
}

// ─────────────────────────────────────────────────────────────
// Traslado (solo admin; el backend también lo valida)
// ─────────────────────────────────────────────────────────────

const mostrarFormTraslado = ref(false)
const ciudadDestino = ref(null)

const ciudadesDestino = computed(() =>
  storeCiudades.opcionesCiudades.filter((op) => normalizar(op.value) !== normalizar(props.canino.ciudad_id)),
)

function abrirTraslado() {
  ciudadDestino.value = null
  mostrarFormTraslado.value = true
}

async function guardarTraslado() {
  if (!ciudadDestino.value) {
    validarRequeridos({ ciudad: '' }, [{ campo: 'ciudad', mensaje: 'Seleccione la ciudad de destino' }])
    return
  }
  try {
    await storeCaninos.postTraslado({
      canino_id: props.canino.consecutivo,
      ciudad_nueva_id: ciudadDestino.value,
    })
    mostrarFormTraslado.value = false
    emit('trasladado', ciudadDestino.value)
    await cargar()
  } catch {
    // el store ya notificó
  }
}
</script>

<style scoped>
.hoja-vida__lista {
  border-radius: 12px;
  background: #fff;
}

.hoja-vida__accesos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.hoja-vida__acceso {
  border-radius: 10px;
}
</style>