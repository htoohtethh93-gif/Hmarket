-- H MARKET Architecture: canonical Home source-of-truth API
CREATE OR REPLACE FUNCTION public.get_home_sections(p_location_id uuid DEFAULT NULL)
RETURNS SETOF public.home_sections
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT hs.*
  FROM public.home_sections hs
  WHERE hs.is_active = true
    AND hs.show_on_home = true
    AND (hs.start_date IS NULL OR hs.start_date <= now())
    AND (hs.end_date IS NULL OR hs.end_date >= now())
    AND (
      p_location_id IS NULL
      OR hs.location_scope->>'mode' = 'all'
      OR (hs.location_scope->>'mode' = 'selected'
          AND hs.location_scope->'location_ids' ? p_location_id::text)
    )
  ORDER BY hs.display_order, hs.section_key;
$$;

REVOKE ALL ON FUNCTION public.get_home_sections(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_sections(uuid) TO anon, authenticated;
