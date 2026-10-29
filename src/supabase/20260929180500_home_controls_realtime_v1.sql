-- H MARKET Home controls + realtime wiring.
-- Safe to apply after home_final_architecture_v1.
BEGIN;

DO $$
DECLARE
  v_mobile uuid;
  v_other uuid;
  v_refs integer;
BEGIN
  SELECT id INTO v_mobile FROM public.categories WHERE slug='mobile-shop' LIMIT 1;
  SELECT id INTO v_other FROM public.categories WHERE slug='other' LIMIT 1;

  IF v_mobile IS NOT NULL THEN
    SELECT count(*) INTO v_refs FROM public.shops WHERE category_id=v_mobile;
    IF v_refs <> 0 THEN RAISE EXCEPTION 'ABORT: mobile-shop category is referenced by % shops.', v_refs; END IF;
    SELECT count(*) INTO v_refs FROM public.seller_requests WHERE category_id=v_mobile;
    IF v_refs <> 0 THEN RAISE EXCEPTION 'ABORT: mobile-shop category is referenced by % seller requests.', v_refs; END IF;
  END IF;

  IF v_other IS NOT NULL THEN
    SELECT count(*) INTO v_refs FROM public.shops WHERE category_id=v_other;
    IF v_refs <> 0 THEN RAISE EXCEPTION 'ABORT: other category is referenced by % shops.', v_refs; END IF;
    SELECT count(*) INTO v_refs FROM public.seller_requests WHERE category_id=v_other;
    IF v_refs <> 0 THEN RAISE EXCEPTION 'ABORT: other category is referenced by % seller requests.', v_refs; END IF;
  END IF;
END $$;

-- Normalize the current two unused labels to the approved 10-category names.
UPDATE public.categories
SET name_en='Mobile & Accessories',
    name_mm='ဖုန်း & အပိုပစ္စည်း',
    slug='mobile-accessories',
    sort_order=10,
    updated_at=now()
WHERE slug='mobile-shop';

UPDATE public.categories
SET name_en='Hotel & Stay',
    name_mm='ဟိုတယ် & တည်းခိုခန်း',
    slug='hotel-stay',
    sort_order=8,
    updated_at=now()
WHERE slug='other';

UPDATE public.categories SET sort_order=1 WHERE slug='restaurant';
UPDATE public.categories SET sort_order=2 WHERE slug='food-drink';
UPDATE public.categories SET sort_order=3 WHERE slug='cake-bakery';
UPDATE public.categories SET sort_order=4 WHERE slug='pharmacy';
UPDATE public.categories SET sort_order=5 WHERE slug='cosmetic-clothing';
UPDATE public.categories SET sort_order=6 WHERE slug='electronic';
UPDATE public.categories SET sort_order=7 WHERE slug='market';
UPDATE public.categories SET sort_order=9 WHERE slug='liquor-store';

-- Set the canonical initial Home configuration and make Featured a Home section,
-- while Second-hand remains navigation-only.
UPDATE public.home_sections SET is_active=true,display_order=0,show_on_home=false,show_in_nav=false WHERE section_key='home_layout';
UPDATE public.home_sections SET is_active=true,display_order=10,show_on_home=true,show_in_nav=false WHERE section_key='location';
UPDATE public.home_sections SET is_active=true,display_order=20,show_on_home=true,show_in_nav=false WHERE section_key='banner';
UPDATE public.home_sections SET is_active=true,display_order=30,show_on_home=true,show_in_nav=false WHERE section_key='categories';
UPDATE public.home_sections SET is_active=true,display_order=40,show_on_home=true,show_in_nav=false WHERE section_key='popular_shop';
UPDATE public.home_sections SET is_active=true,display_order=50,show_on_home=true,show_in_nav=false WHERE section_key='popular_food';
UPDATE public.home_sections SET is_active=true,display_order=60,show_on_home=true,show_in_nav=false WHERE section_key='featured';
UPDATE public.home_sections SET is_active=true,display_order=70,show_on_home=true,show_in_nav=false WHERE section_key='hotel_stay';
UPDATE public.home_sections SET is_active=true,display_order=80,show_on_home=true,show_in_nav=false WHERE section_key='buy_for_me';
UPDATE public.home_sections SET is_active=true,display_order=90,show_on_home=false,show_in_nav=true WHERE section_key='second_hand';

-- Persist the current approved 10-category Home order in the canonical Home config.
UPDATE public.home_sections
SET item_ids=(SELECT jsonb_agg(id ORDER BY sort_order) FROM public.categories WHERE slug IN ('restaurant','food-drink','cake-bakery','pharmacy','cosmetic-clothing','electronic','market','hotel-stay','liquor-store','mobile-accessories')),
    updated_at=now()
WHERE section_key='categories';

-- Make Popular sections explicit selection containers but keep them ON.
UPDATE public.home_sections SET data_source='shops',show_on_home=true,is_active=true WHERE section_key='popular_shop';
UPDATE public.home_sections SET data_source='products',show_on_home=true,is_active=true WHERE section_key='popular_food';
UPDATE public.home_sections SET data_source='home_featured_shops' WHERE section_key='featured';
UPDATE public.home_sections SET data_source='partner_applications',service_key='accommodation' WHERE section_key='hotel_stay';
UPDATE public.home_sections SET data_source='purchase_requests',service_key='buy_for_me' WHERE section_key='buy_for_me';
UPDATE public.home_sections SET data_source='module',service_key='second_hand' WHERE section_key='second_hand';

-- Enable Postgres Changes for the Home data sources used by Customer/Admin realtime.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'public.home_sections','public.home_banners','public.home_banner_locations',
    'public.home_featured_shops','public.home_featured_products','public.categories',
    'public.hmarket_locations','public.shops','public.products','public.partner_applications',
    'public.partner_services','public.partner_service_locations'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname='supabase_realtime' AND schemaname=split_part(t,'.',1) AND tablename=split_part(t,'.',2)
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %s', t);
    END IF;
  END LOOP;
END $$;

COMMIT;
