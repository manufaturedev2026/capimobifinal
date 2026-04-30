---
name: Plan Limit Warning Popup
description: Epic popup shown when user reaches 80% of any plan limit, with hero banner and CTA to /planos
type: feature
---
Popup épico em `src/components/PlanLimitWarningPopup.tsx`, renderizado no `SellerDashboard`.

**Quando aparece:**
- Quando qualquer métrica do plano passa de **80%** (configurável via prop `threshold`)
- Métricas monitoradas: anúncios ativos (`max_items`), visitas mensais (`monthly_visits_limit`), armazenamento (`storage_mb`), créditos de IA (`ai_credits_per_month`)
- Mostra a métrica mais crítica (maior %)
- Não aparece para limites ilimitados (>= 9999)
- Mostra **1x por dia por métrica** via `localStorage` (key: `plan_limit_popup:{userId}:{metricKey}:{YYYY-MM-DD}`)

**Modo de teste (mantido em produção):**
- Acessar `/painel?previewLimitPopup=1` força o popup com dados fake (Gabriel, 8/10 anúncios, plano Prime)
- Bypassa login e localStorage

**Visual:**
- Hero AI image: `src/assets/plan-limit-hero.jpg` (skyline ao pôr do sol)
- Badge "🔥 X% usado" gradient amber→orange
- Título com gradient amber→orange→rose no nome do usuário
- Barra de progresso animada
- CTA principal "Fazer Upgrade Agora" → `/planos`
- CTA secundário "Lembrar depois"
- Framer Motion para animações spring

