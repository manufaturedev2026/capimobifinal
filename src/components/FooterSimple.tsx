import { Link } from "react-router-dom";
import { Home, Key, Plus, Package, Search, LogIn, LayoutDashboard, ShieldCheck, FileText } from "lucide-react";

interface FooterSimpleProps {
  theme?: {
    bg: string;
    text: string;
    textMuted: string;
    border: string;
    primary: string;
    accent?: string;
  };
}

export default function FooterSimple({ theme }: FooterSimpleProps) {
  if (!theme) {
    return (
      <footer className="border-t border-border bg-card mt-16">
        <div className="container max-w-6xl mx-auto px-4 py-10">
          <FooterContent />
        </div>
      </footer>
    );
  }

  return (
    <footer
      className="mt-16 border-t"
      style={{ background: theme.bg, borderColor: theme.border }}
    >
      <div className="container max-w-6xl mx-auto px-4 py-10">
        <FooterContent theme={theme} />
      </div>
    </footer>
  );
}

function FooterContent({ theme }: { theme?: FooterSimpleProps["theme"] }) {
  const textClass = theme ? "" : "text-foreground";
  const mutedClass = theme ? "" : "text-muted-foreground";
  const borderClass = theme ? "" : "border-border";
  const primaryClass = theme ? "" : "text-primary";
  const accentClass = theme ? "" : "text-accent";

  const textStyle = theme ? { color: theme.text } : {};
  const mutedStyle = theme ? { color: theme.textMuted } : {};
  const borderStyle = theme ? { borderColor: theme.border } : {};
  const primaryStyle = theme ? { color: theme.primary } : {};
  const accentStyle = theme ? { color: theme.accent || theme.primary } : {};

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2.5 mb-3">
            <img src="/pwa-icon-512.png" alt="Capimobi" className="w-9 h-9 rounded-xl shadow-md object-contain" />
            <span className="text-lg tracking-wide uppercase" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800 }}>
              <span style={primaryStyle} className={primaryClass}>Capi</span>
              <span style={accentStyle} className={accentClass}>mobi</span>
            </span>
          </Link>
          <p className={`text-xs leading-relaxed max-w-xs ${mutedClass}`} style={mutedStyle}>
            Crie seu próprio app de imóveis. Perfeito para corretores, imobiliárias e construtoras.
          </p>
        </div>

        <div>
          <h3 className={`font-display font-bold text-sm mb-3 ${textClass}`} style={textStyle}>Proprietários</h3>
          <nav className={`flex flex-col gap-2.5 text-sm ${mutedClass}`} style={mutedStyle}>
            <Link to="/anunciar-proprietario" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Plus size={14} style={primaryStyle} className={primaryClass} /> Criar Loja
            </Link>
          </nav>
        </div>

        <div>
          <h3 className={`font-display font-bold text-sm mb-3 ${textClass}`} style={textStyle}>Corretores</h3>
          <nav className={`flex flex-col gap-2.5 text-sm ${mutedClass}`} style={mutedStyle}>
            <Link to="/login" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Key size={14} style={accentStyle} className={accentClass} /> Criar Minha Loja
            </Link>
            <Link to="/pacotes" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Package size={14} style={accentStyle} className={accentClass} /> Planos
            </Link>
            <Link to="/painel" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <LayoutDashboard size={14} style={accentStyle} className={accentClass} /> Painel
            </Link>
            <Link to="/login" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <LogIn size={14} style={accentStyle} className={accentClass} /> Entrar
            </Link>
          </nav>
        </div>

        <div>
          <h3 className={`font-display font-bold text-sm mb-3 ${textClass}`} style={textStyle}>Legal</h3>
          <nav className={`flex flex-col gap-2.5 text-sm ${mutedClass}`} style={mutedStyle}>
            <Link to="/privacidade" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <ShieldCheck size={14} style={mutedStyle} className={mutedClass} /> Privacidade
            </Link>
            <Link to="/termos" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <FileText size={14} style={mutedStyle} className={mutedClass} /> Termos
            </Link>
          </nav>
        </div>
      </div>

      <div className={`border-t mt-8 pt-6 flex flex-col items-center gap-2 text-center ${borderClass}`} style={borderStyle}>
        <p className={`text-xs ${mutedClass}`} style={mutedStyle}>
          © {new Date().getFullYear()} Capimobi · Brasil
        </p>
      </div>
    </>
  );
}
