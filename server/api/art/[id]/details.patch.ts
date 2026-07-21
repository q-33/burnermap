import { eq } from 'drizzle-orm'
import { canManageAnyCamp } from '~~/lib/roles'
import { artUpdateSchema } from '../../../utils/validation'
import { art } from '../../../db/schema'

// Update an artwork's details (name, artist, description, website, contact,
// hometown). Owner-only — the artist who added it — with Org/admin able to edit
// any piece. Mirrors the camp owner-edit endpoint so art owners can fix their
// own listings, not just camps. Location/year handled elsewhere.
export default defineEventHandler(async (event) => {
  const user = await getFreshUser(event)
  if (!user)
    throw createError({ statusCode: 401, statusMessage: 'Not signed in' })
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  const body = await readValidatedBody(event, artUpdateSchema.parse)
  const db = useDb()

  const [row] = await db.select({ ownerId: art.ownerId }).from(art).where(eq(art.id, id)).limit(1)
  if (!row)
    throw createError({ statusCode: 404, statusMessage: 'Art not found' })
  if (row.ownerId !== user.id && !canManageAnyCamp(user.role))
    throw createError({ statusCode: 403, statusMessage: 'You do not own that artwork' })

  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (body.name !== undefined)
    set.name = body.name
  if (body.artist !== undefined)
    set.artist = body.artist || null
  if (body.description !== undefined)
    set.description = body.description || null
  if (body.website !== undefined)
    set.website = body.website || null
  if (body.contactEmail !== undefined)
    set.contactEmail = body.contactEmail || null
  if (body.hometown !== undefined)
    set.hometown = body.hometown || null

  const [updated] = await db.update(art).set(set).where(eq(art.id, id)).returning()
  await audit(user.id, 'art.edit', { targetType: 'art', targetId: id })
  return updated
})
