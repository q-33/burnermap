import type { Me } from '../composables/useMe'

// Populate the live user (role + features) once at app load (SSR, hydrated to
// the client) so the UI reflects current grants without a re-login.
export default defineNuxtPlugin(async () => {
  const me = useState<Me | null>('me', () => null)
  await callOnce('load-me', async () => {
    me.value = await $fetch<Me | null>('/api/me').catch(() => null)
  })
})
