import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { toast } from "sonner";

interface CompareItem {
  id: string;
  title: string;
  image: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  city?: string;
  neighborhood?: string;
  category?: string;
  suites?: number;
  parking_spots?: number;
  pool?: boolean;
  furnished?: boolean;
  accepts_financing?: boolean;
  condo_fee?: number;
  iptu?: number;
}

interface CompareContextType {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearAll: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((item: CompareItem) => {
    setItems(prev => {
      if (prev.length >= 3) { toast.error("Máximo de 3 imóveis para comparar"); return prev; }
      if (prev.find(i => i.id === item.id)) return prev;
      toast.success("Adicionado ao comparador");
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const isInCompare = useCallback((id: string) => items.some(i => i.id === id), [items]);

  const clearAll = useCallback(() => setItems([]), []);

  return (
    <CompareContext.Provider value={{ items, addItem, removeItem, isInCompare, clearAll, isOpen, setIsOpen }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
