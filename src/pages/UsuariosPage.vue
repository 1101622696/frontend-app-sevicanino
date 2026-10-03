<template>
  <q-page class="bg-grey-2">
    <!-- ════════ ADMIN: lista de usuarios ════════ -->
    <q-pull-to-refresh v-if="useUsuario.esAdmin" color="primary" @refresh="refrescar">
      <div class="q-pa-md">
        <BarraFiltros
          :filtros="filtrosVisibles"
          :tipo-activo="tipoLista"
          :opciones="opcionesFiltro"
          :tiene-valor="tieneValor"
          :opciones-orden="opcionesOrden"
          v-model:valor="valorFiltro"
          v-model:orden="orden"
          v-model:busqueda="busqueda"
          placeholder-busqueda="Buscar por nombre, correo o cédula"
          class="q-mb-md"
          @seleccionar="seleccionarFiltro"
        />

        <EncabezadoLista
          :titulo="filtroActual.titulo"
          :detalle="etiquetaValorFiltro"
          :icono="filtroActual.icono"
          :color="filtroActual.color"
          :total="listaFiltrada.length"
        />

        <EstadoLista
          :cargando="cargandoInicial"
          :vacio="!cargandoInicial && !listaFiltrada.length"
          :hay-filtros="hayFiltros"
          icono="group"
          texto-vacio="Aún no hay usuarios registrados"
          texto-ayuda="Cree los usuarios de los manejadores de cada ciudad."
          texto-accion="Crear usuario"
          @accion="abrirCrear"
          @limpiar="reiniciar"
        />

        <div v-if="!cargandoInicial" class="column q-gutter-y-sm lista-con-fab">
          <TarjetaRegistro
            v-for="usuario in listaFiltrada"
            :key="usuario.email"
            :titulo="usuario.nombre || usuario.email"
            :subtitulo="usuario.email"
            :lineas="[storeCiudades.nombreCiudad(usuario.ciudad_id)]"
            :badges="[badgePerfil(usuario), badgeEstado(usuario)]"
            :avatar="iniciales(usuario.nombre)"
            v-bind="coloresPerfil(usuario.perfil)"
            @click="verDetalle(usuario)"
          />
        </div>
      </div>
    </q-pull-to-refresh>

    <!-- ════════ MANEJADOR: mi perfil ════════ -->
    <div v-else class="q-pa-md mi-perfil">
      <div v-if="cargando && !perfil" class="flex flex-center q-pa-xl">
        <q-spinner color="primary" size="40px" />
      </div>

      <template v-else-if="perfil">
        <div class="column items-center text-center q-pt-md">
          <q-avatar
            size="88px"
            v-bind="avatarGrande(perfil.perfil)"
            class="text-h5 text-weight-medium"
          >
            {{ iniciales(perfil.nombre) }}
          </q-avatar>
          <div class="text-h6 q-mt-md">{{ perfil.nombre }}</div>
          <div class="text-body2 text-grey-7">{{ perfil.email }}</div>
          <q-badge v-bind="badgePerfilProps(perfil)" rounded class="q-mt-sm">
            {{ badgePerfil(perfil).etiqueta }}
          </q-badge>
        </div>

        <q-card flat bordered class="q-mt-lg mi-perfil__tarjeta">
          <q-list separator>
            <q-item v-for="campo in camposPerfil" :key="campo.etiqueta">
              <q-item-section avatar>
                <q-icon :name="campo.icono" color="grey-6" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>{{ campo.etiqueta }}</q-item-label>
                <q-item-label>{{ campo.valor || '—' }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <q-btn
          unelevated
          rounded
          no-caps
          color="primary"
          icon="edit"
          label="Editar mis datos"
          class="full-width q-mt-lg"
          @click="abrirEditar(perfil)"
        />
        <!-- El botón de cambiar contraseña se agrega cuando hagamos el tema del hash -->

        <div class="text-caption text-grey-7 text-center q-mt-md">
          Para cambiar su correo, ciudad o contrato, comuníquese con el administrador.
        </div>
      </template>
    </div>

    <!-- Detalle (admin) -->
    <DialogoDetalle
      v-model="mostrarDetalle"
      :titulo="detalle?.nombre || ''"
      :subtitulo="detalle?.email || ''"
      :avatar="iniciales(detalle?.nombre)"
      v-bind="coloresPerfil(detalle?.perfil)"
      :badges="detalle ? [badgePerfil(detalle), badgeEstado(detalle)] : []"
      :campos="camposDetalle"
      @editar="abrirEditar(detalle)"
    >
      <div v-if="detalle" class="fila-activacion row items-center q-mt-md">
        <div class="col">
          <div class="text-body2 text-weight-medium">Usuario activo</div>
          <div class="text-caption text-grey-7">
            {{
              esMiCuenta(detalle)
                ? 'No puede desactivar su propia cuenta.'
                : 'Un usuario inactivo no puede iniciar sesión.'
            }}
          </div>
        </div>
        <q-toggle
          :model-value="normalizar(detalle.estado) === 'activo'"
          :disable="cambiandoEstado || esMiCuenta(detalle)"
          color="positive"
          @update:model-value="cambiarEstado"
        />
      </div>
    </DialogoDetalle>

    <!-- Formulario -->
    <DialogoFormulario
      v-model="mostrarFormulario"
      :titulo="tituloFormulario"
      :subtitulo="esEdicion ? formulario.email : 'Complete los datos del usuario'"
      :cargando="useUsuario.loading"
      :texto-guardar="esEdicion ? 'Guardar cambios' : 'Crear usuario'"
      :icono-guardar="esEdicion ? 'save' : 'person_add'"
      @guardar="guardar"
      @cerrar="resetear"
    >
      <div class="seccion-formulario">Datos personales</div>

      <q-input v-model.trim="formulario.nombre" label="Nombre completo" outlined rounded dense bg-color="white" />

      <q-input
        v-model.trim="formulario.cedula"
        label="Cédula"
        inputmode="numeric"
        outlined
        rounded
        dense
        bg-color="white"
      />

      <!-- Los demás campos solo los maneja el admin -->
      <template v-if="useUsuario.esAdmin">
        <div class="seccion-formulario">Acceso</div>

        <q-input
          v-model.trim="formulario.email"
          label="Correo electrónico"
          type="email"
          inputmode="email"
          autocomplete="off"
          :readonly="esEdicion"
          :hint="esEdicion ? 'El correo es el identificador del usuario y no se puede cambiar.' : undefined"
          outlined
          rounded
          dense
          bg-color="white"
        />

        <q-input
          v-if="!esEdicion"
          v-model="formulario.password"
          label="Contraseña"
          :type="verPassword ? 'text' : 'password'"
          autocomplete="new-password"
          hint="Mínimo 6 caracteres"
          outlined
          rounded
          dense
          bg-color="white"
        >
          <template #append>
            <q-icon
              :name="verPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              :aria-label="verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="verPassword = !verPassword"
            />
          </template>
        </q-input>

        <div>
          <div class="text-caption text-grey-7 q-mb-xs q-px-sm">Perfil</div>
          <q-btn-toggle
            v-model="formulario.perfil"
            :options="OPCIONES_PERFIL"
            :disable="esEdicion && esMiCuenta(formulario)"
            spread
            no-caps
            rounded
            unelevated
            color="white"
            text-color="grey-8"
            toggle-color="primary"
            class="toggle-borde"
          />
          <div v-if="esEdicion && esMiCuenta(formulario)" class="text-caption text-grey-7 q-mt-xs q-px-sm">
            No puede cambiar el perfil de su propia cuenta.
          </div>
        </div>

        <div class="seccion-formulario">Asignación</div>

        <q-select
          v-model="formulario.ciudad_id"
          :options="storeCiudades.opcionesCiudades"
          label="Ciudad"
          emit-value
          map-options
          outlined
          rounded
          dense
          bg-color="white"
        />

        <q-input v-model.trim="formulario.contrato" label="Contrato" outlined rounded dense bg-color="white" />
      </template>
    </DialogoFormulario>

    <q-page-sticky v-if="useUsuario.esAdmin" position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="person_add" color="primary" aria-label="Crear usuario" @click="abrirCrear" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStoreUsuarios } from '../stores/usuarios'
