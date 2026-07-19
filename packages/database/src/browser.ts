import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser-safe Supabase client factory.
 * Uses anon key only. Never pass service-role credentials here.
 */
export function createBrowserSupabaseClient(input: {
  url: string;
  anonKey: string;
}): SupabaseClient {
  if (!input.url || !input.anonKey) {
    throw new Error(
      'Browser Supabase client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  if (/service_role|service-role/i.test(input.anonKey)) {
    throw new Error('Refusing to create browser client with a service-role key.');
  }
  return createClient(input.url, input.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
