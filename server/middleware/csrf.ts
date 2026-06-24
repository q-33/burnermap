// Defense-in-depth CSRF guard for API mutations. The session cookie is already
// SameSite=lax (which blocks cross-site POST/fetch), and bodies are JSON — this
// adds an explicit same-origin Origin check on top.
//
// Fail-open by design: only a request that carries an Origin header whose host
// clearly differs from our own host is rejected. Requests with no Origin
// (server-to-server, curl, health checks) pass through, since CSRF is a
// browser-only attack.
export default defineEventHandler((event) => {
  const method = event.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS')
    return
  if (!event.path.startsWith('/api/'))
    return

  const origin = getHeader(event, 'origin')
  if (!origin)
    return // non-browser client — not a CSRF vector

  let originHost: string
  try {
    originHost = new URL(origin).host
  }
  catch {
    return // unparseable Origin — don't break the request
  }

  const host = getRequestHost(event, { xForwardedHost: true })
  if (host && originHost !== host)
    throw createError({ statusCode: 403, statusMessage: 'Cross-origin request blocked' })
})
