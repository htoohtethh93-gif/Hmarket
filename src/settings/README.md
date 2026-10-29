# H MARKET Settings / System Control V1

## Purpose
Admin-facing Settings / System Control scaffold for H MARKET.

## Important safety rules
- V1 is UI/scaffold only.
- No new Settings/System Control database table is created.
- Existing tables are not altered, deleted, or duplicated.
- Existing `profiles`, `partner_services`, `notifications`, order/payment structures and Supabase Auth are intended to be reused later.
- No real Email, Push, Telegram, Viber, or SMS integration is included.
- No destructive database/reset/migration controls are included.

## Included areas
- Dashboard
- General
- Users & Roles
- Partner Services
- Order Control
- Payment Control
- Notification Control
- Security
- Maintenance
- Audit / Logs

## Existing table connection
The Partner Services screen can **read only** from the existing `partner_services` table when the existing Supabase client is available. It does not insert, update, or delete anything.

## Future integration
1. Connect Admin authentication/authorization using the existing Supabase Auth + `profiles` role structure.
2. Bind platform settings to an already-approved configuration source if one exists; do not create a duplicate table without checking first.
3. Connect partner service switches to `partner_services`.
4. Connect notification rules to the existing `notifications` table and Notifications V1.
5. Connect order/payment controls to the actual existing business tables/events.
6. Add audit logging only after confirming an existing audit/log structure or explicitly deciding on one.
