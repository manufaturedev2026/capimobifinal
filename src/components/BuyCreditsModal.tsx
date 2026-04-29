import { useMemo, useState } from "react";
import { Coins, Sparkles, Check, X, Tag, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

/**
 * Pacotes pré-definidos.
 * Base: R$ 0,25 por crédito.
 * Descontos progressivos mantendo margem (custo médio IA ~R$ 0,12/crédito).
 */
const PACKAGES = [
  { id: "p15",  price: 15,  credits: 60,  discount: 0,  popular: false },
  { id: "p25",  price: 25,  credits: 110, discount: 9,  popular: false },
  { id: "p40",  price: 40,  credits: 185, discount: 14, popular: true  },
  { id: "p60",  price: 60,  credits: 290, discount: 17, popular: false },
  { id: "p80",  price: 80,  credits: 400, discount: 20, popular: false },
  { id: "p100", price: 100, credits: 520, discount: 23, popular: false },
];

/** Calcula créditos para valor personalizado com desconto progressivo. */
function customCreditsFor(reais: number) {
  if (reais < 15) return 0;
  // Curva linear: 0% em R$15 → 23% em R$100
  const pct = Math.min(23, Math.max(0, ((reais - 15) / (100 - 15)) * 23));
  const pricePerCredit = 0.25 * (1 - pct / 100);
  return Math.floor(reais / pricePerCredit);
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function BuyCreditsModal({ open, onClose }: Props) {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string>("p40");
  const [customValue, setCustomValue] = useState<string>("");

  const customNum = parseFloat(customValue.replace(",", ".")) || 0;
  const customCredits = useMemo(() => customCreditsFor(customNum), [customNum]);
  const customDiscountPct = customNum >= 15
    ? Math.min(23, Math.max(0, ((customNum - 15) / (100 - 15)) * 23))
    : 0;

  const isCustomActive = selectedId === "custom";
  const canConfirm = isCustomActive ? (customNum >= 15 && customNum <= 500) : true;

  const handleConfirm = () => {
    const pkg = isCustomActive
      ? { price: customNum, credits: customCredits }
      : PACKAGES.find((p) => p.id === selectedId)!;
    toast({
      title: "Pagamento em ativação",
      description: `Você selecionou ${pkg.credits} créditos por R$ ${pkg.price.toFixed(2).replace(".", ",")}. Em breve esse pacote será cobrado automaticamente.`,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-background via-background to-primary/5">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 font-display text-2xl font-extrabold">
            <Coins className="h-6 w-6 text-primary" /> Comprar Créditos IA
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Quanto mais créditos, maior o desconto. Use para gerar artes, textos, avaliações e atendimento automático.
          </p>
        </DialogHeader>

        {/* Pacotes */}
        <div className="px-6 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PACKAGES.map((pkg) => {
            const active = selectedId === pkg.id;
            const pricePerCredit = pkg.price / pkg.credits;
            return (
              <button
                key={pkg.id}
                onClick={() => setSelectedId(pkg.id)}
                className={`relative text-left rounded-2xl border-2 p-4 transition-all ${
                  active
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.02]"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow">
                    MAIS ESCOLHIDO
                  </span>
                )}
                {pkg.discount > 0 && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-accent/20 text-accent-foreground border border-accent/30">
                    <Tag className="h-3 w-3" /> -{pkg.discount}%
                  </span>
                )}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-extrabold text-foreground">{pkg.credits}</span>
                  <span className="text-xs text-muted-foreground">créditos</span>
                </div>
                <p className="mt-1 text-sm font-bold text-primary">
                  R$ {pkg.price.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  R$ {pricePerCredit.toFixed(3).replace(".", ",")} por crédito
                </p>
                {active && (
                  <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Valor personalizado */}
        <div className="px-6 mt-4">
          <button
            onClick={() => setSelectedId("custom")}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
              isCustomActive
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                : "border-dashed border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Valor personalizado</span>
              <span className="text-[10px] text-muted-foreground">(de R$ 15 a R$ 500)</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-bold text-muted-foreground">R$</span>
                <Input
                  type="number"
                  min={15}
                  max={500}
                  step={1}
                  value={customValue}
                  onChange={(e) => { setCustomValue(e.target.value); setSelectedId("custom"); }}
                  placeholder="Ex: 50"
                  className="h-10"
                />
              </div>
              <div className="text-sm">
                {customNum >= 15 ? (
                  <>
                    <span className="font-display text-2xl font-extrabold text-foreground">{customCredits}</span>
                    <span className="text-xs text-muted-foreground"> créditos</span>
                    {customDiscountPct > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600">
                        <Tag className="h-3 w-3" /> -{customDiscountPct.toFixed(0)}%
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Digite ao menos R$ 15</span>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 mt-4 px-6 py-4 border-t border-border bg-background/95 backdrop-blur flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Créditos não expiram. Pagamento único.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!canConfirm} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
              <Coins className="h-4 w-4" /> Comprar agora
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
