import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Calls from "./pages/Calls";
import NotFound from "./pages/NotFound";
import Contacts from "./pages/Contacts";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "@/store/i18n";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Research from "./pages/Research";
import Settings from "./pages/Settings";
import AuthPage from "./pages/Auth";
import RequireAuth from "@/components/auth/RequireAuth";
import { AuthProvider, useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";


const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
      </QueryClientProvider>
    </I18nProvider>
  </HelmetProvider>
);

export default App;

