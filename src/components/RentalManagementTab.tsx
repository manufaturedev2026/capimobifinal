import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════
   DATE HELPERS (BR format dd/mm/yyyy <-> ISO yyyy-mm-dd)
   ═══════════════════════════════════════ */
const isoToBr = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
};
const brToIso = (br: string) => {
  const clean = br.replace(/\D/g, "");
  if (clean.length < 8) return "";
  const d = clean.slice(0, 2), m = clean.slice(2, 4), y = clean.slice(4, 8);
  return `${y}-${m}-${d}`;
};
const maskDateBr = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

import {
  Home, Plus, ArrowLeft, Edit, Trash2, Phone, Mail, Calendar,
  DollarSign, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  Send, MessageCircle, X, FileText, User, Building2, Search,
  ChevronRight, Eye, Filter, MoreVertical, Ban, RefreshCw, Receipt,
  Image as ImageIcon, Upload, MapPin,
} from "lucide-react";

/* ═══════════════════════════════════════
   TYPES
   ═══════════════════════════════════════ */
interface RentalContract {
  id: string;
  user_id: string;
  seller_id: string;
  item_id: string | null;
  item_label: string | null;
  tenant_name: string;
  tenant_cpf_cnpj: string | null;
  tenant_phone: string | null;
  tenant_email: string | null;
  rent_amount: number;
  due_day: number;
  late_fee_percent: number | null;
  daily_interest_percent: number | null;
  start_date: string;
  end_date: string | null;
  status: "ativo" | "encerrado" | "cancelado" | "renovacao";
  notes: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  created_at: string;
}

interface RentalPayment {
  id: string;
  user_id: string;
  contract_id: string;
  reference_month: string;
  amount_due: number;
  amount_paid: number | null;
  late_fee: number | null;
  interest: number | null;
  total_due: number;
  due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  status: "pago" | "pendente" | "atrasado" | "parcial";
  notes: string | null;
  created_at: string;
}

interface PropertyOption {
  id: string;
  title: string;
  city: string | null;
}

interface RentalProperty {
  id: string;
  user_id: string;
  seller_id: string;
  title: string;
  address: string | null;
  city: string | null;
  photo_url: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface Props {
  userId: string;
  sellerId: string;
}

/* ═══════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════ */
const STATUS_CONFIG = {
  ativo: { label: "Ativo", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", dot: "bg-emerald-500" },
  encerrado: { label: "Encerrado", color: "bg-slate-500/15 text-slate-500 border-slate-500/30", dot: "bg-slate-500" },
  cancelado: { label: "Cancelado", color: "bg-red-500/15 text-red-500 border-red-500/30", dot: "bg-red-500" },
  renovacao: { label: "Renovação", color: "bg-blue-500/15 text-blue-500 border-blue-500/30", dot: "bg-blue-500" },
};

const PAYMENT_STATUS_CONFIG = {
  pago: { label: "Pago", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
  pendente: { label: "Pendente", color: "bg-amber-500/15 text-amber-600 border-amber-500/30", icon: Clock },
  atrasado: { label: "Atrasado", color: "bg-red-500/15 text-red-500 border-red-500/30", icon: AlertTriangle },
  parcial: { label: "Parcial", color: "bg-orange-500/15 text-orange-500 border-orange-500/30", icon: DollarSign },
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

type View = "dashboard" | "contracts" | "form" | "detail" | "payments" | "rental-properties" | "rental-property-form";

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
export default function RentalManagementTab({ userId, sellerId }: Props) {
  const { toast } = useToast();
  const [view, setView] = useState<View>("dashboard");
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [payments, setPayments] = useState<RentalPayment[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [rentalProperties, setRentalProperties] = useState<RentalProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);
  const [editingContract, setEditingContract] = useState<RentalContract | null>(null);
  const [editingRentalProp, setEditingRentalProp] = useState<RentalProperty | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  // ── Fetch data ──
  useEffect(() => {
    fetchAll();
  }, [sellerId]);

  const fetchAll = async () => {
    setLoading(true);
    const [cRes, pRes, iRes, rpRes] = await Promise.all([
      supabase.from("rental_contracts").select("*").eq("seller_id", sellerId).order("created_at", { ascending: false }),
      supabase.from("rental_payments").select("*").eq("user_id", userId).order("due_date", { ascending: false }),
      supabase.from("seller_items").select("id, title, city").eq("seller_id", sellerId).eq("status", "ativo"),
      supabase.from("rental_properties" as any).select("*").eq("seller_id", sellerId).order("created_at", { ascending: false }),
    ]);
    setContracts((cRes.data as RentalContract[]) || []);
    setPayments((pRes.data as RentalPayment[]) || []);
    setProperties((iRes.data as PropertyOption[]) || []);
    setRentalProperties((rpRes.data as unknown as RentalProperty[]) || []);
    setLoading(false);
  };

  // ── Reminder helpers (moved before metrics so metrics can use it) ──
  const getPaymentReminders = (contract: RentalContract) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    
    // Check if there's already a paid payment for current month
    const monthPayment = payments.find(p => p.contract_id === contract.id && p.reference_month === currentMonth);
    if (monthPayment?.status === "pago") return null;

    // Check contract end_date — if expired, always show overdue
    if (contract.end_date) {
      const endDate = new Date(contract.end_date + "T23:59:59");
      if (endDate < now) {
        const daysExpired = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        return { type: "atrasado" as const, label: `Contrato vencido há ${daysExpired} dia${daysExpired !== 1 ? 's' : ''}`, color: "text-red-500" };
      }
    }

    // Check current month's due day (compare by calendar day, not timestamp)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(now.getFullYear(), now.getMonth(), contract.due_day);
    const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      if (!monthPayment || monthPayment.status === "atrasado" || monthPayment.status === "pendente") {
        return { type: "atrasado" as const, label: `Atrasado ${overdueDays} dia${overdueDays !== 1 ? 's' : ''}`, color: "text-red-500" };
      }
    }
    if (diffDays === 0) return { type: "no_vencimento" as const, label: "⚠️ Vence HOJE!", color: "text-orange-500" };
    if (diffDays === 1) return { type: "antes_vencimento" as const, label: "Vence amanhã!", color: "text-amber-500" };
    if (diffDays <= 3) return { type: "antes_vencimento" as const, label: `Vence em ${diffDays} dias`, color: "text-amber-500" };
    if (diffDays <= 7) return { type: "antes_vencimento" as const, label: `Vence em ${diffDays} dias`, color: "text-blue-500" };
    return null;
  };

  // ── Dashboard metrics ──
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const activeContracts = contracts.filter(c => c.status === "ativo");
    const monthPayments = payments.filter(p => p.reference_month === currentMonth);
    const totalToReceive = activeContracts.reduce((s, c) => s + c.rent_amount, 0);
    const totalReceived = monthPayments.filter(p => p.status === "pago").reduce((s, p) => s + (p.amount_paid || 0), 0);
    
    // Count overdue: explicit atrasado payments + active contracts past due day with no payment
    const explicitOverdue = payments.filter(p => p.status === "atrasado").length;
    const implicitOverdue = activeContracts.filter(c => {
      const reminder = getPaymentReminders(c);
      return reminder?.type === "atrasado";
    }).length;
    const overdue = Math.max(explicitOverdue, implicitOverdue);
    
    const upcoming = activeContracts.filter(c => {
      const reminder = getPaymentReminders(c);
      return reminder?.type === "antes_vencimento" || reminder?.type === "no_vencimento";
    }).length;
    
    return { totalToReceive, totalReceived, overdue, upcoming, activeContracts: activeContracts.length, monthPayments };
  }, [contracts, payments]);

