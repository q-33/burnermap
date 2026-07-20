// Camp footprint helpers for the Sun & Shade tool. A footprint is stored as an
// array of [dx, dy] metre offsets from the camp pin (x = east, y = north),
// centred on the pin. The editor works in a dimensionless "unit" polygon (max
// dimension = 1) and applies a size (metres) + rotation to produce the offsets.

export type Pt = [number, number]

export function centroid(pts: Pt[]): Pt {
  let x = 0
  let y = 0
  for (const [px, py] of pts) {
    x += px
    y += py
  }
  const n = pts.length || 1
  return [x / n, y / n]
}

export function bounds(pts: Pt[]): { w: number, h: number, minX: number, minY: number } {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of pts) {
    if (x < minX)
      minX = x
    if (y < minY)
      minY = y
    if (x > maxX)
      maxX = x
    if (y > maxY)
      maxY = y
  }
  return { w: maxX - minX, h: maxY - minY, minX, minY }
}

// Centre a polygon on its centroid and scale so its largest dimension is 1.
export function normalizeUnit(pts: Pt[]): Pt[] {
  const [cx, cy] = centroid(pts)
  const centred = pts.map(([x, y]) => [x - cx, y - cy] as Pt)
  const { w, h } = bounds(centred)
  const s = Math.max(w, h) || 1
  return centred.map(([x, y]) => [x / s, y / s] as Pt)
}

// Scale a unit polygon to `sizeM` (its largest dimension, in metres) and rotate
// clockwise by `rotDeg`, yielding [dx, dy] metre offsets ready to store.
export function toOffsets(unit: Pt[], sizeM: number, rotDeg: number): Pt[] {
  const a = (rotDeg * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  return unit.map(([x, y]) => {
    const sx = x * sizeM
    const sy = y * sizeM
    // rotate (east/north) clockwise by rotDeg
    return [sx * cos + sy * sin, -sx * sin + sy * cos] as Pt
  })
}

// Reduce a dense polygon to at most `maxN` points by uniform stride (cheap, and
// good enough for shade — footprints don't need sub-metre fidelity).
export function simplify(pts: Pt[], maxN = 48): Pt[] {
  if (pts.length <= maxN)
    return pts
  const stride = pts.length / maxN
  const out: Pt[] = []
  for (let i = 0; i < maxN; i++)
    out.push(pts[Math.floor(i * stride)]!)
  return out
}

// Parse an SVG file's first geometry element into a normalized unit polygon.
// Uses the browser's SVG geometry API (getPointAtLength) so paths, arcs and
// curves all sample correctly. Client-only (needs the DOM). Throws on no shape.
export function parseSvgToUnitPolygon(svgText: string): Pt[] {
  if (typeof document === 'undefined')
    throw new Error('SVG parsing is only available in the browser')
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  if (doc.querySelector('parsererror'))
    throw new Error('That file isn\'t valid SVG')
  const el = doc.querySelector('path, polygon, polyline, rect, circle, ellipse') as SVGGraphicsElement | null
  if (!el)
    throw new Error('No shape found in the SVG (need a path, polygon, rect, or ellipse)')

  // Rehost the element in a live, hidden SVG so the geometry API works.
  const NS = 'http://www.w3.org/2000/svg'
  const host = document.createElementNS(NS, 'svg')
  host.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden;opacity:0')
  const clone = el.cloneNode(true) as SVGGraphicsElement
  host.appendChild(clone)
  document.body.appendChild(host)
  try {
    let raw: Pt[]
    const tag = clone.tagName.toLowerCase()
    if (tag === 'polygon' || tag === 'polyline') {
      const list = (clone as unknown as SVGPolygonElement).points
      raw = Array.from({ length: list.numberOfItems }, (_, i) => {
        const p = list.getItem(i)
        return [p.x, -p.y] as Pt // SVG y is down → flip to north-up
      })
    }
    else {
      // path / rect / circle / ellipse: sample along the outline
      const path = clone as unknown as SVGPathElement
      const len = path.getTotalLength?.() ?? 0
      if (!len)
        throw new Error('Could not read the SVG outline')
      const N = 160
      raw = Array.from({ length: N }, (_, i) => {
        const p = path.getPointAtLength((i / N) * len)
        return [p.x, -p.y] as Pt
      })
    }
    if (raw.length < 3)
      throw new Error('The SVG shape needs at least 3 points')
    return simplify(normalizeUnit(raw))
  }
  finally {
    host.remove()
  }
}
