-- Fix OAuth Security: Replace permissive false policies with proper restrictive policies

-- Drop existing permissive policies that don't actually restrict access
DROP POLICY IF EXISTS "No access for anon/auth" ON public.connections;
DROP POLICY IF EXISTS "No access for anon/auth" ON public.oauth_states;

-- Create restrictive policies that truly deny access to anon/authenticated users
-- Only service role should access these tables via edge functions

CREATE POLICY "Deny all anon/auth access" ON public.connections
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false);

CREATE POLICY "Deny all anon/auth access" ON public.oauth_states
  AS RESTRICTIVE FOR ALL TO anon, authenticated  
  USING (false);

-- Ensure RLS is enabled (should already be, but confirming)
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;