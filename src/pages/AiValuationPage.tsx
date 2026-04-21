import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getMarketplaceTheme } from "@/lib/marketplaceThemes";
import { getMarketplaceThemeCssVars, getStoreThemeCssVars } from "@/lib/marketplaceThemeCssVars";
import { getStoreTheme } from "@/components/StoreThemePicker";
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
  AlertCircle, Loader2, Brain, MapPin, Home, Maximize2, Bed, FileText,
  Megaphone, Download, History, Wand2, FileBadge, Printer, Share2, Mail,
  Building2, Award, KeyRound,
} from "lucide-react";
import { generateValuationReport } from "@/lib/generateValuationReport";
import AdvancedValuationFields, { ADVANCED_INITIAL, type AdvancedState } from "@/components/AdvancedValuationFields";
import PhotoAnalysisStep, { type FotoItem, type AnaliseVisual } from "@/components/PhotoAnalysisStep";
import ApartmentValuationFields, { APARTMENT_INITIAL, type ApartmentState } from "@/components/ApartmentValuationFields";
import {
  TerrenoExtraFields, TERRENO_INITIAL, type TerrenoState,
  ComercialExtraFields, COMERCIAL_INITIAL, type ComercialState,
  RuralExtraFields, RURAL_INITIAL, type RuralState,
} from "@/components/DynamicStructureFields";
import {
  CATEGORIAS, type CategoriaImovel,
  getSubtiposByCategoria, getEstruturasBySubtipo, legacyTipoFromSubtipo,
} from "@/components/PropertyTaxonomy";
const EXTRAS = [
  "Quintal", "Piscina", "Área gourmet", "Varanda",
  "Vista", "Mobiliado", "Portaria", "Elevador", "Energia solar",
];
const ACABAMENTOS = ["Simples", "Médio", "Bom", "Alto padrão", "Luxo"];
const CONSERVACAO = ["Novo", "Reformado", "Bom estado", "Antigo", "Precisa reforma"];
const DOCUMENTACAO = ["Escritura ok", "Registro ok", "Averbação ok", "Financiável", "Pendências"];

type Comparavel = { titulo: string; bairro: string; area: number; quartos: number | null; preco: number };
type ComparavelExterno = { titulo: string; bairro?: string; cidade?: string; area?: number; quartos?: number; preco?: number; preco_m2?: number; fonte?: string; url?: string };
type MercadoExterno = {
  total: number;
  preco_medio: number;
  preco_mediano: number;
  preco_m2_medio: number;
  preco_m2_mediano: number;
  preco_provavel_fechamento: number;
  fontes_consultadas: string[];
  resumo: string;
  aviso?: string;
};
type Scores = { localizacao: number; estrutura: number; acabamento: number; diferenciais?: number; liquidez: number; documentacao: number };

