---
name: initial-setup
description: Configurações obrigatórias para um Remix funcionar igual ao projeto original
type: feature
---
# Setup pós-Remix (executar imediatamente)

Para um Remix ficar 100% igual ao original, executar estas configurações no banco logo após criar o projeto:

## 1. Definir homepage como Marketplace
```sql
INSERT INTO platform_settings (key, value)
VALUES ('homepage_mode', 'marketplace')
ON CONFLICT (key) DO UPDATE SET value = 'marketplace';
```
Sem isso, `/` redireciona para a primeira loja encontrada (modo `single`).

## 2. Branding Capimobi
- Logo: 'Cap' (primary) + 'i' (white) + 'mobi' (accent rosa)
- Fonte logo: Orbitron 800 uppercase
- Headings: Outfit. Body: Plus Jakarta Sans.

## 3. Layout padrão de loja
- Default: Showcase (acessível ao plano Básico)
- Layouts complexos (Marketplace, Netflix, Magazine, Elegant, Gallery) ficam restritos a planos pagos.

## 4. Roles permitidos
Apenas: Corretor(a), Imobiliária, Construtora. Proprietário foi REMOVIDO.

## 5. Hero banners
- SEM efeito parallax (já removido em MarketplaceHome e StoreLayoutMarketplace).
- Marketplace usa edge-to-edge (`px-0` no container).

## 6. Sidebar de Localização
Tanto `/` (MarketplaceHome) quanto a loja com layout Marketplace exibem sidebar lateral com cidades agrupadas por estado (visível apenas em lg+).