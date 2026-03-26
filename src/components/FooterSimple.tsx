import { Link } from "react-router-dom";

export default function FooterSimple() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-3">
              <img src="/pwa-512x512.png" alt="Melhor Busca" className="w-9 h-9 rounded-xl shadow-md object-contain" />
              <span className="font-display font-bold text-lg text-foreground">
                Melhor<span className="text-primary">Busca</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Marketplace de imóveis e veículos no Espírito Santo. Encontre casas, apartamentos, carros e motos com contato direto via WhatsApp.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-display font-bold text-sm text-foreground mb-3">Navegação</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
              <Link to="/imoveis" className="hover:text-foreground transition-colors">Imóveis</Link>
              
              <Link to="/buscar" className="hover:text-foreground transition-colors">Buscar</Link>
              <Link to="/anunciar" className="hover:text-foreground transition-colors">Anunciar</Link>
            </nav>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="font-display font-bold text-sm text-foreground mb-3">Para Anunciantes</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/pacotes" className="hover:text-foreground transition-colors">Pacotes</Link>
              <Link to="/entrar" className="hover:text-foreground transition-colors">Entrar / Cadastrar</Link>
              <Link to="/painel" className="hover:text-foreground transition-colors">Painel do Vendedor</Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display font-bold text-sm text-foreground mb-3">Legal</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
              <Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MelhorBusca. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Colatina, ES — Brasil
          </p>
        </div>
      </div>
    </footer>
  );
}
