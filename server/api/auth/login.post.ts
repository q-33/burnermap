import { eq } from 'drizzle-orm'
import { loginSchema } from '../../utils/validation'
import { users } from '../../db/schema'

// A precomputed hash so the "no such user" path spends ~the same time as a real
// password check — closes a timing oracle that would otherwise leak which
// emails are registered. Computed once, lazily.
let _timingHash: string | undefined
async function timingDummy(): Promise<string> {
  if (!_timingHash)
    _timingHash = await hashPassword('timing-equalizer-not-a-real-password')
  return _timingHash
}

export default defineEventHandler(async (event) => {
  // Throttle online password guessing: per-IP and per-targeted-email.
  rateLimit(event, 'login-ip', 12, 5 * 60_000)
  const { email, password } = await readValidatedBody(event, loginSchema.parse)
  rateLimit(event, 'login-email', 8, 15 * 60_000, email.toLowerCase())
  const db = useDb()

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1)
  // Always run a scrypt verify (against a dummy hash when the user is missing)
  // so the response time doesn't reveal whether the email exists.
  let ok = false
  if (user)
    ok = await verifyPassword(user.passwordHash, password)
  else
    await verifyPassword(await timingDummy(), password)
  if (!user || !ok)
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })

  const features = await loadUserFeatures(user.id)
  const sessionUser = { id: user.id, email: user.email, displayName: user.displayName, role: user.role, features }
  await setUserSession(event, { user: sessionUser })
  return { user: sessionUser }
})
