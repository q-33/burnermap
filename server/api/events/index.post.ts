import { eq } from 'drizzle-orm'
import { eventSchema } from '../../utils/validation'
import { camps, events } from '../../db/schema'

// Create an event. Any signed-in user may post an event; ownerId records the
// creator. Attaching it to a camp requires owning that camp (admins excepted, so
// they can post on behalf of any camp). Admins prune anything that shouldn't be
// here. Auth required.
export default defineEventHandler(async (event) => {
  const user = await getFreshUser(event)
  if (!user)
    throw createError({ statusCode: 401, statusMessage: 'Not signed in' })
  const body = await readValidatedBody(event, eventSchema.parse)
  const db = useDb()
  const isAdmin = user.role === 'admin'

  let campId: string | null = null
  if (body.campId) {
    const [camp] = await db.select({ ownerId: camps.ownerId }).from(camps).where(eq(camps.id, body.campId)).limit(1)
    if (!camp)
      throw createError({ statusCode: 404, statusMessage: 'Camp not found' })
    if (camp.ownerId !== user.id && !isAdmin)
      throw createError({ statusCode: 403, statusMessage: 'You do not own that camp' })
    campId = body.campId
  }
  // else: a personal/unaffiliated event — allowed for any signed-in user.

  const [created] = await db
    .insert(events)
    .values({
      ownerId: user.id,
      campId,
      title: body.title,
      description: body.description,
      startsAt: body.startsAt,
      endsAt: body.endsAt || null,
    })
    .returning()
  return created
})
