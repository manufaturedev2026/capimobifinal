import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, Sparkles, X, Zap, MessageCircle, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { detectIOS, isStandaloneDisplayMode } from "@/lib/pwaInstall";

interface WelcomePushPopupProps {
  sellerId: string;
  userId: string;
  userName?: string | null;
}

const STORAGE_KEY_PREFIX = "capimobi_welcome_push_seen_";

export default function WelcomePushPopup({ sellerId, userId, userName }: WelcomePushPopupProps) {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const { isSubscribed, isSupported, subscribe, loading, unsupportedReason } = usePushSubscription(sellerId);

  const isIOSBrowser = detectIOS() && !isStandaloneDisplayMode();
  const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;

  useEffect(() => {
    if (!userId || !sellerId) return;
    const seen = localStorage.getItem(storageKey);
    if (seen) return;
    if (isSubscribed) {
      localStorage.setItem(storageKey, "subscribed");
      return;
    }
    // Open after a short delay so the dashboard renders first
    const t = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(t);
  }, [userId, sellerId, isSubscribed, storageKey]);

  const close = () => {
    localStorage.setItem(storageKey, "dismissed");
    setOpen(false);
  };

  const handleActivate = async () => {
    const ok = await subscribe();
    if (ok) {
      setSuccess(true);
      localStorage.setItem(storageKey, "subscribed");
      window.setTimeout(() => setOpen(false), 1800);
    }
  };

  const firstName = (userName || "").trim().split(" ")[0] || "Corretor(a)";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 240 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            {/* Close */}
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-colors hover:bg-background"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>

            {/* HERO BANNER ÉPICO */}
            <div className="relative h-44 overflow-hidden">
              {/* Gradient background */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 50%, hsl(var(--accent, var(--primary))) 100%)",
                }}
              />
              {/* Shimmer */}
              <motion.div
                className="absolute inset-0 opacity-40"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 35%, hsl(var(--primary-foreground) / 0.35) 50%, transparent 65%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
              />
              {/* Floating particles */}
              {[...Array(8)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute h-1.5 w-1.5 rounded-full bg-primary-foreground/70"
                  style={{ left: `${10 + i * 11}%`, top: `${20 + (i % 3) * 25}%` }}
                  animate={{ y: [0, -14, 0], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2 + (i % 3) * 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}

              {/* Bell icon with pulses */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <motion.span
                    className="absolute inset-0 rounded-full bg-primary-foreground/30"
                    animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.span
                    className="absolute inset-0 rounded-full bg-primary-foreground/20"
                    animate={{ scale: [1, 1.7, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                  />
                  <motion.div
                    animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4 }}
                    className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary-foreground shadow-2xl"
                  >
                    <BellRing className="h-10 w-10" style={{ color: "hsl(var(--primary))" }} />
                  </motion.div>
                </div>
              </div>

              {/* Sparkle badges */}
              <motion.div
                animate={{ y: [0, -4, 0], rotate: [0, 8, 0] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="absolute left-6 top-6"
              >
                <Sparkles className="h-5 w-5 text-primary-foreground/90" />
              </motion.div>
              <motion.div
                animate={{ y: [0, -6, 0], rotate: [0, -10, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, delay: 0.5 }}
                className="absolute right-12 top-10"
              >
                <Zap className="h-4 w-4 text-primary-foreground/90" />
              </motion.div>
            </div>

            {/* CONTENT */}
            <div className="p-6 space-y-5">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4 space-y-3"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">Tudo pronto, {firstName}! 🎉</h3>
                  <p className="text-sm text-muted-foreground">
                    Você receberá notificações em tempo real de novos leads, parcerias e atualizações.
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="text-center space-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      <Sparkles size={12} /> Bem-vindo(a) ao seu painel
                    </span>
                    <h2 className="font-display text-2xl font-bold leading-tight text-foreground">
                      Olá, <span className="text-primary">{firstName}</span>! 👋
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Ative as <strong className="text-foreground">notificações</strong> para não perder nenhuma oportunidade do seu painel.
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2.5">
                    <Benefit
                      icon={MessageCircle}
                      title="Novos leads instantâneos"
                      desc="Receba avisos no momento que um cliente entrar em contato."
                    />
                    <Benefit
                      icon={TrendingUp}
                      title="Movimentações do CRM"
                      desc="Atualizações de funil, parcerias e captação em tempo real."
                    />
                    <Benefit
                      icon={Zap}
                      title="Aprovações de ADS"
                      desc="Saiba na hora quando suas campanhas mudarem de status."
                    />
                  </div>

                  {/* CTA */}
                  {!isSupported || isIOSBrowser ? (
                    <div className="rounded-xl border border-border bg-secondary/40 p-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        {isIOSBrowser
                          ? "📱 No iPhone, instale o app na Tela Inicial para ativar as notificações."
                          : unsupportedReason || "Seu navegador não suporta notificações."}
                      </p>
                      <button
                        type="button"
                        onClick={close}
                        className="mt-3 text-xs font-bold text-primary hover:underline"
                      >
                        Entendi, continuar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleActivate}
                        disabled={loading}
                        className="group relative w-full overflow-hidden rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all active:scale-[0.98] disabled:opacity-70"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Ativando...
                            </>
                          ) : (
                            <>
                              <Bell className="h-4 w-4" />
                              Ativar Notificações Agora
                            </>
                          )}
                        </span>
                        <motion.span
                          className="absolute inset-0 opacity-0 group-hover:opacity-100"
                          style={{
                            background:
                              "linear-gradient(110deg, transparent 30%, hsl(var(--primary-foreground) / 0.25) 50%, transparent 70%)",
                          }}
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={close}
                        className="w-full rounded-xl py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Talvez mais tarde
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Benefit({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-secondary/40 p-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground leading-tight">{title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{desc}</p>
      </div>
    </div>
  );
}
