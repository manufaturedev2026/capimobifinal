// Campos opcionais de avaliação profissional para auto-preenchimento da Avaliação IA
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const ACABAMENTOS = ["Simples", "Médio", "Bom", "Alto padrão", "Luxo"];
const CONSERVACOES = ["Novo", "Reformado", "Bom estado", "Antigo", "Precisa reforma"];
const LIQUIDEZ = [
  { v: "alta", l: "Alta procura no bairro" },
  { v: "media", l: "Procura média" },
  { v: "baixa", l: "Baixa procura" },
];

const QUAL: Record<string, Array<{ v: string; l: string }>> = {
  piso: [{ v: "simples", l: "Simples" }, { v: "bom", l: "Bom" }, { v: "premium", l: "Premium" }],
  banheiro: [{ v: "antigo", l: "Antigo" }, { v: "bom", l: "Bom" }, { v: "moderno", l: "Moderno" }],
  cozinha: [{ v: "antiga", l: "Antiga" }, { v: "boa", l: "Boa" }, { v: "moderna", l: "Moderna" }],
  pintura: [{ v: "ruim", l: "Ruim" }, { v: "media", l: "Média" }, { v: "nova", l: "Nova" }],
  esquadrias: [{ v: "antigas", l: "Antigas" }, { v: "boas", l: "Boas" }, { v: "premium", l: "Premium" }],
  telhado: [{ v: "ruim", l: "Ruim" }, { v: "ok", l: "OK" }, { v: "novo", l: "Novo" }],
  eletrica: [{ v: "antiga", l: "Antiga" }, { v: "revisada", l: "Revisada" }, { v: "nova", l: "Nova" }],
};

interface Props {
  form: any;
  setForm: (updater: any) => void;
}

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
      active
        ? "bg-primary text-primary-foreground border-primary shadow-sm"
        : "bg-muted/50 hover:bg-muted text-foreground border-transparent"
    }`}
  >
    {children}
  </button>
);

const Toggle = ({ label, val, onToggle }: { label: string; val: boolean; onToggle: () => void }) => (
  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs ${
    val ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
  }`}>
    <input type="checkbox" checked={val} onChange={onToggle} className="h-3.5 w-3.5 accent-primary" />
    <span className="font-medium">{label}</span>
  </label>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h4 className="text-xs font-bold uppercase tracking-wide text-foreground/80">{title}</h4>
    {children}
  </div>
);

const QualPicker = ({ label, field, opts, value, onChange }: {
  label: string; field: string; opts: Array<{ v: string; l: string }>; value: string; onChange: (v: string) => void;
}) => (
  <div>
    <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
    <div className="flex gap-1.5">
      {opts.map((o) => (
        <Chip key={o.v} active={value === o.v} onClick={() => onChange(value === o.v ? "" : o.v)}>{o.l}</Chip>
      ))}
    </div>
  </div>
);

