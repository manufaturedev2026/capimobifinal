---
name: Plan Accumulation
description: Multiple active subscriptions stack — limits sum, each purchase keeps own validity
type: feature
---
Users can have multiple active rows in `seller_subscriptions` simultaneously. Each purchase creates a new row instead of replacing the previous one.

Rules:
- SUM: max_items, ai_credits_per_month, storage_mb, monthly_visits_limit, max_team_members
- MAX (not sum): max_photos_per_listing — wins the highest tier's value
- Effective tier (gates for layouts/features): highest tier_rank() across active subs
- Validity: each subscription keeps its own expires_at; expired ones auto-deactivate via deactivate_expired_subscriptions()
- Any tier can stack with any other tier (no segment restriction)

Backend:
- DB function `get_effective_plan_limits(user_id)` returns subscriptions[], aggregate{}, effective_tier
- `get_user_plan_usage` rewritten to use aggregate
- Edge functions (confirm-checkout, appmax-confirm, appmax-webhook) NO LONGER deactivate previous active subs on new purchase — only deactivate expired ones

Frontend:
- Hook `useActiveSubscriptions(userId)` exposes count, subscriptions, aggregate, effective_tier
- Component `ActivePlansPanel` shown at top of /pacotes when user has ≥1 active sub: lists each plan with days remaining + total accumulated grid
