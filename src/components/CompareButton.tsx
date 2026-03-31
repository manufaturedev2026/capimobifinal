import { GitCompareArrows } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompareButtonProps {
  isInCompare: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

export default function CompareButton({ isInCompare, onClick, className }: CompareButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:scale-110 transition-all shadow-md",
        isInCompare && "bg-primary/20 border-primary/50",
        className
      )}
      aria-label={isInCompare ? "Remover do comparador" : "Comparar imóvel"}
    >
      <GitCompareArrows
        size={16}
        className={cn("transition-colors", isInCompare ? "text-primary" : "text-muted-foreground")}
      />
    </button>
  );
}
