import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, QrCode, CreditCard, Copy, Check, ArrowLeft, Crown } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
  amount: number;
  planName: string;
  description?: string;
  onPaid?: () => void;
}

export default function PlanCheckoutModal({ open, onClose, orderId, amount, planName, description, onPaid }: Props) {
  const { toast } = useToast();
  const [method, setMethod] = useState<"pix" | "credit-card">("pix");
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pixData, setPixData] = useState<{ emv: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<number | null>(null);

  const [doc, setDoc] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState(1);

  // Reset ao abrir/fechar
  useEffect(() => {
    if (!open) {
      setMethod("pix");
      setPixData(null);
      setDoc("");
      setCardNumber("");
      setCardHolder("");
      setCardExpiry("");
      setCardCvv("");
      setInstallments(1);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [open]);

  // Polling PIX
  useEffect(() => {
    if (!open || !pixData || !orderId) return;
    pollingRef.current = window.setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke("appmax-confirm", { body: { order_id: orderId } });
        if (data?.ok && !data.already_processed) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast({ title: "🎉 Pagamento aprovado!", description: "Seu plano foi ativado." });
          onPaid?.();
          setTimeout(() => onClose(), 1500);
        }
      } catch { /* silencioso */ }
    }, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [open, pixData, orderId, onClose, onPaid, toast]);

  const handleGeneratePix = async () => {
    if (!orderId) return;
    if (!doc || doc.replace(/\D/g, "").length < 11) {
      toast({ title: "CPF obrigatório", description: "Informe um CPF válido.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("appmax-pay", {
        body: { order_id: orderId, method: "pix", document: doc },
      });
      if (error) throw error;
      const emv = data?.pix_emv || data?.pix_qr_code;
      if (!emv) throw new Error("PIX não retornou QR Code");
      setPixData({ emv });
      toast({ title: "PIX gerado!", description: "Escaneie o QR Code ou copie o código." });
    } catch (err: any) {
      toast({ title: "Erro ao gerar PIX", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const handlePayCard = async () => {
    if (!orderId) return;
    if (!doc.replace(/\D/g, "")) {
      toast({ title: "CPF obrigatório", variant: "destructive" });
      return;
    }
    if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
      toast({ title: "Preencha todos os campos do cartão", variant: "destructive" });
      return;
    }
    setConfirming(true);
    try {
      const { error } = await supabase.functions.invoke("appmax-pay", {
        body: {
          order_id: orderId,
          method: "credit-card",
          installments,
          document: doc,
          card: { number: cardNumber, holder: cardHolder, expiry: cardExpiry, cvv: cardCvv },
        },
      });
      if (error) throw error;
      const conf = await supabase.functions.invoke("appmax-confirm", { body: { order_id: orderId } });
      if (conf.data?.ok) {
        toast({ title: "🎉 Pagamento aprovado!", description: "Seu plano foi ativado." });
        onPaid?.();
        setTimeout(() => onClose(), 1500);
      } else {
        toast({ title: "Pagamento em análise", description: "Aguarde a confirmação por e-mail." });
      }
    } catch (err: any) {
      toast({ title: "Erro no pagamento", description: err.message, variant: "destructive" });
    }
    setConfirming(false);
  };

  const copyPix = () => {
    if (!pixData?.emv) return;
    navigator.clipboard.writeText(pixData.emv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Código PIX copiado!" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 bg-background text-foreground border-border">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 font-display text-2xl font-extrabold">
            {pixData && (
              <button
                type="button"
                onClick={() => setPixData(null)}
                className="p-1 rounded-full hover:bg-muted transition"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <Crown className="h-6 w-6 text-primary" />
            Finalizar — {planName}
          </DialogTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </DialogHeader>

        <div className="px-6 pb-6 pt-2 space-y-4">
          <div className="rounded-xl border border-border bg-muted/40 p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Total a pagar</p>
              <p className="font-display text-3xl font-extrabold text-primary">
                R$ {amount.toFixed(2).replace(".", ",")}
              </p>
            </div>
            {orderId && (
              <p className="text-[11px] text-muted-foreground">Pedido #{orderId}</p>
            )}
          </div>

          <Tabs value={method} onValueChange={(v) => setMethod(v as any)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="pix"><QrCode className="w-4 h-4 mr-2" />PIX</TabsTrigger>
              <TabsTrigger value="credit-card"><CreditCard className="w-4 h-4 mr-2" />Cartão</TabsTrigger>
            </TabsList>

            <TabsContent value="pix" className="space-y-4 mt-4">
              {!pixData ? (
                <>
                  <div>
                    <Label>CPF do pagador</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={doc}
                      onChange={(e) => setDoc(e.target.value)}
                      maxLength={14}
                      className="h-11"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Necessário para gerar o PIX conforme regras do Banco Central.
                    </p>
                  </div>
                  <Button onClick={handleGeneratePix} disabled={generating} className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold" size="lg">
                    {generating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <QrCode className="w-5 h-5 mr-2" />}
                    {generating ? "Gerando PIX..." : "Gerar QR Code PIX"}
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-2xl shadow-lg inline-block">
                    <QRCodeCanvas value={pixData.emv} size={240} level="M" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Escaneie no app do banco ou copie o código abaixo
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={pixData.emv} readOnly className="text-xs font-mono" />
                    <Button onClick={copyPix} variant="outline" size="icon" className="shrink-0">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Aguardando pagamento... liberação automática.
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="credit-card" className="space-y-3 mt-4">
              <div>
                <Label>CPF do titular</Label>
                <Input placeholder="000.000.000-00" value={doc} onChange={(e) => setDoc(e.target.value)} maxLength={14} className="h-11" />
              </div>
              <div>
                <Label>Número do cartão</Label>
                <Input placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} maxLength={19} className="h-11" />
              </div>
              <div>
                <Label>Nome impresso</Label>
                <Input placeholder="JOSÉ DA SILVA" value={cardHolder} onChange={(e) => setCardHolder(e.target.value.toUpperCase())} className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Validade (MM/AA)</Label>
                  <Input placeholder="12/28" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} maxLength={5} className="h-11" />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} maxLength={4} className="h-11" />
                </div>
              </div>
              <div>
                <Label>Parcelas</Label>
                <select
                  className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm"
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}x de R$ {(amount / n).toFixed(2).replace(".", ",")}
                      {n === 1 ? " à vista" : " com juros"}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handlePayCard} disabled={confirming} className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold" size="lg">
                {confirming ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CreditCard className="w-5 h-5 mr-2" />}
                Pagar R$ {amount.toFixed(2).replace(".", ",")}
              </Button>
            </TabsContent>
          </Tabs>

          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}