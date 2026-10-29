BEGIN;

-- Second-hand module is permanently removed from H MARKET.
-- No dedicated second-hand tables/functions exist in the current public schema.
DELETE FROM public.home_sections
WHERE section_key IN ('second_hand', 'secondhand');

COMMIT;
