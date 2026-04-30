WITH single_device AS (
  SELECT seller_id FROM public.push_subscriptions
  WHERE user_id IS NULL
  GROUP BY seller_id HAVING count(*) = 1
)
UPDATE public.push_subscriptions ps
SET user_id = p.user_id
FROM public.profiles p
WHERE ps.seller_id = p.id
  AND ps.user_id IS NULL
  AND ps.seller_id IN (SELECT seller_id FROM single_device);