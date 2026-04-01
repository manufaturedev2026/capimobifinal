import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StoreInstallButtonProps {
  variant?: "default" | "hero-light" | "hero-dark";
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Detects if the app is already installed as a PWA (standalone mode).
 */
function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function StoreInstallButton({ variant = "default" }: StoreInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(true); // assume installed until we check
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setInstalled(isAppInstalled());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Don't show if already installed or user dismissed
  if (installed || dismissed) return null;

  // On iOS we can't use beforeinstallprompt — show instructions
  const ios = isIOS();
  const canPrompt = !!deferredPrompt;

  // If neither iOS nor Android prompt available AND not desktop-capable, hide
  if (!ios && !canPrompt) return null;

  const handleClick = async () => {
    if (canPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
      }
    } else if (ios) {
      setShowIOSGuide(true);
    }
  };

  const btnClass = variant === "hero-light"
    ? "flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 text-white text-xs font-medium active:scale-95 transition-transform"
    : variant === "hero-dark"
    ? "flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md text-white text-xs font-medium active:scale-95 transition-transform"
    : "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors";

  return (
    <>
      <button onClick={handleClick} className={btnClass}>
        <Download size={variant === "default" ? 14 : 13} />
        Instalar APP
      </button>

      {/* iOS Guide Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-card border border-border p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone size={20} className="text-primary" />
                  <h3 className="font-display font-bold text-foreground">Instalar no iPhone</h3>
                </div>
                <button onClick={() => setShowIOSGuide(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <p className="text-sm text-foreground">
                    Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra do Safari
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <p className="text-sm text-foreground">
                    Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <p className="text-sm text-foreground">
                    Toque em <strong>"Adicionar"</strong> e pronto! O app aparecerá na sua tela inicial
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm"
              >
                Entendi!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
