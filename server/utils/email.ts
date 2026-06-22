// Minimal transactional email via Resend. Fully optional: if RESEND_API_KEY is
// not configured the helpers no-op, so the app works without email set up.
// To enable: add a Resend API key as the RESEND_API_KEY env/secret and verify
// the sender domain (EMAIL_FROM, default noreply@burnermap.org) in Resend.

const SITE_URL = process.env.PUBLIC_SITE_URL ?? 'https://burnermap.org'

export async function sendEmail(opts: { to: string, subject: string, html: string, text: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key)
    return false // email not configured — silently skip (in-app delivery still works)
  try {
    await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: {
        from: process.env.EMAIL_FROM ?? 'BurnerMap <noreply@burnermap.org>',
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      },
    })
    return true
  }
  catch {
    return false // email is a best-effort nudge — never fail the request
  }
}

const esc = (s: string) => s.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!))

// "You have a new message" nudge — sent only on the first unread from a sender
// so an active back-and-forth doesn't spam the inbox.
export async function notifyNewMessage(to: string, fromName: string, preview: string): Promise<void> {
  const url = `${SITE_URL}/messages`
  const snippet = preview.length > 140 ? `${preview.slice(0, 140)}…` : preview
  await sendEmail({
    to,
    subject: `New message from ${fromName} on BurnerMap`,
    text: `${fromName} sent you a message on BurnerMap:\n\n"${snippet}"\n\nReply here: ${url}`,
    html: `<p><strong>${esc(fromName)}</strong> sent you a message on BurnerMap:</p>`
      + `<blockquote style="margin:12px 0;padding:8px 12px;border-left:3px solid #e1641a;color:#444">${esc(snippet)}</blockquote>`
      + `<p><a href="${url}" style="color:#e1641a">Open your inbox to reply →</a></p>`,
  })
}
