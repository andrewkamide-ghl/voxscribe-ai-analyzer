import { createClient } from 'npm:@supabase/supabase-js';
import { requireEnv } from './utils.ts';

function getServiceRoleKey() {
  return (
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    Deno.env.get('SB_SERVICE_ROLE_KEY') ??
    requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  );
}

export function svc() {
  const url = requireEnv('SUPABASE_URL');
  const key = getServiceRoleKey();
  return createClient(url, key);
}
