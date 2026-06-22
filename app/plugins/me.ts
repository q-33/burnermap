import type { Me } from '../composables/useMe'

// Populate the live user (role + features) once at app load (SSR, hydrated to
// the client) so the UI reflects current grants without a re-login.
export default defineNuxtPlugin(async () => {
  const me = useState<Me | null>('me', () => null)
  // useRequestFetch forwards the incoming request's cookies during SSR, so
  // /api/me sees the session and returns the live role/features. Plain $fetch
  // drops the cookie server-side → /api/me returns null → admin UI stays hidden
  // (e.g. on a direct load of /admin, which has no client-side refresh).
  const apiFetch = useRequestFetch()
  await callOnce('load-me', async () => {
    me.value = await apiFetch<Me | null>('/api/me').catch(() => null)
  })
})
