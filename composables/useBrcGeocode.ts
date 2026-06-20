import polygons from '~/components/Map/Polygons.json'

export interface LatLng {
  gps_latitude: number
  gps_longitude: number
}

// Canonical "H:MM & Letter" address for a block — must match the key the map
// uses on block-click (stores/camps.ts formatBlockAddress, inverted) so a
// submitted location's pin and its block both resolve to the same spot.
function canonicalAddress(blockTime: number, roadLetter: string): string {
  const totalMinutes = Math.round(blockTime * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}:${String(m).padStart(2, '0')} & ${roadLetter}`
}

let lookup: Record<string, LatLng> | null = null

function buildLookup(): Record<string, LatLng> {
  const result: Record<string, LatLng> = {}
  const features = (polygons as any).features ?? []
  for (const feature of features) {
    const blockTime = feature?.properties?.blockTime
    const roadLetter = feature?.properties?.roadLetter
    const ring = feature?.coordinates?.[0]
    if (blockTime == null || !roadLetter || !ring?.length)
      continue
    let sumLng = 0
    let sumLat = 0
    for (const [lng, lat] of ring) {
      sumLng += lng
      sumLat += lat
    }
    result[canonicalAddress(blockTime, roadLetter)] = {
      gps_longitude: sumLng / ring.length,
      gps_latitude: sumLat / ring.length,
    }
  }
  return result
}

// Resolve a BRC clock+letter address (e.g. "7:30 & E") to a lat/lng using the
// centroid of the matching city block. Returns null when no block matches
// (the location still works for block-click lookup via its address string).
export function useBrcGeocode() {
  function geocodeAddress(address: string): LatLng | null {
    if (!lookup)
      lookup = buildLookup()
    return lookup[address] ?? null
  }
  return { geocodeAddress }
}
