import { MessageCircle, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { type Company } from "@/data/companies";
import { motion } from "framer-motion";
import { useWhatsAppPicker } from "@/components/WhatsAppTeamPicker";

export default function CompanyCard({ company, index }: { company: Company; index: number }) {
  const profileUrl = `/empresa/${company.id}`;
  const { openWhatsApp } = useWhatsAppPicker();

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openWhatsApp({
      sellerId: company.id,
      sellerName: company.name,
      sellerPhone: company.whatsapp,
      title: company.name,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.04 }}
    >
      <Link to={profileUrl} className="block card-epic bg-card border border-border group">
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl">
          <img
            src={company.logo}
            alt={company.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          {company.featured && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-accent text-accent-foreground text-xs font-bold shadow-md">
              ⭐ Destaque
            </span>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-display font-bold text-foreground text-base leading-tight line-clamp-1">
            {company.name}
          </h3>

          <div className="flex items-center gap-1.5 mt-2">
            <Star size={14} className="text-accent fill-accent" />
            <span className="text-sm font-semibold text-foreground">{company.rating}</span>
            <span className="text-xs text-muted-foreground">({company.reviewCount})</span>
          </div>

          <div className="flex items-start gap-1.5 text-muted-foreground text-xs mt-2">
            <MapPin size={13} className="mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{company.address}</span>
          </div>

          <button
            onClick={handleWhatsApp}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#25d366] to-[#128c7e] text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <MessageCircle size={16} />
            WhatsApp
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
