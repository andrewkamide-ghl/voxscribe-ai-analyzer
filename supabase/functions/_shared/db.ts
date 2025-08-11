import { createClient } from 'npm:@supabase/supabase-js';
import { requireEnv } from './utils.ts';

export function svc() {
  const url = requireEnv('SUPABASE_URL');
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}
