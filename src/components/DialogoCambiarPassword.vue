<template>
  <DialogoFormulario
    :model-value="modelValue"
    :titulo="esPropia ? 'Cambiar mi contraseña' : 'Restablecer contraseña'"
    :subtitulo="esPropia ? 'Se cerrará la sesión en sus otros dispositivos' : nombre"
    :cargando="useUsuario.loading"
    texto-guardar="Guardar contraseña"
    icono-guardar="lock_reset"
    @update:model-value="$emit('update:modelValue', $event)"
    @guardar="guardar"
    @cerrar="limpiar"
  >
    <q-banner v-if="!esPropia" rounded class="bg-orange-1 text-orange-10">
      <template #avatar>
        <q-icon name="info" color="orange-8" />
      </template>
      {{ nombre || 'El usuario' }} deberá iniciar sesión de nuevo con esta contraseña en todos sus dispositivos.
      Compártala por un medio seguro.
    </q-banner>

    <q-input
      v-if="esPropia"
      v-model="actual"
      label="Contraseña actual"
      :type="ver ? 'text' : 'password'"
      autocomplete="current-password"
      outlined
      rounded
      dense
      bg-color="white"
    />

    <q-input
      v-model="nueva"
      label="Contraseña nueva"
      :type="ver ? 'text' : 'password'"
      autocomplete="new-password"
      :hint="`Mínimo ${MINIMO} caracteres`"
      outlined
      rounded
      dense
      bg-color="white"
    >
      <template #append>
        <q-icon
          :name="ver ? 'visibility_off' : 'visibility'"
          class="cursor-pointer"
          :aria-label="ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'"
          @click="ver = !ver"
        />
      </template>
    </q-input>

    <q-input
      v-model="confirmar"
      label="Repita la contraseña nueva"
      :type="ver ? 'text' : 'password'"
      autocomplete="new-password"
      outlined
      rounded
      dense
      bg-color="white"
      :error="Boolean(confirmar) && confirmar !== nueva"
      error-message="Las contraseñas no coinciden"
    />
  </DialogoFormulario>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStoreUsuarios } from '../stores/usuarios'
import { normalizar } from '../utils/texto'
import { validarRequeridos } from '../utils/formulario'
import DialogoFormulario from './DialogoFormulario.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  email: { type: String, default: '' }, // usuario al que se le cambia; vacío = el de la sesión
  nombre: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'guardado'])

const useUsuario = useStoreUsuarios()
const MINIMO = 6

const actual = ref('')
const nueva = ref('')
const confirmar = ref('')
const ver = ref(false)

const esPropia = computed(
  () => !props.email || normalizar(props.email) === normalizar(useUsuario.emailUsuario),
)

function limpiar() {
  actual.value = ''
  nueva.value = ''
  confirmar.value = ''
  ver.value = false
}

async function guardar() {
  const datos = { actual: actual.value, nueva: nueva.value, confirmar: confirmar.value }
  const reglas = [
    ...(esPropia.value ? [{ campo: 'actual', mensaje: 'Escriba su contraseña actual' }] : []),
    {
      campo: 'nueva',
      mensaje: `La contraseña nueva debe tener al menos ${MINIMO} caracteres`,
      validar: (valor) => String(valor).length >= MINIMO,
    },
    {
      campo: 'nueva',
      mensaje: 'La contraseña no puede empezar ni terminar con espacios',
      validar: (valor) => String(valor).trim() === String(valor),
    },
    { campo: 'confirmar', mensaje: 'Las contraseñas no coinciden', validar: (valor, d) => valor === d.nueva },
  ]
  if (!validarRequeridos(datos, reglas)) return

  try {
    if (esPropia.value) {
      await useUsuario.cambiarMiPassword(actual.value, nueva.value)
    } else {
      await useUsuario.restablecerPassword(props.email, nueva.value)
    }
    limpiar()
    emit('update:modelValue', false)
    emit('guardado')
  } catch {
    // el store ya notificó; el diálogo queda abierto para corregir
  }
}
</script>