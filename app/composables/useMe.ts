export interface Me { id: string, email: string, displayName: string | null, role: string, features: string[], unreadMessages?: number }

// The current user with LIVE role + feature flags, fetched from /api/me (not the
// login session snapshot) so role/feature grants apply without re-login.
export function useMe() {
  const me = useState<Me | null>('me', () => null)
  const isAdmin = computed(() => me.value?.role === 'admin')
  const isGpe = computed(() => me.value?.role === 'gpe' || me.value?.role === 'admin')
  const unreadMessages = computed(() => me.value?.unreadMessages ?? 0)

  function hasFeature(key: string): boolean {
    const m = me.value
    return !!m && (m.role === 'admin' || m.features.includes(key))
  }

  async function refreshMe() {
    try {
      me.value = await $fetch<Me | null>('/api/me')
    }
    catch {
      me.value = null
    }
  }

  return { me, isAdmin, isGpe, unreadMessages, hasFeature, refreshMe }
}
