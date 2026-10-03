<template>
  <q-dialog
    :model-value="modelValue"
    :maximized="$q.screen.lt.sm"
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="dialogo-detalle column no-wrap" :class="{ 'dialogo-detalle--movil': $q.screen.lt.sm }">
      <!-- Encabezado -->
      <q-card-section
        class="row items-center no-wrap q-pb-sm"
        :style="$q.screen.lt.sm ? 'padding-top: calc(16px + env(safe-area-inset-top))' : ''"
      >
        <q-avatar
          size="48px"
          :color="colorAvatar"
          :text-color="colorTextoAvatar"
          :icon="avatar ? undefined : icono"
          class="q-mr-md dialogo-detalle__avatar"
        >
          <template v-if="avatar">{{ avatar }}</template>
        </q-avatar>

        <div class="col" style="min-width: 0">
          <div class="text-subtitle1 text-weight-medium ellipsis">{{ titulo }}</div>
          <div v-if="subtitulo" class="text-caption text-grey-7">{{ subtitulo }}</div>
          <div v-if="badges.length" class="row q-gutter-xs q-mt-xs">
            <q-badge
              v-for="(badge, i) in badges"
              :key="i"
              :color="badge.color || 'grey-3'"
              :text-color="badge.textColor || 'grey-8'"
              rounded
            >
              {{ badge.etiqueta }}
            </q-badge>
          </div>
        </div>

        <q-btn flat round dense icon="close" color="grey-7" v-close-popup aria-label="Cerrar" />
      </q-card-section>

      <q-separator />

      <!-- Contenido -->
      <q-card-section class="col scroll dialogo-detalle__cuerpo">
        <div v-if="cargando" class="row justify-center q-pa-lg">
          <q-spinner color="primary" size="32px" />
        </div>

        <template v-else>
          <!-- Antes de los campos: foto, alertas, etc. -->
          <slot name="superior" />

          <div v-if="camposVisibles.length" class="dialogo-detalle__campos">
            <div
              v-for="(campo, i) in camposVisibles"
              :key="i"
              class="dialogo-detalle__campo"
              :class="{ 'dialogo-detalle__campo--completo': campo.completo }"
            >
              <div class="text-caption text-grey-7">{{ campo.etiqueta }}</div>
              <div class="text-body2 dialogo-detalle__valor">{{ valorMostrado(campo.valor) }}</div>
            </div>
          </div>

          <q-btn
            v-if="enlace"
            outline
            rounded
            no-caps
            color="primary"
            icon="folder_open"
            :label="textoEnlace"
            class="full-width q-mt-md"
            @click="abrirEnlace(enlace, titulo)"
          />

          <slot />
        </template>
      </q-card-section>

      <q-separator />

      <!-- Acciones -->
      <q-card-actions
        class="q-pa-md"
        :style="$q.screen.lt.sm ? 'padding-bottom: calc(16px + env(safe-area-inset-bottom))' : ''"
      >
        <slot name="acciones" />
        <q-space />
        <q-btn
          v-if="puedeEditar"
          flat
          no-caps
          icon="edit"
          label="Editar"
          color="grey-8"
          @click="$emit('editar')"
        />
        <q-btn flat no-caps label="Cerrar" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { abrirEnlace } from '../utils/enlaces'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  titulo: { type: String, default: '' },
  subtitulo: { type: String, default: '' },
  avatar: { type: String, default: '' },
  icono: { type: String, default: 'description' },
  colorAvatar: { type: String, default: 'blue-1' },
  colorTextoAvatar: { type: String, default: 'blue-9' },
  badges: { type: Array, default: () => [] },
  // [{ etiqueta: 'Fecha', valor: '07/10/2026', completo: false, ocultarSiVacio: false }]
  campos: { type: Array, default: () => [] },
  enlace: { type: String, default: '' },
  textoEnlace: { type: String, default: 'Ver archivos adjuntos' },
  puedeEditar: { type: Boolean, default: true },
  cargando: { type: Boolean, default: false },
})

defineEmits(['update:modelValue', 'editar'])

const $q = useQuasar()

const estaVacio = (valor) => valor === undefined || valor === null || String(valor).trim() === ''

const camposVisibles = computed(() =>
  props.campos.filter((campo) => !(campo.ocultarSiVacio && estaVacio(campo.valor))),
)

const valorMostrado = (valor) => (estaVacio(valor) ? '—' : valor)
</script>

<style scoped>
.dialogo-detalle {
  width: 520px;
  max-width: 95vw;
  max-height: 90vh;
  border-radius: 16px;
}

.dialogo-detalle--movil {
  width: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: 0;
}

.dialogo-detalle__avatar {
  font-size: 16px;
  font-weight: 600;
}

.dialogo-detalle__campos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.dialogo-detalle__campo {
  background: #f5f6f8;
  border-radius: 10px;
  padding: 8px 12px;
  min-width: 0;
}

.dialogo-detalle__campo--completo {
  grid-column: 1 / -1;
}

.dialogo-detalle__valor {
  word-break: break-word;
  white-space: pre-line;
}
</style>