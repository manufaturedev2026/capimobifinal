import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, ArrowLeft, Edit, Trash2, Download, Printer,
  Eye, Clock, CheckCircle2, PenTool, X, Copy, Search,
} from "lucide-react";

/* ═══════════════════════════════════════
   TYPES & TEMPLATES
   ═══════════════════════════════════════ */

interface ContractTemplate {
  id: string;
  name: string;
  emoji: string;
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
  created_at: string;
}

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

const TEMPLATES: ContractTemplate[] = [
  {
    id: "locacao_residencial",
    name: "Locação Residencial",
    emoji: "🏠",
    content: `CONTRATO DE LOCAÇÃO RESIDENCIAL

LOCADOR: {nome_proprietario}, CPF: {cpf_proprietario}

LOCATÁRIO: {nome_inquilino}, CPF: {cpf_inquilino}

O LOCADOR dá em locação ao LOCATÁRIO o imóvel localizado em {endereco_imovel}.

VALOR DO ALUGUEL: R$ {valor_aluguel}

VENCIMENTO: Todo dia {data_vencimento}

PRAZO:
Início: {data_inicio}
Término: {data_fim}

O não pagamento implicará multa e juros conforme legislação vigente.

FORO:
Fica eleito o foro da comarca de {cidade}.

{cidade}, {data_atual}


_________________________
LOCADOR


_________________________
LOCATÁRIO`,
  },
  {
    id: "compra_venda",
    name: "Compra e Venda de Imóvel",
    emoji: "🏢",
    content: `CONTRATO DE COMPRA E VENDA

VENDEDOR: {nome_proprietario}, CPF: {cpf_proprietario}

COMPRADOR: {nome_inquilino}, CPF: {cpf_inquilino}

O VENDEDOR vende ao COMPRADOR o imóvel localizado em {endereco_imovel}.

VALOR TOTAL: R$ {valor_aluguel}

O pagamento será realizado conforme acordado entre as partes.

{cidade}, {data_atual}


_________________________
VENDEDOR


_________________________
COMPRADOR`,
  },
  {
    id: "exclusividade",
    name: "Exclusividade Imobiliária",
    emoji: "🔒",
    content: `CONTRATO DE EXCLUSIVIDADE

PROPRIETÁRIO: {nome_proprietario}, CPF: {cpf_proprietario}

O PROPRIETÁRIO concede exclusividade ao corretor para venda/locação do imóvel localizado em {endereco_imovel}.

Prazo do contrato: {data_inicio} até {data_fim}

Durante este período, o imóvel não poderá ser negociado por terceiros.

{cidade}, {data_atual}


_________________________
PROPRIETÁRIO


_________________________
CORRETOR`,
  },
  {
    id: "administracao",
    name: "Administração de Imóvel",
    emoji: "📋",
    content: `CONTRATO DE ADMINISTRAÇÃO

PROPRIETÁRIO: {nome_proprietario}, CPF: {cpf_proprietario}

O PROPRIETÁRIO autoriza o corretor a administrar o imóvel localizado em {endereco_imovel}.

Inclui:
- Cobrança de aluguel
- Gestão de inquilinos
- Intermediação

Remuneração: percentual sobre o aluguel.

{cidade}, {data_atual}


_________________________
PROPRIETÁRIO


_________________________
ADMINISTRADOR`,
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
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const end = () => {
    setDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{label}</span>
        <button onClick={clear} className="text-[10px] text-red-400 hover:text-red-300 font-bold">Limpar</button>
      </div>
      <canvas
        ref={canvasRef}
        width={340}
        height={120}
        className="border border-border rounded-xl bg-white cursor-crosshair touch-none w-full"
        style={{ maxWidth: 340 }}
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={end}
      />
    </div>
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

  // Editor state
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [editingContract, setEditingContract] = useState<SavedContract | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [signatureLocador, setSignatureLocador] = useState<string | null>(null);
  const [signatureLocatario, setSignatureLocatario] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // CRM contacts for auto-fill
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
    setVariables({});
    setSignatureLocador(null);
    setSignatureLocatario(null);

    // Auto-fill data_atual
    const autoVars: Record<string, string> = { "{data_atual}": fmtDate(today) };
    setVariables(autoVars);
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
    setVariables(prev => ({
      ...prev,
      "{nome_inquilino}": contact.full_name || "",
      "{cpf_inquilino}": "",
      "{cidade}": "",
    }));
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
      filled = filled.replaceAll(key, val || key);
    }
    return filled;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Informe o título do contrato" });
      return;
    }
    setSaving(true);
    const payload = {
      user_id: userId,
      seller_id: sellerId,
      template_type: selectedTemplate?.id || "custom",
      title: title.trim(),
      content,
      variables,
      signature_locador: signatureLocador,
      signature_locatario: signatureLocatario,
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

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
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
      ${signatureLocador ? `<p style="margin-top:40px;"><strong>Assinatura Locador/Vendedor:</strong><br/><img class="sig-img" src="${signatureLocador}" /></p>` : ""}
      ${signatureLocatario ? `<p><strong>Assinatura Locatário/Comprador:</strong><br/><img class="sig-img" src="${signatureLocatario}" /></p>` : ""}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleDownloadPdf = () => {
    // Use print dialog with "Save as PDF"
    handlePrint();
    toast({ title: "Use 'Salvar como PDF' na janela de impressão", description: "Seu navegador permite salvar como PDF no diálogo de impressão." });
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelCls = "block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5";

  const filtered = savedContracts.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.template_type.toLowerCase().includes(search.toLowerCase())
  );

  /* ═══════════ LIST VIEW ═══════════ */
  if (view === "list") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <FileText size={18} className="text-primary" /> Contratos & Assinaturas
          </h2>
          <button
            onClick={() => setView("select")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} /> Novo Contrato
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar contratos..."
            className={`${inputCls} pl-9`}
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground font-bold">Nenhum contrato gerado</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em "Novo Contrato" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => {
              const tpl = TEMPLATES.find(t => t.id === c.template_type);
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => openSaved(c)}>
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                        {tpl?.emoji || "📄"}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{c.title}</h3>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(c.created_at).toLocaleDateString("pt-BR")}
                          {" • "}
                          {tpl?.name || c.template_type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openSaved(c)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
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
          <h2 className="text-sm font-bold text-foreground">Selecionar Modelo</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map(tpl => (
            <motion.div
              key={tpl.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openTemplate(tpl)}
              className="rounded-2xl border border-border bg-card p-5 cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="text-3xl mb-3">{tpl.emoji}</div>
              <h3 className="text-sm font-bold text-foreground">{tpl.name}</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Modelo pronto com variáveis dinâmicas</p>
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
        {/* Header */}
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
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <CheckCircle2 size={12} /> {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Variables */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                <PenTool size={12} className="text-primary" /> Variáveis
              </h3>

              {/* Auto-fill from CRM */}
              {(crmContacts.length > 0 || rentalContracts.length > 0) && (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Preencher automaticamente</p>
                  {crmContacts.length > 0 && (
                    <select
                      onChange={e => {
                        const c = crmContacts.find((x: any) => x.id === e.target.value);
                        if (c) fillFromCrmContact(c);
                      }}
                      className={`${inputCls} text-xs`}
                      defaultValue=""
                    >
                      <option value="">Contato do CRM...</option>
                      {crmContacts.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  )}
                  {rentalContracts.length > 0 && (
                    <select
                      onChange={e => {
                        const r = rentalContracts.find((x: any) => x.id === e.target.value);
                        if (r) fillFromRental(r);
                      }}
                      className={`${inputCls} text-xs`}
                      defaultValue=""
                    >
                      <option value="">Contrato de aluguel...</option>
                      {rentalContracts.map((r: any) => (
                        <option key={r.id} value={r.id}>{r.tenant_name} — R$ {r.rent_amount}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {VARIABLES.map(v => (
                <div key={v}>
                  <label className={labelCls}>{v.replace(/[{}]/g, "").replace(/_/g, " ")}</label>
                  <input
                    value={variables[v] || ""}
                    onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                    placeholder={v}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>

            {/* Signatures */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                <PenTool size={12} className="text-primary" /> Assinaturas
              </h3>
              <SignaturePad label="Locador / Vendedor / Proprietário" value={signatureLocador} onChange={setSignatureLocador} />
              <SignaturePad label="Locatário / Comprador" value={signatureLocatario} onChange={setSignatureLocatario} />
            </div>
          </div>

          {/* Right: Content Editor */}
          <div className="lg:col-span-2 space-y-3">
            <div>
              <label className={labelCls}>Título do Contrato</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Conteúdo do Contrato</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={28}
                className={`${inputCls} font-mono text-xs leading-relaxed resize-y`}
              />
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

        {/* A4-like preview */}
        <div
          ref={printRef}
          className="mx-auto bg-white rounded-xl shadow-xl border border-border overflow-hidden"
          style={{ maxWidth: 720, minHeight: 900 }}
        >
          <div className="p-10 sm:p-14">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800" style={{ fontFamily: "'Times New Roman', serif" }}>
              {filledContent}
            </pre>

            {(signatureLocador || signatureLocatario) && (
              <div className="mt-10 space-y-6">
                {signatureLocador && (
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">Assinatura Locador/Vendedor:</p>
                    <img src={signatureLocador} alt="Assinatura" className="h-16 object-contain" />
                  </div>
                )}
                {signatureLocatario && (
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">Assinatura Locatário/Comprador:</p>
                    <img src={signatureLocatario} alt="Assinatura" className="h-16 object-contain" />
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
