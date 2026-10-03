<template>
  <div class="todo">
    <div class="body">
      <section>
        <form @submit.prevent="iniciar">
          <h1>Inicio</h1>
          <div class="inputbox">
            <input type="email" required v-model="email" />
            <label for="">Usuario</label>
          </div>
          <div class="inputbox password-box">
            <input :type="passwordFieldType" required v-model="passwordLogin" />
            <label for="">Contraseña</label>
            <i
              :class="['eye-icon', passwordVisible ? 'fas fa-eye-slash' : 'fas fa-eye']"
              @click="togglePasswordVisibility"
            ></i>
          </div>
          <button type="submit">Iniciar</button>
          <div class="register"></div>
          <button class="btrecuperar" @click="activador()">¿Olvidaste la contraseña?</button>
        </form>
      </section>
      <div class="recuperarcontrasena" v-if="vifRecontrasena">
        <div class="divbtx">
          <button type="submit" class="btx" @click="cerrar()">X</button>
        </div>
        <div class="inputbox">
          <input type="email" required v-model="emailrecuperador" />
          <label for="">Ingresar correo</label>
        </div>
        <button type="submit" @click="recuperar()">Recuperar contraseña</button>
      </div>

      <!-- Paso 2: verificar código -->
      <div class="recuperarcontrasena" v-if="vifVerificarCodigo">
        <div class="divbtx">
          <button type="button" class="btx" @click="cerrar()">X</button>
        </div>
        <div class="inputbox">
          <input type="text" required v-model="codigoIngresado" />
          <label>Código recibido</label>
        </div>
        <button type="button" @click="verificarCodigo()">Verificar código</button>
      </div>

      <!-- Paso 3: nueva contraseña -->
      <div class="recuperarcontrasena" v-if="vifNuevaPassword">
        <div class="divbtx">
          <button type="button" class="btx" @click="cerrar()">X</button>
        </div>
        <div class="inputbox">
          <input type="password" required v-model="nuevaPassword" />
          <label>Nueva contraseña</label>
        </div>
        <div class="inputbox">
          <input type="password" required v-model="confirmarPassword" />
          <label>Confirmar contraseña</label>
        </div>
        <button type="button" @click="cambiarPassword()">Cambiar contraseña</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStoreUsuarios } from '../stores/usuarios'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const UseUsuario = useStoreUsuarios()
const email = ref('')
const passwordLogin = ref('')
const passwordVisible = ref(false)
const $q = useQuasar()
const vifRecontrasena = ref(false)
const emailrecuperador = ref('')

// Paso 2: verificar código
const vifVerificarCodigo = ref(false)
const codigoIngresado = ref('')

// Paso 3: nueva contraseña
const vifNuevaPassword = ref(false)
const nuevaPassword = ref('')
const confirmarPassword = ref('')

const passwordFieldType = computed(() => (passwordVisible.value ? 'text' : 'password'))
const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value
}

function mostrarMensajeError(mensaje) {
  $q.notify({ type: 'negative', message: mensaje, position: 'bottom-right' })
}
function mostrarMensajeExito(mensaje) {
  $q.notify({ type: 'positive', message: mensaje, position: 'bottom-right' })
}

const iniciar = async () => {
  if (email.value === '' || passwordLogin.value === '') {
    mostrarMensajeError('El correo y la contraseña son obligatorios')
    return
  }
  try {
    const res = await UseUsuario.login(email.value, passwordLogin.value)
    if (res && res.status === 200) {
      router.push('/IndexPage')
    } else {
      mostrarMensajeError('Correo o contraseña incorrectos')
    }
  } catch (error) {
    console.log(error)
  }
}

function activador() {
  vifRecontrasena.value = true
}
function cerrar() {
  vifRecontrasena.value = false
  vifVerificarCodigo.value = false
  vifNuevaPassword.value = false
  emailrecuperador.value = ''
  codigoIngresado.value = ''
  nuevaPassword.value = ''
  confirmarPassword.value = ''
}

