ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_video_url TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_video_title TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_video_button_text TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_video_button_url TEXT DEFAULT NULL;