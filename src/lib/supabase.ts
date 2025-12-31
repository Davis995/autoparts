import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Default keys (fallbacks if env variables are missing)
const DEFAULT_URL = 'https://zibnneekiixqnhynzqli.supabase.co'
const DEFAULT_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYm5uZWVraWl4cW5oeW56cWxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njg0OTU2MiwiZXhwIjoyMDgyNDI1NTYyfQ.aFp1kHba7b1H4GHiiJ_R3-lH5KlyDRcLk7cuD8Eb9G4'

function getClientKeys() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_SERVICE_KEY
  return { url, anon }
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_SERVICE_KEY)
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Compatibility export using fallbacks
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_SERVICE_KEY
)
