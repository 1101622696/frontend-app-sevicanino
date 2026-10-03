<template>
  <q-card
    flat
    bordered
    class="tarjeta-registro"
    :class="{ 'cursor-pointer': clickable }"
    v-ripple="clickable"
    @click="clickable && $emit('click')"
  >
    <q-card-section class="row items-center no-wrap q-pa-md">
      <q-avatar
        size="40px"
        :color="colorAvatar"
        :text-color="colorTextoAvatar"
        :icon="avatar ? undefined : icono"
        class="q-mr-md tarjeta-registro__avatar"
      >
        <template v-if="avatar">{{ avatar }}</template>
      </q-avatar>

      <div class="col tarjeta-registro__contenido">
        <div class="text-body2 text-weight-medium ellipsis">{{ titulo }}</div>
        <div v-if="subtitulo" class="text-caption text-grey-7 ellipsis">{{ subtitulo }}</div>
        <div v-for="(linea, i) in lineasVisibles" :key="i" class="text-caption text-grey-6 ellipsis">
          {{ linea }}
        </div>

        <div v-if="badges.length" class="row q-gutter-xs q-mt-xs">
          <q-badge
            v-for="(badge, i) in badges"
            :key="i"
            :color="badge.color || 'grey-3'"
            :text-color="badge.textColor || 'grey-8'"
            rounded
            class="text-caption"
          >
            {{ badge.etiqueta }}
          </q-badge>
        </div>

        <slot />
      </div>

      <q-icon v-if="clickable" name="chevron_right" color="grey-5" size="18px" class="q-ml-sm" />
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  titulo: { type: String, default: '' },
  subtitulo: { type: String, default: '' },
  lineas: { type: Array, default: () => [] }, // textos cortos; los vacíos se omiten
  badges: { type: Array, default: () => [] }, // [{ etiqueta, color, textColor }]
  avatar: { type: String, default: '' }, // iniciales; si está vacío se usa el icono
  icono: { type: String, default: 'description' },
  colorAvatar: { type: String, default: 'blue-1' },
  colorTextoAvatar: { type: String, default: 'blue-9' },
  clickable: { type: Boolean, default: true },
})

defineEmits(['click'])

const lineasVisibles = computed(() => props.lineas.filter(Boolean))
</script>

<style scoped>
.tarjeta-registro {
  border-radius: 12px;
  background: #fff;
}

.tarjeta-registro__contenido {
  min-width: 0; /* permite que ellipsis funcione dentro de flex */
}

.tarjeta-registro__avatar {
  font-size: 14px;
  font-weight: 600;
}
</style>