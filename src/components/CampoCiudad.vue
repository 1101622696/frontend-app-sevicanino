<template>
  <q-select
    v-if="!bloqueada"
    :model-value="modelValue"
    :options="storeCiudades.opcionesCiudades"
    :label="label"
    emit-value
    map-options
    outlined
    rounded
    dense
    bg-color="white"
    :loading="storeCiudades.loading"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #prepend>
      <q-icon name="location_city" />
    </template>
  </q-select>

  <q-input
    v-else
    :model-value="storeCiudades.nombreCiudad(modelValue)"
    :label="label"
    readonly
    outlined
    rounded
    dense
    bg-color="white"
    :hint="hint"
  >
    <template #prepend>
      <q-icon name="location_city" />
    </template>
    <template #append>
      <q-icon name="lock" size="16px" color="grey-6" />
    </template>
  </q-input>
</template>

<script setup>
import { onMounted } from 'vue'
import { useStoreCiudades } from '../stores/ciudades'

defineProps({
  modelValue: { type: String, default: '' }, // consecutivo de la ciudad ('C-1')
  label: { type: String, default: 'Ciudad' },
  bloqueada: { type: Boolean, default: false }, // true para el manejador
  hint: { type: String, default: 'Se registra en la ciudad asignada a su usuario.' },
})

defineEmits(['update:modelValue'])

const storeCiudades = useStoreCiudades()

onMounted(() => {
  storeCiudades.obtenerCiudades()
})
</script>