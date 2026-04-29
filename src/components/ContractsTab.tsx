import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, ArrowLeft, Edit, Trash2, Download, Printer,
  Eye, Clock, CheckCircle2, PenTool, X, Copy, Search, Star, Sparkles,
  Share2, Bot, TrendingUp, Calendar, Award, Zap, FilePlus2, Loader2,
  ShieldCheck, Home, Building2, Briefcase, Scale,
} from "lucide-react";

/* ═══════════════════════════════════════
   TYPES & TEMPLATES
   ═══════════════════════════════════════ */

interface ContractTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: "locacao" | "venda" | "imobiliaria" | "juridico";
  content: string;
}

interface SavedContract {
  id: string;
  template_type: string;
  title: string;
  content: string;
  variables: Record<string, string>;
  signature_locador: string | null;
  signature_locatario: string | null;
  is_favorite?: boolean;
  created_at: string;
}

const CATEGORIES = [
  { id: "all" as const,         label: "Todos",          icon: FileText,    color: "from-slate-500 to-slate-700" },
  { id: "locacao" as const,     label: "Locação",        icon: Home,        color: "from-emerald-500 to-teal-700" },
  { id: "venda" as const,       label: "Compra & Venda", icon: Briefcase,   color: "from-amber-500 to-orange-600" },
  { id: "imobiliaria" as const, label: "Imobiliária",    icon: Building2,   color: "from-fuchsia-500 to-purple-700" },
  { id: "juridico" as const,    label: "Jurídico",       icon: Scale,       color: "from-cyan-500 to-blue-700" },
];

const VARIABLES = [
  "{nome_proprietario}",
  "{cpf_proprietario}",
  "{nome_inquilino}",
  "{cpf_inquilino}",
  "{endereco_imovel}",
  "{valor_aluguel}",
  "{data_inicio}",
  "{data_fim}",
  "{data_vencimento}",
  "{cidade}",
  "{data_atual}",
];

const baseSign = `\n\n_________________________\n{nome_proprietario}\n\n\n_________________________\n{nome_inquilino}\n\n\n_________________________\nTestemunha 1\n\n\n_________________________\nTestemunha 2`;

