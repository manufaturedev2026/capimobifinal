UPDATE public.platform_settings
SET value = jsonb_set(value::jsonb, '{ctaUrl}', '"/anunciar"'::jsonb)::text,
    updated_at = now()
WHERE key = 'invite_chat_config'
  AND (value::jsonb->>'ctaUrl') = '/login';