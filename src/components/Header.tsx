import { Home, Search, Menu, X, LogIn, LayoutDashboard, Plus, Key, Package, FolderOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const { site_name } = useSiteSettings();

  const navLinks = [
    { to: "/", label: "Início", icon: Home },
    { to: "/pacotes", label: "Planos", icon: Package },
  ];

  const userLinks = user
    ? [
        { to: "/painel", label: "Painel", icon: LayoutDashboard },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border">
      <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/pwa-icon-512.png" alt={site_name} className="w-9 h-9 rounded-xl shadow-md object-contain" />
          <span className="text-xl tracking-wide uppercase" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800 }}>
            <span className="text-primary">Cap</span><span className="text-foreground">i</span><span className="text-accent">mobi</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                location.pathname === link.to
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/buscar"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
          >
            <Search size={16} />
            Buscar
          </Link>
          {user ? (
            <Link
              to="/painel"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md"
            >
              <LayoutDashboard size={16} />
              Painel
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md"
            >
              <LogIn size={16} />
              Entrar
            </Link>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1 animate-fade-in">
          {[...navLinks, ...userLinks].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {link.icon && <link.icon size={18} />}
              {link.label}
            </Link>
          ))}
          <Link
            to="/buscar"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <Search size={18} />
            Buscar
          </Link>
          {!user && (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground"
            >
              <LogIn size={18} />
              Entrar / Cadastrar
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
