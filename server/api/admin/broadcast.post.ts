import { broadcastSchema } from '../../utils/validation'
import { sendEmail, esc } from '../../utils/email'
import { users } from '../../db/schema'

// Admin: send an announcement email to every registered user (or a test to just
// the admin). Each recipient gets their own message (no shared To/BCC, so
// addresses are never exposed). Body is plain text; we render a simple branded
// HTML version (paragraphs, "- " bullets, autolinked URLs).
function renderHtml(body: string): string {
  const link = (s: string) => s.replace(/(https?:\/\/[^\s<]+)/g, u => `<a href="${u}" style="color:#e1641a;text-decoration:none">${u}</a>`)
  const fmt = (s: string) => link(esc(s))
  const blocks: string[] = []
  let list: string[] = []
  let para: string[] = []
  const flushList = () => { if (list.length) { blocks.push(`<ul style="padding-left:18px">${list.map(li => `<li style="margin-bottom:4px">${li}</li>`).join('')}</ul>`); list = [] } }
  const flushPara = () => { if (para.length) { blocks.push(`<p>${para.join('<br>')}</p>`); para = [] } }
  for (const raw of body.replace(/\r\n/g, '\n').split('\n')) {
    const t = raw.trimEnd()
    if (/^\s*[-*]\s+/.test(t)) { flushPara(); list.push(fmt(t.replace(/^\s*[-*]\s+/, ''))); continue }
    flushList()
    if (t.trim() === '') { flushPara(); continue }
    para.push(fmt(t))
  }
  flushPara(); flushList()
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#2f2820;max-width:560px;margin:0 auto;line-height:1.55;font-size:15px">${blocks.join('')}</div>`
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  // Guard against accidental repeat mass-sends; test sends are cheap so looser.
  const { subject, body, target } = await readValidatedBody(event, broadcastSchema.parse)
  rateLimit(event, target === 'all' ? 'broadcast-all' : 'broadcast-test', target === 'all' ? 3 : 20, 60 * 60_000, admin.id)

  const db = useDb()
  let recipients: string[]
  if (target === 'self') {
    recipients = [admin.email]
  }
  else {
    const rows = await db.select({ email: users.email }).from(users)
    recipients = [...new Set(rows.map(r => r.email).filter(Boolean))]
  }
  if (!recipients.length)
    throw createError({ statusCode: 400, statusMessage: 'No recipients' })

  const html = renderHtml(body)
  // Send one message per recipient, sequentially (gentle on the SMTP relay).
  let sent = 0
  let failed = 0
  for (const to of recipients) {
    const ok = await sendEmail({ to, subject, text: body, html })
    ok ? sent++ : failed++
  }

  await audit(admin.id, 'broadcast', { detail: `${target} · ${sent}/${recipients.length} sent · "${subject.slice(0, 80)}"` })
  return { target, total: recipients.length, sent, failed }
})
