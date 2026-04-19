import { useState, useEffect, useMemo } from "react";
import { Megaphone, TrendingUp, DollarSign, MapPin, Home, Send, Loader2, Eye, MousePointerClick, Phone, AlertCircle, ChevronDown, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

interface SellerAdsTabProps {
  profileId: string;
  userId: string;
}

const MIN_BUDGET = 10;
const MIN_DURATION = 7;
const SERVICE_FEE_PER_40 = 20;

// Simulated metrics by platform.
// Google Ads = busca/intenção (CPC alto, leads qualificados)
// Facebook Ads = tráfego/descoberta (CPC baixo, mais cliques, menos leads diretos)
function simulateMetrics(dailyBudget: number, days: number, platform: "google" | "facebook") {
  const totalBudget = dailyBudget * days;
  const isFb = platform === "facebook";

  const avgCPC = isFb
    ? 0.6 + Math.random() * 0.4   // R$0,60-1,00 CPC tráfego Facebook
    : 1.8 + Math.random() * 0.4;  // R$1,80-2,20 CPC Google

  const totalClicks = Math.round(totalBudget / avgCPC);

  const avgCTR = isFb
    ? 0.012 + Math.random() * 0.008 // 1,2-2% CTR Facebook (feed)
    : 0.035 + Math.random() * 0.015; // 3,5-5% CTR Google

  const impressions = Math.round(totalClicks / avgCTR);

  const conversionRate = isFb
    ? 0.008 + Math.random() * 0.007 // 0,8-1,5% (tráfego, menos qualificado)
    : 0.025 + Math.random() * 0.015; // 2,5-4% Google

  const leads = Math.round(totalClicks * conversionRate);
  const costPerLead = leads > 0 ? totalBudget / leads : 0;

  const dailyData = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const dayClicks = Math.round((totalClicks / days) * (0.7 + Math.random() * 0.6));
    const dayImpressions = Math.round(dayClicks / (avgCTR * (0.8 + Math.random() * 0.4)));
    const dayLeads = Math.round(dayClicks * conversionRate * (0.5 + Math.random()));
    return {
      day: `Dia ${i + 1}`,
      cliques: dayClicks,
      impressoes: dayImpressions,
      leads: Math.max(0, dayLeads),
    };
  });

  return { totalClicks, impressions, leads, costPerLead, avgCPC, avgCTR: avgCTR * 100, dailyData };
}

