import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import BannedScreen from "@/components/BannedScreen";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
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

const AppLayout = () => {
  const location = useLocation();
  const { banInfo } = useAuth();
  const isStorePage = location.pathname.includes("/empresa/");
  const isProtectedRoute = ["/painel", "/admin", "/pacotes"].some(
    (r) => location.pathname.startsWith(r)
  );

  if (isProtectedRoute && banInfo?.is_banned) {
    return <BannedScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!isStorePage && <Header />}
      <main className="flex-1">
        <RouteErrorBoundary>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/imoveis" element={<PropertiesPage />} />
              <Route path="/imoveis/:cidade" element={<PropertiesPage />} />
              <Route path="/empresa/:id" element={<CompanyProfile />} />
              <Route path="/imoveis/empresa/:id" element={<CompanyProfile />} />
              <Route path="/imoveis/produto/:productId" element={<ProductDetail />} />
              <Route path="/imoveis/:cidade/bairro/:bairro" element={<NeighborhoodPage />} />
              <Route path="/anunciar" element={<CreateListing />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/buscar" element={<SearchPage />} />
              <Route path="/entrar" element={<AuthPage />} />
              <Route path="/painel" element={<SellerDashboard />} />
              <Route path="/painel/novo" element={<SellerItemForm />} />
              <Route path="/painel/editar/:id" element={<SellerItemForm />} />
              <Route path="/painel/perfil" element={<SellerProfile />} />
              <Route path="/pacotes" element={<PackagesPage />} />
              <Route path="/favoritos" element={<FavoritesPage />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/privacidade" element={<PrivacyPage />} />
              <Route path="/termos" element={<TermsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </main>
      {!isStorePage && <FooterSimple />}
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
