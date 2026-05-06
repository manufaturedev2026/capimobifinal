## Objetivo
Permitir que o usuário acumule planos (ex: 2x Imob Start) somando limites e créditos, com cada compra mantendo sua própria validade independente.

## Regras de negócio
- **Acumula (SOMA)**: `max_items`, `ai_credits_per_month`, `storage_mb`, `monthly_visits_limit`, `max_team_members`
- **Não acumula (usa MAIOR)**: `max_photos_per_listing` — vence o do maior plano
- **Tier efetivo (para layouts/temas/recursos booleanos)**: usa o MAIOR tier ativo entre todas as assinaturas vigentes
- **Validade independente**: cada assinatura mantém seu próprio `expires_at`. Quando uma vence, recalcula automaticamente os limites somados.
- **Combina qualquer plano** (mesmo tier ou tiers diferentes, qualquer segmento)
- **Compra repetida normal**: comprar de novo cria nova linha em `seller_subscriptions` em vez de substituir a anterior.

## Mudanças no banco
1. **`grant_plan_credits`**: já está OK (apenas adiciona ao balance). Manter.
2. **Nova função `get_effective_plan_limits(user_id)`** retorna JSON com:
   - `subscriptions[]` — lista de assinaturas vigentes (tier, name, expires_at, limites individuais)
   - `aggregate` — limites somados (max_items, ai_credits, storage_mb, monthly_visits, max_team_members) e max (max_photos_per_listing)
   - `effective_tier` — maior tier ativo (para gates de layout/recursos)
3. **Atualizar `get_user_plan_usage`** para usar a soma de todas as assinaturas ativas e não vencidas.
4. **Atualizar checkout (`confirm-checkout`/`create-checkout`)**: NÃO desativar assinaturas ativas anteriores ao comprar novo plano — apenas inserir nova linha. (Hoje provavelmente faz `UPDATE is_active=false` ao trocar de plano.)
5. **Atualizar `is_seller_visit_blocked`** para usar limite agregado.
6. **Atualizar `auto_create_story_on_new_item`** para usar tier efetivo (maior).
7. **Cron de expiração**: marcar `is_active=false` quando `expires_at < now()` em todas as assinaturas individualmente. (Manter cron existente / criar se não houver.)

## Mudanças no frontend (/pacotes)
1. **Novo painel "Planos vigentes"** no topo de `PackagesPage.tsx` quando o usuário tem ≥1 assinatura ativa:
   - Lista cada plano vigente: nome, dias restantes, limites individuais
   - Card de totais agregados: "Imóveis: 60 (30+30)", "Créditos IA: 1.500/mês", "Storage: X MB", etc.
   - Aviso claro: "Ao comprar mais um plano, os limites somam e cada compra mantém sua validade própria"
2. **Hook `useSubscription`**: refatorar para retornar lista de assinaturas + limites agregados + effective_tier.
3. **Componentes que checam tier**: usar `effective_tier` (maior) — manter compatibilidade.

## Arquivos a editar
- `supabase/migrations/*` — nova migration com função agregadora
- `supabase/functions/confirm-checkout/index.ts` e `appmax-confirm/index.ts` — não desativar planos ativos prévios
- `src/hooks/useSubscription.ts` — expor `subscriptions[]`, `aggregateLimits`, `effectiveTier`
- `src/pages/PackagesPage.tsx` — novo painel "Planos vigentes" + texto explicativo
- Locais que leem limites de plano (Dashboard, criação de imóveis): usar `aggregateLimits` em vez do plano individual

## Etapas de implementação
1. Migration: criar `get_effective_plan_limits` e atualizar `get_user_plan_usage`
2. Edge functions: remover desativação de assinaturas anteriores na compra
3. Hook `useSubscription`: trazer agregados
4. PackagesPage: painel "Planos vigentes" no topo
5. Atualizar gates de criação (max_items) e fotos (max_photos) para usar agregado
