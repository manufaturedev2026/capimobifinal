import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) { setFavoriteIds(new Set()); return; }
    setLoading(true);
    const { data } = await supabase
      .from("favorites")
      .select("item_id")
      .eq("user_id", user.id);
    if (data) setFavoriteIds(new Set(data.map((f: any) => f.item_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (itemId: string) => {
    if (!user) { toast.error("Faça login para salvar favoritos"); return; }
    const isFav = favoriteIds.has(itemId);
    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(itemId); else next.add(itemId);
      return next;
    });
    if (isFav) {
      const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("item_id", itemId);
      if (error) { fetchFavorites(); toast.error("Erro ao remover favorito"); }
      else toast.success("Removido dos favoritos");
    } else {
      const { error } = await supabase.from("favorites").insert({ user_id: user.id, item_id: itemId });
      if (error) { fetchFavorites(); toast.error("Erro ao favoritar"); }
      else toast.success("Adicionado aos favoritos ❤️");
    }
  }, [user, favoriteIds, fetchFavorites]);

  const isFavorite = useCallback((itemId: string) => favoriteIds.has(itemId), [favoriteIds]);

  return { favoriteIds, toggleFavorite, isFavorite, loading };
}
