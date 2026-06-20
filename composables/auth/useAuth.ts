import { useAuthStore } from '~~/stores/auth'

// Auth backed by Supabase Auth. The session is persisted by supabase-js
// (localStorage) and mirrored into the auth store for the app/middleware.
export function useAuth() {
  const authStore = useAuthStore()
  const supabase = useSupabase()

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error)
      throw error
    authStore.user = data.user ?? {}
    return authStore.user
  }

  const signup = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error)
      throw error
    authStore.user = data.user ?? {}
    return authStore.user
  }

  const logout = async () => {
    await supabase.auth.signOut()
    authStore.user = {}
  }

  const me = async () => {
    const { data } = await supabase.auth.getUser()
    authStore.user = data.user ?? {}
    return authStore.user
  }

  // Restore an existing session on app load and keep the store in sync.
  const initAuth = async () => {
    const { data } = await supabase.auth.getSession()
    authStore.user = data.session?.user ?? {}
    supabase.auth.onAuthStateChange((_event, session) => {
      authStore.user = session?.user ?? {}
    })
  }

  return { login, signup, logout, me, initAuth }
}
