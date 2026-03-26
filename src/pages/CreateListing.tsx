import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, LogIn, UserPlus, Building2, Shield, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import heroImg from "@/assets/hero-anunciar.jpg";

export default function CreateListing() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
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
        toast({ title: "Cadastro realizado!", description: "Bem-vindo ao ES Corretores!" });
        navigate("/painel");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[hsl(212,100%,8%)]">
      {/* Image Panel */}
      <div className="relative w-full lg:w-1/2 h-[40vh] lg:h-auto lg:min-h-screen overflow-hidden">
        <img
          src={heroImg}
          alt="Imóveis de qualidade"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-transparent via-transparent to-[hsl(212,100%,8%)]" />
        <div className="absolute inset-0 bg-black/30" />

        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-accent" />
              <span className="text-accent font-semibold text-sm uppercase tracking-wider">
                ES Corretores
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl lg:text-5xl text-white leading-tight mb-3">
              Anuncie seu<br />
              <span className="text-primary">imóvel</span>
            </h1>
            <p className="text-white/60 text-sm lg:text-base max-w-md">
              O maior marketplace de imóveis do Espírito Santo. Cadastre-se e comece a anunciar hoje mesmo.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-white">
              {isLogin ? "Acesse sua conta" : "Crie sua conta"}
            </h2>
            <p className="text-white/50 mt-2 text-sm">
              {isLogin
                ? "Entre para gerenciar seus anúncios"
                : "Cadastre-se gratuitamente como corretor de imóveis"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 focus:ring-2 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all backdrop-blur-sm"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 focus:ring-2 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all backdrop-blur-sm"
                    placeholder="(27) 99999-9999"
                  />
                </div>


              </>
            )}

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 focus:ring-2 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all backdrop-blur-sm"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 focus:ring-2 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all backdrop-blur-sm pr-12"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
              ) : isLogin ? (
                <>
                  <LogIn size={16} /> Entrar no Painel
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Criar Conta Grátis
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-8">
            {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-accent font-semibold hover:underline"
            >
              {isLogin ? "Cadastre-se grátis" : "Entrar"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
