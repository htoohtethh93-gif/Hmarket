H MARKET — CLEAN VANILLA BUILD
================================

This project is Vanilla HTML + CSS + JavaScript + Supabase + PWA.
React, ReactDOM, Vite, node_modules and the accidental JSX wrapper were removed.

WINDOWS QUICK START
1. Double-click start-localhost.bat
2. Open: http://localhost:5500/
3. The root page opens the customer app at /src/customer/customer.html

IMPORTANT
- Do NOT open the HTML files with file:// because Supabase/PWA features need an HTTP server.
- You can also use VS Code Live Server instead of the included .bat launcher.
- Existing Supabase code and migrations were kept.
- Existing customer/admin/partner pages were not rewritten.

If Supabase shows "setup required", check src/shared/config.js and your Supabase project settings.
