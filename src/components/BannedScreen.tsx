import { Ban, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function BannedScreen() {
  const { banInfo, signOut } = useAuth();

  if (!banInfo?.is_banned) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border-2 border-destructive/30 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <Ban size={40} className="text-destructive" />
        </div>
        <h1 className="font-display font-extrabold text-2xl text-foreground mb-2">Conta Suspensa</h1>
        <p className="text-muted-foreground text-sm mb-4">
          Sua conta foi suspensa por violar nossos termos de uso.
        </p>

        {banInfo.reason && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-destructive mb-1">Motivo:</p>
            <p className="text-sm text-foreground">{banInfo.reason}</p>
          </div>
        )}

        {!banInfo.is_permanent && banInfo.expires_at && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
            <Clock size={16} />
            <span>
              Suspensão até{" "}
              <strong className="text-foreground">
                {new Date(banInfo.expires_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
            </span>
          </div>
        )}

        {banInfo.is_permanent && (
          <p className="text-sm text-destructive font-semibold mb-4">
            Este banimento é permanente.
          </p>
        )}

        <p className="text-xs text-muted-foreground mb-6">
          Se acredita que houve um engano, entre em contato com o suporte.
        </p>

        <button
          onClick={signOut}
          className="w-full py-3 rounded-xl bg-secondary text-foreground text-sm font-bold hover:bg-secondary/80 transition-colors"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}
