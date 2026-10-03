// pdf.js se carga solo la primera vez que se abre un PDF (import dinámico),
// así no pesa en el arranque de la app.
// Se usa el build "legacy" porque funciona en WebViews de Android más viejos.

let bibliotecaPdf = null

async function cargarPdfjs() {
  if (bibliotecaPdf) return bibliotecaPdf

  const [biblioteca, worker] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
  ])

  biblioteca.GlobalWorkerOptions.workerSrc = worker.default
  bibliotecaPdf = biblioteca
  return biblioteca
}

/**
 * Dibuja cada página del PDF en un <canvas> dentro de `contenedor`.
 * Las páginas se dibujan con más resolución que la pantalla para que el texto
 * siga nítido al hacer zoom (hasta ~3x).
 *
 * @returns {{ documento, recortado: boolean } | null}  null si se canceló
 */
export async function renderizarPdf(blob, contenedor, opciones = {}) {
  const {
    anchoCss = window.innerWidth,
    cancelado = () => false,
    alProgreso = () => {},
    maxPaginas = 40, // más páginas consumen demasiada memoria en celulares de gama baja
  } = opciones

  const pdfjs = await cargarPdfjs()
  const datos = new Uint8Array(await blob.arrayBuffer())
  const documento = await pdfjs.getDocument({ data: datos }).promise

  const totalReal = documento.numPages
  const total = Math.min(totalReal, maxPaginas)
  const calidad = Math.min(window.devicePixelRatio || 1, 2) * 1.5

  for (let numero = 1; numero <= total; numero++) {
    if (cancelado()) {
      await documento.destroy()
      return null
    }

    alProgreso(numero, totalReal)

    const pagina = await documento.getPage(numero)
    const base = pagina.getViewport({ scale: 1 })
    const viewport = pagina.getViewport({ scale: (anchoCss * calidad) / base.width })

    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    canvas.className = 'visor-pdf__pagina'
    contenedor.appendChild(canvas)

    await pagina.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
    pagina.cleanup()
  }

  return { documento, recortado: totalReal > total }
}