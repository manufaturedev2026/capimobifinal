// Estruturas dinâmicas e campos contextuais por tipo de imóvel
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const ESTRUTURAS_POR_TIPO: Record<string, string[]> = {
  Casa: [
    "Casa térrea",
    "Sobrado integrado",
    "Casa com pavimento superior",
    "Duas moradias no lote",
    "Uso misto residencial/comercial",
    "Geminada",
    "Condomínio fechado",
    "Casa de vila",
    "Triplex residencial",
  ],
  Apartamento: [
    "Padrão",
    "Cobertura",
    "Duplex",
    "Triplex",
    "Garden",
    "Studio",
    "Loft",
    "Kitnet",
    "Flat",
    "Condomínio clube",
    "Penthouse",
    "Apartamento térreo",
  ],
  Terreno: [
    "Residencial plano",
    "Residencial aclive",
    "Residencial declive",
    "Esquina",
    "Comercial",
    "Industrial",
    "Rural / sítio",
    "Condomínio fechado",
    "Frente mar / lago / rio",
    "Chácara urbana",
    "Loteamento novo",
  ],
  Comercial: [
    "Loja térrea",
    "Sala comercial",
    "Galpão",
    "Depósito",
    "Escritório",
    "Prédio comercial",
    "Ponto de esquina",
    "Clínica / consultório",
    "Restaurante montado",
    "Shopping kiosk",
    "Coworking",
    "Uso misto comercial/residencial",
  ],
  Rural: [
    "Sítio",
    "Chácara",
    "Fazenda pecuária",
    "Fazenda agrícola",
    "Área de reflorestamento",
    "Haras",
    "Rancho beira rio/lago",
    "Terra nua produtiva",
    "Propriedade mista",
    "Área para loteamento futuro",
  ],
};

export const ESTRUTURA_PADRAO: Record<string, string> = {
  Casa: "Casa térrea",
  Apartamento: "Padrão",
  Terreno: "Residencial plano",
  Comercial: "Loja térrea",
  Rural: "Sítio",
};

// ===== Campos extras por tipo =====

export type TerrenoState = {
  frente: string; laterais: string;
  topografia: string; zoneamento: string;
};
export const TERRENO_INITIAL: TerrenoState = { frente: "", laterais: "", topografia: "", zoneamento: "" };

export type ComercialState = {
  fluxoPessoas: string; vitrine: boolean;
  peDireito: string; docas: boolean; estacionamento: boolean;
};
export const COMERCIAL_INITIAL: ComercialState = {
  fluxoPessoas: "", vitrine: false, peDireito: "", docas: false, estacionamento: false,
};

export type RuralState = {
  hectares: string; aguaAbundante: boolean; energia: boolean;
  curral: boolean; soloProdutivo: boolean; acessoAsfalto: boolean;
};
export const RURAL_INITIAL: RuralState = {
  hectares: "", aguaAbundante: false, energia: false,
  curral: false, soloProdutivo: false, acessoAsfalto: false,
};

const Toggle = ({ label, val, onToggle }: { label: string; val: boolean; onToggle: () => void }) => (
  <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
    val ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/50"
  }`}>
    <Checkbox checked={val} onCheckedChange={onToggle} />
    <span className="font-medium">{label}</span>
  </label>
);

export function TerrenoExtraFields({ state, onChange }: {
  state: TerrenoState; onChange: <K extends keyof TerrenoState>(k: K, v: TerrenoState[K]) => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.02] p-5">
      <div className="text-xs font-bold text-primary mb-4 uppercase tracking-wider">📐 Dados do terreno</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Frente (m)</Label>
          <Input type="number" value={state.frente} onChange={(e) => onChange("frente", e.target.value)} placeholder="12" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Laterais (m)</Label>
          <Input type="number" value={state.laterais} onChange={(e) => onChange("laterais", e.target.value)} placeholder="25" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Topografia</Label>
          <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={state.topografia} onChange={(e) => onChange("topografia", e.target.value)}>
            <option value="">Selecione</option>
            <option value="plano">Plano</option>
            <option value="aclive_leve">Aclive leve</option>
            <option value="aclive_forte">Aclive forte</option>
            <option value="declive_leve">Declive leve</option>
            <option value="declive_forte">Declive forte</option>
          </select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Zoneamento</Label>
          <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={state.zoneamento} onChange={(e) => onChange("zoneamento", e.target.value)}>
            <option value="">Selecione</option>
            <option value="residencial">Residencial</option>
            <option value="comercial">Comercial</option>
            <option value="misto">Misto</option>
            <option value="industrial">Industrial</option>
            <option value="rural">Rural</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function ComercialExtraFields({ state, onChange }: {
  state: ComercialState; onChange: <K extends keyof ComercialState>(k: K, v: ComercialState[K]) => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.02] p-5">
      <div className="text-xs font-bold text-primary mb-4 uppercase tracking-wider">🏢 Dados comerciais</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <Label className="text-xs text-muted-foreground">Fluxo de pessoas</Label>
          <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={state.fluxoPessoas} onChange={(e) => onChange("fluxoPessoas", e.target.value)}>
            <option value="">Selecione</option>
            <option value="alto">Alto (rua movimentada)</option>
            <option value="medio">Médio</option>
            <option value="baixo">Baixo</option>
          </select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Pé direito (m)</Label>
          <Input type="number" step="0.1" value={state.peDireito} onChange={(e) => onChange("peDireito", e.target.value)} placeholder="3.5" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        <Toggle label="Vitrine para rua" val={state.vitrine} onToggle={() => onChange("vitrine", !state.vitrine)} />
        <Toggle label="Docas / carga" val={state.docas} onToggle={() => onChange("docas", !state.docas)} />
        <Toggle label="Estacionamento" val={state.estacionamento} onToggle={() => onChange("estacionamento", !state.estacionamento)} />
      </div>
    </div>
  );
}

export function RuralExtraFields({ state, onChange }: {
  state: RuralState; onChange: <K extends keyof RuralState>(k: K, v: RuralState[K]) => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.02] p-5">
      <div className="text-xs font-bold text-primary mb-4 uppercase tracking-wider">🌾 Dados rurais</div>
      <div className="mb-3">
        <Label className="text-xs text-muted-foreground">Tamanho (hectares)</Label>
        <Input type="number" step="0.1" value={state.hectares} onChange={(e) => onChange("hectares", e.target.value)} placeholder="50" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        <Toggle label="Água abundante" val={state.aguaAbundante} onToggle={() => onChange("aguaAbundante", !state.aguaAbundante)} />
        <Toggle label="Energia elétrica" val={state.energia} onToggle={() => onChange("energia", !state.energia)} />
        <Toggle label="Curral / benfeitoria" val={state.curral} onToggle={() => onChange("curral", !state.curral)} />
        <Toggle label="Solo produtivo" val={state.soloProdutivo} onToggle={() => onChange("soloProdutivo", !state.soloProdutivo)} />
        <Toggle label="Acesso asfaltado" val={state.acessoAsfalto} onToggle={() => onChange("acessoAsfalto", !state.acessoAsfalto)} />
      </div>
    </div>
  );
}
