import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, QrCode, CreditCard, Copy, Check } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

interface PaymentRecord {
  order_id: string;
  amount: number;
  tier: string;
  status: string;
  pix_qr_code: string | null;
  pix_emv: string | null;
  metadata: any;
}

export default function AppmaxCheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<"pix" | "credit-card">("pix");
  const [generating, setGenerating] = useState(false);
  const [pixData, setPixData] = useState<{ qr: string; emv: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const pollingRef = useRef<number | null>(null);

  const isCreditsPurchase = payment?.metadata?.kind === "credits";
  const successRedirect = isCreditsPurchase ? "/painel" : "/pacotes";

  // Cartão
  const [document, setDocument] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState(1);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      const { data } = await supabase
        .from("appmax_payments" as any)
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();
      if (!data) {
        toast({ title: "Pedido não encontrado", variant: "destructive" });
        navigate("/pacotes");
        return;
      }
      const p = data as any;
      setPayment(p);
      if (p.pix_qr_code) setPixData({ qr: p.pix_qr_code, emv: p.pix_emv || p.pix_qr_code });
      if (p.status === "approved") {
        toast({ title: "✅ Pagamento já aprovado!" });
        navigate(p.metadata?.kind === "credits" ? "/painel" : "/pacotes");
      }
      setLoading(false);
    })();
  }, [orderId, navigate, toast]);

  // Polling para PIX
  useEffect(() => {
    if (!pixData || !orderId) return;
    pollingRef.current = window.setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke("appmax-confirm", {
          body: { order_id: orderId },
        });
        if (data?.ok && !data.already_processed) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast({
            title: "🎉 Pagamento aprovado!",
            description: data.kind === "credits"
              ? `${data.credits} créditos adicionados na sua conta.`
              : "Seu plano foi ativado.",
          });
          setTimeout(() => navigate(successRedirect), 1500);
        }
      } catch {
        /* silencioso */
      }
    }, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pixData, orderId, navigate, toast, successRedirect]);

  const handleGeneratePix = async () => {
    if (!orderId) return;
    if (!document || document.replace(/\D/g, "").length < 11) {
      toast({ title: "CPF obrigatório", description: "Informe seu CPF para gerar o PIX.", variant: "destructive" });
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
        toast({ title: "PIX gerado!", description: "Escaneie o QR Code ou copie o código." });
      } else {
        throw new Error("PIX não retornou QR Code");
      }
    } catch (err: any) {
      toast({ title: "Erro ao gerar PIX", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const handlePayCard = async () => {
    if (!orderId) return;
    if (!document.replace(/\D/g, "")) {
      toast({ title: "CPF obrigatório", variant: "destructive" });
      return;
    }
    if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
      toast({ title: "Preencha todos os campos do cartão", variant: "destructive" });
      return;
    }
    setConfirming(true);
    try {
      const { data, error } = await supabase.functions.invoke("appmax-pay", {
        body: {
          order_id: orderId,
          method: "credit-card",
          installments,
          document,
          card: { number: cardNumber, holder: cardHolder, expiry: cardExpiry, cvv: cardCvv },
        },
      });
      if (error) throw error;
      // Confirma ativação
      const conf = await supabase.functions.invoke("appmax-confirm", { body: { order_id: orderId } });
      if (conf.data?.ok) {
        toast({ title: "🎉 Pagamento aprovado!", description: "Seu plano foi ativado." });
        setTimeout(() => navigate(successRedirect), 1500);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!payment) return null;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-2">
            {isCreditsPurchase ? "Comprar Créditos IA" : "Finalizar Pagamento"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isCreditsPurchase
              ? `${payment.metadata?.credits} créditos · pagamento via PIX`
              : (payment.metadata?.coupon_description || "Pagamento único, sem renovação automática")}
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-3xl font-bold text-primary">
                R$ {payment.amount.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Pedido #{payment.order_id}</p>
            </div>
          </div>

          <Tabs value={method} onValueChange={(v) => setMethod(v as any)}>
            {!isCreditsPurchase && (
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="pix"><QrCode className="w-4 h-4 mr-2" />PIX</TabsTrigger>
                <TabsTrigger value="credit-card"><CreditCard className="w-4 h-4 mr-2" />Cartão</TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="pix" className="space-y-4 mt-6">
              {!pixData ? (
                <>
                  <div>
                    <Label>CPF do pagador</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={document}
                      onChange={(e) => setDocument(e.target.value)}
                      maxLength={14}
                    />
                  </div>
                  <Button onClick={handleGeneratePix} disabled={generating} className="w-full" size="lg">
                    {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
                    Gerar QR Code PIX
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <QRCodeCanvas value={pixData.emv} size={256} level="M" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Escaneie o QR Code com o app do seu banco ou copie o código abaixo
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={pixData.emv} readOnly className="text-xs font-mono" />
                    <Button onClick={copyPix} variant="outline" size="icon">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aguardando pagamento...
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="credit-card" className="space-y-4 mt-6">
              <div>
                <Label>CPF do titular</Label>
                <Input
                  placeholder="000.000.000-00"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  maxLength={14}
                />
              </div>
              <div>
                <Label>Número do cartão</Label>
                <Input
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  maxLength={19}
                />
              </div>
              <div>
                <Label>Nome impresso no cartão</Label>
                <Input
                  placeholder="JOSÉ DA SILVA"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Validade (MM/AA)</Label>
                  <Input
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    maxLength={4}
                  />
                </div>
              </div>
              <div>
                <Label>Parcelas</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}x de R$ {(payment.amount / n).toFixed(2).replace(".", ",")}
                      {n === 1 ? " à vista" : " com juros"}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handlePayCard} disabled={confirming} className="w-full" size="lg">
                {confirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Pagar R$ {payment.amount.toFixed(2).replace(".", ",")}
              </Button>
            </TabsContent>
          </Tabs>

          <Button variant="ghost" onClick={() => navigate(successRedirect)} className="w-full mt-6">
            Cancelar e voltar
          </Button>
        </Card>
      </div>
    </div>
  );
}