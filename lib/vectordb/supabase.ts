import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Get Supabase client instance
 *
 * Reads credentials from environment variables:
 * - SUPABASE_DB_URL
 * - SUPABASE_API_KEY
 *
 * @throws Error if environment variables are missing
 * @returns Configured Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_DB_URL
  const supabaseKey = process.env.SUPABASE_API_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Missing Supabase environment variables: ${!supabaseUrl ? 'SUPABASE_DB_URL ' : ''}${!supabaseKey ? 'SUPABASE_API_KEY' : ''}`
    )
  }

  return createClient(supabaseUrl, supabaseKey)
}
