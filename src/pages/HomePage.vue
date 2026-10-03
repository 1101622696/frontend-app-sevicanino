<template>
  <q-page class="bg-grey-2">
    <q-pull-to-refresh color="primary" @refresh="refrescar">
      <div class="q-pa-md inicio">
        <!-- ═══ Saludo ═══ -->
        <div class="q-mb-md">
          <div class="text-h6 text-weight-medium">Hola, {{ primerNombre }}</div>
          <div class="text-body2 text-grey-7">
            <span class="inicio__fecha">{{ fechaLarga }}</span>
            <span>, {{ textoAlcance }}</span>
          </div>
        </div>

        <!-- Cargando la primera vez -->
        <template v-if="!datos">
          <div class="inicio__conteos q-mb-md">
            <q-skeleton v-for="n in 4" :key="n" height="76px" class="inicio__tarjeta-esqueleto" />
          </div>
          <q-skeleton height="200px" class="inicio__tarjeta-esqueleto q-mb-md" />
          <q-skeleton height="140px" class="inicio__tarjeta-esqueleto" />
        </template>

        <template v-else>
          <!-- ═══ Conteos ═══ -->
          <div class="inicio__conteos q-mb-lg">
            <button
              v-for="conteo in conteos"
              :key="conteo.etiqueta"
              type="button"
              class="inicio__conteo"
              @click="ir(conteo.ruta)"
            >
              <q-icon :name="conteo.icono" :color="conteo.color" size="20px" />
              <span class="inicio__conteo-valor">{{ conteo.valor }}</span>
              <span class="inicio__conteo-etiqueta">{{ conteo.etiqueta }}</span>
            </button>
          </div>

          <!-- ═══ Requiere atención ═══ -->
          <section class="q-mb-lg">
            <div class="row items-center q-mb-sm">
              <span class="text-subtitle1 text-weight-medium">Requiere atención</span>
              <q-badge v-if="datos.alertas.length" color="red-1" text-color="red-9" rounded class="q-ml-sm">
                {{ datos.alertas.length }}
              </q-badge>
            </div>

            <div v-if="!datos.alertas.length" class="inicio__todo-bien row items-center no-wrap">
              <q-icon name="task_alt" color="green-7" size="28px" class="q-mr-md" />
              <div>
                <div class="text-body2 text-weight-medium">Todo al día</div>
                <div class="text-caption text-grey-7">
                  No hay vacunas, certificados ni aseos vencidos o por vencer en los próximos días.
                </div>
              </div>
            </div>

            <q-list v-else bordered separator class="inicio__lista">
              <q-item
                v-for="(alerta, i) in alertasVisibles"
                :key="`${alerta.tipo}-${alerta.canino_id || alerta.ciudad_id}-${i}`"
                clickable
                v-ripple
                @click="abrirAlerta(alerta)"
              >
                <q-item-section avatar>
                  <q-avatar size="36px" v-bind="estiloAlerta(alerta.estado)" :icon="ICONOS_ALERTA[alerta.tipo]" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2">{{ alerta.titulo }}</q-item-label>
                  <q-item-label caption>{{ alerta.canino || alerta.ciudad }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge v-bind="estiloAlerta(alerta.estado)" rounded class="inicio__badge">
                    {{ textoPlazo(alerta) }}
                  </q-badge>
                </q-item-section>
              </q-item>

              <q-item
                v-if="datos.alertas.length > LIMITE_ALERTAS"
                clickable
                class="text-primary"
                @click="verTodasAlertas = !verTodasAlertas"
              >
                <q-item-section class="text-center text-body2">
                  {{ verTodasAlertas ? 'Ver menos' : `Ver las ${datos.alertas.length - LIMITE_ALERTAS} restantes` }}
                </q-item-section>
              </q-item>
            </q-list>

            <button
              v-if="datos.certificados_faltantes?.total"
              type="button"
              class="inicio__aviso row items-center no-wrap q-mt-sm"
              @click="ir('CaninosPage')"
            >
              <q-icon name="workspace_premium" color="grey-7" class="q-mr-sm" />
              <span class="text-body2 text-left col">
                {{ plural(datos.certificados_faltantes.total, 'certificado sin registrar', 'certificados sin registrar') }}
                entre los caninos activos
              </span>
              <q-icon name="chevron_right" color="grey-5" />
            </button>
          </section>

          <!-- ═══ Alimento ═══ -->
          <section v-if="datos.alimento.length" class="q-mb-lg">
            <div class="text-subtitle1 text-weight-medium">Alimento</div>
            <div class="text-caption text-grey-7 q-mb-sm">
              Estimado con el consumo diario de los caninos activos, desde el primer ingreso registrado en cada ciudad.
            </div>

            <div class="column q-gutter-y-sm">
              <button
                v-for="ciudad in datos.alimento"
                :key="ciudad.ciudad_id"
                type="button"
                class="inicio__alimento"
                @click="ir('AlimentacionPage')"
              >
                <div class="row items-center no-wrap">
                  <div class="col text-left">
                    <div class="text-body2 text-weight-medium">{{ ciudad.ciudad }}</div>
                    <div class="text-caption text-grey-7">{{ detalleAlimento(ciudad) }}</div>
                  </div>
                  <div class="text-right q-ml-md">
                    <div class="inicio__dias" :class="`text-${ESTILO_ALIMENTO[ciudad.estado].texto}`">
                      {{ valorAlimento(ciudad) }}
                    </div>
                    <div v-if="ciudad.dias_restantes !== undefined" class="text-caption text-grey-7">
                      {{ ciudad.dias_restantes === 1 ? 'día' : 'días' }}
                    </div>
                  </div>
                </div>

                <q-linear-progress
                  v-if="ciudad.dias_restantes !== undefined"
                  :value="Math.min(ciudad.dias_restantes / 30, 1)"
                  :color="ESTILO_ALIMENTO[ciudad.estado].barra"
                  track-color="grey-3"
                  rounded
                  size="6px"
                  class="q-mt-sm"
                />

                <div v-if="ciudad.posible_faltante" class="text-caption text-orange-9 q-mt-xs text-left">
                  El consumo estimado supera lo ingresado. Puede haber ingresos sin registrar.
                </div>
              </button>
            </div>
          </section>

          <!-- ═══ Tratamientos en curso ═══ -->
          <section v-if="datos.tratamientos_en_curso.length" class="q-mb-lg">
            <div class="row items-center q-mb-sm">
              <span class="text-subtitle1 text-weight-medium">Tratamientos en curso</span>
              <q-space />
              <q-btn flat dense no-caps color="primary" label="Ver todos" @click="ir('TratamientosPage')" />
            </div>

            <q-list bordered separator class="inicio__lista">
              <q-item
                v-for="tratamiento in datos.tratamientos_en_curso"
                :key="tratamiento.consecutivo"
                clickable
                v-ripple
                @click="ir('TratamientosPage', { canino: tratamiento.canino_id })"
              >
                <q-item-section avatar>
                  <q-avatar size="36px" color="green-1" text-color="green-9" icon="medication" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2">{{ tratamiento.medicamento }}</q-item-label>
                  <q-item-label caption>{{ tratamiento.canino }}{{ tratamiento.dosis ? `, ${tratamiento.dosis}` : '' }}</q-item-label>
                </q-item-section>
                <q-item-section side class="text-caption text-grey-7">
                  {{ textoFinTratamiento(tratamiento) }}
                </q-item-section>
              </q-item>
            </q-list>
          </section>

          <!-- ═══ Actividad reciente ═══ -->
          <section v-if="datos.actividades_recientes.length" class="q-mb-lg">
            <div class="row items-center q-mb-sm">
              <span class="text-subtitle1 text-weight-medium">Actividad reciente</span>
              <q-space />
              <q-btn flat dense no-caps color="primary" label="Ver bitácora" @click="ir('ActividadesPage')" />
            </div>

            <q-list bordered separator class="inicio__lista">
              <q-item
                v-for="actividad in datos.actividades_recientes"
                :key="actividad.consecutivo"
                clickable
                v-ripple
                @click="ir('ActividadesPage', { canino: actividad.canino_id })"
              >
                <q-item-section avatar>
                  <q-avatar size="36px" color="purple-1" text-color="purple-9" icon="event_note" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2">{{ actividad.asunto }}</q-item-label>
                  <q-item-label caption>
                    {{ actividad.canino }}{{ actividad.manejador ? `, por ${actividad.manejador}` : '' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side class="text-caption text-grey-7">
                  {{ textoDia(actividad.fecha) }}
                </q-item-section>
              </q-item>
            </q-list>
          </section>
        </template>
      </div>
    </q-pull-to-refresh>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStoreDashboard } from '../stores/dashboard'
import { useStoreUsuarios } from '../stores/usuarios'
import { plural } from '../utils/texto'
import { formatearFecha, diasHasta } from '../utils/fechas'

defineOptions({ name: 'HomePage' })

const router = useRouter()
const storeDashboard = useStoreDashboard()
const useUsuario = useStoreUsuarios()

const LIMITE_ALERTAS = 6

const ICONOS_ALERTA = {
  vacuna: 'vaccines',
  certificado: 'workspace_premium',
  aseo: 'cleaning_services',
}

const ESTILO_ALIMENTO = {
  critico: { texto: 'red-8', barra: 'red-6' },
  bajo: { texto: 'orange-9', barra: 'orange-6' },
  suficiente: { texto: 'green-8', barra: 'green-6' },
  sin_consumo: { texto: 'grey-6', barra: 'grey-5' },
  sin_ingresos: { texto: 'grey-6', barra: 'grey-5' },
}

const formatoKg = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 })

