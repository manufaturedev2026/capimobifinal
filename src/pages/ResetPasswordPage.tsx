import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { getMarketplaceTheme } from "@/lib/marketplaceThemes";
import { getMarketplaceThemeCssVars } from "@/lib/marketplaceThemeCssVars";
import { normalizeLoginHeroSetting, resolveLoginHeroImage } from "@/data/loginHeroPresets";
import heroImgDefault from "@/assets/hero-anunciar.jpg";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isForced = searchParams.get("force") === "1";

  const [themeId, setThemeId] = useState<string>("azul");
  const [loginHeroUrl, setLoginHeroUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("platform_settings").select("key, value").in("key", ["homepage_theme", "login_hero_image"]).then(({ data }) => {
      (data || []).forEach((row: any) => {
        if (row.key === "homepage_theme") setThemeId(row.value);
        if (row.key === "login_hero_image" && row.value) setLoginHeroUrl(normalizeLoginHeroSetting(row.value));
      });
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setValidSession(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true);
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const theme = getMarketplaceTheme(themeId);
  const themeVars = getMarketplaceThemeCssVars(theme);
  const heroImg = resolveLoginHeroImage(loginHeroUrl) || heroImgDefault;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Senhas não conferem", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ must_change_password: false }).eq("user_id", user.id);
      }
    }
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha alterada com sucesso!", description: "Você já está logado." });
      navigate("/painel", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ ...themeVars, background: theme.darkBase }}>
      <div className="relative w-full lg:w-1/2 h-[40vh] lg:h-auto lg:min-h-screen overflow-hidden">
        <img src={heroImg} alt="Capimobi" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent, transparent, ${theme.darkBase})` }} />
        <div className="hidden lg:block absolute inset-0" style={{ background: `linear-gradient(to right, transparent 60%, ${theme.darkBase})` }} />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={20} style={{ color: theme.primary }} />
            <span style={{ color: theme.primary }} className="font-semibold text-sm uppercase tracking-wider">Recuperação</span>
          </div>
          <h1 className="font-display font-bold text-3xl lg:text-5xl text-white leading-tight mb-3">
            Nova<br /><span style={{ color: theme.promoAccent || theme.primary }}>Senha</span>
          </h1>
          <p className="text-white/60 text-sm lg:text-base max-w-md">
            Defina uma nova senha segura para sua conta.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 lg:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full max-w-md">
          {checking ? (
            <div className="text-center" style={{ color: theme.text }}>Verificando link...</div>
          ) : !validSession ? (
            <div>
              <h2 className="font-display font-bold text-2xl" style={{ color: theme.text }}>Link inválido ou expirado</h2>
              <p className="mt-2 text-sm" style={{ color: theme.textMuted }}>
                Solicite um novo link de recuperação na página de login.
              </p>
              <button onClick={() => navigate("/login")}
                className="mt-6 w-full py-3.5 rounded-xl font-bold text-sm"
                style={{ background: theme.primary, color: "#fff" }}>
                Voltar ao Login
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-display font-bold text-2xl lg:text-3xl" style={{ color: theme.text }}>
                  {isForced ? "Crie sua nova senha" : "Defina sua nova senha"}
                </h2>
                <p style={{ color: theme.textMuted }} className="mt-2 text-sm">
                  {isForced
                    ? "Você entrou com uma senha temporária. Defina agora uma senha permanente para continuar."
                    : "Use no mínimo 6 caracteres."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: `${theme.text}cc` }}>Nova senha</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all pr-12"
                      style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.text }}
                      placeholder="Mínimo 6 caracteres" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: `${theme.text}cc` }}>Confirmar nova senha</label>
                  <input type={showPassword ? "text" : "password"} required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                    style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.text }}
                    placeholder="Repita a senha" />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  style={{ background: theme.primary, color: "#fff", boxShadow: `0 8px 24px ${theme.primary}40` }}>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><KeyRound size={16} /> Salvar Nova Senha</>
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
