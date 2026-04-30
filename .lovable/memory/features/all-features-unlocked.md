---
name: All Features Unlocked Across Plans
description: All features are unlocked for every plan (including Básico/Grátis). Plan tiers ONLY differ by numeric limits (max_items, max_photos, storage_mb, monthly_visits_limit, ai_credits_per_month).
type: feature
---
**Princípio:** Diferença entre planos = SOMENTE limites numéricos. Recursos qualitativos liberados em qualquer tier.

**Liberados para todos os planos:**
- Layouts de loja: `isLayoutAllowed()` em `src/components/store-layouts/types.ts` retorna sempre `true`
- Temas de loja: `isThemeAllowed()` em `src/components/StoreThemePicker.tsx` retorna sempre `true`
- Aba "Domínio" no SellerDashboard (`lockedTabs` vazio)
- Tags de "valor" no formulário de imóvel (`isLocked = false` em SellerItemForm)
- Captação Online completa: `hasLandingPage`, `hasBot`, `hasBotAI` sempre true em `CaptacaoOnlineTab`
- Botão Instagram na storefront (gate `["start","prime",...].includes(sellerTier)` removido em CompanyProfile)

**Continuam por tier (limites numéricos):**
- max_items, max_photos_per_listing, storage_mb, monthly_visits_limit, ai_credits_per_month
- PUSH_DAILY_LIMITS (envios diários de push)
- maxTeamMembers (corretores vinculados em planos empresa)
