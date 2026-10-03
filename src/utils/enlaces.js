import { useVisorArchivos } from '../composables/useVisorArchivos'

// Reemplaza la versión provisional del bloque 3.
// DialogoDetalle y cualquier página siguen llamando abrirEnlace(); ahora abre el visor de la app.
export const abrirEnlace = (referencia, titulo = 'Archivos adjuntos') => {
  if (!referencia) return
  useVisorArchivos().abrirArchivos(referencia, titulo)
}