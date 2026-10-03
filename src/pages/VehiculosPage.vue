<template>
  <q-page padding class="bg-grey-2">
    <!-- Filtros -->
    <div class="filter-bar q-mb-md">
      <div class="filter-scroll row no-wrap q-gutter-x-sm q-pb-xs">
        <q-chip
          v-for="(config, tipo) in filtrosConfig"
          :key="tipo"
          clickable
          :icon="config.icono"
          :color="tipoLista === tipo ? 'primary' : 'grey-2'"
          :text-color="tipoLista === tipo ? 'white' : 'grey-8'"
          class="filter-chip"
          @click="cargarListaPor(tipo)"
        >
          {{ tipo === 'todos' ? 'Todos' : config.titulo.split(' ').pop() }}
        </q-chip>
      </div>

      <div
        v-if="tipoLista !== 'todos' && !filtroActual.esFiltroTexto"
        class="row no-wrap q-gutter-x-sm q-mt-sm"
      >
        <q-chip
          v-for="op in opcionesOrdenamiento"
          :key="op.value"
          clickable
          size="sm"
          :color="ordenActual === op.value ? 'secondary' : 'transparent'"
          :text-color="ordenActual === op.value ? 'white' : 'grey-7'"
          :outline="ordenActual !== op.value"
          @click="ordenActual = op.value; cargarVehiculos()"
        >
          {{ op.label }}
        </q-chip>
      </div>

      <div v-if="filtroActual.esFiltroTexto" class="q-mt-sm">
        <q-select
          v-model="valorFiltroTexto"
          :options="opcionesFiltroTexto"
          option-value="valor"
          option-label="etiqueta"
          dense
          outlined
          rounded
          emit-value
          map-options
          @update:model-value="actualizarValorFiltro"
        />
      </div>
    </div>

    <!-- Encabezado -->
    <div class="row items-center q-mb-sm">
      <q-icon :name="filtroActual.icono" :color="filtroActual.color" size="20px" />
      <span class="text-subtitle1 text-weight-medium q-ml-xs">
        {{ filtroActual.titulo }}
        <span v-if="filtroActual.esFiltroTexto && valorFiltroTexto">
          · {{ obtenerEtiquetaFiltroTexto(valorFiltroTexto) }}
        </span>
      </span>
      <q-badge color="blue-1" text-color="blue-9" class="q-ml-auto" rounded>
        {{ vehiculos.length }}
      </q-badge>
    </div>

    <!-- Cards -->
    <div class="q-gutter-y-sm">
      <q-card
        v-for="vehiculo in vehiculos"
        :key="vehiculo.placa"
        flat
        bordered
        class="vehiculo-card cursor-pointer"
        @click="verDetalles(vehiculo.placa)"
      >
        <q-card-section class="q-pa-md">
          <div class="row items-center q-mb-sm">
            <div class="placa-badge q-mr-sm">{{ vehiculo.placa }}</div>
            <div>
              <div class="text-body2 text-weight-medium">
                {{ vehiculo.marca }} {{ vehiculo.modelo }}
              </div>
              <div class="text-caption text-grey-6">{{ vehiculo.referencia }}</div>
            </div>
            <q-space />
            <q-badge
              :color="vehiculo.estado === 'activo' ? 'green-1' : 'grey-3'"
              :text-color="vehiculo.estado === 'activo' ? 'green-9' : 'grey-7'"
              rounded
            >
              {{ vehiculo.estado || 'sin estado' }}
            </q-badge>
          </div>

          <div class="row q-gutter-x-sm">
            <div class="metrica-chip col">
              <div class="metrica-label">Viajes</div>
              <div class="metrica-valor">{{ vehiculo.viajes || '0' }}</div>
            </div>
            <div class="metrica-chip col">
              <div class="metrica-label">Odómetro</div>
              <div class="metrica-valor">{{ vehiculo.odometro || '—' }} km</div>
            </div>
            <!-- <div class="metrica-chip col">
              <div class="metrica-label">Rendimiento</div>
              <div class="metrica-valor">{{ vehiculo.valorFiltro !== undefined ? obtenerEtiquetaValor(vehiculo.valorFiltro) : '—' }}</div>
            </div> -->
          </div>

          <div
            class="row items-center q-mt-sm"
            style="border-top: 1px solid rgba(0, 0, 0, 0.06); padding-top: 8px"
          >
            <q-icon name="local_gas_station" size="13px" color="grey-5" class="q-mr-xs" />
            <span class="text-caption text-grey-5">{{ vehiculo.combustible }}</span>
            <q-space />
            <q-icon name="chevron_right" color="grey-4" size="16px" />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Dialog detalles -->
    <q-dialog v-model="mostrarDetalles" persistent>
      <q-card
        style="min-width: 350px; max-width: 95vw; width: 500px; border-radius: 16px !important"
      >
        <!-- Header -->
        <q-card-section class="q-pb-sm">
          <div class="row items-center">
            <div>
              <div class="text-subtitle1 text-weight-medium">Detalles del vehículo</div>
              <div class="text-caption text-grey-6" v-if="detallesVehiculo">
                {{ detallesVehiculo.marca }} {{ detallesVehiculo.modelo }} ·
                {{ detallesVehiculo.clase_vehiculo }}
              </div>
            </div>
            <q-space />
            <q-badge
              v-if="detallesVehiculo"
              :color="detallesVehiculo.estado === 'activo' ? 'green-1' : 'grey-3'"
              :text-color="detallesVehiculo.estado === 'activo' ? 'green-9' : 'grey-7'"
              rounded
            >
              {{ detallesVehiculo.estado || 'sin estado' }}
            </q-badge>
          </div>
        </q-card-section>

        <q-separator />

        <!-- <div> -->
        <q-card-section
          class="q-pt-md"
          v-if="detallesVehiculo"
          style="max-height: 65vh; overflow-y: auto"
        >
          <!-- Placa destacada -->
          <div class="row justify-center q-mb-md">
            <div class="placa-badge-lg">{{ detallesVehiculo.placa }}</div>
          </div>

          <!-- Métricas rápidas -->
          <div class="row q-gutter-sm q-mb-md">
            <div class="metrica-chip col">
              <div class="metrica-label">Viajes</div>
              <div class="metrica-valor">{{ detallesVehiculo.viajes || '0' }}</div>
            </div>
            <div class="metrica-chip col">
              <div class="metrica-label">Odómetro</div>
              <div class="metrica-valor">{{ detallesVehiculo.odometro }} km</div>
            </div>
            <div class="metrica-chip col">
              <div class="metrica-label">Rendimiento</div>
              <div class="metrica-valor">{{ detallesVehiculo.rendimiento_galon }} km/gl</div>
            </div>
          </div>

          <!-- Sección: Identificación -->
          <div class="seccion-titulo">Identificación</div>
          <div class="detalle-fila">
            <span class="detalle-label">Licencia</span>
            <span class="detalle-valor">{{ detallesVehiculo.licencia || '—' }}</span>
          </div>
          <div class="detalle-fila">
            <span class="detalle-label">N° motor</span>
            <span class="detalle-valor">{{ detallesVehiculo.numero_motor || '—' }}</span>
          </div>
          <div class="detalle-fila">
            <span class="detalle-label">N° chasis</span>
            <span class="detalle-valor">{{ detallesVehiculo.numero_chasis || '—' }}</span>
          </div>
          <div class="detalle-fila">
            <span class="detalle-label">Fecha matrícula</span>
            <span class="detalle-valor">{{ formatFecha(detallesVehiculo.fecha_matricula) }}</span>
          </div>
          <div class="detalle-fila">
            <span class="detalle-label">Fecha creación</span>
            <span class="detalle-valor">{{ formatFecha(detallesVehiculo.fecha_creacion) }}</span>
          </div>

          <!-- Sección: Características -->
          <div class="seccion-titulo q-mt-md">Características</div>
          <div class="detalle-fila">
            <span class="detalle-label">Color</span>
            <span class="detalle-valor">{{ detallesVehiculo.color || '—' }}</span>
          </div>
          <div class="detalle-fila">
            <span class="detalle-label">Servicio</span>
            <span class="detalle-valor">{{ detallesVehiculo.servicio || '—' }}</span>
          </div>
          <div class="detalle-fila">
            <span class="detalle-label">Capacidad</span>
            <span class="detalle-valor">{{ detallesVehiculo.capacidad || '—' }}</span>
          </div>
          <div class="detalle-fila">
            <span class="detalle-label">Capacidad toneladas</span>
            <span class="detalle-valor">{{ detallesVehiculo.capacidad_ton || '—' }} ton</span>
          </div>
          <div class="detalle-fila">
            <span class="detalle-label">Combustible</span>
            <span class="detalle-valor">{{ detallesVehiculo.combustible || '—' }}</span>
          </div>

          <!-- Sección: Documentos legales -->
          <div class="seccion-titulo q-mt-md">Documentos legales</div>

          <div class="doc-legal-card q-mb-sm">
            <div class="row items-center q-mb-xs">
              <span class="text-body2 text-weight-medium">SOAT</span>
              <q-space />
              <q-badge
                :color="detallesVehiculo.soat === 'activo' ? 'green-1' : 'red-1'"
                :text-color="detallesVehiculo.soat === 'activo' ? 'green-9' : 'red-9'"
                rounded
              >
                {{ detallesVehiculo.soat || '—' }}
              </q-badge>
            </div>
            <div class="row">
              <div class="col">
                <div class="metrica-label">Expedición</div>
                <div style="font-size: 12px">
                  {{ formatFecha(detallesVehiculo.soat_expedicion) }}
                </div>
              </div>
              <div class="col">
                <div class="metrica-label">Vencimiento</div>
                <div style="font-size: 12px">
                  {{ formatFecha(detallesVehiculo.soat_vencimiento) }}
                </div>
              </div>
            </div>
          </div>

          <div class="doc-legal-card q-mb-sm">
            <div class="row items-center q-mb-xs">
              <span class="text-body2 text-weight-medium">Tecnicomecánico</span>
              <q-space />
              <q-badge
                :color="detallesVehiculo.tecnico === 'activo' ? 'green-1' : 'red-1'"
                :text-color="detallesVehiculo.tecnico === 'activo' ? 'green-9' : 'red-9'"
                rounded
              >
                {{ detallesVehiculo.tecnico || '—' }}
              </q-badge>
            </div>
            <div class="row">
              <div class="col">
                <div class="metrica-label">Expedición</div>
                <div style="font-size: 12px">
                  {{ formatFecha(detallesVehiculo.tecnico_expedicion) }}
                </div>
              </div>
              <div class="col">
                <div class="metrica-label">Vencimiento</div>
                <div style="font-size: 12px">
                  {{ formatFecha(detallesVehiculo.tecnico_vencimiento) }}
                </div>
              </div>
            </div>
          </div>

          <div class="doc-legal-card q-mb-md">
            <div class="row items-center q-mb-xs">
              <span class="text-body2 text-weight-medium">Póliza</span>
              <q-space />
              <q-badge
                :color="detallesVehiculo.poliza === 'activo' ? 'green-1' : 'red-1'"
                :text-color="detallesVehiculo.poliza === 'activo' ? 'green-9' : 'red-9'"
                rounded
              >
                {{ detallesVehiculo.poliza || '—' }}
              </q-badge>
            </div>
            <div class="row">
              <div class="col">
                <div class="metrica-label">Expedición</div>
                <div style="font-size: 12px">
                  {{ formatFecha(detallesVehiculo.poliza_expedicion) }}
                </div>
              </div>
              <div class="col">
                <div class="metrica-label">Vencimiento</div>
                <div style="font-size: 12px">
                  {{ formatFecha(detallesVehiculo.poliza_vencimiento) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Activación -->
          <q-separator class="q-mb-md" />
          <div class="detalle-fila">
            <span class="detalle-label">Activación</span>
            <q-toggle
              v-model="isActive"
              :color="detallesVehiculo.estado === 'activo' ? 'grey' : 'primary'"
              @update:model-value="cambiarEstado"
            />
          </div>
        </q-card-section>

        <DriveVisor
          v-model="dialogAbierto"
          :titulo="tituloVisor"
          :archivos="archivos"
          :cargando="cargandoVisor"
          :error="errorVisor"
          :url-archivo="urlArchivo"
          :es-imagen="esImagen"
          :es-pdf="esPdf"
        />

        <q-separator />

        <q-card-actions class="q-pa-md">
          <q-btn
            outline
            color="secondary"
            icon="folder"
            label="Ver archivos"
            size="sm"
            @click="abrirVisor(detallesVehiculo.link, 'Documentos')"
          />
          <q-space />
          <q-btn flat round icon="edit" color="grey-7" @click="editar(detallesVehiculo)" />
          <q-btn flat label="Cerrar" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="alert" persistent transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-grey-2">
        <!-- HEADER -->
        <q-card-section class="bg-primary text-white q-py-md">
          <div class="text-h6 text-weight-bold">
            {{ accion === 1 ? 'Agregar Vehículo' : 'Editar Vehículo' }}
          </div>

          <div class="text-caption text-blue-1">Complete la información del vehículo</div>
        </q-card-section>

        <q-scroll-area style="height: calc(100vh - 140px)">
          <div class="q-pa-md">
            <!-- INFORMACIÓN GENERAL -->
            <q-card flat bordered class="rounded-borders q-mb-md">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  Información General
                </div>

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <q-input filled rounded v-model.trim="formulario.placa" label="Placa" dense />
                  </div>

                  <div class="col-12 col-sm-6">
                    <q-input
                      filled
                      rounded
                      v-model.trim="formulario.licencia"
                      label="Licencia"
                      dense
                    />
                  </div>

                  <div class="col-12 col-sm-6">
                    <q-select
                      filled
                      rounded
                      v-model="formulario.marca"
                      label="Marca"
                      :options="marcaOptions"
                      dense
                    />
                  </div>

                  <div class="col-12 col-sm-6">
                    <q-input filled rounded v-model.trim="formulario.modelo" label="Modelo" dense />
                  </div>

                  <div class="col-12">
                    <q-input
                      filled
                      rounded
                      v-model.trim="formulario.referencia"
                      label="Referencia"
                      dense
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- ESPECIFICACIONES -->
            <q-card flat bordered class="rounded-borders q-mb-md">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  Especificaciones
                </div>

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <q-input
                      filled
                      rounded
                      type="number"
                      v-model.trim="formulario.odometro"
                      label="Odómetro"
                      dense
                    />
                  </div>

                  <div class="col-12 col-sm-6">
                    <q-select
                      filled
                      rounded
                      v-model="formulario.clase_vehiculo"
                      label="Clase de vehículo"
                      :options="clase_vehiculoOptions"
                      dense
                    />
                  </div>

                  <div class="col-12 col-sm-6">
                    <q-input filled rounded v-model.trim="formulario.color" label="Color" dense />
                  </div>

                  <div class="col-12 col-sm-6">
                    <q-select
                      filled
                      rounded
                      v-model="formulario.servicio"
                      label="Servicio"
                      :options="servicioOptions"
                      dense
                    />
                  </div>

                  <div class="col-12 col-sm-6">
                    <q-input
                      filled
                      rounded
                      v-model.trim="formulario.capacidad"
                      label="Capacidad"
                      dense
                    />
                  </div>

                  <div class="col-12 col-sm-6">
                    <q-input
                      filled
                      rounded
                      type="number"
                      v-model.trim="formulario.capacidad_ton"
                      label="Capacidad toneladas"
                      dense
                    />
                  </div>

                  <div class="col-12">
                    <q-select
                      filled
                      rounded
                      v-model="formulario.combustible"
                      label="Combustible"
                      :options="combustibleOptions"
                      dense
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- MOTOR -->
            <q-card flat bordered class="rounded-borders q-mb-md">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  Motor y Chasis
                </div>

                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <q-input
                      filled
                      rounded
                      v-model.trim="formulario.numero_motor"
                      label="Número motor"
                      dense
                    />
                  </div>

                  <div class="col-12">
                    <q-input
                      filled
                      rounded
                      v-model.trim="formulario.numero_chasis"
                      label="Número chasis"
                      dense
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- FECHAS -->
            <q-card flat bordered class="rounded-borders q-mb-md">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  Fechas y Documentación
                </div>

                <div class="row q-col-gutter-md">
                  <!-- FECHA MATRICULA -->
                  <div class="col-12">
                    <div class="text-caption text-grey-7 q-mb-xs">Fecha de matrícula</div>

                    <q-input filled rounded v-model="formulario.fecha_matricula" readonly dense>
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date v-model="formulario.fecha_matricula" />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>

                  <!-- SOAT -->
                  <div class="col-12">
                    <div class="text-caption text-grey-7 q-mb-xs">Fecha expedición SOAT</div>

                    <q-input filled rounded v-model="formulario.soat_expedicion" readonly dense>
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date v-model="formulario.soat_expedicion" />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>

                  <!-- TECNICO -->
                  <div class="col-12">
                    <div class="text-caption text-grey-7 q-mb-xs">
                      Fecha expedición técnico-mecánica
                    </div>

                    <q-input filled rounded v-model="formulario.tecnico_expedicion" readonly dense>
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date v-model="formulario.tecnico_expedicion" />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>

                  <!-- POLIZA -->
                  <div class="col-12">
                    <div class="text-caption text-grey-7 q-mb-xs">Fecha expedición póliza</div>

                    <q-input filled rounded v-model="formulario.poliza_expedicion" readonly dense>
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date v-model="formulario.poliza_expedicion" />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- ARCHIVOS -->
            <q-card flat bordered class="rounded-borders q-mb-xl">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  Archivos Adjuntos
                </div>

                <q-file
                  filled
                  rounded
                  multiple
                  clearable
                  use-chips
                  :model-value="null"
                  label="Seleccionar archivos"
                  accept="image/*, application/pdf, .doc, .docx, .xls, .xlsx, .kml, .kmz"
                  @update:model-value="manejarSeleccionArchivos"
                >
                  <template v-slot:prepend>
                    <q-icon name="attach_file" />
                  </template>
                </q-file>

                <div class="q-mt-md row q-col-gutter-sm">
                  <div v-for="(archivo, index) in formulario.archivos" :key="index" class="col-12">
                    <q-chip
                      removable
                      square
                      color="blue-1"
                      text-color="primary"
                      icon="description"
                      @remove="eliminarArchivo(index)"
                      class="full-width"
                    >
                      {{ archivo.name }}

                      <q-tooltip>
                        {{ archivo.type }} - {{ (archivo.size / 1024).toFixed(2) }} KB
                      </q-tooltip>
                    </q-chip>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-scroll-area>

        <!-- BOTONES -->
        <q-card-actions class="bg-white q-pa-md" align="between">
          <q-btn flat color="grey-8" label="Cerrar" icon="close" @click="cerrar()" />

          <q-btn unelevated rounded color="primary" :loading="cargando" @click="guardar">
            <q-icon :name="accion === 1 ? 'directions_car' : 'edit'" class="q-mr-sm" />

            {{ accion === 1 ? 'Agregar vehículo' : 'Actualizar vehículo' }}

            <template v-slot:loading>
              <q-spinner color="white" size="1em" />
            </template>
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- </div> -->

    <!-- <q-btn color="primary" :label="'Registrar nuevo'" class="q-mt-md" @click="abrir" /> -->

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="abrir" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useStoreVehiculos } from '../stores/vehiculos'
import { useStoreUsuarios } from '../stores/usuarios'
import { useQuasar } from 'quasar'
import { TIPOS_FILTRO, CONFIG_FILTROS } from '../composables/filtrosvehiculos'
import { useDriveVisor } from '../composables/useDriveVisor'
import DriveVisor from 'src/components/VisorDrive.vue'

const {
  dialogAbierto,
  archivos,
  cargando: cargandoVisor,
  titulo: tituloVisor,
  error: errorVisor,
  abrirVisor,
  urlArchivo,
  esImagen,
  esPdf,
} = useDriveVisor()

const useVehiculo = useStoreVehiculos()
const useUsuario = useStoreUsuarios()

const alert = ref(false)
const accion = ref(1)
const $q = useQuasar()
const perfilUsuario = computed(() => useUsuario.perfile)

const estadoInicial = {
  placa: '',
  licencia: '',
  marca: '',
  modelo: '',
  referencia: '',
  odometro: '',
  clase_vehiculo: '',
  color: '',
  servicio: '',
  capacidad: '',
  combustible: '',
  numero_motor: '',
  numero_chasis: '',
  fecha_matricula: '',
  soat_expedicion: '',
  capacidad_ton: '',
  tecnico_expedicion: '',
  poliza_expedicion: '',
  archivos: [],
  rendimiento_galon: '',
}

const formulario = ref({ ...estadoInicial })
const cargando = ref(false)

const tipoLista = ref(TIPOS_FILTRO.TODOS)
const ordenActual = ref('desc')

const vehiculos = ref([])

const valorFiltroTexto = ref(null)

const detallesVehiculo = ref(null)
const mostrarDetalles = ref(false)

const marcaOptions = [
  'KENWORTH',
  'Freightliner',
  'Mack',
  'Volvo',
  'International',
  'Scania',
  'Hino',
  'Isuzu',
]
const clase_vehiculoOptions = ['TRACTOMULA', 'CAMION', 'AUTOMÓVIL']

const servicioOptions = ['Carga', 'Particular', 'Público', 'Oficial', 'Especial']

const combustibleOptions = ['Gasolina', 'ACPM', 'Diesel', 'Gas natural', 'Eléctrico', 'Híbrido']

function abrir() {
  accion.value = 1
  alert.value = true
}

function cerrar() {
  alert.value = false
  resetearFormulario()
}

async function guardar() {
  cargando.value = true

  if (!validar()) {
    cargando.value = false
    return
  }

  try {
    const formData = new FormData()

    Object.entries(formulario.value).forEach(([key, value]) => {
      // múltiples archivos
      if (key === 'archivos' && Array.isArray(value)) {
        value.forEach((file) => {
          formData.append('archivos', file)
        })
      }

      // arrays normales
      else if (Array.isArray(value)) {
        formData.append(key, value.join(','))
      }

      // valores normales
      else if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value)
      }
    })

    let response

    if (accion.value === 2) {
      response = await useVehiculo.putVehiculo(formulario.value.placa, formData)
    } else {
      response = await useVehiculo.postVehiculo(formData)
    }

    console.log('Respuesta exitosa:', response)

    cerrar()
    cargarVehiculos()
    resetearFormulario()
  } catch (error) {
    console.error('Error completo:', error)
    mostrarMensajeError('Error al guardar el vehículo')
  } finally {
    cargando.value = false
  }
}

