import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Phone, MessageCircle, User, Clock, ChevronDown, ChevronRight,
  Plus, Trash2, Edit3, Save, X, Users, Filter, SlidersHorizontal, Send,
  CheckCircle2, AlertCircle, ArrowRight, RefreshCw, GripVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CrmContact {
  id: string;
  user_id: string;
  profile_id: string;
  full_name: string;
  phone: string | null;
  email: string;
  funnel_stage: string;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
}

interface FunnelStage {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

interface Template {
  id: string;
  name: string;
  stage: string;
  message: string;
  sort_order: number;
}

export default function AdminCrmTab() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("todos");
  const [subTab, setSubTab] = useState<"pipeline" | "templates" | "stages">("pipeline");
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Drag and drop
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Template editing
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: "", stage: "", message: "" });
  const [addingTemplate, setAddingTemplate] = useState(false);

  // Stage editing
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [stageForm, setStageForm] = useState({ name: "", color: "#3b82f6" });
  const [addingStage, setAddingStage] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [contactsRes, stagesRes, templatesRes] = await Promise.all([
      supabase.from("crm_contacts").select("*").order("created_at", { ascending: false }) as any,
      supabase.from("crm_funnel_stages").select("*").order("sort_order") as any,
      supabase.from("crm_templates").select("*").order("sort_order") as any,
    ]);
    setContacts(contactsRes.data || []);
    const uniqueStages = Array.from(
      new Map((stagesRes.data || []).map((stage: FunnelStage) => [stage.name.toLowerCase(), stage])).values()
    ) as FunnelStage[];
    setStages(uniqueStages);
    setTemplates(templatesRes.data || []);
    setLoading(false);
  };

  const syncNewProfiles = async () => {
    setSyncing(true);
    const existingUserIds = contacts.map((c) => c.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, phone, email, created_at")
      .order("created_at", { ascending: false }) as any;

    if (profiles) {
      const newProfiles = profiles.filter((p: any) => !existingUserIds.includes(p.user_id));
      if (newProfiles.length > 0) {
        const inserts = newProfiles.map((p: any) => ({
          user_id: p.user_id,
          profile_id: p.id,
          full_name: p.full_name || "Sem nome",
          phone: p.phone,
          email: p.email,
          funnel_stage: "novo",
        }));
        await supabase.from("crm_contacts").insert(inserts as any);
        toast({ title: `${newProfiles.length} novo(s) contato(s) sincronizado(s)!` });
        await fetchAll();
      } else {
        toast({ title: "Nenhum novo contato para sincronizar" });
      }
    }
    setSyncing(false);
  };

  const updateStage = async (contactId: string, newStage: string) => {
    await supabase.from("crm_contacts").update({ funnel_stage: newStage, updated_at: new Date().toISOString() } as any).eq("id", contactId);
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, funnel_stage: newStage } : c));
  };

  const saveNotes = async (contactId: string) => {
    await supabase.from("crm_contacts").update({ notes: notesValue, updated_at: new Date().toISOString() } as any).eq("id", contactId);
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, notes: notesValue } : c));
    setEditingNotes(null);
    toast({ title: "Notas salvas!" });
  };

  const markContacted = async (contactId: string) => {
    const now = new Date().toISOString();
    await supabase.from("crm_contacts").update({ last_contacted_at: now, updated_at: now } as any).eq("id", contactId);
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, last_contacted_at: now } : c));
  };

  const deleteContact = async (contactId: string) => {
    await supabase.from("crm_contacts").delete().eq("id", contactId) as any;
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    toast({ title: "Contato removido" });
  };

  const getWhatsAppUrl = (phone: string, template: string, name: string) => {
    const msg = template.replace(/\{nome\}/g, name);
    const cleanPhone = phone.replace(/\D/g, "");
    const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    setDraggedContactId(contactId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", contactId);
    // Add a slight delay to allow the ghost to render
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "1";
    setDraggedContactId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageName);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the column entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverStage(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, stageName: string) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("text/plain");
    if (contactId) {
      const contact = contacts.find((c) => c.id === contactId);
      if (contact && contact.funnel_stage !== stageName) {
        await updateStage(contactId, stageName);
        toast({ title: `Contato movido para "${stageName}"` });
      }
    }
    setDraggedContactId(null);
    setDragOverStage(null);
  };

  // Touch drag support
  const touchDragRef = useRef<{ contactId: string; startY: number; clone: HTMLElement | null } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, contactId: string) => {
    const touch = e.touches[0];
    setDraggedContactId(contactId);
    touchDragRef.current = { contactId, startY: touch.clientY, clone: null };
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchDragRef.current) return;
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback(async (e: TouchEvent) => {
    if (!touchDragRef.current) return;
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const column = element?.closest("[data-stage]");
    if (column) {
      const stageName = column.getAttribute("data-stage");
      if (stageName && touchDragRef.current.contactId) {
        const contact = contacts.find((c) => c.id === touchDragRef.current!.contactId);
        if (contact && contact.funnel_stage !== stageName) {
          await updateStage(touchDragRef.current.contactId, stageName);
          toast({ title: `Contato movido para "${stageName}"` });
        }
      }
    }
    touchDragRef.current = null;
    setDraggedContactId(null);
    setDragOverStage(null);
  }, [contacts, updateStage, toast]);

  useEffect(() => {
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  // Template CRUD
  const saveTemplate = async (id: string) => {
    await supabase.from("crm_templates").update({ name: templateForm.name, stage: templateForm.stage, message: templateForm.message } as any).eq("id", id);
    setEditingTemplate(null);
    await fetchAll();
    toast({ title: "Template atualizado!" });
  };

  const addTemplate = async () => {
    await supabase.from("crm_templates").insert({ ...templateForm, sort_order: templates.length } as any);
    setAddingTemplate(false);
    setTemplateForm({ name: "", stage: "", message: "" });
    await fetchAll();
    toast({ title: "Template criado!" });
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from("crm_templates").delete().eq("id", id) as any;
    await fetchAll();
    toast({ title: "Template removido" });
  };

  // Stage CRUD
  const saveStageDb = async (id: string) => {
    await supabase.from("crm_funnel_stages").update({ name: stageForm.name, color: stageForm.color } as any).eq("id", id);
    setEditingStage(null);
    await fetchAll();
    toast({ title: "Etapa atualizada!" });
  };

  const addStageDb = async () => {
    await supabase.from("crm_funnel_stages").insert({ ...stageForm, sort_order: stages.length } as any);
    setAddingStage(false);
    setStageForm({ name: "", color: "#3b82f6" });
    await fetchAll();
    toast({ title: "Etapa criada!" });
  };

  const deleteStageDb = async (id: string) => {
    await supabase.from("crm_funnel_stages").delete().eq("id", id) as any;
    await fetchAll();
    toast({ title: "Etapa removida" });
  };

  const filtered = contacts.filter((c) => {
    const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "todos" || c.funnel_stage === stageFilter;
    return matchSearch && matchStage;
  });

  const getStageColor = (stageName: string) => stages.find((s) => s.name.toLowerCase() === stageName.toLowerCase())?.color || "#6b7280";

  const contactsByStage = (stageName: string) => filtered.filter((c) => c.funnel_stage.toLowerCase() === stageName.toLowerCase());

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
            <MessageCircle size={22} className="text-primary" /> CRM WhatsApp
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{contacts.length} contatos no pipeline</p>
        </div>
        <button onClick={syncNewProfiles} disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} /> Sincronizar Novos Cadastros
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {([
          { id: "pipeline" as const, label: "Pipeline", icon: Users },
          { id: "templates" as const, label: "Templates", icon: Send },
          { id: "stages" as const, label: "Etapas do Funil", icon: SlidersHorizontal },
        ]).map((t) => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${subTab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* PIPELINE VIEW */}
      {subTab === "pipeline" && (
        <div className="space-y-4">
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
              {stages.map((s) => <option key={s.id} value={s.name.toLowerCase()}>{s.name}</option>)}
            </select>
          </div>

          {/* Drag hint */}
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <GripVertical size={12} /> Arraste os contatos entre as colunas para mover no funil
          </p>

          {/* Kanban columns with drag-and-drop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stages.map((stage) => {
              const stageLower = stage.name.toLowerCase();
              const stageContacts = contactsByStage(stage.name);
              const isDragOver = dragOverStage === stageLower;

              return (
                <div
                  key={stage.id}
                  data-stage={stageLower}
                  className={`bg-card border rounded-2xl overflow-hidden transition-all duration-200 ${
                    isDragOver ? "border-primary ring-2 ring-primary/30 scale-[1.01]" : "border-border"
                  }`}
                  onDragOver={(e) => handleDragOver(e, stageLower)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stageLower)}
                >
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between" style={{ borderTopColor: stage.color, borderTopWidth: 3 }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="font-bold text-sm text-foreground">{stage.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-bold bg-secondary px-2 py-0.5 rounded-full">{stageContacts.length}</span>
                  </div>

                  <div className={`p-2 space-y-2 max-h-[500px] overflow-y-auto min-h-[60px] transition-colors ${isDragOver ? "bg-primary/5" : ""}`}>
                    {stageContacts.length === 0 && !isDragOver && (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhum contato</p>
                    )}
                    {isDragOver && stageContacts.length === 0 && (
                      <div className="border-2 border-dashed border-primary/40 rounded-xl py-6 text-center">
                        <p className="text-xs text-primary font-semibold">Solte aqui</p>
                      </div>
                    )}

                    {stageContacts.map((contact) => {
                      const stageTemplates = templates.filter((t) => t.stage === contact.funnel_stage);
                      const isExpanded = expandedContact === contact.id;
                      const isDragged = draggedContactId === contact.id;

                      return (
                        <div
                          key={contact.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, contact.id)}
                          onDragEnd={handleDragEnd}
                          onTouchStart={(e) => handleTouchStart(e, contact.id)}
                          className={`bg-background border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all select-none ${
                            isDragged ? "opacity-50 scale-95" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2" onClick={() => setExpandedContact(isExpanded ? null : contact.id)}>
                            <GripVertical size={14} className="text-muted-foreground/50 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate">{contact.full_name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{contact.email}</p>
                              {contact.phone && <p className="text-[10px] text-muted-foreground">{contact.phone}</p>}
                            </div>
                            {isExpanded ? <ChevronDown size={14} className="text-muted-foreground shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                          </div>

                          {contact.last_contacted_at && (
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 ml-6">
                              <Clock size={10} /> Último contato: {new Date(contact.last_contacted_at).toLocaleDateString("pt-BR")}
                            </p>
                          )}

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                <div className="mt-3 pt-3 border-t border-border space-y-3 ml-6">
                                  {/* Move stage buttons */}
                                  <div>
                                    <p className="text-[10px] font-bold text-muted-foreground mb-1">Mover para:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {stages.filter((s) => s.name.toLowerCase() !== contact.funnel_stage).map((s) => (
                                        <button key={s.id} onClick={() => updateStage(contact.id, s.name.toLowerCase())}
                                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-white transition-colors hover:opacity-80"
                                          style={{ backgroundColor: s.color }}>
                                          {s.name}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* WhatsApp templates */}
                                  {contact.phone && stageTemplates.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-muted-foreground mb-1">Enviar via WhatsApp:</p>
                                      <div className="space-y-1">
                                        {stageTemplates.map((t) => (
                                          <a key={t.id} href={getWhatsAppUrl(contact.phone!, t.message, contact.full_name)}
                                            target="_blank" rel="noopener noreferrer"
                                            onClick={() => markContacted(contact.id)}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-[11px] font-medium hover:bg-green-500/20 transition-colors border border-green-500/20">
                                            <Phone size={12} /> {t.name}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {contact.phone && stageTemplates.length === 0 && (
                                    <a href={getWhatsAppUrl(contact.phone, `Olá ${contact.full_name}! 👋`, contact.full_name)}
                                      target="_blank" rel="noopener noreferrer"
                                      onClick={() => markContacted(contact.id)}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-[11px] font-medium hover:bg-green-500/20 transition-colors border border-green-500/20">
                                      <Phone size={12} /> WhatsApp direto
                                    </a>
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
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-destructive hover:bg-destructive/10 transition-colors">
                                    <Trash2 size={10} /> Remover contato
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TEMPLATES VIEW */}
      {subTab === "templates" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Templates de mensagem para cada etapa do funil</p>
            <button onClick={() => { setAddingTemplate(true); setTemplateForm({ name: "", stage: stages[0]?.name.toLowerCase() || "novo", message: "" }); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">
              <Plus size={14} /> Novo Template
            </button>
          </div>

          {addingTemplate && (
            <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-3">
              <input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="Nome do template"
                className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border" />
              <select value={templateForm.stage} onChange={(e) => setTemplateForm({ ...templateForm, stage: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border">
                {stages.map((s) => <option key={s.id} value={s.name.toLowerCase()}>{s.name}</option>)}
              </select>
              <textarea value={templateForm.message} onChange={(e) => setTemplateForm({ ...templateForm, message: e.target.value })} placeholder="Mensagem (use {nome} para inserir o nome do contato)"
                className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border resize-none" rows={4} />
              <div className="flex gap-2">
                <button onClick={() => setAddingTemplate(false)} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-secondary">Cancelar</button>
                <button onClick={addTemplate} disabled={!templateForm.name || !templateForm.message}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50">Criar Template</button>
              </div>
            </div>
          )}

          {/* Group templates by stage */}
          {stages.map((stage) => {
            const stageTemplates = templates.filter((t) => t.stage === stage.name.toLowerCase());
            if (stageTemplates.length === 0) return null;
            return (
              <div key={stage.id}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h3 className="font-bold text-sm text-foreground">{stage.name}</h3>
                  <span className="text-xs text-muted-foreground">({stageTemplates.length})</span>
                </div>
                <div className="space-y-2 ml-5">
                  {stageTemplates.map((t) => (
                    <div key={t.id} className="bg-card border border-border rounded-2xl p-4">
                      {editingTemplate === t.id ? (
                        <div className="space-y-3">
                          <input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border" />
                          <select value={templateForm.stage} onChange={(e) => setTemplateForm({ ...templateForm, stage: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border">
                            {stages.map((s) => <option key={s.id} value={s.name.toLowerCase()}>{s.name}</option>)}
                          </select>
                          <textarea value={templateForm.message} onChange={(e) => setTemplateForm({ ...templateForm, message: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border resize-none" rows={4} />
                          <div className="flex gap-2">
                            <button onClick={() => setEditingTemplate(null)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-secondary">Cancelar</button>
                            <button onClick={() => saveTemplate(t.id)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold">Salvar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <span className="font-bold text-sm text-foreground">{t.name}</span>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1">{t.message}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => { setEditingTemplate(t.id); setTemplateForm({ name: t.name, stage: t.stage, message: t.message }); }}
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Edit3 size={14} /></button>
                            <button onClick={() => deleteTemplate(t.id)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STAGES VIEW */}
      {subTab === "stages" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Configure as etapas do seu funil de vendas</p>
            <button onClick={() => { setAddingStage(true); setStageForm({ name: "", color: "#3b82f6" }); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">
              <Plus size={14} /> Nova Etapa
            </button>
          </div>

          {addingStage && (
            <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-3">
              <div className="flex gap-3">
                <input value={stageForm.name} onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })} placeholder="Nome da etapa"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border" />
                <input type="color" value={stageForm.color} onChange={(e) => setStageForm({ ...stageForm, color: e.target.value })}
                  className="w-12 h-10 rounded-xl border border-border cursor-pointer" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAddingStage(false)} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-secondary">Cancelar</button>
                <button onClick={addStageDb} disabled={!stageForm.name}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50">Criar Etapa</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {stages.map((s) => (
              <div key={s.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                {editingStage === s.id ? (
                  <div className="flex-1 flex items-center gap-3">
                    <input value={stageForm.name} onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl bg-secondary text-foreground text-sm border border-border" />
                    <input type="color" value={stageForm.color} onChange={(e) => setStageForm({ ...stageForm, color: e.target.value })}
                      className="w-10 h-8 rounded-lg border border-border cursor-pointer" />
                    <button onClick={() => saveStageDb(s.id)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"><Save size={12} /></button>
                    <button onClick={() => setEditingStage(null)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-secondary"><X size={12} /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-bold text-sm text-foreground">{s.name}</span>
                      <span className="text-xs text-muted-foreground">({contactsByStage(s.name).length} contatos)</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingStage(s.id); setStageForm({ name: s.name, color: s.color }); }}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Edit3 size={14} /></button>
                      <button onClick={() => deleteStageDb(s.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
