import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Camera, Upload, X, Sparkles, Loader2, CheckCircle2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type PhotoCategoria =
  | "fachada" | "sala" | "cozinha" | "banheiro" | "quarto"
  | "quintal" | "rua" | "garagem" | "escada" | "gourmet" | "piscina" | "outro";

export const CATEGORIAS_FOTO: { value: PhotoCategoria; label: string }[] = [
  { value: "fachada", label: "Fachada" },
  { value: "sala", label: "Sala" },
  { value: "cozinha", label: "Cozinha" },
  { value: "banheiro", label: "Banheiro principal" },
  { value: "quarto", label: "Quarto principal" },
  { value: "quintal", label: "Área externa / quintal" },
  { value: "rua", label: "Rua / frente" },
  { value: "garagem", label: "Garagem" },
  { value: "escada", label: "Escada / pavimento superior" },
  { value: "gourmet", label: "Área gourmet" },
  { value: "piscina", label: "Piscina" },
  { value: "outro", label: "Outro / detectar" },
];

export type FotoItem = {
  id: string;
  file: File;
  dataUrl: string;
  categoria: PhotoCategoria;
};

export type AnaliseVisual = {
  scores: {
    visual_externo: number;
    interior: number;
    acabamento_visual: number;
    conservacao_aparente: number;
    liquidez_visual: number;
  };
  score_visual_geral: number;
  ajuste_total_pct: number;
  ajuste_breakdown: {
    conservacao_visual_pct: number;
    acabamento_visual_pct: number;
    apelo_comercial_pct: number;
    entorno_visual_pct: number;
  };
  resumo_externo: string;
  resumo_interno: string;
  resumo_conservacao: string;
  resumo_geral: string;
  ambientes_identificados: Array<{ foto_index: number; ambiente_detectado: string; observacao: string }>;
  sugestoes_melhorias: string[];
  total_fotos_analisadas: number;
};

const MIN_FOTOS = 1;
const MAX_FOTOS = 10;
const MAX_SIZE_MB = 8;

interface Props {
  contexto: {
    tipo: string;
    cidade: string;
    bairro: string;
    acabamentoDeclarado: string;
    conservacaoDeclarada: string;
  };
  analise: AnaliseVisual | null;
  onAnaliseChange: (a: AnaliseVisual | null) => void;
  fotos: FotoItem[];
  onFotosChange: (f: FotoItem[]) => void;
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export default function PhotoAnalysisStep({
  contexto, analise, onAnaliseChange, fotos, onFotosChange,
}: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const slots = MAX_FOTOS - fotos.length;
    if (slots <= 0) {
      toast({ title: `Máximo de ${MAX_FOTOS} fotos`, variant: "destructive" });
      return;
    }
    const accepted = arr.slice(0, slots).filter((f) => {
      if (!/^image\/(jpeg|jpg|png|webp)$/.test(f.type)) {
        toast({ title: `Formato inválido: ${f.name}`, variant: "destructive" });
        return false;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast({ title: `Imagem maior que ${MAX_SIZE_MB}MB: ${f.name}`, variant: "destructive" });
        return false;
      }
      return true;
    });

    const novos: FotoItem[] = [];
    for (const file of accepted) {
      const dataUrl = await fileToDataUrl(file);
      novos.push({
        id: crypto.randomUUID(),
        file, dataUrl,
        categoria: "outro",
      });
    }
    onFotosChange([...fotos, ...novos]);
    if (analise) onAnaliseChange(null); // invalida análise anterior
  };

  const removerFoto = (id: string) => {
    onFotosChange(fotos.filter((f) => f.id !== id));
    if (analise) onAnaliseChange(null);
  };

  const setCategoria = (id: string, cat: PhotoCategoria) => {
    onFotosChange(fotos.map((f) => (f.id === id ? { ...f, categoria: cat } : f)));
  };

