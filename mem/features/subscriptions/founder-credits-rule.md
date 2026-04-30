---
name: Founder Credits Rule
description: Founder plans always receive 50% of the AI credits of their reference top-tier
type: feature
---
Founder plans must always grant **50% of the monthly AI credits** of their equivalent top-tier:

- `fundador_corretor` (mirrors **Prime** = 1500/mo) → **750 credits/month**
- `fundador_empresa` (mirrors **Imob Elite** = 6000/mo) → **3000 credits/month**
- `fundador_construtora` (mirrors **Construtora Master** = 10000/mo) → **5000 credits/month**

All other limits (max_items, max_photos_per_listing, storage_mb) match the reference tier 1:1. Only AI credits are halved.

Defined in SQL function `public.get_ai_monthly_credits_for_tier(p_tier)` and reflected in `src/hooks/useSubscription.ts` benefits text.