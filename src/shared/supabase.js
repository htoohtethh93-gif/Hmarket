// H MARKET shared Supabase client — singleton bootstrap
(function () {
  if (window.HMARKET_READY && typeof window.HMARKET_READY.then === 'function') {
    return;
  }

  let resolveReady, rejectReady;
  window.HMARKET_READY = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  const cfg = window.HMARKET_CONFIG || {};
  const directSupabaseUrl = String(cfg.supabaseUrl || '').replace(/\/$/, '');
  const gatewayBaseUrl = String(cfg.apiBaseUrl || '').replace(/\/$/, '');
  const clientBaseUrl = gatewayBaseUrl || directSupabaseUrl;

  function setStatus(message, ok) {
    const el = document.querySelector('[data-supabase-status]');
    if (!el) return;
    el.textContent = message;
    el.dataset.ok = ok ? '1' : '0';
  }

  function isNetworkError(err) {
    const msg = String(err?.message || err || '').toLowerCase();
    return /failed to fetch|networkerror|network error|fetch failed|timeout|timed out|connection|dns|name resolution|err_name_not_resolved|err_connection/.test(msg);
  }

  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  async function verifyApiConnection(client) {
    if (!client) return false;
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const request = client.from('categories').select('id').limit(1);
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase API timeout')), 7000));
        const { error } = await Promise.race([request, timeout]);

        if (!error) {
          window.HMARKET_API_ONLINE = true;
          setStatus(gatewayBaseUrl ? 'H MARKET API: Connected ✅' : 'Supabase: Connected ✅', true);
          return true;
        }

        // A PostgREST/RLS error proves that the API is reachable. It should not
        // be treated as a DNS/network outage.
        if (!isNetworkError(error)) {
          window.HMARKET_API_ONLINE = true;
          setStatus(gatewayBaseUrl ? 'H MARKET API: Reachable ⚠️' : 'Supabase: API reachable ⚠️', true);
          console.warn('API reachable but health query returned an error:', error);
          return true;
        }
        throw error;
      } catch (err) {
        window.HMARKET_API_ONLINE = false;
        if (attempt < maxAttempts) {
          await sleep(1200);
          continue;
        }
        setStatus(gatewayBaseUrl ? 'H MARKET API: မရောက်နိုင်ပါ ⚠️' : 'Supabase: API မရောက်နိုင်ပါ ⚠️', false);
        console.warn('API network check failed:', err);
        return false;
      }
    }
    return false;
  }

  window.HMARKET_API_CHECK = function () {
    return verifyApiConnection(window.HMARKET_SUPABASE);
  };

  function initializeClient() {
    try {
      if (window.HMARKET_SUPABASE?.auth) {
        setStatus(gatewayBaseUrl ? 'H MARKET API: Checking…' : 'Supabase: Checking API…', true);
        resolveReady(window.HMARKET_SUPABASE);
        verifyApiConnection(window.HMARKET_SUPABASE);
        return;
      }

      if (!window.supabase?.createClient) {
        throw new Error('Supabase JS library is unavailable');
      }

      if (!clientBaseUrl || !cfg.supabasePublishableKey || cfg.supabasePublishableKey === 'PASTE_YOUR_PUBLISHABLE_KEY_HERE') {
        throw new Error('Supabase configuration is incomplete');
      }

      // The existing Supabase query/auth/storage code remains unchanged. When
      // apiBaseUrl is configured, the same client simply points at the H MARKET
      // gateway instead of exposing the Supabase hostname to the browser.
      const client = window.supabase.createClient(
        clientBaseUrl,
        cfg.supabasePublishableKey
      );

      window.HMARKET_SUPABASE = client;
      window.HMARKET_API_ONLINE = undefined;
      setStatus(gatewayBaseUrl ? 'H MARKET API: Checking…' : 'Supabase: Checking API…', true);
      resolveReady(client);
      verifyApiConnection(client);
    } catch (err) {
      console.error('Supabase initialization error:', err);
      window.HMARKET_API_ONLINE = false;
      rejectReady(err);
      setStatus('H MARKET API / Supabase: Connection မအောင်မြင်ပါ', false);
    }
  }

  if (window.supabase?.createClient) {
    initializeClient();
    return;
  }

  const existingScript = document.querySelector('script[data-hmarket-supabase-js]');
  const script = existingScript || document.createElement('script');

  if (!existingScript) {
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.async = true;
    script.dataset.hmarketSupabaseJs = '1';
    script.onload = initializeClient;
    script.onerror = function () {
      const err = new Error('Supabase library load failed');
      window.HMARKET_API_ONLINE = false;
      rejectReady(err);
      setStatus('Supabase library load မအောင်မြင်ပါ', false);
    };
    document.head.appendChild(script);
  } else {
    existingScript.addEventListener('load', initializeClient, { once: true });
    existingScript.addEventListener('error', function () {
      const err = new Error('Supabase library load failed');
      window.HMARKET_API_ONLINE = false;
      rejectReady(err);
      setStatus('Supabase library load မအောင်မြင်ပါ', false);
    }, { once: true });
  }
})();