function editar(vehiculo) {
  accion.value = 2

  formulario.value = {
    ...estadoInicial,
    ...vehiculo,
  }
  alert.value = true
}

async function validar() {
  let verificado = true

  const { placa, marca, modelo } = formulario.value

  if (placa === '') {
    mostrarMensajeError('Diligencie la placa')
    verificado = false
  }
  if (marca === '') {
    mostrarMensajeError('Diligencie una marca')
    verificado = false
  }
  if (modelo === '') {
    mostrarMensajeError('Diligencie el modelo')
    verificado = false
  }

  return verificado
}

async function verDetalles(placa) {
  try {
    const detalle = await useVehiculo.obtenerdatodevehiculo(placa)
    // console.log('Detalles obtenidos:', detalle)

    if (detalle) {
      detallesVehiculo.value = {
        placa: detalle['placa'] || '',
        licencia: detalle['licencia'] || '',
        marca: detalle['marca'] || '',
        modelo: detalle['modelo'] || '',
        referencia: detalle['referencia'] || '',
        odometro: detalle['odometro'] || '',
        clase_vehiculo: detalle['clase_vehiculo'] || '',
        color: detalle['color'] || '',
        servicio: detalle['servicio'] || '',
        capacidad: detalle['capacidad'] || '',
        combustible: detalle['combustible'] || '',
        numero_motor: detalle['numero_motor'] || '',
        numero_chasis: detalle['numero_chasis'] || '',
        fecha_matricula: detalle['fecha_matricula'] || '',
        soat_expedicion: detalle['soat_expedicion'] || '',
        soat: detalle['soat'] || '',
        soat_vencimiento: detalle['soat_vencimiento'] || '',
        capacidad_ton: detalle['capacidad_ton'] || '',
        tecnico_expedicion: detalle['tecnico_expedicion'] || '',
        poliza_expedicion: detalle['poliza_expedicion'] || '',
        poliza_vencimiento: detalle['poliza_vencimiento'] || '',
        poliza: detalle['poliza'] || '',
        estado: detalle['estado'] || '',
        tecnico: detalle['tecnico'] || '',
        tecnico_vencimiento: detalle['tecnico_vencimiento'] || '',
        archivos: detalle['archivos'] || '',
        fecha_creacion: detalle['fecha_creacion'] || '',
        rendimiento_galon: detalle['rendimiento_galon'] || '',
        link: detalle['link'] || '',
        viajes: detalle['viajes'] || '',
      }
      mostrarDetalles.value = true
    } else {
      console.error('No se pudieron obtener los detalles')
    }
  } catch (error) {
    console.error('Error al obtener detalles:', error)
  }
}