export default function ListingValuationFields({ form, setForm }: Props) {
  const [open, setOpen] = useState(false);
  const update = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));
  const toggle = (k: string) => setForm((s: any) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="bg-card border-2 border-dashed border-primary/30 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-md">
            <Sparkles size={18} />
          </div>
          <div className="text-left">
            <h3 className="font-display font-bold text-foreground text-sm">Dados para Avaliação IA <span className="text-[10px] uppercase font-bold text-violet-500 ml-1">opcional</span></h3>
            <p className="text-xs text-muted-foreground">Preencha para gerar laudos profissionais com 1 clique</p>
          </div>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5 text-primary" />}
      </button>

      {open && (
        <div className="p-4 pt-0 space-y-5 border-t border-border/50">
          <Section title="Padrão de acabamento">
            <div className="flex flex-wrap gap-1.5">
              {ACABAMENTOS.map((a) => (
                <Chip key={a} active={form.acabamento === a} onClick={() => update("acabamento", form.acabamento === a ? "" : a)}>{a}</Chip>
              ))}
            </div>
          </Section>

          <Section title="Conservação">
            <div className="flex flex-wrap gap-1.5">
              {CONSERVACOES.map((c) => (
                <Chip key={c} active={form.conservacao === c} onClick={() => update("conservacao", form.conservacao === c ? "" : c)}>{c}</Chip>
              ))}
            </div>
          </Section>

          <Section title="Estrutura interna detalhada">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Lavabos</p>
                <input type="number" value={form.lavabos} onChange={(e) => update("lavabos", e.target.value)} className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Cozinhas</p>
                <input type="number" value={form.kitchens} onChange={(e) => update("kitchens", e.target.value)} className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Escritórios</p>
                <input type="number" value={form.offices} onChange={(e) => update("offices", e.target.value)} className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Total de andares (prédio)</p>
                <input type="number" value={form.total_floors_building} onChange={(e) => update("total_floors_building", e.target.value)} className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Área coberta externa (m²)</p>
                <input type="number" value={form.area_coberta_externa} onChange={(e) => update("area_coberta_externa", e.target.value)} className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Área útil (m²)</p>
                <input type="number" value={form.area_util} onChange={(e) => update("area_util", e.target.value)} className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background" />
              </div>
            </div>
          </Section>

          <Section title="Ambientes presentes">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Toggle label="Sala de estar" val={form.amb_sala_estar} onToggle={() => toggle("amb_sala_estar")} />
              <Toggle label="Sala de jantar" val={form.amb_sala_jantar} onToggle={() => toggle("amb_sala_jantar")} />
              <Toggle label="Sala de TV" val={form.amb_sala_tv} onToggle={() => toggle("amb_sala_tv")} />
              <Toggle label="Copa" val={form.amb_copa} onToggle={() => toggle("amb_copa")} />
              <Toggle label="Lavanderia" val={form.amb_lavanderia} onToggle={() => toggle("amb_lavanderia")} />
              <Toggle label="Área de serviço" val={form.amb_area_servico} onToggle={() => toggle("amb_area_servico")} />
              <Toggle label="Closet" val={form.amb_closet} onToggle={() => toggle("amb_closet")} />
              <Toggle label="Despensa" val={form.amb_despensa} onToggle={() => toggle("amb_despensa")} />
              <Toggle label="Varanda interna" val={form.amb_varanda_interna} onToggle={() => toggle("amb_varanda_interna")} />
            </div>
          </Section>

          <Section title="Localização avançada">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Toggle label="Bairro valorizado" val={form.loc_bairro_valorizado} onToggle={() => toggle("loc_bairro_valorizado")} />
              <Toggle label="Rua tranquila" val={form.loc_rua_tranquila} onToggle={() => toggle("loc_rua_tranquila")} />
              <Toggle label="Vista privilegiada" val={form.loc_vista_privilegiada} onToggle={() => toggle("loc_vista_privilegiada")} />
              <Toggle label="⚠ Área de risco" val={form.loc_area_risco} onToggle={() => toggle("loc_area_risco")} />
            </div>
          </Section>

          <Section title="Infraestrutura próxima">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Toggle label="Escola" val={form.infra_escola} onToggle={() => toggle("infra_escola")} />
              <Toggle label="Hospital / Saúde" val={form.infra_hospital} onToggle={() => toggle("infra_hospital")} />
              <Toggle label="Comércio local" val={form.infra_comercio} onToggle={() => toggle("infra_comercio")} />
              <Toggle label="Transporte público" val={form.infra_transporte} onToggle={() => toggle("infra_transporte")} />
              <Toggle label="Praça / Parque" val={form.infra_parque} onToggle={() => toggle("infra_parque")} />
              <Toggle label="Bancos / Serviços" val={form.infra_bancos} onToggle={() => toggle("infra_bancos")} />
            </div>
          </Section>

          <Section title="Acabamento item-a-item">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <QualPicker label="Piso" field="finish_piso" opts={QUAL.piso} value={form.finish_piso} onChange={(v) => update("finish_piso", v)} />
              <QualPicker label="Banheiros" field="finish_banheiro" opts={QUAL.banheiro} value={form.finish_banheiro} onChange={(v) => update("finish_banheiro", v)} />
              <QualPicker label="Cozinha" field="finish_cozinha" opts={QUAL.cozinha} value={form.finish_cozinha} onChange={(v) => update("finish_cozinha", v)} />
              <QualPicker label="Pintura" field="finish_pintura" opts={QUAL.pintura} value={form.finish_pintura} onChange={(v) => update("finish_pintura", v)} />
              <QualPicker label="Esquadrias" field="finish_esquadrias" opts={QUAL.esquadrias} value={form.finish_esquadrias} onChange={(v) => update("finish_esquadrias", v)} />
              <QualPicker label="Telhado" field="finish_telhado" opts={QUAL.telhado} value={form.finish_telhado} onChange={(v) => update("finish_telhado", v)} />
              <QualPicker label="Instalação elétrica" field="finish_eletrica" opts={QUAL.eletrica} value={form.finish_eletrica} onChange={(v) => update("finish_eletrica", v)} />
            </div>
          </Section>

          <Section title="Documentação">
            <div className="grid grid-cols-2 gap-2">
              <Toggle label="Habite-se em dia" val={form.habite_se} onToggle={() => toggle("habite_se")} />
              <Toggle label="Sem pendências judiciais" val={form.sem_pendencias_judiciais} onToggle={() => toggle("sem_pendencias_judiciais")} />
            </div>
          </Section>

          <Section title="Liquidez do mercado">
            <div className="flex flex-wrap gap-1.5">
              {LIQUIDEZ.map((o) => (
                <Chip key={o.v} active={form.liquidez === o.v} onClick={() => update("liquidez", form.liquidez === o.v ? "" : o.v)}>{o.l}</Chip>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
