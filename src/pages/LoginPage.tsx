import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, LogIn, UserPlus, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-anunciar.jpg";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !params.get("trial");
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const [hasStore, setHasStore] = useState(true);
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
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await signUp(email, password, fullName, phone);
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Image Panel */}
      <div className="relative w-full lg:w-1/2 h-[40vh] lg:h-auto lg:min-h-screen overflow-hidden">
        <img src={heroImg} alt="Brokers App" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-transparent via-transparent to-background" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-primary" />
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Brokers App</span>
            </div>
            <h1 className="font-display font-bold text-3xl lg:text-5xl text-white leading-tight mb-3">
              Área do<br /><span className="text-accent">Corretor</span>
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
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-foreground">
              {isLogin ? "Acesse sua conta" : "Crie sua conta"}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {isLogin ? "Entre para gerenciar seus anúncios" : "Cadastre-se gratuitamente como corretor de imóveis"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">Nome completo</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all"
                    placeholder="Seu nome completo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">Telefone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all"
                    placeholder="(27) 99999-9999" />
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
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/30 focus:border-foreground/30 focus:outline-none transition-all pr-12"
                  placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
              ) : isLogin ? (
                <><LogIn size={16} /> Entrar no Painel</>
              ) : (
                <><UserPlus size={16} /> Criar Conta Grátis</>
              )}
            </button>
          </form>

          {!signedUp && isLogin && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              <button onClick={() => setIsLogin(false)} className="text-accent font-semibold hover:underline">
                Criar conta da loja
              </button>
            </p>
          )}
          {!signedUp && !isLogin && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              Já tem conta?{" "}
              <button onClick={() => setIsLogin(true)} className="text-accent font-semibold hover:underline">
                Entrar
              </button>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
