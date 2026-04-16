---
name: Push Daily Limits by Plan
description: Daily push send limits per subscription tier enforced in send-push edge function and surfaced in NotificationsTab
type: feature
---
Push notifications são limitadas por **campanhas enviadas por dia**, baseado no plano do vendedor.

**Limites diários (campanhas/dia):**
- basico: 1
- start: 1
- premium (VIP): 2
- vip (Premium): 3
- essencial_empresa (Exclusive): 4
- premium_empresa (Prime): 5
- prime_empresa / black (Black): 6

**Implementação:**
- Validado no edge function `send-push/index.ts` consultando `push_notifications_log` desde 00:00 do dia.
- Retorna 429 com `{ error: "daily_limit_reached", message, limit, sent_today, tier }`.
- Admins (has_role admin) são isentos.
- `send-push-admin` (broadcast geral) não tem limite.
- `NotificationsTab` exibe card "Envios hoje X/Y" e desabilita botão quando atingido.
- Constante `PUSH_DAILY_LIMITS` duplicada em `NotificationsTab.tsx` para indicador no client.
