# H MARKET Shared Home Core Contract

## Canonical flow
Admin Control -> canonical Home tables -> `get_home_sections()` -> `shared/home-core.js` -> domain renderer -> UI

## Shared Core responsibilities
- Load active Home sections through the canonical `get_home_sections(p_location_id)` RPC.
- Normalize legacy/alias section keys into canonical keys.
- Provide section lookup and ordering helpers.
- Provide normalized `item_ids` selection.
- Normalize supported customer/external routes.

## Domain renderer responsibilities
- Render presentation only.
- Query canonical content tables required by the selected section.
- Never create a competing Home-section configuration list.
- Never decide whether an Admin-disabled section should be visible.

## Canonical DB sources
- `home_sections`: section configuration, order, visibility, schedule, location scope, route, data source, item selection.
- `home_banners`: banner content.
- `home_banner_locations`: banner/location targeting.
- `home_featured_shops`: featured shop selection.
- `home_featured_products`: featured product selection.
- `categories`: category content.
- `shops` / `products`: commerce content.
- `partner_applications`: approved accommodation partner source where applicable.
- `purchase_requests`: Buy-for-Me domain source where applicable.

## Rules
- Customer code must not query `home_sections` directly; use `window.HMARKET_HOME.loadSections()`.
- UI defaults may provide presentation fallback text, but they must not create a new section or override DB visibility/order.
- No duplicate `banners`, `featured_*`, `popular_*`, or `home_locations` tables.
- Location/date filtering for section availability is centralized in the DB RPC.
- Existing domain-specific content filters may remain for data safety, but they must not replace the Home configuration source of truth.
