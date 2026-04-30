# Capimobi — Plataforma Imobiliária

Plataforma white-label para corretores e imobiliárias com CRM, captação de leads, lojas personalizadas, stories, push notifications e mais.

## 🚀 Checklist pós-remix

Quando você faz **remix** desse projeto, o código + estrutura do banco são copiados, mas **dados e credenciais externas** começam zerados. Siga esse checklist:

### ✅ Já vem pronto automaticamente
- Backend Lovable Cloud (Supabase) com todas as tabelas e RLS
- Lovable AI (LOVABLE_API_KEY) — para chat de IA, geração de copy, etc.
- Seeds básicos: 6 etapas do funil CRM, configurações padrão da plataforma
- Buckets de storage (`seller-uploads`, `seller-photos`, `seller-assets`)

### ⚙️ Precisa configurar manualmente

#### 1. SMTP (envio de e-mails) — **obrigatório**
- Vá no painel admin → aba **SMTP**
- Configure host/porta/usuário/senha do seu provedor (Hostinger, Gmail, SendGrid, etc.)
- A `SMTP_ENCRYPTION_KEY` tem fallback automático, mas para **produção** adicione um secret próprio:
  ```bash
  openssl rand -base64 32
  ```

#### 2. Push Notifications (Web Push) — **opcional**
Sem isso, push fica desativado mas o app continua funcionando.

```bash
npx web-push generate-vapid-keys
```

Adicione 3 secrets no Lovable Cloud:
- `VAPID_PUBLIC_KEY` — chave pública gerada
- `VAPID_PRIVATE_KEY` — chave privada gerada
- `VAPID_SUBJECT` — `mailto:seu@email.com`

> 💡 Dica: você também pode editar `supabase/functions/get-vapid-key/index.ts` e colocar a `VAPID_PUBLIC_KEY` direto no `FALLBACK_VAPID_PUBLIC_KEY` (ela é segura para hardcode).

#### 3. Stripe (pagamentos) — **opcional**
Só precisa se for vender planos.
- `STRIPE_SECRET_KEY` (secret)
- Configure webhook apontando para `/functions/v1/stripe-webhook`

#### 4. Apify (captação de leads automática) — **opcional**
- `APIFY_TOKEN` (secret)

#### 5. Domínio customizado
Use `capimobi.com.br` como domínio principal. Para domínios alternativos, configure URL Forwarding 301 no seu registrador apontando para `https://capimobi.com.br`.

---

## 🏗️ Stack
- React 18 + Vite + TypeScript + Tailwind
- Supabase (DB + Auth + Storage + Edge Functions)
- Lovable AI Gateway
- Framer Motion, shadcn/ui

## 🔧 Desenvolvimento local
```bash
npm install
npm run dev
```
