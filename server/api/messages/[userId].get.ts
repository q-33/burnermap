import { and, asc, eq, isNull, or } from 'drizzle-orm'
import { messages, users } from '../../db/schema'

// The full thread between the current user and :userId, oldest→newest. Viewing a
// thread marks the other party's messages to me as read. Works for a brand-new
// conversation too (returns the partner + an empty message list).
export default defineEventHandler(async (event) => {
  const me = await requireUser(event)
  const otherId = getRouterParam(event, 'userId')
  if (!otherId)
    throw createError({ statusCode: 400, statusMessage: 'Missing user id' })
  if (otherId === me.id)
    throw createError({ statusCode: 400, statusMessage: 'That’s you' })

  const db = useDb()
  const [other] = await db
    .select({ id: users.id, displayName: users.displayName, playaName: users.playaName })
    .from(users).where(eq(users.id, otherId)).limit(1)
  if (!other)
    throw createError({ statusCode: 404, statusMessage: 'User not found' })

  // mark their messages to me as read
  await db.update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.senderId, otherId), eq(messages.recipientId, me.id), isNull(messages.readAt)))

  const thread = await db.select({
    id: messages.id,
    body: messages.body,
    createdAt: messages.createdAt,
    senderId: messages.senderId,
  })
    .from(messages)
    .where(or(
      and(eq(messages.senderId, me.id), eq(messages.recipientId, otherId)),
      and(eq(messages.senderId, otherId), eq(messages.recipientId, me.id)),
    ))
    .orderBy(asc(messages.createdAt))

  return {
    other,
    messages: thread.map(m => ({ id: m.id, body: m.body, createdAt: m.createdAt, fromMe: m.senderId === me.id })),
  }
})
