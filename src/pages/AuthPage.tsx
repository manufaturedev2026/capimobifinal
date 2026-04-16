import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, LogIn, UserPlus, Building2, Shield, KeyRound, Sparkles, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-auth.jpg";
import logoImg from "@/assets/logo-es-corretores.png";
import { BRAZIL_STATES } from "@/data/brazilStates";
import { useCitiesByState } from "@/hooks/useCitiesByState";

export default function AuthPage() {
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
  const [signedUp, setSignedUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState("ES");
  const [selectedCity, setSelectedCity] = useState("");
  const { cities: stateCities, loading: loadingCities } = useCitiesByState(selectedState);
  const { user, profile, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trialDays = searchParams.get("trial");
  const { toast } = useToast();

  const getStoreRoute = (p?: { id: string; slug?: string | null } | null) => {
    const identifier = p?.slug || p?.id;
    return identifier ? `/empresa/${identifier}` : "/painel";
  };

  useEffect(() => {
    if (user && profile) navigate(getStoreRoute(profile), { replace: true });
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      if (password !== confirmPassword) {
        toast({ title: "Senhas não conferem", description: "Confirme a mesma senha nos dois campos.", variant: "destructive" });
        return;
      }
      if (!selectedCity) {
        toast({ title: "Selecione sua cidade", description: "Escolha a cidade para continuar.", variant: "destructive" });
        return;
      }
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      }
      // useEffect handles redirect after profile loads
    } else {
      const { error } = await signUp(email, password, fullName, phone, selectedCity, selectedState);
      if (error) {
        toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      } else {
        setSignedUp(true);
        toast({
          title: "Cadastro realizado!",
          description: trialDays === "7"
            ? "Seus 7 dias grátis do plano Start foram ativados! 🎉"
            : "Complete seu perfil para começar!",
        });

        // Wait for profile to be created by trigger, then redirect
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
              // Handle 7-day free trial from /anunciar
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

              const route = getStoreRoute(newProfile);
              navigate(route, { replace: true });
              return;
            }
            await new Promise(r => setTimeout(r, 500));
          }
          // Fallback
          navigate("/painel", { replace: true });
        };
        waitForProfile();
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Panel - Hero Image + Blue Overlay */}
      <div className="relative w-full lg:w-1/2 h-[40vh] lg:h-auto lg:min-h-screen overflow-hidden">
        <img src={heroImg} alt="Capimobi" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(212,100%,15%)/85%] via-[hsl(197,100%,25%)/70%] to-[hsl(212,100%,20%)/80%]" />
        <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-transparent via-transparent to-background" />
        
        {/* Glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent/15 blur-[120px]" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-3 mb-6">
              <img src={logoImg} alt="Capimobi" className="w-14 h-14 rounded-2xl object-contain" />
              <div>
                <h2 className="text-white font-display text-xl font-bold">
                  <span className="text-primary">Cap</span><span className="text-white">i</span><span className="text-accent">mobi</span>
                </h2>
                <p className="text-white/60 text-sm">Painel do Corretor</p>
              </div>
            </div>

            <h1 className="font-display font-bold text-3xl lg:text-5xl text-white leading-tight mb-4">
              Gerencie seus<br />
              <span className="text-accent">anúncios</span> em<br />um só lugar
            </h1>
            <p className="text-white/70 text-sm lg:text-base max-w-md mb-8">
              Cadastre imóveis, acompanhe visualizações e destaque seus melhores anúncios no Capimobi.
            </p>

            <div className="hidden lg:block space-y-4">
              {[
                { icon: Building2, text: "Publique imóveis com fotos e detalhes", color: "text-primary" },
                { icon: KeyRound, text: "Controle total dos seus anúncios", color: "text-white" },
                { icon: Shield, text: "Perfil verificado e confiável", color: "text-accent" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center shrink-0">
                    <item.icon size={18} className={item.color} />
                  </div>
                  <span className="text-white/80 text-sm">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 lg:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full max-w-md">
          {/* Mobile header */}
           <div className="lg:hidden text-center mb-6">
              <img src={logoImg} alt="Capimobi" className="w-14 h-14 rounded-2xl object-contain mx-auto mb-3" />
              <h2 className="font-display font-bold text-lg">
                <span className="text-primary">Cap</span><span className="text-foreground">i</span><span className="text-accent">mobi</span>
              </h2>
            </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-foreground">
              {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {isLogin ? "Entre para gerenciar seus anúncios" : "Cadastre-se gratuitamente como corretor"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">Nome completo</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
                    placeholder="Seu nome completo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">WhatsApp</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
                    placeholder="(27) 99999-9999" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1.5">Estado</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(""); }}
                        className="w-full pl-9 pr-3 py-3 rounded-xl border border-border bg-secondary text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all appearance-none">
                        {BRAZIL_STATES.map(s => <option key={s.uf} value={s.uf}>{s.uf}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1.5">Cidade *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} required
                        className="w-full pl-9 pr-3 py-3 rounded-xl border border-border bg-secondary text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all appearance-none">
                        <option value="">{loadingCities ? "Carregando..." : "Selecione"}</option>
                        {stateCities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">E-mail</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
                placeholder="seu@email.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Senha</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all pr-12"
                  placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1.5">Confirmar Senha</label>
                <input type={showPassword ? "text" : "password"} required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
                  placeholder="Repita a senha" />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : isLogin ? (
                <><LogIn size={16} /> Entrar no Painel</>
              ) : (
                <><UserPlus size={16} /> Criar Conta Grátis</>
              )}
            </button>
          </form>

          {!signedUp && isLogin && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              <button onClick={() => setIsLogin(false)} className="text-primary font-semibold hover:underline">
                Criar conta da loja
              </button>
            </p>
          )}
          {!signedUp && !isLogin && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              Já tem conta?{" "}
              <button onClick={() => setIsLogin(true)} className="text-primary font-semibold hover:underline">
                Entrar
              </button>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
