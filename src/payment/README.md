# H MARKET — Payment / Settlement Module V1

Core payment foundation UI.

Includes:
- Payment records
- KPay / Wave manual slip verification
- COD
- Settlement foundation
- Commission rules foundation
- Payment methods
- Payment history / accounting periods
- Refund-ready structure

Important:
- V1 is UI/scaffold only.
- Do not recreate existing `payments`, `commissions`, `wallet_transactions`,
  `withdrawal_requests`, `wallets` tables.
- Reuse the existing database during integration.
- Real KPay/Wave gateway integration is a later phase.
- Never store PIN, password or OTP.
- Manual payment should link to the order and verification status.
- Settlement should be calculated from actual payment/order/commission records.
