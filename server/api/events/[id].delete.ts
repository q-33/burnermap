import { and, eq } from 'drizzle-orm'
import { events } from '../../db/schema'

// Delete an event. You can delete your own; admins can prune any event
// (moderation). Auth required.
export default defineEventHandler(async (event) => {
  const user = await getFreshUser(event)
  if (!user)
    throw createError({ statusCode: 401, statusMessage: 'Not signed in' })
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing event id' })
  const db = useDb()

  const isAdmin = user.role === 'admin'
  const where = isAdmin ? eq(events.id, id) : and(eq(events.id, id), eq(events.ownerId, user.id))
  const result = await db.delete(events).where(where).returning({ id: events.id })
  if (!result.length)
    throw createError({ statusCode: 404, statusMessage: isAdmin ? 'Event not found' : 'Event not found or not yours' })
  return { ok: true }
})
