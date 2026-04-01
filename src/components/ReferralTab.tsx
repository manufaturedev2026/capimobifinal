import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Copy, DollarSign, Users, TrendingUp, Gift, Award, Medal, Trophy, Wallet, ArrowRight, CheckCircle2, Clock, Banknote } from "lucide-react";
import { motion } from "framer-motion";

interface Commission {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  referred_id: string;
  referred_name?: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  pix_key: string;
  status: string;
  created_at: string;
}

export default function ReferralTab() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [referredCount, setReferredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commissionRate, setCommissionRate] = useState(10);

  const referralCode = (profile as any)?.referral_code || "";
  const balance = Number((profile as any)?.referral_balance) || 0;
  const totalEarned = Number((profile as any)?.referral_total_earned) || 0;
  const referralLink = `${window.location.origin}/entrar?ref=${referralCode}`;

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch commissions
    const { data: comms } = await supabase
      .from("commissions")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }) as any;

    // Fetch referred count
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("referred_by", referralCode) as any;

    // Fetch withdrawals
    const { data: wds } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }) as any;

    // Fetch commission rate
    const { data: rateSetting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "referral_commission_rate")
      .maybeSingle() as any;

    if (rateSetting?.value) setCommissionRate(parseFloat(rateSetting.value));

    setCommissions(comms || []);
    setReferredCount(count || 0);
    setWithdrawals(wds || []);
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link copiado!", description: "Compartilhe com seus amigos!" });
  };

  const accountAgeDays = profile?.created_at
    ? Math.floor((Date.now() - new Date((profile as any).created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const canWithdraw = accountAgeDays >= 7;

  const handleWithdraw = async () => {
    if (!canWithdraw) {
      toast({ title: "Saque disponível após 7 dias de conta", description: `Faltam ${7 - accountAgeDays} dia(s).`, variant: "destructive" });
      return;
    }
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 100) {
      toast({ title: "Valor mínimo de R$ 100,00", variant: "destructive" });
      return;
    }
    if (amount > balance) {
      toast({ title: "Saldo insuficiente", variant: "destructive" });
      return;
    }
    if (!pixKey.trim()) {
      toast({ title: "Informe sua chave PIX", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("withdrawals").insert({
      user_id: user!.id,
      amount,
      pix_key: pixKey.trim(),
    } as any);

    if (error) {
      toast({ title: "Erro ao solicitar saque", variant: "destructive" });
    } else {
      toast({ title: "Saque solicitado!", description: "Aguarde a aprovação do administrador." });
      setShowWithdrawForm(false);
      setWithdrawAmount("");
      setPixKey("");
      fetchData();
    }
    setSubmitting(false);
  };

  // Badge system
  const getBadge = () => {
    if (referredCount >= 10) return { label: "Ouro", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" };
    if (referredCount >= 5) return { label: "Prata", icon: Medal, color: "text-slate-400", bg: "bg-slate-400/10" };
    if (referredCount >= 1) return { label: "Bronze", icon: Award, color: "text-orange-600", bg: "bg-orange-600/10" };
    return null;
  };

  const badge = getBadge();

  const statusColors: Record<string, string> = {
    pendente: "bg-amber-500/10 text-amber-500",
    aprovado: "bg-blue-500/10 text-blue-500",
    pago: "bg-green-500/10 text-green-500",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
            <Gift size={22} className="text-primary" /> Indique e Ganhe
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Ganhe {commissionRate}% de comissão recorrente por cada indicação!</p>
        </div>
        {badge && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${badge.bg}`}>
            <badge.icon size={16} className={badge.color} />
            <span className={`text-xs font-bold ${badge.color}`}>{badge.label}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Saldo Disponível", value: `R$ ${balance.toFixed(2).replace(".", ",")}`, icon: Wallet, gradient: "from-green-500/10 to-green-500/5", iconColor: "text-green-500", border: "border-green-500/20" },
          { label: "Total Ganho", value: `R$ ${totalEarned.toFixed(2).replace(".", ",")}`, icon: TrendingUp, gradient: "from-primary/10 to-primary/5", iconColor: "text-primary", border: "border-primary/20" },
          { label: "Indicados", value: referredCount.toString(), icon: Users, gradient: "from-accent/10 to-accent/5", iconColor: "text-accent", border: "border-accent/20" },
          { label: "Comissões", value: commissions.length.toString(), icon: DollarSign, gradient: "from-amber-500/10 to-amber-500/5", iconColor: "text-amber-500", border: "border-amber-500/20" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`bg-gradient-to-br ${s.gradient} border ${s.border} rounded-2xl p-4`}>
            <div className={`w-9 h-9 rounded-xl bg-background/50 flex items-center justify-center mb-2`}>
              <s.icon size={18} className={s.iconColor} />
            </div>
            <p className="font-bold text-lg text-foreground leading-none">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Referral Link */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-3">Seu Link de Indicação</h3>
        <div className="flex gap-2">
          <input
            readOnly
            value={referralLink}
            className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground text-sm border border-border truncate"
          />
          <button onClick={copyLink}
            className="px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 shrink-0">
            <Copy size={16} /> Copiar
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Código: <strong className="text-foreground">{referralCode}</strong>
        </p>
      </div>

      {/* Withdraw Section */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
            <Banknote size={16} className="text-green-500" /> Solicitar Saque
          </h3>
          {!showWithdrawForm && (
            <button onClick={() => setShowWithdrawForm(true)} disabled={!canWithdraw}
              className="px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!canWithdraw ? `Disponível após 7 dias (faltam ${7 - accountAgeDays})` : ""}>
              <ArrowRight size={14} /> {canWithdraw ? "Solicitar" : `Aguarde ${7 - accountAgeDays}d`}
            </button>
          )}
        </div>

        {showWithdrawForm && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Valor (mínimo R$ 50,00)</label>
              <input
                type="number"
                min="50"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="50.00"
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm border border-border focus:ring-2 focus:ring-primary/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Chave PIX</label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm border border-border focus:ring-2 focus:ring-primary/50 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowWithdrawForm(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
                Cancelar
              </button>
              <button onClick={handleWithdraw} disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors disabled:opacity-50">
                {submitting ? "Enviando..." : "Confirmar Saque"}
              </button>
            </div>
          </div>
        )}

        {/* Withdrawal History */}
        {withdrawals.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Histórico de Saques</p>
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between bg-secondary rounded-xl p-3">
                <div>
                  <p className="text-sm font-bold text-foreground">R$ {Number(w.amount).toFixed(2).replace(".", ",")}</p>
                  <p className="text-[10px] text-muted-foreground">PIX: {w.pix_key}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColors[w.status] || "bg-secondary text-muted-foreground"}`}>
                    {w.status}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(w.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commissions History */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2">
          <DollarSign size={16} className="text-amber-500" /> Histórico de Comissões
        </h3>
        {commissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma comissão ainda. Compartilhe seu link!</p>
        ) : (
          <div className="space-y-2">
            {commissions.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-secondary rounded-xl p-3">
                <div>
                  <p className="text-sm font-bold text-foreground">R$ {Number(c.amount).toFixed(2).replace(".", ",")}</p>
                  <p className="text-[10px] text-muted-foreground">recorrente</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColors[c.status] || "bg-secondary text-muted-foreground"}`}>
                    {c.status === "aprovado" ? <><CheckCircle2 size={10} className="inline mr-0.5" /> aprovado</> : <><Clock size={10} className="inline mr-0.5" /> {c.status}</>}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ranking placeholder */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-2 flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" /> Ranking de Afiliados
        </h3>
        <p className="text-xs text-muted-foreground">
          {referredCount >= 10 ? "🏆 Você está no nível Ouro!" :
           referredCount >= 5 ? "🥈 Você está no nível Prata! Faltam " + (10 - referredCount) + " para Ouro." :
           referredCount >= 1 ? "🥉 Você está no nível Bronze! Faltam " + (5 - referredCount) + " para Prata." :
           "Indique seu primeiro amigo para começar!"}
        </p>
        <div className="mt-3 w-full bg-secondary rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-primary transition-all"
            style={{ width: `${Math.min((referredCount / 10) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>0</span>
          <span>Bronze (1)</span>
          <span>Prata (5)</span>
          <span>Ouro (10)</span>
        </div>
      </div>
    </div>
  );
}
