
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

function useAuthSession() {
  const [session, setSession] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return session;
}

export default function IntegrationsPanel() {
  const session = useAuthSession();
  const { toast } = useToast();
  const [google, setGoogle] = useState(false);
  const [dropbox, setDropbox] = useState(false);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!session) return;
    const g = await supabase.functions.invoke<{ google: boolean }>('google-status');
    const d = await supabase.functions.invoke<{ dropbox: boolean }>('dropbox-status');
    setGoogle(!!g.data?.google);
    setDropbox(!!d.data?.dropbox);
  }

  useEffect(() => { refresh(); }, [session]);

  // Refresh when window regains focus (after OAuth redirect)
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [session]);

  async function connectGoogle() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke<{ url: string }>('google-oauth-start');
    setLoading(false);
    if (error || !data?.url) {
      toast({ title: 'Google Connect Failed', description: error?.message || 'Unable to start Google OAuth' });
      return;
    }
    try { (window.top || window).location.href = data.url; } catch { window.location.href = data.url; }
  }

  async function connectDropbox() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke<{ url: string }>('dropbox-oauth-start');
    setLoading(false);
    if (error || !data?.url) {
      toast({ title: 'Dropbox Connect Failed', description: error?.message || 'Unable to start Dropbox OAuth' });
      return;
    }
    try { (window.top || window).location.href = data.url; } catch { window.location.href = data.url; }
  }

  async function disconnectGoogle() {
    setLoading(true);
    const { error } = await supabase.functions.invoke<{ ok: boolean }>('google-disconnect');
    setLoading(false);
    if (error) {
      toast({ title: 'Disconnect Failed', description: error.message });
    } else {
      toast({ title: 'Google Drive', description: 'Disconnected' });
      refresh();
    }
  }

  async function disconnectDropbox() {
    setLoading(true);
    const { error } = await supabase.functions.invoke<{ ok: boolean }>('dropbox-disconnect');
    setLoading(false);
    if (error) {
      toast({ title: 'Disconnect Failed', description: error.message });
    } else {
      toast({ title: 'Dropbox', description: 'Disconnected' });
      refresh();
    }
  }

  return (
    <Card className="p-4 space-y-6">
      <div>
        <h3 className="text-base font-semibold">Google Drive</h3>
        <div className="mt-2 flex items-center gap-2">
          <Button onClick={connectGoogle} disabled={!session || loading}>
            {google ? 'Re-connect' : 'Connect'}
          </Button>
          {google && (
            <Button variant="outline" onClick={disconnectGoogle} disabled={!session || loading}>
              Disconnect
            </Button>
          )}
          <span className={`text-sm ${google ? 'text-emerald-600' : 'text-muted-foreground'}`}>
            {google ? 'Connected' : 'Not connected'}
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold">Dropbox</h3>
        <div className="mt-2 flex items-center gap-2">
          <Button onClick={connectDropbox} disabled={!session || loading}>
            {dropbox ? 'Re-connect' : 'Connect'}
          </Button>
          {dropbox && (
            <Button variant="outline" onClick={disconnectDropbox} disabled={!session || loading}>
              Disconnect
            </Button>
          )}
          <span className={`text-sm ${dropbox ? 'text-emerald-600' : 'text-muted-foreground'}`}>
            {dropbox ? 'Connected' : 'Not connected'}
          </span>
        </div>
      </div>
    </Card>
  );
}
