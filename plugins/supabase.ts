import { createClient } from '@supabase/supabase-js'

// Single Supabase client for the SPA. URL + anon/publishable key are public by
// design; row access is governed by RLS policies (see supabase/schema.sql).
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseKey as string,
  )
  return {
    provide: { supabase },
  }
})
