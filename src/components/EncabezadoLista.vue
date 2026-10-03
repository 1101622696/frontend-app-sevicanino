<template>
  <div class="row items-center no-wrap q-mb-sm">
    <q-icon :name="icono" :color="color" size="20px" />
    <div class="col q-ml-xs ellipsis">
      <span class="text-subtitle1 text-weight-medium">{{ titulo }}</span>
      <span v-if="detalle" class="text-grey-7">: {{ detalle }}</span>
    </div>
    <q-badge color="blue-1" text-color="blue-9" rounded class="q-ml-sm">
      {{ total }}
    </q-badge>
  </div>
</template>

<script setup>
defineProps({
  titulo: { type: String, default: '' },
  detalle: { type: String, default: '' }, // etiquetaValorFiltro
  icono: { type: String, default: 'list' },
  color: { type: String, default: 'primary' },
  total: { type: Number, default: 0 },
})
</script>