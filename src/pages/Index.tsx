import { Link, useNavigate, useParams } from "react-router-dom";
import { useCityDetection } from "@/hooks/useCityDetection";
import { Building2, ArrowRight, Search, Home, Key, Landmark, Store, MapPin, Shield, Zap, Star, ChevronRight, Plus } from "lucide-react";
import NotFoundPage from "@/pages/NotFound";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import heroImoveis from "@/assets/hero-imoveis.jpg";
import { slugToCity, cityToSlug } from "@/lib/citySlug";
import StoriesBar from "@/components/StoriesBar";
import StoryUploadDialog from "@/components/StoryUploadDialog";
import { useAuth } from "@/hooks/useAuth";

function getHeroBanners(city: string, prefix: string) {
  const imoveisLink = prefix ? `/imoveis/${prefix}` : "/imoveis";
  return [
    {
      image: heroImoveis,
      title: `Imóveis ${city.includes("Espírito") ? "no" : "em"} ${city}`,
      subtitle: "Encontre casas, apartamentos e terrenos com os melhores preços",
      link: imoveisLink,
      accent: "from-primary to-[hsl(212,100%,21%)]",
    },
  ];
}

function getQuickActions(prefix: string) {
  return [
    { icon: Home, label: "Casas", desc: "Encontre a casa ideal", link: `/imoveis?categoria=casas`, color: "text-primary" },
    { icon: Building2, label: "Apartamentos", desc: "Aptos disponíveis", link: `/imoveis?categoria=apartamentos`, color: "text-primary" },
    { icon: Key, label: "Aluguel", desc: "Imóveis para alugar", link: `/imoveis?categoria=alugueis`, color: "text-primary" },
    { icon: Landmark, label: "Terrenos", desc: "Lotes e terrenos", link: `/imoveis?categoria=terrenos`, color: "text-primary" },
    { icon: Store, label: "Comerciais", desc: "Salas e lojas", link: `/imoveis?categoria=comerciais`, color: "text-primary" },
    { icon: Building2, label: "Flats", desc: "Flats e studios", link: `/imoveis?categoria=flats`, color: "text-primary" },
  ];
}

