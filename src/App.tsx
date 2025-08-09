import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Contacts from "./pages/Contacts";
import { HelmetProvider } from "react-helmet-async";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Research from "./pages/Research";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <header className="h-12 flex items-center border-b">
              <SidebarTrigger className="ml-2" />
            </header>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <main className="flex-1 min-h-0">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/research" element={<Research />} />
                  <Route path="/settings" element={<Settings />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </SidebarProvider>
        </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
