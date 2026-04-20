---
name: Professional Title (storefront)
description: Como o título profissional é exibido na loja do vendedor (campo professional_title + fallback por categoria)
type: feature
---
O título profissional exibido na loja (ex: "Corretor de Imóveis", "Corretora de Imóveis", "Imobiliária", "Construtora") vem do campo `profiles.professional_title` (texto livre, configurado em Personalização da Loja). Quando vazio, usa fallback automático por `seller_category` via helper `getSellerProfessionalTitle()` em `src/lib/sellerTitle.ts`.

Mapa de fallback: corretor→"Corretor de Imóveis", imobiliaria→"Imobiliária", construtora→"Construtora", proprietario→"Proprietário", loja_veiculos→"Loja de Veículos", autonomo→"Vendedor Autônomo", concessionaria→"Concessionária".

Atualmente usado no layout Marketplace (badge superior do hero). Ao adicionar uso em outros layouts, importar o helper.
