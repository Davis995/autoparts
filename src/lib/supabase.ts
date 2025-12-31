import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// All keys now come from environment variables.
// - NEXT_PUBLIC_SUPABASE_URL:      public URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY: public anon key (safe for browser)
// - SUPABASE_SERVICE_ROLE_KEY:     secret service role key (server only)

const PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getClientKeys() {
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return { url: PUBLIC_SUPABASE_URL, anon: PUBLIC_SUPABASE_ANON_KEY }
}

// Singleton instance for client-side (browser)
let clientInstance: ReturnType<typeof createClient<Database>> | null = null

export const createClientComponentClient = () => {
  if (!clientInstance) {
    const { url, anon } = getClientKeys()
    clientInstance = createClient<Database>(url, anon)
  }
  return clientInstance
}

// Export a single instance for direct use
export const supabaseClient = createClientComponentClient()

// For server-side (API routes): falls back to anon key if SR key missing
export const createServerComponentClient = () => {
  if (!PUBLIC_SUPABASE_URL || !(SERVICE_ROLE_KEY || PUBLIC_SUPABASE_ANON_KEY)) {
    throw new Error('Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  const url = PUBLIC_SUPABASE_URL
  const serviceKey = SERVICE_ROLE_KEY ?? PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Compatibility export using fallbacks
export const supabase = createClient<Database>(
  PUBLIC_SUPABASE_URL!,
  PUBLIC_SUPABASE_ANON_KEY!
)