  // ── Filtered contracts ──
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      if (statusFilter !== "todos" && c.status !== statusFilter) return false;
      if (search && !c.tenant_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [contracts, statusFilter, search]);
  // ── Quick actions from alerts ──
  const markAsPaid = async (contract: RentalContract) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(contract.due_day).padStart(2, "0")}`;
    
    // Check if payment record exists
    const existing = payments.find(p => p.contract_id === contract.id && p.reference_month === currentMonth);
    if (existing) {
      await supabase.from("rental_payments").update({ status: "pago", amount_paid: contract.rent_amount, paid_at: now.toISOString(), payment_method: "manual" }).eq("id", existing.id);
    } else {
      await supabase.from("rental_payments").insert({
        user_id: userId, contract_id: contract.id, reference_month: currentMonth,
        amount_due: contract.rent_amount, total_due: contract.rent_amount, amount_paid: contract.rent_amount,
        due_date: dueDate, status: "pago" as any, paid_at: now.toISOString(), payment_method: "manual",
      });
    }
    toast({ title: "✅ Pago!", description: `Pagamento de ${contract.tenant_name} registrado.` });
    setExpandedAlertId(null);
    fetchAll();
  };

  const updateContractStatus = async (contract: RentalContract, newStatus: "ativo" | "encerrado" | "cancelado" | "renovacao") => {
    await supabase.from("rental_contracts").update({ status: newStatus }).eq("id", contract.id);
    const labels = { ativo: "Ativado", encerrado: "Encerrado", cancelado: "Cancelado", renovacao: "Em Renovação" };
    toast({ title: `📋 ${labels[newStatus]}`, description: `Contrato de ${contract.tenant_name} atualizado.` });
    setExpandedAlertId(null);
    fetchAll();
  };

  const sendWhatsAppReminder = (contract: RentalContract, type: string) => {
    if (!contract.tenant_phone) {
      toast({ title: "Sem telefone", description: "O inquilino não tem telefone cadastrado." });
      return;
    }
    const phone = contract.tenant_phone.replace(/\D/g, "");
    let msg = "";
    if (type === "antes_vencimento") {
      msg = `Olá ${contract.tenant_name}! 🏠\n\nLembrete: seu aluguel de ${fmt(contract.rent_amount)} vence no dia ${contract.due_day}.\n\nQualquer dúvida, estou à disposição!`;
    } else if (type === "no_vencimento") {
      msg = `Olá ${contract.tenant_name}! 🏠\n\nHoje é o dia do vencimento do seu aluguel de ${fmt(contract.rent_amount)}.\n\nPor favor, confirme o pagamento. Obrigado!`;
    } else {
      msg = `Olá ${contract.tenant_name}! 🏠\n\nSeu aluguel de ${fmt(contract.rent_amount)} está em atraso. Multa de ${contract.late_fee_percent || 2}% + juros de ${contract.daily_interest_percent || 0.033}% ao dia.\n\nPor favor, regularize o quanto antes.`;
    }
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    // Log reminder
    supabase.from("rental_reminders").insert({
      user_id: userId,
      contract_id: contract.id,
      reminder_type: type as any,
      channel: "whatsapp",
      is_sent: true,
      sent_at: new Date().toISOString(),
      message: msg,
    });
    toast({ title: "Lembrete enviado!", description: `Mensagem enviada para ${contract.tenant_name}` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ═══════════════════════════════════════
     DASHBOARD VIEW
     ═══════════════════════════════════════ */
  if (view === "dashboard") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Building2 size={22} className="text-primary" /> Gestão de Aluguéis
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">Controle seus contratos, pagamentos e lembretes</p>
          </div>
          <button
            onClick={() => { setEditingContract(null); setView("form"); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Novo Contrato
          </button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "A Receber (mês)", value: fmt(metrics.totalToReceive), icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
            { label: "Recebido (mês)", value: fmt(metrics.totalReceived), icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Atrasados", value: String(metrics.overdue), icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
            { label: "Próx. Vencimentos", value: String(metrics.upcoming), icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => setView("contracts")} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors text-left">
            <FileText size={20} className="text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">Contratos</p>
              <p className="text-xs text-muted-foreground">{contracts.length} cadastrados</p>
            </div>
          </button>
          <button onClick={() => setView("payments")} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors text-left">
            <DollarSign size={20} className="text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-foreground">Pagamentos</p>
              <p className="text-xs text-muted-foreground">{payments.length} registros</p>
            </div>
          </button>
          <button onClick={() => setView("rental-properties")} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors text-left">
            <Home size={20} className="text-blue-500" />
            <div>
              <p className="text-sm font-bold text-foreground">Meus Imóveis</p>
              <p className="text-xs text-muted-foreground">{rentalProperties.length} cadastrados</p>
            </div>
          </button>
          <button
            onClick={() => { setEditingContract(null); setView("form"); }}
            className="flex items-center gap-3 p-4 rounded-2xl border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
          >
            <Plus size={20} className="text-primary" />
            <div>
              <p className="text-sm font-bold text-primary">Novo Contrato</p>
              <p className="text-xs text-muted-foreground">Cadastrar inquilino</p>
            </div>
          </button>
        </div>

        {/* ── All contracts with reminders (active or expired) ── */}
        {(() => {
          const alertContracts = contracts
            .filter(c => c.status === "ativo" || c.status === "renovacao")
            .map(c => ({ contract: c, reminder: getPaymentReminders(c) }))
            .filter(x => x.reminder !== null);
          if (alertContracts.length === 0) return null;
          return (
            <div>
              <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" /> Alertas de Vencimento ({alertContracts.length})
              </h3>
              <div className="space-y-2">
                {alertContracts.map(({ contract, reminder }) => {
                  const isExpanded = expandedAlertId === contract.id;
                  return (
                    <motion.div
                      key={contract.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-xl border bg-card overflow-hidden transition-all ${reminder!.type === "atrasado" ? "border-red-500/40" : "border-border"}`}
                    >
                      {/* Main row - clickable */}
                      <button
                        onClick={() => setExpandedAlertId(isExpanded ? null : contract.id)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${reminder!.type === "atrasado" ? "bg-red-500/15" : reminder!.type === "no_vencimento" ? "bg-orange-500/15" : "bg-muted"}`}>
                            {reminder!.type === "atrasado" ? <AlertTriangle size={16} className="text-red-500" /> : reminder!.type === "no_vencimento" ? <AlertTriangle size={16} className="text-orange-500" /> : <Clock size={16} className="text-muted-foreground" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{contract.tenant_name}</p>
                            <p className={`text-xs font-medium ${reminder!.color}`}>{reminder!.label} — {fmt(contract.rent_amount)}</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </button>

                      {/* Expanded actions */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <button
                                onClick={() => markAsPaid(contract)}
                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                              >
                                <CheckCircle2 size={14} /> Marcar Pago
                              </button>
                              <button
                                onClick={() => sendWhatsAppReminder(contract, reminder!.type)}
                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-colors"
                              >
                                <Send size={14} /> WhatsApp
                              </button>
                              <button
                                onClick={() => updateContractStatus(contract, "renovacao")}
                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                              >
                                <RefreshCw size={14} /> Renovar
                              </button>
                              <button
                                onClick={() => updateContractStatus(contract, "cancelado")}
                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                              >
                                <Ban size={14} /> Cancelar
                              </button>
                            </div>
                            {/* Extra info */}
                            <div className="px-3 pb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {contract.tenant_phone && (
                                <span className="flex items-center gap-1"><Phone size={12} /> {contract.tenant_phone}</span>
                              )}
                              <span className="flex items-center gap-1"><Calendar size={12} /> Vence dia {contract.due_day}</span>
                              <span className="flex items-center gap-1"><DollarSign size={12} /> Multa {contract.late_fee_percent || 2}% + Juros {contract.daily_interest_percent || 0.033}%/dia</span>
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
        })()}

        {/* ── Contract Expiry Alerts ── */}
        {(() => {
          const now = new Date();
          const expiringContracts = contracts
            .filter(c => (c.status === "ativo" || c.status === "renovacao") && c.end_date)
            .map(c => {
              const end = new Date(c.end_date! + "T23:59:59");
              const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return { contract: c, diffDays };
            })
            .filter(x => x.diffDays <= 30)
            .sort((a, b) => a.diffDays - b.diffDays);
          if (expiringContracts.length === 0) return null;
          return (
            <div>
              <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                <FileText size={16} className="text-orange-500" /> Contratos Próximos do Vencimento ({expiringContracts.length})
              </h3>
              <div className="space-y-2">
                {expiringContracts.map(({ contract, diffDays }) => {
                  const expired = diffDays <= 0;
                  const absDays = Math.abs(diffDays);
                  const label = expired
                    ? `Contrato venceu há ${absDays} dia${absDays !== 1 ? "s" : ""}`
                    : diffDays === 0
                    ? "Contrato vence HOJE!"
                    : `Contrato vence em ${diffDays} dia${diffDays !== 1 ? "s" : ""}`;
                  const color = expired ? "text-red-500" : diffDays <= 7 ? "text-orange-500" : "text-amber-500";
                  const bgIcon = expired ? "bg-red-500/15" : diffDays <= 7 ? "bg-orange-500/15" : "bg-amber-500/15";
                  const endFormatted = contract.end_date ? new Date(contract.end_date + "T00:00:00").toLocaleDateString("pt-BR") : "";
                  return (
                    <div key={contract.id} className={`flex items-center justify-between p-3 rounded-xl border bg-card ${expired ? "border-red-500/40" : "border-border"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bgIcon}`}>
                          <FileText size={16} className={color} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{contract.tenant_name}</p>
                          <p className={`text-xs font-medium ${color}`}>{label} — Término: {endFormatted}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateContractStatus(contract, "renovacao")} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1">
                          <RefreshCw size={12} /> Renovar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Rental Properties Grid ── */}
        {rentalProperties.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Home size={16} className="text-blue-500" /> Imóveis Cadastrados ({rentalProperties.length})
              </h3>
              <button onClick={() => { setEditingRentalProp(null); setView("rental-property-form"); }} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <Plus size={12} /> Cadastrar
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {rentalProperties.slice(0, 8).map(rp => (
                <div key={rp.id} className="rounded-xl border border-border bg-card overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => { setEditingRentalProp(rp); setView("rental-property-form"); }}>
                  {rp.photo_url ? (
                    <img loading="lazy" decoding="async" src={rp.photo_url} alt={rp.title} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-secondary flex items-center justify-center">
                      <Home size={24} className="text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-foreground truncate">{rp.title}</p>
                    {rp.city && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin size={8} />{rp.city}</p>}
                    {rp.owner_name && <p className="text-[10px] text-muted-foreground truncate">{rp.owner_name}</p>}
                  </div>
                </div>
              ))}
            </div>
            {rentalProperties.length > 8 && (
              <button onClick={() => setView("rental-properties")} className="text-xs font-bold text-primary hover:underline mt-2">
                Ver todos ({rentalProperties.length})
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════
     RENTAL PROPERTIES LIST VIEW
     ═══════════════════════════════════════ */
  if (view === "rental-properties") {
    const deleteRentalProp = async (id: string) => {
      await supabase.from("rental_properties" as any).delete().eq("id", id);
      toast({ title: "Imóvel removido" });
      fetchAll();
    };
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setView("dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Voltar
          </button>
          <button onClick={() => { setEditingRentalProp(null); setView("rental-property-form"); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90">
            <Plus size={14} /> Novo Imóvel
          </button>
        </div>
        {rentalProperties.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <Home size={40} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-bold text-foreground mb-1">Nenhum imóvel cadastrado</p>
            <p className="text-xs text-muted-foreground">Cadastre imóveis para usar nos contratos de aluguel</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rentalProperties.map(rp => (
              <div key={rp.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                {rp.photo_url ? (
                  <img loading="lazy" decoding="async" src={rp.photo_url} alt={rp.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-secondary flex items-center justify-center">
                    <Home size={32} className="text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-3 space-y-2">
                  <p className="font-bold text-sm text-foreground">{rp.title}</p>
                  {rp.address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={10} />{rp.address}</p>}
                  {rp.city && <p className="text-xs text-muted-foreground">{rp.city}</p>}
                  {rp.owner_name && <p className="text-xs text-muted-foreground flex items-center gap-1"><User size={10} />{rp.owner_name}</p>}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { setEditingRentalProp(rp); setView("rental-property-form"); }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80">
                      <Edit size={10} /> Editar
                    </button>
                    <button onClick={() => deleteRentalProp(rp.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20">
                      <Trash2 size={10} /> Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════
     RENTAL PROPERTY FORM VIEW
     ═══════════════════════════════════════ */
  if (view === "rental-property-form") {
    return (
      <RentalPropertyForm
        userId={userId}
        sellerId={sellerId}
        editing={editingRentalProp}
        onSave={() => { fetchAll(); setView("rental-properties"); }}
        onCancel={() => setView("rental-properties")}
      />
    );
  }

  /* ═══════════════════════════════════════
     CONTRACTS LIST VIEW
     ═══════════════════════════════════════ */
  if (view === "contracts") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setView("dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Voltar
          </button>
          <button
            onClick={() => { setEditingContract(null); setView("form"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90"
          >
            <Plus size={14} /> Novo
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar inquilino..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {["todos", "ativo", "encerrado", "cancelado", "renovacao"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/30"}`}
              >
                {s === "todos" ? "Todos" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contract Cards */}
        {filteredContracts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <FileText size={40} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum contrato encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContracts.map((contract) => {
              const cfg = STATUS_CONFIG[contract.status];
              const reminder = getPaymentReminders(contract);
              const property = properties.find(p => p.id === contract.item_id);
              
              // Calculate days until next payment
              const now = new Date();
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              let nextDue = new Date(now.getFullYear(), now.getMonth(), contract.due_day);
              if (nextDue < today) nextDue = new Date(now.getFullYear(), now.getMonth() + 1, contract.due_day);
              const daysUntil = Math.round((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
              const isPaidThisMonth = payments.some(p => p.contract_id === contract.id && p.reference_month === currentMonth && p.status === "pago");

              return (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => { setSelectedContract(contract); setView("detail"); }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <User size={20} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{contract.tenant_name}</h3>
                        {(property || (contract as any).item_label) && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Home size={10} /> {property?.title || (contract as any).item_label}
                          </p>
                        )}
                        <p className="text-xs font-bold text-primary mt-0.5">{fmt(contract.rent_amount)}/mês</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {reminder && (
                        <span className={`text-[10px] font-medium ${reminder.color}`}>{reminder.label}</span>
                      )}
                    </div>
                  </div>
                  {/* Next payment countdown */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                    {contract.status === "ativo" && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        isPaidThisMonth
                          ? "bg-emerald-500/10 text-emerald-600"
                          : daysUntil === 0
                            ? "bg-orange-500/10 text-orange-600"
                            : daysUntil <= 3
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-primary/10 text-primary"
                      }`}>
                        {isPaidThisMonth ? (
                          <><CheckCircle2 size={12} /> Pago este mês</>
                        ) : daysUntil === 0 ? (
                          <><AlertTriangle size={12} /> Vence HOJE</>
                        ) : (
                          <><Clock size={12} /> {daysUntil} dia{daysUntil !== 1 ? "s" : ""} p/ próximo pgto</>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3 ml-auto text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar size={10} /> Dia {contract.due_day}</span>
                      <span className="flex items-center gap-1"><Calendar size={10} /> {fmtDate(contract.start_date)}{contract.end_date ? ` → ${fmtDate(contract.end_date)}` : ""}</span>
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

  /* ═══════════════════════════════════════
     CONTRACT DETAIL VIEW
     ═══════════════════════════════════════ */
  if (view === "detail" && selectedContract) {
    const contract = selectedContract;
    const cfg = STATUS_CONFIG[contract.status];
    const contractPayments = payments.filter(p => p.contract_id === contract.id);
    const property = properties.find(p => p.id === contract.item_id);
    const reminder = getPaymentReminders(contract);

    const handleDelete = async () => {
      await supabase.from("rental_contracts").delete().eq("id", contract.id);
      toast({ title: "Contrato excluído" });
      setView("contracts");
      fetchAll();
    };

    const handleStatusChange = async (newStatus: "ativo" | "encerrado" | "cancelado" | "renovacao") => {
      await supabase.from("rental_contracts").update({ status: newStatus as any }).eq("id", contract.id);
      toast({ title: `Status alterado para ${STATUS_CONFIG[newStatus]?.label}` });
      fetchAll();
      setSelectedContract({ ...contract, status: newStatus });
    };

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setView("contracts")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditingContract(contract); setView("form"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80"
            >
              <Edit size={12} /> Editar
            </button>
            <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20">
              <Trash2 size={12} /> Excluir
            </button>
          </div>
        </div>

        {/* Contract Header */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">{contract.tenant_name}</h2>
              {(property || (contract as any).item_label) && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Home size={11} /> {property?.title || (contract as any).item_label}</p>}
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${cfg.color}`}>{cfg.label}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {contract.tenant_cpf_cnpj && (
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">CPF/CNPJ</p><p className="font-bold text-foreground">{contract.tenant_cpf_cnpj}</p></div>
            )}
            {contract.tenant_phone && (
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Telefone</p><p className="font-bold text-foreground">{contract.tenant_phone}</p></div>
            )}
            {contract.tenant_email && (
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</p><p className="font-bold text-foreground">{contract.tenant_email}</p></div>
            )}
            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Valor</p><p className="font-black text-primary text-lg">{fmt(contract.rent_amount)}</p></div>
            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vencimento</p><p className="font-bold text-foreground">Dia {contract.due_day}</p></div>
            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Período</p><p className="font-bold text-foreground">{fmtDate(contract.start_date)}{contract.end_date ? ` → ${fmtDate(contract.end_date)}` : ""}</p></div>
            {contract.late_fee_percent != null && (
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Multa</p><p className="font-bold text-foreground">{contract.late_fee_percent}%</p></div>
            )}
            {contract.daily_interest_percent != null && (
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Juros/dia</p><p className="font-bold text-foreground">{contract.daily_interest_percent}%</p></div>
            )}
            {contract.owner_name && (
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Proprietário</p><p className="font-bold text-foreground">{contract.owner_name}</p></div>
            )}
          </div>

          {contract.notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Observações</p>
              <p className="text-sm text-foreground">{contract.notes}</p>
            </div>
          )}
        </div>

        {/* Reminder Actions */}
        {reminder && contract.status === "ativo" && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-bold ${reminder.color}`}>{reminder.label}</p>
                <p className="text-xs text-muted-foreground">Envie um lembrete ao inquilino</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => sendWhatsAppReminder(contract, reminder.type)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500 text-white hover:bg-green-600"
                >
                  <MessageCircle size={12} /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Actions */}
        <div className="flex gap-2 flex-wrap">
          {(["ativo", "encerrado", "cancelado", "renovacao"] as const).filter(s => s !== contract.status).map(s => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${STATUS_CONFIG[s].color} hover:opacity-80 transition-opacity`}
            >
              Marcar como {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>

        {/* Payment History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-foreground">Histórico de Pagamentos</h3>
            <PaymentFormButton contract={contract} userId={userId} onSave={fetchAll} />
          </div>
          {contractPayments.length === 0 ? (
            <div className="text-center py-8 rounded-xl border border-dashed border-border">
              <DollarSign size={24} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Nenhum pagamento registrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contractPayments.map(payment => {
                const pcfg = PAYMENT_STATUS_CONFIG[payment.status];
                return (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${payment.status === "pago" ? "bg-emerald-500/10" : payment.status === "atrasado" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
                        <pcfg.icon size={14} className={payment.status === "pago" ? "text-emerald-500" : payment.status === "atrasado" ? "text-red-500" : "text-amber-500"} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{payment.reference_month}</p>
                        <p className="text-[10px] text-muted-foreground">Venc: {fmtDate(payment.due_date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-foreground">{fmt(payment.total_due)}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${pcfg.color}`}>{pcfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════
     PAYMENTS GLOBAL VIEW
     ═══════════════════════════════════════ */
  if (view === "payments") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setView("dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Voltar
          </button>
          <h2 className="text-sm font-bold text-foreground">Todos os Pagamentos</h2>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <DollarSign size={40} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map(payment => {
              const pcfg = PAYMENT_STATUS_CONFIG[payment.status];
              const contract = contracts.find(c => c.id === payment.contract_id);
              return (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${payment.status === "pago" ? "bg-emerald-500/10" : payment.status === "atrasado" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
                      <pcfg.icon size={16} className={payment.status === "pago" ? "text-emerald-500" : payment.status === "atrasado" ? "text-red-500" : "text-amber-500"} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{contract?.tenant_name || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">{payment.reference_month} • Venc: {fmtDate(payment.due_date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{fmt(payment.total_due)}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${pcfg.color}`}>{pcfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════
     CONTRACT FORM VIEW
     ═══════════════════════════════════════ */
  return (
    <ContractForm
      userId={userId}
      sellerId={sellerId}
      properties={properties}
      rentalProperties={rentalProperties}
      editing={editingContract}
      onSave={() => { fetchAll(); setView("contracts"); }}
      onCancel={() => setView(editingContract ? "detail" : "dashboard")}
    />
  );
}

/* ═══════════════════════════════════════
   CONTRACT FORM SUB-COMPONENT
   ═══════════════════════════════════════ */
function ContractForm({ userId, sellerId, properties, rentalProperties, editing, onSave, onCancel }: {
  userId: string;
  sellerId: string;
  properties: PropertyOption[];
  rentalProperties: RentalProperty[];
  editing: RentalContract | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tenant_name: editing?.tenant_name || "",
    tenant_cpf_cnpj: editing?.tenant_cpf_cnpj || "",
    tenant_phone: editing?.tenant_phone || "",
    tenant_email: editing?.tenant_email || "",
    item_id: editing?.item_id || "",
    item_label: (editing as any)?.item_label || "",
    rent_amount: editing?.rent_amount?.toString() || "",
    due_day: editing?.due_day?.toString() || "10",
    late_fee_percent: editing?.late_fee_percent?.toString() || "2",
    daily_interest_percent: editing?.daily_interest_percent?.toString() || "0.033",
    start_date: isoToBr(editing?.start_date || new Date().toISOString().split("T")[0]),
    end_date: isoToBr(editing?.end_date || ""),
    status: editing?.status || "ativo",
    notes: editing?.notes || "",
    owner_name: editing?.owner_name || "",
    owner_phone: editing?.owner_phone || "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.tenant_name || !form.rent_amount || !form.start_date) {
      toast({ title: "Preencha os campos obrigatórios", description: "Nome, valor e data de início são obrigatórios." });
      return;
    }
    setSaving(true);
    const payload = {
      user_id: userId,
      seller_id: sellerId,
      tenant_name: form.tenant_name.trim(),
      tenant_cpf_cnpj: form.tenant_cpf_cnpj || null,
      tenant_phone: form.tenant_phone || null,
      tenant_email: form.tenant_email || null,
      item_id: form.item_id || null,
      item_label: form.item_label || null,
      rent_amount: parseFloat(form.rent_amount),
      due_day: parseInt(form.due_day) || 10,
      late_fee_percent: parseFloat(form.late_fee_percent) || 2,
      daily_interest_percent: parseFloat(form.daily_interest_percent) || 0.033,
      start_date: brToIso(form.start_date) || form.start_date,
      end_date: brToIso(form.end_date) || form.end_date || null,
      status: form.status as "ativo" | "encerrado" | "cancelado" | "renovacao",
      notes: form.notes || null,
      owner_name: form.owner_name || null,
      owner_phone: form.owner_phone || null,
    };

    if (editing) {
      await supabase.from("rental_contracts").update(payload).eq("id", editing.id);
      toast({ title: "Contrato atualizado!" });
    } else {
      await supabase.from("rental_contracts").insert(payload);
      toast({ title: "Contrato cadastrado!" });
    }
    setSaving(false);
    onSave();
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelCls = "block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Voltar
        </button>
        <h2 className="text-sm font-bold text-foreground">{editing ? "Editar Contrato" : "Novo Contrato"}</h2>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        {/* Tenant Info */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><User size={14} className="text-primary" /> Dados do Inquilino</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelCls}>Nome *</label><input value={form.tenant_name} onChange={e => set("tenant_name", e.target.value)} placeholder="Nome completo" className={inputCls} /></div>
            <div><label className={labelCls}>CPF/CNPJ</label><input value={form.tenant_cpf_cnpj} onChange={e => set("tenant_cpf_cnpj", e.target.value)} placeholder="000.000.000-00" className={inputCls} /></div>
            <div><label className={labelCls}>Telefone</label><input value={form.tenant_phone} onChange={e => set("tenant_phone", e.target.value)} placeholder="(27) 99999-9999" className={inputCls} /></div>
            <div><label className={labelCls}>Email</label><input value={form.tenant_email} onChange={e => set("tenant_email", e.target.value)} placeholder="email@exemplo.com" className={inputCls} /></div>
          </div>
        </div>

        {/* Property & Owner */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Home size={14} className="text-primary" /> Imóvel e Proprietário</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Selecionar Imóvel</label>
              <select value={form.item_id} onChange={e => {
                const val = e.target.value;
                set("item_id", val);
                // Auto-fill label and owner from rental property
                const rp = rentalProperties.find(r => r.id === val);
                if (rp) {
                  set("item_label", `${rp.title}${rp.city ? ` — ${rp.city}` : ""}`);
                  if (rp.owner_name && !form.owner_name) set("owner_name", rp.owner_name);
                  if (rp.owner_phone && !form.owner_phone) set("owner_phone", rp.owner_phone);
                } else {
                  const sp = properties.find(p => p.id === val);
                  if (sp && !form.item_label) set("item_label", `${sp.title}${sp.city ? ` — ${sp.city}` : ""}`);
                }
              }} className={inputCls}>
                <option value="">Nenhum (manual)</option>
                {rentalProperties.length > 0 && (
                  <optgroup label="📋 Imóveis de Aluguel">
                    {rentalProperties.map(rp => <option key={rp.id} value={rp.id}>{rp.title}{rp.city ? ` — ${rp.city}` : ""}</option>)}
                  </optgroup>
                )}
              </select>
            </div>
            <div>
              <label className={labelCls}>Imóvel Vinculado (texto)</label>
              <input value={form.item_label} onChange={e => set("item_label", e.target.value)} placeholder="Ex: Apt 302, Ed. Solar, Centro" className={inputCls} />
            </div>
            <div><label className={labelCls}>Nome do Proprietário</label><input value={form.owner_name} onChange={e => set("owner_name", e.target.value)} placeholder="Nome do proprietário" className={inputCls} /></div>
            <div><label className={labelCls}>Telefone do Proprietário</label><input value={form.owner_phone} onChange={e => set("owner_phone", e.target.value)} placeholder="(27) 99999-9999" className={inputCls} /></div>
          </div>
        </div>

        {/* Financial */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><DollarSign size={14} className="text-primary" /> Financeiro</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><label className={labelCls}>Valor do Aluguel *</label><input type="number" value={form.rent_amount} onChange={e => set("rent_amount", e.target.value)} placeholder="1500" className={inputCls} /></div>
            <div><label className={labelCls}>Dia Vencimento *</label><input type="number" min={1} max={31} value={form.due_day} onChange={e => set("due_day", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Multa (%)</label><input type="number" step="0.1" value={form.late_fee_percent} onChange={e => set("late_fee_percent", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Juros/dia (%)</label><input type="number" step="0.001" value={form.daily_interest_percent} onChange={e => set("daily_interest_percent", e.target.value)} className={inputCls} /></div>
          </div>
        </div>

        {/* Dates & Status */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Calendar size={14} className="text-primary" /> Período</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className={labelCls}>Data de Início *</label><input type="text" inputMode="numeric" placeholder="dd/mm/aaaa" value={form.start_date} onChange={e => set("start_date", maskDateBr(e.target.value))} className={inputCls} /></div>
            <div><label className={labelCls}>Data de Término</label><input type="text" inputMode="numeric" placeholder="dd/mm/aaaa" value={form.end_date} onChange={e => set("end_date", maskDateBr(e.target.value))} className={inputCls} /></div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)} className={inputCls}>
                <option value="ativo">Ativo</option>
                <option value="encerrado">Encerrado</option>
                <option value="cancelado">Cancelado</option>
                <option value="renovacao">Renovação</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls}>Observações</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Observações adicionais..." className={inputCls} />
        </div>

        <button onClick={handleSubmit} disabled={saving} className="w-full py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
          {saving ? "Salvando..." : editing ? "Atualizar Contrato" : "Cadastrar Contrato"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   PAYMENT FORM BUTTON SUB-COMPONENT
   ═══════════════════════════════════════ */
function PaymentFormButton({ contract, userId, onSave }: { contract: RentalContract; userId: string; onSave: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({
    reference_month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    amount_paid: contract.rent_amount.toString(),
    due_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(contract.due_day).padStart(2, "0")}`,
    payment_method: "pix",
    status: "pago" as string,
    notes: "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    await supabase.from("rental_payments").insert({
      user_id: userId,
      contract_id: contract.id,
      reference_month: form.reference_month,
      amount_due: contract.rent_amount,
      amount_paid: parseFloat(form.amount_paid) || 0,
      total_due: contract.rent_amount,
      due_date: form.due_date,
      paid_at: form.status === "pago" ? new Date().toISOString() : null,
      payment_method: form.payment_method || null,
      status: form.status as any,
      notes: form.notes || null,
      late_fee: 0,
      interest: 0,
    });
    setSaving(false);
    setOpen(false);
    toast({ title: "Pagamento registrado!" });
    onSave();
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelCls = "block text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1";

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90">
        <Plus size={12} /> Registrar Pagamento
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-background rounded-2xl border border-border p-5 w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Registrar Pagamento</h3>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Mês Ref.</label><input type="month" value={form.reference_month} onChange={e => set("reference_month", e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Data Vencimento</label><input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Valor Pago</label><input type="number" value={form.amount_paid} onChange={e => set("amount_paid", e.target.value)} className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Método</label>
                  <select value={form.payment_method} onChange={e => set("payment_method", e.target.value)} className={inputCls}>
                    <option value="pix">Pix</option>
                    <option value="boleto">Boleto</option>
                    <option value="transferencia">Transferência</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => set("status", e.target.value)} className={inputCls}>
                    <option value="pago">Pago</option>
                    <option value="pendente">Pendente</option>
                    <option value="atrasado">Atrasado</option>
                    <option value="parcial">Parcial</option>
                  </select>
                </div>
                <div className="col-span-2"><label className={labelCls}>Observações</label><input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Observações..." className={inputCls} /></div>
              </div>

              <button onClick={handleSubmit} disabled={saving} className="w-full py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {saving ? "Salvando..." : "Registrar"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════
   RENTAL PROPERTY FORM SUB-COMPONENT
   ═══════════════════════════════════════ */
function RentalPropertyForm({ userId, sellerId, editing, onSave, onCancel }: {
  userId: string;
  sellerId: string;
  editing: RentalProperty | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: editing?.title || "",
    address: editing?.address || "",
    city: editing?.city || "",
    photo_url: editing?.photo_url || "",
    owner_name: editing?.owner_name || "",
    owner_phone: editing?.owner_phone || "",
    notes: editing?.notes || "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `rental-properties/${sellerId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("seller-photos").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro ao enviar foto", variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("seller-photos").getPublicUrl(path);
    set("photo_url", pub.publicUrl);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({ title: "Informe o nome do imóvel" });
      return;
    }
    setSaving(true);
    const payload = {
      user_id: userId,
      seller_id: sellerId,
      title: form.title.trim(),
      address: form.address || null,
      city: form.city || null,
      photo_url: form.photo_url || null,
      owner_name: form.owner_name || null,
      owner_phone: form.owner_phone || null,
      notes: form.notes || null,
    };

    if (editing) {
      await supabase.from("rental_properties" as any).update(payload).eq("id", editing.id);
      toast({ title: "Imóvel atualizado!" });
    } else {
      await supabase.from("rental_properties" as any).insert(payload);
      toast({ title: "Imóvel cadastrado!" });
    }
    setSaving(false);
    onSave();
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelCls = "block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Voltar
        </button>
        <h2 className="text-sm font-bold text-foreground">{editing ? "Editar Imóvel" : "Novo Imóvel de Aluguel"}</h2>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        {/* Photo */}
        <div>
          <label className={labelCls}>Foto do Imóvel</label>
          {form.photo_url ? (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border mb-2">
              <img loading="lazy" decoding="async" src={form.photo_url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => set("photo_url", "")} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-border bg-secondary/30 cursor-pointer hover:border-primary/50 transition-colors">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload size={24} className="text-muted-foreground/50 mb-2" />
                  <span className="text-xs text-muted-foreground">Clique para enviar foto</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleUploadPhoto} className="hidden" />
            </label>
          )}
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className={labelCls}>Nome/Identificação *</label><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ex: Apt 302, Ed. Solar" className={inputCls} /></div>
          <div><label className={labelCls}>Endereço</label><input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Rua, número, bairro" className={inputCls} /></div>
          <div><label className={labelCls}>Cidade</label><input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Cidade" className={inputCls} /></div>
          <div className="hidden sm:block" />
          <div><label className={labelCls}>Nome do Proprietário</label><input value={form.owner_name} onChange={e => set("owner_name", e.target.value)} placeholder="Nome do proprietário" className={inputCls} /></div>
          <div><label className={labelCls}>Telefone do Proprietário</label><input value={form.owner_phone} onChange={e => set("owner_phone", e.target.value)} placeholder="(27) 99999-9999" className={inputCls} /></div>
        </div>

        <div>
          <label className={labelCls}>Observações</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Observações sobre o imóvel..." className={inputCls} />
        </div>

        <button onClick={handleSubmit} disabled={saving} className="w-full py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
          {saving ? "Salvando..." : editing ? "Atualizar Imóvel" : "Cadastrar Imóvel"}
        </button>
      </div>
    </div>
  );
}
