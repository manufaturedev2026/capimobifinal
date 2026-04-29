import { useState, useMemo } from "react";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { formatPrice } from "@/data/products";
import logoCaixa from "@/assets/banks/caixa.png";
import logoBradesco from "@/assets/banks/bradesco.png";
import logoItau from "@/assets/banks/itau.png";
import logoBB from "@/assets/banks/bb.png";
import logoSantander from "@/assets/banks/santander.png";

interface Program {
  name: string;
  rateMin: number;
  rateMax: number;
  maxTermYears: number;
  maxFinancingPct: number;
  maxPropertyValue?: number;
}

interface Bank {
  name: string;
  logo: string;
  programs: Program[];
}

const BANKS: Bank[] = [
  {
    name: "Caixa Econômica",
    logo: logoCaixa,
    programs: [
      { name: "SBPE (Taxa Referencial)", rateMin: 8.99, rateMax: 9.99, maxTermYears: 35, maxFinancingPct: 80 },
      { name: "Poupança CAIXA", rateMin: 8.49, rateMax: 9.49, maxTermYears: 35, maxFinancingPct: 80 },
      { name: "Minha Casa Minha Vida - Faixa 1", rateMin: 4.0, rateMax: 4.75, maxTermYears: 35, maxFinancingPct: 95, maxPropertyValue: 190000 },
      { name: "Minha Casa Minha Vida - Faixa 2", rateMin: 4.75, rateMax: 7.66, maxTermYears: 35, maxFinancingPct: 90, maxPropertyValue: 264000 },
      { name: "Minha Casa Minha Vida - Faixa 3", rateMin: 7.66, rateMax: 8.16, maxTermYears: 35, maxFinancingPct: 80, maxPropertyValue: 350000 },
    ],
  },
  {
    name: "Bradesco",
    logo: logoBradesco,
    programs: [
      { name: "Financiamento Imobiliário", rateMin: 9.50, rateMax: 10.99, maxTermYears: 30, maxFinancingPct: 80 },
      { name: "Poupança Bradesco", rateMin: 9.16, rateMax: 10.16, maxTermYears: 30, maxFinancingPct: 80 },
    ],
  },
  {
    name: "Itaú",
    logo: logoItau,
    programs: [
      { name: "Crédito Imobiliário", rateMin: 9.50, rateMax: 10.99, maxTermYears: 30, maxFinancingPct: 80 },
      { name: "Poupança Itaú", rateMin: 9.16, rateMax: 10.49, maxTermYears: 30, maxFinancingPct: 80 },
    ],
  },
  {
    name: "Banco do Brasil",
    logo: logoBB,
    programs: [
      { name: "BB Crédito Imobiliário", rateMin: 9.39, rateMax: 10.99, maxTermYears: 35, maxFinancingPct: 80 },
    ],
  },
  {
    name: "Santander",
    logo: logoSantander,
    programs: [
      { name: "Crédito Imobiliário", rateMin: 9.49, rateMax: 10.99, maxTermYears: 35, maxFinancingPct: 80 },
      { name: "Pré-fixado Santander", rateMin: 10.99, rateMax: 11.99, maxTermYears: 20, maxFinancingPct: 80 },
    ],
  },
];

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
}

interface Props {
  propertyPrice: number;
}

