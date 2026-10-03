<template>
  <div ref="contenedor" class="lienzo-zoom">
    <div ref="contenido" class="lienzo-zoom__contenido">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePellizcoZoom } from '../composables/usePellizcoZoom'

const props = defineProps({
  // 'ajustar': la imagen cabe completa en pantalla (usa `proporcion`)
  // 'ancho':   ocupa el ancho de la pantalla y se desplaza en vertical (PDF)
  modo: { type: String, default: 'ajustar' },
  proporcion: { type: Number, default: 0 }, // ancho / alto de la imagen
  minimo: { type: Number, default: 1 },
  maximo: { type: Number, default: 4 },
})

const emit = defineEmits(['deslizar'])

const contenedor = ref(null)
const contenido = ref(null)

const anchoBase = () => {
  const elemento = contenedor.value
  if (!elemento) return 0
  const ancho = elemento.clientWidth
  const alto = elemento.clientHeight
  if (props.modo === 'ajustar' && props.proporcion > 0) {
    return Math.min(ancho, alto * props.proporcion)
  }
  return ancho
}

const { zoom, acercar, alejar, reiniciar, recalcular } = usePellizcoZoom(contenedor, contenido, {
  anchoBase,
  minimo: props.minimo,
  maximo: props.maximo,
  alDeslizar: (direccion) => emit('deslizar', direccion),
})

// Al cargar otra imagen vuelve a zoom 1
watch(() => props.proporcion, () => reiniciar())

// Al rotar el celular o cambiar el tamaño de la ventana
let observador = null
onMounted(() => {
  observador = new ResizeObserver(() => recalcular())
  observador.observe(contenedor.value)
})
onBeforeUnmount(() => observador?.disconnect())

defineExpose({ zoom, acercar, alejar, reiniciar })
</script>

<style scoped>
.lienzo-zoom {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  /* Un dedo: scroll nativo. Dos dedos: los maneja usePellizcoZoom */
  touch-action: pan-x pan-y;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.lienzo-zoom__contenido {
  /* margin: auto centra cuando cabe y se alinea arriba/izquierda cuando se desborda,
     así nunca queda una parte del contenido inalcanzable */
  margin: auto;
  flex-shrink: 0;
}
</style>