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

import ScrollToTop from "@/components/ScrollToTop";
import { CustomDomainRedirect } from "@/components/CustomDomainRedirect";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import SplashScreen from "@/components/SplashScreen";
import { lazyPage } from "@/lib/chunkRecovery";

const MarketplaceHome = lazyPage(() => import("@/pages/MarketplaceHome"));

const CompanyProfile = lazyPage(() => import("@/pages/CompanyProfile"));
const ProductDetail = lazyPage(() => import("@/pages/ProductDetail"));
const CreateListing = lazyPage(() => import("@/pages/CreateListing"));
const LoginPage = lazyPage(() => import("@/pages/LoginPage"));

const AuthPage = lazyPage(() => import("@/pages/AuthPage"));
const SellerDashboard = lazyPage(() => import("@/pages/SellerDashboard"));
const SellerItemForm = lazyPage(() => import("@/pages/SellerItemForm"));
const SellerProfile = lazyPage(() => import("@/pages/SellerProfile"));
const SellerCustomization = lazyPage(() => import("@/pages/SellerCustomization"));
const PackagesPage = lazyPage(() => import("@/pages/PackagesPage"));
const AdminPanel = lazyPage(() => import("@/pages/AdminPanel"));
const PrivacyPage = lazyPage(() => import("@/pages/PrivacyPage"));
const TermsPage = lazyPage(() => import("@/pages/TermsPage"));
const NotFound = lazyPage(() => import("@/pages/NotFound"));
const CapturePropertyPage = lazyPage(() => import("@/pages/CapturePropertyPage"));
const CapturePropertyChatPage = lazyPage(() => import("@/pages/CapturePropertyChatPage"));
const VenderPage = lazyPage(() => import("@/pages/VenderPage"));
const SearchPage = lazyPage(() => import("@/pages/SearchPage"));
const SeoLandingPage = lazyPage(() => import("@/pages/SeoLandingPage"));
const SeoBrokersPage = lazyPage(() => import("@/pages/SeoBrokersPage"));
const InvitePage = lazyPage(() => import("@/pages/InvitePage"));
const ResetPasswordPage = lazyPage(() => import("@/pages/ResetPasswordPage"));

const queryClient = new QueryClient();

const RouteLoader = () => (
  <div
    className="fixed inset-0 z-[9998] flex items-center justify-center"
    style={{ backgroundColor: "#FFFFFF" }}
  >
    <div className="relative flex items-center justify-center">
      <div className="absolute h-52 w-52 rounded-full border-4 border-transparent border-t-primary border-r-primary/40 animate-spin" />
      <img
        src="/pwa-icon-512.png"
        alt="Capimobi"
        className="h-36 w-36 object-contain animate-pulse"
      />
    </div>
  </div>
);

// No fixed BROKER_ID — the logged-in user IS the broker
const HomeRedirect = () => {
  const { user, profile, loading } = useAuth();
  const [target, setTarget] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [homepageMode, setHomepageMode] = useState<string | null>(null);

  useEffect(() => {
    const fetchMode = async () => {
      try {
        const { data } = await supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "homepage_mode")
          .maybeSingle();
        setHomepageMode(data?.value || "single");
      } catch {
        setHomepageMode("single");
      }
    };
    fetchMode();
  }, []);

  useEffect(() => {
    if (loading || homepageMode === null) return;

    // Marketplace mode → show marketplace page
    if (homepageMode === "marketplace") {
      setTarget("__marketplace__");
      setChecking(false);
      return;
    }

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
  }, [user, profile, loading, homepageMode]);

  if (loading || checking) return <RouteLoader />;
  if (target === "__marketplace__") return <MarketplaceHome />;
  return <Navigate to={target!} replace />;
};

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <RouteLoader />;
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
              <Route path="/imoveis/produto/:productId/loja/:lojaSlug" element={<ProductDetail />} />
              <Route path="/imovel/:productId" element={<ProductDetail />} />
              <Route path="/imovel/:productId/loja/:lojaSlug" element={<ProductDetail />} />
              <Route path="/buscar" element={<SearchPage />} />
              {/* SEO landing pages */}
              <Route path="/imoveis" element={<SeoLandingPage />} />
              <Route path="/imoveis/:cidade" element={<SeoLandingPage />} />
              <Route path="/imoveis/:cidade/:categoria" element={<SeoLandingPage />} />
              <Route path="/imoveis/:cidade/bairro/:bairro" element={<SeoLandingPage />} />
              <Route path="/imoveis/categoria/:categoria" element={<SeoLandingPage />} />
              {/* SEO broker pages */}
              <Route path="/corretores" element={<SeoBrokersPage />} />
              <Route path="/corretores/:estado" element={<SeoBrokersPage />} />
              <Route path="/corretores/:estado/:cidade" element={<SeoBrokersPage />} />
              <Route path="/convite" element={<InvitePage />} />
              <Route path="/anunciar" element={<VenderPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/entrar" element={<Navigate to="/login" replace />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/painel" element={<RequireAuth><SellerDashboard /></RequireAuth>} />
              <Route path="/painel/novo" element={<RequireAuth><SellerItemForm /></RequireAuth>} />
              <Route path="/painel/editar/:id" element={<RequireAuth><SellerItemForm /></RequireAuth>} />
              <Route path="/painel/perfil" element={<RequireAuth><SellerProfile /></RequireAuth>} />
              <Route path="/painel/personalizacao" element={<RequireAuth><SellerCustomization /></RequireAuth>} />
              <Route path="/pacotes" element={<RequireAuth><PackagesPage /></RequireAuth>} />
              <Route path="/admin" element={<RequireAuth><AdminPanel /></RequireAuth>} />
              <Route path="/criar-anuncio" element={<RequireAuth><CreateListing /></RequireAuth>} />
              <Route path="/vender" element={<Navigate to="/anunciar" replace />} />
              <Route path="/captar-imovel/:slug" element={<CapturePropertyPage />} />
              <Route path="/captar-imovel/:slug/chat" element={<CapturePropertyChatPage />} />
              <Route path="/privacidade" element={<PrivacyPage />} />
              <Route path="/termos" element={<TermsPage />} />
              <Route path="*" element={<HomeRedirect />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </main>
      
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
                <SplashScreen />
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
