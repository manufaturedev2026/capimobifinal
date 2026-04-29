import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  Building2, Award, KeyRound, Trash2, Search, Settings2, ChevronDown, ChevronUp,
  MapPinned,
} from "lucide-react";
import { generateValuationReport, getLaudoCode } from "@/lib/generateValuationReport";
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
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();

  // Modal de créditos IA insuficientes (mensagem didática, não tratar como erro)
  const [creditsModal, setCreditsModal] = useState<{ open: boolean; balance: number; required: number }>({
    open: false, balance: 0, required: 0,
  });

  // Tema visual (segue o tema da loja do usuário ou o tema do marketplace)
  const [marketplaceThemeId, setMarketplaceThemeId] = useState(
    () => localStorage.getItem("marketplace_theme") || "azul"
  );
  useEffect(() => {
    supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "homepage_theme")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          setMarketplaceThemeId(data.value);
          localStorage.setItem("marketplace_theme", data.value);
        }
      });
  }, []);
  const brokerStoreThemeId = (profile as any)?.store_theme as string | undefined;
  const hasBrokerTheme = !!brokerStoreThemeId && brokerStoreThemeId !== "default";
  const themeVars = hasBrokerTheme
    ? getStoreThemeCssVars(getStoreTheme(brokerStoreThemeId!))
    : getMarketplaceThemeCssVars(getMarketplaceTheme(marketplaceThemeId));

  // Localização
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [cep, setCep] = useState("");
  const [nomeImovel, setNomeImovel] = useState("");
  const [complemento, setComplemento] = useState("");
  const [referencia, setReferencia] = useState("");
  const [measuredPropertyId, setMeasuredPropertyId] = useState<string | null>(null);

  // Avaliador (persistido localmente para reuso)
  const [avaliadorNome, setAvaliadorNome] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("valuation_avaliador_nome") || "";
  });
  const [avaliadorCreci, setAvaliadorCreci] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("valuation_avaliador_creci") || "";
  });
  const [avaliadorCnai, setAvaliadorCnai] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("valuation_avaliador_cnai") || "";
  });
  const [avaliadorEmail, setAvaliadorEmail] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("valuation_avaliador_email") || "";
  });

  // Dados opcionais (proprietário + finalidade + infraestrutura)
  const [propNome, setPropNome] = useState("");
  const [propCpf, setPropCpf] = useState("");
  const [propTelefone, setPropTelefone] = useState("");
  const [propEmail, setPropEmail] = useState("");
  const [finalidade, setFinalidade] = useState("");
  const [infraEscola, setInfraEscola] = useState(false);
  const [infraHospital, setInfraHospital] = useState(false);
  const [infraComercio, setInfraComercio] = useState(false);
  const [infraTransporte, setInfraTransporte] = useState(false);
  const [infraParque, setInfraParque] = useState(false);
  const [infraBancos, setInfraBancos] = useState(false);

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
  const [valorPedido, setValorPedido] = useState("");
  const [iptu, setIptu] = useState("");
  const [condominio, setCondominio] = useState("");

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

  // Mantém a posição visual estável quando o conteúdo acima
  // (campos contextuais por tipo) aparece ou desaparece.
  const preserveScroll = (anchorEl: HTMLElement | null, action: () => void) => {
    const beforeTop = anchorEl?.getBoundingClientRect().top ?? null;
    action();
    if (anchorEl && beforeTop !== null) {
      requestAnimationFrame(() => {
        const afterTop = anchorEl.getBoundingClientRect().top;
        const delta = afterTop - beforeTop;
        if (Math.abs(delta) > 1) window.scrollBy({ top: delta, left: 0, behavior: "auto" });
      });
    }
  };

  const handleCategoriaChange = (novaCat: CategoriaImovel, anchor?: HTMLElement | null) => {
    preserveScroll(anchor ?? null, () => {
      setCategoria(novaCat);
    const subs = getSubtiposByCategoria(novaCat);
    const novoSub = subs[0] || "";
    setSubtipo(novoSub);
    const ests = getEstruturasBySubtipo(novoSub);
    setTipoEstrutura(ests[0] || "");
    });
  };

  const handleSubtipoChange = (novoSub: string, anchor?: HTMLElement | null) => {
    preserveScroll(anchor ?? null, () => {
      setSubtipo(novoSub);
      const ests = getEstruturasBySubtipo(novoSub);
      setTipoEstrutura(ests[0] || "");
    });
  };


  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Valuation | null>(null);
  const [currentValuationId, setCurrentValuationId] = useState<string | null>(null);

  // Análise visual por fotos
  const [fotos, setFotos] = useState<FotoItem[]>([]);
  const [analiseVisual, setAnaliseVisual] = useState<AnaliseVisual | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [adOpen, setAdOpen] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [adContent, setAdContent] = useState<{ titulo: string; descricao: string } | null>(null);

  const [cepLoading, setCepLoading] = useState(false);

  const { cities } = useCitiesByState(estado);

  const handleBuscarCep = async () => {
    const onlyDigits = cep.replace(/\D/g, "");
    if (onlyDigits.length !== 8) {
      toast({ title: "CEP inválido", description: "Digite o CEP com 8 dígitos.", variant: "destructive" });
      return;
    }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${onlyDigits}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast({ title: "CEP não encontrado", description: "Verifique o CEP digitado.", variant: "destructive" });
        return;
      }
      const formatted = `${onlyDigits.slice(0, 5)}-${onlyDigits.slice(5)}`;
      setCep(formatted);
      if (data.uf) setEstado(data.uf);
      if (data.localidade) setCidade(data.localidade);
      if (data.bairro) setBairro(data.bairro);
      if (data.logradouro) setRua(data.logradouro);
      toast({ title: "Endereço encontrado", description: `${data.logradouro || ""}${data.bairro ? " - " + data.bairro : ""}, ${data.localidade}/${data.uf}` });
    } catch (e) {
      toast({ title: "Erro ao buscar CEP", description: "Tente novamente em instantes.", variant: "destructive" });
    } finally {
      setCepLoading(false);
    }
  };

  useEffect(() => {
    const propertyId = searchParams.get("imovel");
    const raw = sessionStorage.getItem("meter_property_for_valuation");
    if (!propertyId || !raw) return;
    try {
      const payload = JSON.parse(raw);
      const property = payload.property || {};
      if (property.id !== propertyId) return;
      setMeasuredPropertyId(property.id || null);
      setNomeImovel(property.name || "");
      setCep(property.cep || "");
      setRua(property.street || property.address || "");
      setNumero(property.number || "");
      setComplemento(property.complement || "");
      setReferencia(property.reference_point || "");
      setBairro(property.neighborhood || "");
      setCidade(property.city || "");
      setEstado(property.state || "");
      setAreaTerreno(String(payload.areas?.landArea || property.land_area_manual || ""));
      setAreaTerreo(String(payload.areas?.builtArea || property.total_area || ""));
      setQuartos(String(property.bedrooms || "0"));
      setBanheiros(String(property.bathrooms || "0"));
      setGaragem(String(property.parking_spaces || "0"));
      setValorPedido(property.asking_price?.toString?.() || "");
      setIptu(property.iptu?.toString?.() || "");
      setCondominio(property.condominium_fee?.toString?.() || "");
      setFotos((payload.photos || []).slice(0, 10).map((photo: any) => ({ id: photo.id || crypto.randomUUID(), file: new File([], "foto-medidor.jpg", { type: "image/jpeg" }), dataUrl: photo.image_url, categoria: "outro" as const })));
      toast({ title: "Imóvel importado do Medidor", description: "Dados, medidas e fotos foram enviados para o Avaliador." });
    } catch {}
  }, [searchParams, toast]);

  const isTerreno = tipo === "Terreno";
  const areaConstruidaTotal = (Number(areaTerreo) || 0) + (Number(areaSuperior) || 0);
  // areaTotal compatível: para terreno usa areaTerreno; demais usa construída total ou terreno
  const areaTotalCompat = isTerreno
    ? Number(areaTerreno) || 0
    : (areaConstruidaTotal || Number(areaTerreno) || 0);

  const toggleArr = (val: string, arr: string[], setter: (v: string[]) => void) =>
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const handleCalculate = async () => {
    if (!nomeImovel.trim() || !estado || !cidade || !bairro || !cep.trim() || !rua.trim() || !numero.trim()) {
      toast({ title: "Preencha os dados obrigatórios", description: "Nome do imóvel, CEP, rua, número, bairro, cidade e estado são obrigatórios.", variant: "destructive" });
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
    setCurrentValuationId(null);
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
          nomeImovel, complemento, referencia, measuredPropertyId,
          categoria, subtipo,
          tipo, tipoEstrutura: isTerreno ? null : tipoEstrutura,
          areaTotal: areaTotalCompat,
          areaTerreno: Number(areaTerreno) || null,
          areaConstruidaTerreo: Number(areaTerreo) || null,
          areaConstruidaSuperior: Number(areaSuperior) || null,
          areaConstruida: areaConstruidaTotal || null,
          quartos: Number(quartos), banheiros: Number(banheiros),
          suites: Number(suites), garagem: Number(garagem),
          valorPedido: Number(valorPedido) || null,
          iptu: Number(iptu) || null,
          condominio: Number(condominio) || null,
          ambientesMedidos: measuredPropertyId ? JSON.parse(sessionStorage.getItem("meter_property_for_valuation") || "{}").rooms || [] : [],
          fotosMedidor: measuredPropertyId ? JSON.parse(sessionStorage.getItem("meter_property_for_valuation") || "{}").photos || [] : [],
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
      // Tenta extrair body JSON mesmo quando supabase-js lança FunctionsHttpError
      let payload: any = data;
      if (error) {
        try {
          const ctx: any = (error as any).context;
          if (ctx && typeof ctx.json === "function") payload = await ctx.json();
          else if (ctx && typeof ctx.text === "function") payload = JSON.parse(await ctx.text());
        } catch { /* ignore */ }
      }

      // Créditos IA insuficientes — aviso amigável, sem crash
      if (payload?.aiCredits && (payload?.error?.includes?.("Cr") || payload?.error?.includes?.("insufic"))) {
        const { balance, required } = payload.aiCredits;
        setCreditsModal({ open: true, balance: Number(balance) || 0, required: Number(required) || 0 });
        return;
      }
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const dataResolved = payload as any;

      // Aplicar ajuste da análise visual (se houver)
      let finalResult = dataResolved as Valuation;
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
      setCurrentValuationId(dataResolved?.id ?? null);
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

  // Normaliza qualquer dataUrl (png/webp/jpeg) -> JPEG redimensionado p/ jsPDF
  const normalizePhoto = (dataUrl: string, maxSide = 1200): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        try { resolve(canvas.toDataURL("image/jpeg", 0.82)); }
        catch { resolve(dataUrl); }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

  const buildLaudo = async () => {
    if (!result) return null;
    const fotosNorm = fotos.length > 0
      ? await Promise.all(
          fotos.map(async (f) => ({
            dataUrl: await normalizePhoto(f.dataUrl),
            categoria: f.categoria,
          }))
        )
      : undefined;
    return generateValuationReport({
      estado, cidade, bairro,
      rua: rua ? `${rua}${numero ? `, ${numero}` : ""}` : rua,
      cep, nomeImovel, tipo, tipoEstrutura: isTerreno ? undefined : tipoEstrutura,
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
      fotos: fotosNorm,
      avaliadorNome:
        avaliadorNome.trim() ||
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "Especialista responsável",
      avaliadorCreci: avaliadorCreci.trim() || undefined,
      avaliadorCnai: avaliadorCnai.trim() || undefined,
      avaliadorEmail: avaliadorEmail.trim() || user?.email,
      valuationId: currentValuationId ?? undefined,
      finalidade: finalidade.trim() || undefined,
      proprietario:
        propNome.trim() || propCpf.trim() || propTelefone.trim() || propEmail.trim()
          ? {
              nome: propNome.trim() || undefined,
              cpf: propCpf.trim() || undefined,
              telefone: propTelefone.trim() || undefined,
              email: propEmail.trim() || undefined,
            }
          : undefined,
      infraestrutura: {
        escola: infraEscola,
        hospital: infraHospital,
        comercio: infraComercio,
        transporte: infraTransporte,
        parque: infraParque,
        bancos: infraBancos,
      },
    });
  };

  const deleteValuation = async (id: string) => {
    if (!user) return;
    if (!confirm("Excluir esta avaliação? Esta ação não pode ser desfeita.")) return;
    setDeletingId(id);
    const { error } = await supabase
      .from("property_valuations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    setDeletingId(null);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    setHistory((prev) => prev.filter((h) => h.id !== id));
    toast({ title: "Avaliação excluída" });
  };

  const downloadLaudo = async () => {
    const doc = await buildLaudo();
    if (!doc) return;
    doc.save(`laudo-avaliacao-${bairro.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`);
    toast({ title: "Laudo PDF gerado!" });
  };

  const printLaudo = async () => {
    const doc = await buildLaudo();
    if (!doc) return;
    const url = doc.output("bloburl");
    const win = window.open(url, "_blank");
    if (win) setTimeout(() => win.print(), 800);
  };

  const shareWhatsapp = () => {
    if (!result) return;
    const msg = `📋 *Avaliação Imobiliária*\n\n🏠 ${tipo} em ${bairro}, ${cidade}/${estado}\n📐 ${areaConstruidaTotal || areaTotalCompat}m²\n\n💰 *Valor estimado:* ${fmtBRL(result.valor_estimado)}\n📊 Faixa: ${fmtBRL(result.faixa_min)} – ${fmtBRL(result.faixa_max)}\n⚡ Venda rápida: ${fmtBRL(result.venda_rapida)}\n👑 Venda premium: ${fmtBRL(result.venda_premium)}\n🏷 Aluguel estimado: ${fmtBRL(result.aluguel_estimado)}/mês\n⏱ Tempo médio: ${result.tempo_medio_venda_dias} dias\n⭐ Score geral: ${result.score_geral}/10`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareEmail = () => {
    if (!result) return;
    const subject = `Avaliação - ${tipo} em ${bairro}, ${cidade}`;
    const body = `${tipo} em ${bairro}, ${cidade}/${estado}\n\nValor estimado: ${fmtBRL(result.valor_estimado)}\nFaixa: ${fmtBRL(result.faixa_min)} – ${fmtBRL(result.faixa_max)}\nVenda rápida: ${fmtBRL(result.venda_rapida)}\nVenda premium: ${fmtBRL(result.venda_premium)}\nAluguel estimado: ${fmtBRL(result.aluguel_estimado)}/mês\nTempo médio: ${result.tempo_medio_venda_dias} dias\nScore: ${result.score_geral}/10\n\n${result.justificativa}`;
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5" style={themeVars}>
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/painel" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" /> Voltar ao painel
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={loadHistory}
                className="bg-card text-foreground border-border hover:bg-muted hover:text-foreground"
              >
                <History className="h-4 w-4 mr-1" /> Histórico
              </Button>
            )}
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-primary">
              <Brain className="h-4 w-4" /> Avaliação Profissional
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" /> AVALIAÇÃO PROFISSIONAL
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-foreground">
            Quanto vale seu imóvel?
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cálculo comparativo real, score profissional, parecer técnico e laudo PDF de 6 páginas.
          </p>
        </motion.div>

        <Card className="p-6 md:p-8 shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
          <Section icon={<MapPin className="h-4 w-4" />} title="Localização">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome do imóvel *">
                <Input value={nomeImovel} onChange={(e) => setNomeImovel(e.target.value)} placeholder="Ex: Casa Jardim Europa" />
              </Field>
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
              <Field label="CEP * (preenche endereço automaticamente)">
                <div className="flex gap-2">
                  <Input
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleBuscarCep(); } }}
                    placeholder="00000-000"
                    inputMode="numeric"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBuscarCep}
                    disabled={cepLoading || !cep.trim()}
                    className="shrink-0 gap-1.5"
                  >
                    {cepLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <MapPinned className="h-4 w-4" />}
                    Buscar
                  </Button>
                </div>
              </Field>
              <Field label="Bairro *">
                <Input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Preenchido pelo CEP" />
              </Field>
              <Field label="Rua *">
                <Input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Preenchido pelo CEP" />
              </Field>
              <Field label="Número *">
                <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: 123" />
              </Field>
              <Field label="Complemento">
                <Input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, bloco, lote" />
              </Field>
              <Field label="Referência">
                <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Próximo a..." />
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
                <Field label="Valor pedido"><Input type="number" value={valorPedido} onChange={(e) => setValorPedido(e.target.value)} /></Field>
                <Field label="IPTU"><Input type="number" value={iptu} onChange={(e) => setIptu(e.target.value)} /></Field>
                <Field label="Condomínio"><Input type="number" value={condominio} onChange={(e) => setCondominio(e.target.value)} /></Field>
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

          {/* ===== Modo Avançado (antes do cálculo, evita gastar créditos 2x) ===== */}
          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setModoAvancado((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Opções Avançadas (opcional)</p>
                  <p className="text-xs text-muted-foreground">
                    Refine ambientes, acabamentos item-a-item, localização e documentação para um laudo ainda mais preciso.
                  </p>
                </div>
              </div>
              {modoAvancado
                ? <ChevronUp className="h-5 w-5 text-primary shrink-0" />
                : <ChevronDown className="h-5 w-5 text-primary shrink-0" />}
            </button>
            {modoAvancado && (
              <div className="px-4 pb-4 pt-2 border-t border-primary/20 bg-card">
                <AdvancedValuationFields state={adv} onChange={updateAdv} />
              </div>
            )}
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
              <><Sparkles className="h-5 w-5 mr-2" /> Calcular Avaliação Profissional{analiseVisual ? " + Visual" : ""} · 5 créditos</>
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
                  Gere quantas versões precisar após corrigir nome, e-mail, CRECI ou CNAI.
                </p>

                {/* Identificação do avaliador */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-3 rounded-lg bg-background/60 border border-border/40">
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
                  <div className="space-y-1">
                    <Label htmlFor="avaliador-email" className="text-xs flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-primary" /> E-mail do laudo
                    </Label>
                    <Input
                      id="avaliador-email"
                      type="email"
                      value={avaliadorEmail}
                      onChange={(e) => {
                        const v = e.target.value.slice(0, 100);
                        setAvaliadorEmail(v);
                        if (typeof window !== "undefined") localStorage.setItem("valuation_avaliador_email", v);
                      }}
                      placeholder={user?.email || "email@exemplo.com"}
                      maxLength={100}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="avaliador-cnai" className="text-xs flex items-center gap-1.5">
                      <FileBadge className="h-3 w-3 text-primary" /> CNAI
                    </Label>
                    <Input
                      id="avaliador-cnai"
                      value={avaliadorCnai}
                      onChange={(e) => {
                        const v = e.target.value.slice(0, 30);
                        setAvaliadorCnai(v);
                        if (typeof window !== "undefined") localStorage.setItem("valuation_avaliador_cnai", v);
                      }}
                      placeholder="Ex: CNAI 12345"
                      maxLength={30}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* ===== Campos opcionais (proprietário, finalidade, infraestrutura) ===== */}
                <details className="mb-4 group rounded-lg border border-border/40 bg-background/60 overflow-hidden">
                  <summary className="cursor-pointer select-none px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileBadge className="h-3.5 w-3.5 text-primary" />
                      Dados complementares (opcional) — Proprietário, Finalidade e Infraestrutura
                    </span>
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                  </summary>

                  <div className="p-3 space-y-4 border-t border-border/40">
                    <div className="space-y-1">
                      <Label htmlFor="laudo-finalidade" className="text-xs">Finalidade da avaliação</Label>
                      <select
                        id="laudo-finalidade"
                        value={finalidade}
                        onChange={(e) => setFinalidade(e.target.value)}
                        className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                      >
                        <option value="">— Não especificada —</option>
                        <option value="Venda">Venda</option>
                        <option value="Locação">Locação</option>
                        <option value="Garantia bancária / Financiamento">Garantia bancária / Financiamento</option>
                        <option value="Inventário / Partilha">Inventário / Partilha</option>
                        <option value="Divórcio / Separação">Divórcio / Separação</option>
                        <option value="Avaliação patrimonial">Avaliação patrimonial</option>
                        <option value="Doação">Doação</option>
                        <option value="Judicial / Perícia">Judicial / Perícia</option>
                        <option value="Reposição de seguro">Reposição de seguro</option>
                      </select>
                    </div>

                    <div>
                      <p className="text-xs font-semibold mb-2 text-foreground">Dados do proprietário (opcional)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Input value={propNome} onChange={(e) => setPropNome(e.target.value.slice(0, 100))} placeholder="Nome completo" className="h-9 text-sm" />
                        <Input value={propCpf} onChange={(e) => setPropCpf(e.target.value.slice(0, 20))} placeholder="CPF/CNPJ" className="h-9 text-sm" />
                        <Input value={propTelefone} onChange={(e) => setPropTelefone(e.target.value.slice(0, 20))} placeholder="Telefone" className="h-9 text-sm" />
                        <Input value={propEmail} onChange={(e) => setPropEmail(e.target.value.slice(0, 100))} placeholder="E-mail" className="h-9 text-sm" />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold mb-2 text-foreground">Infraestrutura próxima do imóvel</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: "Escolas", v: infraEscola, set: setInfraEscola },
                          { label: "Hospitais / Saúde", v: infraHospital, set: setInfraHospital },
                          { label: "Comércio local", v: infraComercio, set: setInfraComercio },
                          { label: "Transporte público", v: infraTransporte, set: setInfraTransporte },
                          { label: "Praças / Parques", v: infraParque, set: setInfraParque },
                          { label: "Bancos / Serviços", v: infraBancos, set: setInfraBancos },
                        ].map((it) => (
                          <label key={it.label} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 rounded hover:bg-muted/50">
                            <input
                              type="checkbox"
                              checked={it.v}
                              onChange={(e) => it.set(e.target.checked)}
                              className="h-3.5 w-3.5 accent-primary"
                            />
                            <span className="text-foreground">{it.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>

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
                <Button 
                  size="lg" 
                  onClick={generateAd}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground border-0"
                >
                  <Wand2 className="h-4 w-4 mr-2" /> Gerar anúncio IA · 2 créditos
                </Button>
                <Button size="lg" onClick={handleCalculate} disabled={loading}>
                  <Sparkles className="h-4 w-4 mr-2" /> Recalcular · 5 créditos
                </Button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl bg-background text-foreground border-border" style={themeVars}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Suas avaliações anteriores</DialogTitle>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código (ex: LAU-XXXX) ou bairro/cidade…"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="pl-9 bg-card text-foreground border-border placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-[500px] overflow-y-auto space-y-2">
            {history.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma avaliação ainda.</p>
            ) : (() => {
              const q = historySearch.trim().toLowerCase();
              const filtered = history.filter((h) => {
                if (!q) return true;
                const code = getLaudoCode(h.id).toLowerCase();
                return (
                  code.includes(q) ||
                  (h.bairro || "").toLowerCase().includes(q) ||
                  (h.cidade || "").toLowerCase().includes(q) ||
                  (h.tipo || "").toLowerCase().includes(q)
                );
              });
              if (filtered.length === 0) {
                return <p className="text-muted-foreground text-center py-8">Nenhum resultado para "{historySearch}".</p>;
              }
              return filtered.map((h) => (
                <Card key={h.id} className="p-4 bg-card text-card-foreground border-border hover:bg-muted/50 transition">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[11px] font-semibold text-primary mb-1 truncate">
                        {getLaudoCode(h.id)}
                      </div>
                      <div className="font-semibold text-foreground truncate">
                        {h.tipo} — {h.bairro}, {h.cidade}/{h.estado}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {h.area_total}m² · {new Date(h.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-primary">{fmtBRL(Number(h.valor_estimado))}</div>
                      {h.score_geral && <div className="text-xs text-muted-foreground">Score {h.score_geral}/10</div>}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteValuation(h.id)}
                        disabled={deletingId === h.id}
                      >
                        {deletingId === h.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <><Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir</>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={adOpen} onOpenChange={setAdOpen}>
        <DialogContent className="max-w-2xl" style={themeVars}>
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
                <div className="p-3 bg-background border border-border rounded-lg font-semibold text-foreground">{adContent.titulo}</div>
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <div className="p-3 bg-background border border-border rounded-lg whitespace-pre-line text-sm text-foreground">{adContent.descricao}</div>
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

      {/* Modal didático de créditos IA insuficientes */}
      <Dialog open={creditsModal.open} onOpenChange={(o) => setCreditsModal((s) => ({ ...s, open: o }))}>
        <DialogContent className="max-w-md" style={themeVars}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Você precisa de mais créditos IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para gerar uma avaliação completa com inteligência artificial (busca de comparativos reais
              no mercado, análise técnica e laudo profissional), são necessários <strong className="text-foreground">{creditsModal.required} créditos</strong> por avaliação.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-background p-3 text-center">
                <div className="text-xs text-muted-foreground">Seu saldo</div>
                <div className="text-2xl font-bold text-foreground">{creditsModal.balance}</div>
                <div className="text-[10px] text-muted-foreground">crédito(s)</div>
              </div>
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-center">
                <div className="text-xs text-primary">Necessário</div>
                <div className="text-2xl font-bold text-primary">{creditsModal.required}</div>
                <div className="text-[10px] text-muted-foreground">crédito(s)</div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 border border-border p-3 text-xs text-muted-foreground leading-relaxed">
              💡 <strong className="text-foreground">Não é um erro</strong> — você apenas ainda não tem
              créditos IA suficientes na sua conta. Compre um pacote no painel para continuar usando a
              avaliação automática e outras ferramentas de IA da plataforma.
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCreditsModal((s) => ({ ...s, open: false }))}
              >
                Agora não
              </Button>
              <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
                <Link to="/painel?tab=creditos" onClick={() => setCreditsModal((s) => ({ ...s, open: false }))}>
                  <Sparkles className="h-4 w-4 mr-2" /> Comprar créditos
                </Link>
              </Button>
            </div>
          </div>
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
