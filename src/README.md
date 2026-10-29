# H MARKET Modular Structure V2

This ZIP is the corrected folder structure only. It does not replace the current working project.

## Main modules

- customer
- account
- shop
- accommodation
- transportation
- buy-for-me
- cart
- order
- seller
- rider
- delivery-partner
- admin
- shared
- supabase

## Transportation scope

Transportation is a parent module and will support multiple transport/service types, including:

- Car
- Motorcycle
- Bus Line / Route Bus
- Ferry / Boat where applicable
- Taxi / Cab
- Three-wheel / local transport such as အိုးဝေ where applicable
- Other transport services

Detailed transportation UI and database implementation will be added later without mixing it into Delivery Partner.

## Accommodation scope

Accommodation is the parent module. Hotel is one accommodation type.

Supported types can include:
Hotel, Resort, Guesthouse, Hostel, Homestay, Serviced Apartment, Villa, Lodge, Other.

## Important

Do not delete or overwrite the current working H MARKET project yet.
The next phase is to migrate existing working code into these modules one module at a time, then link and test them.

## UI V1 status

Home UI now follows the Shared Core contract: Home sections are loaded through `get_home_sections()`, category content comes from the canonical `categories` table, approved shops come from `shops`, and shop products come from `products`. Demo shop/product records were removed from the customer Home/shop-detail rendering path.
