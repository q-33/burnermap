import type { SupabaseClient } from '@supabase/supabase-js'

// Access the shared Supabase client provided by plugins/supabase.ts.
export function useSupabase(): SupabaseClient {
  return useNuxtApp().$supabase as SupabaseClient
}