// ─────────────────────────────────────────────────────────────
// Datos
// ─────────────────────────────────────────────────────────────

const datos = computed(() => storeDashboard.datos)
const verTodasAlertas = ref(false)

async function refrescar(terminar) {
  await storeDashboard.obtenerDashboard({ fresco: true })
  terminar()
}

onMounted(() => {
  // Si ya había datos (volvió al home), se muestran y se actualizan por detrás
  storeDashboard.obtenerDashboard()
})

// ─────────────────────────────────────────────────────────────
// Encabezado
// ─────────────────────────────────────────────────────────────

const primerNombre = computed(() => (useUsuario.nombreUsuario || '').trim().split(/\s+/)[0] || '')

const fechaLarga = computed(() =>
  new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Bogota',
  }),
)

const textoAlcance = computed(() => {
  if (useUsuario.esAdmin) return 'todas las ciudades'
  return datos.value?.alcance?.ciudad || 'su ciudad'
})

const conteos = computed(() => {
  const c = datos.value?.conteos || {}
  const lista = [
    { etiqueta: 'Caninos activos', valor: c.caninos_activos ?? 0, icono: 'pets', color: 'blue-7', ruta: 'CaninosPage' },
    { etiqueta: 'En tratamiento', valor: c.tratamientos_en_curso ?? 0, icono: 'medication', color: 'green-7', ruta: 'TratamientosPage' },
    { etiqueta: 'Siniestros (30 días)', valor: c.siniestros_30_dias ?? 0, icono: 'report', color: 'deep-orange-7', ruta: 'SiniestrosPage' },
  ]
  if (useUsuario.esAdmin) {
    lista.push(
      { etiqueta: 'Manejadores', valor: c.manejadores ?? 0, icono: 'badge', color: 'purple-7', ruta: 'UsuariosPage' },
      { etiqueta: 'Ciudades', valor: c.ciudades ?? 0, icono: 'location_city', color: 'red-7', ruta: 'CiudadesPage' },
    )
  }
  return lista
})

