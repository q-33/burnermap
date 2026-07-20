import { eq } from 'drizzle-orm'
import { canManageAnyCamp } from '~~/lib/roles'
import { campGeometry, camps } from '../../../db/schema'

// Clear a camp's exact geometry (owner, or Org/admin).
export default defineEventHandler(async (event) => {
  const user = await getFreshUser(event)
  if (!user)
    throw createError({ statusCode: 401, statusMessage: 'Not signed in' })
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  const db = useDb()

  const [camp] = await db.select({ ownerId: camps.ownerId }).from(camps).where(eq(camps.id, id)).limit(1)
  if (!camp)
    throw createError({ statusCode: 404, statusMessage: 'Camp not found' })
  if (camp.ownerId !== user.id && !canManageAnyCamp(user.role))
    throw createError({ statusCode: 403, statusMessage: 'You do not manage that camp' })

  try {
    await db.delete(campGeometry).where(eq(campGeometry.campId, id))
  }
  catch { /* table missing → nothing to clear */ }
  await audit(user.id, 'camp.geometry_clear', { targetType: 'camps', targetId: id })
  return { ok: true }
})
