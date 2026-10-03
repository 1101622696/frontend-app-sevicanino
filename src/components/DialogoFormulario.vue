<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    :maximized="$q.screen.lt.sm"
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="dialogo-formulario column no-wrap" :class="{ 'dialogo-formulario--movil': $q.screen.lt.sm }">
      <q-card-section
        class="bg-primary text-white row items-center no-wrap"
        :style="$q.screen.lt.sm ? 'padding-top: calc(16px + env(safe-area-inset-top))' : ''"
      >
        <div class="col">
          <div class="text-h6 text-weight-bold">{{ titulo }}</div>
          <div v-if="subtitulo" class="text-caption">{{ subtitulo }}</div>
        </div>
        <q-btn flat round dense icon="close" :disable="cargando" aria-label="Cerrar" @click="cerrar" />
      </q-card-section>

      <q-card-section class="col scroll q-pa-md bg-grey-2">
        <div class="dialogo-formulario__campos">
          <slot />
        </div>
      </q-card-section>

      <q-card-actions
        class="bg-white q-pa-md"
        align="between"
        :style="$q.screen.lt.sm ? 'padding-bottom: calc(16px + env(safe-area-inset-bottom))' : ''"
      >
        <q-btn flat no-caps color="grey-8" label="Cancelar" :disable="cargando" @click="cerrar" />
        <q-btn
          unelevated
          rounded
          no-caps
          color="primary"
          :icon="iconoGuardar"
          :label="textoGuardar"
          :loading="cargando"
          @click="$emit('guardar')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useQuasar } from 'quasar'

defineProps({
  modelValue: { type: Boolean, default: false },
  titulo: { type: String, default: '' },
  subtitulo: { type: String, default: '' },
  cargando: { type: Boolean, default: false },
  textoGuardar: { type: String, default: 'Guardar' },
  iconoGuardar: { type: String, default: 'save' },
})

const emit = defineEmits(['update:modelValue', 'guardar', 'cerrar'])

const $q = useQuasar()

function cerrar() {
  emit('update:modelValue', false)
  emit('cerrar')
}
</script>

<style scoped>
.dialogo-formulario {
  width: 560px;
  max-width: 95vw;
  max-height: 92vh;
  border-radius: 16px;
}

.dialogo-formulario--movil {
  width: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: 0;
}

.dialogo-formulario__campos {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Títulos de sección dentro del formulario (los usan las páginas) */
.dialogo-formulario__campos :slotted(.seccion-formulario) {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--q-primary);
  margin-top: 6px;
}

.dialogo-formulario__campos :slotted(.seccion-formulario:first-child) {
  margin-top: 0;
}
</style>