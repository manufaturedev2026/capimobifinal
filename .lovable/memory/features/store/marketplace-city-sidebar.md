---
name: marketplace-city-sidebar
description: Sidebar lateral de cidades agrupadas por estado nas páginas com layout Marketplace
type: feature
---
# Sidebar de Localização (Marketplace)

Aparece em duas telas com a mesma UX:
- `src/pages/MarketplaceHome.tsx` — homepage `/`
- `src/components/store-layouts/StoreLayoutMarketplace.tsx` — loja individual no template Marketplace

## Comportamento
- Visível somente em desktop (`hidden lg:block`), 220px de largura, sticky.
- Botão "Todas" limpa o filtro de cidade.
- Cidades agrupadas por UF (`state` do imóvel). Estado expande/colapsa um por vez (`Set` com 1 item).
- Auto-expande o UF da cidade ativa.
- Setar cidade reseta `heroIdx` para 0 e `page` para 1 (na home).

## Dados
`citiesByState` é derivado de `filteredProducts` (ou `realItems` na home), agrupando `item.city` por `item.state`.

## Mobile
Mobile usa o seletor de cidade dentro do hero (botão com dropdown) — não a sidebar.