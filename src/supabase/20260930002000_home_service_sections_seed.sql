-- H MARKET Home service sections seed
-- Run after home_sections architecture migration

INSERT INTO public.home_sections (
 section_key, section_type, service_key, section_name,
 title_mm, title_en, description_mm, description_en,
 icon_url, location_scope, target_route, data_source,
 item_ids, is_active, display_order, show_on_home, show_in_nav
)
VALUES
('hotel_stay','service','accommodation','Hotel & Stay',
 'ဟိုတယ် & တည်းခိုခန်း','Hotel & Stay',
 'Approved accommodation partners','Approved accommodation partners',
 '🏨','{"mode":"all","location_ids":[]}'::jsonb,
 '../accommodation/accommodation.html','partner_applications',
 '[]'::jsonb,true,60,true,false),

('bus_ticket','service','bus_ticket','Bus Ticket',
 'ကားလက်မှတ်','Bus Ticket',
 'Bus ticket service','Bus ticket service',
 '🚌','{"mode":"all","location_ids":[]}'::jsonb,
 'customer://bus_ticket','module',
 '[]'::jsonb,true,70,true,false),

('traditional_medicine','service','traditional_medicine','Traditional Medicine',
 'တိုင်းရင်းဆေး','Traditional Medicine',
 'Traditional medicine service','Traditional medicine service',
 '🌿','{"mode":"all","location_ids":[]}'::jsonb,
 'customer://traditional_medicine','module',
 '[]'::jsonb,true,80,true,false),

('featured_shop','service_nav','featured','Featured Shops',
 'Feature Shop','Featured Shops',
 'Featured shop destination','Featured shop destination',
 '⭐','{"mode":"all","location_ids":[]}'::jsonb,
 'customer://featured','home_featured_shops',
 '[]'::jsonb,true,90,true,false)
ON CONFLICT (section_key) DO UPDATE SET
 title_mm=EXCLUDED.title_mm,
 title_en=EXCLUDED.title_en,
 icon_url=EXCLUDED.icon_url,
 display_order=EXCLUDED.display_order,
 is_active=EXCLUDED.is_active,
 show_on_home=EXCLUDED.show_on_home,
 updated_at=now();