const TEMPLATES: ContractTemplate[] = [
  // LOCAÇÃO
  {
    id: "locacao_residencial", name: "Locação Residencial", emoji: "🏠", category: "locacao",
    description: "Modelo pronto com variáveis dinâmicas para aluguel residencial.",
    content: `CONTRATO DE LOCAÇÃO RESIDENCIAL\n\nLOCADOR: {nome_proprietario}, CPF: {cpf_proprietario}\nLOCATÁRIO: {nome_inquilino}, CPF: {cpf_inquilino}\n\nO LOCADOR dá em locação ao LOCATÁRIO o imóvel localizado em {endereco_imovel}, conforme Lei 8.245/91.\n\nCLÁUSULA 1ª — VALOR: R$ {valor_aluguel}, com vencimento todo dia {data_vencimento}.\nCLÁUSULA 2ª — PRAZO: Início {data_inicio}, término {data_fim}.\nCLÁUSULA 3ª — REAJUSTE: Anual pelo IGP-M.\nCLÁUSULA 4ª — MULTA: 3 alugueis em caso de descumprimento.\nCLÁUSULA 5ª — FORO: Comarca de {cidade}.\n\n{cidade}, {data_atual}` + baseSign,
  },
  {
    id: "locacao_comercial", name: "Locação Comercial", emoji: "🏢", category: "locacao",
    description: "Para lojas, salas comerciais, escritórios e galpões.",
    content: `CONTRATO DE LOCAÇÃO COMERCIAL\n\nLOCADOR: {nome_proprietario}, CPF/CNPJ: {cpf_proprietario}\nLOCATÁRIO: {nome_inquilino}, CPF/CNPJ: {cpf_inquilino}\n\nObjeto: locação NÃO RESIDENCIAL do imóvel em {endereco_imovel}, regida pela Lei 8.245/91.\n\nCLÁUSULA 1ª — ALUGUEL: R$ {valor_aluguel} mensais, vencimento dia {data_vencimento}.\nCLÁUSULA 2ª — PRAZO: {data_inicio} a {data_fim}.\nCLÁUSULA 3ª — DESTINAÇÃO: Atividade comercial declarada na proposta.\nCLÁUSULA 4ª — REAJUSTE: Anual pelo IGP-M.\nCLÁUSULA 5ª — IPTU/TAXAS: Por conta do LOCATÁRIO.\nCLÁUSULA 6ª — FORO: {cidade}.\n\n{cidade}, {data_atual}` + baseSign,
  },
  {
    id: "locacao_temporada", name: "Locação por Temporada", emoji: "🗓️", category: "locacao",
    description: "Ideal para Airbnb e aluguel de curta duração.",
    content: `CONTRATO DE LOCAÇÃO POR TEMPORADA\n\nLOCADOR: {nome_proprietario}, CPF: {cpf_proprietario}\nHÓSPEDE: {nome_inquilino}, CPF: {cpf_inquilino}\n\nImóvel: {endereco_imovel}\nPeríodo: {data_inicio} a {data_fim}\nValor total: R$ {valor_aluguel}\n\nCLÁUSULA 1ª — Conforme art. 48 a 50 da Lei 8.245/91.\nCLÁUSULA 2ª — Não inclui prorrogação automática.\nCLÁUSULA 3ª — Devolução do imóvel nas mesmas condições.\nCLÁUSULA 4ª — Caução opcional retornável após vistoria.\n\n{cidade}, {data_atual}` + baseSign,
  },
  {
    id: "renovacao_locacao", name: "Renovação de Locação", emoji: "🔁", category: "locacao",
    description: "Renove contratos rapidamente sem refazer todo o documento.",
    content: `TERMO ADITIVO DE RENOVAÇÃO\n\nLOCADOR: {nome_proprietario}\nLOCATÁRIO: {nome_inquilino}\n\nAs partes acordam a RENOVAÇÃO do contrato de locação do imóvel {endereco_imovel}.\n\nNovo prazo: {data_inicio} a {data_fim}\nNovo valor: R$ {valor_aluguel}\nDemais cláusulas do contrato original permanecem inalteradas.\n\n{cidade}, {data_atual}` + baseSign,
  },
  {
    id: "distrato_locacao", name: "Distrato de Locação", emoji: "📄", category: "locacao",
    description: "Encerramento formal e amigável do aluguel.",
    content: `DISTRATO DE LOCAÇÃO\n\nAs partes LOCADOR {nome_proprietario} e LOCATÁRIO {nome_inquilino} declaram, de comum acordo, RESCINDIDO o contrato de locação do imóvel {endereco_imovel}.\n\nData efetiva da rescisão: {data_fim}\nNada mais a reclamar entre as partes, dando-se mútua quitação.\n\n{cidade}, {data_atual}` + baseSign,
  },
  {
    id: "termo_vistoria", name: "Termo de Vistoria", emoji: "📑", category: "locacao",
    description: "Vistoria de entrada e saída do imóvel.",
    content: `TERMO DE VISTORIA — ENTRADA / SAÍDA\n\nImóvel: {endereco_imovel}\nProprietário: {nome_proprietario}\nLocatário: {nome_inquilino}\nData da vistoria: {data_atual}\n\nDESCRIÇÃO DO ESTADO:\n• Pintura: ___________________________\n• Pisos: _____________________________\n• Louças e metais: ____________________\n• Elétrica: ___________________________\n• Hidráulica: _________________________\n• Eletrodomésticos: ___________________\n• Observações: _______________________\n\n{cidade}, {data_atual}` + baseSign,
  },

  // VENDA
  {
    id: "compra_venda", name: "Compra e Venda de Imóvel", emoji: "💰", category: "venda",
    description: "Contrato completo com cláusulas automáticas.",
    content: `CONTRATO DE COMPRA E VENDA DE IMÓVEL\n\nVENDEDOR: {nome_proprietario}, CPF: {cpf_proprietario}\nCOMPRADOR: {nome_inquilino}, CPF: {cpf_inquilino}\n\nObjeto: imóvel localizado em {endereco_imovel}.\n\nCLÁUSULA 1ª — VALOR TOTAL: R$ {valor_aluguel}.\nCLÁUSULA 2ª — FORMA DE PAGAMENTO: conforme acordado entre as partes.\nCLÁUSULA 3ª — POSSE: transmitida em {data_inicio}.\nCLÁUSULA 4ª — ESCRITURA: lavrada em {data_fim}.\nCLÁUSULA 5ª — TRIBUTOS: ITBI por conta do COMPRADOR.\nCLÁUSULA 6ª — FORO: {cidade}.\n\n{cidade}, {data_atual}` + baseSign,
  },
  {
    id: "promessa_compra_venda", name: "Promessa de Compra e Venda", emoji: "🤝", category: "venda",
    description: "Pré-contrato antes da escritura definitiva.",
    content: `INSTRUMENTO DE PROMESSA DE COMPRA E VENDA\n\nPROMITENTE VENDEDOR: {nome_proprietario}, CPF: {cpf_proprietario}\nPROMITENTE COMPRADOR: {nome_inquilino}, CPF: {cpf_inquilino}\n\nImóvel: {endereco_imovel}\nValor: R$ {valor_aluguel}\nSinal: a ser confirmado em recibo separado.\n\nCLÁUSULA 1ª — As partes obrigam-se reciprocamente à celebração do contrato definitivo até {data_fim}.\nCLÁUSULA 2ª — Em caso de desistência do COMPRADOR, perde o sinal.\nCLÁUSULA 3ª — Em caso de desistência do VENDEDOR, devolve em dobro.\nCLÁUSULA 4ª — FORO: {cidade}.\n\n{cidade}, {data_atual}` + baseSign,
  },
  {
    id: "recibo_sinal", name: "Recibo de Sinal / Arras", emoji: "💵", category: "venda",
    description: "Formalize entradas e reservas com segurança.",
    content: `RECIBO DE SINAL E PRINCÍPIO DE PAGAMENTO (ARRAS)\n\nRecebi de {nome_inquilino}, CPF {cpf_inquilino}, a quantia de R$ {valor_aluguel} a título de SINAL para a aquisição do imóvel {endereco_imovel}.\n\nO valor será deduzido do preço final do imóvel quando da assinatura do contrato definitivo até {data_fim}.\n\nNos termos do art. 417 do Código Civil, em caso de desistência do COMPRADOR perderá o sinal; em caso de desistência do VENDEDOR, devolverá em dobro.\n\n{cidade}, {data_atual}\n\n_________________________\n{nome_proprietario}\nVENDEDOR`,
  },
  {
    id: "permuta", name: "Permuta de Imóveis", emoji: "🔄", category: "venda",
    description: "Troca de bens imóveis com segurança jurídica.",
    content: `CONTRATO DE PERMUTA DE IMÓVEIS\n\nPRIMEIRO PERMUTANTE: {nome_proprietario}, CPF: {cpf_proprietario}\nSEGUNDO PERMUTANTE: {nome_inquilino}, CPF: {cpf_inquilino}\n\nObjeto: PERMUTA do imóvel {endereco_imovel} pelo imóvel descrito em anexo, com torna em dinheiro de R$ {valor_aluguel} a ser paga pelo SEGUNDO PERMUTANTE.\n\nCLÁUSULA 1ª — Cada parte responde pelos tributos do imóvel que está cedendo até a posse.\nCLÁUSULA 2ª — Posse mútua em {data_inicio}.\nCLÁUSULA 3ª — FORO: {cidade}.\n\n{cidade}, {data_atual}` + baseSign,
  },
  {
    id: "distrato_venda", name: "Distrato Compra e Venda", emoji: "📜", category: "venda",
    description: "Cancelamento formal e consensual do negócio.",
    content: `DISTRATO DE COMPRA E VENDA\n\nAs partes VENDEDOR {nome_proprietario} e COMPRADOR {nome_inquilino} declaram RESCINDIDO o contrato de compra e venda do imóvel {endereco_imovel} firmado em {data_inicio}.\n\nDevoluções e ajustes financeiros realizados nesta data, dando-se mútua quitação.\n\n{cidade}, {data_atual}` + baseSign,
  },

  // IMOBILIÁRIA
  {
    id: "exclusividade", name: "Exclusividade Imobiliária", emoji: "🔒", category: "imobiliaria",
    description: "Captação exclusiva com prazo definido e garantias.",
    content: `CONTRATO DE EXCLUSIVIDADE IMOBILIÁRIA\n\nPROPRIETÁRIO: {nome_proprietario}, CPF: {cpf_proprietario}\n\nO PROPRIETÁRIO concede EXCLUSIVIDADE de venda/locação do imóvel {endereco_imovel} ao corretor responsável.\n\nCLÁUSULA 1ª — PRAZO: {data_inicio} até {data_fim}.\nCLÁUSULA 2ª — Durante este período, o imóvel não poderá ser negociado por terceiros.\nCLÁUSULA 3ª — COMISSÃO: 6% sobre o valor da venda ou 1 aluguel para locação.\nCLÁUSULA 4ª — Caso o PROPRIETÁRIO venda diretamente durante a vigência, fica obrigado ao pagamento integral da comissão.\n\n{cidade}, {data_atual}` + baseSign,
  },
  {
    id: "administracao", name: "Administração de Imóvel", emoji: "📋", category: "imobiliaria",
    description: "Gestão de aluguel, manutenção e responsabilidades.",
    content: `CONTRATO DE ADMINISTRAÇÃO DE IMÓVEL\n\nPROPRIETÁRIO: {nome_proprietario}, CPF: {cpf_proprietario}\n\nO PROPRIETÁRIO contrata os serviços de ADMINISTRAÇÃO do imóvel {endereco_imovel}.\n\nCLÁUSULA 1ª — Serviços inclusos: cobrança de aluguel, gestão de inquilinos, intermediação e prestação de contas mensal.\nCLÁUSULA 2ª — REMUNERAÇÃO: 10% sobre o valor mensal recebido.\nCLÁUSULA 3ª — Vigência: {data_inicio} a {data_fim}, renovável por igual período.\nCLÁUSULA 4ª — FORO: {cidade}.\n\n{cidade}, {data_atual}` + baseSign,
  },
  {
    id: "autorizacao_divulgacao", name: "Autorização de Divulgação", emoji: "📸", category: "imobiliaria",
    description: "Uso de fotos, vídeos e anúncios em portais e redes.",
    content: `AUTORIZAÇÃO DE DIVULGAÇÃO E USO DE IMAGEM\n\nO PROPRIETÁRIO {nome_proprietario}, CPF {cpf_proprietario}, AUTORIZA o corretor responsável a divulgar o imóvel {endereco_imovel} em:\n\n• Portais imobiliários (Zap, Viva Real, OLX, Imovelweb)\n• Redes sociais (Instagram, Facebook, TikTok)\n• Site próprio do corretor\n• Anúncios pagos no Google e Meta Ads\n• Materiais impressos\n\nAutoriza ainda o uso de fotos, vídeos e tour virtual produzidos para fins de marketing.\n\nVigência: {data_inicio} a {data_fim}\n\n{cidade}, {data_atual}\n\n_________________________\n{nome_proprietario}`,
  },
  {
    id: "parceria_corretores", name: "Parceria entre Corretores", emoji: "👥", category: "imobiliaria",
    description: "Divisão clara de comissão entre corretores.",
    content: `CONTRATO DE PARCERIA ENTRE CORRETORES\n\nCORRETOR CAPTADOR: {nome_proprietario}, CRECI: {cpf_proprietario}\nCORRETOR VENDEDOR: {nome_inquilino}, CRECI: {cpf_inquilino}\n\nObjeto: parceria para venda/locação do imóvel {endereco_imovel}.\n\nCLÁUSULA 1ª — DIVISÃO DA COMISSÃO: 50% para cada parte.\nCLÁUSULA 2ª — Pagamento será feito imediatamente após o recebimento da comissão pelo cliente.\nCLÁUSULA 3ª — Ambos respondem pela conduta ética e cumprem o Código de Ética do COFECI.\nCLÁUSULA 4ª — Vigência: {data_inicio} a {data_fim}.\n\n{cidade}, {data_atual}` + baseSign,
  },
  {
    id: "prestacao_servicos", name: "Prestação de Serviços Imobiliários", emoji: "🧾", category: "imobiliaria",
    description: "Marketing, captação, fotografia e serviços diversos.",
    content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS IMOBILIÁRIOS\n\nCONTRATANTE: {nome_proprietario}, CPF/CNPJ: {cpf_proprietario}\nCONTRATADO: {nome_inquilino}, CPF/CNPJ: {cpf_inquilino}\n\nObjeto: prestação de serviços de marketing imobiliário, captação, fotografia profissional e gestão de anúncios para o imóvel {endereco_imovel}.\n\nCLÁUSULA 1ª — VALOR: R$ {valor_aluguel} pelo pacote completo.\nCLÁUSULA 2ª — PRAZO: {data_inicio} a {data_fim}.\nCLÁUSULA 3ª — ENTREGÁVEIS: fotos editadas, copywriting profissional, anúncio publicado em até 3 portais e relatório mensal.\nCLÁUSULA 4ª — FORO: {cidade}.\n\n{cidade}, {data_atual}` + baseSign,
  },

  // JURÍDICO
  {
    id: "procuracao", name: "Procuração Imobiliária", emoji: "🖊️", category: "juridico",
    description: "Representação legal para vender, alugar ou administrar.",
    content: `PROCURAÇÃO PARTICULAR\n\nOUTORGANTE: {nome_proprietario}, CPF: {cpf_proprietario}\nOUTORGADO: {nome_inquilino}, CPF: {cpf_inquilino}\n\nO OUTORGANTE constitui o OUTORGADO seu BASTANTE PROCURADOR para:\n\n• Representá-lo em todos os atos relacionados ao imóvel {endereco_imovel}\n• Negociar a venda ou locação\n• Assinar contratos, recibos e propostas\n• Receber valores e dar quitação\n• Representar perante imobiliárias, cartórios e órgãos públicos\n\nVigência: {data_inicio} a {data_fim}\n\n{cidade}, {data_atual}\n\n_________________________\n{nome_proprietario}\nOUTORGANTE`,
  },
  {
    id: "notificacao_extrajudicial", name: "Notificação Extrajudicial", emoji: "📌", category: "juridico",
    description: "Avisos formais, cobranças e advertências oficiais.",
    content: `NOTIFICAÇÃO EXTRAJUDICIAL\n\nDe: {nome_proprietario}, CPF: {cpf_proprietario}\nPara: {nome_inquilino}, CPF: {cpf_inquilino}\nReferente ao imóvel: {endereco_imovel}\n\nPela presente, fica o NOTIFICADO formalmente CIENTE de que se encontra em situação irregular pelos seguintes motivos:\n\n• Inadimplemento de aluguel referente ao mês de {data_vencimento}\n• Valor em aberto: R$ {valor_aluguel}\n\nFica concedido o prazo de 15 (quinze) dias para regularização, sob pena das medidas judiciais cabíveis (Lei 8.245/91).\n\n{cidade}, {data_atual}\n\n_________________________\n{nome_proprietario}\nNOTIFICANTE`,
  },
  {
    id: "entrega_chaves", name: "Declaração de Entrega de Chaves", emoji: "🗝️", category: "juridico",
    description: "Registro formal da devolução do imóvel.",
    content: `DECLARAÇÃO DE ENTREGA DE CHAVES\n\nEu, {nome_inquilino}, CPF {cpf_inquilino}, DECLARO ter entregue nesta data as chaves do imóvel localizado em {endereco_imovel} ao proprietário {nome_proprietario}, CPF {cpf_proprietario}.\n\nO imóvel foi devolvido nas condições constantes no Termo de Vistoria de Saída anexo, dando-se por encerrada a posse.\n\n{cidade}, {data_atual}\n\n_________________________\n{nome_inquilino}\n\n_________________________\n{nome_proprietario}`,
  },
  {
    id: "termo_rescisao", name: "Termo de Rescisão", emoji: "📑", category: "juridico",
    description: "Encerramento formal e detalhado entre as partes.",
    content: `TERMO DE RESCISÃO CONTRATUAL\n\nAs partes {nome_proprietario}, CPF {cpf_proprietario}, e {nome_inquilino}, CPF {cpf_inquilino}, declaram RESCINDIDO o contrato firmado em {data_inicio} relacionado ao imóvel {endereco_imovel}.\n\nCLÁUSULA 1ª — Data efetiva da rescisão: {data_fim}.\nCLÁUSULA 2ª — Mútua quitação de obrigações.\nCLÁUSULA 3ª — Eventuais valores pendentes serão acertados separadamente.\nCLÁUSULA 4ª — FORO: {cidade}.\n\n{cidade}, {data_atual}` + baseSign,
  },
];

/* ═══════════════════════════════════════
   SIGNATURE PAD
   ═══════════════════════════════════════ */
function SignaturePad({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a1a";
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = value;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [value]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const evt = "touches" in e ? e.touches[0] : e;
    return { x: ((evt.clientX - rect.left) / rect.width) * canvas.width, y: ((evt.clientY - rect.top) / rect.height) * canvas.height };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) { ctx.beginPath(); ctx.moveTo(x, y); }
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) { ctx.lineTo(x, y); ctx.stroke(); }
  };
  const end = () => {
    setDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  };
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{label}</label>
        <button type="button" onClick={clear} className="text-[10px] text-red-500 font-bold hover:underline flex items-center gap-1"><X size={10} /> Limpar</button>
      </div>
      <canvas
        ref={canvasRef} width={400} height={120}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        className="w-full bg-white border-2 border-dashed border-border rounded-xl cursor-crosshair touch-none"
      />
    </div>
  );
}

/* ═══════════════════════════════════════
   AI CONTRACT MODAL
   ═══════════════════════════════════════ */
function AiContractModal({ open, onClose, onGenerated }: { open: boolean; onClose: () => void; onGenerated: (title: string, content: string) => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tipo: "Locação Residencial", nome_proprietario: "", nome_cliente: "",
    cpf_proprietario: "", cpf_cliente: "", endereco: "", valor: "", prazo: "12 meses",
    garantia: "Caução de 1 aluguel", multa: "3 alugueis", reajuste: "IGP-M anual",
    cidade: "", observacoes: "",
  });

  const handleGenerate = async () => {
    if (!form.nome_proprietario || !form.nome_cliente || !form.endereco) {
      toast({ title: "Preencha pelo menos as partes e o endereço", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-contract-ai", { body: form });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      onGenerated(data.titulo, data.content);
      toast({ title: "✨ Contrato gerado pela IA!" });
      onClose();
    } catch (e: any) {
      toast({ title: "Falha ao gerar", description: e?.message || "Tente novamente", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
  const lbl = "block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl my-8 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-br from-fuchsia-500/20 via-purple-500/10 to-transparent p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Criar Contrato com IA</h3>
                  <p className="text-[11px] text-muted-foreground">Custa 5 créditos · gera contrato jurídico completo</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X size={16} /></button>
            </div>

            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className={lbl}>Tipo de contrato *</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className={inp}>
                  <option>Locação Residencial</option><option>Locação Comercial</option>
                  <option>Locação por Temporada</option><option>Compra e Venda</option>
                  <option>Promessa de Compra e Venda</option><option>Exclusividade</option>
                  <option>Administração</option><option>Parceria entre Corretores</option>
                  <option>Procuração</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className={lbl}>Proprietário/Vendedor *</label><input value={form.nome_proprietario} onChange={e => setForm({ ...form, nome_proprietario: e.target.value })} placeholder="Nome completo" className={inp} /></div>
                <div><label className={lbl}>CPF/CNPJ proprietário</label><input value={form.cpf_proprietario} onChange={e => setForm({ ...form, cpf_proprietario: e.target.value })} placeholder="000.000.000-00" className={inp} /></div>
                <div><label className={lbl}>Cliente/Comprador *</label><input value={form.nome_cliente} onChange={e => setForm({ ...form, nome_cliente: e.target.value })} placeholder="Nome completo" className={inp} /></div>
                <div><label className={lbl}>CPF/CNPJ cliente</label><input value={form.cpf_cliente} onChange={e => setForm({ ...form, cpf_cliente: e.target.value })} placeholder="000.000.000-00" className={inp} /></div>
              </div>
              <div><label className={lbl}>Endereço do imóvel *</label><input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} placeholder="Rua, nº, bairro, cidade/UF" className={inp} /></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><label className={lbl}>Valor (R$)</label><input value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} placeholder="3.500,00" className={inp} /></div>
                <div><label className={lbl}>Prazo</label><input value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} className={inp} /></div>
                <div><label className={lbl}>Cidade/Foro</label><input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} className={inp} /></div>
                <div><label className={lbl}>Garantia</label><input value={form.garantia} onChange={e => setForm({ ...form, garantia: e.target.value })} className={inp} /></div>
                <div><label className={lbl}>Multa</label><input value={form.multa} onChange={e => setForm({ ...form, multa: e.target.value })} className={inp} /></div>
                <div><label className={lbl}>Reajuste</label><input value={form.reajuste} onChange={e => setForm({ ...form, reajuste: e.target.value })} className={inp} /></div>
              </div>
              <div><label className={lbl}>Observações adicionais</label><textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={3} placeholder="Cláusulas específicas, condições especiais..." className={inp} /></div>
            </div>

            <div className="p-4 border-t border-border bg-secondary/30 flex items-center justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-secondary">Cancelar</button>
              <button onClick={handleGenerate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-500/30 hover:brightness-110 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? "Gerando..." : "Gerar Contrato (5 créditos)"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
export default function ContractsTab({ userId, sellerId }: { userId: string; sellerId: string }) {
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "select" | "editor" | "preview">("list");
  const [savedContracts, setSavedContracts] = useState<SavedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]["id"]>("all");
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [editingContract, setEditingContract] = useState<SavedContract | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [signatureLocador, setSignatureLocador] = useState<string | null>(null);
  const [signatureLocatario, setSignatureLocatario] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [crmContacts, setCrmContacts] = useState<any[]>([]);
  const [rentalContracts, setRentalContracts] = useState<any[]>([]);

  const printRef = useRef<HTMLDivElement>(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("generated_contracts" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setSavedContracts((data as any) || []);
    setLoading(false);
  }, [userId]);

  const fetchCrmData = useCallback(async () => {
    const [{ data: contacts }, { data: rentals }] = await Promise.all([
      supabase.from("seller_crm_contacts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("rental_contracts").select("*").eq("user_id", userId).eq("status", "ativo" as any),
    ]);
    setCrmContacts(contacts || []);
    setRentalContracts(rentals || []);
  }, [userId]);

  useEffect(() => { fetchContracts(); fetchCrmData(); }, [fetchContracts, fetchCrmData]);

  const today = new Date();
  const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  const openTemplate = (tpl: ContractTemplate) => {
    setSelectedTemplate(tpl);
    setEditingContract(null);
    setTitle(tpl.name);
    setContent(tpl.content);
    setSignatureLocador(null);
    setSignatureLocatario(null);
    setVariables({ "{data_atual}": fmtDate(today) });
    setView("editor");
  };

  const openSaved = (c: SavedContract) => {
    setEditingContract(c);
    setSelectedTemplate(TEMPLATES.find(t => t.id === c.template_type) || null);
    setTitle(c.title);
    setContent(c.content);
    setVariables(c.variables || {});
    setSignatureLocador(c.signature_locador);
    setSignatureLocatario(c.signature_locatario);
    setView("editor");
  };

  const fillFromCrmContact = (contact: any) => {
    setVariables(prev => ({ ...prev, "{nome_inquilino}": contact.full_name || "" }));
    toast({ title: "Dados preenchidos do CRM" });
  };

  const fillFromRental = (rental: any) => {
    setVariables(prev => ({
      ...prev,
      "{nome_inquilino}": rental.tenant_name || "",
      "{cpf_inquilino}": rental.tenant_cpf_cnpj || "",
      "{nome_proprietario}": rental.owner_name || "",
      "{valor_aluguel}": rental.rent_amount?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "",
      "{data_inicio}": rental.start_date ? fmtDate(new Date(rental.start_date + "T12:00:00")) : "",
      "{data_fim}": rental.end_date ? fmtDate(new Date(rental.end_date + "T12:00:00")) : "",
      "{data_vencimento}": rental.due_day?.toString() || "",
      "{data_atual}": fmtDate(today),
    }));
    toast({ title: "Dados preenchidos do contrato de aluguel" });
  };

  const getFilledContent = () => {
    let filled = content;
    for (const [key, val] of Object.entries(variables)) {
      filled = filled.split(key).join(val || key);
    }
    return filled;
  };

  const handleSave = async () => {
    if (!title.trim()) { toast({ title: "Informe o título do contrato" }); return; }
    setSaving(true);
    const payload = {
      user_id: userId, seller_id: sellerId,
      template_type: selectedTemplate?.id || "ia_custom",
      title: title.trim(), content, variables,
      signature_locador: signatureLocador, signature_locatario: signatureLocatario,
    };
    if (editingContract) {
      await supabase.from("generated_contracts" as any).update(payload).eq("id", editingContract.id);
      toast({ title: "Contrato atualizado!" });
    } else {
      await supabase.from("generated_contracts" as any).insert(payload);
      toast({ title: "Contrato salvo!" });
    }
    setSaving(false);
    fetchContracts();
    setView("list");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("generated_contracts" as any).delete().eq("id", id);
    toast({ title: "Contrato excluído" });
    fetchContracts();
  };

  const handleDuplicate = async (c: SavedContract) => {
    await supabase.from("generated_contracts" as any).insert({
      user_id: userId, seller_id: sellerId,
      template_type: c.template_type, title: `${c.title} (cópia)`,
      content: c.content, variables: c.variables,
      signature_locador: null, signature_locatario: null,
    });
    toast({ title: "Contrato duplicado" });
    fetchContracts();
  };

  const handleToggleFavorite = async (c: SavedContract) => {
    await supabase.from("generated_contracts" as any).update({ is_favorite: !c.is_favorite }).eq("id", c.id);
    fetchContracts();
  };

  const handleShare = async (c: SavedContract) => {
    const text = `Contrato: ${c.title}\nGerado via Capimobi.`;
    if (navigator.share) {
      try { await navigator.share({ title: c.title, text }); } catch {}
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Link copiado para a área de transferência" });
    }
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>${title}</title>
      <style>
        body { font-family: 'Times New Roman', serif; padding: 60px; line-height: 1.8; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
        .sig-img { max-width: 200px; height: 80px; object-fit: contain; }
        h1 { text-align: center; font-size: 18px; margin-bottom: 24px; }
        pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 14px; }
        @media print { body { padding: 40px; } }
      </style></head><body>
      <pre>${getFilledContent()}</pre>
      ${signatureLocador ? `<p style="margin-top:40px;"><strong>Assinatura Locador/Vendedor:</strong><br/><img loading="lazy" decoding="async" class="sig-img" src="${signatureLocador}" /></p>` : ""}
      ${signatureLocatario ? `<p><strong>Assinatura Locatário/Comprador:</strong><br/><img loading="lazy" decoding="async" class="sig-img" src="${signatureLocatario}" /></p>` : ""}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleDownloadPdf = () => {
    handlePrint();
    toast({ title: "Use 'Salvar como PDF' na janela de impressão" });
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelCls = "block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5";

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = savedContracts.filter(c => new Date(c.created_at) >= monthStart).length;
    const counts: Record<string, number> = {};
    savedContracts.forEach(c => { counts[c.template_type] = (counts[c.template_type] || 0) + 1; });
    const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topName = TEMPLATES.find(t => t.id === topId)?.name || "—";
    const minutesSaved = savedContracts.length * 25; // 25 min economizados por contrato
    return { thisMonth, total: savedContracts.length, topName, minutesSaved };
  }, [savedContracts]);

  // Templates filtered
  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchCat = activeCategory === "all" || t.category === activeCategory;
      const q = search.toLowerCase().trim();
      const matchSearch = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  const filteredSaved = useMemo(() => {
    const q = search.toLowerCase().trim();
    return savedContracts
      .filter(c => !q || c.title.toLowerCase().includes(q) || c.template_type.toLowerCase().includes(q))
      .sort((a, b) => Number(b.is_favorite || false) - Number(a.is_favorite || false));
  }, [savedContracts, search]);

  const recentSaved = useMemo(() => savedContracts.slice(0, 5), [savedContracts]);

  /* ═══════════ LIST VIEW (CENTRAL) ═══════════ */
  if (view === "list") {
    return (
      <div className="space-y-6">
        {/* HEADER */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary">
            <ShieldCheck size={12} /> Central Premium
          </div>
          <h1 className="text-xl md:text-3xl font-black text-foreground tracking-tight">
            Central de Contratos Imobiliários
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Crie contratos profissionais em segundos com modelos prontos, variáveis dinâmicas e exportação em PDF.
          </p>
        </div>

        {/* AI BANNER */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-500/20 via-purple-500/10 to-transparent border border-fuchsia-400/20 p-5 md:p-6"
        >
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-700 flex items-center justify-center shadow-xl shadow-purple-500/40">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-black text-foreground">Ganhe tempo com IA jurídica integrada</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Descreva o negócio e a IA monta o contrato completo com cláusulas legais.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAiModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-700 text-white text-sm font-bold shadow-lg shadow-purple-500/30 hover:brightness-110 transition-all"
              >
                <Bot className="w-4 h-4" /> Criar com IA
              </button>
              <button
                onClick={() => setView("select")}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-90 transition-all"
              >
                <Plus className="w-4 h-4" /> Novo Contrato
              </button>
            </div>
          </div>
        </motion.div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Calendar,    label: "Este mês",         value: stats.thisMonth.toString(),   color: "from-emerald-500/20 to-teal-700/10",     iconColor: "text-emerald-400" },
            { icon: FilePlus2,   label: "PDFs gerados",     value: stats.total.toString(),       color: "from-amber-500/20 to-orange-600/10",     iconColor: "text-amber-400" },
            { icon: Award,       label: "Mais utilizado",   value: stats.topName,                color: "from-fuchsia-500/20 to-purple-700/10",   iconColor: "text-fuchsia-400" },
            { icon: Zap,         label: "Tempo economizado", value: `${stats.minutesSaved} min`, color: "from-cyan-500/20 to-blue-700/10",        iconColor: "text-cyan-400" },
          ].map((s, i) => (
            <motion.div
              key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${s.color} p-4`}
            >
              <s.icon className={`w-5 h-5 ${s.iconColor} mb-2`} />
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="text-base md:text-lg font-black text-foreground truncate" title={s.value}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* SEARCH */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar contrato..."
            className={`${inputCls} pl-11 py-3 text-sm`}
          />
        </div>

        {/* CATEGORIES */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={12} /> {cat.label}
              </button>
            );
          })}
        </div>

        {/* RECENT (saved contracts) */}
        {recentSaved.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock size={12} /> Últimos usados
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSaved.slice(0, 6).map(c => {
                const tpl = TEMPLATES.find(t => t.id === c.template_type);
                return (
                  <motion.div
                    key={c.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className="group relative rounded-2xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
                        {tpl?.emoji || "📄"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-foreground truncate">{c.title}</h3>
                          {c.is_favorite && <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(c.created_at).toLocaleDateString("pt-BR")} · {tpl?.name || c.template_type}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <button onClick={() => openSaved(c)} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                        <Edit size={12} /> Editar
                      </button>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => handleToggleFavorite(c)} title="Favoritar" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-amber-400">
                          <Star size={13} className={c.is_favorite ? "fill-amber-400 text-amber-400" : ""} />
                        </button>
                        <button onClick={() => handleDuplicate(c)} title="Duplicar" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
                          <Copy size={13} />
                        </button>
                        <button onClick={() => handleShare(c)} title="Compartilhar" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
                          <Share2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(c.id)} title="Excluir" className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* TEMPLATES GRID */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <FileText size={12} /> Modelos disponíveis ({filteredTemplates.length})
          </h3>

          {loading && <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredTemplates.map((tpl, i) => {
              const cat = CATEGORIES.find(c => c.id === tpl.category);
              return (
                <motion.div
                  key={tpl.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  whileHover={{ y: -2 }}
                  className="group relative rounded-2xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-xl transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl">
                      {tpl.emoji}
                    </div>
                    {cat && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-gradient-to-r ${cat.color} text-white shadow-sm`}>
                        {cat.label}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-foreground leading-tight">{tpl.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 flex-1">{tpl.description}</p>
                  <button
                    onClick={() => openTemplate(tpl)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all"
                  >
                    <Plus size={12} /> Criar
                  </button>
                </motion.div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && !loading && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border">
              <FileText size={36} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-bold text-muted-foreground">Nenhum modelo encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">Tente outra busca ou categoria</p>
            </div>
          )}
        </div>

        <AiContractModal
          open={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          onGenerated={(t, c) => {
            setSelectedTemplate(null);
            setEditingContract(null);
            setTitle(t);
            setContent(c);
            setVariables({ "{data_atual}": fmtDate(today) });
            setSignatureLocador(null);
            setSignatureLocatario(null);
            setView("editor");
          }}
        />
      </div>
    );
  }

  /* ═══════════ TEMPLATE SELECTION ═══════════ */
  if (view === "select") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setView("list")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Voltar
          </button>
          <h2 className="text-sm font-bold text-foreground">Escolha um modelo</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive ? `bg-gradient-to-r ${cat.color} text-white shadow-lg` : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}>
                <Icon size={12} /> {cat.label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTemplates.map(tpl => (
            <motion.div key={tpl.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => openTemplate(tpl)}
              className="rounded-2xl border border-border bg-card p-5 cursor-pointer hover:border-primary/50 transition-colors">
              <div className="text-3xl mb-3">{tpl.emoji}</div>
              <h3 className="text-sm font-bold text-foreground">{tpl.name}</h3>
              <p className="text-[11px] text-muted-foreground mt-1">{tpl.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  /* ═══════════ EDITOR ═══════════ */
  if (view === "editor") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button onClick={() => setView("list")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setView("preview")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80">
              <Eye size={12} /> Visualizar
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80">
              <Printer size={12} /> Imprimir
            </button>
            <button onClick={handleDownloadPdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80">
              <Download size={12} /> PDF
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              <CheckCircle2 size={12} /> {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                <PenTool size={12} className="text-primary" /> Variáveis
              </h3>
              {(crmContacts.length > 0 || rentalContracts.length > 0) && (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Preencher automaticamente</p>
                  {crmContacts.length > 0 && (
                    <select onChange={e => { const c = crmContacts.find((x: any) => x.id === e.target.value); if (c) fillFromCrmContact(c); }}
                      className={`${inputCls} text-xs`} defaultValue="">
                      <option value="">Contato do CRM...</option>
                      {crmContacts.map((c: any) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </select>
                  )}
                  {rentalContracts.length > 0 && (
                    <select onChange={e => { const r = rentalContracts.find((x: any) => x.id === e.target.value); if (r) fillFromRental(r); }}
                      className={`${inputCls} text-xs`} defaultValue="">
                      <option value="">Contrato de aluguel...</option>
                      {rentalContracts.map((r: any) => <option key={r.id} value={r.id}>{r.tenant_name} — R$ {r.rent_amount}</option>)}
                    </select>
                  )}
                </div>
              )}
              {VARIABLES.map(v => (
                <div key={v}>
                  <label className={labelCls}>{v.replace(/[{}]/g, "").replace(/_/g, " ")}</label>
                  <input value={variables[v] || ""} onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                    placeholder={v} className={inputCls} />
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                <PenTool size={12} className="text-primary" /> Assinatura digital
              </h3>
              <SignaturePad label="Locador / Vendedor / Proprietário" value={signatureLocador} onChange={setSignatureLocador} />
              <SignaturePad label="Locatário / Comprador" value={signatureLocatario} onChange={setSignatureLocatario} />
              <p className="text-[10px] text-muted-foreground italic">💡 Em breve: assinatura eletrônica certificada com validade jurídica.</p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div>
              <label className={labelCls}>Título do Contrato</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Conteúdo do Contrato</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={28}
                className={`${inputCls} font-mono text-xs leading-relaxed resize-y`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════ PREVIEW ═══════════ */
  if (view === "preview") {
    const filledContent = getFilledContent();
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button onClick={() => setView("editor")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Voltar ao Editor
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80">
              <Printer size={12} /> Imprimir
            </button>
            <button onClick={handleDownloadPdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90">
              <Download size={12} /> Baixar PDF
            </button>
          </div>
        </div>

        <div ref={printRef} className="mx-auto bg-white rounded-xl shadow-xl border border-border overflow-hidden" style={{ maxWidth: 720, minHeight: 900 }}>
          <div className="p-10 sm:p-14">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800" style={{ fontFamily: "'Times New Roman', serif" }}>
              {filledContent}
            </pre>
            {(signatureLocador || signatureLocatario) && (
              <div className="mt-10 space-y-6">
                {signatureLocador && (
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">Assinatura Locador/Vendedor:</p>
                    <img loading="lazy" decoding="async" src={signatureLocador} alt="Assinatura" className="h-16 object-contain" />
                  </div>
                )}
                {signatureLocatario && (
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">Assinatura Locatário/Comprador:</p>
                    <img loading="lazy" decoding="async" src={signatureLocatario} alt="Assinatura" className="h-16 object-contain" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
