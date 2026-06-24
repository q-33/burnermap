import { eq } from 'drizzle-orm'
import { users } from '../db/schema'

// Record the caller as active now (admin "Online" view). A POST so the GET
// /api/me stays side-effect-free; called by the client heartbeat.
export default defineEventHandler(async (event) => {
  const user = await getFreshUser(event)
  if (!user)
    return { ok: false }
  await useDb().update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, user.id)).catch(() => {})
  return { ok: true }
})
