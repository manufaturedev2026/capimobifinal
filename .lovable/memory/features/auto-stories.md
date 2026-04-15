---
name: Auto Stories (Históricos Automáticos)
description: VIP+ sellers get automatic stories on marketplace home when new properties are listed, 24h expiry, tier-based limits
type: feature
---
Quando um vendedor VIP+ publica um novo imóvel, uma story automática é criada via trigger DB (`trg_auto_story_on_new_item`).

**Limites por plano:**
- VIP (premium): 2
- Premium (vip): 4
- Exclusive (essencial_empresa): 8
- Prime (premium_empresa): 10
- Black (prime_empresa/black): 20

**Diferenciação:**
- Coluna `is_auto` na tabela `seller_stories` distingue stories automáticas das manuais
- `GlobalStoriesBar` exibe apenas stories automáticas de todos os sellers no marketplace home
- `StoriesBar` continua exibindo stories manuais filtradas por seller na loja individual

**Comportamento:**
- A story usa a primeira foto do imóvel, título e preço
- Botão "Ver Imóvel" aponta para `/imovel/{slug}`
- Expiração de 24h
- Não cria se o vendedor já atingiu o limite ativo
