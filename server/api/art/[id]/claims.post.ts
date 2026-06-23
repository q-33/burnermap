import { and, eq } from 'drizzle-orm'
import { art, artClaims } from '../../../db/schema'
import { artClaimSchema } from '../../../utils/validation'

// A logged-in artist requests to claim an official, ownerless artwork. Creates a
// pending claim for an admin to approve through the site. One pending claim per
// (artwork, user); can't claim an artwork that already has an owner.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const user = await requireUser(event)
  const { message } = await readValidatedBody(event, artClaimSchema.parse)
  const db = useDb()

  const target = await db.query.art.findFirst({ where: eq(art.id, id), columns: { id: true, ownerId: true } })
  if (!target)
    throw createError({ statusCode: 404, statusMessage: 'Art not found' })
  if (target.ownerId)
    throw createError({ statusCode: 409, statusMessage: target.ownerId === user.id ? 'You already manage this artwork.' : 'This artwork has already been claimed.' })

  const existing = await db.query.artClaims.findFirst({
    where: and(eq(artClaims.artId, id), eq(artClaims.claimantId, user.id), eq(artClaims.status, 'pending')),
    columns: { id: true },
  })
  if (existing)
    throw createError({ statusCode: 409, statusMessage: 'You already have a claim awaiting review for this artwork.' })

  const [created] = await db
    .insert(artClaims)
    .values({ artId: id, claimantId: user.id, message: message || null })
    .returning({ id: artClaims.id, status: artClaims.status })
  await audit(user.id, 'claim.request', { targetType: 'art', targetId: id })
  return created
})
