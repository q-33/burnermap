import { describe, expect, it } from 'vitest'
import { cityGridGeoJson, manPoint } from './cityGeoJson'

describe('cityGridGeoJson', () => {
  const fc = cityGridGeoJson()

  it('produces street arcs and clock spokes', () => {
    const streets = fc.features.filter(f => f.properties?.kind === 'street')
    const spokes = fc.features.filter(f => f.properties?.kind === 'spoke')
    expect(streets.length).toBe(12) // Esplanade + A..K
    expect(spokes.length).toBeGreaterThan(10)
  })

  it('contains no NaN coordinates', () => {
    const coords = fc.features.flatMap(f => (f.geometry as any).coordinates as [number, number][])
    expect(coords.length).toBeGreaterThan(0)
    expect(coords.every(([a, b]) => Number.isFinite(a) && Number.isFinite(b))).toBe(true)
  })

  it('centers near the Man', () => {
    expect(manPoint[0]).toBeCloseTo(-119.2035, 2)
    expect(manPoint[1]).toBeCloseTo(40.7864, 2)
  })
})
