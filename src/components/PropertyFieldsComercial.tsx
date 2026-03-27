interface Props {
  form: Record<string, any>;
  setForm: (fn: (f: any) => any) => void;
  category: string;
}

const inputClass = "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none";
const selectClass = inputClass;
const labelClass = "text-xs text-muted-foreground mb-1 block";

export default function PropertyFieldsComercial({ form, setForm, category }: Props) {
  const update = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));
  const toggleBool = (field: string) => setForm((f: any) => ({ ...f, [field]: !f[field] }));

  const isGalpao = category === "galpao";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Subtipo</label>
          <select value={form.property_subtype || ""} onChange={(e) => update("property_subtype", e.target.value)} className={selectClass}>
            <option value="">Selecione</option>
            {isGalpao ? (
              <>
                <option value="galpao">Galpão</option>
                <option value="deposito">Depósito</option>
                <option value="barracao">Barracão</option>
              </>
            ) : (
              <>
                <option value="sala">Sala</option>
                <option value="loja">Loja</option>
                <option value="ponto_comercial">Ponto Comercial</option>
              </>
            )}
          </select>
        </div>
        {!isGalpao && (
          <div>
            <label className={labelClass}>Fluxo de Pessoas</label>
            <select value={form.foot_traffic || ""} onChange={(e) => update("foot_traffic", e.target.value)} className={selectClass}>
              <option value="">Selecione</option>
              <option value="alto">Alto</option>
              <option value="medio">Médio</option>
              <option value="baixo">Baixo</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div><label className={labelClass}>Área Total (m²)</label><input type="number" value={form.area || ""} onChange={(e) => update("area", e.target.value)} className={inputClass} placeholder="0" /></div>
        {isGalpao && <div><label className={labelClass}>Área Construída (m²)</label><input type="number" value={form.built_area || ""} onChange={(e) => update("built_area", e.target.value)} className={inputClass} placeholder="0" /></div>}
        {isGalpao && <div><label className={labelClass}>Pé Direito (m)</label><input type="number" step="0.1" value={form.ceiling_height || ""} onChange={(e) => update("ceiling_height", e.target.value)} className={inputClass} placeholder="0" /></div>}
        <div><label className={labelClass}>Banheiros</label><input type="number" value={form.bathrooms || ""} onChange={(e) => update("bathrooms", e.target.value)} className={inputClass} placeholder="0" /></div>
        <div><label className={labelClass}>Vagas</label><input type="number" value={form.parking_spots || ""} onChange={(e) => update("parking_spots", e.target.value)} className={inputClass} placeholder="0" /></div>
        {!isGalpao && <div><label className={labelClass}>Andar</label><input type="number" value={form.floor_number || ""} onChange={(e) => update("floor_number", e.target.value)} className={inputClass} placeholder="0" /></div>}
      </div>

      {isGalpao && (
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>Zoneamento</label><input value={form.zoning || ""} onChange={(e) => update("zoning", e.target.value)} className={inputClass} placeholder="Ex: Industrial" /></div>
          <div><label className={labelClass}>Segurança</label><input value={form.security || ""} onChange={(e) => update("security", e.target.value)} className={inputClass} placeholder="Ex: 24h Vigilância" /></div>
        </div>
      )}

      {!isGalpao && (
        <div>
          <label className={labelClass}>Ideal para</label>
          <input value={form.ideal_for || ""} onChange={(e) => update("ideal_for", e.target.value)} className={inputClass} placeholder="Ex: Clínica, Escritório, Loja de roupas..." />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          ...(isGalpao ? [
            { key: "has_dock", label: "Docas" },
            { key: "internal_office", label: "Escritório Interno" },
            { key: "three_phase_power", label: "Energia Trifásica" },
            { key: "truck_access", label: "Acesso Caminhão" },
          ] : [
            { key: "has_showcase", label: "Vitrine" },
            { key: "has_ac", label: "Ar-Condicionado" },
            { key: "has_elevator", label: "Elevador" },
          ]),
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
    </div>
  );
}