const filtrosConfig = computed(() => CONFIG_FILTROS)

const filtroActual = computed(() => CONFIG_FILTROS[tipoLista.value])

const opcionesOrdenamiento = computed(() => {
  if (tipoLista.value === TIPOS_FILTRO.TODOS) return []

  return [
    { label: filtroActual.value.etiquetaDesc, value: 'desc' },
    { label: filtroActual.value.etiquetaAsc, value: 'asc' },
  ]
})

watch(tipoLista, (newValue) => {
  const filtro = CONFIG_FILTROS[newValue]
  if (filtro.esFiltroTexto && filtro.opcionesFiltro?.length > 0) {
    valorFiltroTexto.value = filtro.opcionesFiltro[0].valor
  } else {
    valorFiltroTexto.value = null
  }
})

function cargarListaPor(tipo) {
  tipoLista.value = tipo
  ordenActual.value = 'desc'

  const filtro = CONFIG_FILTROS[tipo]

  if (filtro.esFiltroTexto && filtro.opcionesFiltro?.length > 0) {
    valorFiltroTexto.value = filtro.opcionesFiltro[0].valor
  } else {
    valorFiltroTexto.value = null
  }

  cargarVehiculos()
}

function actualizarValorFiltro(nuevoValor) {
  valorFiltroTexto.value = nuevoValor
  cargarVehiculos()
}