import { useStoreCiudades } from '../stores/ciudades'
import { useFiltrosLista } from '../composables/useFiltrosLista'
import { FILTROS_USUARIOS } from '../composables/filtrosusuarios'
import { PERFILES } from '../composables/catalogos'
import { capitalizar, iniciales, normalizar } from '../utils/texto'
import { validarRequeridos } from '../utils/formulario'

import BarraFiltros from '../components/BarraFiltros.vue'
import EncabezadoLista from '../components/EncabezadoLista.vue'
import EstadoLista from '../components/EstadoLista.vue'
import TarjetaRegistro from '../components/TarjetaRegistro.vue'
import DialogoDetalle from '../components/DialogoDetalle.vue'
import DialogoFormulario from '../components/DialogoFormulario.vue'

defineOptions({ name: 'UsuariosPage' })

const useUsuario = useStoreUsuarios()
const storeCiudades = useStoreCiudades()

const OPCIONES_PERFIL = PERFILES.map((valor) => ({ label: capitalizar(valor), value: valor }))
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── Datos ──
// Admin: todos los usuarios. Manejador: el backend devuelve solo el suyo.
const usuarios = ref([])
const cargando = ref(false)
const cargandoInicial = computed(() => cargando.value && !usuarios.value.length)

const perfil = computed(() => {
  if (useUsuario.esAdmin) return null
  return usuarios.value[0] || (useUsuario.user?.email ? useUsuario.user : null)
})

