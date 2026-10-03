import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Zoom con dos dedos, doble toque, Ctrl + rueda (escritorio) y deslizar con un dedo.
 *
 * No usa transform: cambia el ANCHO real del contenido y deja que el contenedor haga scroll
 * nativo. Así el desplazamiento con un dedo es el del sistema (fluido, con inercia) y el
 * pellizco solo ajusta el tamaño manteniendo fijo el punto entre los dedos.
 *
 * El viewport de la app tiene user-scalable=no, así que el navegador nunca hace zoom propio:
 * todo el zoom lo controla esto.
 *
 * @param {Ref<HTMLElement>} contenedorRef  elemento con overflow: auto
 * @param {Ref<HTMLElement>} contenidoRef   elemento cuyo ancho se escala
 * @param {Object} opciones
 *   anchoBase()      → ancho en px con zoom 1 (ajustado a pantalla)
 *   minimo, maximo   → límites de zoom
 *   zoomDobleToque   → zoom al hacer doble toque
 *   alDeslizar(dir)  → dir = 1 (siguiente) | -1 (anterior); solo con zoom 1
 */
export function usePellizcoZoom(contenedorRef, contenidoRef, opciones = {}) {
  const {
    anchoBase = () => contenedorRef.value?.clientWidth || 0,
    minimo = 1,
    maximo = 4,
    zoomDobleToque = 2.5,
    alDeslizar = null,
  } = opciones

  const zoom = ref(1)

  let pellizco = null // { distancia, zoom }
  let unDedo = null // { x, y, movio }
  let ultimoToque = { tiempo: 0, x: 0, y: 0 }
  let cuadro = null

  const limitar = (valor) => Math.min(maximo, Math.max(minimo, valor))

  /** Cambia el zoom dejando quieto el punto (clienteX, clienteY) de la pantalla */
  function aplicarZoom(nuevo, clienteX, clienteY) {
    const contenedor = contenedorRef.value
    const contenido = contenidoRef.value
    if (!contenedor || !contenido) return

    const valor = limitar(nuevo)
    const rectContenedor = contenedor.getBoundingClientRect()
    const x = clienteX ?? rectContenedor.left + rectContenedor.width / 2
    const y = clienteY ?? rectContenedor.top + rectContenedor.height / 2

    // Posición relativa (0 a 1) del punto dentro del contenido, antes de escalar
    const antes = contenido.getBoundingClientRect()
    const fx = antes.width ? Math.min(1, Math.max(0, (x - antes.left) / antes.width)) : 0.5
    const fy = antes.height ? Math.min(1, Math.max(0, (y - antes.top) / antes.height)) : 0.5

    zoom.value = valor
    contenido.style.width = `${anchoBase() * valor}px`

    // Después de escalar, mueve el scroll para que ese mismo punto quede bajo los dedos
    const despues = contenido.getBoundingClientRect()
    contenedor.scrollLeft += despues.left + fx * despues.width - x
    contenedor.scrollTop += despues.top + fy * despues.height - y
  }

  /** Recalcula el ancho (al cargar la imagen, rotar el celular o cambiar de archivo) */
  function recalcular() {
    const contenido = contenidoRef.value
    if (contenido) contenido.style.width = `${anchoBase() * zoom.value}px`
  }

  function reiniciar() {
    zoom.value = 1
    recalcular()
    const contenedor = contenedorRef.value
    if (contenedor) {
      contenedor.scrollLeft = 0
      contenedor.scrollTop = 0
    }
  }

  const acercar = () => aplicarZoom(zoom.value * 1.5)
  const alejar = () => aplicarZoom(zoom.value / 1.5)

  // ── Gestos ──

  const distancia = (toques) =>
    Math.hypot(toques[0].clientX - toques[1].clientX, toques[0].clientY - toques[1].clientY)

  const centro = (toques) => ({
    x: (toques[0].clientX + toques[1].clientX) / 2,
    y: (toques[0].clientY + toques[1].clientY) / 2,
  })

  function alIniciarToque(evento) {
    if (evento.touches.length === 2) {
      pellizco = { distancia: distancia(evento.touches), zoom: zoom.value }
      unDedo = null
    } else if (evento.touches.length === 1) {
      const toque = evento.touches[0]
      unDedo = { x: toque.clientX, y: toque.clientY, movio: false }
    }
  }

  function alMoverToque(evento) {
    if (evento.touches.length === 2 && pellizco) {
      evento.preventDefault() // el pellizco es nuestro; el scroll nativo queda para un dedo
      const nuevo = (pellizco.zoom * distancia(evento.touches)) / pellizco.distancia
      const punto = centro(evento.touches)
      cancelAnimationFrame(cuadro)
      cuadro = requestAnimationFrame(() => aplicarZoom(nuevo, punto.x, punto.y))
      return
    }

    if (unDedo && evento.touches.length === 1) {
      const toque = evento.touches[0]
      if (Math.hypot(toque.clientX - unDedo.x, toque.clientY - unDedo.y) > 10) unDedo.movio = true
    }
  }

  function alTerminarToque(evento) {
    if (evento.touches.length < 2) pellizco = null
    if (evento.touches.length > 0 || !unDedo) return

    const toque = evento.changedTouches[0]
    const dx = toque.clientX - unDedo.x
    const dy = toque.clientY - unDedo.y

    if (!unDedo.movio) {
      // Toque sin movimiento: ¿es el segundo de un doble toque?
      const ahora = Date.now()
      const cerca = Math.hypot(toque.clientX - ultimoToque.x, toque.clientY - ultimoToque.y) < 40
      if (ahora - ultimoToque.tiempo < 300 && cerca) {
        aplicarZoom(zoom.value > 1.05 ? 1 : zoomDobleToque, toque.clientX, toque.clientY)
        ultimoToque = { tiempo: 0, x: 0, y: 0 }
      } else {
        ultimoToque = { tiempo: ahora, x: toque.clientX, y: toque.clientY }
      }
    } else if (alDeslizar && zoom.value <= 1.01 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      alDeslizar(dx < 0 ? 1 : -1)
    }

    unDedo = null
  }

  function alRueda(evento) {
    if (!evento.ctrlKey) return // sin Ctrl, la rueda hace scroll normal
    evento.preventDefault()
    aplicarZoom(zoom.value * (evento.deltaY < 0 ? 1.15 : 1 / 1.15), evento.clientX, evento.clientY)
  }

  onMounted(() => {
    const contenedor = contenedorRef.value
    if (!contenedor) return
    // passive: false es obligatorio para poder usar preventDefault en touchmove y wheel
    contenedor.addEventListener('touchstart', alIniciarToque, { passive: true })
    contenedor.addEventListener('touchmove', alMoverToque, { passive: false })
    contenedor.addEventListener('touchend', alTerminarToque, { passive: true })
    contenedor.addEventListener('touchcancel', alTerminarToque, { passive: true })
    contenedor.addEventListener('wheel', alRueda, { passive: false })
    recalcular()
  })

  onBeforeUnmount(() => {
    const contenedor = contenedorRef.value
    cancelAnimationFrame(cuadro)
    if (!contenedor) return
    contenedor.removeEventListener('touchstart', alIniciarToque)
    contenedor.removeEventListener('touchmove', alMoverToque)
    contenedor.removeEventListener('touchend', alTerminarToque)
    contenedor.removeEventListener('touchcancel', alTerminarToque)
    contenedor.removeEventListener('wheel', alRueda)
  })

  return { zoom, aplicarZoom, acercar, alejar, reiniciar, recalcular }
}