function getCategories(prefix: string) {
  return [
    { name: "Casas", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=400&fit=crop", link: `/imoveis?categoria=casas` },
    { name: "Apartamentos", img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=400&fit=crop", link: `/imoveis?categoria=apartamentos` },
    { name: "Terrenos", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=400&fit=crop", link: `/imoveis?categoria=terrenos` },
    { name: "Aluguel", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=400&fit=crop", link: `/imoveis?categoria=alugueis` },
    { name: "Comercial", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop", link: `/imoveis?categoria=comerciais` },
    { name: "Flats", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=400&fit=crop", link: `/imoveis?categoria=flats` },
    { name: "Galpões", img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=400&fit=crop", link: `/imoveis?categoria=galpoes` },
    { name: "Cobertura", img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=400&fit=crop", link: `/imoveis?categoria=coberturas` },
  ];
}

export default function Index() {
  const { cidade } = useParams<{ cidade?: string }>();
  const { detectedCity } = useCityDetection();
  const navigate = useNavigate();
  const cityName = cidade ? slugToCity(cidade) : (detectedCity || null);
  const displayCity = cityName || "Espírito Santo";
  const citySlug = cityName ? cityToSlug(cityName) : "";
  const [searchQuery, setSearchQuery] = useState("");
  const quickActions = getQuickActions(citySlug);
  const categories = getCategories(citySlug);
  const heroBanners = getHeroBanners(displayCity, citySlug);

  if (cidade && !cityName) {
    return <NotFoundPage />;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="min-h-screen bg-secondary/50">
      <Helmet>
        <title>{`Imóveis ${displayCity.includes("Espírito") ? "no" : "em"} ${displayCity} | ES Corretores`}</title>
        <meta name="description" content={`Marketplace de imóveis ${displayCity.includes("Espírito") ? "no" : "em"} ${displayCity}. Casas, apartamentos, terrenos e mais com contato direto via WhatsApp.`} />
        <link rel="canonical" href={`https://redeimoveisgb.lovable.app${cidade ? `/${cidade}` : '/'}`} />
      </Helmet>

      {/* Hero Banner */}
      <section className="relative w-full h-[280px] md:h-[400px] overflow-hidden">
        <Link to={heroBanners[0].link} className="absolute inset-0">
          <img src={heroBanners[0].image} alt={heroBanners[0].title} className="w-full h-full object-cover" width={1400} height={512} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 lg:px-24 max-w-2xl">
            <h2 className="font-display font-bold text-2xl md:text-5xl text-white drop-shadow-lg leading-tight">
              {heroBanners[0].title}
            </h2>
            <p className="text-white/80 text-sm md:text-lg mt-2 md:mt-3 drop-shadow">{heroBanners[0].subtitle}</p>
            <div className="mt-4 md:mt-6">
              <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${heroBanners[0].accent} text-white font-bold text-sm shadow-lg`}>
                Ver ofertas <ArrowRight size={16} />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* Search Bar */}
      <section className="relative z-20 -mt-7 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="flex bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="flex-1 flex items-center px-4 gap-3">
              <Search size={20} className="text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar imóveis..."
                className="w-full py-4 text-sm md:text-base bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <button type="submit" className="px-6 md:px-8 bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity">
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 md:px-8 mt-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory md:grid md:grid-cols-6">
            {quickActions.map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="snap-start flex-shrink-0 w-[130px] md:w-auto"
              >
                <Link to={action.link} className="group flex flex-col items-center text-center bg-card border border-border rounded-2xl p-4 hover:shadow-md hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                    <action.icon size={22} className={`${action.color} transition-colors`} />
                  </div>
                  <span className="font-display font-semibold text-sm text-foreground">{action.label}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{action.desc}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banners */}
      <section className="px-4 md:px-8 mt-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to={citySlug ? `/imoveis/${citySlug}` : "/imoveis"} className="group relative overflow-hidden rounded-2xl h-[180px] md:h-[200px] block">
            <img src={heroImoveis} alt="Imóveis" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" width={1400} height={200} />
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary)/0.9)] to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-8">
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Marketplace</span>
              <h3 className="font-display font-bold text-2xl md:text-3xl text-white mt-1">Todos os Imóveis</h3>
              <p className="text-white/80 text-sm mt-1">Casas, aptos, terrenos e mais</p>
              <span className="mt-3 inline-flex items-center gap-1 text-white text-sm font-semibold group-hover:gap-2 transition-all">
                Explorar <ChevronRight size={16} />
              </span>
            </div>
          </Link>

          <Link to={`${citySlug ? `/imoveis/${citySlug}` : "/imoveis"}?categoria=casas`} className="group relative overflow-hidden rounded-2xl h-[180px] md:h-[200px] block">
            <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=400&fit=crop" alt="Casa Própria" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" width={800} height={400} />
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--accent)/0.9)] to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-8">
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Mais Buscado</span>
              <h3 className="font-display font-bold text-2xl md:text-3xl text-white mt-1">Casa Própria</h3>
              <p className="text-white/80 text-sm mt-1">Realize o sonho da sua casa</p>
              <span className="mt-3 inline-flex items-center gap-1 text-white text-sm font-semibold group-hover:gap-2 transition-all">
                Ver Casas <ChevronRight size={16} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="px-4 md:px-8 mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">Categorias</h2>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                >
                  <Link to={cat.link} className="group flex flex-col items-center text-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-border group-hover:border-primary group-hover:shadow-lg transition-all">
                      <img src={cat.img} alt={cat.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-foreground mt-2 group-hover:text-primary transition-colors">{cat.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="px-4 md:px-8 mt-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Shield, title: "Contato Direto", desc: "Fale via WhatsApp" },
            { icon: MapPin, title: displayCity.includes("Espírito") ? "Todo o ES" : `${displayCity} e Região`, desc: displayCity.includes("Espírito") ? "Cobertura estadual" : "Foco na sua cidade" },
            { icon: Star, title: "Vendedores Verificados", desc: "Corretores confiáveis" },
            { icon: Zap, title: "Anuncie Grátis", desc: "Cadastre seus imóveis" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-display font-semibold text-sm text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA — Anunciar */}
      <section className="px-4 md:px-8 mt-8 pb-10">
        <div className="max-w-6xl mx-auto">
          <div className="gradient-hero rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_50%)]" />
            <div className="relative z-10 text-center md:text-left">
              <h2 className="font-display font-bold text-xl md:text-3xl text-white">Quer anunciar seu imóvel?</h2>
              <p className="text-white/80 text-sm md:text-base mt-1">Publique seu imóvel e receba contatos via WhatsApp</p>
            </div>
            <Link
              to="/anunciar"
              className="relative z-10 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-foreground font-bold text-sm hover:scale-105 transition-transform shadow-lg"
            >
              <Plus size={18} />
              Anunciar Grátis
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
