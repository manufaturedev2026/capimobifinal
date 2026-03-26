import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import Header from "@/components/Header";
import FooterSimple from "@/components/FooterSimple";
import InstallPWA from "@/components/InstallPWA";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "@/pages/Index";
import PropertiesPage from "@/pages/PropertiesPage";

import CityPropertiesPage from "@/pages/CityPropertiesPage";

import CompanyProfile from "@/pages/CompanyProfile";
import ProductDetail from "@/pages/ProductDetail";
import CreateListing from "@/pages/CreateListing";
import SearchPage from "@/pages/SearchPage";
import AuthPage from "@/pages/AuthPage";
import SellerDashboard from "@/pages/SellerDashboard";
import SellerItemForm from "@/pages/SellerItemForm";
import SellerProfile from "@/pages/SellerProfile";
import PackagesPage from "@/pages/PackagesPage";
import AdminPanel from "@/pages/AdminPanel";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = () => {
  const location = useLocation();
  const isStorePage = location.pathname.includes("/empresa/");

  return (
    <div className="min-h-screen flex flex-col">
      {!isStorePage && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/imoveis" element={<PropertiesPage />} />
          <Route path="/imoveis/:cidade" element={<PropertiesPage />} />
          <Route path="/imoveis/empresa/:id" element={<CompanyProfile />} />
          <Route path="/imoveis/produto/:productId" element={<ProductDetail />} />
          <Route path="/veiculos" element={<VehiclesPage />} />
          <Route path="/veiculos/:cidade" element={<VehiclesPage />} />
          <Route path="/veiculos/empresa/:id" element={<CompanyProfile />} />
          <Route path="/veiculos/produto/:productId" element={<ProductDetail />} />
          <Route path="/:cidade/imoveis" element={<CityPropertiesPage />} />
          
          <Route path="/anunciar" element={<CreateListing />} />
          <Route path="/buscar" element={<SearchPage />} />
          <Route path="/entrar" element={<AuthPage />} />
          <Route path="/painel" element={<SellerDashboard />} />
          <Route path="/painel/novo" element={<SellerItemForm />} />
          <Route path="/painel/editar/:id" element={<SellerItemForm />} />
          <Route path="/painel/perfil" element={<SellerProfile />} />
          <Route path="/pacotes" element={<PackagesPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/privacidade" element={<PrivacyPage />} />
          <Route path="/termos" element={<TermsPage />} />
          <Route path="/:cidade" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isStorePage && <FooterSimple />}
      <InstallPWA />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AppLayout />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
