import { Lock, Phone } from "lucide-react";

interface Props {
  sellerName?: string;
  sellerPhone?: string;
}

/**
 * Overlay exibido na storefront pública quando o seller passou de 120% do limite
 * mensal de visitas contratado no plano. Aparece em vez do conteúdo da loja.
 */
export default function StoreVisitLimitOverlay({ sellerName, sellerPhone }: Props) {
  const waLink = sellerPhone
    ? `https://wa.me/${sellerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
        "Olá! Tentei acessar sua página e estava temporariamente indisponível. Posso ver seus imóveis?",
      )}`
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-6">
      <div className="max-w-lg w-full text-center bg-card border rounded-3xl p-8 sm:p-10 shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground mb-3">
          Loja temporariamente indisponível
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-2">
          {sellerName ? <strong>{sellerName}</strong> : "Este profissional"} atingiu o limite de visitas mensais do plano atual.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          O acesso aos imóveis será restabelecido no início do próximo mês ou assim que houver upgrade do plano.
        </p>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-full transition shadow-md"
          >
            <Phone className="h-4 w-4" />
            Falar diretamente no WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}