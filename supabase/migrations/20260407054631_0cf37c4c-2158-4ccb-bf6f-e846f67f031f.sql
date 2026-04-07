
DO $$
DECLARE
  brokers TEXT[][] := ARRAY[
    ARRAY['Imobiliária Colatina Sul', 'colatina-sul', 'colatinasul@test.com', 'vip', 'imobiliaria', 'netflix', 'luxury', 'Especialista em imóveis de alto padrão em Colatina.'],
    ARRAY['Ricardo Imóveis', 'ricardo-imoveis', 'ricardo@test.com', 'premium', 'corretor', 'marketplace', 'default', 'Corretor com 10 anos de experiência no norte do ES.'],
    ARRAY['Casa Verde Imóveis', 'casa-verde', 'casaverde@test.com', 'start', 'imobiliaria', 'minimal', 'emerald', 'Imobiliária focada em sustentabilidade e qualidade.'],
    ARRAY['Fernanda Corretor', 'fernanda-col', 'fernanda@test.com', 'essencial_empresa', 'corretor', 'elegant', 'rose', 'Atendimento personalizado para você e sua família.'],
    ARRAY['Prime Colatina Imóveis', 'prime-colatina', 'primecolatina@test.com', 'premium_empresa', 'imobiliaria', 'magazine', 'ocean', 'A maior imobiliária de Colatina e região.']
  ];
  photo_sets TEXT[][] := ARRAY[
    ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200'],
    ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200','https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200'],
    ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200'],
    ARRAY['https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200','https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200'],
    ARRAY['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200']
  ];
  logos TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1582407947092-035f8e4e9613?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop'
  ];
  b TEXT[];
  new_user_id UUID;
  new_profile_id UUID;
  broker_idx INT := 1;
  i INT;
  titles TEXT[] := ARRAY['Casa ampla 3 quartos','Apartamento 2 suítes','Terreno bairro nobre','Cobertura vista rio','Sala comercial centro'];
  cats item_category[] := ARRAY['casa','apartamento','terreno','apartamento','comercial']::item_category[];
  prices NUMERIC[] := ARRAY[380000, 520000, 150000, 890000, 280000];
  nbhoods TEXT[] := ARRAY['Centro','Maria das Graças','Martinelli','São Silvano','Lacê'];
  cur_photos TEXT[];
BEGIN
  FOREACH b SLICE 1 IN ARRAY brokers LOOP
    new_user_id := gen_random_uuid();
    cur_photos := ARRAY[photo_sets[broker_idx][1], photo_sets[broker_idx][2]];

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token)
    VALUES (new_user_id, '00000000-0000-0000-0000-000000000000', b[3], crypt('TestPass123!', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', b[1]), now(), now(), '');

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id::text, 'email', b[3]), 'email', new_user_id::text, now(), now(), now());

    INSERT INTO profiles (user_id, full_name, email, slug, seller_category, city, state, seller_type, company_name, bio, phone, logo_url, store_layout, store_theme)
    VALUES (new_user_id, b[1], b[3], b[2], b[5]::seller_category, 'Colatina', 'ES', 'imoveis', b[1], b[8], '(27) 99999-' || lpad((random()*9999)::int::text, 4, '0'), logos[broker_idx], b[6], b[7])
    RETURNING id INTO new_profile_id;

    UPDATE seller_subscriptions SET is_active = false WHERE user_id = new_user_id;

    INSERT INTO seller_subscriptions (user_id, seller_id, tier, max_items, is_active, expires_at, payment_method, payment_status)
    VALUES (new_user_id, new_profile_id, b[4]::package_tier, CASE b[4] WHEN 'start' THEN 25 WHEN 'premium' THEN 60 WHEN 'vip' THEN 115 ELSE 9999 END, true, now() + interval '365 days', 'teste', 'ativo');

    FOR i IN 1..5 LOOP
      INSERT INTO seller_items (user_id, seller_id, title, category, seller_type, price, city, state, status, bedrooms, bathrooms, area, description, neighborhood, photos)
      VALUES (
        new_user_id, new_profile_id,
        titles[i] || ' - Colatina',
        cats[i], 'imoveis',
        prices[i] + (random() * 80000)::int,
        'Colatina', 'ES', 'ativo',
        (2 + (random()*3)::int), (1 + (random()*2)::int), (60 + (random()*250)::int),
        'Imóvel excelente em Colatina, bairro ' || nbhoods[i] || '. Oportunidade única!',
        nbhoods[i],
        cur_photos
      );
    END LOOP;

    broker_idx := broker_idx + 1;
  END LOOP;
END;
$$;
