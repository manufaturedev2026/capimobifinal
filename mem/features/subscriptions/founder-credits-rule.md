---
name: Founder Credits Rule
description: Founder plans grant 240 IA credits/month (50% of top-tier). All plan credits aligned to R$ 0,25/credit (same as topup).
type: feature
---
All plan IA credits are aligned to **R$ 0,25 per credit** (same rate as `BuyCreditsModal` topups), preventing loss vs the avulso purchase:
- basico/imob_basico/const_basico: 25 (welcome bonus)
- start/imob_start/const_start: 120 (R$ 29,90)
- premium/imob_pro/const_pro: 240 (R$ 59,90)
- prime/imob_elite/const_master: 480 (R$ 119,90)
- fundador_*: 240 (R$ 97 → 50% of top-tier 480)
- essencial_empresa: 1600 / premium_empresa: 1200 / prime_empresa: 2000

Defined in DB function `get_ai_monthly_credits_for_tier(text)` and mirrored in `subscription_plans.ai_credits_per_month`. Cost basis: ~R$ 0,10/crédito (Gemini Flash + GPT-5-mini mix), giving ~60% margin.