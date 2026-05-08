
INSERT INTO public.ai_tool_costs (tool_key, cost, is_session_based, session_window_minutes, label, category)
VALUES ('whatsapp_ai_chat', 3, true, 30, 'Atendente IA WhatsApp da Loja', 'chat')
ON CONFLICT (tool_key) DO NOTHING;
