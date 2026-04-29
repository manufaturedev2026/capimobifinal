import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMyStoryCount } from "@/hooks/useStories";

import { Trash2, Plus, Clock, ExternalLink, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import StoryUploadDialog from "@/components/StoryUploadDialog";

interface StoriesTabProps {
  userId: string;
  sellerId: string;
}

interface StoryRow {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  button_text: string | null;
  button_url: string | null;
  item_id: string | null;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  team_member_id: string | null;
  is_auto?: boolean | null;
}

export default function StoriesTab({ userId, sellerId }: StoriesTabProps) {
  const { toast } = useToast();
  const storyCount = useMyStoryCount(userId);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchStories = async () => {
    const { data } = await supabase
      .from("seller_stories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setStories((data as StoryRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStories();
  }, [userId]);

  const deleteStory = async (id: string, imageUrl: string) => {
    // Find the story to check if it's auto-generated (image belongs to a listing)
    const story = stories.find((s) => s.id === id);

    // Delete from DB
    const { error } = await supabase.from("seller_stories").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }

    // Clean up storage ONLY for manual stories that uploaded their own image to seller-uploads.
    // Auto stories (is_auto) and stories tied to an item_id reuse the listing photo —
    // never delete those, or we'd erase the property photo itself.
    const isAuto = story?.is_auto === true;
    const hasItem = !!story?.item_id;
    if (!isAuto && !hasItem) {
      const match = imageUrl.match(/seller-uploads\/(.+)$/);
      if (match) {
        // Extra safety: confirm no listing is using this same photo before removing.
        const { data: usedBy } = await supabase
          .from("seller_items")
          .select("id")
          .contains("photos", [imageUrl])
          .limit(1);
        if (!usedBy || usedBy.length === 0) {
          await supabase.storage.from("seller-uploads").remove([match[1]]);
        }
      }
    }

    setStories((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Story excluído!" });
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const republishStory = async (id: string) => {
    const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("seller_stories")
      .update({ expires_at: newExpires, is_active: true })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao republicar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Story republicado por mais 24h!" });
      fetchStories();
    }
  };

  const timeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expirado";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min restantes`;
  };

  const activeStories = stories.filter((s) => s.is_active && !isExpired(s.expires_at));
  const expiredStories = stories.filter((s) => !s.is_active || isExpired(s.expires_at));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">📸 Meus Stories</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {storyCount} stories ativos · Expira em 24h automaticamente
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Plus size={16} /> Novo Story
        </Button>
      </div>

      {/* Active Stories */}
      {activeStories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Eye size={14} className="text-green-500" /> Ativos ({activeStories.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {activeStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onDelete={deleteStory}
                timeRemaining={timeRemaining(story.expires_at)}
                expired={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeStories.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-muted-foreground/20 rounded-2xl">
          <div className="text-5xl mb-3">📷</div>
          <p className="text-lg font-semibold text-foreground">Nenhum story ativo</p>
          <p className="text-sm text-muted-foreground mt-1">Publique fotos dos seus imóveis para atrair mais clientes!</p>
          <Button onClick={() => setUploadOpen(true)} className="mt-4 gap-2">
            <Plus size={16} /> Publicar Story
          </Button>
        </div>
      )}

      {/* Expired Stories */}
      {expiredStories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Clock size={14} /> Expirados ({expiredStories.length})
          </h3>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {expiredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onDelete={deleteStory}
                onRepublish={republishStory}
                timeRemaining="Expirado"
                expired
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <StoryUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        sellerId={sellerId}
        onUploaded={fetchStories}
      />
    </div>
  );
}

function StoryCard({ story, onDelete, onRepublish, timeRemaining, expired }: {
  story: StoryRow;
  onDelete: (id: string, imageUrl: string) => void;
  onRepublish?: (id: string) => void;
  timeRemaining: string;
  expired: boolean;
}) {
  return (
    <div className={`relative group rounded-xl overflow-hidden border ${expired ? "opacity-60 border-muted" : "border-border"}`}>
      <div className="aspect-[9/16] relative">
        <img
          src={story.image_url}
          alt={story.title || "Story"}
          className="w-full h-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Time badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          expired ? "bg-red-500/80 text-white" : "bg-green-500/80 text-white"
        }`}>
          {expired ? "Expirado" : timeRemaining}
        </div>

        {/* Delete button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80">
              <Trash2 size={14} />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir story?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O story será removido permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(story.id, story.image_url)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          {expired && onRepublish && (
            <button
              onClick={() => onRepublish(story.id)}
              className="w-full flex items-center justify-center gap-1.5 mb-1.5 px-2 py-1.5 bg-primary/90 hover:bg-primary text-primary-foreground text-[11px] font-bold rounded-lg transition-colors"
            >
              <RefreshCw size={12} /> Republicar
            </button>
          )}
          {story.title && <p className="text-white text-xs font-bold truncate">{story.title}</p>}
          {story.button_text && (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[10px] rounded-full">
              <ExternalLink size={10} /> {story.button_text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
