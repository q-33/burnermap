import { eq } from 'drizzle-orm'
import { campGeometry } from '../../../db/schema'

// One camp's exact geometry (for the editor). Public — a footprint is not
// sensitive — and defensive so a missing table just reads as "none yet".
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  const db = useDb()
  try {
    const [row] = await db.select().from(campGeometry).where(eq(campGeometry.campId, id)).limit(1)
    return row ?? null
  }
  catch {
    return null
  }
})
