# Project Memory

## Core
Brokers App — plataforma para criar seu próprio app de imóveis. Corretores, imobiliárias e construtoras.
Primary #00AEEF (hsl 197 100% 47%), accent rosa (hsl 340 65% 65%), navy (hsl 212 100% 21%).
Outfit headings, Plus Jakarta Sans body. Supabase backend via Lovable Cloud.
Layout padrão: Marketplace. Multi-corretor: cada um com loja individual.
Homepage mode controlado pelo admin (marketplace ou single).

## Memories
- [Marketplace Homepage](mem://features/marketplace-homepage) — Página inicial marketplace listando imóveis de todos corretores, controlada pelo admin
- [Homepage routing](mem://project/routing/landing-logic) — Lógica de redirecionamento baseada em platform_settings.homepage_mode
- [Multi-broker registration](mem://auth/registration/single-store-constraint) — Cadastro livre de múltiplos corretores
- [Marketplace Captação](mem://features/marketplace-captacao) — Sistema de captação com limites por plano e fluxo proprietário/corretor
- [Branding pivot](mem://project/branding-pivot) — Rebrand de Brokers Bio → Brokers App, foco em prospectar profissionais imobiliários
- [Auto Stories](mem://features/auto-stories) — Stories automáticos no marketplace para VIP+, 24h expiry, limites por tier
- [Push daily limits](mem://features/notifications/push-daily-limits) — Limite diário de envios push por plano (1 a 6/dia), validado no edge function send-push
