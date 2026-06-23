import { and, eq, ne } from 'drizzle-orm'
import { art, artClaims, messages } from '../../../db/schema'
import { claimModerateSchema } from '../../../utils/validation'

// Admin: approve or reject an artwork-ownership claim. Approving transfers
// ownership (art.ownerId = claimant), auto-rejects the other pending claims for
// that artwork, and notifies the artist via an in-app message.
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const { status } = await readValidatedBody(event, claimModerateSchema.parse)
  const db = useDb()

  const claim = await db.query.artClaims.findFirst({
    where: eq(artClaims.id, id),
    columns: { id: true, status: true, artId: true, claimantId: true },
    with: { art: { columns: { id: true, name: true, ownerId: true } } },
  })
  if (!claim || !claim.art)
    throw createError({ statusCode: 404, statusMessage: 'Claim not found' })
  if (claim.status !== 'pending')
    throw createError({ statusCode: 409, statusMessage: 'This claim has already been reviewed.' })

  const now = new Date()
  if (status === 'approved') {
    if (claim.art.ownerId)
      throw createError({ statusCode: 409, statusMessage: 'This artwork already has an owner. Reject this claim instead.' })
    await db.transaction(async (tx) => {
      await tx.update(art).set({ ownerId: claim.claimantId }).where(eq(art.id, claim.artId))
      await tx.update(artClaims).set({ status: 'approved', reviewedById: admin.id, reviewedAt: now }).where(eq(artClaims.id, id))
      // any other pending claim for this artwork can no longer succeed
      await tx.update(artClaims)
        .set({ status: 'rejected', reviewedById: admin.id, reviewedAt: now })
        .where(and(eq(artClaims.artId, claim.artId), eq(artClaims.status, 'pending'), ne(artClaims.id, id)))
    })
  }
  else {
    await db.update(artClaims).set({ status: 'rejected', reviewedById: admin.id, reviewedAt: now }).where(eq(artClaims.id, id))
  }

  // Notify the artist (best-effort; never block the decision on it).
  try {
    const body = status === 'approved'
      ? `Your claim for "${claim.art.name}" was approved — you now manage this artwork. Open its page to edit details, place it on the map, and manage its open call.`
      : `Your claim for "${claim.art.name}" was not approved. If you believe this is a mistake, reply to this message.`
    await db.insert(messages).values({ senderId: admin.id, recipientId: claim.claimantId, body })
  }
  catch { /* messaging is non-critical */ }

  await audit(admin.id, `claim.${status}`, { targetType: 'claim', targetId: id, detail: claim.artId })
  return { id, status }
})