export default function SellerAdsTab({ profileId, userId }: SellerAdsTabProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<{ id: string; title: string; city: string | null; photos: string[] | null }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [dailyBudget, setDailyBudget] = useState(MIN_BUDGET);
  const [durationDays, setDurationDays] = useState(MIN_DURATION);
  const [platform, setPlatform] = useState("google");
  const [details, setDetails] = useState("");
  const [targetGender, setTargetGender] = useState("todos");
  const [targetCities, setTargetCities] = useState("");
  const [targetAgeMin, setTargetAgeMin] = useState("25");
  const [targetAgeMax, setTargetAgeMax] = useState("55");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    (async () => {
      // Próprios imóveis
      const ownPromise = supabase
        .from("seller_items")
        .select("id, title, city, photos")
        .eq("seller_id", profileId)
        .eq("status", "ativo");

      // Imóveis importados via parceria (visíveis na minha loja)
      const partnerPromise = supabase
        .from("partner_store_listings")
        .select("item_id, seller_items!inner(id, title, city, photos, status)")
        .eq("partner_profile_id", profileId)
        .eq("is_visible", true);

      const [{ data: own }, { data: partner }] = await Promise.all([ownPromise, partnerPromise]);

      const partnerItems = (partner || [])
        .map((p: any) => p.seller_items)
        .filter((it: any) => it && it.status === "ativo")
        .map((it: any) => ({ id: it.id, title: `${it.title} (Parceria)`, city: it.city, photos: it.photos }));

      const merged = [...(own || []), ...partnerItems];
      // Dedup por id
      const seen = new Set<string>();
      const unique = merged.filter((it) => (seen.has(it.id) ? false : (seen.add(it.id), true)));
      unique.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      setItems(unique);
    })();
  }, [profileId]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ad_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setRequests(data || []);
      setLoadingRequests(false);
    })();
  }, [userId]);

  const subtotal = dailyBudget * durationDays;
  const feeRate = platform === "facebook" ? 0.10 : 0.15;
  const serviceFee = Math.max(30, Math.round(subtotal * feeRate));
  const taxAmount = subtotal * 0;
  const total = subtotal + serviceFee;

  const metrics = useMemo(
    () => simulateMetrics(dailyBudget, durationDays, platform as "google" | "facebook"),
    [dailyBudget, durationDays, platform]
  );

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleSubmit = async () => {
    if (!selectedItemId) {
      toast({ title: "Selecione um imóvel", variant: "destructive" });
      return;
    }
    if (dailyBudget < MIN_BUDGET) {
      toast({ title: `Investimento mínimo: R$${MIN_BUDGET}/dia`, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("ad_requests").insert({
        user_id: userId,
        seller_id: profileId,
        platform,
        daily_budget: dailyBudget,
        duration_days: durationDays,
        subtotal,
        service_fee: serviceFee,
        tax_amount: taxAmount,
        total,
        item_id: selectedItemId,
        details: [
          `Público: ${targetGender === "todos" ? "Todos" : targetGender === "masculino" ? "Masculino" : "Feminino"}`,
          `Idade: ${targetAgeMin}-${targetAgeMax} anos`,
          `Cidades: ${targetCities.trim() || "Não informado"}`,
          details.trim() ? `Obs: ${details.trim()}` : "",
        ].filter(Boolean).join(" | "),
      } as any);
      if (error) throw error;

      toast({ title: "Solicitação enviada! 🚀", description: "Nossa equipe entrará em contato em breve." });
      setSelectedItemId("");
      setDetails("");

      // Refresh requests
      const { data: updated } = await supabase
        .from("ad_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setRequests(updated || []);
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const statusLabel: Record<string, { label: string; color: string }> = {
    pendente: { label: "Pendente", color: "bg-amber-500/20 text-amber-400" },
    em_analise: { label: "Em Análise", color: "bg-blue-500/20 text-blue-400" },
    aprovado: { label: "Aprovado", color: "bg-emerald-500/20 text-emerald-400" },
    ativo: { label: "Ativo", color: "bg-green-500/20 text-green-400" },
    rejeitado: { label: "Rejeitado", color: "bg-red-500/20 text-red-400" },
    concluido: { label: "Concluído", color: "bg-slate-500/20 text-slate-400" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Megaphone className="text-primary" size={22} />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-foreground">
              {platform === "facebook" ? "Facebook ADS para Imóveis" : "Google ADS para Imóveis"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {platform === "facebook"
                ? "Campanha de tráfego: alcance e descoberta no feed do Facebook e Instagram"
                : "Coloque seus imóveis nas primeiras posições do Google"}
            </p>
          </div>
        </div>

        {/* Platform tabs */}
        <div className="flex gap-2 mt-4">
          {[
            { value: "google", label: "Google ADS" },
            { value: "facebook", label: "Facebook ADS" },
          ].map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPlatform(p.value)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                platform === p.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Simulator */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" /> Simulador de Investimento
        </h3>

        {/* Select Property */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Imóvel para anunciar</label>
          <div className="relative">
            <Home size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none appearance-none"
            >
              <option value="">Selecione um imóvel...</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} {item.city ? `— ${item.city}` : ""}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Budget & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Investimento diário (mín. R${MIN_BUDGET})
            </label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                inputMode="numeric"
                value={dailyBudget}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setDailyBudget(val === "" ? 0 : Number(val));
                }}
                onBlur={() => { if (dailyBudget < MIN_BUDGET) setDailyBudget(MIN_BUDGET); }}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Duração (dias)</label>
            <div className="flex gap-2">
              {[7, 15, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDurationDays(d)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    durationDays === d
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {d} dias
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metrics Preview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Impressões", value: metrics.impressions.toLocaleString("pt-BR"), icon: Eye, color: "text-blue-400" },
            { label: "Cliques", value: metrics.totalClicks.toLocaleString("pt-BR"), icon: MousePointerClick, color: "text-emerald-400" },
            { label: "Leads (est.)", value: metrics.leads.toString(), icon: Phone, color: "text-amber-400" },
            { label: "Custo/Lead", value: `R$${metrics.costPerLead.toFixed(0)}`, icon: DollarSign, color: "text-purple-400" },
          ].map((m) => (
            <div key={m.label} className="bg-secondary rounded-xl p-3 text-center">
              <m.icon size={16} className={`${m.color} mx-auto mb-1`} />
              <p className="font-bold text-lg text-foreground leading-none">{m.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-secondary/50 rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Estimativa de Performance Diária</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={metrics.dailyData}>
              <defs>
                <linearGradient id="adsClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area type="monotone" dataKey="cliques" stroke="hsl(var(--primary))" fill="url(#adsClicks)" strokeWidth={2} />
              <Area type="monotone" dataKey="leads" stroke="#f59e0b" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-3 h-0.5 bg-primary rounded" /> Cliques
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-3 h-0.5 bg-amber-500 rounded" style={{ borderTop: "1px dashed" }} /> Leads
            </span>
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {platform === "facebook"
              ? "Estimativas baseadas em campanhas de tráfego no Facebook/Instagram para o setor imobiliário. O foco é alcance e cliques no feed; resultados podem variar conforme criativo, segmentação e concorrência."
              : "Os valores são estimativas baseadas em médias do mercado imobiliário no Google Ads. Resultados reais podem variar conforme localização, concorrência e qualidade do anúncio."}
          </p>
        </div>

        {/* Targeting Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <MapPin size={14} className="text-primary" /> Direcionamento do Anúncio
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gender */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Público-alvo (sexo)</label>
              <div className="flex gap-2">
                {[
                  { value: "todos", label: "Todos" },
                  { value: "masculino", label: "Masculino" },
                  { value: "feminino", label: "Feminino" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTargetGender(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      targetGender === opt.value
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Range */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Faixa etária</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={targetAgeMin}
                  onChange={(e) => setTargetAgeMin(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="25"
                  className="w-20 text-center py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                />
                <span className="text-xs text-muted-foreground">até</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={targetAgeMax}
                  onChange={(e) => setTargetAgeMax(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="55"
                  className="w-20 text-center py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                />
                <span className="text-xs text-muted-foreground">anos</span>
              </div>
            </div>
          </div>

          {/* Target Cities */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Cidades de interesse (separe por vírgula)
            </label>
            <input
              type="text"
              value={targetCities}
              onChange={(e) => setTargetCities(e.target.value)}
              placeholder="Ex: Vila Velha, Vitória, Serra"
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Informe as cidades onde o anúncio deve alcançar pessoas interessadas</p>
          </div>

          {/* Observations */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Observações (opcional)</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              placeholder="Ex: Focar em famílias com renda acima de 5 salários mínimos..."
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none resize-y"
            />
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-secondary rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Investimento ({durationDays} dias × R${dailyBudget})</span>
            <span className="text-foreground font-semibold">R${subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Taxa de serviço ({Math.round(feeRate * 100)}% · mín. R$30)
            </span>
            <span className="text-foreground font-semibold">R${serviceFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="font-bold text-foreground">Total</span>
            <span className="font-black text-lg text-primary">R${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedItemId}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          Solicitar Campanha ADS
        </button>
      </div>

      {/* My Requests */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock size={18} className="text-primary" /> Minhas Solicitações
        </h3>

        {loadingRequests ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma solicitação de ADS ainda.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const st = statusLabel[req.status] || statusLabel.pendente;
              return (
                <div key={req.id} className="bg-secondary rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${st.color}`}>
                      {st.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-semibold">{req.platform === "google" ? "Google Ads" : req.platform === "facebook" ? "Facebook Ads" : req.platform}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{req.details}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>R${req.daily_budget}/dia</span>
                    <span>{req.duration_days} dias</span>
                    <span className="font-semibold text-foreground">Total: R${Number(req.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
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
