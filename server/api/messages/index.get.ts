import { sql } from 'drizzle-orm'

// List the current user's conversations: one row per other party, with the last
// message and the count of unread messages from them. Newest activity first.
export default defineEventHandler(async (event) => {
  const me = await requireUser(event)
  const db = useDb()

  const rows = await db.execute(sql`
    select
      partner.id                        as "userId",
      partner.display_name              as "displayName",
      partner.playa_name                as "playaName",
      lm.body                           as "lastBody",
      lm.created_at                     as "lastAt",
      (lm.sender_id = ${me.id})         as "lastFromMe",
      coalesce(u.unread, 0)             as "unread"
    from (
      select distinct case when sender_id = ${me.id} then recipient_id else sender_id end as partner_id
      from messages
      where sender_id = ${me.id} or recipient_id = ${me.id}
    ) c
    join users partner on partner.id = c.partner_id
    join lateral (
      select body, created_at, sender_id
      from messages m
      where (m.sender_id = ${me.id} and m.recipient_id = c.partner_id)
         or (m.sender_id = c.partner_id and m.recipient_id = ${me.id})
      order by m.created_at desc
      limit 1
    ) lm on true
    left join lateral (
      select count(*)::int as unread
      from messages m2
      where m2.recipient_id = ${me.id} and m2.sender_id = c.partner_id and m2.read_at is null
    ) u on true
    order by lm.created_at desc
  `)

  // db.execute returns raw rows; normalize the unread to a number.
  return (rows as unknown as any[]).map(r => ({
    userId: r.userId,
    displayName: r.displayName,
    playaName: r.playaName,
    lastBody: r.lastBody,
    lastAt: r.lastAt,
    lastFromMe: r.lastFromMe === true || r.lastFromMe === 't',
    unread: Number(r.unread) || 0,
  }))
})
