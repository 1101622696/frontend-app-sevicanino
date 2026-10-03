<template>
  <!--
    Texto libre que sugiere valores ya usados mientras se escribe.
    Evita que el mismo dato quede escrito de varias formas ("Rabia", "rabia", "Antirrábica"),
    lo que después rompe los filtros. Si el valor no está en la lista, igual se guarda lo escrito.
  -->
  <q-select
    :model-value="modelValue"
    :options="visibles"
    :label="label"
    :hint="hint"
    use-input
    hide-selected
    fill-input
    input-debounce="0"
    outlined
    rounded
    dense
    bg-color="white"
    @filter="filtrar"
    @input-value="(valor) => $emit('update:modelValue', valor)"
    @update:model-value="(valor) => $emit('update:modelValue', valor || '')"
  >
    <template v-if="icono" #prepend>
      <q-icon :name="icono" />
    </template>
  </q-select>
</template>

<script setup>
import { ref, computed } from 'vue'
import { normalizar } from '../utils/texto'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  hint: { type: String, default: undefined },
  icono: { type: String, default: '' },
  sugerencias: { type: Array, default: () => [] }, // strings; se quitan repetidos y vacíos
})

defineEmits(['update:modelValue'])

const texto = ref('')

const unicas = computed(() => {
  const mapa = new Map()
  props.sugerencias.forEach((valor) => {
    const limpio = String(valor ?? '').trim()
    if (limpio && !mapa.has(normalizar(limpio))) mapa.set(normalizar(limpio), limpio)
  })
  return [...mapa.values()].sort((a, b) => a.localeCompare(b, 'es'))
})

const visibles = computed(() => {
  const busqueda = normalizar(texto.value)
  if (!busqueda) return unicas.value
  return unicas.value.filter((valor) => normalizar(valor).includes(busqueda))
})

function filtrar(valor, actualizar) {
  actualizar(() => {
    texto.value = valor
  })
}
</script>