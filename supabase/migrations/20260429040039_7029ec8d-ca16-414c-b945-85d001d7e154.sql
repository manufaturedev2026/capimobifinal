INSERT INTO public.ai_tool_costs (tool_key, label, cost, description, category, is_session_based, session_window_minutes)
VALUES ('gallery_ai_headline', 'Headline IA Galeria', 1, 'Gera uma chamada de marketing curta e persuasiva para a arte do imóvel.', 'conteudo', false, 30)
ON CONFLICT (tool_key) DO NOTHING;