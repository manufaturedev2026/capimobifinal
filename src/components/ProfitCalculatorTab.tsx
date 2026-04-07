import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/data/products";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Home, Building2, Trophy, Download, Percent, Sparkles, ArrowUpRight } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useEffect } from "react";

interface ProfitItem {
  id: string;
  title: string;
  price: number;
  category: string;
  finality: string;
  city: string | null;
  neighborhood: string | null;
}

export default function ProfitCalculatorTab() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<ProfitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [comissaoVenda, setComissaoVenda] = useState(5);
  const [comissaoAluguel, setComissaoAluguel] = useState(100);

  useEffect(() => {
    if (!profile?.id) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("seller_items")
        .select("id, title, price, category, finality, city, neighborhood")
        .eq("seller_id", profile.id)
        .eq("status", "ativo")
        .not("price", "is", null);
      setItems((data || []).filter((i: any) => i.price > 0) as ProfitItem[]);
      setLoading(false);
    };
    fetch();
  }, [profile?.id]);

  const vendaItems = useMemo(() => items.filter(i => i.finality !== "aluguel" && i.category !== "aluguel"), [items]);
  const aluguelItems = useMemo(() => items.filter(i => i.finality === "aluguel" || i.category === "aluguel"), [items]);

  const lucroVenda = useMemo(() => vendaItems.reduce((s, i) => s + (i.price * comissaoVenda / 100), 0), [vendaItems, comissaoVenda]);
  const lucroAluguel = useMemo(() => aluguelItems.reduce((s, i) => s + (i.price * comissaoAluguel / 100), 0), [aluguelItems, comissaoAluguel]);
  const lucroTotal = lucroVenda + lucroAluguel;

  const allWithProfit = useMemo(() => {
    const mapped = items.map(i => {
      const isAluguel = i.finality === "aluguel" || i.category === "aluguel";
      const comissao = isAluguel ? comissaoAluguel : comissaoVenda;
      const lucro = i.price * comissao / 100;
      return { ...i, isAluguel, comissao, lucro };
    });
    return mapped.sort((a, b) => b.lucro - a.lucro);
  }, [items, comissaoVenda, comissaoAluguel]);

  const top3 = allWithProfit.slice(0, 3);

  const pieData = [
    { name: "Venda", value: lucroVenda, color: "#3b82f6" },
    { name: "Aluguel", value: lucroAluguel, color: "#10b981" },
  ].filter(d => d.value > 0);

  const barData = allWithProfit.slice(0, 10).map(i => ({
    name: i.title.length > 20 ? i.title.slice(0, 20) + "…" : i.title,
    lucro: Math.round(i.lucro),
  }));

  const exportExcel = () => {
    const header = "Imóvel\tTipo\tValor\tComissão (%)\tLucro Estimado\n";
    const rows = allWithProfit.map(i =>
      `${i.title}\t${i.isAluguel ? "Aluguel" : "Venda"}\t${i.price}\t${i.comissao}%\t${i.lucro.toFixed(2)}`
    ).join("\n");
    const summary = `\n\nTotal Venda\t\t\t\t${lucroVenda.toFixed(2)}\nTotal Aluguel\t\t\t\t${lucroAluguel.toFixed(2)}\nTotal Geral\t\t\t\t${lucroTotal.toFixed(2)}`;
    const blob = new Blob([header + rows + summary], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calculadora-lucro.xls";
    a.click();
    URL.revokeObjectURL(url);
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
      {/* Motivational Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)" }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
            <Sparkles size={16} />
            <span>Potencial de Ganho</span>
          </div>
          <h2 className="font-display font-bold text-3xl md:text-5xl text-white">
            {formatPrice(lucroTotal)}
          </h2>
          <p className="text-white/80 mt-2 text-sm md:text-base">
            💰 Você pode faturar <strong>{formatPrice(lucroTotal)}</strong> com seus {items.length} imóveis atuais!
          </p>
        </div>
      </motion.div>

      {/* Commission Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Percent size={16} className="text-blue-500" />
            </div>
            <span className="font-display font-bold text-foreground">Comissão de Venda</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={comissaoVenda}
              onChange={e => setComissaoVenda(Number(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <span className="font-bold text-xl text-blue-500 min-w-[50px] text-right">{comissaoVenda}%</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Percent size={16} className="text-emerald-500" />
            </div>
            <span className="font-display font-bold text-foreground">Comissão de Aluguel</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={comissaoAluguel}
              onChange={e => setComissaoAluguel(Number(e.target.value))}
              className="flex-1 accent-emerald-500"
            />
            <span className="font-bold text-xl text-emerald-500 min-w-[60px] text-right">{comissaoAluguel}%</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Imóveis", value: items.length, icon: Home, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Para Venda", value: vendaItems.length, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Para Aluguel", value: aluguelItems.length, icon: Building2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Lucro Total", value: formatPrice(lucroTotal), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon size={16} className={s.color} />
            </div>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-display font-bold text-lg text-foreground mt-0.5">
              {typeof s.value === "number" ? s.value : s.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Top 3 Most Profitable */}
      {top3.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-amber-500" />
            <h3 className="font-display font-bold text-foreground">🏆 Top 3 — Imóveis Mais Lucrativos</h3>
          </div>
          <div className="space-y-3">
            {top3.map((item, i) => (
              <div key={item.id} className={`flex items-center gap-4 p-3 rounded-xl ${i === 0 ? "bg-amber-500/10 border border-amber-500/20" : "bg-secondary/50"}`}>
                <span className={`font-display font-bold text-2xl ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : "text-amber-700"}`}>
                  {i + 1}º
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.isAluguel ? "Aluguel" : "Venda"} • {formatPrice(item.price)} • {item.comissao}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-emerald-500">{formatPrice(item.lucro)}</p>
                  <p className="text-[10px] text-muted-foreground">lucro estimado</p>
                </div>
              </div>
            ))}
          </div>
          {top3.length > 0 && (
            <p className="mt-3 text-xs text-emerald-600 bg-emerald-500/10 rounded-lg px-3 py-2">
              <ArrowUpRight size={12} className="inline mr-1" />
              Priorize o lead de "<strong>{top3[0].title}</strong>" — ele pode gerar {formatPrice(top3[0].lucro)} de comissão!
            </p>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie Chart */}
        {pieData.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-display font-bold text-foreground mb-4">Venda vs Aluguel</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatPrice(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}: <strong className="text-foreground">{formatPrice(d.value)}</strong></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bar Chart */}
        {barData.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-display font-bold text-foreground mb-4">Lucro por Imóvel (Top 10)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatPrice(v)} />
                <Bar dataKey="lucro" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-display font-bold text-foreground">Detalhamento por Imóvel</h3>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
          >
            <Download size={14} /> Exportar Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left px-4 py-3 font-bold text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground">Imóvel</th>
                <th className="text-left px-4 py-3 font-bold text-muted-foreground">Tipo</th>
                <th className="text-right px-4 py-3 font-bold text-muted-foreground">Valor</th>
                <th className="text-right px-4 py-3 font-bold text-muted-foreground">Comissão</th>
                <th className="text-right px-4 py-3 font-bold text-muted-foreground">Lucro Est.</th>
              </tr>
            </thead>
            <tbody>
              {allWithProfit.map((item, i) => (
                <tr key={item.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">{item.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.isAluguel ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"}`}>
                      {item.isAluguel ? "Aluguel" : "Venda"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">{formatPrice(item.price)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{item.comissao}%</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-500">{formatPrice(item.lucro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Summary Footer */}
        <div className="border-t border-border bg-secondary/30 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Vendas</p>
            <p className="font-display font-bold text-blue-500 text-lg">{formatPrice(lucroVenda)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Aluguéis</p>
            <p className="font-display font-bold text-emerald-500 text-lg">{formatPrice(lucroAluguel)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Geral</p>
            <p className="font-display font-bold text-foreground text-xl">{formatPrice(lucroTotal)}</p>
          </div>
        </div>
      </div>

      {/* Motivational Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { emoji: "🎯", title: "Foque nos mais lucrativos", desc: "Priorize os imóveis com maior valor de comissão para maximizar seus ganhos." },
          { emoji: "📈", title: "Aumente sua comissão", desc: "Negocie taxas melhores com proprietários para aumentar sua receita por venda." },
          { emoji: "🏠", title: "Cadastre mais imóveis", desc: "Quanto mais imóveis ativos, maior seu potencial de faturamento mensal." },
        ].map(tip => (
          <div key={tip.title} className="bg-card border border-border rounded-2xl p-4">
            <span className="text-2xl">{tip.emoji}</span>
            <h4 className="font-display font-bold text-foreground text-sm mt-2">{tip.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{tip.desc}</p>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <DollarSign size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum imóvel ativo com preço cadastrado.</p>
          <p className="text-sm text-muted-foreground mt-1">Cadastre imóveis para ver seu potencial de ganho!</p>
        </div>
      )}
    </div>
  );
}
