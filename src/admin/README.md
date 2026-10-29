# H MARKET — Admin Dashboard V1

This folder upgrades the existing `admin/` placeholder into the first Admin Dashboard UI/Foundation.

## V1 scope
- Dark navy SaaS-style sidebar
- Dashboard overview
- Home Content collapsible navigation
- Marketplace modules: Orders, Customers, Sellers, Riders, Delivery Partners, Transport Partners, Accommodation Partners
- Request Forms collapsible navigation
- Finance: Commissions, Tax, Payments / Settlement
- Quality: Featured Shops, Ratings & Complaints
- Admin Roles & Permissions
- Settings collapsible navigation
- Location / Search / From / To date filter structure
- Responsive mobile sidebar
- Links to existing Notifications / Settings / Payment / Ratings modules

## Database safety
- No new table is created by this V1 module.
- No existing table is altered.
- No database writes are performed.
- Demo metrics and queue rows are presentation-only.
- Later integrations should reuse the existing project tables/modules as the source of truth.

## Existing architecture references observed in the project
The current project already references areas such as:
- `profiles`
- `shops`
- `partner_services`
- `partner_applications`
- `delivery_partner_requests`
- `delivery_partner_request_riders`
- `purchase_requests`
- `notifications`
- `hmarket_locations`
- `hmarket_regions`
- `home_banners`
- `home_banner_locations`
- `home_featured_shops`
- `home_featured_products`
- support / ratings related modules

The SQL files currently present under `supabase/` are reference placeholders rather than a complete consolidated schema. For that reason, V1 does not invent a replacement schema.

## Later integration points
1. Connect Admin authentication to the existing Supabase Auth + profile role system.
2. Read existing records for live counts.
3. Wire request approve/reject flows to the existing request/partner tables.
4. Connect Home Content controls to the existing home-content tables.
5. Connect Finance / Payments / Settlement panels to existing payment/settlement structures.
6. Add guarded Admin-only writes only after the existing RLS / permission model is confirmed.
