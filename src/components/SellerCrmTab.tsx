import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Phone, MessageCircle, Clock, ChevronDown, ChevronRight,
  Plus, Trash2, Save, X, Users, Filter, Send, Edit3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
}

const DEFAULT_STAGES = [
  { name: "novo", label: "Novo", color: "#3b82f6" },
  { name: "contato", label: "Contato Feito", color: "#f59e0b" },
  { name: "visita", label: "Visita Agendada", color: "#8b5cf6" },
  { name: "proposta", label: "Proposta", color: "#f97316" },
  { name: "negociacao", label: "Negociação", color: "#ec4899" },
  { name: "fechado", label: "Fechado", color: "#22c55e" },
];

interface SellerCrmTabProps {
  userId: string;
  sellerId: string;
}

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

  // Add contact form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", phone: "", email: "", funnel_stage: "novo" });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("seller_crm_contacts" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setContacts((data as any[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const addContact = async () => {
    if (!addForm.full_name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("seller_crm_contacts" as any).insert({
      seller_id: sellerId,
      user_id: userId,
      full_name: addForm.full_name.trim(),
      phone: addForm.phone.trim() || null,
      email: addForm.email.trim() || null,
      funnel_stage: addForm.funnel_stage,
    } as any);
    if (error) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
      return;
    }
    setAddForm({ full_name: "", phone: "", email: "", funnel_stage: "novo" });
    setShowAddForm(false);
    await fetchContacts();
    toast({ title: "Contato adicionado! ✅" });
  };

  const updateStage = async (contactId: string, newStage: string) => {
    await supabase.from("seller_crm_contacts" as any).update({ funnel_stage: newStage, updated_at: new Date().toISOString() } as any).eq("id", contactId);
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, funnel_stage: newStage } : c));
  };

  const saveNotes = async (contactId: string) => {
    await supabase.from("seller_crm_contacts" as any).update({ notes: notesValue, updated_at: new Date().toISOString() } as any).eq("id", contactId);
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, notes: notesValue } : c));
    setEditingNotes(null);
    toast({ title: "Notas salvas!" });
  };

  const markContacted = async (contactId: string) => {
    const now = new Date().toISOString();
    await supabase.from("seller_crm_contacts" as any).update({ last_contacted_at: now, updated_at: now } as any).eq("id", contactId);
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, last_contacted_at: now } : c));
  };

  const deleteContact = async (contactId: string) => {
    await supabase.from("seller_crm_contacts" as any).delete().eq("id", contactId);
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    toast({ title: "Contato removido" });
  };

  const getWhatsAppUrl = (phone: string, name: string) => {
    const msg = `Olá ${name}! 👋`;
    const cleanPhone = phone.replace(/\D/g, "");
    const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
  };

  const filtered = contacts.filter((c) => {
    const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "todos" || c.funnel_stage === stageFilter;
    return matchSearch && matchStage;
  });

  const contactsByStage = (stageName: string) => filtered.filter((c) => c.funnel_stage === stageName);

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
          <p className="text-sm text-muted-foreground mt-0.5">{contacts.length} contatos no pipeline</p>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">
          <Plus size={14} /> Novo Contato
        </button>
      </div>

      {/* Add Contact Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-sm text-foreground">Adicionar Contato</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={addForm.full_name} onChange={(e) => setAddForm((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="Nome completo *" className="px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border" />
                <input value={addForm.phone} onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="WhatsApp (ex: 27999999999)" className="px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border" />
                <input value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="E-mail" className="px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border" />
                <select value={addForm.funnel_stage} onChange={(e) => setAddForm((p) => ({ ...p, funnel_stage: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border">
                  {DEFAULT_STAGES.map((s) => <option key={s.name} value={s.name}>{s.label}</option>)}
                </select>
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
          {DEFAULT_STAGES.map((s) => <option key={s.name} value={s.name}>{s.label}</option>)}
        </select>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEFAULT_STAGES.map((stage) => {
          const stageContacts = contactsByStage(stage.name);
          return (
            <div key={stage.name} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between" style={{ borderTopColor: stage.color, borderTopWidth: 3 }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="font-bold text-sm text-foreground">{stage.label}</span>
                </div>
                <span className="text-xs text-muted-foreground font-bold bg-secondary px-2 py-0.5 rounded-full">{stageContacts.length}</span>
              </div>
              <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
                {stageContacts.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum contato</p>
                )}
                {stageContacts.map((contact) => {
                  const isExpanded = expandedContact === contact.id;
                  return (
                    <motion.div key={contact.id} layout
                      className="bg-background border border-border rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setExpandedContact(isExpanded ? null : contact.id)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{contact.full_name}</p>
                          {contact.email && <p className="text-[10px] text-muted-foreground truncate">{contact.email}</p>}
                          {contact.phone && <p className="text-[10px] text-muted-foreground">{contact.phone}</p>}
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
                              {/* Move stage */}
                              <div>
                                <p className="text-[10px] font-bold text-muted-foreground mb-1">Mover para:</p>
                                <div className="flex flex-wrap gap-1">
                                  {DEFAULT_STAGES.filter((s) => s.name !== contact.funnel_stage).map((s) => (
                                    <button key={s.name} onClick={() => updateStage(contact.id, s.name)}
                                      className="px-2 py-1 rounded-lg text-[10px] font-bold text-white transition-colors hover:opacity-80"
                                      style={{ backgroundColor: s.color }}>
                                      {s.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* WhatsApp */}
                              {contact.phone && (
                                <div className="flex gap-1">
                                  <a href={getWhatsAppUrl(contact.phone, contact.full_name)}
                                    target="_blank" rel="noopener noreferrer"
                                    onClick={() => markContacted(contact.id)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-[11px] font-medium hover:bg-green-500/20 transition-colors border border-green-500/20">
                                    <Phone size={12} /> Enviar WhatsApp
                                  </a>
                                  <a href={`tel:${contact.phone.replace(/\D/g, "")}`}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-[11px] font-medium hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                                    <Phone size={12} /> Ligar
                                  </a>
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

      {contacts.length === 0 && !showAddForm && (
        <div className="text-center py-12">
          <Users size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum contato cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">Clique em "Novo Contato" para começar a organizar seus leads</p>
        </div>
      )}
    </div>
  );
}
