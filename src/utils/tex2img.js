// Render LaTeX to a high-resolution PNG for embedding in the PDF report.
// MathJax (loaded once from CDN) produces a self-contained SVG whose glyphs are
// vector paths; the SVG is rasterized on a canvas at high DPI so equations stay
// crisp in print.

let _ready = null
function loadMathJax() {
  if (_ready) return _ready
  _ready = new Promise((resolve, reject) => {
    if (window.MathJax && window.MathJax.tex2svg) return resolve()
    window.MathJax = {
      tex: { packages: { '[+]': ['ams'] } },
      svg: { fontCache: 'local' },
      startup: { typeset: false },
    }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js'
    s.async = true
    s.onload = () =>
      window.MathJax.startup.promise.then(resolve).catch(reject)
    s.onerror = () => reject(new Error('MathJax failed to load'))
    document.head.appendChild(s)
  })
  return _ready
}

// Returns { dataURL, wEx, hEx } for the rendered equation.
export async function renderEquation(latex, dpi = 3) {
  await loadMathJax()
  const container = window.MathJax.tex2svg(latex, { display: true })
  const svg = container.querySelector('svg')
  const wEx = parseFloat(svg.getAttribute('width')) || 10
  const hEx = parseFloat(svg.getAttribute('height')) || 2
  const pxPerEx = 9
  const wPx = Math.max(2, wEx * pxPerEx)
  const hPx = Math.max(2, hEx * pxPerEx)
  svg.setAttribute('width', `${wPx}px`)
  svg.setAttribute('height', `${hPx}px`)
  svg.style.color = '#111827'

  const svgStr = new XMLSerializer().serializeToString(svg)
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr)
  const img = new Image()
  img.width = wPx
  img.height = hPx
  await new Promise((res, rej) => {
    img.onload = res
    img.onerror = () => rej(new Error('equation image failed'))
    img.src = url
  })
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(wPx * dpi)
  canvas.height = Math.round(hPx * dpi)
  const ctx = canvas.getContext('2d')
  ctx.scale(dpi, dpi)
  ctx.drawImage(img, 0, 0, wPx, hPx)
  return { dataURL: canvas.toDataURL('image/png'), wEx, hEx }
}

// Rasterize a self-contained SVG string (a WaveLoadX figure) to a PNG.
export async function rasterizeSvg(svgString, dpi = 2.5) {
  const vb = svgString.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  const w = parseFloat((vb || [])[1] || '600')
  const h = parseFloat((vb || [])[2] || '340')
  const sized = svgString.replace('<svg ', `<svg width="${w}" height="${h}" `)
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sized)
  const img = new Image()
  img.width = w
  img.height = h
  await new Promise((res, rej) => {
    img.onload = res
    img.onerror = () => rej(new Error('figure raster failed'))
    img.src = url
  })
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * dpi)
  canvas.height = Math.round(h * dpi)
  const ctx = canvas.getContext('2d')
  ctx.scale(dpi, dpi)
  ctx.drawImage(img, 0, 0, w, h)
  return { dataURL: canvas.toDataURL('image/png'), w, h }
}
