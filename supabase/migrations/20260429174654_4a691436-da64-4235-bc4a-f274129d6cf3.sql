UPDATE public.funnel_steps
SET content_html = REPLACE(
  REPLACE(content_html,
    'sua nova vitrine digital pra vender e captar mais imóveis no Espírito Santo.',
    'sua nova vitrine digital pra vender e captar mais imóveis em todo o Brasil.'
  ),
  'A plataforma imobiliária do Espírito Santo',
  'A plataforma imobiliária do Brasil'
),
updated_at = now()
WHERE day_offset = 0;

UPDATE public.funnel_steps
SET content_html = REPLACE(content_html, '© Capimobi · Espírito Santo', '© Capimobi · Brasil'),
    updated_at = now()
WHERE content_html LIKE '%© Capimobi · Espírito Santo%';