export default function FinancingSimulator({ propertyPrice }: Props) {
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [termYears, setTermYears] = useState(30);
  const [expanded, setExpanded] = useState(false);

  const downPayment = (propertyPrice * downPaymentPct) / 100;
  const financedAmount = propertyPrice - downPayment;

  const simulations = useMemo(() => {
    const results: {
      bank: string;
      logo: string;
      program: string;
      rateMin: number;
      rateMax: number;
      monthlyMin: number;
      monthlyMax: number;
      termMonths: number;
      eligible: boolean;
      reason?: string;
    }[] = [];

    BANKS.forEach((bank) => {
      bank.programs.forEach((prog) => {
        const effectiveTerm = Math.min(termYears, prog.maxTermYears);
        const termMonths = effectiveTerm * 12;
        const maxFinanced = (propertyPrice * prog.maxFinancingPct) / 100;
        const eligible = financedAmount <= maxFinanced && (!prog.maxPropertyValue || propertyPrice <= prog.maxPropertyValue);
        const reason = !eligible
          ? financedAmount > maxFinanced
            ? `Entrada mínima: ${100 - prog.maxFinancingPct}%`
            : `Valor máximo: ${formatPrice(prog.maxPropertyValue || 0)}`
          : undefined;

        const monthlyMin = calcMonthlyPayment(financedAmount, prog.rateMin, termMonths);
        const monthlyMax = calcMonthlyPayment(financedAmount, prog.rateMax, termMonths);

        results.push({
          bank: bank.name,
          logo: bank.logo,
          program: prog.name,
          rateMin: prog.rateMin,
          rateMax: prog.rateMax,
          monthlyMin,
          monthlyMax,
          termMonths,
          eligible,
          reason,
        });
      });
    });

    return results.sort((a, b) => {
      if (a.eligible && !b.eligible) return -1;
      if (!a.eligible && b.eligible) return 1;
      return a.monthlyMin - b.monthlyMin;
    });
  }, [financedAmount, termYears, propertyPrice, downPaymentPct]);

  const visibleSimulations = expanded ? simulations : simulations.slice(0, 4);
  const bestRate = simulations.find((s) => s.eligible);

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
        <Calculator size={18} className="text-primary" />
        Simular Financiamento
      </h2>

      <div className="bg-card border border-border rounded-2xl p-4 md:p-6 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-secondary rounded-xl p-3">
            <p className="text-[11px] text-muted-foreground">Valor do Imóvel</p>
            <p className="font-display font-bold text-sm text-foreground">{formatPrice(propertyPrice)}</p>
          </div>
          <div className="bg-secondary rounded-xl p-3">
            <p className="text-[11px] text-muted-foreground">Entrada ({downPaymentPct}%)</p>
            <p className="font-display font-bold text-sm text-primary">{formatPrice(downPayment)}</p>
          </div>
          <div className="bg-secondary rounded-xl p-3">
            <p className="text-[11px] text-muted-foreground">Financiado</p>
            <p className="font-display font-bold text-sm text-foreground">{formatPrice(financedAmount)}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Entrada: {downPaymentPct}%
            </label>
            <input
              type="range"
              min={5}
              max={90}
              step={5}
              value={downPaymentPct}
              onChange={(e) => setDownPaymentPct(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>5%</span>
              <span>90%</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Prazo: {termYears} anos ({termYears * 12} meses)
            </label>
            <input
              type="range"
              min={5}
              max={35}
              step={5}
              value={termYears}
              onChange={(e) => setTermYears(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>5 anos</span>
              <span>35 anos</span>
            </div>
          </div>
        </div>

        {/* Best option highlight */}
        {bestRate && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <img loading="lazy" decoding="async" src={bestRate.logo} alt={bestRate.bank} className="h-5 w-auto object-contain" />
              <p className="text-xs font-semibold text-primary">💡 Melhor opção encontrada</p>
            </div>
            <p className="font-display font-bold text-xl text-foreground">
              {formatPrice(bestRate.monthlyMin)}<span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {bestRate.bank} — {bestRate.program} ({bestRate.rateMin}% a.a.)
            </p>
          </div>
        )}

        {/* Bank comparison table */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Comparativo de Bancos</h3>
          <div className="space-y-2">
            {visibleSimulations.map((sim, i) => (
              <div
                key={`${sim.bank}-${sim.program}`}
                className={`rounded-xl border p-3 transition-all ${
                  sim.eligible
                    ? i === 0
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card"
                    : "border-border/50 bg-muted/30 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img loading="lazy" decoding="async" src={sim.logo} alt={sim.bank} className="h-6 w-auto object-contain flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{sim.bank}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{sim.program}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {sim.eligible ? (
                      <>
                        <p className="font-display font-bold text-sm text-foreground">
                          {formatPrice(sim.monthlyMin)}
                          {sim.monthlyMin !== sim.monthlyMax && (
                            <span className="text-xs font-normal text-muted-foreground"> ~ {formatPrice(sim.monthlyMax)}</span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {sim.rateMin}% ~ {sim.rateMax}% a.a. • {sim.termMonths} meses
                        </p>
                      </>
                    ) : (
                      <p className="text-[11px] text-destructive font-medium">{sim.reason}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {simulations.length > 4 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 text-sm text-primary font-medium py-2 hover:underline"
            >
              {expanded ? (
                <>Mostrar menos <ChevronUp size={14} /></>
              ) : (
                <>Ver todos os {simulations.length} programas <ChevronDown size={14} /></>
              )}
            </button>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          * Simulação meramente ilustrativa. Taxas de referência atualizadas em mar/2026. Valores reais podem variar conforme análise de crédito, relacionamento com o banco e condições de mercado.
        </p>
      </div>
    </div>
  );
}
