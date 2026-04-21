import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { BRAZIL_STATES } from "@/data/brazilStates";
import { useCitiesByState } from "@/hooks/useCitiesByState";
import { Sparkles, ArrowLeft, TrendingUp, Clock, Crown, Zap, Target, CheckCircle2, AlertCircle, Loader2, Brain, MapPin, Home, Maximize2, Bed } from "lucide-react";

const TIPOS = ["Casa", "Apartamento", "Terreno", "Comercial", "Rural"];
const EXTRAS = ["Quintal", "Piscina", "Área gourmet", "Varanda", "Vista privilegiada", "Portaria"];
const ACABAMENTOS = ["Simples", "Médio", "Alto padrão", "Luxo"];
const ESTADOS_CONS = ["Novo", "Reformado", "Bom", "Antigo", "Precisa reforma"];

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
};

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function AiValuationPage() {
  const { toast } = useToast();
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [rua, setRua] = useState("");
  const [tipo, setTipo] = useState("Casa");
  const [areaTotal, setAreaTotal] = useState("");
  const [areaConstruida, setAreaConstruida] = useState("");
  const [quartos, setQuartos] = useState("3");
  const [banheiros, setBanheiros] = useState("2");
  const [suites, setSuites] = useState("1");
  const [garagem, setGaragem] = useState("2");
  const [extras, setExtras] = useState<string[]>([]);
  const [acabamento, setAcabamento] = useState("Médio");
  const [estadoCons, setEstadoCons] = useState("Bom");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Valuation | null>(null);

  const { cities } = useCitiesByState(estado);

  const toggleExtra = (e: string) =>
    setExtras((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));

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
          estado, cidade, bairro, rua, tipo,
          areaTotal: Number(areaTotal),
          areaConstruida: Number(areaConstruida) || null,
          quartos: Number(quartos), banheiros: Number(banheiros),
          suites: Number(suites), garagem: Number(garagem),
          extras, acabamento, estado_conservacao: estadoCons,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/painel" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" /> Voltar ao painel
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Brain className="h-4 w-4" /> Powered by IA
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" /> AVALIAÇÃO INTELIGENTE
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Quanto vale seu imóvel?
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Nossa IA analisa mercado, localização e características para entregar uma avaliação profissional em segundos.
          </p>
        </motion.div>

        {/* Form */}
        <Card className="p-6 md:p-8 shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
          {/* Localização */}
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
            </div>
          </Section>

          {/* Tipo */}
          <Section icon={<Home className="h-4 w-4" />} title="Tipo de imóvel">
            <ChipGroup options={TIPOS} value={tipo} onChange={setTipo} />
          </Section>

          {/* Tamanho */}
          <Section icon={<Maximize2 className="h-4 w-4" />} title="Tamanho">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Área total (m²) *">
                <Input type="number" value={areaTotal} onChange={(e) => setAreaTotal(e.target.value)} placeholder="250" />
              </Field>
              <Field label="Área construída (m²)">
                <Input type="number" value={areaConstruida} onChange={(e) => setAreaConstruida(e.target.value)} placeholder="180" />
              </Field>
            </div>
          </Section>

          {/* Estrutura */}
          <Section icon={<Bed className="h-4 w-4" />} title="Estrutura">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Quartos"><Input type="number" value={quartos} onChange={(e) => setQuartos(e.target.value)} /></Field>
              <Field label="Banheiros"><Input type="number" value={banheiros} onChange={(e) => setBanheiros(e.target.value)} /></Field>
              <Field label="Suítes"><Input type="number" value={suites} onChange={(e) => setSuites(e.target.value)} /></Field>
              <Field label="Garagem"><Input type="number" value={garagem} onChange={(e) => setGaragem(e.target.value)} /></Field>
            </div>
          </Section>

          {/* Extras */}
          <Section icon={<Sparkles className="h-4 w-4" />} title="Extras">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {EXTRAS.map((ex) => (
                <label
                  key={ex}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                    extras.includes(ex)
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Checkbox checked={extras.includes(ex)} onCheckedChange={() => toggleExtra(ex)} />
                  <span className="text-sm font-medium">{ex}</span>
                </label>
              ))}
            </div>
          </Section>

          {/* Acabamento */}
          <Section icon={<Crown className="h-4 w-4" />} title="Padrão de acabamento">
            <ChipGroup options={ACABAMENTOS} value={acabamento} onChange={setAcabamento} />
          </Section>

          {/* Estado */}
          <Section icon={<CheckCircle2 className="h-4 w-4" />} title="Estado de conservação" last>
            <ChipGroup options={ESTADOS_CONS} value={estadoCons} onChange={setEstadoCons} />
          </Section>

          {/* CTA */}
          <Button
            onClick={handleCalculate}
            disabled={loading}
            size="lg"
            className="w-full mt-8 h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Analisando dados de mercado...</>
            ) : (
              <><Sparkles className="h-5 w-5" /> Calcular Valor com IA</>
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
              {/* Valor estimado hero */}
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
                </div>
              </Card>

              {/* Strategy cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResultCard icon={<Zap className="h-5 w-5" />} label="Venda rápida" value={fmtBRL(result.venda_rapida)} desc="Para vender em até 30 dias" color="amber" />
                <ResultCard icon={<Crown className="h-5 w-5" />} label="Venda premium" value={fmtBRL(result.venda_premium)} desc="Para vendedor paciente" color="violet" />
                <ResultCard icon={<TrendingUp className="h-5 w-5" />} label="Potencial valorização" value={`+${result.potencial_valorizacao_pct}% a.a.`} desc="Valorização anual estimada" color="emerald" />
                <ResultCard icon={<Clock className="h-5 w-5" />} label="Tempo médio de venda" value={`${result.tempo_medio_venda_dias} dias`} desc="No preço de mercado" color="blue" />
              </div>

              {/* Strengths & Attention */}
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

              {/* Justificativa */}
              <Card className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4 font-semibold">
                  <Target className="h-5 w-5 text-primary" /> Análise técnica da IA
                </div>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
                  {result.justificativa}
                </div>
              </Card>

              <div className="text-xs text-muted-foreground text-center pt-4 pb-8">
                ⚠️ Avaliação automatizada baseada em IA. Para fins de transação, consulte um avaliador credenciado.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          value === opt
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105"
            : "bg-muted hover:bg-muted/70 text-foreground"
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
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
