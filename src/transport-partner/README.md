# H MARKET — Transport Partner Module V1

Partner-side module for transportation providers.

Supported service types:
- Car
- Motorbike
- Bus / Line Bus
- Carrier / Taxi
- Three-wheel / Oway
- Ferry / Boat
- Other

Main sections:
- Dashboard
- Vehicles
- Services
- Routes
- Schedules
- Bookings
- Earnings / Settlement
- Ratings
- Notifications
- Partner Profile
- Settings

Core examples:
Bus:
Company / Gate → Vehicle → Route → Departure → Ticket Price → Booking

Car:
Vehicle → Pickup → Destination → Price → Booking

Important:
- This V1 is UI/scaffold only.
- Do not create duplicate business tables for this module during the
  foundation stage.
- Real vehicle records, route/schedule availability, booking records,
  maps, payment and settlement will be integrated later.
- This is separate from Delivery Partner and Rider Partner.

Copy `transport-partner` to:
C:\Users\ASUS\Desktop\NEW VER SION\transport-partner
