import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, LogIn, UserPlus, Sparkles, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getMarketplaceTheme } from "@/lib/marketplaceThemes";
import { getMarketplaceThemeCssVars } from "@/lib/marketplaceThemeCssVars";
import { normalizeLoginHeroSetting, resolveLoginHeroImage } from "@/data/loginHeroPresets";
import heroImgDefault from "@/assets/hero-anunciar.jpg";
import { BRAZIL_STATES } from "@/data/brazilStates";
import { useCitiesByState } from "@/hooks/useCitiesByState";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !params.get("trial");
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [loading, setLoading] = useState(false);
   const [signedUp, setSignedUp] = useState(false);
   const [selectedState, setSelectedState] = useState("ES");
   const [selectedCity, setSelectedCity] = useState("");
   const { cities: stateCities, loading: loadingCities } = useCitiesByState(selectedState);

  const { user, profile, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trialDays = searchParams.get("trial");
  const { toast } = useToast();

  const [isNewSignup, setIsNewSignup] = useState(false);

  // Dynamic theme from admin settings
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

  const theme = getMarketplaceTheme(themeId);
  const themeVars = getMarketplaceThemeCssVars(theme);
  const heroImg = resolveLoginHeroImage(loginHeroUrl) || heroImgDefault;

  const getStoreRoute = (p?: { id: string; slug?: string | null } | null) => {
    const identifier = p?.slug || p?.id;
    return identifier ? `/empresa/${identifier}` : "/painel";
  };

  useEffect(() => {
    if (user && profile) {
      if (isNewSignup) {
        navigate("/painel", { replace: true });
      } else {
        navigate(getStoreRoute(profile), { replace: true });
      }
    }
  }, [user, profile, navigate, isNewSignup]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      }
    } else {
      if (password !== confirmPassword) {
        toast({ title: "Senhas não conferem", description: "Digite a mesma senha nos dois campos.", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (!fullName.trim() || !selectedCity) {
        toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName, phone, selectedCity, selectedState);
      if (error) {
        toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      } else {
        setSignedUp(true);
        setIsNewSignup(true);
        toast({
          title: "Cadastro realizado!",
          description: trialDays === "7"
            ? "Seus 7 dias grátis do plano Start foram ativados! 🎉"
            : "Complete seu perfil para começar!",
        });

        const waitForProfile = async () => {
          for (let i = 0; i < 10; i++) {
            const { data: { user: newUser } } = await supabase.auth.getUser();
            if (!newUser) break;

            const { data: newProfile } = await supabase
              .from("profiles")
              .select("id, slug")
              .eq("user_id", newUser.id)
              .maybeSingle();

            if (newProfile) {
              if (trialDays === "7") {
                await supabase.from("seller_subscriptions").insert({
                  user_id: newUser.id,
                  seller_id: newProfile.id,
                  tier: "start",
                  max_items: 10,
                  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                  payment_method: "trial",
                  payment_status: "confirmado",
                } as any);
              }

              navigate(getStoreRoute(newProfile), { replace: true });
              return;
            }
            await new Promise(r => setTimeout(r, 500));
          }
          navigate("/painel", { replace: true });
        };
        waitForProfile();
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ ...themeVars, background: theme.darkBase }}>
      {/* Image Panel */}
      <div className="relative w-full lg:w-1/2 h-[40vh] lg:h-auto lg:min-h-screen overflow-hidden">
        <img src={heroImg} alt="Capimobi" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent, transparent, ${theme.darkBase})` }} />
        <div className="absolute inset-0 lg:hidden" style={{ background: `linear-gradient(to bottom, transparent 60%, ${theme.darkBase})` }} />
        <div className="hidden lg:block absolute inset-0" style={{ background: `linear-gradient(to right, transparent 60%, ${theme.darkBase})` }} />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} style={{ color: theme.primary }} />
              <span style={{ color: theme.primary }} className="font-semibold text-sm uppercase tracking-wider">Capimobi</span>
            </div>
            <h1 className="font-display font-bold text-3xl lg:text-5xl text-white leading-tight mb-3">
              Área do<br /><span style={{ color: theme.promoAccent || theme.primary }}>Corretor</span>
            </h1>
            <p className="text-white/60 text-sm lg:text-base max-w-md">
              Acesse seu painel, gerencie seus anúncios e acompanhe suas vendas.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 lg:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-display font-bold text-2xl lg:text-3xl" style={{ color: theme.text }}>
              {isLogin ? "Acesse sua conta" : "Crie sua conta"}
            </h2>
            <p style={{ color: theme.textMuted }} className="mt-2 text-sm">
              {isLogin ? "Entre para gerenciar seus anúncios" : "Cadastre-se gratuitamente como corretor de imóveis"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: `${theme.text}cc` }}>Nome completo</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                    style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.text }}
                    placeholder="Seu nome completo" />
                </div>
                 <div>
                   <label className="block text-sm font-medium mb-1.5" style={{ color: `${theme.text}cc` }}>WhatsApp</label>
                   <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                     className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                     style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.text }}
                     placeholder="(27) 99999-9999" />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-sm font-medium mb-1.5" style={{ color: `${theme.text}cc` }}>Estado</label>
                     <div className="relative">
                       <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.textMuted }} />
                       <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(""); }}
                         className="w-full pl-9 pr-3 py-3 rounded-xl text-sm focus:outline-none transition-all appearance-none"
                         style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.text }}>
                         {BRAZIL_STATES.map(s => <option key={s.uf} value={s.uf}>{s.uf}</option>)}
                       </select>
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium mb-1.5" style={{ color: `${theme.text}cc` }}>Cidade *</label>
                     <div className="relative">
                       <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.textMuted }} />
                       <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} required
                         className="w-full pl-9 pr-3 py-3 rounded-xl text-sm focus:outline-none transition-all appearance-none"
                         style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.text }}>
                         <option value="">{loadingCities ? "Carregando..." : "Selecione"}</option>
                         {stateCities.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                     </div>
                   </div>
                 </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: `${theme.text}cc` }}>E-mail</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.text }}
                placeholder="seu@email.com" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: `${theme.text}cc` }}>Senha</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all pr-12"
                  style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.text }}
                  placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: theme.textMuted }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: `${theme.text}cc` }}>Confirmar Senha</label>
                <input type={showPassword ? "text" : "password"} required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                  style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.text }}
                  placeholder="Repita a senha" />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              style={{ background: theme.primary, color: "#fff", boxShadow: `0 8px 24px ${theme.primary}40` }}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLogin ? (
                <><LogIn size={16} /> Entrar no Painel</>
              ) : (
                <><UserPlus size={16} /> Criar Conta Grátis</>
              )}
            </button>
          </form>

          {!signedUp && isLogin && (
            <p className="text-center text-sm mt-8" style={{ color: theme.textMuted }}>
              <button onClick={() => setIsLogin(false)} className="font-semibold hover:underline" style={{ color: theme.primary }}>
                Quero me Cadastrar
              </button>
            </p>
          )}
          {!signedUp && !isLogin && (
            <p className="text-center text-sm mt-8" style={{ color: theme.textMuted }}>
              Já tem conta?{" "}
              <button onClick={() => setIsLogin(true)} className="font-semibold hover:underline" style={{ color: theme.primary }}>
                Entrar
              </button>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
