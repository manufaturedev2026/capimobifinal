import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, LayoutDashboard, LogIn, Megaphone, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { MarketplaceTheme } from "@/lib/marketplaceThemes";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface Props {
  theme: MarketplaceTheme;
  user: { id: string } | null | undefined;
  /** Hide "Imóveis" scroll button when not on homepage */
  showImoveisScroll?: boolean;
}

export default function MarketplaceNavbar({ theme, user, showImoveisScroll = true }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { primary: PRIMARY, darkBase: DARK_BASE, cardBg: CARD_BG, border: BORDER, text: TEXT, textMuted: TEXT_MUTED, promoAccent: ACCENT } = theme;
  const { site_name, site_logo_url } = useSiteSettings();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
      style={{ background: `${DARK_BASE}ee` }}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="font-display font-bold text-lg flex items-center gap-2" style={{ color: TEXT }}>
          {site_logo_url ? (
            <img loading="lazy" decoding="async" src={site_logo_url} alt={site_name} className="h-8 max-w-[140px] object-contain" />
          ) : (
            <span><span style={{ color: PRIMARY }}>Cap</span><span style={{ color: '#ffffff' }}>i</span><span style={{ color: ACCENT || '#D4708F' }}>mobi</span></span>
          )}
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/" className="px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-white/10" style={{ color: TEXT }}>
            Início
          </Link>
          {showImoveisScroll && (
            <button
              onClick={() => { document.getElementById("marketplace-grid")?.scrollIntoView({ behavior: "smooth" }); }}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-white/10"
              style={{ color: TEXT_MUTED }}
            >
              Imóveis
            </button>
          )}
          <Link to="/anunciar" className="px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-white/10" style={{ color: TEXT_MUTED }}>
            Anunciar
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <Link
              to="/painel"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
              style={{ background: PRIMARY, boxShadow: `0 4px 16px ${PRIMARY}40` }}
            >
              <LayoutDashboard size={14} /> Painel
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-white/10"
                style={{ color: TEXT }}
              >
                <LogIn size={14} /> Entrar
              </Link>
              <Link
                to="/anunciar"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-white transition-all hover:scale-105"
                style={{ background: PRIMARY, boxShadow: `0 4px 16px ${PRIMARY}40` }}
              >
                <Megaphone size={14} /> Anunciar
              </Link>
            </>
          )}

          {/* Mobile menu */}
          <div className="relative md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: TEXT }}
            >
              <Menu size={20} />
            </button>
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-12 w-48 rounded-xl overflow-hidden shadow-2xl py-1"
                  style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
                >
                  <Link
                    to="/anunciar"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors hover:bg-white/5"
                    style={{ color: TEXT }}
                  >
                    <Megaphone size={14} style={{ color: PRIMARY }} /> Anunciar Imóvel
                  </Link>
                  {user ? (
                    <Link
                      to="/painel"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors hover:bg-white/5"
                      style={{ color: TEXT }}
                    >
                      <LayoutDashboard size={14} style={{ color: PRIMARY }} /> Meu Painel
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors hover:bg-white/5"
                      style={{ color: TEXT }}
                    >
                      <LogIn size={14} style={{ color: PRIMARY }} /> Entrar / Cadastrar
                    </Link>
                  )}
                  {showImoveisScroll && (
                    <button
                      onClick={() => { setMobileMenuOpen(false); document.getElementById("marketplace-grid")?.scrollIntoView({ behavior: "smooth" }); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors hover:bg-white/5"
                      style={{ color: TEXT_MUTED }}
                    >
                      <Search size={14} /> Ver Imóveis
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
