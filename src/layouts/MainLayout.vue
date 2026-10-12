<template>
  <q-layout view="hHh LpR fFf">
      <!-- <q-header elevated class="bg-[#00ff00]" style="padding-top: env(safe-area-inset-top)"> -->
<q-header elevated style="padding-top: env(safe-area-inset-top)">
      <q-toolbar>
        <q-btn flat round dense icon="menu" @click="toggleSideMenu" />
        <q-toolbar-title>SeviCanino</q-toolbar-title>
          <q-btn
          flat
          round
          dense
          icon="logout"
          @click="logout"
        />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="sideMenuOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>SeviCanino APP</q-item-label>
        <EssentialLink v-for="link in filteredLinks" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container class="bg-grey-1">
      <router-view />
    </q-page-container>
    <VisorArchivos />
  </q-layout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { linksList } from '../router/link-list.js'
import EssentialLink from 'components/EssentialLink.vue'
import useUI from '../composables/useUI'
import { storeToRefs } from 'pinia'
import { useStoreUsuarios } from '../stores/usuarios'
import useNotifications from 'src/composables/useNotifications'
import { useRouter } from 'vue-router'
import VisorArchivos from 'components/VisorArchivos.vue'

const router = useRouter()
const useUsuario = useStoreUsuarios()

const uiStore = useUI()
const { sideMenuOpen } = storeToRefs(uiStore)
const { toggleSideMenu } = uiStore

const { inicializarNotificaciones } = useNotifications()

const filteredLinks = computed(() => {
  return linksList.filter((link) => {
    if (!link.perfiles || link.perfiles.length === 0) return true
    return link.perfiles.includes(useUsuario.perfile)
  })
})

onMounted(async () => {
  useUsuario.refrescarSesion() // perfil y ciudad al día, en segundo plano
  if (useUsuario.isAuthenticated) {
    await inicializarNotificaciones()
  }
})

const logout = () => {
  useUsuario.cerrarSesion()
  router.replace('/')
}

defineOptions({
  name: 'MainLayout',
})
</script>
