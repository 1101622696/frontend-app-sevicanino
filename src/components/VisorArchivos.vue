<template>
  <q-dialog
    :model-value="abierto"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="(valor) => !valor && cerrar()"
  >
    <div class="visor column no-wrap">
      <!-- Barra superior -->
      <div class="visor__barra row items-center no-wrap">
        <q-btn
          flat
          round
          dense
          color="white"
          :icon="puedeVolver ? 'arrow_back' : 'close'"
          :aria-label="puedeVolver ? 'Volver a la lista' : 'Cerrar'"
          @click="puedeVolver ? volverALista() : cerrar()"
        />

        <div class="col q-ml-sm" style="min-width: 0">
          <div class="text-subtitle2 text-white ellipsis">
            {{ enArchivo ? archivoActual.name : titulo }}
          </div>
          <div v-if="textoSecundario" class="text-caption visor__texto-suave ellipsis">
            {{ textoSecundario }}
          </div>
        </div>

        <template v-if="enArchivo && tipoActual !== 'otro'">
          <q-btn flat round dense color="white" icon="zoom_out" aria-label="Alejar" @click="lienzo?.alejar()" />
          <q-btn flat round dense color="white" icon="zoom_in" aria-label="Acercar" @click="lienzo?.acercar()" />
        </template>
        <q-btn
          v-if="enArchivo"
          flat
          round
          dense
          color="white"
          icon="open_in_new"
          aria-label="Abrir con otra aplicación"
          @click="abrirExterno(archivoActual)"
        />
      </div>

      <!-- Cuerpo -->
      <div class="col relative-position visor__cuerpo">
        <!-- Cargando la lista -->
        <div v-if="cargando" class="absolute-full flex flex-center">
          <q-spinner color="white" size="40px" />
        </div>

        <!-- Error al listar -->
        <div v-else-if="error" class="absolute-full column flex-center q-pa-lg text-center">
          <q-icon name="cloud_off" size="48px" class="visor__texto-suave" />
          <div class="text-white q-mt-md">{{ error }}</div>
          <q-btn outline rounded no-caps color="white" label="Intentar de nuevo" class="q-mt-md" @click="reintentar" />
        </div>

        <!-- Carpeta vacía -->
        <div v-else-if="!archivos.length" class="absolute-full column flex-center q-pa-lg text-center">
          <q-icon name="folder_off" size="48px" class="visor__texto-suave" />
          <div class="text-white q-mt-md">La carpeta no tiene archivos</div>
        </div>

        <!-- Lista de archivos -->
        <q-list v-else-if="!enArchivo" dark separator class="visor__lista">
          <q-item v-for="(archivo, i) in archivos" :key="archivo.id" clickable v-ripple @click="verArchivo(i)">
            <q-item-section avatar>
              <q-icon :name="iconoArchivo(archivo.mimeType)" :color="colorIcono(archivo.mimeType)" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-white">{{ archivo.name }}</q-item-label>
              <q-item-label caption class="visor__texto-suave">
                {{ etiquetaArchivo(archivo) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" class="visor__texto-suave" />
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Viendo un archivo -->
        <template v-else>
          <!-- Imagen -->
          <LienzoZoom
            v-if="tipoActual === 'imagen' && urlImagen"
            ref="lienzo"
            modo="ajustar"
            :proporcion="proporcion"
            :maximo="5"
            @deslizar="navegar"
          >
            <img
              :src="urlImagen"
              :alt="archivoActual.name"
              class="visor__imagen"
              draggable="false"
              @load="alCargarImagen"
            />
          </LienzoZoom>

          <!-- PDF -->
          <LienzoZoom v-else-if="tipoActual === 'pdf' && !errorArchivo" ref="lienzo" modo="ancho" :maximo="3">
            <div ref="paginasPdf" class="visor__pdf" />
          </LienzoZoom>

          <!-- Word, Excel, otros -->
          <div v-else-if="tipoActual === 'otro'" class="absolute-full column flex-center q-pa-lg text-center">
            <q-icon :name="iconoArchivo(archivoActual.mimeType)" size="56px" :color="colorIcono(archivoActual.mimeType)" />
            <div class="text-white q-mt-md">Este tipo de archivo no se puede ver dentro de la app</div>
            <q-btn
              unelevated
              rounded
              no-caps
              color="white"
              text-color="grey-10"
              icon="open_in_new"
              label="Abrir con otra aplicación"
              class="q-mt-md"
              @click="abrirExterno(archivoActual)"
            />
          </div>

          <!-- Error al cargar el archivo -->
          <div v-if="errorArchivo" class="absolute-full column flex-center q-pa-lg text-center">
            <q-icon name="broken_image" size="48px" class="visor__texto-suave" />
            <div class="text-white q-mt-md">{{ errorArchivo }}</div>
            <q-btn
              outline
              rounded
              no-caps
              color="white"
              icon="open_in_new"
              label="Abrir con otra aplicación"
              class="q-mt-md"
              @click="abrirExterno(archivoActual)"
            />
          </div>

          <!-- Cargando el archivo -->
          <div v-if="cargandoArchivo" class="absolute-full flex flex-center visor__cubierta">
            <q-spinner color="white" size="40px" />
          </div>

          <!-- Flechas entre imágenes (escritorio y quien no use el gesto) -->
          <template v-if="hayVariasImagenes">
            <q-btn
              v-if="posicionImagen > 0"
              round
              dense
              unelevated
              icon="chevron_left"
              class="visor__flecha visor__flecha--izq"
              aria-label="Imagen anterior"
              @click="navegar(-1)"
            />
            <q-btn
              v-if="posicionImagen < indicesImagenes.length - 1"
              round
              dense
              unelevated
              icon="chevron_right"
              class="visor__flecha visor__flecha--der"
              aria-label="Imagen siguiente"
              @click="navegar(1)"
            />
          </template>
        </template>
      </div>
    </div>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import LienzoZoom from './LienzoZoom.vue'
import { useVisorArchivos, tipoArchivo } from '../composables/useVisorArchivos'
import { renderizarPdf } from '../utils/pdf'

const {
  abierto,
  titulo,
  archivos,
  cargando,
  error,
  indice,
  reintentar,
  cerrar,
  verArchivo,
  volverALista,
  abrirExterno,
  obtenerArchivo,
} = useVisorArchivos()

const lienzo = ref(null)
const paginasPdf = ref(null)
const urlImagen = ref('')
const proporcion = ref(0)
const cargandoArchivo = ref(false)
const errorArchivo = ref('')
const progresoPdf = ref('')

let versionCarga = 0 // si el usuario cambia de archivo rápido, se descarta la carga anterior
let documentoPdf = null

const enArchivo = computed(() => indice.value >= 0 && Boolean(archivos.value[indice.value]))
const archivoActual = computed(() => archivos.value[indice.value] || null)
const tipoActual = computed(() => tipoArchivo(archivoActual.value?.mimeType))
const puedeVolver = computed(() => enArchivo.value && archivos.value.length > 1)

const indicesImagenes = computed(() =>
  archivos.value
    .map((archivo, i) => (tipoArchivo(archivo.mimeType) === 'imagen' ? i : -1))
    .filter((i) => i >= 0),
)
const posicionImagen = computed(() => indicesImagenes.value.indexOf(indice.value))
const hayVariasImagenes = computed(() => tipoActual.value === 'imagen' && indicesImagenes.value.length > 1)

const textoSecundario = computed(() => {
  if (!enArchivo.value) {
    return archivos.value.length > 1 ? `${archivos.value.length} archivos` : ''
  }
  if (tipoActual.value === 'pdf') return progresoPdf.value
  if (hayVariasImagenes.value) return `${posicionImagen.value + 1} de ${indicesImagenes.value.length}`
  return ''
})

async function liberarPdf() {
  if (!documentoPdf) return
  try {
    await documentoPdf.destroy()
  } catch {
    // ya estaba destruido
  }
  documentoPdf = null
}

watch(archivoActual, async (archivo) => {
  const version = ++versionCarga
  urlImagen.value = ''
  proporcion.value = 0
  errorArchivo.value = ''
  progresoPdf.value = ''
  await liberarPdf()

  if (!archivo) return
  const tipo = tipoArchivo(archivo.mimeType)
  if (tipo === 'otro') return

  cargandoArchivo.value = true
  try {
    const { blob, url } = await obtenerArchivo(archivo.id)
    if (version !== versionCarga) return

    if (tipo === 'imagen') {
      urlImagen.value = url
      return
    }

    // PDF: espera a que exista el contenedor y dibuja las páginas
    await nextTick()
    if (!paginasPdf.value || version !== versionCarga) return
    paginasPdf.value.innerHTML = ''

    const resultado = await renderizarPdf(blob, paginasPdf.value, {
      anchoCss: paginasPdf.value.parentElement?.parentElement?.clientWidth || window.innerWidth,
      cancelado: () => version !== versionCarga,
      alProgreso: (numero, total) => {
        progresoPdf.value = total > 1 ? `Página ${numero} de ${total}` : ''
        if (numero === 1) cargandoArchivo.value = false // muestra la primera página apenas esté
      },
    })

    if (!resultado) return
    documentoPdf = resultado.documento
    const total = resultado.documento.numPages
    progresoPdf.value = resultado.recortado
      ? `Se muestran 40 de ${total} páginas. Ábralo con otra aplicación para verlo completo.`
      : total > 1
        ? `${total} páginas`
        : ''
  } catch (e) {
    if (version !== versionCarga) return
    console.error('No se pudo mostrar el archivo:', e)
    errorArchivo.value = 'No se pudo mostrar este archivo dentro de la app.'
  } finally {
    if (version === versionCarga) cargandoArchivo.value = false
  }
})

watch(abierto, (valor) => {
  if (!valor) {
    versionCarga++
    liberarPdf()
  }
})

function alCargarImagen(evento) {
  const { naturalWidth, naturalHeight } = evento.target
  if (naturalWidth && naturalHeight) proporcion.value = naturalWidth / naturalHeight
}

function navegar(direccion) {
  const destino = posicionImagen.value + direccion
  if (destino >= 0 && destino < indicesImagenes.value.length) {
    verArchivo(indicesImagenes.value[destino])
  }
}

function iconoArchivo(mimeType = '') {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'picture_as_pdf'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table_chart'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'description'
  if (mimeType.startsWith('video/')) return 'videocam'
  return 'insert_drive_file'
}

function colorIcono(mimeType = '') {
  if (mimeType.startsWith('image/')) return 'light-blue-3'
  if (mimeType === 'application/pdf') return 'red-4'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'green-4'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'blue-4'
  return 'grey-5'
}

function etiquetaArchivo(archivo) {
  const tipo = {
    imagen: 'Imagen',
    pdf: 'PDF',
  }[tipoArchivo(archivo.mimeType)] || 'Documento'

  const bytes = Number(archivo.size)
  if (!bytes) return tipo
  const tamano = bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
  return `${tipo}, ${tamano}`
}
</script>

<style scoped>
.visor {
  width: 100%;
  height: 100%;
  background: #000;
}

.visor__barra {
  padding: 8px 8px 8px 4px;
  padding-top: calc(8px + env(safe-area-inset-top));
  background: rgba(0, 0, 0, 0.85);
  z-index: 2;
}

.visor__cuerpo {
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
}

.visor__texto-suave {
  color: rgba(255, 255, 255, 0.6);
}

.visor__lista {
  height: 100%;
  overflow-y: auto;
}

.visor__imagen {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
}

.visor__pdf {
  padding: 8px;
}

.visor__cubierta {
  background: rgba(0, 0, 0, 0.5);
}

.visor__flecha {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.visor__flecha--izq {
  left: 8px;
}

.visor__flecha--der {
  right: 8px;
}
</style>

<!-- Sin scoped: los canvas los crea pdf.js por fuera de la plantilla -->
<style>
.visor-pdf__pagina {
  display: block;
  width: 100%;
  height: auto;
  background: #fff;
  margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}
</style>