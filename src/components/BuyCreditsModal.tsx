import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Coins, Sparkles, Check, X, Tag, Calculator, Loader2, QrCode, Copy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeCanvas } from "qrcode.react";

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
  themeVars?: CSSProperties;
  userId?: string;
  sellerId?: string;
  onPurchased?: () => void;
}

export default function BuyCreditsModal({ open, onClose, themeVars, userId, sellerId, onPurchased }: Props) {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string>("p40");
  const [customValue, setCustomValue] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  // Etapas: pacotes -> cpf -> pix
  const [step, setStep] = useState<"packages" | "cpf" | "pix">("packages");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState<number>(0);
  const [orderCredits, setOrderCredits] = useState<number>(0);
  const [document, setDocument] = useState("");
  const [pixData, setPixData] = useState<{ qr: string; emv: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<number | null>(null);

  const customNum = parseFloat(customValue.replace(",", ".")) || 0;
  const customCredits = useMemo(() => customCreditsFor(customNum), [customNum]);
  const customDiscountPct = customNum >= 15
    ? Math.min(23, Math.max(0, ((customNum - 15) / (100 - 15)) * 23))
    : 0;

  const isCustomActive = selectedId === "custom";
  const canConfirm = isCustomActive ? (customNum >= 15 && customNum <= 500) : true;

  const handleConfirm = async () => {
    const pkg = isCustomActive
      ? { price: customNum, credits: customCredits }
      : PACKAGES.find((p) => p.id === selectedId)!;

    if (!userId) {
      toast({ title: "Sessão não encontrada", description: "Faça login novamente.", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("appmax-create-credits-checkout", {
        body: { amount: pkg.price, credits: pkg.credits },
      });
      if (error) throw error;
      if (!data?.order_id) throw new Error("Checkout não retornou pedido");
      setOrderId(String(data.order_id));
      setOrderAmount(Number(data.amount ?? pkg.price));
      setOrderCredits(pkg.credits);
      setStep("cpf");
    } catch (e: any) {
      toast({ title: "Erro ao processar", description: e?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleGeneratePix = async () => {
    if (!orderId) return;
    if (!document || document.replace(/\D/g, "").length < 11) {
      toast({ title: "CPF obrigatório", description: "Informe um CPF válido.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("appmax-pay", {
        body: { order_id: orderId, method: "pix", document },
      });
      if (error) throw error;
      if (data?.pix_emv || data?.pix_qr_code) {
        setPixData({ qr: data.pix_qr_code || data.pix_emv, emv: data.pix_emv || data.pix_qr_code });
        setStep("pix");
        toast({ title: "PIX gerado!", description: "Escaneie o QR Code ou copie o código." });
      } else {
        throw new Error("PIX não retornou QR Code");
      }
    } catch (err: any) {
      toast({ title: "Erro ao gerar PIX", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const copyPix = () => {
    if (!pixData?.emv) return;
    navigator.clipboard.writeText(pixData.emv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Código PIX copiado!" });
  };

  // Polling de confirmação
  useEffect(() => {
    if (step !== "pix" || !orderId) return;
    pollingRef.current = window.setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke("appmax-confirm", {
          body: { order_id: orderId },
        });
        if (data?.ok && !data.already_processed) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast({
            title: "🎉 Pagamento aprovado!",
            description: `${data.credits || orderCredits} créditos adicionados na sua conta.`,
          });
          onPurchased?.();
          setTimeout(() => {
            resetState();
            onClose();
          }, 1500);
        }
      } catch {
        /* silencioso */
      }
    }, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [step, orderId, orderCredits, onPurchased, onClose, toast]);

  const resetState = () => {
    setStep("packages");
    setOrderId(null);
    setOrderAmount(0);
    setOrderCredits(0);
    setDocument("");
    setPixData(null);
    setCopied(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent style={themeVars} className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-background text-foreground border-border">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 font-display text-2xl font-extrabold">
            {step !== "packages" && (
              <button
                type="button"
                onClick={() => (step === "pix" ? handleClose() : setStep("packages"))}
                className="p-1 rounded-full hover:bg-muted transition"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <Coins className="h-6 w-6 text-primary" />
            {step === "packages" && "Comprar Créditos IA"}
            {step === "cpf" && "Confirmar dados"}
            {step === "pix" && "Pague com PIX"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {step === "packages" && "Quanto mais créditos, maior o desconto. Use para gerar artes, textos, avaliações e atendimento automático."}
            {step === "cpf" && `Pedido #${orderId} · ${orderCredits} créditos por R$ ${orderAmount.toFixed(2).replace(".", ",")}`}
            {step === "pix" && "Aguardando seu pagamento. Os créditos são liberados automaticamente."}
          </p>
        </DialogHeader>

        {step === "packages" && (
          <>

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
                      <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-accent/20 text-accent-foreground border border-accent/30">
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

        <div className="sticky bottom-0 mt-4 px-6 py-4 border-t border-border bg-background/95 backdrop-blur flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Pagamento via PIX. Créditos liberados após confirmação.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={processing}>
              <X className="h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!canConfirm || processing} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
              {processing ? "Processando..." : "Continuar"}
            </Button>
          </div>
        </div>
          </>
        )}

        {step === "cpf" && (
          <div className="px-6 py-6 space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Você vai pagar</p>
                <p className="font-display text-2xl font-extrabold text-primary">
                  R$ {orderAmount.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Você recebe</p>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  {orderCredits} <span className="text-xs font-normal text-muted-foreground">créditos</span>
                </p>
              </div>
            </div>

            <div>
              <Label>CPF do pagador</Label>
              <Input
                placeholder="000.000.000-00"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                maxLength={14}
                className="h-11"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Necessário para gerar o PIX conforme regras do Banco Central.
              </p>
            </div>

            <Button
              onClick={handleGeneratePix}
              disabled={generating}
              className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold"
              size="lg"
            >
              {generating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <QrCode className="h-5 w-5 mr-2" />}
              {generating ? "Gerando PIX..." : "Gerar QR Code PIX"}
            </Button>
          </div>
        )}

        {step === "pix" && pixData && (
          <div className="px-6 py-6 space-y-5">
            <div className="rounded-xl border border-border bg-muted/40 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-display text-2xl font-extrabold text-primary">
                  R$ {orderAmount.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Créditos</p>
                <p className="font-display text-2xl font-extrabold text-foreground">{orderCredits}</p>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-2xl shadow-lg">
                <QRCodeCanvas value={pixData.emv} size={240} level="M" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Código PIX copia e cola</Label>
              <div className="flex items-center gap-2">
                <Input value={pixData.emv} readOnly className="text-xs font-mono" />
                <Button onClick={copyPix} variant="outline" size="icon" className="shrink-0">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Aguardando pagamento... os créditos serão liberados automaticamente.
            </div>

            <Button variant="outline" onClick={handleClose} className="w-full">
              Fechar (o pagamento continua válido)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
