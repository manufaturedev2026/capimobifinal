import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, DollarSign, Banknote, Check, X, CreditCard, Search, Settings, Save } from "lucide-react";

interface UserWithReferral {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  referral_code: string;
  referral_balance: number;
  referral_total_earned: number;
  referred_by: string | null;
}

interface Commission {
  id: string;
  user_id: string;
  referred_id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
}

interface WithdrawalItem {
  id: string;
  user_id: string;
  amount: number;
  pix_key: string;
  status: string;
  created_at: string;
}

type SubTab = "users" | "commissions" | "withdrawals";

export default function AdminReferralTab() {
  const { toast } = useToast();
  const [subTab, setSubTab] = useState<SubTab>("withdrawals");
  const [users, setUsers] = useState<UserWithReferral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: comms }, { data: wds }, { data: settings }] = await Promise.all([
      supabase.from("profiles").select("id, user_id, full_name, email, referral_code, referral_balance, referral_total_earned, referred_by") as any,
      supabase.from("commissions").select("*").order("created_at", { ascending: false }) as any,
      supabase.from("withdrawals").select("*").order("created_at", { ascending: false }) as any,
      supabase.from("platform_settings").select("*").eq("key", "referral_commission_rate").maybeSingle() as any,
    ]);
    setUsers(profiles || []);
    setCommissions(comms || []);
    setWithdrawals(wds || []);
    if (settings?.value) setCommissionRate(settings.value);
    setLoading(false);
  };

  const getUserName = (userId: string) => {
    const u = users.find(u => u.user_id === userId);
    return u?.full_name || u?.email || "Desconhecido";
  };

  const updateWithdrawalStatus = async (id: string, newStatus: string, userId?: string, amount?: number) => {
    const { error } = await supabase.from("withdrawals").update({ status: newStatus } as any).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
      return;
    }

    // If marking as "pago", deduct from user's balance
    if (newStatus === "pago" && userId && amount) {
      const user = users.find(u => u.user_id === userId);
      if (user) {
        const newBalance = Math.max(0, Number(user.referral_balance) - amount);
        await supabase.from("profiles").update({ referral_balance: newBalance } as any).eq("user_id", userId);
      }
    }

    toast({ title: `Saque ${newStatus}!` });
    fetchAll();
  };

  const statusColors: Record<string, string> = {
    pendente: "bg-amber-500/10 text-amber-500",
    aprovado: "bg-blue-500/10 text-blue-500",
    pago: "bg-green-500/10 text-green-500",
    rejeitado: "bg-destructive/10 text-destructive",
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === "pendente").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.referral_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
        <DollarSign size={20} className="text-primary" /> Sistema de Indicação
      </h2>

      {/* Sub tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "withdrawals" as SubTab, label: "Saques", icon: Banknote, badge: pendingWithdrawals },
          { key: "commissions" as SubTab, label: "Comissões", icon: DollarSign },
          { key: "users" as SubTab, label: "Afiliados", icon: Users },
        ]).map((t) => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              subTab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon size={14} /> {t.label}
            {t.badge && t.badge > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
      </div>

      {/* Withdrawals */}
      {subTab === "withdrawals" && (
        <div className="space-y-2">
          {withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum saque solicitado.</p>
          ) : (
            withdrawals.map((w) => (
              <div key={w.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">{getUserName(w.user_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      Valor: <strong className="text-foreground">R$ {Number(w.amount).toFixed(2).replace(".", ",")}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground">PIX: <strong className="text-foreground">{w.pix_key}</strong></p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(w.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColors[w.status]}`}>
                      {w.status}
                    </span>
                    {w.status === "pendente" && (
                      <>
                        <button onClick={() => updateWithdrawalStatus(w.id, "aprovado")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-semibold hover:bg-blue-500/20">
                          <Check size={12} /> Aprovar
                        </button>
                        <button onClick={() => updateWithdrawalStatus(w.id, "rejeitado")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20">
                          <X size={12} /> Rejeitar
                        </button>
                      </>
                    )}
                    {w.status === "aprovado" && (
                      <button onClick={() => updateWithdrawalStatus(w.id, "pago", w.user_id, w.amount)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold hover:bg-green-500/20">
                        <CreditCard size={12} /> Marcar como Pago
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Commissions */}
      {subTab === "commissions" && (
        <div className="space-y-2">
          {commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma comissão gerada.</p>
          ) : (
            commissions.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground text-sm">{getUserName(c.user_id)}</p>
                  <p className="text-xs text-muted-foreground">
                    Indicou: <strong>{getUserName(c.referred_id)}</strong>
                  </p>
                  <p className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-500">R$ {Number(c.amount).toFixed(2).replace(".", ",")}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColors[c.status]}`}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Users */}
      {subTab === "users" && (
        <div className="space-y-2">
          {filteredUsers.filter(u => Number(u.referral_total_earned) > 0 || u.referred_by).length === 0 && filteredUsers.length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Mostrando todos os usuários com código de indicação.</p>
          )}
          {filteredUsers.map((u) => (
            <div key={u.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground text-sm">{u.full_name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
                <p className="text-[10px] text-muted-foreground">Código: <strong>{u.referral_code}</strong></p>
                {u.referred_by && (
                  <p className="text-[10px] text-muted-foreground">Indicado por: <strong>{u.referred_by}</strong></p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className="font-bold text-green-500">R$ {Number(u.referral_balance).toFixed(2).replace(".", ",")}</p>
                <p className="text-[10px] text-muted-foreground">Total: R$ {Number(u.referral_total_earned).toFixed(2).replace(".", ",")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
