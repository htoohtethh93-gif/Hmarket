BEGIN;

ALTER TABLE public.home_sections
  ADD COLUMN IF NOT EXISTS section_type text NOT NULL DEFAULT 'content',
  ADD COLUMN IF NOT EXISTS service_key text,
  ADD COLUMN IF NOT EXISTS title_mm text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS description_mm text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS icon_url text,
  ADD COLUMN IF NOT EXISTS location_scope jsonb NOT NULL DEFAULT '{"mode":"all","location_ids":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS start_date timestamptz,
  ADD COLUMN IF NOT EXISTS end_date timestamptz,
  ADD COLUMN IF NOT EXISTS target_route text,
  ADD COLUMN IF NOT EXISTS data_source text,
  ADD COLUMN IF NOT EXISTS item_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS show_on_home boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_in_nav boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='home_sections_location_scope_chk' AND conrelid='public.home_sections'::regclass) THEN
    ALTER TABLE public.home_sections
      ADD CONSTRAINT home_sections_location_scope_chk
      CHECK (
        jsonb_typeof(location_scope)='object'
        AND location_scope ? 'mode'
        AND location_scope->>'mode' IN ('all','selected')
        AND jsonb_typeof(location_scope->'location_ids')='array'
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='home_sections_date_window_chk' AND conrelid='public.home_sections'::regclass) THEN
    ALTER TABLE public.home_sections
      ADD CONSTRAINT home_sections_date_window_chk
      CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='home_sections_item_ids_array_chk' AND conrelid='public.home_sections'::regclass) THEN
    ALTER TABLE public.home_sections
      ADD CONSTRAINT home_sections_item_ids_array_chk
      CHECK (jsonb_typeof(item_ids)='array');
  END IF;
END $$;

INSERT INTO public.home_sections (
  section_key, section_type, service_key, section_name,
  title_mm, title_en, description_mm, description_en,
  icon_url, location_scope, start_date, end_date,
  target_route, data_source, item_ids,
  is_active, display_order, show_on_home, show_in_nav
) VALUES
  ('home_layout','system','home','Home Layout','Home Layout','Home Layout','Global Home Layout','Global Home Layout',NULL,'{"mode":"all","location_ids":[]}'::jsonb,NULL,NULL,NULL,'home_layout','[]'::jsonb,true,0,false,false),
  ('hotel_stay','service','accommodation','Hotel & Stay','ဟိုတယ် & တည်းခိုခန်း','Hotel & Stay','Approved accommodation partners only','Approved accommodation partners only','🏨','{"mode":"all","location_ids":[]}'::jsonb,NULL,NULL,'../accommodation/accommodation.html','partner_applications','[]'::jsonb,false,60,true,false),
  ('buy_for_me','service','buy_for_me','Buy-for-Me','အဝယ်တော်','Buy-for-Me','လိုအပ်တာကို ကိုယ်စားဈေးဝယ်ပေးပြီး ပို့ဆောင်ပေးနိုင်ပါတယ်။','H MARKET can shop for you and deliver it.','🛒','{"mode":"all","location_ids":[]}'::jsonb,NULL,NULL,'customer://buyer','purchase_requests','[]'::jsonb,true,70,true,false),
  ('second_hand','service_nav','second_hand','Second-hand','Second-hand','Second-hand','Second-hand marketplace destination','Second-hand marketplace destination','♻️','{"mode":"all","location_ids":[]}'::jsonb,NULL,NULL,'../second-hand/second-hand.html','module','[]'::jsonb,true,80,false,true),
  ('featured','service_nav','featured','Featured','Featured','Featured','Featured Shops destination','Featured Shops destination','⭐','{"mode":"all","location_ids":[]}'::jsonb,NULL,NULL,'customer://featured','home_featured_shops','[]'::jsonb,true,90,false,true)
ON CONFLICT (section_key) DO NOTHING;

UPDATE public.home_sections
SET
  section_type = CASE
    WHEN section_key IN ('location','banner','categories','popular_shop','popular_food') THEN 'content'
    WHEN section_key='partner_services' THEN 'system'
    ELSE section_type
  END,
  service_key = CASE
    WHEN section_key IN ('location','banner','categories','popular_shop','popular_food','partner_services') THEN 'home'
    ELSE service_key
  END,
  title_en = COALESCE(title_en, section_name),
  description_en = COALESCE(description_en, section_name),
  location_scope = COALESCE(location_scope, '{"mode":"all","location_ids":[]}'::jsonb),
  item_ids = COALESCE(item_ids, '[]'::jsonb),
  show_on_home = CASE WHEN section_key='partner_services' THEN false ELSE COALESCE(show_on_home,true) END,
  updated_at = now()
WHERE section_key IN ('location','banner','categories','popular_shop','popular_food','partner_services');

CREATE INDEX IF NOT EXISTS home_sections_active_order_idx
  ON public.home_sections (is_active, display_order);

DROP POLICY IF EXISTS "Admin can insert home sections" ON public.home_sections;
DROP POLICY IF EXISTS "Admin can update home sections" ON public.home_sections;
DROP POLICY IF EXISTS "Admin manage home sections" ON public.home_sections;
DROP POLICY IF EXISTS "Public can read home sections" ON public.home_sections;
DROP POLICY IF EXISTS "Public can view active home sections" ON public.home_sections;
DROP POLICY IF EXISTS "admins manage home sections" ON public.home_sections;
DROP POLICY IF EXISTS "public can read active home sections" ON public.home_sections;

CREATE POLICY "home_sections_public_read_active"
  ON public.home_sections
  FOR SELECT
  TO anon, authenticated
  USING (is_active=true);

CREATE POLICY "home_sections_admin_manage"
  ON public.home_sections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id=(select auth.uid())
        AND p.role='admin'::app_role
        AND COALESCE(p.is_active,true)=true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id=(select auth.uid())
        AND p.role='admin'::app_role
        AND COALESCE(p.is_active,true)=true
    )
  );

DROP TRIGGER IF EXISTS home_sections_updated_at_final ON public.home_sections;
CREATE TRIGGER home_sections_updated_at_final
  BEFORE UPDATE ON public.home_sections
  FOR EACH ROW EXECUTE FUNCTION public.hmarket_set_updated_at();

COMMIT;
