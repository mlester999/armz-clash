import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client helpers.
 * Service-role clients must never be imported into browser bundles.
 */

export function createServerAnonClient(input: { url: string; anonKey: string }): SupabaseClient {
  if (!input.url || !input.anonKey) {
    throw new Error('Server anon client requires Supabase URL and anon key.');
  }
  return createClient(input.url, input.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createServiceRoleClient(input: {
  url: string;
  serviceRoleKey: string;
}): SupabaseClient {
  if (!input.url || !input.serviceRoleKey) {
    throw new Error('Service-role client requires Supabase URL and service-role key.');
  }
  if (typeof window !== 'undefined') {
    throw new Error('Service-role client cannot be created in a browser environment.');
  }
  return createClient(input.url, input.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
