import { asc, eq } from 'drizzle-orm'
import { users } from '../db/schema'

// Resolve the primary admin so a signed-in user can start a "Message the Admin"
// chat. Returns id + display name only (no email). Null when the viewer IS the
// admin (they'd just use their inbox) or no admin exists.
export default defineEventHandler(async (event) => {
  const me = await requireUser(event)
  const [admin] = await useDb()
    .select({ id: users.id, displayName: users.displayName })
    .from(users).where(eq(users.role, 'admin')).orderBy(asc(users.createdAt)).limit(1)
  if (!admin || admin.id === me.id)
    return { admin: null }
  return { admin }
})
