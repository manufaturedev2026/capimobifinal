// Campos específicos para Apartamento — elevador, andar, vaga, vista
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, AlertTriangle, TrendingUp } from "lucide-react";

export type ApartmentState = {
  andarUnidade: string;
  totalAndaresPredio: string;
  possuiElevador: boolean;
  qtdElevadores: string;
  elevadorModerno: boolean;
  condominioGrande: boolean;
  escadasLargas: boolean;
  vagasGaragem: string;
  portaria24h: boolean;
  lazerCompleto: boolean;
  taxaCondominio: string;
  vistaLivre: boolean;
  solManha: boolean;
  solTarde: boolean;
  barulhoExterno: boolean;
  acessibilidade: boolean;
  publicoIdoso: boolean;
  ultimoAndar: boolean;
  garden: boolean;
};

export const APARTMENT_INITIAL: ApartmentState = {
  andarUnidade: "", totalAndaresPredio: "", possuiElevador: false, qtdElevadores: "1",
  elevadorModerno: false, condominioGrande: false, escadasLargas: false,
  vagasGaragem: "1", portaria24h: false, lazerCompleto: false, taxaCondominio: "",
  vistaLivre: false, solManha: false, solTarde: false, barulhoExterno: false,
  acessibilidade: true, publicoIdoso: false, ultimoAndar: false, garden: false,
};

interface Props {
  state: ApartmentState;
  onChange: <K extends keyof ApartmentState>(key: K, value: ApartmentState[K]) => void;
}

export default function ApartmentValuationFields({ state, onChange }: Props) {
  const andarNum = Number(state.andarUnidade) || 0;
  const totalAndares = Number(state.totalAndaresPredio) || 0;

  // Alertas inteligentes contextuais
  const semElevadorAndarAlto = !state.possuiElevador && andarNum >= 3;
  const altoComElevador = state.possuiElevador && andarNum >= 5;
  const ultimoSemElevador = state.ultimoAndar && !state.possuiElevador && andarNum >= 3;

  const Toggle = ({ label, val, onToggle, icon }: { label: string; val: boolean; onToggle: () => void; icon?: string }) => (
    <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
      val ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/50"
    }`}>
      <Checkbox checked={val} onCheckedChange={onToggle} />
      <span className="font-medium">{icon && <span className="mr-1">{icon}</span>}{label}</span>
    </label>
  );

  return (
    <div className="rounded-2xl border-2 border-dashed border-blue-500/30 bg-blue-500/[0.03] p-5 md:p-6 mt-2">
      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-4 uppercase tracking-wider">
        <Building2 className="h-4 w-4" /> Dados do Apartamento
      </div>

      {/* Andar e prédio */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div>
          <Label className="text-xs text-muted-foreground">Andar da unidade</Label>
          <Input type="number" value={state.andarUnidade} onChange={(e) => onChange("andarUnidade", e.target.value)} placeholder="Ex: 5" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Total andares prédio</Label>
          <Input type="number" value={state.totalAndaresPredio} onChange={(e) => onChange("totalAndaresPredio", e.target.value)} placeholder="Ex: 12" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Vagas garagem</Label>
          <Input type="number" value={state.vagasGaragem} onChange={(e) => onChange("vagasGaragem", e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Cond. mensal (R$)</Label>
          <Input type="number" value={state.taxaCondominio} onChange={(e) => onChange("taxaCondominio", e.target.value)} placeholder="Ex: 800" />
        </div>
      </div>

      {/* Alertas dinâmicos */}
      {semElevadorAndarAlto && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span className="text-amber-700 dark:text-amber-300">
            Acesso por escadas no {andarNum}º andar impacta liquidez e valor. Penalização aplicada conforme andar.
          </span>
        </div>
      )}
      {altoComElevador && state.vistaLivre && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-xs">
          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span className="text-emerald-700 dark:text-emerald-300">
            Andar alto ({andarNum}º) com vista livre tende a valorizar pela vista e menor ruído urbano.
          </span>
        </div>
      )}
      {ultimoSemElevador && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs">
          <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span className="text-rose-700 dark:text-rose-300">
            Último andar sem elevador penaliza fortemente. Compensa parcialmente se houver vista excelente ou cobertura.
          </span>
        </div>
      )}

      {/* Elevador */}
      <div className="mb-4">
        <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Elevador</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          <Toggle label="Possui elevador" val={state.possuiElevador} onToggle={() => onChange("possuiElevador", !state.possuiElevador)} icon="🛗" />
          <Toggle label="Elevador moderno" val={state.elevadorModerno} onToggle={() => onChange("elevadorModerno", !state.elevadorModerno)} />
          {state.possuiElevador && (
            <div>
              <Label className="text-xs text-muted-foreground">Quantos elevadores?</Label>
              <Input type="number" value={state.qtdElevadores} onChange={(e) => onChange("qtdElevadores", e.target.value)} placeholder="1" />
            </div>
          )}
        </div>
      </div>

      {/* Posição */}
      <div className="mb-4">
        <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Posição da unidade</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          <Toggle label="Último andar" val={state.ultimoAndar} onToggle={() => onChange("ultimoAndar", !state.ultimoAndar)} />
          <Toggle label="Garden / térreo c/ quintal" val={state.garden} onToggle={() => onChange("garden", !state.garden)} />
          <Toggle label="Vista livre" val={state.vistaLivre} onToggle={() => onChange("vistaLivre", !state.vistaLivre)} />
          <Toggle label="Sol da manhã" val={state.solManha} onToggle={() => onChange("solManha", !state.solManha)} />
          <Toggle label="Sol da tarde" val={state.solTarde} onToggle={() => onChange("solTarde", !state.solTarde)} />
          <Toggle label="Barulho externo (avenida)" val={state.barulhoExterno} onToggle={() => onChange("barulhoExterno", !state.barulhoExterno)} />
        </div>
      </div>

      {/* Condomínio */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Condomínio e segurança</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          <Toggle label="Portaria 24h" val={state.portaria24h} onToggle={() => onChange("portaria24h", !state.portaria24h)} />
          <Toggle label="Lazer completo" val={state.lazerCompleto} onToggle={() => onChange("lazerCompleto", !state.lazerCompleto)} />
          <Toggle label="Condomínio grande" val={state.condominioGrande} onToggle={() => onChange("condominioGrande", !state.condominioGrande)} />
          <Toggle label="Escadas largas" val={state.escadasLargas} onToggle={() => onChange("escadasLargas", !state.escadasLargas)} />
          <Toggle label="Boa acessibilidade" val={state.acessibilidade} onToggle={() => onChange("acessibilidade", !state.acessibilidade)} />
          <Toggle label="Público idoso/familiar" val={state.publicoIdoso} onToggle={() => onChange("publicoIdoso", !state.publicoIdoso)} />
        </div>
      </div>
    </div>
  );
}
