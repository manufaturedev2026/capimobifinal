interface Props {
  form: Record<string, any>;
  setForm: (fn: (f: any) => any) => void;
}

const inputClass = "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none";
const selectClass = inputClass;
const labelClass = "text-xs text-muted-foreground mb-1 block";

const LEISURE_OPTIONS = [
  { value: "piscina", label: "Piscina" },
  { value: "academia", label: "Academia" },
  { value: "salao_festas", label: "Salão de Festas" },
  { value: "playground", label: "Playground" },
  { value: "churrasqueira", label: "Churrasqueira" },
  { value: "sauna", label: "Sauna" },
  { value: "quadra", label: "Quadra Esportiva" },
];

export default function PropertyFieldsApartamento({ form, setForm }: Props) {
  const update = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));
  const toggleBool = (field: string) => setForm((f: any) => ({ ...f, [field]: !f[field] }));
  const toggleLeisure = (val: string) => {
    setForm((f: any) => {
      const current: string[] = f.leisure_amenities || [];
      return { ...f, leisure_amenities: current.includes(val) ? current.filter((v: string) => v !== val) : [...current, val] };
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Subtipo</label>
          <select value={form.property_subtype || ""} onChange={(e) => update("property_subtype", e.target.value)} className={selectClass}>
            <option value="">Selecione</option>
            <option value="apartamento">Apartamento</option>
            <option value="cobertura">Cobertura</option>
            <option value="kitnet">Kitnet</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Andar</label>
          <input type="number" value={form.floor_number || ""} onChange={(e) => update("floor_number", e.target.value)} className={inputClass} placeholder="Ex: 5" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><label className={labelClass}>Quartos</label><input type="number" value={form.bedrooms || ""} onChange={(e) => update("bedrooms", e.target.value)} className={inputClass} placeholder="0" /></div>
        <div><label className={labelClass}>Suítes</label><input type="number" value={form.suites || ""} onChange={(e) => update("suites", e.target.value)} className={inputClass} placeholder="0" /></div>
        <div><label className={labelClass}>Banheiros</label><input type="number" value={form.bathrooms || ""} onChange={(e) => update("bathrooms", e.target.value)} className={inputClass} placeholder="0" /></div>
        <div><label className={labelClass}>Vagas</label><input type="number" value={form.parking_spots || ""} onChange={(e) => update("parking_spots", e.target.value)} className={inputClass} placeholder="0" /></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div><label className={labelClass}>Área (m²)</label><input type="number" value={form.area || ""} onChange={(e) => update("area", e.target.value)} className={inputClass} placeholder="0" /></div>
        <div><label className={labelClass}>Condomínio (R$)</label><input type="number" step="0.01" value={form.condo_fee || ""} onChange={(e) => update("condo_fee", e.target.value)} className={inputClass} placeholder="0,00" /></div>
        <div><label className={labelClass}>IPTU (R$/ano)</label><input type="number" step="0.01" value={form.iptu || ""} onChange={(e) => update("iptu", e.target.value)} className={inputClass} placeholder="0,00" /></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { key: "has_elevator", label: "Elevador" },
          { key: "doorman_24h", label: "Portaria 24h" },
          { key: "balcony", label: "Varanda/Sacada" },
          { key: "furnished", label: "Mobiliado" },
          { key: "accepts_financing", label: "Aceita Financiamento" },
        ].map((item) => (
          <button key={item.key} type="button" onClick={() => toggleBool(item.key)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
              form[item.key] ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground hover:border-primary/30"
            }`}>
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${form[item.key] ? "border-primary bg-primary" : "border-muted-foreground"}`}>
              {form[item.key] && <span className="text-primary-foreground text-[9px]">✓</span>}
            </div>
            {item.label}
          </button>
        ))}
      </div>

      <div>
        <label className={labelClass}>Área de Lazer</label>
        <div className="flex flex-wrap gap-2">
          {LEISURE_OPTIONS.map((opt) => {
            const selected = (form.leisure_amenities || []).includes(opt.value);
            return (
              <button key={opt.value} type="button" onClick={() => toggleLeisure(opt.value)}
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
