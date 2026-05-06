import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle, Search, Loader2, HardDrive } from "lucide-react";

type ActionKey = "old_items" | "inactive_users" | "wipe_user";

export default function AdminCleanupTab() {
  const { toast } = useToast();
  const [days, setDays] = useState(60);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState<ActionKey | null>(null);
  const [preview, setPreview] = useState<Record<string, any>>({});

  async function call(action: ActionKey, mode: "preview" | "execute") {
    setLoading(action);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-cleanup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action, mode, days, user_id: userId || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro");
      if (mode === "preview") {
        setPreview(p => ({ ...p, [action]: json }));
        toast({ title: "Pré-visualização", description: `${json.count ?? json.files ?? 0} item(ns) encontrados.` });
      } else {
        toast({ title: "Limpeza concluída", description: JSON.stringify(json) });
        setPreview(p => ({ ...p, [action]: null }));
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  }

  function Card({ title, desc, action, icon: Icon, danger }: any) {
    const data = preview[action as ActionKey];
    return (
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            <Icon size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-display font-bold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            disabled={loading === action}
            onClick={() => call(action, "preview")}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2"
          >
            {loading === action ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Pré-visualizar
          </button>
          {data && (
            <button
              disabled={loading === action}
              onClick={() => {
                if (!confirm(`Confirma apagar definitivamente? Essa ação é IRREVERSÍVEL.`)) return;
                call(action, "execute");
              }}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-destructive text-destructive-foreground hover:opacity-90 inline-flex items-center gap-2"
            >
              <Trash2 size={14} /> Executar limpeza
            </button>
          )}
        </div>

        {data && (
          <div className="rounded-lg bg-secondary/50 p-3 text-xs text-foreground">
            <pre className="whitespace-pre-wrap break-all max-h-60 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex gap-3">
        <AlertTriangle className="text-amber-500 shrink-0" size={20} />
        <div className="text-sm">
          <p className="font-bold text-foreground">Atenção: ações irreversíveis</p>
          <p className="text-muted-foreground mt-1">Limpezas afetam apenas usuários do plano <strong>grátis</strong> (Básico/Imob Grátis/Const Grátis) ou com plano <strong>expirado</strong>. Usuários pagantes ativos nunca são tocados. Sempre pré-visualize antes de executar.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <label className="text-xs font-bold text-muted-foreground">Critério de inatividade (dias)</label>
        <input
          type="number"
          min={1}
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="mt-1 w-32 px-3 py-2 rounded-lg border border-border bg-background text-foreground"
        />
      </div>

      <Card
        title="Apagar anúncios antigos (plano grátis)"
        desc={`Remove anúncios criados há mais de ${days} dias de usuários sem plano pago, junto com as fotos no storage.`}
        action="old_items"
        icon={Trash2}
        danger
      />

      <Card
        title="Apagar usuários inativos (plano grátis)"
        desc={`Remove contas que não fazem login há mais de ${days} dias, junto com perfil, anúncios, stories e TODOS os arquivos no storage.`}
        action="inactive_users"
        icon={HardDrive}
        danger
      />

      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-destructive/10 text-destructive">
            <Trash2 size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-display font-bold text-foreground">Apagar TUDO de um usuário específico</h4>
            <p className="text-xs text-muted-foreground mt-1">Cole o ID do usuário (auth.users.id). Funciona apenas para planos grátis/expirados. Apaga conta, perfil, anúncios, stories e arquivos no storage.</p>
          </div>
        </div>
        <input
          value={userId}
          onChange={e => setUserId(e.target.value)}
          placeholder="UUID do usuário"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            disabled={!userId || loading === "wipe_user"}
            onClick={() => call("wipe_user", "preview")}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loading === "wipe_user" ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Pré-visualizar
          </button>
          {preview.wipe_user && (
            <button
              onClick={() => {
                if (!confirm("Confirma apagar TUDO desse usuário? IRREVERSÍVEL.")) return;
                call("wipe_user", "execute");
              }}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-destructive text-destructive-foreground hover:opacity-90 inline-flex items-center gap-2"
            >
              <Trash2 size={14} /> Apagar tudo
            </button>
          )}
        </div>
        {preview.wipe_user && (
          <div className="rounded-lg bg-secondary/50 p-3 text-xs">
            <pre className="whitespace-pre-wrap">{JSON.stringify(preview.wipe_user, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
