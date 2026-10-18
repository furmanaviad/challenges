import { createClient } from '@supabase/supabase-js'

// Publishable (anon-level) key: safe to ship. Access is enforced by row-level security.
export const supabase = createClient('https://ygxnmbdwskxyeszbtfmg.supabase.co', 'sb_publishable_Vk62sP_ixl4Czasb_terug_9bTxjwOF', {
  auth: { persistSession: true, autoRefreshToken: true, storage: window.localStorage },
})
