import type { FeatureCollection } from 'geojson'
import { CITY_TIME_MAX, CITY_TIME_MIN, MAN, STREET_RADII, addressToLatLng } from './geocode'

// Draw Black Rock City as GeoJSON purely from the parametric geocoder — no map
// tiles required. Lettered streets become arcs; clock hours become radial spokes.

const STREETS = Object.keys(STREET_RADII)

function arcForStreet(street: string): [number, number][] {
  const pts: [number, number][] = []
  // sample every ~6 minutes of clock across the populated arc
  for (let t = CITY_TIME_MIN; t <= CITY_TIME_MAX + 1e-9; t += 0.1) {
    const ll = addressToLatLng({ time: t, street })
    if (ll)
      pts.push([ll.lng, ll.lat])
  }
  return pts
}

function spokeForHour(time: number): [number, number][] {
  const inner = addressToLatLng({ time, street: STREETS[0]! })
  const outer = addressToLatLng({ time, street: STREETS[STREETS.length - 1]! })
  if (!inner || !outer)
    return []
  return [[inner.lng, inner.lat], [outer.lng, outer.lat]]
}

export function cityGridGeoJson(): FeatureCollection {
  const features: FeatureCollection['features'] = []

  for (const street of STREETS) {
    features.push({
      type: 'Feature',
      properties: { kind: 'street', name: street },
      geometry: { type: 'LineString', coordinates: arcForStreet(street) },
    })
  }

  for (let h = CITY_TIME_MIN; h <= CITY_TIME_MAX; h += 0.5) {
    features.push({
      type: 'Feature',
      properties: { kind: 'spoke', time: h },
      geometry: { type: 'LineString', coordinates: spokeForHour(h) },
    })
  }

  return { type: 'FeatureCollection', features }
}

export const manPoint: [number, number] = [MAN.lng, MAN.lat]
