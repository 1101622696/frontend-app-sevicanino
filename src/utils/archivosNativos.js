import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'

// Para Word, Excel y cualquier archivo que no se pueda ver dentro de la app.
// En Android: guarda en caché y lo abre con la app del celular (usa cordova-plugin-file-opener2,
// que ya tienes instalado). En el navegador: lo descarga.

const blobABase64 = (blob) =>
  new Promise((resolver, rechazar) => {
    const lector = new FileReader()
    lector.onload = () => resolver(String(lector.result).split(',')[1])
    lector.onerror = rechazar
    lector.readAsDataURL(blob)
  })

const nombreSeguro = (nombre) => String(nombre || 'archivo').replace(/[\\/:*?"<>|]/g, '_')

function descargarEnNavegador(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreSeguro(nombre)
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function abrirConOtraApp(blob, nombre, mimeType) {
  if (!Capacitor.isNativePlatform()) {
    descargarEnNavegador(blob, nombre)
    return
  }

  const { uri } = await Filesystem.writeFile({
    path: `visor/${nombreSeguro(nombre)}`,
    data: await blobABase64(blob),
    directory: Directory.Cache,
    recursive: true,
  })

  await new Promise((resolver, rechazar) => {
    const abridor = window.cordova?.plugins?.fileOpener2
    if (!abridor) {
      rechazar(new Error('cordova-plugin-file-opener2 no está disponible'))
      return
    }
    abridor.open(uri, mimeType || 'application/octet-stream', {
      success: resolver,
      error: rechazar,
    })
  })
}