type Valuation = {
  valor_estimado: number;
  faixa_min: number;
  faixa_max: number;
  venda_rapida: number;
  venda_premium: number;
  aluguel_estimado: number;
  potencial_valorizacao_pct: number;
  tempo_medio_venda_dias: number;
  justificativa: string;
  pontos_fortes: string[];
  pontos_atencao: string[];
  sugestoes_valorizacao: string[];
  scores: Scores;
  score_geral: number;
  comparaveis: Comparavel[];
  comparaveis_externos?: ComparavelExterno[];
  mercado_externo?: MercadoExterno | null;
  meta?: {
    preco_m2: number;
    source: string;
    valor_base: number;
    area_calc: number;
    area_construida_total: number;
    area_terreno: number;
    ajuste_total_pct: number;
    bonus_total_pct: number;
    desconto_total_pct: number;
    breakdown: Array<{ label: string; pct: number }>;
    externo?: { total: number; fontes: string[]; preco_m2_mediano: number } | null;
  };
};

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function AiValuationPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Localização
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [cep, setCep] = useState("");

  // Avaliador (persistido localmente para reuso)
  const [avaliadorNome, setAvaliadorNome] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("valuation_avaliador_nome") || "";
  });
  const [avaliadorCreci, setAvaliadorCreci] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("valuation_avaliador_creci") || "";
  });

  // Imóvel — taxonomia em cascata Categoria → Subtipo → Estrutura
  const [categoria, setCategoria] = useState<CategoriaImovel>("Residencial");
  const [subtipo, setSubtipo] = useState<string>("Casa");
  const [tipoEstrutura, setTipoEstrutura] = useState<string>("Térrea");
  // Tipo legado derivado do subtipo (compatível com edge function e módulos existentes)
  const tipo = legacyTipoFromSubtipo(subtipo);

  // Áreas
  const [areaTerreno, setAreaTerreno] = useState("");
  const [areaTerreo, setAreaTerreo] = useState("");
  const [areaSuperior, setAreaSuperior] = useState("");

  // Internos
  const [quartos, setQuartos] = useState("3");
  const [suites, setSuites] = useState("1");
  const [banheiros, setBanheiros] = useState("2");
  const [garagem, setGaragem] = useState("2");
  const [salas, setSalas] = useState("1");
  const [cozinhas, setCozinhas] = useState("1");
  const [escritorios, setEscritorios] = useState("0");

  const [extras, setExtras] = useState<string[]>([]);
  const [acabamento, setAcabamento] = useState("Médio");
  const [conservacao, setConservacao] = useState("Bom estado");
  const [documentacao, setDocumentacao] = useState<string[]>(["Escritura ok"]);

  // Modo avançado
  const [modoAvancado, setModoAvancado] = useState(false);
  const [adv, setAdv] = useState<AdvancedState>(ADVANCED_INITIAL);
  const updateAdv = <K extends keyof AdvancedState>(key: K, value: AdvancedState[K]) =>
    setAdv((s) => ({ ...s, [key]: value }));

  // Módulo Apartamento
  const [apt, setApt] = useState<ApartmentState>(APARTMENT_INITIAL);
  const updateApt = <K extends keyof ApartmentState>(key: K, value: ApartmentState[K]) =>
    setApt((s) => ({ ...s, [key]: value }));

  // Campos contextuais por tipo
  const [terrenoExtra, setTerrenoExtra] = useState<TerrenoState>(TERRENO_INITIAL);
  const [comercialExtra, setComercialExtra] = useState<ComercialState>(COMERCIAL_INITIAL);
  const [ruralExtra, setRuralExtra] = useState<RuralState>(RURAL_INITIAL);
  const updTerreno = <K extends keyof TerrenoState>(k: K, v: TerrenoState[K]) => setTerrenoExtra((s) => ({ ...s, [k]: v }));
  const updComercial = <K extends keyof ComercialState>(k: K, v: ComercialState[K]) => setComercialExtra((s) => ({ ...s, [k]: v }));
  const updRural = <K extends keyof RuralState>(k: K, v: RuralState[K]) => setRuralExtra((s) => ({ ...s, [k]: v }));

  const subtiposDisponiveis = getSubtiposByCategoria(categoria);
  const estruturasDisponiveis = getEstruturasBySubtipo(subtipo);

  const handleCategoriaChange = (novaCat: CategoriaImovel) => {
    setCategoria(novaCat);
    const subs = getSubtiposByCategoria(novaCat);
    const novoSub = subs[0] || "";
    setSubtipo(novoSub);
    const ests = getEstruturasBySubtipo(novoSub);
    setTipoEstrutura(ests[0] || "");
  };

  const handleSubtipoChange = (novoSub: string) => {
    setSubtipo(novoSub);
    const ests = getEstruturasBySubtipo(novoSub);
    setTipoEstrutura(ests[0] || "");
  };


  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Valuation | null>(null);

  // Análise visual por fotos
  const [fotos, setFotos] = useState<FotoItem[]>([]);
  const [analiseVisual, setAnaliseVisual] = useState<AnaliseVisual | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const [adOpen, setAdOpen] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [adContent, setAdContent] = useState<{ titulo: string; descricao: string } | null>(null);

  const { cities } = useCitiesByState(estado);

  const isTerreno = tipo === "Terreno";
  const areaConstruidaTotal = (Number(areaTerreo) || 0) + (Number(areaSuperior) || 0);
  // areaTotal compatível: para terreno usa areaTerreno; demais usa construída total ou terreno
  const areaTotalCompat = isTerreno
    ? Number(areaTerreno) || 0
    : (areaConstruidaTotal || Number(areaTerreno) || 0);

  const toggleArr = (val: string, arr: string[], setter: (v: string[]) => void) =>
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const handleCalculate = async () => {
    if (!estado || !cidade || !bairro) {
      toast({ title: "Preencha estado, cidade e bairro", variant: "destructive" });
      return;
    }
    if (!areaTotalCompat) {
      toast({ title: "Informe a área (terreno ou construída)", variant: "destructive" });
      return;
    }
    if (fotos.length < 1 || fotos.length > 10) {
      toast({
        title: "Fotos obrigatórias",
        description: `Envie entre 1 e 10 fotos do imóvel para gerar a avaliação. Atualmente: ${fotos.length}.`,
        variant: "destructive",
      });
      document.getElementById("photo-analysis-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (!analiseVisual) {
      toast({
        title: "Análise visual pendente",
        description: "Clique em 'Analisar fotos com IA' antes de calcular a avaliação.",
        variant: "destructive",
      });
      document.getElementById("photo-analysis-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const advancedPayload = modoAvancado ? {
        areaCobertaExterna: Number(adv.areaCobertaExterna) || null,
        areaUtil: Number(adv.areaUtil) || null,
        lavabos: Number(adv.lavabos) || 0,
        salaEstar: adv.salaEstar, salaJantar: adv.salaJantar, salaTv: adv.salaTv,
        copa: adv.copa, lavanderia: adv.lavanderia, areaServico: adv.areaServico,
        closet: adv.closet, despensa: adv.despensa, varandaInterna: adv.varandaInterna,
        bairroValorizado: adv.bairroValorizado, ruaTranquila: adv.ruaTranquila,
        proximoComercio: adv.proximoComercio, proximoEscola: adv.proximoEscola,
        proximoHospital: adv.proximoHospital, vistaPrivilegiada: adv.vistaPrivilegiada,
        areaRisco: adv.areaRisco,
        pisoQualidade: adv.pisoQualidade || null,
        banheiroQualidade: adv.banheiroQualidade || null,
        cozinhaQualidade: adv.cozinhaQualidade || null,
        pinturaQualidade: adv.pinturaQualidade || null,
        esquadriasQualidade: adv.esquadriasQualidade || null,
        telhadoQualidade: adv.telhadoQualidade || null,
        eletricaQualidade: adv.eletricaQualidade || null,
        habiteSe: adv.habiteSe, financiavel: adv.financiavel, semPendencias: adv.semPendencias,
        liquidezMercado: adv.liquidezMercado || null,
      } : {};

      const { data, error } = await supabase.functions.invoke("ai-property-valuation", {
        body: {
          estado, cidade, bairro, rua, numero, cep,
          categoria, subtipo,
          tipo, tipoEstrutura: isTerreno ? null : tipoEstrutura,
          areaTotal: areaTotalCompat,
          areaTerreno: Number(areaTerreno) || null,
          areaConstruidaTerreo: Number(areaTerreo) || null,
          areaConstruidaSuperior: Number(areaSuperior) || null,
          areaConstruida: areaConstruidaTotal || null,
          quartos: Number(quartos), banheiros: Number(banheiros),
          suites: Number(suites), garagem: Number(garagem),
          salas: Number(salas), cozinhas: Number(cozinhas), escritorios: Number(escritorios),
          extras, acabamento, conservacao, documentacao,
          modoAvaliacao: modoAvancado ? "avancado" : "simples",
          ...(tipo === "Terreno" ? {
            terrenoFrente: Number(terrenoExtra.frente) || null,
            terrenoLaterais: Number(terrenoExtra.laterais) || null,
            terrenoTopografia: terrenoExtra.topografia || null,
            terrenoZoneamento: terrenoExtra.zoneamento || null,
          } : {}),
          ...(tipo === "Comercial" ? {
            fluxoPessoas: comercialExtra.fluxoPessoas || null,
            vitrine: comercialExtra.vitrine,
            peDireito: Number(comercialExtra.peDireito) || null,
            docas: comercialExtra.docas,
            estacionamento: comercialExtra.estacionamento,
          } : {}),
          ...(tipo === "Rural" ? {
            hectares: Number(ruralExtra.hectares) || null,
            aguaAbundante: ruralExtra.aguaAbundante,
            energia: ruralExtra.energia,
            curral: ruralExtra.curral,
            soloProdutivo: ruralExtra.soloProdutivo,
            acessoAsfalto: ruralExtra.acessoAsfalto,
          } : {}),
          ...advancedPayload,
          ...(tipo === "Apartamento" ? {
            andarUnidade: Number(apt.andarUnidade) || null,
            totalAndaresPredio: Number(apt.totalAndaresPredio) || null,
            possuiElevador: apt.possuiElevador,
            qtdElevadores: Number(apt.qtdElevadores) || null,
            elevadorModerno: apt.elevadorModerno,
            condominioGrande: apt.condominioGrande,
            escadasLargas: apt.escadasLargas,
            vagasGaragem: Number(apt.vagasGaragem) || 0,
            portaria24h: apt.portaria24h,
            lazerCompleto: apt.lazerCompleto,
            taxaCondominio: Number(apt.taxaCondominio) || null,
            vistaLivre: apt.vistaLivre,
            solManha: apt.solManha,
            solTarde: apt.solTarde,
            barulhoExterno: apt.barulhoExterno,
            acessibilidade: apt.acessibilidade,
            publicoIdoso: apt.publicoIdoso,
            ultimoAndar: apt.ultimoAndar,
            garden: apt.garden,
          } : {}),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      // Aplicar ajuste da análise visual (se houver)
      let finalResult = data as Valuation;
      if (analiseVisual) {
        const ajustePct = analiseVisual.ajuste_total_pct;
        const fator = 1 + ajustePct / 100;
        const round = (n: number) => Math.round(n);
        finalResult = {
          ...finalResult,
          valor_estimado: round(finalResult.valor_estimado * fator),
          faixa_min: round(finalResult.faixa_min * fator),
          faixa_max: round(finalResult.faixa_max * fator),
          venda_rapida: round(finalResult.venda_rapida * fator),
          venda_premium: round(finalResult.venda_premium * fator),
          aluguel_estimado: round(finalResult.aluguel_estimado * fator),
          meta: finalResult.meta ? {
            ...finalResult.meta,
            ajuste_total_pct: (finalResult.meta.ajuste_total_pct || 0) + ajustePct,
              breakdown: [
                ...(finalResult.meta.breakdown || []),
                { label: `Análise visual por fotos (${analiseVisual.total_fotos_analisadas} foto${analiseVisual.total_fotos_analisadas > 1 ? "s" : ""})`, pct: Number(ajustePct.toFixed(1)) },
              ],
          } : finalResult.meta,
        };
      }

      setResult(finalResult);
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
      .select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(50);
    setHistory(data || []);
  };

  const buildLaudo = () => {
    if (!result) return null;
    return generateValuationReport({
      estado, cidade, bairro,
      rua: rua ? `${rua}${numero ? `, ${numero}` : ""}` : rua,
      cep, tipo, tipoEstrutura: isTerreno ? undefined : tipoEstrutura,
      areaTerreno, areaTerreo, areaSuperior,
      areaConstruidaTotal,
      quartos, banheiros, suites, garagem,
      salas, cozinhas, escritorios,
      extras, acabamento, conservacao, documentacao,
      result: {
        ...result,
        comparaveis_externos: result.comparaveis_externos,
        mercado_externo: result.mercado_externo,
      },
      analiseVisual: analiseVisual ?? undefined,
      avaliadorNome:
        avaliadorNome.trim() ||
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "Sistema IA Capimobi",
      avaliadorCreci: avaliadorCreci.trim() || undefined,
      avaliadorEmail: user?.email,
      empresaNome: "CAPIMOBI",
    });
  };

  const downloadLaudo = () => {
    const doc = buildLaudo();
    if (!doc) return;
    doc.save(`laudo-avaliacao-${bairro.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`);
    toast({ title: "Laudo PDF gerado!" });
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
    const msg = `📋 *Avaliação Imobiliária*\n\n🏠 ${tipo} em ${bairro}, ${cidade}/${estado}\n📐 ${areaConstruidaTotal || areaTotalCompat}m²\n\n💰 *Valor estimado:* ${fmtBRL(result.valor_estimado)}\n📊 Faixa: ${fmtBRL(result.faixa_min)} – ${fmtBRL(result.faixa_max)}\n⚡ Venda rápida: ${fmtBRL(result.venda_rapida)}\n👑 Venda premium: ${fmtBRL(result.venda_premium)}\n🏷 Aluguel estimado: ${fmtBRL(result.aluguel_estimado)}/mês\n⏱ Tempo médio: ${result.tempo_medio_venda_dias} dias\n⭐ Score geral: ${result.score_geral}/10\n\n_Capimobi IA_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareEmail = () => {
    if (!result) return;
    const subject = `Avaliação - ${tipo} em ${bairro}, ${cidade}`;
    const body = `${tipo} em ${bairro}, ${cidade}/${estado}\n\nValor estimado: ${fmtBRL(result.valor_estimado)}\nFaixa: ${fmtBRL(result.faixa_min)} – ${fmtBRL(result.faixa_max)}\nVenda rápida: ${fmtBRL(result.venda_rapida)}\nVenda premium: ${fmtBRL(result.venda_premium)}\nAluguel estimado: ${fmtBRL(result.aluguel_estimado)}/mês\nTempo médio: ${result.tempo_medio_venda_dias} dias\nScore: ${result.score_geral}/10\n\n${result.justificativa}\n\n— Capimobi IA`;
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
          estado, cidade, bairro, tipo,
          areaTotal: areaTotalCompat, areaConstruida: areaConstruidaTotal || null,
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
              <Brain className="h-4 w-4" /> Avaliação Profissional IA
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" /> AVALIAÇÃO PROFISSIONAL
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Quanto vale seu imóvel?
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cálculo comparativo real, score profissional, parecer técnico e laudo PDF de 6 páginas.
          </p>
        </motion.div>

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
              <Field label="CEP (opcional)">
                <Input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" />
              </Field>
              <Field label="Rua (opcional)">
                <Input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Nome da rua" />
              </Field>
              <Field label="Número (opcional)">
                <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: 123" />
              </Field>
            </div>
          </Section>

          <Section icon={<Home className="h-4 w-4" />} title="Categoria do imóvel">
            <ChipGroup options={CATEGORIAS as unknown as string[]} value={categoria} onChange={(v) => handleCategoriaChange(v as CategoriaImovel)} />
          </Section>

          {subtiposDisponiveis.length > 0 && (
            <Section icon={<Building2 className="h-4 w-4" />} title="Subtipo">
              <ChipGroup options={subtiposDisponiveis} value={subtipo} onChange={handleSubtipoChange} />
            </Section>
          )}

          {estruturasDisponiveis.length > 0 && (
            <Section icon={<Building2 className="h-4 w-4" />} title="Tipo de estrutura">
              <ChipGroup options={estruturasDisponiveis} value={tipoEstrutura} onChange={setTipoEstrutura} />
            </Section>
          )}

          {tipo === "Apartamento" && (
            <Section icon={<Building2 className="h-4 w-4" />} title="Dados específicos do apartamento">
              <ApartmentValuationFields state={apt} onChange={updateApt} />
            </Section>
          )}

          {tipo === "Terreno" && (
            <Section icon={<Maximize2 className="h-4 w-4" />} title="Dados específicos do terreno">
              <TerrenoExtraFields state={terrenoExtra} onChange={updTerreno} />
            </Section>
          )}

          {tipo === "Comercial" && (
            <Section icon={<Building2 className="h-4 w-4" />} title="Dados específicos comerciais">
              <ComercialExtraFields state={comercialExtra} onChange={updComercial} />
            </Section>
          )}

          {tipo === "Rural" && (
            <Section icon={<Sparkles className="h-4 w-4" />} title="Dados específicos rurais">
              <RuralExtraFields state={ruralExtra} onChange={updRural} />
            </Section>
          )}

          <Section icon={<Maximize2 className="h-4 w-4" />} title="Tamanho">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Área terreno (m²)">
                <Input type="number" value={areaTerreno} onChange={(e) => setAreaTerreno(e.target.value)} placeholder="250" />
              </Field>
              {!isTerreno && (
                <>
                  <Field label="Construída térreo (m²)">
                    <Input type="number" value={areaTerreo} onChange={(e) => setAreaTerreo(e.target.value)} placeholder="120" />
                  </Field>
                  <Field label="Construída superior (m²)">
                    <Input type="number" value={areaSuperior} onChange={(e) => setAreaSuperior(e.target.value)} placeholder="60" />
                  </Field>
                </>
              )}
            </div>
            {!isTerreno && areaConstruidaTotal > 0 && (
              <div className="mt-3 text-xs text-muted-foreground">
                Área construída total automática: <span className="font-bold text-foreground">{areaConstruidaTotal} m²</span>
              </div>
            )}
          </Section>

          {!isTerreno && (
            <Section icon={<Bed className="h-4 w-4" />} title="Estrutura interna">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Dormitórios"><Input type="number" value={quartos} onChange={(e) => setQuartos(e.target.value)} /></Field>
                <Field label="Suítes"><Input type="number" value={suites} onChange={(e) => setSuites(e.target.value)} /></Field>
                <Field label="Banheiros"><Input type="number" value={banheiros} onChange={(e) => setBanheiros(e.target.value)} /></Field>
                <Field label="Vagas garagem"><Input type="number" value={garagem} onChange={(e) => setGaragem(e.target.value)} /></Field>
                <Field label="Salas"><Input type="number" value={salas} onChange={(e) => setSalas(e.target.value)} /></Field>
                <Field label="Cozinhas"><Input type="number" value={cozinhas} onChange={(e) => setCozinhas(e.target.value)} /></Field>
                <Field label="Escritórios"><Input type="number" value={escritorios} onChange={(e) => setEscritorios(e.target.value)} /></Field>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DOCUMENTACAO.map((d) => (
                <CheckBox key={d} label={d} checked={documentacao.includes(d)} onChange={() => toggleArr(d, documentacao, setDocumentacao)} />
              ))}
            </div>
          </Section>

          <div id="photo-analysis-section" className="mt-6">
            <PhotoAnalysisStep
              contexto={{
                tipo, cidade, bairro,
                acabamentoDeclarado: acabamento,
                conservacaoDeclarada: conservacao,
              }}
              fotos={fotos}
              onFotosChange={setFotos}
              analise={analiseVisual}
              onAnaliseChange={setAnaliseVisual}
            />
          </div>

          <Button
            onClick={handleCalculate}
            disabled={loading}
            size="lg"
            className="w-full mt-8 h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Calculando avaliação...</>
            ) : (
              <><Sparkles className="h-5 w-5 mr-2" /> Calcular Avaliação Profissional{analiseVisual ? " + Visual" : ""}</>
            )}
          </Button>
        </Card>

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
                    <Brain className="h-4 w-4" /> Valor justo de mercado
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

              {/* Resultados financeiros */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ResultCard icon={<Zap className="h-5 w-5" />} label="Venda rápida" value={fmtBRL(result.venda_rapida)} desc="30-60 dias" color="amber" />
                <ResultCard icon={<Crown className="h-5 w-5" />} label="Venda premium" value={fmtBRL(result.venda_premium)} desc="Vendedor paciente" color="violet" />
                <ResultCard icon={<KeyRound className="h-5 w-5" />} label="Aluguel estimado" value={`${fmtBRL(result.aluguel_estimado)}/mês`} desc="Renda mensal potencial" color="emerald" />
                <ResultCard icon={<Clock className="h-5 w-5" />} label="Tempo médio venda" value={`${result.tempo_medio_venda_dias} dias`} desc="No preço justo" color="blue" />
              </div>

              {/* Score profissional */}
              <Card className="p-6 md:p-8 bg-gradient-to-br from-card to-card/50 border-primary/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 font-semibold">
                    <Award className="h-5 w-5 text-primary" /> Score Profissional
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-primary">{result.score_geral}</span>
                    <span className="text-sm text-muted-foreground">/10</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <ScoreItem label="Localização" value={result.scores.localizacao} />
                  <ScoreItem label="Estrutura" value={result.scores.estrutura} />
                  <ScoreItem label="Acabamento" value={result.scores.acabamento} />
                  <ScoreItem label="Liquidez" value={result.scores.liquidez} />
                  <ScoreItem label="Documentação" value={result.scores.documentacao} />
                </div>
              </Card>

              {/* Detalhamento ajustes */}
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

              {/* Pontos fortes / atenção */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.pontos_fortes.length > 0 && (
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
                )}
                {result.pontos_atencao.length > 0 && (
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
                )}
              </div>

              {/* Mercado externo: anúncios reais da internet */}
              {result.mercado_externo && (
                <Card className="p-6 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <Target className="h-5 w-5" /> Anúncios reais da internet
                    </div>
                    <div className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium">
                      {result.mercado_externo.total > 0 ? `${result.mercado_externo.total} anúncio(s)` : "sem anúncios válidos"}
                    </div>
                  </div>

                  {result.mercado_externo.fontes_consultadas?.length > 0 && (
                    <div className="text-xs text-muted-foreground mb-3">
                      Fontes consultadas:{" "}
                      <span className="font-medium text-foreground">
                        {result.mercado_externo.fontes_consultadas.join(" · ")}
                      </span>
                    </div>
                  )}

                  {result.mercado_externo.resumo && (
                    <p className="text-sm text-muted-foreground italic mb-4">"{result.mercado_externo.resumo}"</p>
                  )}

                  {result.mercado_externo.total > 0 ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <Stat label="Preço médio" value={fmtBRL(result.mercado_externo.preco_medio)} />
                        <Stat label="Preço mediano" value={fmtBRL(result.mercado_externo.preco_mediano)} />
                        <Stat label="R$/m² mediano" value={fmtBRL(result.mercado_externo.preco_m2_mediano)} />
                        <Stat label="Provável fechamento" value={fmtBRL(result.mercado_externo.preco_provavel_fechamento)} />
                      </div>

                      {result.comparaveis_externos && result.comparaveis_externos.length > 0 && (
                        <>
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Anúncios encontrados
                          </div>
                          <div className="space-y-2">
                            {result.comparaveis_externos.map((c, i) => (
                              <div key={i} className="flex justify-between items-center gap-3 p-3 rounded-lg bg-background/60 text-sm">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    {c.fonte && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                        {c.fonte}
                                      </span>
                                    )}
                                    {c.url ? (
                                      <a
                                        href={c.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium truncate hover:underline text-emerald-700 dark:text-emerald-300"
                                      >
                                        {c.titulo}
                                      </a>
                                    ) : (
                                      <span className="font-medium truncate">{c.titulo}</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {c.area ? `${c.area}m²` : ""}
                                    {c.quartos ? ` · ${c.quartos} dorm.` : ""}
                                    {c.bairro ? ` · ${c.bairro}` : ""}
                                    {c.preco_m2 ? ` · ${fmtBRL(c.preco_m2)}/m²` : ""}
                                  </div>
                                </div>
                                {c.preco ? (
                                  <div className="font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                    {fmtBRL(c.preco)}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <p className="text-[10px] text-muted-foreground mt-3 italic">
                        Fontes: dados públicos extraídos via busca web. Preços podem variar — sempre confirme no anúncio original.
                      </p>
                    </>
                  ) : (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-3 text-sm text-amber-700 dark:text-amber-300">
                      {result.mercado_externo.aviso || "Não foram encontrados anúncios externos confiáveis para este subtipo com os filtros atuais."}
                    </div>
                  )}
                </Card>
              )}


              {/* Sugestões */}
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

              {/* Parecer técnico */}
              <Card className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4 font-semibold">
                  <Brain className="h-5 w-5 text-primary" /> Parecer técnico
                </div>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
                  {result.justificativa}
                </div>
              </Card>

              {/* Ações laudo */}
              <Card className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                  <FileBadge className="h-5 w-5 text-primary" /> Laudo Profissional PDF
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Gere um laudo de 6 páginas pronto para impressão, envio ao cliente ou anexo em propostas.
                </p>

                {/* Identificação do avaliador */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-background/60 border border-border/40">
                  <div className="space-y-1">
                    <Label htmlFor="avaliador-nome" className="text-xs flex items-center gap-1.5">
                      <Award className="h-3 w-3 text-primary" /> Nome do avaliador
                    </Label>
                    <Input
                      id="avaliador-nome"
                      value={avaliadorNome}
                      onChange={(e) => {
                        const v = e.target.value.slice(0, 100);
                        setAvaliadorNome(v);
                        if (typeof window !== "undefined") localStorage.setItem("valuation_avaliador_nome", v);
                      }}
                      placeholder="Ex: João Silva"
                      maxLength={100}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="avaliador-creci" className="text-xs flex items-center gap-1.5">
                      <KeyRound className="h-3 w-3 text-primary" /> CRECI
                    </Label>
                    <Input
                      id="avaliador-creci"
                      value={avaliadorCreci}
                      onChange={(e) => {
                        const v = e.target.value.slice(0, 30);
                        setAvaliadorCreci(v);
                        if (typeof window !== "undefined") localStorage.setItem("valuation_avaliador_creci", v);
                      }}
                      placeholder="Ex: CRECI 12345-F"
                      maxLength={30}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    {h.score_geral && <div className="text-xs text-muted-foreground">Score {h.score_geral}/10</div>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 rounded-lg bg-background/60">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-lg font-bold">{value}</div>
  </div>
);

const ScoreItem = ({ label, value }: { label: string; value: number }) => {
  const color = value >= 8 ? "text-emerald-600" : value >= 6 ? "text-blue-600" : value >= 4 ? "text-amber-600" : "text-rose-600";
  const barColor = value >= 8 ? "bg-emerald-500" : value >= 6 ? "bg-blue-500" : value >= 4 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-sm font-bold ${color}`}>{value}<span className="text-xs opacity-60">/10</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${(value / 10) * 100}%` }} />
      </div>
    </div>
  );
};
