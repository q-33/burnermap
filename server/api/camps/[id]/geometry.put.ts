import { eq } from 'drizzle-orm'
import { canManageAnyCamp } from '~~/lib/roles'
import { campGeometrySchema } from '../../../utils/validation'
import { campGeometry, camps } from '../../../db/schema'

// Upsert a camp's exact footprint/height (owner, or Org/admin). Used by the
// Sun & Shade footprint editor. Clearing both fields is fine (keeps a row of
// nulls); DELETE removes the row entirely.
export default defineEventHandler(async (event) => {
  const user = await getFreshUser(event)
  if (!user)
    throw createError({ statusCode: 401, statusMessage: 'Not signed in' })
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  const body = await readValidatedBody(event, campGeometrySchema.parse)
  const db = useDb()

  const [camp] = await db.select({ ownerId: camps.ownerId }).from(camps).where(eq(camps.id, id)).limit(1)
  if (!camp)
    throw createError({ statusCode: 404, statusMessage: 'Camp not found' })
  if (camp.ownerId !== user.id && !canManageAnyCamp(user.role))
    throw createError({ statusCode: 403, statusMessage: 'You do not manage that camp' })

  const footprint = body.footprint ?? null
  const heightFt = body.heightFt ?? null
  try {
    const [row] = await db.insert(campGeometry)
      .values({ campId: id, footprint, heightFt })
      .onConflictDoUpdate({ target: campGeometry.campId, set: { footprint, heightFt, updatedAt: new Date() } })
      .returning()
    await audit(user.id, 'camp.geometry', { targetType: 'camps', targetId: id, detail: `${footprint?.length ?? 0} pts · ${heightFt ?? '—'} ft` })
    return row
  }
  catch (err) {
    // The only expected failure is the table missing (pre-migration).
    throw createError({ statusCode: 503, statusMessage: 'Camp geometry isn\'t available yet — the database migration hasn\'t been applied.', data: { cause: (err as Error)?.message } })
  }
})
