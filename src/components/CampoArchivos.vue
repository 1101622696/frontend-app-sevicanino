<template>
  <div>
    <q-file
      :model-value="valorQFile"
      :label="label"
      :multiple="multiple"
      :append="multiple"
      :accept="accept"
      :max-file-size="maxMb * 1024 * 1024"
      :max-files="multiple ? maxArchivos : undefined"
      use-chips
      clearable
      outlined
      rounded
      dense
      bg-color="white"
      @update:model-value="actualizar"
      @rejected="rechazados"
    >
      <template #prepend>
        <q-icon name="attach_file" />
      </template>
    </q-file>

    <div class="text-caption text-grey-7 q-mt-xs q-px-sm">
      <template v-if="linkActual">
        {{
          multiple
            ? 'Ya tiene archivos adjuntos. Los que agregue se suman a los existentes.'
            : 'Ya tiene un archivo adjunto. Si sube otro, reemplaza al actual.'
        }}
      </template>
      <template v-else>
        {{ multiple ? `Hasta ${maxArchivos} archivos de ${maxMb} MB cada uno.` : `Un archivo de máximo ${maxMb} MB.` }}
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Notify } from 'quasar'

const props = defineProps({
  // Siempre es un array, aunque multiple sea false, para tratar igual todos los módulos
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: 'Archivos adjuntos' },
  multiple: { type: Boolean, default: false },
  accept: { type: String, default: 'image/*, application/pdf, .doc, .docx, .xls, .xlsx' },
  maxMb: { type: Number, default: 15 },
  maxArchivos: { type: Number, default: 10 },
  linkActual: { type: String, default: '' }, // link guardado del registro que se está editando
})

const emit = defineEmits(['update:modelValue'])

const valorQFile = computed(() => (props.multiple ? props.modelValue : props.modelValue[0] || null))

function actualizar(valor) {
  const lista = !valor ? [] : Array.isArray(valor) ? valor : [valor]

  // Evita el mismo archivo dos veces
  const unicos = []
  const vistos = new Set()
  lista.forEach((archivo) => {
    const clave = `${archivo.name}-${archivo.size}-${archivo.lastModified}`
    if (!vistos.has(clave)) {
      vistos.add(clave)
      unicos.push(archivo)
    }
  })

  emit('update:modelValue', unicos)
}

function rechazados(entradas) {
  Notify.create({
    type: 'warning',
    message: `${entradas.length} archivo(s) no se agregaron: superan ${props.maxMb} MB, el tipo no está permitido o se pasó del máximo de archivos.`,
    position: 'bottom',
  })
}
</script>