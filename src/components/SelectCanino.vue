<template>
  <q-select
    :model-value="modelValue"
    :options="opcionesVisibles"
    :label="label"
    emit-value
    map-options
    use-input
    input-debounce="150"
    outlined
    rounded
    dense
    bg-color="white"
    hide-bottom-space
    :loading="storeCaninos.loading"
    :readonly="readonly"
    :disable="disable"
    :rules="rules"
    @filter="filtrar"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #prepend>
      <q-icon name="pets" />
    </template>

    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
          <q-item-label v-if="scope.opt.caption" caption>{{ scope.opt.caption }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template #no-option>
      <q-item>
        <q-item-section class="text-grey-7">
          {{
            storeCaninos.opcionesCaninos.length
              ? 'Ningún canino coincide con la búsqueda'
              : 'No hay caninos activos disponibles para su ciudad'
          }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStoreCaninos } from '../stores/caninos'
import { normalizar } from '../utils/texto'

const props = defineProps({
  modelValue: { type: String, default: null }, // consecutivo del canino
  label: { type: String, default: 'Canino' },
  readonly: { type: Boolean, default: false },
  disable: { type: Boolean, default: false },
  rules: { type: Array, default: () => [] },
})

defineEmits(['update:modelValue'])

const storeCaninos = useStoreCaninos()
const texto = ref('')

// Si se edita un registro de un canino que ya está inactivo, igual debe verse su nombre
const opcionesBase = computed(() => {
  const activos = storeCaninos.opcionesCaninos
  const id = props.modelValue
  if (!id || activos.some((op) => normalizar(op.value) === normalizar(id))) return activos

  const canino = storeCaninos.buscarCanino(id)
  return [
    {
      label: canino ? `${canino.nombre} (inactivo)` : id,
      value: id,
      caption: canino?.raza || '',
    },
    ...activos,
  ]
})

const opcionesVisibles = computed(() => {
  const busqueda = normalizar(texto.value)
  if (!busqueda) return opcionesBase.value
  return opcionesBase.value.filter(
    (op) => normalizar(op.label).includes(busqueda) || normalizar(op.caption).includes(busqueda),
  )
})

function filtrar(valor, actualizar) {
  actualizar(() => {
    texto.value = valor
  })
}

onMounted(() => {
  // Usa el caché del store; si ya está cargado no hace petición
  storeCaninos.obtenerCaninos().catch(() => {})
})
</script>