async function recuperar() {
  if (!emailrecuperador.value) {
    mostrarMensajeError('Ingrese correo electrónico')
    return
  }
  const res = await UseUsuario.solicitarRecuperacion(emailrecuperador.value)
  if (res?.status === 200) {
    mostrarMensajeExito('Código enviado al correo')
    vifRecontrasena.value = false
    vifVerificarCodigo.value = true
  }
}

async function verificarCodigo() {
  if (!codigoIngresado.value) {
    mostrarMensajeError('Ingrese el código')
    return
  }
  const res = await UseUsuario.verificarCodigo(emailrecuperador.value, codigoIngresado.value)
  if (res?.status === 200) {
    mostrarMensajeExito('Código correcto')
    vifVerificarCodigo.value = false
    vifNuevaPassword.value = true
  }
}

async function cambiarPassword() {
  if (!nuevaPassword.value || !confirmarPassword.value) {
    mostrarMensajeError('Complete los campos')
    return
  }
  if (nuevaPassword.value !== confirmarPassword.value) {
    mostrarMensajeError('Las contraseñas no coinciden')
    return
  }
  const res = await UseUsuario.cambiarPassword(
    emailrecuperador.value,
    codigoIngresado.value,
    nuevaPassword.value,
  )
  if (res?.status === 200) {
    mostrarMensajeExito('Contraseña actualizada correctamente')
    cerrar()
  }
}

defineOptions({ name: 'LoginPage' })
</script>

<style scoped>
.todo {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Poppins', sans-serif;
}

.password-box {
  position: relative;
  display: flex;
  align-items: center;
}

.password-box input {
  width: 100%;
}

.eye-icon {
  cursor: pointer;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
  z-index: 2;
}

.eye-icon:hover {
  color: #333;
}

.body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: url('https://i.postimg.cc/XqhbgbPB/sevicanino.png')
    no-repeat center;
  background-size: cover;
}

section {
  position: relative;
  max-width: 400px;
  background-color: transparent;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  backdrop-filter: blur(55px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 3rem;
}

.inputbox input {
  width: 100%;
  height: 60px;
  background: transparent;
  border: none;
  outline: none;
  font-size: 1rem;
  padding: 0 35px 0 5px;
  color: #fff;
}

.inputbox i {
  position: absolute;
  right: 8px;
  color: #fff;
  font-size: 1.2rem;
  top: 20px;
}

h1 {
  font-size: 2rem;
  color: #fff;
  text-align: center;
}

.inputbox {
  position: relative;
  margin: 30px 0;
  max-width: 310px;
  border-bottom: 2px solid #fff;
}

.inputbox label {
  position: absolute;
  top: 50%;
  left: 5px;
  transform: translateY(-50%);
  color: #fff;
  font-size: 1rem;
  pointer-events: none;
  transition: all 0.5s ease-in-out;
}

input:focus ~ label,
input:valid ~ label {
  top: -5px;
}

button {
  width: 100%;
  height: 40px;
  border-radius: 40px;
  background-color: rgba(255, 255, 255, 1);
  border: none;
  outline: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.4s ease;
}

button:hover {
  background-color: rgba(255, 255, 255, 0.5);
}

.register {
  font-size: 0.9rem;
  color: #fff;
  text-align: center;
  margin: 25px 0 10px;
}

.register p a {
  text-decoration: none;
  color: #fff;
  font-weight: 600;
}

.register p a:hover {
  text-decoration: underline;
}

.btrecuperar {
  background-color: rgba(0, 0, 0, 0);
  font-size: medium;
  color: rgb(255, 255, 255);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.btrecuperar:hover {
  background-color: #ffffff00;
  color: black;
}

.recuperarcontrasena {
  position: absolute;
  max-width: 405px;
  background-color: transparent;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  backdrop-filter: blur(55px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 3rem;
  height: 38vmax;
}

.btx {
  position: absolute;
  font-size: medium;
  color: rgb(255, 255, 255);
  background-color: #ffffff00;
  width: 3vmax;
  top: 1%;
  right: 1%;
}

.btx:hover {
  background-color: #ffffff00;
  color: black;
}

.divbtx {
  display: flex;
  justify-content: right;
}
</style>
