/**
 * Cleanup expired Demo Mode sessions (cascades to demo_armz, battles, rewards).
 */

import { createClient } from '@supabase/supabase-js';

export async function cleanupExpiredDemoSessions(): Promise<{ deleted: number; mode: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { deleted: 0, mode: 'skipped_no_supabase' };
  }
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db
    .from('demo_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id');
  if (error) throw error;
  return { deleted: data?.length ?? 0, mode: 'supabase' };
}
