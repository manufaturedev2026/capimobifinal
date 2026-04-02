import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Download, MonitorSmartphone, Smartphone, X, type LucideIcon } from "lucide-react";

import type { PwaInstallGuideMode } from "@/lib/pwaInstall";

interface PwaInstallGuideProps {
  mode: PwaInstallGuideMode;
  onClose: () => void;
  open: boolean;
}

const GUIDE_CONTENT: Record<
  PwaInstallGuideMode,
  {
    description: string;
    icon: LucideIcon;
    note?: string;
    steps: string[];
    title: string;
  }
> = {
  ios: {
    title: "Instalar no iPhone",
    description: "No iPhone a instalação é feita pelo Safari em poucos toques.",
    icon: Smartphone,
    steps: [
      "Toque no botão Compartilhar do Safari.",
      "Escolha “Adicionar à Tela de Início”.",
      "Confirme em “Adicionar” para instalar o app.",
    ],
  },
  manual: {
    title: "Instalar o app",
    description: "Se o navegador não abriu o prompt automático, você ainda pode instalar manualmente.",
    icon: MonitorSmartphone,
    steps: [
      "Abra o menu do navegador (⋮ ou configurações).",
      "Toque em “Instalar app” ou “Adicionar à tela inicial”.",
      "Confirme para salvar o app no celular ou no desktop.",
    ],
  },
  preview: {
    title: "Abrir fora da prévia",
    description: "No preview do editor o navegador costuma bloquear a instalação automática do PWA.",
    icon: Download,
    steps: [
      "Abra a loja na URL publicada, fora do editor.",
      "No Android/Desktop use o menu do navegador e toque em “Instalar app”.",
      "No iPhone abra no Safari e use “Adicionar à Tela de Início”.",
    ],
    note: "Na prévia o botão continua visível, mas a instalação real depende do navegador aberto diretamente na URL publicada.",
  },
};

export default function PwaInstallGuide({ mode, onClose, open }: PwaInstallGuideProps) {
  const content = GUIDE_CONTENT[mode];
  const Icon = content.icon;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-3xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">{content.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{content.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {content.steps.map((step, index) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="text-sm text-foreground">{step}</p>
                </div>
              ))}
            </div>

            {content.note && (
              <div className="rounded-2xl bg-muted p-3 text-xs text-muted-foreground">
                {content.note}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              Entendi
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}