---
name: Gamer layout
description: O layout 'Gamer' é um scroll horizontal fullscreen imersivo que substitui o antigo 'Showcase'. Cada seção ocupa 100vw x 100vh com snap scroll.
type: feature
---
O layout 'Gamer' é o layout padrão e fallback do sistema, substituindo o antigo 'Showcase'.

## Estrutura
- **Slide 1 (Perfil)**: Foto grande do corretor, nome, CRECI, bio, botão WhatsApp, fundo escuro (#0a0a0a) com grid lines e ambient glow na cor primária.
- **Slides intermediários (Imóveis)**: Cada imóvel ocupa uma tela inteira com imagem de fundo fullscreen, overlay escuro gradiente, título, preço, localização, stats (quartos/banheiros/vagas/área), botões "Ver Detalhes" e "WhatsApp".
- **Último slide (Contato)**: Botões "Agendar Visita" (WhatsApp), "Ligar Agora" e email.

## Navegação
- Scroll horizontal com CSS `snap-x snap-mandatory`
- Nav dots fixos no lado direito da tela
- Setas de navegação em cada slide de imóvel
- Suporte a teclado (ArrowRight/ArrowLeft)

## Mobile
- Tela de aviso "Vire o celular" quando em modo retrato (orientation: portrait + max-width: 1024px)
- Só exibe o layout em modo paisagem

## Integração com CompanyProfile
- Quando `isGamer` é true: container usa `h-screen overflow-hidden` sem padding/overflow-clip
- Esconde: mobile profile hero, showcase hero section, stats bar, desktop sidebar, desktop hero
- O layout é totalmente self-contained (não usa elementos externos do CompanyProfile)

## Planos
- Disponível em todos os planos (basico, start, vip, premium, empresa)
- É o fallback padrão quando nenhum layout está definido
