import { useCompare } from "@/hooks/useCompare";
import { X, GitCompareArrows, Trash2 } from "lucide-react";
import { formatPrice } from "@/data/products";
import { motion, AnimatePresence } from "framer-motion";

export default function CompareBar() {
  const { items, removeItem, clearAll, isOpen, setIsOpen } = useCompare();

  if (items.length === 0) return null;

  const specs = [
    { label: "Preço", key: "price", format: (v: any) => v ? formatPrice(v) : "—" },
    { label: "Quartos", key: "bedrooms", format: (v: any) => v ?? "—" },
    { label: "Banheiros", key: "bathrooms", format: (v: any) => v ?? "—" },
    { label: "Área (m²)", key: "area", format: (v: any) => v ? `${v} m²` : "—" },
    { label: "Suítes", key: "suites", format: (v: any) => v ?? "—" },
    { label: "Vagas", key: "parking_spots", format: (v: any) => v ?? "—" },
    { label: "Condomínio", key: "condo_fee", format: (v: any) => v ? formatPrice(v) : "—" },
    { label: "IPTU", key: "iptu", format: (v: any) => v ? formatPrice(v) : "—" },
    { label: "Piscina", key: "pool", format: (v: any) => v ? "Sim ✅" : "Não" },
    { label: "Mobiliado", key: "furnished", format: (v: any) => v ? "Sim ✅" : "Não" },
    { label: "Financiamento", key: "accepts_financing", format: (v: any) => v ? "Sim ✅" : "Não" },
    { label: "Cidade", key: "city", format: (v: any) => v || "—" },
    { label: "Bairro", key: "neighborhood", format: (v: any) => v || "—" },
  ];

  return (
    <>
      {/* Floating bar */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3"
          >
            <div className="flex -space-x-2">
              {items.map(item => (
                <img loading="lazy" decoding="async" key={item.id} src={item.image} alt="" className="w-10 h-10 rounded-full border-2 border-card object-cover" />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">{items.length}/3 imóveis</span>
            <button onClick={() => setIsOpen(true)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2">
              <GitCompareArrows size={16} />
              Comparar
            </button>
            <button onClick={clearAll} className="p-2 rounded-xl hover:bg-secondary transition-colors">
              <Trash2 size={16} className="text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full compare modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl border border-border shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
                <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                  <GitCompareArrows size={20} className="text-primary" />
                  Comparador de Imóveis
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={clearAll} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Limpar</button>
                  <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-4 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-sm font-medium text-muted-foreground p-2 min-w-[100px]"></th>
                      {items.map(item => (
                        <th key={item.id} className="p-2 min-w-[200px]">
                          <div className="relative">
                            <button onClick={() => removeItem(item.id)} className="absolute -top-1 -right-1 p-1 bg-card rounded-full border border-border shadow-md hover:bg-secondary z-10">
                              <X size={12} />
                            </button>
                            <img loading="lazy" decoding="async" src={item.image} alt={item.title} className="w-full aspect-[4/3] object-cover rounded-xl" />
                            <p className="font-display font-bold text-sm text-foreground mt-2 line-clamp-2">{item.title}</p>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {specs.map((spec, i) => (
                      <tr key={spec.key} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                        <td className="p-2 text-sm font-medium text-muted-foreground whitespace-nowrap">{spec.label}</td>
                        {items.map(item => (
                          <td key={item.id} className="p-2 text-sm font-semibold text-foreground text-center">
                            {spec.format((item as any)[spec.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
