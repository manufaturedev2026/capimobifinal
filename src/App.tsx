import { Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import BannedScreen from "@/components/BannedScreen";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { WhatsAppTeamPickerProvider } from "@/components/WhatsAppTeamPicker";
import { CompareProvider } from "@/hooks/useCompare";
import CompareBar from "@/components/CompareBar";
import InstallPWA from "@/components/InstallPWA";
import ScrollToTop from "@/components/ScrollToTop";
import { CustomDomainRedirect } from "@/components/CustomDomainRedirect";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import { lazyPage } from "@/lib/chunkRecovery";

const CompanyProfile = lazyPage(() => import("@/pages/CompanyProfile"));
const ProductDetail = lazyPage(() => import("@/pages/ProductDetail"));
const CreateListing = lazyPage(() => import("@/pages/CreateListing"));
const LoginPage = lazyPage(() => import("@/pages/LoginPage"));

const AuthPage = lazyPage(() => import("@/pages/AuthPage"));
const SellerDashboard = lazyPage(() => import("@/pages/SellerDashboard"));
const SellerItemForm = lazyPage(() => import("@/pages/SellerItemForm"));
const SellerProfile = lazyPage(() => import("@/pages/SellerProfile"));
const PackagesPage = lazyPage(() => import("@/pages/PackagesPage"));
const AdminPanel = lazyPage(() => import("@/pages/AdminPanel"));
const PrivacyPage = lazyPage(() => import("@/pages/PrivacyPage"));
const TermsPage = lazyPage(() => import("@/pages/TermsPage"));
const NotFound = lazyPage(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const RouteLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
  </div>
);

// No fixed BROKER_ID — the logged-in user IS the broker
const HomeRedirect = () => {
  const { user, profile, loading } = useAuth();
  const [target, setTarget] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    // Logged-in user → their store
    if (user) {
      const identifier = profile?.slug || profile?.id;
      setTarget(identifier ? `/empresa/${identifier}` : "/painel");
      setChecking(false);
      return;
    }

    // Not logged in → check if any profile exists
    supabase
      .from("profiles")
      .select("id, slug")
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const p = data[0];
          setTarget(`/empresa/${p.slug || p.id}`);
        } else {
          setTarget("/login");
        }
        setChecking(false);
      });
  }, [user, profile, loading]);

  if (loading || checking) return null;
  return <Navigate to={target!} replace />;
};

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppLayout = () => {
  const { banInfo } = useAuth();
  const location = useLocation();
  const isProtectedRoute = ["/painel", "/admin", "/pacotes"].some(
    (r) => location.pathname.startsWith(r)
  );

  if (isProtectedRoute && banInfo?.is_banned) {
    return <BannedScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <RouteErrorBoundary>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/empresa/:id" element={<CompanyProfile />} />
              <Route path="/imoveis/produto/:productId" element={<ProductDetail />} />
              <Route path="/anunciar" element={<CreateListing />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/entrar" element={<Navigate to="/login" replace />} />
              <Route path="/painel" element={<RequireAuth><SellerDashboard /></RequireAuth>} />
              <Route path="/painel/novo" element={<RequireAuth><SellerItemForm /></RequireAuth>} />
              <Route path="/painel/editar/:id" element={<RequireAuth><SellerItemForm /></RequireAuth>} />
              <Route path="/painel/perfil" element={<RequireAuth><SellerProfile /></RequireAuth>} />
              <Route path="/pacotes" element={<RequireAuth><PackagesPage /></RequireAuth>} />
              <Route path="/admin" element={<RequireAuth><AdminPanel /></RequireAuth>} />
              <Route path="/privacidade" element={<PrivacyPage />} />
              <Route path="/termos" element={<TermsPage />} />
              <Route path="*" element={<HomeRedirect />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </main>
      <InstallPWA />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <WhatsAppTeamPickerProvider>
            <CompareProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <CustomDomainRedirect />
                  <AppLayout />
                  <CompareBar />
                </BrowserRouter>
              </TooltipProvider>
            </CompareProvider>
          </WhatsAppTeamPickerProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
