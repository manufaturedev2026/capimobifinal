import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useCitiesByState } from "@/hooks/useCitiesByState";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";

interface InviteSignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  onSuccess?: (fullName: string) => void;
}

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function InviteSignupDialog({ open, onOpenChange, defaultName = "", onSuccess }: InviteSignupDialogProps) {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(defaultName);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("ES");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [sellerCategory, setSellerCategory] = useState<"corretor" | "imobiliaria" | "construtora">("corretor");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { cities } = useCitiesByState(state);

  useEffect(() => {
    if (defaultName && !fullName) setFullName(defaultName);
  }, [defaultName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim() || !city) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Senha deve ter ao menos 6 caracteres", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await signUp(email.trim(), password, fullName.trim(), phone.trim() || undefined, city, state);
      if (error) throw error;

      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser?.id) {
        for (let i = 0; i < 10; i++) {
          const { data: prof } = await supabase.from("profiles").select("id").eq("user_id", newUser.id).maybeSingle();
          if (prof) {
            await supabase.from("profiles").update({ seller_category: sellerCategory }).eq("id", prof.id);
            break;
          }
          await new Promise(r => setTimeout(r, 500));
        }
      }

      setSuccess(true);
      toast({ title: "🎉 Conta criada com sucesso!", description: "Você já está no funil. Continue conversando!" });
      onSuccess?.(fullName.trim());
      setTimeout(() => onOpenChange(false), 1800);
    } catch (err: any) {
      const msg = err?.message?.includes("already registered")
        ? "Este e-mail já está cadastrado. Faça login no painel."
        : err?.message || "Erro ao criar conta";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h3 className="text-xl font-bold">Conta criada!</h3>
            <p className="text-sm text-muted-foreground">Continuando a conversa...</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Criar minha conta grátis
              </DialogTitle>
              <DialogDescription>
                Cadastro rápido • Sem cartão • Plano grátis vitalício
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div>
                <Label htmlFor="signup-name">Nome completo *</Label>
                <Input id="signup-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="signup-email">E-mail *</Label>
                <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="signup-phone">WhatsApp</Label>
                <Input id="signup-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="27999999999" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Estado *</Label>
                  <select value={state} onChange={(e) => { setState(e.target.value); setCity(""); }} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Cidade *</Label>
                  <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
                    <option value="">Selecione</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Eu sou *</Label>
                <select value={sellerCategory} onChange={(e) => setSellerCategory(e.target.value as any)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="corretor">Corretor(a)</option>
                  <option value="imobiliaria">Imobiliária</option>
                  <option value="construtora">Construtora</option>
                </select>
              </div>
              <div>
                <Label htmlFor="signup-password">Senha * (mín. 6 caracteres)</Label>
                <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white font-bold">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : "🚀 Criar minha conta grátis"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}