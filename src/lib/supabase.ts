import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (cached) return cached;
  const url = (globalThis as any)?.VITE_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL;
  const anon = (globalThis as any)?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.warn("Supabase not configured. Connect Supabase in Lovable Project settings.");
    return null;
  }
  cached = createClient(url, anon);
  return cached;
}