// function obtenerEtiquetaValor(valor) {
//   if (tipoLista.value === TIPOS_FILTRO.ESTADO) {
//     return `${valor}`
//   } else if (tipoLista.value === TIPOS_FILTRO.DISTANCIA) {
//     return `${valor} km`
//   }
//   return valor
// }

function obtenerEtiquetaFiltroTexto(valor) {
  if (filtroActual.value.esFiltroTexto && filtroActual.value.opcionesFiltro) {
    const opcion = filtroActual.value.opcionesFiltro.find((opt) => opt.valor === valor)
    return opcion ? opcion.etiqueta : valor
  }
  return valor
}

const opcionesFiltroTexto = computed(() => {
  if (tipoLista.value && filtroActual.value && filtroActual.value.esFiltroTexto) {
    return filtroActual.value.opcionesFiltro || []
  }
  return []
})

async function cargarVehiculos() {
  try {
    let response = []
    // ADMINISTRADOR
    if (perfilUsuario.value === 'administrador') {
      if (tipoLista.value === TIPOS_FILTRO.TODOS) {
        response = await useVehiculo.obtenerVehiculos()
      } else if (filtroActual.value.esFiltroTexto) {
        response = await useVehiculo.obtenerVehiculosFiltrados(
          filtroActual.value.campoDatos,
          valorFiltroTexto.value,
        )
      } else {
        response = await useVehiculo.obtenerVehiculosOrdenados(
          filtroActual.value.campoOrden,
          ordenActual.value,
        )
      }
    }
    // PROPIETARIO Y CONDUCTOR
    else {
      const placasUsuario = useUsuario.user?.placa_asignada?.split(',').map((p) => p.trim()) || []
      let todosLosVehiculos = []
      for (const placa of placasUsuario) {
        const data = await useVehiculo.obtenerResumenPorPlaca(placa)
        const lista = data?.resumen?.total?.consecutivos || []
        todosLosVehiculos.push(...lista)
      }
      response = todosLosVehiculos
      // FILTROS TEXTO
      if (filtroActual.value?.esFiltroTexto) {
        response = response.filter((item) => {
          const valor = item[filtroActual.value.campoDatos]

          return String(valor).toLowerCase().includes(String(valorFiltroTexto.value).toLowerCase())
        })
      }
      // ORDENAMIENTOS
      else if (tipoLista.value !== TIPOS_FILTRO.TODOS) {
        const campo = filtroActual.value.campoOrden

        response.sort((a, b) => {
          const valorA = parseFloat(a[campo]) || 0
          const valorB = parseFloat(b[campo]) || 0
          return ordenActual.value === 'desc' ? valorB - valorA : valorA - valorB
        })
      }
    }
    if (Array.isArray(response)) {
      vehiculos.value = response.map((item) => {
        const result = {
          placa: item.placa || '',
          modelo: item.modelo || 0,
          referencia: item.referencia || 0,
          marca: item.marca || 0,
          estado: item.estado || 0,
          viajes: item.viajes || 0,
          odometro: item.odometro || 0,
          combustible: item.combustible || 0,
        }
        const campoDatos = filtroActual.value?.campoDatos
        if (campoDatos && item[campoDatos] !== undefined) {
          result.valorFiltro = item[campoDatos]
        }
        return result
      })
    } else {
      console.error('Error en formato de respuesta:', response)
      vehiculos.value = []
    }
  } catch (error) {
    console.error(`Error al cargar vehiculos por ${tipoLista.value}:`, error)
    vehiculos.value = []
  }
}

