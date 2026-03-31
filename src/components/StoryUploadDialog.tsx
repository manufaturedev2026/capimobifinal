import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useMyStoryCount, getStoryLimit } from "@/hooks/useStories";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Loader2 } from "lucide-react";

interface StoryUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId?: string;
  onUploaded?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function StoryUploadDialog({ open, onOpenChange, sellerId, onUploaded }: StoryUploadDialogProps) {
  const { user } = useAuth();
  const { currentTier } = useSubscription(user?.id);
  const currentCount = useMyStoryCount(user?.id);
  const limit = getStoryLimit(currentTier);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canPost = currentCount < limit;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!ALLOWED_TYPES.includes(f.type)) {
      toast({ title: "Formato inválido", description: "Use JPG, PNG ou WebP", variant: "destructive" });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "Arquivo muito grande", description: "Máximo 5MB", variant: "destructive" });
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file || !user || !sellerId) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `stories/${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("seller-uploads")
        .upload(path, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("seller-uploads")
        .getPublicUrl(path);

      const { error: insertError } = await supabase
        .from("seller_stories")
        .insert({
          seller_id: sellerId,
          user_id: user.id,
          image_url: publicUrl,
        } as any);

      if (insertError) throw insertError;

      toast({ title: "Story publicado!", description: "Visível por 24 horas" });
      setFile(null);
      setPreview(null);
      onOpenChange(false);
      onUploaded?.();
    } catch (err: any) {
      toast({ title: "Erro ao publicar", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Publicar Story</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {currentCount}/{limit} stories usados (plano {currentTier})
        </p>

        {!canPost ? (
          <div className="text-center py-6">
            <p className="text-sm text-destructive font-medium">Você atingiu o limite de stories do seu plano.</p>
            <p className="text-xs text-muted-foreground mt-1">Faça upgrade para publicar mais.</p>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {preview ? (
              <div className="relative aspect-[9/16] max-h-[300px] rounded-xl overflow-hidden bg-black mx-auto">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              </div>
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full aspect-[9/16] max-h-[300px] rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
              >
                <ImagePlus className="w-10 h-10 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground">Selecionar imagem</span>
              </button>
            )}

            <div className="flex gap-2">
              {preview && (
                <Button variant="outline" className="flex-1" onClick={() => { setFile(null); setPreview(null); }}>
                  Trocar
                </Button>
              )}
              <Button
                className="flex-1"
                disabled={!file || uploading}
                onClick={handleUpload}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Publicar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
