import { describe, expect, it } from 'vitest'
import { bounds, centroid, normalizeUnit, simplify, toOffsets, type Pt } from './footprint'

const square: Pt[] = [[0, 0], [10, 0], [10, 10], [0, 10]]

describe('footprint helpers', () => {
  it('centroid of a unit-ish square', () => {
    expect(centroid(square)).toEqual([5, 5])
  })

  it('normalizeUnit centres and scales max dim to 1', () => {
    const u = normalizeUnit(square)
    const b = bounds(u)
    expect(Math.max(b.w, b.h)).toBeCloseTo(1, 6)
    const c = centroid(u)
    expect(c[0]).toBeCloseTo(0, 6)
    expect(c[1]).toBeCloseTo(0, 6)
  })

  it('toOffsets scales a unit square to the requested metre size', () => {
    const u = normalizeUnit(square) // unit square, half-extent 0.5
    const off = toOffsets(u, 20, 0) // 20 m across
    const b = bounds(off)
    expect(b.w).toBeCloseTo(20, 6)
    expect(b.h).toBeCloseTo(20, 6)
  })

  it('toOffsets rotates', () => {
    const u: Pt[] = [[0.5, 0]] // point on +x
    const [p] = toOffsets(u, 2, 90) // size 2 → x=1; rotate 90° clockwise → (0,-1)
    expect(p![0]).toBeCloseTo(0, 6)
    expect(p![1]).toBeCloseTo(-1, 6)
  })

  it('simplify caps the vertex count', () => {
    const many: Pt[] = Array.from({ length: 500 }, (_, i) => [Math.cos(i), Math.sin(i)] as Pt)
    expect(simplify(many, 48).length).toBe(48)
    expect(simplify(square, 48)).toBe(square) // already small → unchanged
  })
})