onMounted(() => {
  cargarVehiculos()
})

const isActive = computed({
  get: () => detallesVehiculo.value && detallesVehiculo.value.estado === 'activo',
  set: () => {},
})

const cambiarEstado = async () => {
  try {
    if (detallesVehiculo.value.estado === 'activo') {
      await useVehiculo.putDesactivarVehiculo(detallesVehiculo.value.placa)
      detallesVehiculo.value.estado = 'inactivo'
    } else {
      await useVehiculo.putActivarVehiculo(detallesVehiculo.value.placa)
      detallesVehiculo.value.estado = 'activo'
    }
  } catch (error) {
    console.error('Error al cambiar estado del vehículo:', error)
  }
}

// Ya no necesitas archivosSeleccionados como ref

function manejarSeleccionArchivos(files) {
  if (!files) return

  const nuevos = Array.isArray(files) ? files : [files]

  nuevos.forEach((file) => {
    const existe = formulario.value.archivos.some(
      (a) => a.name === file.name && a.size === file.size && a.type === file.type
    )
    if (!existe) {
      formulario.value.archivos.push(file)
    }
  })

  // El q-file queda visualmente "vacío" pero tus chips muestran los acumulados
}

function eliminarArchivo(index) {
  formulario.value.archivos.splice(index, 1)
}

