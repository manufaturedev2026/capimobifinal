import { Link } from "react-router-dom";
import { Home, Key, Plus, Package, Search, LogIn, LayoutDashboard, ShieldCheck, FileText } from "lucide-react";

export default function FooterSimple() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-3">
              <img src="/pwa-icon-512.png" alt="Brokers App" className="w-9 h-9 rounded-xl shadow-md object-contain" />
              <span className="text-lg tracking-wide uppercase" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800 }}>
                <span className="text-primary">Brokers</span><span className="text-accent">App</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Crie seu próprio app de imóveis. Perfeito para corretores, imobiliárias e construtoras.
            </p>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm text-foreground mb-3">Proprietários</h3>
            <nav className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <Link to="/anunciar-proprietario" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Plus size={14} className="text-primary" /> Criar Loja
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm text-foreground mb-3">Corretores</h3>
            <nav className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <Link to="/login" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Key size={14} className="text-accent" /> Criar Minha Loja
              </Link>
              <Link to="/pacotes" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Package size={14} className="text-accent" /> Planos
              </Link>
              <Link to="/painel" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <LayoutDashboard size={14} className="text-accent" /> Painel
              </Link>
              <Link to="/login" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <LogIn size={14} className="text-accent" /> Entrar
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm text-foreground mb-3">Legal</h3>
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
            © {new Date().getFullYear()} Brokers App · Brasil
          </p>
        </div>
      </div>
    </footer>
  );
}
