import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, Package, BarChart3, MessageCircle, Eye, Palette, Megaphone, Rocket } from "lucide-react";

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  icon: React.ElementType;
  position?: "top" | "bottom" | "left" | "right";
}

const DEFAULT_STEPS: TourStep[] = [
  {
    targetId: "tour-overview",
    title: "Bem-vindo ao seu Painel! 🎉",
    description: "Aqui você tem uma visão geral de todos os seus imóveis, estatísticas e atividades. Vamos fazer um tour rápido?",
    icon: Rocket,
  },
  {
    targetId: "tour-new-listing",
    title: "Crie seu primeiro anúncio",
    description: "Clique aqui para adicionar um novo imóvel ao seu catálogo. Quanto mais detalhes, melhor o desempenho!",
    icon: Package,
    position: "right",
  },
  {
    targetId: "tour-stats",
    title: "Acompanhe suas Estatísticas",
    description: "Monitore visualizações, cliques no WhatsApp e o desempenho dos seus anúncios em tempo real.",
    icon: BarChart3,
    position: "right",
  },
  {
    targetId: "tour-crm",
    title: "Gerencie seus Leads (CRM)",
    description: "Organize contatos, acompanhe negociações e nunca perca uma oportunidade de venda.",
    icon: MessageCircle,
    position: "right",
  },
  {
    targetId: "tour-store",
    title: "Veja sua Loja Online",
    description: "Sua vitrine digital profissional! Compartilhe o link com clientes e nas redes sociais.",
    icon: Eye,
    position: "right",
  },
  {
    targetId: "tour-customization",
    title: "Personalize sua Loja",
    description: "Escolha temas, layouts e cores para deixar sua loja com a sua cara. Destaque-se da concorrência!",
    icon: Palette,
    position: "right",
  },
  {
    targetId: "tour-ads",
    title: "Impulsione com ADS",
    description: "Solicite campanhas de anúncios para alcançar mais clientes e acelerar suas vendas.",
    icon: Megaphone,
    position: "right",
  },
];

const STORAGE_KEY = "capimobi_onboarding_done";

interface OnboardingTourProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export default function OnboardingTour({ onComplete, forceShow }: OnboardingTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forceShow) {
      setIsActive(true);
      return;
    }
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setIsActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const positionTooltip = useCallback(() => {
    const step = DEFAULT_STEPS[currentStep];
    const el = document.getElementById(step.targetId);
    if (!el) {
      setTooltipPos({ top: window.innerHeight / 2 - 120, left: window.innerWidth / 2 - 180 });
      return;
    }
    const rect = el.getBoundingClientRect();
    const pos = step.position || "bottom";
    let top = 0;
    let left = 0;

    el.style.position = "relative";
    el.style.zIndex = "10001";
    el.style.borderRadius = "12px";
    el.style.boxShadow = "0 0 0 4px hsl(197 100% 47% / 0.5), 0 0 30px hsl(197 100% 47% / 0.2)";
    el.style.transition = "box-shadow 0.3s ease";

    const tooltipW = 360;
    const tooltipH = 200;
    const gap = 16;

    switch (pos) {
      case "top":
        top = rect.top - tooltipH - gap;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.left - tooltipW - gap;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.right + gap;
        break;
    }

    left = Math.max(16, Math.min(left, window.innerWidth - tooltipW - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipH - 16));

    setTooltipPos({ top, left });
  }, [currentStep]);

  useEffect(() => {
    if (!isActive) return;
    positionTooltip();

    const handleResize = () => positionTooltip();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      DEFAULT_STEPS.forEach((s) => {
        const el = document.getElementById(s.targetId);
        if (el) {
          el.style.zIndex = "";
          el.style.boxShadow = "";
          el.style.position = "";
        }
      });
    };
  }, [isActive, currentStep, positionTooltip]);

  const cleanupStep = () => {
    const step = DEFAULT_STEPS[currentStep];
    const el = document.getElementById(step.targetId);
    if (el) {
      el.style.zIndex = "";
      el.style.boxShadow = "";
      el.style.position = "";
    }
  };

  const goNext = () => {
    cleanupStep();
    if (currentStep < DEFAULT_STEPS.length - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      finish();
    }
  };

  const goPrev = () => {
    cleanupStep();
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  };

  const finish = () => {
    cleanupStep();
    localStorage.setItem(STORAGE_KEY, "true");
    setIsActive(false);
    onComplete?.();
  };

  if (!isActive) return null;

  const step = DEFAULT_STEPS[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / DEFAULT_STEPS.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000]"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
        onClick={(e) => {
          if (e.target === overlayRef.current) finish();
        }}
      >
        {tooltipPos && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed w-[360px] max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            style={{ top: tooltipPos.top, left: tooltipPos.left, zIndex: 10002 }}
          >
            <div className="h-1 bg-muted">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-foreground">{step.title}</h3>
                    <p className="text-[10px] text-muted-foreground">Passo {currentStep + 1} de {DEFAULT_STEPS.length}</p>
                  </div>
                </div>
                <button onClick={finish} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{step.description}</p>

              <div className="flex items-center justify-between">
                <button
                  onClick={finish}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pular tour
                </button>
                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={goPrev}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                    >
                      <ChevronLeft size={14} /> Voltar
                    </button>
                  )}
                  <button
                    onClick={goNext}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-md"
                  >
                    {currentStep === DEFAULT_STEPS.length - 1 ? (
                      <>
                        <Sparkles size={14} /> Começar!
                      </>
                    ) : (
                      <>
                        Próximo <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-1.5 pb-4">
              {DEFAULT_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep ? "w-6 bg-primary" : i < currentStep ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
