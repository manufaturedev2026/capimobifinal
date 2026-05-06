import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useMyStoryCount } from "@/hooks/useStories";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Loader2, Type, FileText, Package, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StoryUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId?: string;
  onUploaded?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface SellerItemOption {
  id: string;
  title: string;
  price: number | null;
  photos: string[] | null;
}

interface TeamMemberOption {
  id: string;
  full_name: string;
  photo_url: string | null;
}

export default function StoryUploadDialog({ open, onOpenChange, sellerId, onUploaded }: StoryUploadDialogProps) {
  const { user, profile } = useAuth();
  const currentCount = useMyStoryCount(user?.id);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rich fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [items, setItems] = useState<SellerItemOption[]>([]);
  const [showItemPicker, setShowItemPicker] = useState(false);

  // Team member (corretor) selection
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const isEmpresa = false; // no tier-based restrictions anymore

  // Load seller items + team members
  useEffect(() => {
    if (!sellerId || !open) return;
    supabase
      .from("seller_items")
      .select("id, title, price, photos")
      .eq("seller_id", sellerId)
      .eq("status", "ativo")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setItems((data as SellerItemOption[]) || []);
      });

    if (isEmpresa) {
      supabase
        .from("team_members")
        .select("id, full_name, photo_url")
        .eq("company_id", sellerId)
        .eq("is_active", true)
        .order("full_name")
        .then(({ data }) => {
          setTeamMembers((data as TeamMemberOption[]) || []);
        });
    }
  }, [sellerId, open, isEmpresa]);

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

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setTitle("");
    setDescription("");
    setButtonText("");
    setSelectedItemId(null);
    setSelectedMemberId(null);
    setShowItemPicker(false);
    setShowMemberPicker(false);
  };

  const handleUpload = async () => {
    if (!file || !user || !sellerId) return;
    if (!selectedItemId) {
      toast({
        title: "Vincule um anúncio",
        description: "Todo story precisa estar vinculado a um anúncio da sua loja.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      // Comprime apenas se for imagem (não comprime vídeos de stories)
      let uploadFile = file;
      const { STORAGE_CACHE_HEADERS, compressImage } = await import("@/lib/imageCompression");
      if (file.type.startsWith("image/")) {
        uploadFile = await compressImage(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1080 });
      }
      const ext = uploadFile.name.split(".").pop();
      const path = `stories/${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("seller-uploads")
        .upload(path, uploadFile, { contentType: uploadFile.type, ...STORAGE_CACHE_HEADERS });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("seller-uploads")
        .getPublicUrl(path);

      const finalButtonUrl = `/imoveis/produto/${selectedItemId}`;

      const { error: insertError } = await supabase
        .from("seller_stories")
        .insert({
          seller_id: sellerId,
          user_id: user.id,
          image_url: publicUrl,
          title: title.trim() || null,
          description: description.trim() || null,
          button_text: buttonText.trim() || null,
          button_url: finalButtonUrl,
          item_id: selectedItemId,
          team_member_id: selectedMemberId,
        } as any);
      if (insertError) throw insertError;

      const memberName = selectedMemberId
        ? teamMembers.find((m) => m.id === selectedMemberId)?.full_name
        : null;

      toast({
        title: "Story publicado!",
        description: memberName
          ? `Story de ${memberName} visível por 24 horas`
          : "Visível por 24 horas",
      });
      resetForm();
      onOpenChange(false);
      onUploaded?.();
    } catch (err: any) {
      console.error("[StoryUpload] Erro detalhado:", err);
      toast({ title: "Erro ao publicar", description: err.message || JSON.stringify(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const selectedMember = teamMembers.find((m) => m.id === selectedMemberId);

  const formatPrice = (price: number | null) => {
    if (!price) return "";
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md w-[calc(100vw-1rem)] sm:w-full max-h-[100dvh] sm:max-h-[90vh] h-[100dvh] sm:h-auto p-0 sm:p-6 rounded-none sm:rounded-lg flex flex-col gap-0 sm:gap-4">
        <DialogHeader className="px-4 pt-4 sm:px-0 sm:pt-0 shrink-0">
          <DialogTitle>Publicar Story</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 px-4 sm:px-2">
          <div className="space-y-4 pb-24 sm:pb-20">
            <p className="text-sm text-muted-foreground">
              {currentCount} stories ativos
            </p>

              <>
                {/* Team member selector for empresa plans */}
                {isEmpresa && teamMembers.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Users className="w-3.5 h-3.5" /> Publicar como corretor (opcional)
                    </Label>

                    {selectedMember ? (
                      <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/50">
                        {selectedMember.photo_url && (
                          <img loading="lazy" decoding="async" src={selectedMember.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        )}
                        <p className="text-xs font-medium flex-1">{selectedMember.full_name}</p>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedMemberId(null)}>✕</Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowMemberPicker(!showMemberPicker)}
                      >
                        Selecionar corretor
                      </Button>
                    )}

                    {showMemberPicker && !selectedMemberId && (
                      <div className="max-h-[120px] overflow-y-auto border border-border rounded-lg divide-y divide-border">
                        {teamMembers.map((member) => (
                          <button
                            key={member.id}
                            className="flex items-center gap-2 p-2 w-full text-left hover:bg-muted/50 transition-colors"
                            onClick={() => { setSelectedMemberId(member.id); setShowMemberPicker(false); }}
                          >
                            {member.photo_url ? (
                              <img loading="lazy" decoding="async" src={member.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                {member.full_name.charAt(0)}
                              </div>
                            )}
                            <span className="text-xs font-medium">{member.full_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Image upload */}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {preview ? (
                  <div className="relative aspect-[9/16] max-h-[40vh] sm:max-h-[220px] w-auto rounded-xl overflow-hidden bg-black mx-auto">
                    <img loading="lazy" decoding="async" src={preview} alt="Preview" className="w-full h-full object-contain" />
                    {(title || description || buttonText) && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                        {title && <p className="text-white font-bold text-xs">{title}</p>}
                        {description && <p className="text-white/80 text-[10px] mt-0.5">{description}</p>}
                        {buttonText && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-white text-black text-[10px] font-semibold rounded-full">
                            {buttonText}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="w-full aspect-[9/16] max-h-[40vh] sm:max-h-[220px] rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
                  >
                    <ImagePlus className="w-10 h-10 text-muted-foreground/50" />
                    <span className="text-sm text-muted-foreground">Selecionar imagem</span>
                  </button>
                )}

                {/* Link to item — moved BEFORE optional fields so the required selector is visible without scrolling */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Package className="w-3.5 h-3.5" /> Vincular a um anúncio <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Obrigatório. O story sempre direciona para um anúncio da sua loja.
                  </p>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3 text-center border border-border rounded-lg">
                      Nenhum anúncio ativo. Crie um anúncio primeiro.
                    </p>
                  ) : (
                    <Select
                      value={selectedItemId ?? undefined}
                      onValueChange={(v) => {
                        setSelectedItemId(v);
                        if (!buttonText) setButtonText("Ver anúncio");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecionar anúncio" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[260px] z-[100]">
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            <div className="flex items-center gap-2">
                              {item.photos?.[0] && (
                                <img
                                  loading="lazy"
                                  decoding="async"
                                  src={item.photos[0]}
                                  alt=""
                                  className="w-7 h-7 rounded object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate max-w-[220px]">{item.title}</p>
                                {item.price && (
                                  <p className="text-[10px] text-muted-foreground">{formatPrice(item.price)}</p>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {selectedItem && (
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/50">
                      {selectedItem.photos?.[0] && (
                        <img
                          loading="lazy"
                          decoding="async"
                          src={selectedItem.photos[0]}
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{selectedItem.title}</p>
                        {selectedItem.price && (
                          <p className="text-[10px] text-muted-foreground">{formatPrice(selectedItem.price)}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedItemId(null)}>
                        ✕
                      </Button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Type className="w-3.5 h-3.5" /> Título (opcional)
                  </Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Oferta imperdível!" maxLength={60} />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <FileText className="w-3.5 h-3.5" /> Descrição (opcional)
                  </Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição..." maxLength={140} rows={2} />
                </div>

                {/* Button text */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Texto do botão</Label>
                  <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="Ver anúncio" maxLength={30} />
                </div>

              </>

          </div>
        </ScrollArea>

        {/* Sticky actions footer */}
        <div className="shrink-0 flex gap-2 px-4 py-3 sm:px-0 sm:py-0 sm:pt-2 border-t sm:border-t-0 border-border bg-background">
          {preview && (
            <Button variant="outline" className="flex-1" onClick={() => { setFile(null); setPreview(null); }}>
              Trocar imagem
            </Button>
          )}
          <Button className="flex-1" disabled={!file || uploading || !selectedItemId} onClick={handleUpload}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Publicar Story
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
