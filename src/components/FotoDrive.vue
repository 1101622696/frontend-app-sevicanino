<template>
  <div
    class="foto-drive"
    :class="{ 'cursor-pointer': ampliable && url }"
    :style="{ height: alto, borderRadius: redondeo }"
    :role="ampliable && url ? 'button' : undefined"
    :aria-label="ampliable && url ? `Ampliar ${alt}` : undefined"
    @click="ampliar"
  >
    <img v-if="url" :src="url" :alt="alt" class="foto-drive__imagen" draggable="false" />
    <q-skeleton v-else-if="cargando" type="rect" class="foto-drive__imagen" />
    <div v-else class="foto-drive__vacio flex flex-center">
      <slot>
        <q-icon name="photo_camera" size="32px" color="grey-5" />
      </slot>
    </div>

    <q-icon v-if="ampliable && url" name="zoom_out_map" size="18px" class="foto-drive__indicador" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { resolverReferencia, useVisorArchivos } from '../composables/useVisorArchivos'

const props = defineProps({
  referencia: { type: String, default: '' }, // foto_drive_id o link de Drive
  alt: { type: String, default: 'Foto' },
  alto: { type: String, default: '200px' },
  redondeo: { type: String, default: '12px' },
  ampliable: { type: Boolean, default: true }, // al tocar, abre el visor con zoom
  tituloVisor: { type: String, default: 'Foto' },
})

const { obtenerArchivo, abrirArchivos } = useVisorArchivos()

const url = ref('')
const cargando = ref(false)
let version = 0

watch(
  () => props.referencia,
  async (referencia) => {
    const actual = ++version
    url.value = ''

    const params = resolverReferencia(referencia)
    const fileId = params?.fileId || params?.id
    if (!fileId) return

    cargando.value = true
    try {
      const entrada = await obtenerArchivo(fileId)
      if (actual === version) url.value = entrada.url
    } catch (e) {
      console.error('No se pudo cargar la foto:', e)
    } finally {
      if (actual === version) cargando.value = false
    }
  },
  { immediate: true },
)

function ampliar() {
  if (props.ampliable && url.value) abrirArchivos(props.referencia, props.tituloVisor)
}
</script>

<style scoped>
.foto-drive {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #eceff1;
}

.foto-drive__imagen {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.foto-drive__vacio {
  width: 100%;
  height: 100%;
}

.foto-drive__indicador {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 4px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
}
</style>