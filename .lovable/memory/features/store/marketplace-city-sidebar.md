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
`citiesByState` é derivado de **`products`** (todos os imóveis do vendedor), NÃO de `filteredProducts`. Isso mantém a lista de UFs/cidades estável quando o usuário filtra. Na home, deriva de `realItems`.

Agrupa `item.city` por `item.state`. Para isso funcionar, o componente pai precisa passar `state` no mapeamento dos items:
- `src/pages/CompanyProfile.tsx` mapeia `dbDisplayItems` incluindo `state: item.state` (além de `city`, `neighborhood`).

## Auto-expand
- Se só houver 1 estado disponível (caso comum de loja individual), o `useEffect` expande automaticamente esse UF para mostrar a lista de cidades sem clique.
- Também auto-expande o UF correspondente à `cityFilter` ativa.

## Mobile
Mobile usa o seletor de cidade dentro do hero (botão com dropdown) — não a sidebar.