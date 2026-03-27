interface Props {
  form: Record<string, any>;
  setForm: (fn: (f: any) => any) => void;
}

const inputClass = "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none";
const selectClass = inputClass;
const labelClass = "text-xs text-muted-foreground mb-1 block";

const INFRA_OPTIONS = [
  { value: "agua", label: "Água" },
  { value: "luz", label: "Luz" },
  { value: "esgoto", label: "Esgoto" },
  { value: "asfalto", label: "Asfalto" },
  { value: "internet", label: "Internet" },
];

export default function PropertyFieldsTerreno({ form, setForm }: Props) {
  const update = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));
  const toggleBool = (field: string) => setForm((f: any) => ({ ...f, [field]: !f[field] }));
  const toggleInfra = (val: string) => {
    setForm((f: any) => {
      const current: string[] = f.infrastructure || [];
      return { ...f, infrastructure: current.includes(val) ? current.filter((v: string) => v !== val) : [...current, val] };
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Tipo de Terreno</label>
          <select value={form.property_subtype || ""} onChange={(e) => update("property_subtype", e.target.value)} className={selectClass}>
            <option value="">Selecione</option>
            <option value="urbano">Urbano</option>
            <option value="rural">Rural</option>
            <option value="condominio">Condomínio</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Topografia</label>
          <select value={form.topography || ""} onChange={(e) => update("topography", e.target.value)} className={selectClass}>
            <option value="">Selecione</option>
            <option value="plano">Plano</option>
            <option value="aclive">Aclive</option>
            <option value="declive">Declive</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div><label className={labelClass}>Área Total (m²)</label><input type="number" value={form.area || ""} onChange={(e) => update("area", e.target.value)} className={inputClass} placeholder="0" /></div>
        <div><label className={labelClass}>Frente (m)</label><input type="number" value={form.lot_front || ""} onChange={(e) => update("lot_front", e.target.value)} className={inputClass} placeholder="0" /></div>
        <div><label className={labelClass}>Fundo (m)</label><input type="number" value={form.lot_depth || ""} onChange={(e) => update("lot_depth", e.target.value)} className={inputClass} placeholder="0" /></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Documentação</label>
          <select value={form.documentation || ""} onChange={(e) => update("documentation", e.target.value)} className={selectClass}>
            <option value="">Selecione</option>
            <option value="regular">Regular</option>
            <option value="irregular">Irregular</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => toggleBool("accepts_financing")}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
            form.accepts_financing ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground hover:border-primary/30"
          }`}>
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${form.accepts_financing ? "border-primary bg-primary" : "border-muted-foreground"}`}>
            {form.accepts_financing && <span className="text-primary-foreground text-[9px]">✓</span>}
          </div>
          Aceita Financiamento
        </button>
      </div>

      <div>
        <label className={labelClass}>Infraestrutura</label>
        <div className="flex flex-wrap gap-2">
          {INFRA_OPTIONS.map((opt) => {
            const selected = (form.infrastructure || []).includes(opt.value);
            return (
              <button key={opt.value} type="button" onClick={() => toggleInfra(opt.value)}
                className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                  selected ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground hover:border-primary/30"
                }`}>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
