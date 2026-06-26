import { eq } from 'drizzle-orm'
import { campSchema } from '../../utils/validation'
import { camps } from '../../db/schema'
import { canOwnMultipleCamps } from '~~/lib/roles'

// Create a camp owned by the current user. Any signed-in user may create one;
// most are capped at a single camp (edit the existing one instead). Hubs (and
// BM Org / admins) may own several — see canOwnMultipleCamps.
export default defineEventHandler(async (event) => {
  // Live role so a freshly-granted Hub can add a second camp without re-login.
  const user = await getFreshUser(event)
  if (!user)
    throw createError({ statusCode: 401, statusMessage: 'Not signed in' })
  const body = await readValidatedBody(event, campSchema.parse)
  const db = useDb()

  if (!canOwnMultipleCamps(user.role)) {
    const [existing] = await db.select({ id: camps.id }).from(camps).where(eq(camps.ownerId, user.id)).limit(1)
    if (existing)
      throw createError({ statusCode: 409, statusMessage: 'You already have a camp — edit it instead.' })
  }

  const [camp] = await db
    .insert(camps)
    .values({
      ownerId: user.id,
      name: body.name,
      year: body.year,
      description: body.description,
      website: body.website || null,
      contactEmail: body.contactEmail || null,
      hometown: body.hometown,
    })
    .returning()
  return camp
})
