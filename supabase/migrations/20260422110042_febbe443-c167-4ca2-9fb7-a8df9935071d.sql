UPDATE public.subscription_plans
SET benefits = (
  SELECT jsonb_agg(
    CASE
      WHEN value = '"Corretores ilimitados"'::jsonb THEN '"Até 30 corretores vinculados"'::jsonb
      ELSE value
    END
    ORDER BY ordinality
  )
  FROM jsonb_array_elements(benefits) WITH ORDINALITY AS items(value, ordinality)
)
WHERE tier IN ('prime_empresa', 'black');