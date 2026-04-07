import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const LOCAL_KEY = "brokers_favorites";

function getLocalFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function setLocalFavorites(ids: Set<string>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify([...ids]));
}

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => getLocalFavorites());
  const [loading, setLoading] = useState(false);

  // Sync from DB when logged in
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(getLocalFavorites());
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("favorites")
      .select("item_id")
      .eq("user_id", user.id);
    if (data) {
      const dbIds = new Set(data.map((f: any) => f.item_id));
      // Merge localStorage favorites into DB on first login
      const localIds = getLocalFavorites();
      const toSync = [...localIds].filter(id => !dbIds.has(id));
      if (toSync.length > 0) {
        await supabase.from("favorites").upsert(
          toSync.map(item_id => ({ user_id: user.id, item_id })),
          { onConflict: "user_id,item_id", ignoreDuplicates: true }
        );
        toSync.forEach(id => dbIds.add(id));
        localStorage.removeItem(LOCAL_KEY);
      }
      setFavoriteIds(dbIds);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (itemId: string) => {
    const isFav = favoriteIds.has(itemId);

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(itemId); else next.add(itemId);
      // Always persist to localStorage
      setLocalFavorites(next);
      return next;
    });

    if (!user) {
      toast.success(isFav ? "Removido dos favoritos" : "Adicionado aos favoritos ❤️");
      return;
    }

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
