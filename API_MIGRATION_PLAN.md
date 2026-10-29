# H MARKET — Production API Migration Plan

## Goal

Move the browser from:

`Browser -> Supabase`

to:

`Browser/PWA -> H MARKET API Gateway -> Supabase`

without changing the existing database, RLS, Auth, Admin Dashboard or Home Content implementation.

## Phase 1 — completed in this safe patch

- Added optional `apiBaseUrl` configuration.
- Existing Supabase query code remains unchanged.
- If `apiBaseUrl` is empty, current behavior remains direct-to-Supabase.
- If `apiBaseUrl` is set, the Supabase client uses that origin for REST/Auth/Storage/Realtime paths.
- Added a deployment-ready Cloudflare Worker gateway.
- Gateway forwards only the required Supabase API paths.
- Gateway supports WebSocket pass-through for `/realtime/v1/`.
- No service-role/secret key is placed in browser code.
- Initial connection status now reflects actual API reachability.
- Realtime does not start when API health is known to be offline.

## Phase 2 — deployment test

1. Deploy `api/gateway/` to a publicly reachable hostname.
2. Set `ALLOWED_ORIGINS` to the real H MARKET customer/admin origins.
3. Set `src/shared/config.js`:
   `apiBaseUrl: "https://api.hmarket.example"`
4. Test VPN OFF first.
5. Test Auth, Home, Admin, Storage uploads and Realtime.
6. Only after the gateway path is confirmed should production DNS/domain work be finalized.

## Phase 3 — scale hardening

- CDN/cache public Home/catalog responses where safe.
- Rate limiting at the gateway.
- Request logging/metrics and error monitoring.
- Queue/background jobs for heavy asynchronous work.
- Keep Supabase connection pooling and database indexes healthy.
- Add read replicas/compute only when real workload requires them.

## Important

Do not reset or recreate the existing Supabase project/database for this migration.
