<template>
  <div class="barra-filtros">
    <q-input
      v-if="conBusqueda"
      :model-value="busqueda"
      dense
      outlined
      rounded
      clearable
      debounce="250"
      bg-color="white"
      :placeholder="placeholderBusqueda"
      class="q-mb-sm"
      @update:model-value="$emit('update:busqueda', $event ?? '')"
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>

    <div class="barra-filtros__chips row no-wrap">
      <q-chip
        v-for="(filtro, tipo) in filtros"
        :key="tipo"
        clickable
        :icon="filtro.icono"
        :color="tipoActivo === tipo ? 'primary' : 'white'"
        :text-color="tipoActivo === tipo ? 'white' : 'grey-8'"
        class="barra-filtros__chip"
        @click="$emit('seleccionar', tipo)"
      >
        {{ filtro.etiquetaChip || filtro.titulo }}
      </q-chip>
    </div>

    <q-select
      v-if="tieneValor"
      :model-value="valor"
      :options="opcionesVisibles"
      option-value="valor"
      option-label="etiqueta"
      emit-value
      map-options
      dense
      outlined
      rounded
      bg-color="white"
      class="q-mt-sm"
      :use-input="opciones.length > 8"
      input-debounce="0"
      @filter="filtrarOpciones"
      @update:model-value="$emit('update:valor', $event)"
    >
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey-7">
            Todavía no hay registros con valores para este filtro
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <div v-if="opcionesOrden.length" class="q-mt-sm">
      <q-btn-toggle
        :model-value="orden"
        :options="opcionesOrden"
        dense
        no-caps
        rounded
        unelevated
        size="sm"
        color="white"
        text-color="grey-8"
        toggle-color="primary"
        class="barra-filtros__orden"
        @update:model-value="$emit('update:orden', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { normalizar } from '../utils/texto'

const props = defineProps({
  filtros: { type: Object, required: true }, // filtrosVisibles
  tipoActivo: { type: String, default: 'todos' }, // tipoLista
  valor: { type: [String, Number], default: null }, // valorFiltro
  opciones: { type: Array, default: () => [] }, // opcionesFiltro
  tieneValor: { type: Boolean, default: false },
  orden: { type: String, default: 'desc' },
  opcionesOrden: { type: Array, default: () => [] },
  busqueda: { type: String, default: '' },
  conBusqueda: { type: Boolean, default: true },
  placeholderBusqueda: { type: String, default: 'Buscar' },
})

defineEmits(['seleccionar', 'update:valor', 'update:orden', 'update:busqueda'])

// Búsqueda dentro del select cuando hay muchas opciones (ej. 40 caninos)
const textoOpciones = ref('')

const opcionesVisibles = computed(() => {
  const texto = normalizar(textoOpciones.value)
  if (!texto) return props.opciones
  return props.opciones.filter((op) => normalizar(op.etiqueta).includes(texto))
})

function filtrarOpciones(valor, actualizar) {
  actualizar(() => {
    textoOpciones.value = valor
  })
}
</script>

<style scoped>
.barra-filtros__chips {
  overflow-x: auto;
  gap: 6px;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.barra-filtros__chips::-webkit-scrollbar {
  display: none;
}

.barra-filtros__chip {
  margin: 0;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.barra-filtros__orden {
  border: 1px solid rgba(0, 0, 0, 0.08);
}
</style>