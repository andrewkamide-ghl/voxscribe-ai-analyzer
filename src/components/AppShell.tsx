import { Routes, Route, useNavigate, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "@/pages/Dashboard";
import Calls from "@/pages/Calls";
import Index from "@/pages/Index";
import Contacts from "@/pages/Contacts";
import Research from "@/pages/Research";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import AuthPage from "@/pages/Auth";
import RequireAuth from "@/components/auth/RequireAuth";
import { AuthProvider, useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

function ShellInner() {
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <header className="h-12 flex items-center border-b px-2 gap-2 justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
        </div>
        <div className="pr-2">
          {!session ? (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Login</Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                toast.success("Logged out");
                navigate("/auth", { replace: true });
              }}
            >
              Logout
            </Button>
          )}
        </div>
      </header>
      <div className="flex min-h-screen w-full">
        {session && <AppSidebar />}
        <main className="flex-1 min-h-0">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />

            <Route element={<RequireAuth />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/calls" element={<Calls />} />
              <Route path="/calls/live" element={<Index />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/research" element={<Research />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function AppShell() {
  return (
    <AuthProvider>
      <ShellInner />
    </AuthProvider>
  );
}
