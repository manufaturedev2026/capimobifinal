import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BRAZIL_STATES } from "@/data/brazilStates";
import { useCitiesByState } from "@/hooks/useCitiesByState";
import {
  Sparkles, ArrowLeft, TrendingUp, Clock, Crown, Zap, Target, CheckCircle2,
  AlertCircle, Loader2, Brain, MapPin, Home, Maximize2, Bed, FileText, Save,
  Megaphone, Download, History, Wand2, FileBadge, Printer, Share2, Mail,
} from "lucide-react";
import jsPDF from "jspdf";
import { generateValuationReport } from "@/lib/generateValuationReport";

const TIPOS = ["Casa", "Apartamento", "Terreno", "Comercial", "Rural"];
const EXTRAS = [
  "Quintal", "Piscina", "Área gourmet", "Varanda",
  "Vista privilegiada", "Mobiliado", "Portaria", "Elevador", "Energia solar",
];
const ACABAMENTOS = ["Simples", "Médio", "Alto padrão", "Luxo"];
const CONSERVACAO = ["Novo", "Reformado", "Bom", "Antigo", "Precisa reforma"];
const DOCUMENTACAO = ["Financiável", "Escritura OK", "Averbação OK", "Pendente"];

type Valuation = {
  valor_estimado: number;
  faixa_min: number;
  faixa_max: number;
  venda_rapida: number;
  venda_premium: number;
  potencial_valorizacao_pct: number;
  tempo_medio_venda_dias: number;
  justificativa: string;
  pontos_fortes: string[];
  pontos_atencao: string[];
  sugestoes_valorizacao?: string[];
  meta?: {
    preco_m2: number;
    source: string;
    valor_base: number;
    ajuste_total_pct: number;
    bonus_total_pct: number;
    desconto_total_pct: number;
    breakdown: Array<{ label: string; pct: number }>;
    market?: {
      comparaveis: number;
      media_dormitorios: number;
      media_banheiros: number;
      media_area_m2: number;
      media_preco: number;
    };
  };
};

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function AiValuationPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Form state
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [cep, setCep] = useState("");
  const [tipo, setTipo] = useState("Casa");
  const [areaTotal, setAreaTotal] = useState("");
  const [areaConstruida, setAreaConstruida] = useState("");
  const [quartos, setQuartos] = useState("3");
  const [banheiros, setBanheiros] = useState("2");
  const [suites, setSuites] = useState("1");
  const [garagem, setGaragem] = useState("2");
  const [extras, setExtras] = useState<string[]>([]);
  const [acabamento, setAcabamento] = useState("Médio");
  const [conservacao, setConservacao] = useState("Bom");
  const [documentacao, setDocumentacao] = useState<string[]>(["Escritura OK"]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Valuation | null>(null);

  // History
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Ad generation
  const [adOpen, setAdOpen] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [adContent, setAdContent] = useState<{ titulo: string; descricao: string } | null>(null);

  const { cities } = useCitiesByState(estado);

  const toggleArr = (val: string, arr: string[], setter: (v: string[]) => void) =>
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const handleCalculate = async () => {
    if (!estado || !cidade || !bairro || !areaTotal) {
      toast({ title: "Preencha localização e área total", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-property-valuation", {
        body: {
          estado, cidade, bairro, rua, numero, cep, tipo,
          areaTotal: Number(areaTotal),
          areaConstruida: Number(areaConstruida) || null,
          quartos: Number(quartos), banheiros: Number(banheiros),
          suites: Number(suites), garagem: Number(garagem),
          extras, acabamento, conservacao, documentacao,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as Valuation);
      setTimeout(() => document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      toast({ title: "Erro ao calcular", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!user) {
      toast({ title: "Faça login para ver seu histórico", variant: "destructive" });
      return;
    }
    setHistoryOpen(true);
    const { data } = await supabase
      .from("property_valuations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setHistory(data || []);
  };

  const exportPdf = () => {
    if (!result) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFillColor(20, 30, 70);
    doc.rect(0, 0, pageW, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Avaliação Imobiliária IA", 14, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, 14, 27);

    y = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Imóvel avaliado", 14, y); y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`${tipo} — ${bairro}, ${cidade}/${estado}`, 14, y); y += 5;
    if (rua) { doc.text(`Rua: ${rua}${numero ? `, ${numero}` : ""}`, 14, y); y += 5; }
    doc.text(`Área: ${areaTotal}m²${areaConstruida ? ` (constr. ${areaConstruida}m²)` : ""}`, 14, y); y += 5;
    doc.text(`${quartos}q (${suites}s) | ${banheiros} banheiros | ${garagem} vagas`, 14, y); y += 5;
    doc.text(`Acabamento: ${acabamento} | Conservação: ${conservacao}`, 14, y); y += 5;
    if (extras.length) { doc.text(`Extras: ${extras.join(", ")}`, 14, y); y += 5; }

    y += 8;
    doc.setFillColor(245, 247, 255);
    doc.rect(10, y - 4, pageW - 20, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("VALOR ESTIMADO DE MERCADO", 14, y + 2);
    doc.setFontSize(22);
    doc.setTextColor(20, 30, 70);
    doc.text(fmtBRL(result.valor_estimado), 14, y + 14);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    doc.text(`Faixa ideal: ${fmtBRL(result.faixa_min)} – ${fmtBRL(result.faixa_max)}`, 14, y + 21);
    y += 35;

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Estratégias de venda", 14, y); y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`• Venda rápida (até 30 dias): ${fmtBRL(result.venda_rapida)}`, 14, y); y += 5;
    doc.text(`• Venda premium (paciente): ${fmtBRL(result.venda_premium)}`, 14, y); y += 5;
    doc.text(`• Tempo médio estimado: ${result.tempo_medio_venda_dias} dias`, 14, y); y += 5;
    doc.text(`• Potencial valorização: +${result.potencial_valorizacao_pct}% a.a.`, 14, y); y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Análise técnica", 14, y); y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(result.justificativa, pageW - 28);
    lines.forEach((line: string) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line, 14, y); y += 4;
    });

    y += 4;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 120, 60);
    doc.text("Pontos fortes", 14, y); y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    result.pontos_fortes.forEach((p) => {
      const ll = doc.splitTextToSize(`✓ ${p}`, pageW - 28);
      ll.forEach((l: string) => { if (y > 275) { doc.addPage(); y = 20; } doc.text(l, 14, y); y += 4; });
    });
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 100, 0);
    doc.text("Pontos de atenção", 14, y); y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    result.pontos_atencao.forEach((p) => {
      const ll = doc.splitTextToSize(`! ${p}`, pageW - 28);
      ll.forEach((l: string) => { if (y > 275) { doc.addPage(); y = 20; } doc.text(l, 14, y); y += 4; });
    });

    doc.save(`avaliacao-${bairro}-${Date.now()}.pdf`);
    toast({ title: "PDF exportado!" });
  };

  const buildLaudo = () => {
    if (!result) return null;
    return generateValuationReport({
      estado, cidade, bairro, rua: rua ? `${rua}${numero ? `, ${numero}` : ""}` : rua, cep, tipo,
      areaTotal, areaConstruida, quartos, banheiros, suites, garagem,
      extras, acabamento, conservacao, documentacao,
      result,
      avaliadorNome: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Sistema IA Capimobi",
      avaliadorEmail: user?.email,
      empresaNome: "CAPIMOBI",
    });
  };

  const downloadLaudo = () => {
    const doc = buildLaudo();
    if (!doc) return;
    doc.save(`laudo-avaliacao-${bairro.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`);
    toast({ title: "Laudo PDF gerado!", description: "Pronto para impressão e envio." });
  };

  const printLaudo = () => {
    const doc = buildLaudo();
    if (!doc) return;
    const url = doc.output("bloburl");
    const win = window.open(url, "_blank");
    if (win) setTimeout(() => win.print(), 800);
  };

  const shareWhatsapp = () => {
    if (!result) return;
    const msg = `📋 *Laudo de Avaliação Imobiliária*\n\n🏠 ${tipo} em ${bairro}, ${cidade}/${estado}\n📐 ${areaTotal}m²${areaConstruida ? ` (constr. ${areaConstruida}m²)` : ""}\n\n💰 *Valor estimado:* ${fmtBRL(result.valor_estimado)}\n📊 Faixa: ${fmtBRL(result.faixa_min)} – ${fmtBRL(result.faixa_max)}\n⚡ Venda rápida: ${fmtBRL(result.venda_rapida)}\n👑 Venda premium: ${fmtBRL(result.venda_premium)}\n⏱ Tempo médio: ${result.tempo_medio_venda_dias} dias\n\n_Avaliação gerada por Capimobi IA_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareEmail = () => {
    if (!result) return;
    const subject = `Laudo de Avaliação - ${tipo} em ${bairro}, ${cidade}`;
    const body = `Segue avaliação imobiliária:\n\n${tipo} em ${bairro}, ${cidade}/${estado}\nÁrea: ${areaTotal}m²\n\nValor estimado: ${fmtBRL(result.valor_estimado)}\nFaixa ideal: ${fmtBRL(result.faixa_min)} – ${fmtBRL(result.faixa_max)}\nVenda rápida: ${fmtBRL(result.venda_rapida)}\nVenda premium: ${fmtBRL(result.venda_premium)}\nTempo médio: ${result.tempo_medio_venda_dias} dias\n\n${result.justificativa}\n\n— Avaliação gerada por Capimobi IA`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const generateAd = async () => {
    if (!result) return;
    setAdOpen(true);
    setAdLoading(true);
    setAdContent(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-valuation-ad", {
        body: {
          estado, cidade, bairro, tipo, areaTotal: Number(areaTotal),
          areaConstruida: Number(areaConstruida) || null,
          quartos: Number(quartos), banheiros: Number(banheiros),
          suites: Number(suites), garagem: Number(garagem),
          extras, acabamento, conservacao,
          valor_estimado: result.valor_estimado,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAdContent(data as any);
    } catch (e: any) {
      toast({ title: "Erro ao gerar anúncio", description: e.message, variant: "destructive" });
      setAdOpen(false);
    } finally {
      setAdLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/painel" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" /> Voltar ao painel
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <Button variant="ghost" size="sm" onClick={loadHistory}>
                <History className="h-4 w-4 mr-1" /> Histórico
              </Button>
            )}
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-primary">
              <Brain className="h-4 w-4" /> IA + Cálculo Real
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" /> AVALIAÇÃO PROFISSIONAL
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Quanto vale seu imóvel?
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cálculo determinístico baseado em preço de mercado por m² da sua região, com 30+ ajustes profissionais.
          </p>
        </motion.div>

        {/* Form */}
        <Card className="p-6 md:p-8 shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
          <Section icon={<MapPin className="h-4 w-4" />} title="Localização">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Estado *">
                <Select value={estado} onValueChange={(v) => { setEstado(v); setCidade(""); }}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {BRAZIL_STATES.map((s) => <SelectItem key={s.uf} value={s.uf}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cidade *">
                <Select value={cidade} onValueChange={setCidade} disabled={!estado}>
                  <SelectTrigger><SelectValue placeholder={estado ? "Selecione a cidade" : "Escolha o estado primeiro"} /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Bairro *">
                <Input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Ex: Praia do Canto" />
              </Field>
              <Field label="Rua (opcional)">
                <Input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Nome da rua" />
              </Field>
              <Field label="Número (opcional)">
                <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: 123" />
              </Field>
              <Field label="CEP (opcional)">
                <Input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" />
              </Field>
            </div>
          </Section>

          <Section icon={<Home className="h-4 w-4" />} title="Tipo de imóvel">
            <ChipGroup options={TIPOS} value={tipo} onChange={setTipo} />
          </Section>

          <Section icon={<Maximize2 className="h-4 w-4" />} title="Metragem">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Área total (m²) *">
                <Input type="number" value={areaTotal} onChange={(e) => setAreaTotal(e.target.value)} placeholder="250" />
              </Field>
              <Field label={tipo === "Terreno" ? "(não aplicável)" : "Área construída (m²)"}>
                <Input type="number" value={areaConstruida} onChange={(e) => setAreaConstruida(e.target.value)} placeholder="180" disabled={tipo === "Terreno"} />
              </Field>
            </div>
          </Section>

          {tipo !== "Terreno" && (
            <Section icon={<Bed className="h-4 w-4" />} title="Estrutura">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Quartos"><Input type="number" value={quartos} onChange={(e) => setQuartos(e.target.value)} /></Field>
                <Field label="Banheiros"><Input type="number" value={banheiros} onChange={(e) => setBanheiros(e.target.value)} /></Field>
                <Field label="Suítes"><Input type="number" value={suites} onChange={(e) => setSuites(e.target.value)} /></Field>
                <Field label="Vagas garagem"><Input type="number" value={garagem} onChange={(e) => setGaragem(e.target.value)} /></Field>
              </div>
            </Section>
          )}

          <Section icon={<Sparkles className="h-4 w-4" />} title="Diferenciais">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {EXTRAS.map((ex) => (
                <CheckBox key={ex} label={ex} checked={extras.includes(ex)} onChange={() => toggleArr(ex, extras, setExtras)} />
              ))}
            </div>
          </Section>

          <Section icon={<Crown className="h-4 w-4" />} title="Padrão de acabamento">
            <ChipGroup options={ACABAMENTOS} value={acabamento} onChange={setAcabamento} />
          </Section>

          <Section icon={<CheckCircle2 className="h-4 w-4" />} title="Conservação">
            <ChipGroup options={CONSERVACAO} value={conservacao} onChange={setConservacao} />
          </Section>

          <Section icon={<FileText className="h-4 w-4" />} title="Documentação" last>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DOCUMENTACAO.map((d) => (
                <CheckBox key={d} label={d} checked={documentacao.includes(d)} onChange={() => toggleArr(d, documentacao, setDocumentacao)} />
              ))}
            </div>
          </Section>

          <Button
            onClick={handleCalculate}
            disabled={loading}
            size="lg"
            className="w-full mt-8 h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Calculando avaliação...</>
            ) : (
              <><Sparkles className="h-5 w-5 mr-2" /> Calcular Avaliação IA</>
            )}
          </Button>
        </Card>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              id="result-section"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 space-y-6"
            >
              <Card className="p-8 md:p-10 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-2xl shadow-primary/30 border-0 overflow-hidden relative">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_50%)]" />
                <div className="relative">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">
                    <Brain className="h-4 w-4" /> Valor estimado de mercado
                  </div>
                  <div className="text-5xl md:text-6xl font-bold mb-2 tracking-tight">{fmtBRL(result.valor_estimado)}</div>
                  <div className="text-sm opacity-90">
                    Faixa ideal: <span className="font-semibold">{fmtBRL(result.faixa_min)} – {fmtBRL(result.faixa_max)}</span>
                  </div>
                  {result.meta && (
                    <div className="mt-3 text-xs opacity-80">
                      Base: {fmtBRL(result.meta.preco_m2)}/m² · Ajuste líquido: {result.meta.ajuste_total_pct >= 0 ? "+" : ""}{result.meta.ajuste_total_pct}%
                    </div>
                  )}
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResultCard icon={<Zap className="h-5 w-5" />} label="Venda rápida" value={fmtBRL(result.venda_rapida)} desc="Para vender em até 30 dias" color="amber" />
                <ResultCard icon={<Crown className="h-5 w-5" />} label="Venda premium" value={fmtBRL(result.venda_premium)} desc="Para vendedor paciente" color="violet" />
                <ResultCard icon={<TrendingUp className="h-5 w-5" />} label="Potencial valorização" value={`+${result.potencial_valorizacao_pct}% a.a.`} desc="Valorização anual estimada" color="emerald" />
                <ResultCard icon={<Clock className="h-5 w-5" />} label="Tempo médio de venda" value={`${result.tempo_medio_venda_dias} dias`} desc="No preço de mercado" color="blue" />
              </div>

              {/* Breakdown */}
              {result.meta && result.meta.breakdown.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4 font-semibold">
                    <Target className="h-5 w-5 text-primary" /> Detalhamento dos ajustes aplicados
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {result.meta.breakdown.map((b, i) => (
                      <div key={i} className="flex justify-between text-sm py-1.5 px-3 rounded-lg bg-muted/50">
                        <span>{b.label}</span>
                        <span className={`font-semibold ${b.pct > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {b.pct > 0 ? "+" : ""}{b.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-5 w-5" /> Pontos fortes
                  </div>
                  <ul className="space-y-2">
                    {result.pontos_fortes.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm"><span className="text-emerald-600 dark:text-emerald-400">✓</span><span>{p}</span></li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-6 border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400 font-semibold">
                    <AlertCircle className="h-5 w-5" /> Pontos de atenção
                  </div>
                  <ul className="space-y-2">
                    {result.pontos_atencao.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm"><span className="text-amber-600 dark:text-amber-400">!</span><span>{p}</span></li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Comparáveis do mercado */}
              {result.meta?.market && result.meta.market.comparaveis > 0 && (
                <Card className="p-6 border-blue-500/20 bg-blue-500/5">
                  <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400 font-semibold">
                    <Target className="h-5 w-5" /> Comparativo com o mercado local
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Análise baseada em <span className="font-semibold text-foreground">{result.meta.market.comparaveis}</span> imóvel(is) similares cadastrados na região.
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-background/60">
                      <div className="text-xs text-muted-foreground">Dormitórios (média)</div>
                      <div className="text-lg font-bold">{result.meta.market.media_dormitorios}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-background/60">
                      <div className="text-xs text-muted-foreground">Banheiros (média)</div>
                      <div className="text-lg font-bold">{result.meta.market.media_banheiros}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-background/60">
                      <div className="text-xs text-muted-foreground">Área média</div>
                      <div className="text-lg font-bold">{result.meta.market.media_area_m2} m²</div>
                    </div>
                    <div className="p-3 rounded-lg bg-background/60">
                      <div className="text-xs text-muted-foreground">Preço médio</div>
                      <div className="text-lg font-bold">{fmtBRL(result.meta.market.media_preco)}</div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Sugestões de valorização */}
              {result.sugestoes_valorizacao && result.sugestoes_valorizacao.length > 0 && (
                <Card className="p-6 border-violet-500/20 bg-violet-500/5">
                  <div className="flex items-center gap-2 mb-4 text-violet-600 dark:text-violet-400 font-semibold">
                    <TrendingUp className="h-5 w-5" /> Sugestões de valorização
                  </div>
                  <ul className="space-y-2">
                    {result.sugestoes_valorizacao.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-violet-600 dark:text-violet-400">→</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <Card className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4 font-semibold">
                  <Brain className="h-5 w-5 text-primary" /> Análise técnica IA
                </div>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
                  {result.justificativa}
                </div>
              </Card>

              {/* Action buttons */}
              <Card className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                  <FileBadge className="h-5 w-5 text-primary" /> Laudo Profissional PDF
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Gere um laudo de 6 páginas pronto para impressão, envio ao cliente ou anexo em propostas.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button onClick={downloadLaudo} className="bg-primary hover:bg-primary/90">
                    <FileBadge className="h-4 w-4 mr-1.5" /> Gerar Laudo
                  </Button>
                  <Button variant="outline" onClick={printLaudo}>
                    <Printer className="h-4 w-4 mr-1.5" /> Imprimir
                  </Button>
                  <Button variant="outline" onClick={shareWhatsapp} className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950">
                    <Share2 className="h-4 w-4 mr-1.5" /> WhatsApp
                  </Button>
                  <Button variant="outline" onClick={shareEmail}>
                    <Mail className="h-4 w-4 mr-1.5" /> Email
                  </Button>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button variant="outline" size="lg" onClick={exportPdf}>
                  <Download className="h-4 w-4 mr-2" /> PDF Resumo
                </Button>
                <Button variant="outline" size="lg" onClick={generateAd}>
                  <Wand2 className="h-4 w-4 mr-2" /> Gerar anúncio IA
                </Button>
                <Button size="lg" onClick={handleCalculate} disabled={loading}>
                  <Sparkles className="h-4 w-4 mr-2" /> Recalcular
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-4 pb-8">
                ⚠️ Avaliação automatizada. Para fins de transação, consulte um avaliador credenciado.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Suas avaliações anteriores</DialogTitle></DialogHeader>
          <div className="max-h-[500px] overflow-y-auto space-y-2">
            {history.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma avaliação ainda.</p>
            ) : history.map((h) => (
              <Card key={h.id} className="p-4 hover:bg-muted/50">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="font-semibold">{h.tipo} — {h.bairro}, {h.cidade}/{h.estado}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {h.area_total}m² · {new Date(h.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{fmtBRL(Number(h.valor_estimado))}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ad dialog */}
      <Dialog open={adOpen} onOpenChange={setAdOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" /> Anúncio gerado por IA
            </DialogTitle>
          </DialogHeader>
          {adLoading ? (
            <div className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
          ) : adContent ? (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Título</Label>
                <div className="p-3 bg-muted rounded-lg font-semibold">{adContent.titulo}</div>
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <div className="p-3 bg-muted rounded-lg whitespace-pre-line text-sm">{adContent.descricao}</div>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(`${adContent.titulo}\n\n${adContent.descricao}`);
                  toast({ title: "Copiado!" });
                }}
              >
                Copiar tudo
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Section = ({ icon, title, children, last }: { icon: React.ReactNode; title: string; children: React.ReactNode; last?: boolean }) => (
  <div className={last ? "" : "mb-8 pb-8 border-b border-border/50"}>
    <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-foreground/80 uppercase tracking-wide">
      <span className="text-primary">{icon}</span>
      {title}
    </div>
    {children}
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const ChipGroup = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt} type="button" onClick={() => onChange(opt)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          value === opt
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105"
            : "bg-muted hover:bg-muted/70 text-foreground"
        }`}
      >{opt}</button>
    ))}
  </div>
);

const CheckBox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
  <label
    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
      checked ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/50"
    }`}
  >
    <Checkbox checked={checked} onCheckedChange={onChange} />
    <span className="text-sm font-medium">{label}</span>
  </label>
);

const colorMap: Record<string, string> = {
  amber: "from-amber-500/10 to-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-500/20",
  violet: "from-violet-500/10 to-violet-500/5 text-violet-700 dark:text-violet-400 border-violet-500/20",
  emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  blue: "from-blue-500/10 to-blue-500/5 text-blue-700 dark:text-blue-400 border-blue-500/20",
};

const ResultCard = ({ icon, label, value, desc, color }: { icon: React.ReactNode; label: string; value: string; desc: string; color: string }) => (
  <motion.div whileHover={{ y: -2 }}>
    <Card className={`p-5 bg-gradient-to-br ${colorMap[color]} border`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
        {icon} {label}
      </div>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </Card>
  </motion.div>
);
