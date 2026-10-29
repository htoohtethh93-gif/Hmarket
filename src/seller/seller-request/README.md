# H MARKET Seller Request Form — Frontend V1

Lazy-loaded Seller Request feature module.

Implemented in this phase:
- Premium responsive 7-section UI
- 3–5 shop photo slots
- Camera + Gallery for shop photos
- Client-side image resize/compression
- Bounded upload helper with max concurrency 2
- Owner selfie camera-only UI
- Camera permission / unavailable / preview / retake / use states
- Camera stream stop/release lifecycle
- NRC + license camera/gallery media cards
- Minimize / restore tray
- Exit confirmation + local draft save
- Review + Submit confirmation
- Local duplicate-submit lock
- Pending application detection using canonical `seller_requests` and linked `partner_applications` mirror
- LocalStorage draft + compressed-media snapshots where feasible
- Dynamic schema renderer hook via `window.HMARKET_SELLER_FORM_SCHEMA`
- Terms config hook via `window.HMARKET_SELLER_TERMS_CONFIG`
- KPay / Wave UI and validation (local/draft-only until DB storage is approved)

Intentionally not changed:
- customer.js duplicate code
- Delivery Partner
- database schema / migrations
- legacy RPC functions

Note: final DB-backed Seller submission is intentionally paused when the UI contains Payment Account / dynamic Registration values because the current canonical v1 RPC has no parameters/storage for those values. No data is written to `partner_applications` as a workaround.
