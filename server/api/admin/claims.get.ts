import { desc, eq } from 'drizzle-orm'
import { artClaims } from '../../db/schema'

// Admin: pending artwork-ownership claims awaiting review.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  const rows = await db.query.artClaims.findMany({
    where: eq(artClaims.status, 'pending'),
    orderBy: [desc(artClaims.createdAt)],
    limit: 200,
    with: {
      art: { columns: { id: true, name: true, artist: true } },
      claimant: { columns: { id: true, email: true, displayName: true } },
    },
  })
  return rows.map(r => ({
    id: r.id,
    message: r.message,
    createdAt: r.createdAt,
    artId: r.art?.id ?? null,
    artName: r.art?.name ?? '(deleted)',
    artArtist: r.art?.artist ?? null,
    claimantId: r.claimant?.id ?? null,
    claimant: r.claimant?.displayName || r.claimant?.email || 'Unknown',
    claimantEmail: r.claimant?.email ?? null,
  }))
})
