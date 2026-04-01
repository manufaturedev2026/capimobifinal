import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, User, Phone, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppLeadCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  sellerUserId: string;
  onComplete: () => void;
}

export default function WhatsAppLeadCapture({
  open,
  onOpenChange,
  sellerId,
  sellerUserId,
  onComplete,
}: WhatsAppLeadCaptureProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    const sourceUrl = window.location.href;
    try {
      await supabase.from("seller_crm_contacts").insert({
        seller_id: sellerId,
        user_id: sellerUserId,
        full_name: name.trim().slice(0, 100),
        phone: phone.trim().slice(0, 20),
        funnel_stage: "novo",
        notes: `📍 ${city.trim() || "Não informada"}\n🔗 ${sourceUrl}`,
      } as any);
    } catch {}
    setSaving(false);
    onOpenChange(false);
    setName("");
    setPhone("");
    setCity("");
    onComplete();
  };

  const handleSkip = () => {
    onOpenChange(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MessageCircle size={20} className="text-[#25d366]" />
            Antes de chamar...
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Preencha rapidamente para um atendimento melhor 😊
        </p>
        <div className="space-y-3 mt-1">
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome *"
              className="pl-9"
              maxLength={100}
            />
          </div>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Seu WhatsApp *"
              className="pl-9"
              maxLength={20}
              type="tel"
            />
          </div>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Sua cidade"
              className="pl-9"
              maxLength={60}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !phone.trim() || saving}
            className="flex-1 bg-[#25d366] hover:bg-[#22c55e] text-white"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
            Continuar
          </Button>
          <Button variant="ghost" onClick={handleSkip} className="text-xs text-muted-foreground">
            Pular
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
