import { campGeometry } from '../../db/schema'

// Public: every camp's exact footprint/height for the map + Sun & Shade tool.
// Defensive by design — if the camp_geometry table doesn't exist yet (feature
// deployed before its migration), return [] so the map keeps working and simply
// falls back to the frontage×depth rectangle. This is what makes the whole
// feature deploy-safe regardless of migration order.
export default defineEventHandler(async () => {
  const db = useDb()
  try {
    return await db.select().from(campGeometry)
  }
  catch (err) {
    console.warn('[camp-geometry] read failed (table not migrated yet?):', (err as Error)?.message)
    return []
  }
})
