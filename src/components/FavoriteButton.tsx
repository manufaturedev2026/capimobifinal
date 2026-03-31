import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

export default function FavoriteButton({ isFavorite, onClick, className }: FavoriteButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:scale-110 transition-all shadow-md",
        className
      )}
      aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart
        size={18}
        className={cn(
          "transition-colors",
          isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
        )}
      />
    </button>
  );
}