  const analisar = async () => {
    if (fotos.length < MIN_FOTOS) {
      toast({ title: `Adicione no mínimo ${MIN_FOTOS} fotos`, description: `Você enviou ${fotos.length}. A análise visual exige entre ${MIN_FOTOS} e ${MAX_FOTOS} fotos.`, variant: "destructive" });
      return;
    }
    setLoading(true);
    setProgress(8);
    const tick = setInterval(() => setProgress((p) => Math.min(92, p + 4)), 600);

    try {
      const payload = {
        ...contexto,
        photos: fotos.map((f) => ({ categoria: f.categoria, dataUrl: f.dataUrl })),
      };
      const { data, error } = await supabase.functions.invoke("analyze-property-photos", { body: payload });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const normalizedAnalysis = {
        ...(data as AnaliseVisual),
        total_fotos_analisadas: Math.max(Number((data as AnaliseVisual).total_fotos_analisadas) || 0, fotos.length),
      };
      setProgress(100);
      onAnaliseChange(normalizedAnalysis);
      toast({ title: "Análise visual concluída ✨", description: `Ajuste sugerido: ${normalizedAnalysis.ajuste_total_pct > 0 ? "+" : ""}${normalizedAnalysis.ajuste_total_pct.toFixed(1)}%` });
    } catch (e: any) {
      toast({ title: "Erro na análise visual", description: e.message, variant: "destructive" });
    } finally {
      clearInterval(tick);
      setTimeout(() => { setLoading(false); setProgress(0); }, 600);
    }
  };

  return (
    <Card className="p-6 md:p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="flex items-start gap-4 mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Camera className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
            Análise por Fotos
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">Opcional</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Envie fotos para uma avaliação ainda mais precisa. A IA analisa fachada, ambientes, acabamento e conservação visual — ajustando o valor final em até ±20%.
          </p>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition"
      >
        <Upload className="h-8 w-8 text-primary/60 mx-auto mb-2" />
        <p className="font-semibold">Clique ou arraste fotos aqui</p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WEBP · até {MAX_SIZE_MB}MB cada · mínimo {MIN_FOTOS} · máximo {MAX_FOTOS} fotos</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Lista de fotos */}
      {fotos.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {fotos.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img loading="lazy" decoding="async" src={f.dataUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => removerFoto(f.id)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <Select value={f.categoria} onValueChange={(v) => setCategoria(f.id, v as PhotoCategoria)}>
                <SelectTrigger className="mt-2 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_FOTO.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          ))}
        </div>
      )}

      {/* Botão analisar */}
      {fotos.length > 0 && (
        <div className="mt-6">
          <Button
            type="button"
            onClick={analisar}
            disabled={loading}
            className="w-full h-12 text-base bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analisando imagens do imóvel...</>
            ) : analise ? (
              <><Sparkles className="h-5 w-5 mr-2" /> Reanalisar fotos · 3 créditos</>
            ) : (
              <><Sparkles className="h-5 w-5 mr-2" /> Analisar fotos com IA · 3 créditos</>
            )}
          </Button>
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Identificando ambientes · avaliando acabamentos · medindo conservação...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Resultado da análise */}
      <AnimatePresence>
        {analise && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-transparent p-5 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-bold">Análise visual concluída</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Score visual</div>
                  <div className="text-2xl font-bold text-primary">{analise.score_visual_geral.toFixed(1)}<span className="text-sm text-muted-foreground">/10</span></div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                {[
                  ["Externo", analise.scores.visual_externo],
                  ["Interior", analise.scores.interior],
                  ["Acabamento", analise.scores.acabamento_visual],
                  ["Conservação", analise.scores.conservacao_aparente],
                  ["Liquidez", analise.scores.liquidez_visual],
                ].map(([label, val]) => (
                  <div key={label as string} className="bg-background/60 rounded-lg p-2 text-center">
                    <div className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</div>
                    <div className="font-bold text-primary">{(val as number).toFixed(1)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm">
                {analise.resumo_externo && <p><span className="font-semibold">Externo:</span> {analise.resumo_externo}</p>}
                {analise.resumo_interno && <p><span className="font-semibold">Interno:</span> {analise.resumo_interno}</p>}
                {analise.resumo_conservacao && <p><span className="font-semibold">Conservação:</span> {analise.resumo_conservacao}</p>}
              </div>

              <div className={`mt-4 rounded-lg p-3 font-semibold text-center ${
                analise.ajuste_total_pct > 0
                  ? "bg-green-500/15 text-green-700 dark:text-green-400"
                  : analise.ajuste_total_pct < 0
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
              }`}>
                Impacto estimado no valor: {analise.ajuste_total_pct > 0 ? "+" : ""}{analise.ajuste_total_pct.toFixed(1)}%
              </div>
            </div>

            {analise.sugestoes_melhorias.length > 0 && (
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-2 font-semibold text-sm">
                  <ImageIcon className="h-4 w-4 text-primary" /> Sugestões para valorizar
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {analise.sugestoes_melhorias.slice(0, 6).map((s, i) => (
                    <li key={i} className="flex gap-2"><span className="text-primary">›</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
