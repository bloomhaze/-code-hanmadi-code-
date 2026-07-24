import { createClient } from '@supabase/supabase-js'

// Supabase credentials come from Vite env vars (see .env.example).
// VITE_ prefixed vars are the only ones exposed to client code.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in dev so a missing/empty .env is obvious instead of a
  // confusing runtime error deep inside a query.
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in your project credentials.',
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')
