import { desc } from 'drizzle-orm'
import { users } from '../../db/schema'

// Admin: list all users with their roles.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  return db.query.users.findMany({
    columns: { id: true, email: true, displayName: true, role: true, createdAt: true },
    orderBy: [desc(users.createdAt)],
    limit: 500,
  })
})
