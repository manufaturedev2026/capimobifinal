import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Check, Smartphone, BarChart3, Layout, Palette, Globe, Shield,
  Sparkles, ArrowRight, Crown, Star, Zap, MessageCircle, Eye,
  Layers, Users, Rocket, AppWindow, ChevronRight, User, Phone, Mail, Lock, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/vender-hero.jpg";
import MarketplaceNavbar from "@/components/MarketplaceNavbar";
import { getMarketplaceTheme } from "@/lib/marketplaceThemes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  {
    key: "basico",
    name: "Gratuito",
    subtitle: "Para quem quer validar uma ideia",
    price: 0,
    priceLabel: "Gratuito",
    setupFee: null,
    color: "border-slate-400",
    accent: "bg-slate-500",
    benefits: [
      "Até 5 anúncios ativos",
      "1 Layout (Showcase)",
      "Painel do vendedor completo",
      "Estatísticas básicas",
      "PWA instalável no celular",
    ],
    cta: "Criar conta grátis",
    popular: false,
  },
  {
    key: "start",
    name: "Start",
    subtitle: "Para corretores que estão começando",
    price: 24.99,
    priceLabel: "R$24,99",
    setupFee: 299,
    color: "border-emerald-400",
    accent: "bg-gradient-to-r from-emerald-500 to-teal-500",
    benefits: [
      "Até 25 anúncios ativos",
      "1 Layout (Showcase)",
      "Destaque na listagem",
      "Painel completo + CRM",
      "Estatísticas básicas",
      "Galeria de anúncios",
    ],
    cta: "Começar agora",
    popular: false,
  },

  return (
    <>
      <Helmet>
        <title>Crie Seu App de Imóveis | Brokers App</title>
        <meta name="description" content="Monte seu próprio app de imóveis em minutos. Gratuito para começar. Perfeito para corretores, imobiliárias e construtoras." />
      </Helmet>

      <div className="min-h-screen bg-[#002F6C] text-white overflow-x-hidden">

        <MarketplaceNavbar theme={theme} user={user} showImoveisScroll={false} />

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <p className="text-sky-300 font-semibold text-sm tracking-wide uppercase">
                Plataforma para corretores de imóveis
              </p>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1]">
                Crie seu próprio{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-cyan-400">
                  app de imóveis
                </span>
              </h1>
              <p className="text-lg text-white/70 max-w-lg leading-relaxed">
                Sua loja profissional, instalável no celular, com CRM, galeria de anúncios, WhatsApp integrado e SEO otimizado. Comece gratuitamente.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-5 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 outline-none focus:border-sky-400 transition-colors"
                />
                <Button onClick={handleCta} className="bg-sky-400 hover:bg-sky-500 text-[#002F6C] font-bold rounded-full px-7 py-3.5 text-sm whitespace-nowrap">
                  Criar conta grátis <ArrowRight className="ml-1.5 w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-white/50">
                Sem cartão de crédito. Cancele quando quiser.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden md:flex justify-center"
            >
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400/30 to-purple-500/20 rounded-3xl blur-3xl" />
                <img
                  src={heroImg}
                  alt="Corretora usando o Brokers App"
                  className="relative rounded-3xl shadow-2xl w-full object-cover"
                  width={1280}
                  height={960}
                />
              </div>
            </motion.div>
          </div>

          {/* Stats bar */}
          <div className="bg-white/5 border-y border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-black text-sky-400">{s.value}</p>
                  <p className="text-xs text-white/60 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="funcionalidades" className="bg-white text-slate-900 py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sky-600 font-semibold text-sm uppercase tracking-wide mb-3">Tudo que você precisa</p>
              <h2 className="font-display text-3xl md:text-4xl font-black">
                Para sua loja de imóveis decolar
              </h2>
              <p className="text-slate-500 mt-4 text-lg">
                Ferramentas profissionais para corretores, imobiliárias e construtoras
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-sky-200 rounded-2xl p-6 transition-all hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <f.icon size={22} />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="planos" className="bg-slate-50 text-slate-900 py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sky-600 font-semibold text-sm uppercase tracking-wide mb-3">Planos e preços</p>
              <h2 className="font-display text-3xl md:text-4xl font-black">
                Comece de graça ou escolha seu plano
              </h2>
              <p className="text-slate-500 mt-4 text-lg">
                Todos os planos incluem 7 dias de teste gratuito
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PLANS.map((plan, i) => (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative bg-white rounded-2xl border-2 ${plan.color} p-6 flex flex-col ${
                    plan.popular ? "ring-2 ring-amber-400 shadow-xl scale-[1.02]" : "shadow-md"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase px-4 py-1 rounded-full tracking-wide">
                      Recomendado
                    </span>
                  )}

                  <h3 className="font-display font-bold text-xl">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{plan.subtitle}</p>

                  <div className="mt-5 mb-4">
                    {plan.price === 0 ? (
                      <p className="text-3xl font-black text-slate-900">Gratuito</p>
                    ) : (
                      <>
                        <p className="text-3xl font-black text-slate-900">
                          {plan.priceLabel}<span className="text-sm font-normal text-slate-500">/mês</span>
                        </p>
                        {plan.setupFee && (
                          <p className="text-[11px] text-slate-400 mt-1">
                            + R${plan.setupFee.toLocaleString("pt-BR")} de implementação
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={handleCta}
                    className={`w-full rounded-xl font-bold ${
                      plan.popular
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        : plan.price === 0
                        ? "bg-[#002F6C] hover:bg-[#001d44] text-white"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-gradient-to-br from-[#002F6C] to-[#001a3d] py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Rocket className="w-12 h-12 text-sky-400 mx-auto mb-4" />
              <h2 className="font-display text-3xl md:text-4xl font-black">
                Pronto para criar seu app de imóveis?
              </h2>
              <p className="text-white/60 text-lg mt-4 max-w-xl mx-auto">
                Comece agora gratuitamente. Sem cartão de crédito, sem compromisso. Sua loja profissional em minutos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Button onClick={handleCta} size="lg" className="bg-sky-400 hover:bg-sky-500 text-[#002F6C] font-bold rounded-full px-10 text-base">
                  Criar minha conta grátis <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="rounded-full border-white/30 text-black bg-white/90 hover:bg-white px-8 text-base font-semibold">
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer mini */}
        <footer className="bg-[#001a3d] border-t border-white/10 py-8">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <p>© {new Date().getFullYear()} Brokers App. Todos os direitos reservados.</p>
            <div className="flex gap-4">
              <Link to="/privacidade" className="hover:text-white/70 transition-colors">Privacidade</Link>
              <Link to="/termos" className="hover:text-white/70 transition-colors">Termos</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
