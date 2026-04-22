interface Props {
  form: Record<string, any>;
  setForm: (fn: (f: any) => any) => void;
}

const inputClass = "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none";
const selectClass = inputClass;
const labelClass = "text-xs text-muted-foreground mb-1 block";

export default function PropertyFieldsCasa({ form, setForm }: Props) {
  const update = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));
  const toggleBool = (field: string) => setForm((f: any) => ({ ...f, [field]: !f[field] }));

  return (
    <div className="space-y-4">
      <div>
        <div>
          <label className={labelClass}>Subtipo</label>
          <select value={form.property_subtype || ""} onChange={(e) => update("property_subtype", e.target.value)} className={selectClass}>
            <option value="">Selecione</option>
            <option value="terrea">Térrea</option>
            <option value="sobrado">Sobrado</option>
            <option value="condominio">Condomínio</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><label className={labelClass}>Quartos</label><input type="number" value={form.bedrooms || ""} onChange={(e) => update("bedrooms", e.target.value)} className={inputClass} placeholder="0" /></div>
        <div><label className={labelClass}>Suítes</label><input type="number" value={form.suites || ""} onChange={(e) => update("suites", e.target.value)} className={inputClass} placeholder="0" /></div>
        <div><label className={labelClass}>Banheiros</label><input type="number" value={form.bathrooms || ""} onChange={(e) => update("bathrooms", e.target.value)} className={inputClass} placeholder="0" /></div>
        <div><label className={labelClass}>Vagas</label><input type="number" value={form.parking_spots || ""} onChange={(e) => update("parking_spots", e.target.value)} className={inputClass} placeholder="0" /></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div><label className={labelClass}>Área Total (m²)</label><input type="number" value={form.area || ""} onChange={(e) => update("area", e.target.value)} className={inputClass} placeholder="0" /></div>
        <div><label className={labelClass}>Área Construída (m²)</label><input type="number" value={form.built_area || ""} onChange={(e) => update("built_area", e.target.value)} className={inputClass} placeholder="0" /></div>
        <div><label className={labelClass}>Salas</label><input type="number" value={form.living_rooms || ""} onChange={(e) => update("living_rooms", e.target.value)} className={inputClass} placeholder="0" /></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Cozinha</label>
          <select value={form.kitchen_type || ""} onChange={(e) => update("kitchen_type", e.target.value)} className={selectClass}>
            <option value="">Selecione</option>
            <option value="americana">Americana</option>
            <option value="planejada">Planejada</option>
            <option value="simples">Simples</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Documentação</label>
          <select value={form.documentation || ""} onChange={(e) => update("documentation", e.target.value)} className={selectClass}>
            <option value="">Selecione</option>
            <option value="regular">Regular</option>
            <option value="irregular">Irregular</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div><label className={labelClass}>Condomínio (R$)</label><input type="number" step="0.01" value={form.condo_fee || ""} onChange={(e) => update("condo_fee", e.target.value)} className={inputClass} placeholder="0,00" /></div>
        <div><label className={labelClass}>IPTU (R$/ano)</label><input type="number" step="0.01" value={form.iptu || ""} onChange={(e) => update("iptu", e.target.value)} className={inputClass} placeholder="0,00" /></div>
      </div>

      {/* Boolean toggles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { key: "service_area", label: "Área de Serviço" },
          { key: "backyard", label: "Quintal" },
          { key: "pool", label: "Piscina" },
          { key: "barbecue", label: "Churrasqueira" },
          { key: "balcony", label: "Varanda" },
          { key: "garden", label: "Jardim" },
          { key: "furnished", label: "Mobiliado" },
          { key: "accepts_financing", label: "Aceita Financiamento" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => toggleBool(item.key)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
              form[item.key]
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background text-muted-foreground hover:border-primary/30"
            }`}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${form[item.key] ? "border-primary bg-primary" : "border-muted-foreground"}`}>
              {form[item.key] && <span className="text-primary-foreground text-[9px]">✓</span>}
            </div>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
