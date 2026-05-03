import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Phone, MessageCircle, Clock, ChevronDown, ChevronRight,
  Plus, Trash2, Save, X, Users, Send, Edit3, BarChart3,
  History, GripVertical, Calendar, DollarSign, MapPin, Tag,
  TrendingUp, ArrowRight, Home,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { productUrl } from "@/lib/productUrl";
import { SITE_URL } from "@/lib/siteUrl";

interface SellerContact {
  id: string;
  seller_id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  funnel_stage: string;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  lead_source: string | null;
  budget_min: number | null;
  budget_max: number | null;
  follow_up_date: string | null;
  interested_item_id: string | null;
}

interface ActivityLog {
  id: string;
  contact_id: string;
  action_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

interface SellerItem {
  id: string;
  title: string;
  slug?: string | null;
  price?: number | null;
  images?: string[] | null;
  city?: string | null;
  neighborhood?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
}

const DEFAULT_STAGES = [
  { name: "novo", label: "Novo", color: "#3b82f6", icon: "🆕" },
  { name: "contato", label: "Contato Feito", color: "#f59e0b", icon: "📞" },
  { name: "visita", label: "Visita Agendada", color: "#8b5cf6", icon: "📅" },
  { name: "proposta", label: "Proposta", color: "#f97316", icon: "📋" },
  { name: "negociacao", label: "Negociação", color: "#ec4899", icon: "🤝" },
  { name: "fechado", label: "Fechado", color: "#22c55e", icon: "✅" },
];

const LEAD_SOURCES = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "site", label: "Site" },
  { value: "indicacao", label: "Indicação" },
  { value: "olx", label: "OLX / Portal" },
  { value: "placa", label: "Placa" },
  { value: "outro", label: "Outro" },
];

const WHATSAPP_TEMPLATES: Record<string, { label: string; emoji: string; msg: (name: string, item?: string) => string }[]> = {
  novo: [
    { label: "Saudação", emoji: "👋", msg: (name) => `Olá ${name}! Tudo bem? 😊\nVi que você demonstrou interesse em nossos imóveis. Como posso te ajudar?` },
    { label: "Apresentação", emoji: "🏠", msg: (name) => `Olá ${name}! Sou corretor(a) de imóveis e tenho ótimas opções pra você. Posso te enviar algumas sugestões?` },
  ],
  contato: [
    { label: "Follow-up", emoji: "📲", msg: (name) => `Oi ${name}! 😊 Passando pra saber se você teve alguma dúvida sobre os imóveis que conversamos. Estou à disposição!` },
    { label: "Enviar opções", emoji: "📋", msg: (name) => `${name}, separei algumas opções incríveis que combinam com o que você procura! Posso enviar os detalhes?` },
  ],
  visita: [
    { label: "Confirmar visita", emoji: "📅", msg: (name) => `Olá ${name}! Confirmando nossa visita agendada. Está tudo certo pra você? 😊` },
    { label: "Lembrete", emoji: "⏰", msg: (name) => `Oi ${name}! Só passando pra lembrar da nossa visita ao imóvel. Nos vemos em breve! 🏡` },
  ],
  proposta: [
    { label: "Enviar proposta", emoji: "💰", msg: (name, item) => `${name}, preparei uma proposta especial${item ? ` para o imóvel "${item}"` : ""}! Posso te enviar os detalhes agora?` },
    { label: "Negociar", emoji: "🤝", msg: (name) => `Oi ${name}! Gostaria de conversar sobre condições especiais. Que tal agendarmos uma conversa rápida?` },
  ],
  negociacao: [
    { label: "Atualização", emoji: "📊", msg: (name) => `${name}, tenho novidades sobre a negociação! Podemos conversar agora? 😊` },
    { label: "Fechamento", emoji: "🎯", msg: (name) => `Oi ${name}! Estamos quase finalizando. Vamos alinhar os últimos detalhes?` },
  ],
  fechado: [
    { label: "Parabéns", emoji: "🎉", msg: (name) => `Parabéns ${name}! 🥳🏡 Foi um prazer te ajudar nessa conquista! Conte comigo sempre que precisar.` },
    { label: "Indicação", emoji: "⭐", msg: (name) => `${name}, ficamos felizes com a sua conquista! 🎉 Se conhecer alguém buscando imóvel, ficarei feliz em ajudar!` },
  ],
};

