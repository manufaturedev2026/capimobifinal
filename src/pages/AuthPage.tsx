import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, LogIn, UserPlus, Building2, Shield, KeyRound, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-auth.jpg";
import logoImg from "@/assets/logo-es-corretores.png";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(!new URLSearchParams(window.location.search).get("ref"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate("/painel");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      } else {
        navigate("/painel");
      }
    } else {
      const { error } = await signUp(email, password, fullName, phone);
      if (error) {
        toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      } else {
        // Save referral code if present (after profile is created)
        if (refCode.trim()) {
          // Wait a bit for profile to be created by trigger/hook
          setTimeout(async () => {
            const { data: { user: newUser } } = await supabase.auth.getUser();
            if (newUser) {
              // Check it's not self-referral
              const { data: referrer } = await supabase
                .from("profiles")
                .select("user_id")
                .eq("referral_code", refCode.trim().toUpperCase())
                .maybeSingle();
              if (referrer && referrer.user_id !== newUser.id) {
                await supabase
                  .from("profiles")
                  .update({ referred_by: refCode.trim().toUpperCase() } as any)
                  .eq("user_id", newUser.id);
              }
            }
          }, 2000);
        }
        toast({ title: "Cadastro realizado!", description: "Complete seu perfil para começar!" });
        navigate("/painel");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Panel - Hero Image + Blue Overlay */}
      <div className="relative w-full lg:w-1/2 h-[40vh] lg:h-auto lg:min-h-screen overflow-hidden">
        <img src={heroImg} alt="ES Corretores" className="absolute inset-0 w-full h-full object-cover" />
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
              <img src={logoImg} alt="ES Corretores" className="w-14 h-14 rounded-2xl object-contain" />
              <div>
                <h2 className="text-white font-display text-xl font-bold">
                  <span className="text-primary">E</span><span className="text-accent">S</span> Corretores
                </h2>
                <p className="text-white/60 text-sm">Painel do Corretor</p>
              </div>
            </div>

            <h1 className="font-display font-bold text-3xl lg:text-5xl text-white leading-tight mb-4">
              Gerencie seus<br />
              <span className="text-accent">anúncios</span> em<br />um só lugar
            </h1>
            <p className="text-white/70 text-sm lg:text-base max-w-md mb-8">
              Cadastre imóveis, acompanhe visualizações e destaque seus melhores anúncios no maior marketplace do ES.
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
              <img src={logoImg} alt="ES Corretores" className="w-14 h-14 rounded-2xl object-contain mx-auto mb-3" />
              <h2 className="font-display font-bold text-lg">
                <span className="text-primary">E</span><span className="text-accent">S</span> <span className="text-foreground">Corretores</span>
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
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">Telefone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
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
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all pr-12"
                  placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

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

          <p className="text-center text-sm text-muted-foreground mt-8">
            {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:underline">
              {isLogin ? "Cadastre-se grátis" : "Entrar"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