function resetearFormulario() {
  formulario.value = { ...estadoInicial }
  accion.value = 1
}

function mostrarMensajeError(mensaje) {
  $q.notify({
    type: 'negative',
    message: mensaje,
    position: 'bottom-right',
  })
}

function formatFecha(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

defineOptions({
  name: 'VehiculosPage',
})
</script>

<style scoped>
.placa-badge {
  background: #111827;
  color: white;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 3px 10px;
  border-radius: 6px;
  font-family: monospace;
}

.metrica-chip {
  background: #f9fafb;
  border-radius: 8px;
  padding: 8px 10px;
  min-width: 0;
}
.metrica-chip.rendimiento-malo {
  background: #fef2f2;
}
.metrica-chip.rendimiento-bueno {
  background: #f0fdf4;
}
.metrica-label {
  font-size: 10px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}
.metrica-valor {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-bar {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 12px;
}

.filter-scroll {
  overflow-x: auto;
  flex-wrap: nowrap;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.filter-scroll::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  border-radius: 999px !important;
  font-size: 13px;
  flex-shrink: 0;
}

.cliente-card {
  border-radius: 12px !important;
  transition: border-color 0.15s;
}
.cliente-card:active {
  opacity: 0.85;
}

.avatar-chip {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #eff6ff;
  color: #1e50a2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

.placa-badge-lg {
  background: #111827;
  color: white;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 6px 20px;
  border-radius: 8px;
  font-family: monospace;
}

.detalle-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.detalle-fila:last-child {
  border-bottom: none;
}
.detalle-label {
  font-size: 13px;
  color: #9ca3af;
}
.detalle-valor {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  text-align: right;
  max-width: 60%;
}

.vehiculo-card {
  border: 1px solid #e5e7eb !important;
  border-radius: 12px !important;
  transition: border-color 0.15s;
}
.vehiculo-card:active {
  opacity: 0.85;
}

.doc-legal-card {
  background: #f9fafb;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
