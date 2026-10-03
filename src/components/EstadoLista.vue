<template>
  <!-- Cargando: esqueletos con la forma de las tarjetas -->
  <div v-if="cargando" class="column q-gutter-y-sm">
    <q-card v-for="n in 4" :key="n" flat bordered class="estado-lista__esqueleto">
      <q-card-section class="row items-center no-wrap q-pa-md">
        <q-skeleton type="QAvatar" size="40px" class="q-mr-md" />
        <div class="col">
          <q-skeleton type="text" width="55%" />
          <q-skeleton type="text" width="35%" />
        </div>
      </q-card-section>
    </q-card>
  </div>

  <!-- Vacío -->
  <div v-else-if="vacio" class="estado-lista__vacio column items-center text-center q-pa-lg">
    <q-icon :name="hayFiltros ? 'filter_alt_off' : icono" size="48px" color="grey-5" />

    <div class="text-body1 text-weight-medium q-mt-md">
      {{ hayFiltros ? 'Ningún registro coincide con el filtro' : textoVacio }}
    </div>

    <div class="text-body2 text-grey-7 q-mt-xs">
      {{ hayFiltros ? 'Cambie el filtro o la búsqueda para ver más resultados.' : textoAyuda }}
    </div>

    <q-btn
      v-if="hayFiltros"
      flat
      no-caps
      color="primary"
      icon="close"
      label="Quitar filtros"
      class="q-mt-md"
      @click="$emit('limpiar')"
    />
    <q-btn
      v-else-if="textoAccion"
      unelevated
      rounded
      no-caps
      color="primary"
      icon="add"
      :label="textoAccion"
      class="q-mt-md"
      @click="$emit('accion')"
    />
  </div>
</template>

<script setup>
defineProps({
  cargando: { type: Boolean, default: false },
  vacio: { type: Boolean, default: false },
  hayFiltros: { type: Boolean, default: false },
  icono: { type: String, default: 'inbox' },
  textoVacio: { type: String, default: 'Aún no hay registros' },
  textoAyuda: { type: String, default: '' },
  textoAccion: { type: String, default: '' }, // vacío = sin botón (ej. manejador sin permiso de crear)
})

defineEmits(['limpiar', 'accion'])
</script>

<style scoped>
.estado-lista__esqueleto {
  border-radius: 12px;
}

.estado-lista__vacio {
  min-height: 40vh;
  justify-content: center;
}
</style>