async function cargar() {
  cargando.value = true
  try {
    usuarios.value = await useUsuario.listarUsuario()
  } finally {
    cargando.value = false
  }
}

async function refrescar(terminar) {
  await Promise.all([cargar(), storeCiudades.obtenerCiudades({ forzar: true })])
  terminar()
}

const esMiCuenta = (usuario) => normalizar(usuario?.email) === normalizar(useUsuario.emailUsuario)

// ── Filtros (solo admin) ──
const {
  tipoLista,
  valorFiltro,
  orden,
  busqueda,
  filtrosVisibles,
  filtroActual,
  tieneValor,
  opcionesFiltro,
  etiquetaValorFiltro,
  opcionesOrden,
  listaFiltrada,
  seleccionarFiltro,
  reiniciar,
} = useFiltrosLista(FILTROS_USUARIOS.config, usuarios, {
  ...FILTROS_USUARIOS.opcionesLista,
  esAdmin: () => useUsuario.esAdmin,
})

const hayFiltros = computed(() => tipoLista.value !== 'todos' || Boolean(busqueda.value))

// ── Presentación ──
const coloresPerfil = (perfilUsuario) =>
  perfilUsuario === 'administrador'
    ? { colorAvatar: 'indigo-1', colorTextoAvatar: 'indigo-9' }
    : { colorAvatar: 'purple-1', colorTextoAvatar: 'purple-9' }

const avatarGrande = (perfilUsuario) => {
  const colores = coloresPerfil(perfilUsuario)
  return { color: colores.colorAvatar, textColor: colores.colorTextoAvatar }
}

const badgePerfil = (usuario) => ({
  etiqueta: capitalizar(usuario?.perfil) || 'Sin perfil',
  color: usuario?.perfil === 'administrador' ? 'indigo-1' : 'purple-1',
  textColor: usuario?.perfil === 'administrador' ? 'indigo-9' : 'purple-9',
})

const badgePerfilProps = (usuario) => {
  const badge = badgePerfil(usuario)
  return { color: badge.color, textColor: badge.textColor }
}

const badgeEstado = (usuario) =>
  normalizar(usuario?.estado) === 'activo'
    ? { etiqueta: 'Activo', color: 'green-1', textColor: 'green-9' }
    : { etiqueta: usuario?.estado ? capitalizar(usuario.estado) : 'Sin estado', color: 'grey-3', textColor: 'grey-7' }

const camposPerfil = computed(() => {
  const p = perfil.value
  if (!p) return []
  return [
    { etiqueta: 'Cédula', valor: p.cedula, icono: 'badge' },
    { etiqueta: 'Ciudad', valor: storeCiudades.nombreCiudad(p.ciudad_id), icono: 'location_city' },
    { etiqueta: 'Contrato', valor: p.contrato, icono: 'description' },
  ]
})

// ── Detalle (admin) ──
const mostrarDetalle = ref(false)
const detalle = ref(null)
const cambiandoEstado = ref(false)

function verDetalle(usuario) {
  detalle.value = { ...usuario }
  mostrarDetalle.value = true
}

const camposDetalle = computed(() => {
  const d = detalle.value
  if (!d) return []
  return [
    { etiqueta: 'Cédula', valor: d.cedula },
    { etiqueta: 'Ciudad', valor: storeCiudades.nombreCiudad(d.ciudad_id) },
    { etiqueta: 'Contrato', valor: d.contrato, completo: true },
  ]
})

