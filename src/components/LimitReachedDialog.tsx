import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Crown, Zap, HardDrive, Image as ImageIcon, Sparkles } from "lucide-react";

export type LimitKind = "items" | "storage" | "photos" | "ai_credits";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: LimitKind;
  used?: number;
  limit?: number;
  planName?: string;
}

const META: Record<LimitKind, { icon: any; title: string; cta: string; route: string }> = {
  items: {
    icon: Crown,
    title: "Limite de anúncios atingido",
    cta: "Ver planos",
    route: "/pacotes",
  },
  storage: {
    icon: HardDrive,
    title: "Limite de armazenamento atingido",
    cta: "Fazer upgrade",
    route: "/pacotes",
  },
  photos: {
    icon: ImageIcon,
    title: "Limite de fotos por anúncio atingido",
    cta: "Ver planos com mais fotos",
    route: "/pacotes",
  },
  ai_credits: {
    icon: Sparkles,
    title: "Créditos de IA insuficientes",
    cta: "Comprar créditos",
    route: "/pacotes?tab=creditos",
  },
};

export default function LimitReachedDialog({ open, onOpenChange, kind, used, limit, planName }: Props) {
  const navigate = useNavigate();
  const meta = META[kind];
  const Icon = meta.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">{meta.title}</DialogTitle>
          <DialogDescription className="text-center space-y-2 pt-2">
            {planName && (
              <span className="block">
                Seu plano <strong>{planName}</strong> atingiu o limite
                {limit !== undefined && used !== undefined && (
                  <> ({used}/{limit})</>
                )}.
              </span>
            )}
            <span className="block text-foreground/80">
              Faça upgrade para continuar publicando sem interrupções, com mais fotos, mais espaço e mais créditos de IA.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              onOpenChange(false);
              navigate(meta.route);
            }}
          >
            <Zap className="mr-2 h-4 w-4" />
            {meta.cta}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Agora não
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}