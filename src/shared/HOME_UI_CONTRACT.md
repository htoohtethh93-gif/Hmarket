# H MARKET Home UI Contract — UI V1

## Source of truth

Customer Home is rendered from the canonical `public.home_sections` configuration loaded through `get_home_sections()` and normalized by `src/shared/home-core.js`.

Flow:

`Admin Control → home_sections / canonical content tables → get_home_sections() → shared/home-core.js → customer renderer → UI`

## UI rules

- Do not embed demo shops, demo products, or fixed Home content records in `customer.js`.
- Category cards use `public.categories` (`image_url` / `icon`) and `home_sections.item_ids` for Home selection.
- Shop lists use approved `public.shops` records.
- Product detail uses available `public.products` records for the selected shop.
- Home section title, description, icon, route, visibility, schedule, location scope, order, and selected item IDs come from the canonical section configuration where applicable.
- Reuse existing canonical tables; do not create duplicate Home/content stores.
- Presentation defaults may exist for safe rendering, but must not become competing business configuration.
- Home section order is taken from `display_order`; the customer renderer does not maintain a second hard-coded order table.

## Responsive UI

The Home layout remains responsive across phone, tablet, and desktop widths. CSS controls presentation only; content and business visibility remain database-driven.