// ─────────────────────────────────────────────────────────────
// Alertas
// ─────────────────────────────────────────────────────────────

const alertasVisibles = computed(() => {
  const lista = datos.value?.alertas || []
  return verTodasAlertas.value ? lista : lista.slice(0, LIMITE_ALERTAS)
})

function estiloAlerta(estado) {
  if (estado === 'vencido') return { color: 'red-1', textColor: 'red-9' }
  if (estado === 'proximo') return { color: 'orange-1', textColor: 'orange-9' }
  return { color: 'grey-3', textColor: 'grey-8' }
}

function textoPlazo(alerta) {
  if (alerta.estado === 'sin_registro') return 'Sin registro'
  const dias = alerta.dias
  if (dias < 0) return `Venció hace ${plural(-dias, 'día')}`
  if (dias === 0) return 'Vence hoy'
  return `En ${plural(dias, 'día')}`
}

function abrirAlerta(alerta) {
  if (alerta.tipo === 'vacuna') ir('VacunacionPage', { canino: alerta.canino_id })
  else if (alerta.tipo === 'certificado') ir('CaninosPage', { ver: alerta.canino_id })
  else if (alerta.tipo === 'aseo') ir('ChequeosPage')
}

// ─────────────────────────────────────────────────────────────
// Alimento, tratamientos y actividades
// ─────────────────────────────────────────────────────────────

