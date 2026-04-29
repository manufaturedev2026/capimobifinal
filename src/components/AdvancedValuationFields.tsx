// Campos avançados do Avaliador Profissional /avaliacao-ia
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export type AdvancedState = {
  // Áreas extras
  areaCobertaExterna: string;
  areaUtil: string;
  // Ambientes booleans
  lavabos: string;
  salaEstar: boolean;
  salaJantar: boolean;
  salaTv: boolean;
  copa: boolean;
  lavanderia: boolean;
  areaServico: boolean;
  closet: boolean;
  despensa: boolean;
  varandaInterna: boolean;
  // Localização avançada
  bairroValorizado: boolean;
  ruaTranquila: boolean;
  proximoComercio: boolean;
  proximoEscola: boolean;
  proximoHospital: boolean;
  vistaPrivilegiada: boolean;
  areaRisco: boolean;
  // Acabamento item-a-item
  pisoQualidade: string;
  banheiroQualidade: string;
  cozinhaQualidade: string;
  pinturaQualidade: string;
  esquadriasQualidade: string;
  telhadoQualidade: string;
  eletricaQualidade: string;
  // Documentação avançada
  habiteSe: boolean;
  financiavel: boolean;
  semPendencias: boolean;
  // Liquidez
  liquidezMercado: string;
};

export const ADVANCED_INITIAL: AdvancedState = {
  areaCobertaExterna: "", areaUtil: "", lavabos: "0",
  salaEstar: false, salaJantar: false, salaTv: false, copa: false,
  lavanderia: false, areaServico: false, closet: false, despensa: false, varandaInterna: false,
  bairroValorizado: false, ruaTranquila: false, proximoComercio: false, proximoEscola: false,
  proximoHospital: false, vistaPrivilegiada: false, areaRisco: false,
  pisoQualidade: "", banheiroQualidade: "", cozinhaQualidade: "",
  pinturaQualidade: "", esquadriasQualidade: "", telhadoQualidade: "", eletricaQualidade: "",
  habiteSe: false, financiavel: false, semPendencias: false,
  liquidezMercado: "",
};

const QUALIDADE_OPTS: Record<string, Array<{ v: string; l: string }>> = {
  piso: [{ v: "simples", l: "Simples" }, { v: "bom", l: "Bom" }, { v: "premium", l: "Premium" }],
  banheiro: [{ v: "antigo", l: "Antigo" }, { v: "bom", l: "Bom" }, { v: "moderno", l: "Moderno" }],
  cozinha: [{ v: "antiga", l: "Antiga" }, { v: "boa", l: "Boa" }, { v: "moderna", l: "Moderna" }],
  pintura: [{ v: "ruim", l: "Ruim" }, { v: "media", l: "Média" }, { v: "nova", l: "Nova" }],
  esquadrias: [{ v: "antigas", l: "Antigas" }, { v: "boas", l: "Boas" }, { v: "premium", l: "Premium" }],
  telhado: [{ v: "ruim", l: "Ruim" }, { v: "ok", l: "OK" }, { v: "novo", l: "Novo" }],
  eletrica: [{ v: "antiga", l: "Antiga" }, { v: "revisada", l: "Revisada" }, { v: "nova", l: "Nova" }],
};

const LIQUIDEZ_OPTS = [
  { v: "alta", l: "Alta procura no bairro" },
  { v: "media", l: "Procura média" },
  { v: "baixa", l: "Baixa procura" },
];

interface Props {
  state: AdvancedState;
  onChange: <K extends keyof AdvancedState>(key: K, value: AdvancedState[K]) => void;
}

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <div className="mb-6 pb-6 border-b border-border/50 last:border-0">
    <div className="flex items-baseline justify-between mb-3">
      <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h3>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
    {children}
  </div>
);

