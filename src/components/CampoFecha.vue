<template>
  <q-input
    :model-value="textoVisible"
    :label="label"
    readonly
    outlined
    rounded
    dense
    bg-color="white"
    hide-bottom-space
    :disable="disable"
    :rules="rules"
    :hint="hint"
    class="cursor-pointer"
    @click="abrir"
  >
    <template #prepend>
      <q-icon name="event" />
    </template>

    <template #append>
      <q-icon
        v-if="modelValue && clearable && !disable"
        name="close"
        class="cursor-pointer"
        aria-label="Borrar fecha"
        @click.stop="$emit('update:modelValue', '')"
      />
      <q-popup-proxy ref="popup" cover transition-show="scale" transition-hide="scale" no-parent-event>
        <q-date
          :model-value="modelValue || null"
          :mask="MASK_FECHA"
          :locale="LOCALE_ES"
          :options="opcionesFecha"
          today-btn
          @update:model-value="seleccionar"
        />
      </q-popup-proxy>
    </template>
  </q-input>
</template>

<script setup>
import { ref, computed } from 'vue'
import { MASK_FECHA, formatearFecha, normalizarFecha } from '../utils/fechas'

const props = defineProps({
  modelValue: { type: String, default: '' }, // 'YYYY-MM-DD'
  label: { type: String, default: 'Fecha' },
  minimo: { type: String, default: '' }, // 'YYYY-MM-DD'
  maximo: { type: String, default: '' },
  clearable: { type: Boolean, default: false },
  disable: { type: Boolean, default: false },
  rules: { type: Array, default: () => [] },
  hint: { type: String, default: undefined },
})

const emit = defineEmits(['update:modelValue'])

const popup = ref(null)

const LOCALE_ES = {
  days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  daysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  months: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
  monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  firstDayOfWeek: 1,
}

const textoVisible = computed(() => (props.modelValue ? formatearFecha(props.modelValue) : ''))

// q-date entrega las fechas de `options` como 'YYYY/MM/DD' sin importar el mask
const opcionesFecha = computed(() => {
  const min = normalizarFecha(props.minimo).replace(/-/g, '/')
  const max = normalizarFecha(props.maximo).replace(/-/g, '/')
  if (!min && !max) return undefined
  return (fecha) => (!min || fecha >= min) && (!max || fecha <= max)
})

function abrir() {
  if (!props.disable) popup.value?.show()
}

function seleccionar(valor) {
  // q-date emite null si se toca la fecha ya seleccionada; para borrar está la X
  if (valor) emit('update:modelValue', valor)
  popup.value?.hide()
}
</script>