import { desc, isNotNull } from 'drizzle-orm'
import { users } from '../../db/schema'

// Admin: recently-active users (presence), most-recent first. The client marks
// anyone seen in the last few minutes as "online". last_seen_at is updated on
// each /api/me call (page load + the per-minute heartbeat).
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  return db.query.users.findMany({
    columns: { id: true, email: true, displayName: true, role: true, lastSeenAt: true },
    where: isNotNull(users.lastSeenAt),
    orderBy: [desc(users.lastSeenAt)],
    limit: 100,
  })
})
