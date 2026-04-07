
DO $$
DECLARE
  all_photos TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200',
    'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1200',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200',
    'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=1200',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200',
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200',
    'https://images.unsplash.com/photo-1600047508006-7f8e919a5550?w=1200',
    'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=1200',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200',
    'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1200',
    'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=1200',
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200',
    'https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?w=1200',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200',
    'https://images.unsplash.com/photo-1600566752229-250ed79470f8?w=1200',
    'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=1200',
    'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=1200',
    'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1200',
    'https://images.unsplash.com/photo-1600573472591-ee6981cf81e6?w=1200',
    'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=1200',
    'https://images.unsplash.com/photo-1600047508788-786f3865b4b5?w=1200',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7c3a5c?w=1200',
    'https://images.unsplash.com/photo-1600585153784-7f6b5c6d1b5d?w=1200',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200'
  ];
  r RECORD;
  idx INT := 1;
  p1 INT;
  p2 INT;
BEGIN
  FOR r IN
    SELECT si.id FROM seller_items si
    JOIN profiles p ON p.id = si.seller_id
    WHERE p.email LIKE '%@test.com'
    ORDER BY si.created_at
  LOOP
    p1 := ((idx - 1) * 2) % 40 + 1;
    p2 := ((idx - 1) * 2 + 1) % 40 + 1;
    UPDATE seller_items SET photos = ARRAY[all_photos[p1], all_photos[p2]] WHERE id = r.id;
    idx := idx + 1;
  END LOOP;
END;
$$;
