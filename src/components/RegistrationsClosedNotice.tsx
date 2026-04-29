import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface RegistrationsClosedNoticeProps {
  variant?: "page" | "inline";
  title?: string;
  message?: string;
}

export default function RegistrationsClosedNotice({
  variant = "page",
  title,
  message,
}: RegistrationsClosedNoticeProps) {
  const { site_name } = useSiteSettings();
  const finalTitle = title || "Cadastros encerrados";
  const finalMessage =
    message ||
    `No momento, ${site_name} não está aceitando novos cadastros. O time de corretores atual já está completo. Volte em breve — assim que abrirem novas vagas, você poderá criar sua conta.`;

  const content = (
    <div className="max-w-lg w-full text-center bg-card border border-border rounded-2xl p-8 shadow-lg">
      <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Lock size={28} className="text-primary" />
      </div>
      <h2 className="font-display font-bold text-2xl text-foreground mb-3">{finalTitle}</h2>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{finalMessage}</p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Link
          to="/login"
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          Já tenho conta — Entrar
        </Link>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-secondary transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );

  if (variant === "inline") return content;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      {content}
    </div>
  );
}