function valorAlimento(ciudad) {
  if (ciudad.estado === 'sin_ingresos' || ciudad.estado === 'sin_consumo') return '—'
  return `≈ ${ciudad.dias_restantes}`
}

function detalleAlimento(ciudad) {
  const caninos = plural(ciudad.caninos_activos, 'canino', 'caninos')
  if (ciudad.estado === 'sin_ingresos') return `Sin ingresos registrados. ${caninos}.`
  if (ciudad.estado === 'sin_consumo') return `Los caninos no tienen registrados los gramos por día.`
  return `${formatoKg.format(ciudad.kg_restantes)} kg restantes, consumo de ${formatoKg.format(ciudad.consumo_diario_kg)} kg/día (${caninos})`
}

function textoFinTratamiento(tratamiento) {
  if (!tratamiento.fecha_fin) return 'Continuo'
  if (tratamiento.dias_restantes === 0) return 'Termina hoy'
  return `Hasta el ${formatearFecha(tratamiento.fecha_fin).slice(0, 5)}`
}

function textoDia(fecha) {
  const dias = diasHasta(fecha)
  if (dias === 0) return 'Hoy'
  if (dias === -1) return 'Ayer'
  return formatearFecha(fecha).slice(0, 5)
}

function ir(nombre, query = {}) {
  router.push({ name: nombre, query })
}
</script>

<style scoped>
.inicio {
  max-width: 720px;
  margin: 0 auto;
}

.inicio__fecha::first-letter {
  text-transform: uppercase;
}

/* ── Conteos ── */
.inicio__conteos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.inicio__conteo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.inicio__conteo:active {
  background: #f5f6f8;
}

.inicio__conteo-valor {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.inicio__conteo-etiqueta {
  font-size: 0.75rem;
  color: #757575;
}

.inicio__tarjeta-esqueleto {
  border-radius: 12px;
}

/* ── Listas ── */
.inicio__lista {
  background: #fff;
  border-radius: 12px;
}

.inicio__badge {
  white-space: nowrap;
}

.inicio__todo-bien {
  background: #e8f5e9;
  border-radius: 12px;
  padding: 14px 16px;
}

.inicio__aviso {
  width: 100%;
  padding: 10px 14px;
  background: #fff;
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  font: inherit;
  cursor: pointer;
}

/* ── Alimento ── */
.inicio__alimento {
  width: 100%;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  font: inherit;
  cursor: pointer;
}

.inicio__dias {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
</style>