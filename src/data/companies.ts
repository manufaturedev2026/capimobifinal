export interface Company {
  id: string;
  name: string;
  logo: string;
  address: string;
  rating: number;
  reviewCount: number;
  category: string;
  segment: "imoveis";
  featured: boolean;
  deliveryTime?: string;
  whatsapp: string;
}

export const propertyCompanies: Company[] = [];
export const allCompanies = [...propertyCompanies];

export const propertyCategories = [
  { slug: "aluguel", name: "Aluguel", icon: "Key", color: "from-[#00AEEF] to-[#0090c5]", img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop" },
  { slug: "casas", name: "Casas", icon: "Home", color: "from-[#002F6C] to-[#004a9f]", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop" },
  { slug: "apartamentos", name: "Apartamentos", icon: "Building2", color: "from-[#00AEEF] to-[#002F6C]", img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop" },
  { slug: "terrenos", name: "Terrenos", icon: "Landmark", color: "from-[#FFD100] to-[#e5bc00]", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=250&fit=crop" },
  { slug: "comerciais", name: "Comerciais", icon: "Store", color: "from-[#002F6C] to-[#00AEEF]", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=250&fit=crop" },
];
