import { Link } from "react-router-dom";
import { Home, Building2, Search, Megaphone, PackageCheck, LogIn, LayoutDashboard, ShieldCheck, FileText, Heart } from "lucide-react";

export default function FooterSimple() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand - full width on mobile */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-3">
              <img src="/pwa-512x512.png" alt="ES Corretores" className="w-9 h-9 rounded-xl shadow-md object-contain" />
              <span className="font-display font-bold text-lg">
                <span className="text-primary">E</span><span className="text-accent">S</span><span className="text-foreground">Corretores</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Marketplace de imóveis no Espírito Santo. Encontre casas, apartamentos, terrenos e mais com contato direto via WhatsApp.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-display font-bold text-sm text-foreground mb-3">Navegação</h3>
            <nav className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <Link to="/" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Home size={14} className="text-primary" /> Início
              </Link>
              <Link to="/imoveis" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Building2 size={14} className="text-primary" /> Imóveis
              </Link>
              <Link to="/buscar" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Search size={14} className="text-primary" /> Buscar
              </Link>
              <Link to="/favoritos" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Heart size={14} className="text-primary" /> Favoritos
              </Link>
              <Link to="/anunciar" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Megaphone size={14} className="text-primary" /> Anunciar
              </Link>
            </nav>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="font-display font-bold text-sm text-foreground mb-3">Para Anunciantes</h3>
            <nav className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <Link to="/pacotes" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <PackageCheck size={14} className="text-accent" /> Pacotes
              </Link>
              <Link to="/entrar" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <LogIn size={14} className="text-accent" /> Entrar / Cadastrar
              </Link>
              <Link to="/painel" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <LayoutDashboard size={14} className="text-accent" /> Painel
              </Link>
            </nav>

            <h3 className="font-display font-bold text-sm text-foreground mb-3 mt-6">Legal</h3>
            <nav className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <Link to="/privacidade" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <ShieldCheck size={14} className="text-muted-foreground" /> Privacidade
              </Link>
              <Link to="/termos" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <FileText size={14} className="text-muted-foreground" /> Termos
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col items-center gap-2 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ES Corretores — Colatina, ES · Brasil
          </p>
        </div>
      </div>
    </footer>
  );
}
