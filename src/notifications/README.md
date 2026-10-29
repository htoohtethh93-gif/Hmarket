# H MARKET — Notifications V1

## Purpose

This folder is the **Notifications V1 UI/scaffold** for H MARKET.

It is intentionally designed so the existing project and existing Supabase database can be reused later.

## Files

- `notifications.html` — Notification Center UI
- `notifications.css` — V1 styles
- `notifications.js` — Demo UI behavior + future event hook
- `README.md` — integration notes

## V1 scope

Included UI sections:

1. Dashboard
2. Inbox
3. Order Notifications
4. Partner Notifications
5. Payment Notifications
6. Promotions
7. System Notifications
8. Notification Templates
9. Notification Channels
10. Settings

Supported channel placeholders:

- In-App
- Email
- Push
- Telegram
- Viber
- SMS

## Order event map

- New Order
- Order Accepted
- Preparing
- Ready
- Rider Accepted
- On the Way
- Delivered

## Partner event map

- Application Received
- Under Review
- Approved
- Rejected
- Suspended

## Payment event map

- Payment Submitted
- Payment Verified
- Payment Rejected
- Refund
- Settlement

## Important: database

**No SQL is included in this V1 module.**

Do NOT create a duplicate `notifications` table.

The existing H MARKET `notifications` table should be reused later after its actual schema is confirmed.

## Important: integrations

Real:

- Email
- Push
- Telegram
- Viber
- SMS

are intentionally NOT connected in V1.

No API keys, provider credentials, webhooks, or external notification calls are stored in this module.

## Future business-event connection

When the business modules are ready, connect notification triggers to their existing status changes.

Example mapping:

```text
Order created       -> New Order
Order accepted      -> Order Accepted
Order preparing     -> Preparing
Order ready         -> Ready
Rider accepted      -> Rider Accepted
Rider starts route  -> On the Way
Order delivered     -> Delivered
```

Partner example:

```text
Application created -> Application Received
Admin reviewing     -> Under Review
Admin approves      -> Approved
Admin rejects       -> Rejected
Admin suspends      -> Suspended
```

Payment example:

```text
Payment submitted   -> Payment Submitted
Admin verifies      -> Payment Verified
Admin rejects       -> Payment Rejected
Refund created      -> Refund
Settlement created  -> Settlement
```

## Future integration hook

`notifications.js` exposes:

```js
window.HMARKET_NOTIFICATIONS_V1.emit(eventName, payload)
```

This is only a placeholder hook in V1. It does **not** write to Supabase.

Later, this hook can be replaced/connected to the existing notification service and existing `notifications` table.

## Installation

Copy the `notifications` folder into:

```text
C:\Users\ASUS\Desktop\NEW VER SION\
```

Then open:

```text
C:\Users\ASUS\Desktop\NEW VER SION\notifications\notifications.html
```

No existing folder needs to be deleted or rewritten.