interface SellerCrmTabProps {
  userId: string;
  sellerId: string;
}

type CrmView = "kanban" | "stats" | "history";

export default function SellerCrmTab({ userId, sellerId }: SellerCrmTabProps) {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<SellerContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("todos");
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [view, setView] = useState<CrmView>("kanban");
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [sellerItems, setSellerItems] = useState<SellerItem[]>([]);
  const [teamMembersMap, setTeamMembersMap] = useState<Record<string, { name: string; creci?: string }>>({});

  // Drag state
  const [draggedContact, setDraggedContact] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Add contact form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: "", phone: "", email: "", funnel_stage: "novo",
    lead_source: "", budget_min: "", budget_max: "", follow_up_date: "", interested_item_id: "",
  });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("seller_crm_contacts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setContacts((data as any[]) || []);
    setLoading(false);
  }, [userId]);

  const fetchActivities = useCallback(async () => {
    const { data } = await supabase
      .from("crm_activity_log")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    setActivities((data as any[]) || []);
  }, [userId]);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("seller_items")
      .select("id, title, slug, price, images, city, neighborhood, bedrooms, bathrooms, area")
      .eq("seller_id", sellerId)
      .eq("status", "ativo")
      .order("title");
    setSellerItems((data as any[]) || []);
  }, [sellerId]);

  const fetchTeamMembers = useCallback(async () => {
    const { data } = await supabase
      .from("team_members")
      .select("id, full_name, creci")
      .eq("company_id", sellerId);
    const map: Record<string, { name: string; creci?: string }> = {};
    (data || []).forEach((m: any) => { map[m.id] = { name: m.full_name, creci: m.creci || undefined }; });
    setTeamMembersMap(map);
  }, [sellerId]);

  useEffect(() => {
    fetchContacts();
    fetchActivities();
    fetchItems();
    fetchTeamMembers();
  }, [fetchContacts, fetchActivities, fetchItems]);

  const logActivity = async (contactId: string, actionType: string, description: string, oldValue?: string, newValue?: string) => {
    await supabase.from("crm_activity_log").insert({
      contact_id: contactId,
      user_id: userId,
      action_type: actionType,
      description,
      old_value: oldValue || null,
      new_value: newValue || null,
    } as any);
    fetchActivities();
  };

  const addContact = async () => {
    if (!addForm.full_name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    const payload: any = {
      seller_id: sellerId,
      user_id: userId,
      full_name: addForm.full_name.trim(),
      phone: addForm.phone.trim() || null,
      email: addForm.email.trim() || null,
      funnel_stage: addForm.funnel_stage,
      lead_source: addForm.lead_source || null,
      budget_min: addForm.budget_min ? parseFloat(addForm.budget_min) : null,
      budget_max: addForm.budget_max ? parseFloat(addForm.budget_max) : null,
      follow_up_date: addForm.follow_up_date || null,
      interested_item_id: addForm.interested_item_id || null,
    };
    const { error, data } = await supabase.from("seller_crm_contacts").insert(payload).select("id").single();
    if (error) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      await logActivity((data as any).id, "criado", `Contato "${addForm.full_name.trim()}" adicionado`);
    }
    setAddForm({ full_name: "", phone: "", email: "", funnel_stage: "novo", lead_source: "", budget_min: "", budget_max: "", follow_up_date: "", interested_item_id: "" });
    setShowAddForm(false);
    await fetchContacts();
    toast({ title: "Contato adicionado! ✅" });
  };

  const updateStage = async (contactId: string, newStage: string) => {
    const contact = contacts.find(c => c.id === contactId);
    const oldStageLabel = DEFAULT_STAGES.find(s => s.name === contact?.funnel_stage)?.label || contact?.funnel_stage;
    const newStageLabel = DEFAULT_STAGES.find(s => s.name === newStage)?.label || newStage;

    await supabase.from("seller_crm_contacts").update({ funnel_stage: newStage, updated_at: new Date().toISOString() } as any).eq("id", contactId);
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, funnel_stage: newStage } : c));
    await logActivity(contactId, "etapa", `${contact?.full_name} movido de "${oldStageLabel}" para "${newStageLabel}"`, oldStageLabel, newStageLabel);
  };

  const saveNotes = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    await supabase.from("seller_crm_contacts").update({ notes: notesValue, updated_at: new Date().toISOString() } as any).eq("id", contactId);
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, notes: notesValue } : c));
    setEditingNotes(null);
    await logActivity(contactId, "nota", `Nota atualizada em "${contact?.full_name}"`);
    toast({ title: "Notas salvas!" });
  };

  const saveName = async (contactId: string) => {
    if (!nameValue.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    const contact = contacts.find(c => c.id === contactId);
    await supabase.from("seller_crm_contacts").update({ full_name: nameValue.trim(), updated_at: new Date().toISOString() } as any).eq("id", contactId);
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, full_name: nameValue.trim() } : c));
    setEditingName(null);
    await logActivity(contactId, "nome", `Nome alterado de "${contact?.full_name}" para "${nameValue.trim()}"`, contact?.full_name, nameValue.trim());
    toast({ title: "Nome atualizado!" });
  };

  const updateContactField = async (contactId: string, field: string, value: any) => {
    await supabase.from("seller_crm_contacts").update({ [field]: value, updated_at: new Date().toISOString() } as any).eq("id", contactId);
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, [field]: value } : c));
  };

  const markContacted = async (contactId: string) => {
    const now = new Date().toISOString();
    const contact = contacts.find(c => c.id === contactId);
    await supabase.from("seller_crm_contacts").update({ last_contacted_at: now, updated_at: now } as any).eq("id", contactId);
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, last_contacted_at: now } : c));
    await logActivity(contactId, "contato", `Contato realizado com "${contact?.full_name}"`);
  };

  const deleteContact = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    await supabase.from("seller_crm_contacts").delete().eq("id", contactId);
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    toast({ title: "Contato removido" });
  };

  const buildWhatsAppUrl = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
  };

  const getWhatsAppUrl = (phone: string, name: string) => {
    return buildWhatsAppUrl(phone, `Olá ${name}! 👋`);
  };

  const filtered = contacts.filter((c) => {
    const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "todos" || c.funnel_stage === stageFilter;
    return matchSearch && matchStage;
  });

  const contactsByStage = (stageName: string) => filtered.filter((c) => c.funnel_stage === stageName);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    setDraggedContact(contactId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", contactId);
  };
  const handleDragOver = (e: React.DragEvent, stageName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageName);
  };
  const handleDragLeave = () => setDragOverStage(null);
  const handleDrop = async (e: React.DragEvent, stageName: string) => {
    e.preventDefault();
    setDragOverStage(null);
    if (draggedContact) {
      const contact = contacts.find(c => c.id === draggedContact);
      if (contact && contact.funnel_stage !== stageName) {
        await updateStage(draggedContact, stageName);
      }
    }
    setDraggedContact(null);
  };

  const formatCurrency = (val: number | null) => {
    if (!val) return "";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  };

  // Stats
  const totalContacts = contacts.length;
  const stageStats = DEFAULT_STAGES.map(s => ({
    ...s,
    count: contacts.filter(c => c.funnel_stage === s.name).length,
    pct: totalContacts ? Math.round((contacts.filter(c => c.funnel_stage === s.name).length / totalContacts) * 100) : 0,
  }));
  const conversionRate = totalContacts ? Math.round((contacts.filter(c => c.funnel_stage === "fechado").length / totalContacts) * 100) : 0;
  const followUpsToday = contacts.filter(c => c.follow_up_date && c.follow_up_date <= new Date().toISOString().split("T")[0]).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
            <MessageCircle size={22} className="text-primary" /> Meu CRM
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {contacts.length} contatos • {conversionRate}% conversão
            {followUpsToday > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded-full text-xs font-bold">
                ⏰ {followUpsToday} follow-up{followUpsToday > 1 ? "s" : ""} pendente{followUpsToday > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden border border-border">
            {([
              { key: "kanban", icon: Users, label: "Kanban" },
              { key: "stats", icon: BarChart3, label: "Stats" },
              { key: "history", icon: History, label: "Histórico" },
            ] as { key: CrmView; icon: any; label: string }[]).map(v => (
              <button key={v.key} onClick={() => setView(v.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors ${view === v.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                <v.icon size={13} /> {v.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">
            <Plus size={14} /> Novo Contato
          </button>
        </div>
      </div>

      {/* Add Contact Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-sm text-foreground">Adicionar Contato</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <input value={addForm.full_name} onChange={(e) => setAddForm((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="Nome completo *" className="px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border" />
                <input value={addForm.phone} onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="WhatsApp (ex: 27999999999)" className="px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border" />
                <input value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="E-mail" className="px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border" />
                <select value={addForm.funnel_stage} onChange={(e) => setAddForm((p) => ({ ...p, funnel_stage: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border">
                  {DEFAULT_STAGES.map((s) => <option key={s.name} value={s.name}>{s.icon} {s.label}</option>)}
                </select>
                <select value={addForm.lead_source} onChange={(e) => setAddForm((p) => ({ ...p, lead_source: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border">
                  <option value="">Origem do lead</option>
                  {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select value={addForm.interested_item_id} onChange={(e) => setAddForm((p) => ({ ...p, interested_item_id: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border">
                  <option value="">Imóvel de interesse</option>
                  {sellerItems.map(it => <option key={it.id} value={it.id}>{it.title}</option>)}
                </select>
                <input type="number" value={addForm.budget_min} onChange={(e) => setAddForm((p) => ({ ...p, budget_min: e.target.value }))}
                  placeholder="Valor mínimo (R$)" className="px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border" />
                <input type="number" value={addForm.budget_max} onChange={(e) => setAddForm((p) => ({ ...p, budget_max: e.target.value }))}
                  placeholder="Valor máximo (R$)" className="px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border" />
                <input type="date" value={addForm.follow_up_date} onChange={(e) => setAddForm((p) => ({ ...p, follow_up_date: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border" />
              </div>
              <div className="flex gap-2">
                <button onClick={addContact} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">
                  <Save size={12} className="inline mr-1" /> Salvar
                </button>
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-xl text-xs text-muted-foreground hover:bg-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STATS VIEW */}
      {view === "stats" && (
        <div className="space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{totalContacts}</p>
              <p className="text-xs text-muted-foreground">Total Contatos</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Taxa Conversão</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{followUpsToday}</p>
              <p className="text-xs text-muted-foreground">Follow-ups Hoje</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{contacts.filter(c => c.funnel_stage === "negociacao").length}</p>
              <p className="text-xs text-muted-foreground">Em Negociação</p>
            </div>
          </div>

          {/* Funnel visual */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> Funil de Vendas
            </h3>
            <div className="space-y-2">
              {stageStats.map((stage, i) => (
                <div key={stage.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground w-28 truncate">{stage.icon} {stage.label}</span>
                  <div className="flex-1 bg-secondary rounded-full h-7 overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(stage.pct, 2)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full flex items-center justify-end pr-2"
                      style={{ backgroundColor: stage.color }}
                    >
                      {stage.pct > 10 && (
                        <span className="text-[10px] font-bold text-white">{stage.count}</span>
                      )}
                    </motion.div>
                    {stage.pct <= 10 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">{stage.count}</span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground w-10 text-right">{stage.pct}%</span>
                  {i < stageStats.length - 1 && stageStats[i + 1].count > 0 && stage.count > 0 && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <ArrowRight size={10} /> {Math.round((stageStats[i + 1].count / stage.count) * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Lead sources */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
              <Tag size={16} className="text-primary" /> Origem dos Leads
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LEAD_SOURCES.map(src => {
                const count = contacts.filter(c => c.lead_source === src.value).length;
                return (
                  <div key={src.value} className="bg-secondary rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{count}</p>
                    <p className="text-[10px] text-muted-foreground">{src.label}</p>
                  </div>
                );
              })}
              <div className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-foreground">{contacts.filter(c => !c.lead_source).length}</p>
                <p className="text-[10px] text-muted-foreground">Sem origem</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY VIEW */}
      {view === "history" && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
            <History size={16} className="text-primary" /> Histórico de Atividades
          </h3>
          {(() => {
            // Merge activity logs + contact creation events
            const creationEvents = contacts.map((c) => ({
              id: `creation-${c.id}`,
              contact_id: c.id,
              action_type: "criado",
              description: `Lead "${c.full_name}" recebido${c.lead_source ? ` via ${LEAD_SOURCES.find(s => s.value === c.lead_source)?.label || c.lead_source}` : ""}${(c as any).team_member_id && teamMembersMap[(c as any).team_member_id] ? ` • Corretor: ${teamMembersMap[(c as any).team_member_id].name}` : ""}`,
              old_value: null,
              new_value: null,
              created_at: c.created_at,
            }));
            const merged = [...activities, ...creationEvents]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            if (merged.length === 0) {
              return <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade registrada ainda</p>;
            }
            return (
              <div className="space-y-1">
                {merged.map((act) => {
                  const actionIcons: Record<string, string> = {
                    criado: "🆕", etapa: "📍", contato: "📞", nota: "📝", nome: "✏️",
                  };
                  const relatedContact = contacts.find(c => c.id === act.contact_id);
                  const isCreation = act.id.startsWith("creation-");
                  return (
                    <details key={act.id} className="group border-b border-border last:border-0">
                      <summary className="flex items-start gap-3 py-2.5 cursor-pointer list-none hover:bg-secondary/50 rounded-lg px-2 -mx-2 transition-colors">
                        <span className="text-base mt-0.5">{actionIcons[act.action_type] || "📌"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground">{act.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(act.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground mt-1 group-open:rotate-90 transition-transform" />
                      </summary>
                      {relatedContact && (
                        <div className="ml-10 pb-3 space-y-1.5">
                          <div className="bg-secondary/60 rounded-xl p-3 space-y-1.5 text-xs">
                            <p className="font-semibold text-foreground">{relatedContact.full_name}</p>
                            {relatedContact.phone && (
                              <p className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone size={11} /> {relatedContact.phone}
                              </p>
                            )}
                            {relatedContact.email && (
                              <p className="flex items-center gap-1.5 text-muted-foreground">
                                <MessageCircle size={11} /> {relatedContact.email}
                              </p>
                            )}
                            <p className="flex items-center gap-1.5 text-muted-foreground">
                              <Tag size={11} /> Etapa: {DEFAULT_STAGES.find(s => s.name === relatedContact.funnel_stage)?.label || relatedContact.funnel_stage}
                            </p>
                            {relatedContact.notes && (
                              <p className="text-muted-foreground mt-1 whitespace-pre-line border-t border-border pt-1.5">{relatedContact.notes}</p>
                            )}
                            {(relatedContact as any).team_member_id && teamMembersMap[(relatedContact as any).team_member_id] && (
                              <p className="flex items-center gap-1.5 text-blue-600 font-semibold">
                                <Users size={11} /> {teamMembersMap[(relatedContact as any).team_member_id].name}
                                {teamMembersMap[(relatedContact as any).team_member_id].creci && ` • CRECI ${teamMembersMap[(relatedContact as any).team_member_id].creci}`}
                              </p>
                            )}
                            {act.old_value && act.new_value && (
                              <p className="text-muted-foreground">
                                <span className="line-through opacity-60">{act.old_value}</span> <ArrowRight size={10} className="inline" /> <span className="font-semibold text-foreground">{act.new_value}</span>
                              </p>
                            )}
                            {relatedContact.phone && (
                              <a href={`https://wa.me/55${relatedContact.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg bg-[#25d366] text-white text-[11px] font-bold hover:bg-[#22c55e] transition-colors">
                                <MessageCircle size={12} /> Abrir WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </details>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* KANBAN VIEW */}
      {view === "kanban" && (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar contato..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border" />
            </div>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border">
              <option value="todos">Todas etapas</option>
              {DEFAULT_STAGES.map((s) => <option key={s.name} value={s.name}>{s.icon} {s.label}</option>)}
            </select>
          </div>

          {/* Kanban columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_STAGES.map((stage) => {
              const stageContacts = contactsByStage(stage.name);
              const isDragOver = dragOverStage === stage.name;
              return (
                <div key={stage.name}
                  className={`bg-card border rounded-2xl overflow-hidden transition-all ${isDragOver ? "border-primary ring-2 ring-primary/20 scale-[1.01]" : "border-border"}`}
                  onDragOver={(e) => handleDragOver(e, stage.name)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.name)}>
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between" style={{ borderTopColor: stage.color, borderTopWidth: 3 }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{stage.icon}</span>
                      <span className="font-bold text-sm text-foreground">{stage.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-bold bg-secondary px-2 py-0.5 rounded-full">{stageContacts.length}</span>
                  </div>
                  <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto min-h-[60px]">
                    {stageContacts.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        {isDragOver ? "Solte aqui ✨" : "Nenhum contato"}
                      </p>
                    )}
                    {stageContacts.map((contact) => {
                      const isExpanded = expandedContact === contact.id;
                      const isDragging = draggedContact === contact.id;
                      const itemTitle = sellerItems.find(i => i.id === contact.interested_item_id)?.title;
                      const isFollowUpDue = contact.follow_up_date && contact.follow_up_date <= new Date().toISOString().split("T")[0];
                      return (
                        <motion.div key={contact.id} layout
                          draggable
                          onDragStart={(e: any) => handleDragStart(e, contact.id)}
                          onDragEnd={() => setDraggedContact(null)}
                          className={`bg-background border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${isDragging ? "opacity-40 scale-95" : ""} ${isFollowUpDue ? "ring-1 ring-orange-400/50" : ""}`}
                          onClick={() => setExpandedContact(isExpanded ? null : contact.id)}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <GripVertical size={14} className="text-muted-foreground mt-0.5 shrink-0 hidden sm:block" />
                              <div className="flex-1 min-w-0">
                                {editingName === contact.id ? (
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <input value={nameValue} onChange={(e) => setNameValue(e.target.value)}
                                      className="px-2 py-1 rounded-lg bg-secondary text-foreground text-sm border border-border flex-1 min-w-0"
                                      autoFocus onKeyDown={(e) => { if (e.key === "Enter") saveName(contact.id); if (e.key === "Escape") setEditingName(null); }} />
                                    <button onClick={() => saveName(contact.id)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-primary text-primary-foreground"><Save size={10} /></button>
                                    <button onClick={() => setEditingName(null)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground"><X size={10} /></button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <p className="font-semibold text-sm text-foreground truncate">{contact.full_name}</p>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingName(contact.id); setNameValue(contact.full_name); }}
                                      className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors shrink-0">
                                      <Edit3 size={10} />
                                    </button>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                  {(contact as any).team_member_id && teamMembersMap[(contact as any).team_member_id] && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold flex items-center gap-0.5">
                                      <Users size={8} /> {teamMembersMap[(contact as any).team_member_id].name}
                                      {teamMembersMap[(contact as any).team_member_id].creci && (
                                        <span className="ml-0.5 opacity-75">• CRECI {teamMembersMap[(contact as any).team_member_id].creci}</span>
                                      )}
                                    </span>
                                  )}
                                  {contact.lead_source && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                                      {LEAD_SOURCES.find(s => s.value === contact.lead_source)?.label || contact.lead_source}
                                    </span>
                                  )}
                                  {isFollowUpDue && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 font-bold">
                                      ⏰ Follow-up
                                    </span>
                                  )}
                                </div>
                                {contact.phone && <p className="text-[10px] text-muted-foreground mt-0.5">{contact.phone}</p>}
                                {itemTitle && (
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Home size={9} /> {itemTitle}
                                  </p>
                                )}
                                {(contact.budget_min || contact.budget_max) && (
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <DollarSign size={9} />
                                    {contact.budget_min ? formatCurrency(contact.budget_min) : "?"} – {contact.budget_max ? formatCurrency(contact.budget_max) : "?"}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {contact.phone && (
                                <a href={getWhatsAppUrl(contact.phone, contact.full_name)}
                                  target="_blank" rel="noopener noreferrer"
                                  onClick={(e) => { e.stopPropagation(); markContacted(contact.id); }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">
                                  <MessageCircle size={13} />
                                </a>
                              )}
                              {isExpanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                            </div>
                          </div>

                          {contact.last_contacted_at && (
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock size={10} /> Último contato: {new Date(contact.last_contacted_at).toLocaleDateString("pt-BR")}
                            </p>
                          )}

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                <div className="mt-3 pt-3 border-t border-border space-y-3">
                                  {/* Extra fields */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="text-[10px] font-bold text-muted-foreground mb-1">Origem</p>
                                      <select value={contact.lead_source || ""} onChange={(e) => updateContactField(contact.id, "lead_source", e.target.value || null)}
                                        className="w-full px-2 py-1.5 rounded-lg bg-secondary text-foreground text-[11px] border border-border">
                                        <option value="">Não definida</option>
                                        {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-muted-foreground mb-1">Follow-up</p>
                                      <input type="date" value={contact.follow_up_date || ""}
                                        onChange={(e) => updateContactField(contact.id, "follow_up_date", e.target.value || null)}
                                        className="w-full px-2 py-1.5 rounded-lg bg-secondary text-foreground text-[11px] border border-border" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-muted-foreground mb-1">Imóvel</p>
                                      <select value={contact.interested_item_id || ""} onChange={(e) => updateContactField(contact.id, "interested_item_id", e.target.value || null)}
                                        className="w-full px-2 py-1.5 rounded-lg bg-secondary text-foreground text-[11px] border border-border">
                                        <option value="">Nenhum</option>
                                        {sellerItems.map(it => <option key={it.id} value={it.id}>{it.title}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-muted-foreground mb-1">Valor pretendido</p>
                                      <div className="flex gap-1">
                                        <input type="number" placeholder="Min" value={contact.budget_min || ""}
                                          onChange={(e) => updateContactField(contact.id, "budget_min", e.target.value ? parseFloat(e.target.value) : null)}
                                          className="w-1/2 px-2 py-1.5 rounded-lg bg-secondary text-foreground text-[11px] border border-border" />
                                        <input type="number" placeholder="Max" value={contact.budget_max || ""}
                                          onChange={(e) => updateContactField(contact.id, "budget_max", e.target.value ? parseFloat(e.target.value) : null)}
                                          className="w-1/2 px-2 py-1.5 rounded-lg bg-secondary text-foreground text-[11px] border border-border" />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Move stage */}
                                  <div>
                                    <p className="text-[10px] font-bold text-muted-foreground mb-1">Mover para:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {DEFAULT_STAGES.filter((s) => s.name !== contact.funnel_stage).map((s) => (
                                        <button key={s.name} onClick={() => updateStage(contact.id, s.name)}
                                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-white transition-colors hover:opacity-80"
                                          style={{ backgroundColor: s.color }}>
                                          {s.icon} {s.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* WhatsApp Templates */}
                                  {contact.phone && (
                                    <div>
                                      <p className="text-[10px] font-bold text-muted-foreground mb-1.5">📲 Enviar WhatsApp:</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {(WHATSAPP_TEMPLATES[contact.funnel_stage] || WHATSAPP_TEMPLATES.novo).map((tpl) => {
                                          const itemTitle = sellerItems.find(i => i.id === contact.interested_item_id)?.title;
                                          return (
                                            <a key={tpl.label}
                                              href={buildWhatsAppUrl(contact.phone!, tpl.msg(contact.full_name, itemTitle))}
                                              target="_blank" rel="noopener noreferrer"
                                              onClick={() => markContacted(contact.id)}
                                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-[11px] font-medium hover:bg-green-500/20 transition-colors border border-green-500/20">
                                              <span>{tpl.emoji}</span> {tpl.label}
                                            </a>
                                          );
                                        })}
                                        <a href={`tel:${contact.phone.replace(/\D/g, "")}`}
                                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-[11px] font-medium hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                                          <Phone size={12} /> Ligar
                                        </a>
                                      </div>
                                    </div>
                                  )}

                                  {/* Notes */}
                                  <div>
                                    <p className="text-[10px] font-bold text-muted-foreground mb-1">Notas:</p>
                                    {editingNotes === contact.id ? (
                                      <div className="space-y-1">
                                        <textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)}
                                          className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-xs border border-border resize-none" rows={3} />
                                        <div className="flex gap-1">
                                          <button onClick={() => saveNotes(contact.id)} className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold"><Save size={10} className="inline mr-0.5" /> Salvar</button>
                                          <button onClick={() => setEditingNotes(null)} className="px-2 py-1 rounded-lg text-[10px] text-muted-foreground hover:bg-secondary"><X size={10} /></button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button onClick={() => { setEditingNotes(contact.id); setNotesValue(contact.notes || ""); }}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left w-full">
                                        {contact.notes || "Clique para adicionar notas..."}
                                      </button>
                                    )}
                                  </div>

                                  {/* Delete */}
                                  <button onClick={() => deleteContact(contact.id)}
                                    className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-400 transition-colors">
                                    <Trash2 size={10} /> Remover contato
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {contacts.length === 0 && !showAddForm && view === "kanban" && (
        <div className="text-center py-12">
          <Users size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum contato cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">Clique em "Novo Contato" para começar a organizar seus leads</p>
        </div>
      )}
    </div>
  );
}