const Toggle = ({ label, val, onToggle }: { label: string; val: boolean; onToggle: () => void }) => (
  <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
    val ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/50"
  }`}>
    <Checkbox checked={val} onCheckedChange={onToggle} />
    <span className="font-medium">{label}</span>
  </label>
);

const QualPicker = ({
  label,
  field,
  opts,
  state,
  onChange,
}: {
  label: string;
  field: keyof AdvancedState;
  opts: Array<{ v: string; l: string }>;
  state: AdvancedState;
  onChange: Props["onChange"];
}) => (
  <div>
    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</Label>
    <div className="flex gap-1.5">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(field, (state[field] === o.v ? "" : o.v) as any)}
          className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold transition-all border ${
            state[field] === o.v
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-muted/50 hover:bg-muted text-foreground border-transparent"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  </div>
);

export default function AdvancedValuationFields({ state, onChange }: Props) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.02] p-5 md:p-6 mt-2">
      <div className="text-xs font-bold text-primary mb-4 uppercase tracking-wider">⚡ Modo Profissional Avançado</div>

      <Section title="Localização (35% do peso)" hint="Marque todas que se aplicam">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          <Toggle label="Bairro valorizado" val={state.bairroValorizado} onToggle={() => onChange("bairroValorizado", !state.bairroValorizado)} />
          <Toggle label="Rua tranquila" val={state.ruaTranquila} onToggle={() => onChange("ruaTranquila", !state.ruaTranquila)} />
          <Toggle label="Próximo a comércio" val={state.proximoComercio} onToggle={() => onChange("proximoComercio", !state.proximoComercio)} />
          <Toggle label="Próximo a escola" val={state.proximoEscola} onToggle={() => onChange("proximoEscola", !state.proximoEscola)} />
          <Toggle label="Próximo a hospital" val={state.proximoHospital} onToggle={() => onChange("proximoHospital", !state.proximoHospital)} />
          <Toggle label="Vista privilegiada" val={state.vistaPrivilegiada} onToggle={() => onChange("vistaPrivilegiada", !state.vistaPrivilegiada)} />
          <Toggle label="⚠️ Área de risco/alagamento" val={state.areaRisco} onToggle={() => onChange("areaRisco", !state.areaRisco)} />
        </div>
      </Section>

      <Section title="Tamanho complementar (15%)">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Área coberta externa (m²)</Label>
            <Input type="number" value={state.areaCobertaExterna} onChange={(e) => onChange("areaCobertaExterna", e.target.value)} placeholder="Ex: 30" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Área útil total (m²)</Label>
            <Input type="number" value={state.areaUtil} onChange={(e) => onChange("areaUtil", e.target.value)} placeholder="Ex: 110" />
          </div>
        </div>
      </Section>

      <Section title="Estrutura interna detalhada (15%)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div>
            <Label className="text-xs text-muted-foreground">Lavabos</Label>
            <Input type="number" value={state.lavabos} onChange={(e) => onChange("lavabos", e.target.value)} />
          </div>
        </div>
        <Label className="text-xs text-muted-foreground mb-2 block">Ambientes</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          <Toggle label="Sala de estar" val={state.salaEstar} onToggle={() => onChange("salaEstar", !state.salaEstar)} />
          <Toggle label="Sala de jantar" val={state.salaJantar} onToggle={() => onChange("salaJantar", !state.salaJantar)} />
          <Toggle label="Sala de TV" val={state.salaTv} onToggle={() => onChange("salaTv", !state.salaTv)} />
          <Toggle label="Copa" val={state.copa} onToggle={() => onChange("copa", !state.copa)} />
          <Toggle label="Lavanderia" val={state.lavanderia} onToggle={() => onChange("lavanderia", !state.lavanderia)} />
          <Toggle label="Área de serviço" val={state.areaServico} onToggle={() => onChange("areaServico", !state.areaServico)} />
          <Toggle label="Closet" val={state.closet} onToggle={() => onChange("closet", !state.closet)} />
          <Toggle label="Despensa" val={state.despensa} onToggle={() => onChange("despensa", !state.despensa)} />
          <Toggle label="Varanda interna" val={state.varandaInterna} onToggle={() => onChange("varandaInterna", !state.varandaInterna)} />
        </div>
      </Section>

      <Section title="Acabamento item-a-item (15%)" hint="Avalie cada componente">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QualPicker label="Piso" field="pisoQualidade" opts={QUALIDADE_OPTS.piso} state={state} onChange={onChange} />
          <QualPicker label="Banheiros" field="banheiroQualidade" opts={QUALIDADE_OPTS.banheiro} state={state} onChange={onChange} />
          <QualPicker label="Cozinha" field="cozinhaQualidade" opts={QUALIDADE_OPTS.cozinha} state={state} onChange={onChange} />
          <QualPicker label="Pintura" field="pinturaQualidade" opts={QUALIDADE_OPTS.pintura} state={state} onChange={onChange} />
          <QualPicker label="Esquadrias" field="esquadriasQualidade" opts={QUALIDADE_OPTS.esquadrias} state={state} onChange={onChange} />
          <QualPicker label="Telhado" field="telhadoQualidade" opts={QUALIDADE_OPTS.telhado} state={state} onChange={onChange} />
          <QualPicker label="Instalação elétrica" field="eletricaQualidade" opts={QUALIDADE_OPTS.eletrica} state={state} onChange={onChange} />
        </div>
      </Section>

      <Section title="Documentação avançada (5%)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <Toggle label="Habite-se" val={state.habiteSe} onToggle={() => onChange("habiteSe", !state.habiteSe)} />
          <Toggle label="Financiável" val={state.financiavel} onToggle={() => onChange("financiavel", !state.financiavel)} />
          <Toggle label="Sem pendências judiciais" val={state.semPendencias} onToggle={() => onChange("semPendencias", !state.semPendencias)} />
        </div>
      </Section>

      <Section title="Liquidez do mercado (5%)">
        <div className="flex flex-wrap gap-2">
          {LIQUIDEZ_OPTS.map(o => (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange("liquidezMercado", state.liquidezMercado === o.v ? "" : o.v)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                state.liquidezMercado === o.v
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-muted hover:bg-muted/70 text-foreground"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