async function cambiarEstado(activar) {
  if (!detalle.value || esMiCuenta(detalle.value)) return
  cambiandoEstado.value = true
  try {
    if (activar) {
      await useUsuario.putActivarUsuario(detalle.value.email)
    } else {
      await useUsuario.putInactivarUsuario(detalle.value.email)
    }
    detalle.value.estado = activar ? 'activo' : 'inactivo'
    await cargar()
  } catch {
    // el store ya notificó
  } finally {
    cambiandoEstado.value = false
  }
}

// ── Formulario ──
const mostrarFormulario = ref(false)
const esEdicion = ref(false)
const verPassword = ref(false)

const nuevoFormulario = () => ({
  nombre: '',
  cedula: '',
  email: '',
  password: '',
  perfil: 'manejador',
  ciudad_id: '',
  contrato: '',
})

const formulario = ref(nuevoFormulario())

const tituloFormulario = computed(() => {
  if (!esEdicion.value) return 'Crear usuario'
  return useUsuario.esAdmin ? 'Editar usuario' : 'Editar mis datos'
})

function abrirCrear() {
  esEdicion.value = false
  verPassword.value = false
  formulario.value = nuevoFormulario()
  mostrarFormulario.value = true
}

function abrirEditar(usuario) {
  if (!usuario) return
  esEdicion.value = true
  const base = nuevoFormulario()
  Object.keys(base).forEach((clave) => {
    if (usuario[clave] !== undefined) base[clave] = usuario[clave]
  })
  base.password = ''
  formulario.value = base
  mostrarFormulario.value = true
}

function resetear() {
  formulario.value = nuevoFormulario()
  esEdicion.value = false
  verPassword.value = false
}

function reglasValidacion() {
  const basicas = [
    { campo: 'nombre', mensaje: 'Escriba el nombre completo' },
    { campo: 'cedula', mensaje: 'Escriba la cédula' },
  ]
  if (!useUsuario.esAdmin) return basicas

  const admin = [
    ...basicas,
    { campo: 'perfil', mensaje: 'Seleccione el perfil' },
    { campo: 'ciudad_id', mensaje: 'Seleccione la ciudad' },
  ]
  if (esEdicion.value) return admin

  return [
    ...admin,
    { campo: 'email', mensaje: 'Escriba un correo válido', validar: (valor) => CORREO_VALIDO.test(valor || '') },
    {
      campo: 'password',
      mensaje: 'La contraseña debe tener al menos 6 caracteres',
      validar: (valor) => String(valor || '').length >= 6,
    },
  ]
}

// Solo se envía lo que cada caso puede cambiar (el backend también lo restringe)
function datosAEnviar() {
  const f = formulario.value
  if (!useUsuario.esAdmin) return { nombre: f.nombre, cedula: f.cedula }

  const comunes = {
    nombre: f.nombre,
    cedula: f.cedula,
    perfil: f.perfil,
    ciudad_id: f.ciudad_id,
    contrato: f.contrato,
  }
  return esEdicion.value ? comunes : { ...comunes, email: f.email.toLowerCase(), password: f.password }
}

async function guardar() {
  if (!validarRequeridos(formulario.value, reglasValidacion())) return

  const datos = datosAEnviar()
  try {
    if (esEdicion.value) {
      await useUsuario.putUsuarios(formulario.value.email, datos)
      // Si editó su propia cuenta, actualiza el nombre de la sesión
      if (esMiCuenta(formulario.value)) {
        useUsuario.user = { ...useUsuario.user, nombre: datos.nombre, cedula: datos.cedula }
      }
    } else {
      await useUsuario.postUsuario(datos)
    }
    mostrarFormulario.value = false
    mostrarDetalle.value = false
    resetear()
    await cargar()
  } catch {
    // el store ya notificó; el formulario queda abierto para corregir
  }
}

onMounted(() => {
  storeCiudades.obtenerCiudades()
  cargar()
})
</script>

<style scoped>
.lista-con-fab {
  padding-bottom: 80px;
}

.mi-perfil {
  max-width: 480px;
  margin: 0 auto;
}

.mi-perfil__tarjeta {
  border-radius: 12px;
  background: #fff;
}

.toggle-borde {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.fila-activacion {
  background: #f5f6f8;
  border-radius: 10px;
  padding: 10px 12px;
}
</style>