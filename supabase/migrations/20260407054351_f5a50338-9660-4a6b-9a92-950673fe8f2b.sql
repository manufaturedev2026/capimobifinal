
-- Create temporary test users in auth.users and profiles
DO $$
DECLARE
  brokers TEXT[][] := ARRAY[
    ARRAY['Ana Imóveis Premium', 'ana-imoveis', 'ana@test.com', 'premium', 'imobiliaria', 'Vila Velha'],
    ARRAY['Carlos VIP Corretor', 'carlos-vip', 'carlos@test.com', 'vip', 'corretor', 'Serra'],
    ARRAY['Maria Start Imóveis', 'maria-start', 'maria@test.com', 'start', 'imobiliaria', 'Vitória'],
    ARRAY['Pedro Exclusive', 'pedro-exclusive', 'pedro@test.com', 'essencial_empresa', 'corretor', 'Cariacica'],
    ARRAY['Luana Prime Imob', 'luana-prime', 'luana@test.com', 'premium_empresa', 'imobiliaria', 'Guarapari']
  ];
  b TEXT[];
  new_user_id UUID;
  new_profile_id UUID;
  tier_val package_tier;
  cat_val seller_category;
  i INT;
  item_titles TEXT[] := ARRAY[
    'Casa com 3 quartos', 'Apartamento vista mar', 'Terreno 500m²', 'Cobertura duplex',
    'Sala comercial centro', 'Casa em condomínio', 'Flat mobiliado', 'Galpão industrial',
    'Apartamento 2 quartos', 'Casa com piscina', 'Terreno plano', 'Loft moderno'
  ];
  item_cats item_category[] := ARRAY['casa','apartamento','terreno','apartamento','comercial','casa','flat','galpao','apartamento','casa','terreno','apartamento']::item_category[];
  item_prices NUMERIC[] := ARRAY[450000, 680000, 120000, 1200000, 350000, 890000, 280000, 750000, 320000, 950000, 95000, 410000];
BEGIN
  FOREACH b SLICE 1 IN ARRAY brokers LOOP
    new_user_id := gen_random_uuid();
    tier_val := b[4]::package_tier;
    cat_val := b[5]::seller_category;

    -- Insert auth user
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token)
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      b[3],
      crypt('TestPass123!', gen_salt('bf')),
      now(),
      'authenticated',
      'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', b[1]),
      now(),
      now(),
      ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', b[3]),
      'email',
      new_user_id::text,
      now(),
      now(),
      now()
    );

    -- Insert profile
    INSERT INTO profiles (user_id, full_name, email, slug, seller_category, city, state, seller_type, company_name, bio, phone)
    VALUES (
      new_user_id,
      b[1],
      b[3],
      b[2],
      cat_val,
      b[6],
      'ES',
      'imoveis',
      b[1],
      'Corretor especializado em imóveis no Espírito Santo. Atendimento personalizado.',
      '(27) 99999-' || lpad((random()*9999)::int::text, 4, '0')
    )
    RETURNING id INTO new_profile_id;

    -- Deactivate auto-created subscription and create correct one
    UPDATE seller_subscriptions SET is_active = false WHERE user_id = new_user_id;

    INSERT INTO seller_subscriptions (user_id, seller_id, tier, max_items, is_active, expires_at, payment_method, payment_status)
    VALUES (
      new_user_id,
      new_profile_id,
      tier_val,
      CASE tier_val
        WHEN 'start' THEN 25
        WHEN 'premium' THEN 60
        WHEN 'vip' THEN 115
        ELSE 9999
      END,
      true,
      now() + interval '365 days',
      'teste',
      'ativo'
    );

    -- Insert 12 items for each broker
    FOR i IN 1..12 LOOP
      INSERT INTO seller_items (user_id, seller_id, title, category, seller_type, price, city, state, status, bedrooms, bathrooms, area, description, neighborhood)
      VALUES (
        new_user_id,
        new_profile_id,
        item_titles[i] || ' - ' || b[6],
        item_cats[i],
        'imoveis',
        item_prices[i] + (random() * 100000)::int,
        b[6],
        'ES',
        'ativo',
        (2 + (random()*3)::int),
        (1 + (random()*2)::int),
        (50 + (random()*200)::int),
        'Excelente imóvel localizado em ' || b[6] || '. Ótima oportunidade de investimento.',
        CASE (random()*4)::int WHEN 0 THEN 'Centro' WHEN 1 THEN 'Praia' WHEN 2 THEN 'Jardim' ELSE 'Residencial' END
      );
    END LOOP;
  END LOOP;
END;
$$;
