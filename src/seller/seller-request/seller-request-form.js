/* H MARKET Seller Request Form
 * Lazy-loaded feature module. No database writes are performed by this module itself.
 * DB-backed submission uses the existing submit_seller_application_v1 RPC only.
 */
(function () {
  'use strict';

  const MODULE = 'HMARKET_SELLER_REQUEST_V1';
  const DRAFT_KEY = 'hmarket_seller_request_draft_v2';
  const SUBMIT_LOCK_KEY = 'hmarket_seller_submit_lock_v1';
  const MAX_PHOTOS = 5;
  const MIN_PHOTOS = 3;
  const MAX_UPLOAD_CONCURRENCY = 2;
  const SHOP_IMAGE_MAX = 1600;
  const DOC_IMAGE_MAX = 2200;
  const SELFIE_IMAGE_MAX = 1200;
  const SHOP_QUALITY = 0.80;
  const DOC_QUALITY = 0.86;
  const SELFIE_QUALITY = 0.82;

  const TERMS_FALLBACK = {
    version: '2026-09-27-v1',
    titleMm: 'H MARKET Seller Terms & Regulations',
    titleEn: 'Seller Terms & Regulations',
    sections: [
      { titleMm: 'လုပ်ငန်းအချက်အလက်', titleEn: 'Business Information', bodyMm: 'ဆိုင်အမည်၊ လိပ်စာ၊ ဖုန်းနံပါတ်နှင့် ပိုင်ရှင်အချက်အလက်များကို မှန်ကန်စွာပေးရပါမည်။', bodyEn: 'Provide accurate shop, address, phone and owner information.' },
      { titleMm: 'ပစ္စည်းနှင့်ဝန်ဆောင်မှု', titleEn: 'Products & Service', bodyMm: 'ကုန်ပစ္စည်းအမည်၊ ဈေးနှုန်း၊ ပုံ၊ stock နှင့် ဖော်ပြချက်များကို မှန်ကန်စွာ ထိန်းသိမ်းရပါမည်။', bodyEn: 'Keep product names, prices, images, stock and descriptions accurate.' },
      { titleMm: 'Order နှင့် Customer Safety', titleEn: 'Orders & Customer Safety', bodyMm: 'လက်ခံထားသော order များကို သတ်မှတ်ထားသောအချိန်အတွင်း စီမံပြီး customer information ကို လုံခြုံစွာ ကိုင်တွယ်ရပါမည်။', bodyEn: 'Process accepted orders on time and protect customer information.' },
      { titleMm: 'Verification', titleEn: 'Verification', bodyMm: 'H MARKET မှ တောင်းဆိုသော အထောက်အထားများကို မှန်ကန်စွာတင်ပြရပါမည်။', bodyEn: 'Provide accurate verification documents requested by H MARKET.' }
    ]
  };

  const FORM_SCHEMA_FALLBACK = [
    { key: 'registration_status', type: 'radio', labelMm: 'Business Registration Status', labelEn: 'Registration Status', required: false, options: [
      { value: 'registered', labelMm: 'မှတ်ပုံတင်ပြီး', labelEn: 'Registered' },
      { value: 'not_registered', labelMm: 'မမှတ်ပုံတင်ရသေး', labelEn: 'Not Registered' },
      { value: 'pending', labelMm: 'လုပ်ဆောင်နေဆဲ', labelEn: 'Pending' }
    ] },
    { key: 'registration_number', type: 'text', labelMm: 'Registration Number', labelEn: 'Registration Number', required: false },
    { key: 'registration_date', type: 'date', labelMm: 'Registration Date', labelEn: 'Registration Date', required: false },
    { key: 'registration_document', type: 'document', labelMm: 'Registration Document', labelEn: 'Registration Document', required: false, accept: 'image/*,.pdf' }
  ];

  const state = {
    mounted: false,
    submitInFlight: false,
    dirty: false,
    activeApplication: null,
    camera: { stream: null, target: null, facingMode: null, resolve: null, reject: null, capturedBlob: null },
    photos: Array.from({ length: MAX_PHOTOS }, () => null),
    coverIndex: 0,
    ownerSelfie: null,
    nrcFront: null,
    nrcBack: null,
    license: null,
    dynamicFiles: {},
    paymentAccounts: { kpay: { enabled: false, name: '', phone: '' }, wave: { enabled: false, name: '', phone: '' } },
    termsAccepted: false,
    termsRead: false,
    uploadProgress: null,
    draftLoaded: false,
    draftSavedAt: null
  };

  let root = null;
  let styleLoaded = false;
  let idCounter = 0;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function uid(prefix = 'seller') {
    idCounter += 1;
    return `${prefix}-${Date.now()}-${idCounter}`;
  }

  function getTermsConfig() {
    const external = window.HMARKET_SELLER_TERMS_CONFIG;
    return external && external.version ? external : TERMS_FALLBACK;
  }

  function getFormSchema() {
    const external = Array.isArray(window.HMARKET_SELLER_FORM_SCHEMA) ? window.HMARKET_SELLER_FORM_SCHEMA : null;
    return external?.length ? external : FORM_SCHEMA_FALLBACK;
  }

  function ensureStyle() {
    if (styleLoaded || document.querySelector('link[data-hmarket-seller-form-css]')) {
      styleLoaded = true;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = new URL('../seller/seller-request/seller-request-form.css', document.baseURI).href;
      link.dataset.hmarketSellerFormCss = '1';
      link.onload = () => { styleLoaded = true; resolve(); };
      link.onerror = () => reject(new Error('Seller Request styles could not be loaded.'));
      document.head.appendChild(link);
    });
  }

  function makeFileSnapshot(file, blob) {
    return {
      blob,
      name: file?.name || `capture-${Date.now()}.jpg`,
      type: blob?.type || file?.type || 'image/jpeg',
      size: blob?.size || file?.size || 0
    };
  }

  async function blobToDataUrl(blob, maxLength = 110000) {
    if (!blob || blob.size > 220000) return null;
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => {
        const value = String(reader.result || '');
        resolve(value.length <= maxLength ? value : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  }

  function imageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image.')); };
      img.src = url;
    });
  }

  async function compressImage(input, maxDimension, quality, outputType = 'image/webp') {
    const blob = input instanceof Blob ? input : input?.blob;
    if (!blob || !String(blob.type || '').startsWith('image/')) return input;

    let width = 0, height = 0, source = null;
    try {
      if ('createImageBitmap' in window) {
        source = await createImageBitmap(blob);
        width = source.width;
        height = source.height;
      } else {
        source = await imageFromBlob(blob);
        width = source.naturalWidth;
        height = source.naturalHeight;
      }

      const scale = Math.min(1, maxDimension / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Canvas is not available.');
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      const result = await new Promise((resolve, reject) => {
        canvas.toBlob(blobResult => blobResult ? resolve(blobResult) : reject(new Error('Image compression failed.')), outputType, quality);
      });
      if (source && typeof source.close === 'function') source.close();
      return result;
    } catch (error) {
      if (source && typeof source.close === 'function') source.close();
      throw error;
    }
  }

  async function prepareImageFile(file, role) {
    if (!file || !file.size) throw new Error('Please choose an image.');
    if (!String(file.type || '').startsWith('image/')) throw new Error('Please choose an image file.');
    if (role === 'shop') {
      return makeFileSnapshot(file, await compressImage(file, SHOP_IMAGE_MAX, SHOP_QUALITY));
    }
    if (role === 'selfie') {
      return makeFileSnapshot(file, await compressImage(file, SELFIE_IMAGE_MAX, SELFIE_QUALITY));
    }
    return makeFileSnapshot(file, await compressImage(file, DOC_IMAGE_MAX, DOC_QUALITY));
  }

  function prepareNonImageFile(file) {
    if (!file || !file.size) return null;
    return makeFileSnapshot(file, file);
  }

  function openObjectUrl(snapshot) {
    return snapshot?.blob ? URL.createObjectURL(snapshot.blob) : '';
  }

  function setPreviewUrl(img, snapshot) {
    if (!img) return () => {};
    const url = openObjectUrl(snapshot);
    img.src = url;
    img.hidden = !url;
    return () => { if (url) URL.revokeObjectURL(url); };
  }

  async function saveDraft() {
    if (!root) return;
    const data = {};
    root.querySelectorAll('[data-seller-field]').forEach(el => {
      data[el.dataset.sellerField] = el.type === 'checkbox' ? el.checked : el.value;
    });
    data.coverIndex = state.coverIndex;
    data.termsAccepted = state.termsAccepted;
    data.termsRead = state.termsRead;
    data.paymentAccounts = state.paymentAccounts;
    data.dynamicValues = {};
    root.querySelectorAll('[data-dynamic-key]').forEach(el => {
      data.dynamicValues[el.dataset.dynamicKey] = el.type === 'checkbox' ? el.checked : el.value;
    });
    data.savedAt = new Date().toISOString();

    const media = {
      photos: [],
      ownerSelfie: await blobToDataUrl(state.ownerSelfie?.blob),
      nrcFront: await blobToDataUrl(state.nrcFront?.blob),
      nrcBack: await blobToDataUrl(state.nrcBack?.blob),
      license: await blobToDataUrl(state.license?.blob),
      dynamicFiles: {}
    };
    for (const photo of state.photos) media.photos.push(await blobToDataUrl(photo?.blob));
    for (const [key, item] of Object.entries(state.dynamicFiles)) media.dynamicFiles[key] = await blobToDataUrl(item?.blob);

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 2, data, media }));
      state.draftSavedAt = data.savedAt;
      const stamp = root.querySelector('[data-draft-status]');
      if (stamp) stamp.textContent = `Draft saved · ${new Date(data.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (error) {
      console.warn('[HMarket Seller Draft] localStorage save skipped:', error);
    }
  }

  async function dataUrlToSnapshot(dataUrl, name = 'draft.webp') {
    if (!dataUrl) return null;
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return { blob, name, type: blob.type, size: blob.size };
    } catch {
      return null;
    }
  }

  async function loadDraft() {
    if (state.draftLoaded) return;
    state.draftLoaded = true;
    let saved = null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch { saved = null; }
    if (!saved?.data) return;

    const d = saved.data;
    const assign = (key, value) => {
      const el = root?.querySelector(`[data-seller-field="${CSS.escape(key)}"]`);
      if (el && value != null) el.value = value;
    };
    ['shop_name', 'category_id', 'description', 'address', 'phone', 'license_status', 'license_reason'].forEach(k => assign(k, d[k]));
    state.coverIndex = Number.isInteger(d.coverIndex) ? d.coverIndex : 0;
    state.termsAccepted = !!d.termsAccepted;
    state.termsRead = !!d.termsRead;
    if (d.paymentAccounts) state.paymentAccounts = d.paymentAccounts;

    root.querySelectorAll('[data-dynamic-key]').forEach(el => {
      const v = d.dynamicValues?.[el.dataset.dynamicKey];
      if (v != null) {
        if (el.type === 'checkbox') el.checked = !!v;
        else if (el.type === 'radio') el.checked = String(el.value) === String(v);
        else el.value = v;
      }
    });
    renderPaymentState();
    renderTermsState();

    state.ownerSelfie = await dataUrlToSnapshot(saved.media?.ownerSelfie, 'owner-selfie.webp');
    state.nrcFront = await dataUrlToSnapshot(saved.media?.nrcFront, 'nrc-front.webp');
    state.nrcBack = await dataUrlToSnapshot(saved.media?.nrcBack, 'nrc-back.webp');
    state.license = await dataUrlToSnapshot(saved.media?.license, 'license.webp');
    if (Array.isArray(saved.media?.photos)) {
      for (let i = 0; i < MAX_PHOTOS; i++) state.photos[i] = await dataUrlToSnapshot(saved.media.photos[i], `shop-${i + 1}.webp`);
    }
    for (const [key, value] of Object.entries(saved.media?.dynamicFiles || {})) state.dynamicFiles[key] = await dataUrlToSnapshot(value, `${key}.webp`);
    renderAllPreviews();
    setDirty(false);
    const stamp = root.querySelector('[data-draft-status]');
    if (stamp && saved.data.savedAt) stamp.textContent = `Draft restored · ${new Date(saved.data.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    state.draftLoaded = false;
    state.draftSavedAt = null;
  }

  function setDirty(value = true) {
    state.dirty = !!value;
    if (root) root.dataset.dirty = state.dirty ? '1' : '0';
  }

  function debounce(fn, delay = 450) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  const debouncedDraft = debounce(() => { if (state.dirty && !state.submitInFlight) saveDraft(); }, 500);

  function renderPaymentState() {
    if (!root) return;
    root.querySelectorAll('[data-payment-toggle]').forEach(btn => {
      const key = btn.dataset.paymentToggle;
      const enabled = !!state.paymentAccounts[key]?.enabled;
      btn.classList.toggle('active', enabled);
      const panel = root.querySelector(`[data-payment-panel="${key}"]`);
      if (panel) panel.hidden = !enabled;
    });
    const summary = root.querySelector('[data-payment-summary]');
    if (summary) {
      const active = ['kpay', 'wave'].filter(key => state.paymentAccounts[key].enabled).map(key => key.toUpperCase());
      summary.textContent = active.length ? `Selected: ${active.join(' + ')}` : 'At least one payment account is required.';
      summary.className = `seller-mini-note ${active.length ? 'ok' : 'warn'}`;
    }
  }

  function renderTermsState() {
    if (!root) return;
    const cb = root.querySelector('[data-seller-terms]');
    if (cb) cb.checked = state.termsAccepted;
    const label = root.querySelector('[data-terms-state]');
    if (label) label.textContent = state.termsAccepted ? 'Agreed' : 'Please read and agree';
    const submit = document.getElementById('authSubmit');
    if (submit) submit.dataset.termsReady = state.termsAccepted ? '1' : '0';
  }

  function renderCameraTargetCard(target, label, mode) {
    const current = state[target];
    return `<div class="seller-media-card ${current ? 'has-media' : ''}" data-media-card="${target}">
      <div class="seller-media-head"><div><strong>${escapeHtml(label)}</strong><span>${target === 'ownerSelfie' ? 'Camera only' : 'Camera + Gallery'}</span></div><span class="seller-required">Required</span></div>
      <div class="seller-media-body">
        <div class="seller-media-preview"><img data-media-preview="${target}" alt="${escapeHtml(label)} preview" ${current ? '' : 'hidden'}><div class="seller-file-preview" data-media-file="${target}" hidden><strong>DOCUMENT</strong><span data-media-file-name="${target}"></span></div></div>
        <div class="seller-media-actions">
          <button type="button" class="seller-btn seller-btn-primary" data-seller-camera="${target}">${current ? '↻ Retake' : 'Open Camera'}</button>
          ${mode === 'document' ? `<button type="button" class="seller-btn seller-btn-ghost" data-seller-gallery="${target}">${current ? 'Replace' : 'Choose Gallery'}</button>` : ''}
          ${current ? `<button type="button" class="seller-btn seller-btn-ghost seller-btn-danger" data-seller-remove="${target}">Remove</button>` : ''}
        </div>
      </div>
    </div>`;
  }

  function renderPhotoSlots() {
    return `<div data-photo-widget><div class="seller-photo-slots" data-photo-slots>${state.photos.map((item, index) => {
      if (!item) return `<div class="seller-photo-slot empty-slot" data-photo-slot="${index}"><div class="seller-photo-empty"><span class="seller-photo-plus">＋</span><strong>Add Photo</strong><small>Camera or Gallery</small></div><div class="seller-photo-actions"><button type="button" class="seller-btn seller-btn-primary" data-photo-camera="${index}">Camera</button><button type="button" class="seller-btn seller-btn-ghost" data-photo-gallery="${index}">Gallery</button></div></div>`;
      const cover = state.coverIndex === index;
      return `<div class="seller-photo-slot filled-slot ${cover ? 'is-cover' : ''}" data-photo-slot="${index}">
        <div class="seller-photo-image-wrap"><img data-photo-preview="${index}" alt="Shop photo ${index + 1}" hidden><span class="seller-cover-badge" ${cover ? '' : 'hidden'}>COVER</span></div>
        <div class="seller-photo-meta"><strong>Photo ${index + 1}</strong><span>${cover ? 'Main photo' : 'Shop view'}</span></div>
        <div class="seller-photo-actions"><button type="button" class="seller-btn seller-btn-primary" data-photo-replace="${index}">Replace</button><button type="button" class="seller-btn seller-btn-ghost" data-photo-retake="${index}">Retake</button><button type="button" class="seller-btn seller-btn-ghost seller-btn-danger" data-photo-remove="${index}">Remove</button>${cover ? '' : `<button type="button" class="seller-btn seller-btn-cover" data-photo-cover="${index}">Set Cover</button>`}</div>
      </div>`;
    }).join('')}</div><div class="seller-upload-rule"><span>Minimum 3 · Maximum 5</span><strong>${state.photos.filter(Boolean).length}/5</strong></div></div>`;
  }

  function renderDynamicField(field) {
    const label = `${escapeHtml(field.labelMm || field.key)} / ${escapeHtml(field.labelEn || '')}`;
    const required = field.required ? '<span class="seller-required">Required</span>' : '<span class="seller-optional">Optional</span>';
    if (field.type === 'radio' || field.type === 'select') {
      if (field.type === 'select') {
        return `<label class="seller-field"><span>${label} ${required}</span><select data-dynamic-key="${escapeHtml(field.key)}" ${field.required ? 'required' : ''}><option value="">Select…</option>${(field.options || []).map(o => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.labelMm || o.labelEn || o.value)}</option>`).join('')}</select></label>`;
      }
      return `<fieldset class="seller-field seller-fieldset"><legend>${label} ${required}</legend><div class="seller-radio-row">${(field.options || []).map(o => `<label class="seller-radio"><input type="radio" name="dynamic_${escapeHtml(field.key)}" data-dynamic-key="${escapeHtml(field.key)}" value="${escapeHtml(o.value)}" ${field.required ? 'required' : ''}><span>${escapeHtml(o.labelMm || '')}<small>${escapeHtml(o.labelEn || '')}</small></span></label>`).join('')}</div></fieldset>`;
    }
    if (field.type === 'document' || field.type === 'file' || field.type === 'image' || field.type === 'camera') {
      return `<div class="seller-field seller-dynamic-media" data-dynamic-media="${escapeHtml(field.key)}"><div class="seller-field-label"><span>${label}</span>${required}</div><div class="seller-dynamic-media-card"><div class="seller-media-preview"><img data-dynamic-preview="${escapeHtml(field.key)}" alt="${escapeHtml(field.labelEn || field.key)} preview" hidden></div><div class="seller-media-actions"><button type="button" class="seller-btn seller-btn-primary" data-dynamic-camera="${escapeHtml(field.key)}">Camera</button><button type="button" class="seller-btn seller-btn-ghost" data-dynamic-gallery="${escapeHtml(field.key)}">Gallery</button><button type="button" class="seller-btn seller-btn-ghost seller-btn-danger" data-dynamic-remove="${escapeHtml(field.key)}" hidden>Remove</button></div></div></div>`;
    }
    const type = ['text', 'number', 'date', 'textarea'].includes(field.type) ? field.type : 'text';
    const control = type === 'textarea' ? `<textarea data-dynamic-key="${escapeHtml(field.key)}" rows="3" ${field.required ? 'required' : ''}></textarea>` : `<input data-dynamic-key="${escapeHtml(field.key)}" type="${type}" ${field.required ? 'required' : ''} ${field.defaultValue != null ? `value="${escapeHtml(field.defaultValue)}"` : ''}>`;
    return `<label class="seller-field"><span>${label} ${required}</span>${control}${field.helpMm || field.helpEn ? `<small>${escapeHtml(field.helpMm || '')} ${field.helpEn ? '· ' + escapeHtml(field.helpEn) : ''}</small>` : ''}</label>`;
  }

  function ensureWindowControls() {
    const dialog = document.querySelector('#authModal .auth-dialog');
    if (!dialog || dialog.querySelector('[data-seller-window-controls]')) return;
    const controls = document.createElement('div');
    controls.className = 'auth-window-controls seller-window-controls';
    controls.dataset.sellerWindowControls = '1';
    controls.innerHTML = '<button type="button" data-seller-top-minimize aria-label="Minimize seller application">−</button>';
    dialog.prepend(controls);
    controls.querySelector('[data-seller-top-minimize]').addEventListener('click', () => minimize());
  }

  function renderForm() {
    root = document.getElementById('authFields');
    if (!root) throw new Error('Seller form mount point was not found.');
    ensureWindowControls();
    const terms = getTermsConfig();
    const schema = getFormSchema();
    root.className = 'auth-fields seller-request-root';
    root.innerHTML = `
      <div class="seller-request-shell" data-dirty="0">
        <div class="seller-request-topbar">
          <div><span class="seller-eyebrow">SELLER ONBOARDING</span><h4>Become a Seller <small>ဆိုင်ဖွင့်ရန် လျှောက်ထားခြင်း</small></h4><p>အချက်အလက်ကို တစ်ကြိမ်ပဲ ဖြည့်ပြီး draft အဖြစ်သိမ်းထားနိုင်ပါသည်။</p></div>
          <div class="seller-form-status" data-draft-status>Draft ready</div>
        </div>
        <div class="seller-section-list">
          <section class="seller-section"><div class="seller-section-head"><span class="seller-step">01</span><div><h5>Shop Information <small>ဆိုင်အချက်အလက်</small></h5><p>Customer မြင်ရမယ့် အခြေခံဆိုင်အချက်အလက်များ</p></div></div><div class="seller-grid-2"><label class="seller-field"><span>Shop Name / ဆိုင်အမည် <b class="seller-required">Required</b></span><input data-seller-field="shop_name" autocomplete="organization" required placeholder="ဥပမာ — H Market Food Corner"></label><label class="seller-field"><span>Category / အမျိုးအစား <b class="seller-required">Required</b></span><select data-seller-field="category_id" id="sellerCategory" required><option value="">Loading categories…</option></select></label></div><label class="seller-field"><span>Description / ဆိုင်အကြောင်း</span><textarea data-seller-field="description" rows="3" placeholder="ဆိုင်အကြောင်း တိုတိုရှင်းရှင်းရေးပါ"></textarea></label><div class="seller-grid-2"><label class="seller-field"><span>Shop Address / ဆိုင်လိပ်စာ <b class="seller-required">Required</b></span><textarea data-seller-field="address" rows="2" required placeholder="ဆိုင်တည်နေရာ / လိပ်စာ"></textarea></label><label class="seller-field"><span>Shop Phone / ဆိုင်ဖုန်း <b class="seller-required">Required</b></span><input data-seller-field="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="09xxxxxxxxx"></label></div></section>
          <section class="seller-section"><div class="seller-section-head"><span class="seller-step">02</span><div><h5>Shop Photos <small>ဆိုင်ဓာတ်ပုံ</small></h5><p>ဆိုင်ရဲ့မြင်ကွင်းကို ရှင်းလင်းစွာမြင်နိုင်မယ့် ဓာတ်ပုံ ၃–၅ ပုံ ထည့်ပါ</p></div><span class="seller-section-chip">3–5 photos</span></div>${renderPhotoSlots()}</section>
          <section class="seller-section"><div class="seller-section-head"><span class="seller-step">03</span><div><h5>Owner Verification <small>ပိုင်ရှင်အတည်ပြုခြင်း</small></h5><p>Owner Selfie ကို Live Camera ဖြင့်သာ ရိုက်ပါ။ Gallery upload မရပါ။</p></div></div><div class="seller-media-grid">${renderCameraTargetCard('ownerSelfie', 'Owner Selfie / ပိုင်ရှင် Selfie', 'camera-only')}${renderCameraTargetCard('nrcFront', 'NRC Front / မှတ်ပုံတင်ရှေ့', 'document')}${renderCameraTargetCard('nrcBack', 'NRC Back / မှတ်ပုံတင်နောက်', 'document')}</div></section>
          <section class="seller-section"><div class="seller-section-head"><span class="seller-step">04</span><div><h5>Registration / License <small>မှတ်ပုံတင် / လိုင်စင်</small></h5><p>Admin မှ dynamic configuration လုပ်နိုင်ရန် schema-driven region ဖြစ်သည်။</p></div></div><div class="seller-dynamic-grid">${schema.map(renderDynamicField).join('')}</div><div class="seller-grid-2"><label class="seller-field"><span>License Status / လိုင်စင်အခြေအနေ <b class="seller-required">Required</b></span><select data-seller-field="license_status" required><option value="">ရွေးပါ</option><option value="required">လိုအပ် / ရှိ</option><option value="not_applicable">မရှိ / မလိုအပ်</option></select></label><label class="seller-field"><span>License Reason / အကြောင်းပြချက် <span class="seller-optional">Optional</span></span><textarea data-seller-field="license_reason" rows="2" placeholder="မရှိ / မလိုအပ်ပါက အကြောင်းပြချက်"></textarea></label></div>${renderCameraTargetCard('license', 'License / Registration Document', 'document')}</section>
          <section class="seller-section seller-db-gated"><div class="seller-section-head"><span class="seller-step">05</span><div><h5>Payment Account <small>ငွေလက်ခံအကောင့်</small></h5><p>KPay / Wave အနည်းဆုံးတစ်ခု ထည့်ရန်လိုအပ်ပါသည်။ PIN / Password / OTP မတောင်းပါ။</p></div><span class="seller-section-chip seller-chip-gated">Backend storage pending</span></div><div class="seller-payment-grid"><button type="button" class="seller-payment-card" data-payment-toggle="kpay"><span class="seller-payment-icon">K</span><span><strong>KPay</strong><small>KPay Name + Phone</small></span><span class="seller-checkmark">✓</span></button><button type="button" class="seller-payment-card" data-payment-toggle="wave"><span class="seller-payment-icon">W</span><span><strong>Wave</strong><small>Wave Name + Phone</small></span><span class="seller-checkmark">✓</span></button></div><div class="seller-payment-panel" data-payment-panel="kpay" hidden><label class="seller-field"><span>KPay Name / အမည်</span><input data-payment-field="kpay" data-payment-prop="name" type="text" autocomplete="name"></label><label class="seller-field"><span>KPay Phone / ဖုန်း</span><input data-payment-field="kpay" data-payment-prop="phone" type="tel" inputmode="tel"></label></div><div class="seller-payment-panel" data-payment-panel="wave" hidden><label class="seller-field"><span>Wave Name / အမည်</span><input data-payment-field="wave" data-payment-prop="name" type="text" autocomplete="name"></label><label class="seller-field"><span>Wave Phone / ဖုန်း</span><input data-payment-field="wave" data-payment-prop="phone" type="tel" inputmode="tel"></label></div><div data-payment-summary class="seller-mini-note warn">At least one payment account is required.</div><div class="seller-gated-note">ဒီ UI နှင့် local draft storage ကို ယခုအဆင့်တွင် implement လုပ်ထားပါသည်။ Canonical payment storage သည် သီးခြား approved DB schema ပြီးမှ RPC contract သို့ ချိတ်ပါမည်။</div></section>
          <section class="seller-section"><div class="seller-section-head"><span class="seller-step">06</span><div><h5>Terms & Regulations <small>စည်းမျဉ်းစည်းကမ်း</small></h5><p>Submit မလုပ်မီ Terms ကိုဖတ်ပြီး သဘောတူရမည်။</p></div><span class="seller-form-status" data-terms-state>${state.termsAccepted ? 'Agreed' : 'Please read and agree'}</span></div><div class="seller-terms-box"><div class="seller-terms-title"><div><strong>${escapeHtml(terms.titleMm)}</strong><span>${escapeHtml(terms.titleEn)} · v${escapeHtml(terms.version)}</span></div><button type="button" class="seller-btn seller-btn-ghost" data-open-seller-terms>${state.termsRead ? 'Review Terms' : 'Read Terms'}</button></div><label class="seller-terms-check"><input type="checkbox" data-seller-terms ${state.termsAccepted ? 'checked' : ''} disabled><span>Terms & Regulations ကို ဖတ်ရှုပြီး သဘောတူပါသည်။</span></label></div></section>
          <section class="seller-section seller-review-section"><div class="seller-section-head"><span class="seller-step">07</span><div><h5>Review & Submit <small>စစ်ဆေးပြီး တင်သွင်းရန်</small></h5><p>Confirm Submit မလုပ်မီ အချက်အလက်အားလုံးကို စစ်ဆေးနိုင်ပါသည်။</p></div></div><div class="seller-review-grid" data-review-summary></div><div class="seller-submit-note">Pending / Under Review ဖြစ်နေချိန် Seller Request အသစ် မတင်နိုင်ပါ။</div></section>
        </div>
        <div class="seller-form-footer"><div><span class="seller-foot-note">Draft ကို ဤ device တွင် local save လုပ်ထားပါသည်။</span><button type="button" class="seller-link-btn" data-save-draft>Save Draft</button></div><div class="seller-footer-actions"><button type="button" class="seller-btn seller-btn-ghost" data-seller-minimize>− Minimize</button><button type="button" class="seller-btn seller-btn-primary" id="sellerReviewSubmit">Review & Submit</button></div></div>
      </div>`;
    bindFieldEvents();
    renderPaymentState();
    renderTermsState();
    renderAllPreviews();
    refreshReviewSummary();
  }

  function bindFieldEvents() {
    root.querySelectorAll('[data-seller-field],[data-dynamic-key]').forEach(el => {
      el.addEventListener('input', onFieldInput);
      el.addEventListener('change', onFieldInput);
    });
    root.querySelectorAll('[data-payment-field]').forEach(el => {
      el.addEventListener('input', () => {
        const provider = el.dataset.paymentField;
        const prop = el.dataset.paymentProp;
        state.paymentAccounts[provider][prop] = el.value;
        setDirty(true); debouncedDraft(); refreshReviewSummary();
      });
    });
    root.querySelectorAll('[data-payment-toggle]').forEach(btn => btn.addEventListener('click', () => {
      const provider = btn.dataset.paymentToggle;
      state.paymentAccounts[provider].enabled = !state.paymentAccounts[provider].enabled;
      setDirty(true); renderPaymentState(); debouncedDraft(); refreshReviewSummary();
    }));
    root.querySelector('[data-seller-terms]')?.addEventListener('change', e => {
      state.termsAccepted = !!e.target.checked;
      setDirty(true); debouncedDraft(); refreshReviewSummary();
    });
    root.querySelector('[data-save-draft]')?.addEventListener('click', async () => { await saveDraft(); });
    root.querySelector('#sellerReviewSubmit')?.addEventListener('click', () => requestSubmitConfirmation());
  }

  function onFieldInput() {
    setDirty(true); debouncedDraft(); refreshReviewSummary();
  }

  function refreshReviewSummary() {
    const summary = root?.querySelector('[data-review-summary]');
    if (!summary) return;
    const shopName = root.querySelector('[data-seller-field="shop_name"]')?.value?.trim() || '—';
    const photos = state.photos.filter(Boolean).length;
    const selfie = !!state.ownerSelfie;
    const nrc = !!state.nrcFront && !!state.nrcBack;
    const payments = ['kpay','wave'].filter(k => state.paymentAccounts[k].enabled && state.paymentAccounts[k].name.trim() && state.paymentAccounts[k].phone.trim());
    summary.innerHTML = [
      ['Shop', shopName],
      ['Photos', `${photos}/5`],
      ['Owner', selfie ? 'Captured' : 'Missing'],
      ['NRC', nrc ? 'Ready' : 'Missing'],
      ['Payment', payments.length ? payments.map(p => p.toUpperCase()).join(' + ') : 'Required'],
      ['Terms', state.termsAccepted ? 'Agreed' : 'Required']
    ].map(([a,b]) => `<div class="seller-review-item"><span>${escapeHtml(a)}</span><strong>${escapeHtml(b)}</strong></div>`).join('');
  }

  function setMediaPreview(target, snapshot) {
    const img = root?.querySelector(`[data-media-preview="${target}"]`);
    const fileBox = root?.querySelector(`[data-media-file="${target}"]`);
    const fileName = root?.querySelector(`[data-media-file-name="${target}"]`);
    if (!img) return;
    if (img._hmarketRevoke) img._hmarketRevoke();
    const isImage = !!snapshot?.blob && String(snapshot.blob.type || '').startsWith('image/');
    img.hidden = !isImage;
    if (fileBox) fileBox.hidden = !(snapshot && !isImage);
    if (fileName) fileName.textContent = snapshot?.name || 'Document ready';
    if (isImage) img._hmarketRevoke = setPreviewUrl(img, snapshot);
    else img.removeAttribute('src');
    const card = root.querySelector(`[data-media-card="${target}"]`);
    if (card) card.classList.toggle('has-media', !!snapshot);
  }

  function setDynamicPreview(key, snapshot) {
    const img = root?.querySelector(`[data-dynamic-preview="${CSS.escape(key)}"]`);
    if (!img) return;
    if (img._hmarketRevoke) img._hmarketRevoke();
    img._hmarketRevoke = setPreviewUrl(img, snapshot);
  }

  function renderPhotoPreviews() {
    state.photos.forEach((item, index) => {
      const img = root?.querySelector(`[data-photo-preview="${index}"]`);
      if (!img) return;
      if (img._hmarketRevoke) img._hmarketRevoke();
      if (item) img._hmarketRevoke = setPreviewUrl(img, item);
    });
    const badgeEls = root?.querySelectorAll('.seller-cover-badge') || [];
    badgeEls.forEach(el => { el.hidden = el.closest('[data-photo-slot]')?.dataset.photoSlot !== String(state.coverIndex); });
  }

  function renderAllPreviews() {
    if (!root) return;
    setMediaPreview('ownerSelfie', state.ownerSelfie);
    setMediaPreview('nrcFront', state.nrcFront);
    setMediaPreview('nrcBack', state.nrcBack);
    setMediaPreview('license', state.license);
    renderPhotoPreviews();
    for (const [key, value] of Object.entries(state.dynamicFiles)) setDynamicPreview(key, value);
    refreshReviewSummary();
  }

  function rerenderPhotosOnly() {
    const mount = root?.querySelector('[data-photo-widget]');
    if (!mount) return;
    mount.outerHTML = renderPhotoSlots();
    refreshReviewSummary();
  }

  function resetMedia(target) {
    if (target === 'ownerSelfie') state.ownerSelfie = null;
    else if (target === 'nrcFront') state.nrcFront = null;
    else if (target === 'nrcBack') state.nrcBack = null;
    else if (target === 'license') state.license = null;
  }

  function photoCount() { return state.photos.filter(Boolean).length; }

  function validateBaseFields() {
    const requiredSelectors = ['shop_name', 'category_id', 'address', 'phone', 'license_status'];
    for (const key of requiredSelectors) {
      const el = root.querySelector(`[data-seller-field="${CSS.escape(key)}"]`);
      if (!el || !String(el.value || '').trim()) {
        el?.focus();
        throw new Error(`${el?.previousElementSibling?.textContent?.replace('Required','').trim() || key} is required.`);
      }
    }
    if (photoCount() < MIN_PHOTOS || photoCount() > MAX_PHOTOS) throw new Error('Shop Photos must be 3 to 5 photos.');
    if (!state.ownerSelfie) throw new Error('Owner Selfie is required. Please use Live Camera.');
    if (!state.nrcFront || !state.nrcBack) throw new Error('NRC Front and NRC Back are required.');
    const payments = ['kpay','wave'].filter(k => state.paymentAccounts[k].enabled);
    if (!payments.length) throw new Error('Please add at least one KPay or Wave account.');
    for (const provider of payments) {
      if (!state.paymentAccounts[provider].name.trim() || !state.paymentAccounts[provider].phone.trim()) throw new Error(`${provider.toUpperCase()} Name and Phone are required.`);
    }
    const schema = getFormSchema();
    for (const field of schema) {
      if (!field.required) continue;
      if (field.type === 'radio') {
        const checked = root.querySelector(`[data-dynamic-key="${CSS.escape(field.key)}"]:checked`);
        if (!checked) throw new Error(`${field.labelMm || field.key} is required.`);
      } else if (field.type === 'document' || field.type === 'file' || field.type === 'image' || field.type === 'camera') {
        if (!state.dynamicFiles[field.key]) throw new Error(`${field.labelMm || field.key} is required.`);
      } else {
        const el = root.querySelector(`[data-dynamic-key="${CSS.escape(field.key)}"]`);
        if (!el || !String(el.value || '').trim()) throw new Error(`${field.labelMm || field.key} is required.`);
      }
    }
    if (!state.termsAccepted) throw new Error('Please read and agree to the Terms & Regulations.');
  }

  async function checkActiveApplication(client, userId) {
    if (state.activeApplication) return state.activeApplication;
    const { data, error } = await client.from('seller_requests').select('id,status,created_at,shop_name,partner_application_id').eq('user_id', userId).eq('status', 'pending').order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    let mirror = null;
    if (data.partner_application_id) {
      const { data: app, error: appError } = await client.from('partner_applications').select('id,status,created_at').eq('id', data.partner_application_id).maybeSingle();
      if (appError) throw appError;
      mirror = app || null;
    }
    state.activeApplication = { ...data, application_status: mirror?.status || data.status };
    return state.activeApplication;
  }

  function activeApplicationMessage(app) {
    const status = String(app?.application_status || app?.status || 'pending').toLowerCase();
    return status === 'under_review' ? 'Your Seller Application is under review. A new application cannot be submitted yet.' : 'Your Seller Application is pending review. A new application cannot be submitted yet.';
  }

  function showBlockedApplication(app) {
    const dialog = document.createElement('div');
    dialog.className = 'seller-inline-dialog';
    dialog.innerHTML = `<div class="seller-inline-dialog-card"><div class="seller-inline-icon">✓</div><h4>Seller Application already exists</h4><p>${escapeHtml(activeApplicationMessage(app))}</p><div class="seller-inline-meta"><span>Status</span><strong>${escapeHtml(app.application_status || app.status)}</strong></div><div class="seller-inline-actions"><button type="button" class="seller-btn seller-btn-primary" data-inline-close>Close</button></div></div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('click', e => { if (e.target.closest('[data-inline-close]') || e.target === dialog) dialog.remove(); });
  }

  function getSessionFromClient(client) {
    return client.auth.getSession().then(r => r.data?.session || null);
  }

  function assertNotLocked() {
    let lock = null;
    try { lock = JSON.parse(sessionStorage.getItem(SUBMIT_LOCK_KEY) || 'null'); } catch { lock = null; }
    if (lock?.timestamp && Date.now() - lock.timestamp < 10 * 60 * 1000) throw new Error('Seller submission is already in progress. Please wait for the current submission to finish.');
  }

  function setSubmitLock(userId) {
    try { sessionStorage.setItem(SUBMIT_LOCK_KEY, JSON.stringify({ userId, timestamp: Date.now() })); } catch { /* best effort */ }
  }

  function clearSubmitLock() {
    try { sessionStorage.removeItem(SUBMIT_LOCK_KEY); } catch { /* best effort */ }
  }

  async function uploadWithConcurrency(tasks, worker, limit = MAX_UPLOAD_CONCURRENCY) {
    const output = new Array(tasks.length);
    let next = 0;
    async function runWorker() {
      while (true) {
        const index = next++;
        if (index >= tasks.length) return;
        output[index] = await worker(tasks[index], index);
      }
    }
    const count = Math.min(limit, tasks.length || 0);
    await Promise.all(Array.from({ length: count }, runWorker));
    return output;
  }

  async function uploadSnapshot(client, session, snapshot, folder, key) {
    if (!snapshot?.blob) throw new Error(`${key} is missing.`);
    const ext = snapshot.blob.type === 'application/pdf' ? 'pdf' : (snapshot.blob.type === 'image/webp' ? 'webp' : 'jpg');
    const path = `${session.user.id}/seller-request/${folder}/${Date.now()}-${crypto.randomUUID()}-${key}.${ext}`;
    const { data, error } = await client.storage.from('shop-photos').upload(path, snapshot.blob, { upsert: false, contentType: snapshot.blob.type || undefined });
    if (error) throw error;
    return client.storage.from('shop-photos').getPublicUrl(data.path).data.publicUrl;
  }

  async function createCameraOverlay() {
    let overlay = document.getElementById('sellerCameraOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'sellerCameraOverlay';
    overlay.className = 'seller-camera-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `<div class="seller-camera-backdrop"></div><div class="seller-camera-dialog"><div class="seller-camera-head"><div><span class="seller-eyebrow">LIVE CAMERA</span><h4 data-camera-title>Camera</h4><p data-camera-status>Camera permission is requested only when needed.</p></div><button type="button" class="seller-camera-close" data-camera-close>×</button></div><div class="seller-camera-stage"><video autoplay playsinline muted data-camera-video></video><img data-camera-capture-preview alt="Camera preview" hidden><div class="seller-camera-state" data-camera-state>Preparing camera…</div></div><div class="seller-camera-actions"><button type="button" class="seller-btn seller-btn-ghost" data-camera-cancel>Cancel</button><button type="button" class="seller-btn seller-btn-primary" data-camera-capture>Take Photo</button><button type="button" class="seller-btn seller-btn-primary" data-camera-use hidden>Use Photo</button><button type="button" class="seller-btn seller-btn-ghost" data-camera-retake hidden>Retake</button></div></div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function stopCameraStream() {
    const stream = state.camera.stream;
    if (stream) stream.getTracks().forEach(track => track.stop());
    state.camera.stream = null;
    const video = document.querySelector('[data-camera-video]');
    if (video) video.srcObject = null;
  }

  function settleCamera(result, error) {
    const resolve = state.camera.resolve;
    const reject = state.camera.reject;
    stopCameraStream();
    state.camera.target = null;
    state.camera.resolve = null;
    state.camera.reject = null;
    state.camera.capturedBlob = null;
    if (error) reject?.(error); else resolve?.(result);
    const overlay = document.getElementById('sellerCameraOverlay');
    if (overlay) overlay.hidden = true;
  }

  async function openCamera(target, facingMode) {
    const overlay = await createCameraOverlay();
    if (state.camera.stream) stopCameraStream();
    const video = overlay.querySelector('[data-camera-video]');
    const preview = overlay.querySelector('[data-camera-capture-preview]');
    const stateLabel = overlay.querySelector('[data-camera-state]');
    const titleEl = overlay.querySelector('[data-camera-title]');
    const statusEl = overlay.querySelector('[data-camera-status]');
    const captureBtn = overlay.querySelector('[data-camera-capture]');
    const useBtn = overlay.querySelector('[data-camera-use]');
    const retakeBtn = overlay.querySelector('[data-camera-retake]');
    const targetIsSelfie = target === 'ownerSelfie';
    titleEl.textContent = targetIsSelfie ? 'Owner Selfie' : 'Shop Photo';
    statusEl.textContent = targetIsSelfie ? 'Gallery upload is disabled for Owner Selfie.' : 'Live camera capture · photos are compressed before upload.';
    stateLabel.textContent = 'Requesting camera permission…';
    video.hidden = false; preview.hidden = true; captureBtn.hidden = false; useBtn.hidden = true; retakeBtn.hidden = true;
    overlay.hidden = false;

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not support live camera access.');
      state.camera.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode }, width: { ideal: targetIsSelfie ? 1280 : 1920 }, height: { ideal: targetIsSelfie ? 720 : 1080 } }, audio: false });
      video.srcObject = state.camera.stream;
      await video.play().catch(() => {});
      stateLabel.textContent = targetIsSelfie ? 'Position your face inside the frame.' : 'Frame the shop clearly, then take the photo.';
    } catch (error) {
      stopCameraStream();
      stateLabel.textContent = 'Camera unavailable or permission denied.';
      statusEl.textContent = 'Owner Selfie requires live camera capture. Gallery fallback is not available.';
      captureBtn.hidden = true; useBtn.hidden = true; retakeBtn.hidden = true;
      return new Promise((resolve, reject) => {
        state.camera.resolve = resolve; state.camera.reject = reject;
        setTimeout(() => settleCamera(null, new Error(error?.message || 'Camera access is required.')), 250);
      });
    }

    state.camera.target = target;
    return new Promise((resolve, reject) => {
      state.camera.resolve = resolve;
      state.camera.reject = reject;

      const onCapture = async () => {
        try {
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, (targetIsSelfie ? 1400 : 1800) / Math.max(video.videoWidth, video.videoHeight));
          canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
          canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) throw new Error('Camera canvas is not available.');
          if (targetIsSelfie) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const raw = await new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('Could not capture image.')), 'image/jpeg', 0.88));
          const compressed = await compressImage(raw, targetIsSelfie ? SELFIE_IMAGE_MAX : SHOP_IMAGE_MAX, targetIsSelfie ? SELFIE_QUALITY : SHOP_QUALITY);
          state.camera.capturedBlob = compressed;
          preview.src = URL.createObjectURL(compressed);
          preview._sellerPreviewUrl = preview.src;
          video.hidden = true; preview.hidden = false; captureBtn.hidden = true; useBtn.hidden = false; retakeBtn.hidden = false;
          stateLabel.textContent = 'Preview ready. Retake or use this photo.';
          stopCameraStream();
        } catch (error) {
          stateLabel.textContent = error?.message || 'Capture failed.';
        }
      };
      const onUse = () => settleCamera(makeFileSnapshot(null, state.camera.capturedBlob), null);
      const onRetake = async () => {
        if (preview._sellerPreviewUrl) { URL.revokeObjectURL(preview._sellerPreviewUrl); preview._sellerPreviewUrl = null; }
        video.hidden = false; preview.hidden = true; captureBtn.hidden = false; useBtn.hidden = true; retakeBtn.hidden = true; stateLabel.textContent = 'Requesting camera permission…';
        try {
          state.camera.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode } }, audio: false });
          video.srcObject = state.camera.stream; await video.play().catch(() => {}); stateLabel.textContent = 'Camera ready.';
        } catch (error) { settleCamera(null, new Error(error?.message || 'Camera access is required.')); }
      };
      captureBtn.onclick = onCapture; useBtn.onclick = onUse; retakeBtn.onclick = onRetake;
      overlay.querySelectorAll('[data-camera-cancel],[data-camera-close]').forEach(btn => btn.onclick = () => settleCamera(null, new Error('Camera cancelled.')));
      overlay.querySelector('.seller-camera-backdrop').onclick = () => settleCamera(null, new Error('Camera cancelled.'));
    });
  }

  function openGalleryFile(accept = 'image/*,.pdf') {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.style.position = 'fixed'; input.style.left = '-99999px';
      document.body.appendChild(input);
      input.onchange = () => { const file = input.files?.[0] || null; input.remove(); resolve(file); };
      input.click();
    });
  }

  async function handlePhotoGallery(index) {
    const file = await openGalleryFile('image/*');
    if (!file) return;
    state.photos[index] = await prepareImageFile(file, 'shop');
    state.coverIndex = photoCount() === 1 ? index : state.coverIndex;
    setDirty(true); rerenderPhotosOnly(); renderPhotoPreviews(); debouncedDraft();
  }

  async function handlePhotoCamera(index) {
    try {
      const snapshot = await openCamera(`shop-${index}`, 'environment');
      state.photos[index] = snapshot;
      state.coverIndex = photoCount() === 1 ? index : state.coverIndex;
      setDirty(true); rerenderPhotosOnly(); renderPhotoPreviews(); debouncedDraft();
    } catch (error) {
      if (!/cancelled/i.test(error?.message || '')) showSellerError(error?.message || 'Camera capture failed.');
    }
  }

  async function handleMediaCamera(target) {
    try {
      const snapshot = await openCamera(target, target === 'ownerSelfie' ? 'user' : 'environment');
      state[target] = snapshot;
      setMediaPreview(target, snapshot); setDirty(true); debouncedDraft(); refreshReviewSummary();
    } catch (error) {
      if (!/cancelled/i.test(error?.message || '')) showSellerError(error?.message || 'Camera capture failed.');
    }
  }

  async function handleMediaGallery(target) {
    if (target === 'ownerSelfie') return;
    const accept = target === 'license' ? 'image/*,.pdf' : 'image/*';
    const file = await openGalleryFile(accept);
    if (!file) return;
    state[target] = String(file.type || '').startsWith('image/') ? await prepareImageFile(file, 'document') : prepareNonImageFile(file);
    setMediaPreview(target, state[target]); setDirty(true); debouncedDraft(); refreshReviewSummary();
  }

  async function handleDynamicGallery(key, field) {
    const file = await openGalleryFile(field.accept || 'image/*,.pdf');
    if (!file) return;
    state.dynamicFiles[key] = String(file.type || '').startsWith('image/') ? await prepareImageFile(file, 'document') : prepareNonImageFile(file);
    setDynamicPreview(key, state.dynamicFiles[key]); setDirty(true); debouncedDraft();
    root.querySelector(`[data-dynamic-remove="${CSS.escape(key)}"]`)?.removeAttribute('hidden');
  }

  async function handleDynamicCamera(key) {
    try {
      const snapshot = await openCamera(key, 'environment');
      state.dynamicFiles[key] = snapshot; setDynamicPreview(key, snapshot); setDirty(true); debouncedDraft();
      root.querySelector(`[data-dynamic-remove="${CSS.escape(key)}"]`)?.removeAttribute('hidden');
    } catch (error) {
      if (!/cancelled/i.test(error?.message || '')) showSellerError(error?.message || 'Camera capture failed.');
    }
  }

  function showSellerError(message) {
    const target = document.getElementById('authMessage');
    if (!target) return;
    target.textContent = message;
    target.className = 'auth-message error';
  }

  function showSellerSuccess(message) {
    const target = document.getElementById('authMessage');
    if (!target) return;
    target.textContent = message;
    target.className = 'auth-message success';
  }

  function collectPayload() {
    const get = key => root.querySelector(`[data-seller-field="${CSS.escape(key)}"]`)?.value?.trim() || null;
    const dynamicValues = {};
    root.querySelectorAll('[data-dynamic-key]').forEach(el => {
      if (el.type === 'radio') {
        if (el.checked) dynamicValues[el.dataset.dynamicKey] = el.value;
      } else dynamicValues[el.dataset.dynamicKey] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return {
      shop_name: get('shop_name'),
      category_id: get('category_id'),
      description: get('description'),
      address: get('address'),
      phone: get('phone'),
      license_status: get('license_status'),
      license_reason: get('license_reason'),
      payment_accounts: state.paymentAccounts,
      dynamic_values: dynamicValues,
      form_version: 'frontend-seller-request-v1'
    };
  }

  function showSubmitConfirm() {
    let dialog = document.getElementById('sellerSubmitConfirm');
    if (dialog) dialog.remove();
    dialog = document.createElement('div');
    dialog.id = 'sellerSubmitConfirm';
    dialog.className = 'seller-close-confirm';
    dialog.innerHTML = `<div class="seller-close-backdrop"></div><div class="seller-close-dialog"><div class="seller-confirm-icon">✓</div><h4>Confirm Seller Application</h4><p>Are you sure you want to submit? After submission, you cannot submit another Seller Request while this application is pending or under review.</p><div class="seller-confirm-actions"><button type="button" class="seller-btn seller-btn-ghost" data-submit-cancel>Cancel</button><button type="button" class="seller-btn seller-btn-primary" data-submit-confirm>Confirm & Submit</button></div></div>`;
    document.body.appendChild(dialog);
    return new Promise(resolve => {
      dialog.querySelector('[data-submit-cancel]').onclick = () => { dialog.remove(); resolve(false); };
      dialog.querySelector('[data-submit-confirm]').onclick = () => { dialog.remove(); resolve(true); };
      dialog.querySelector('.seller-close-backdrop').onclick = () => { dialog.remove(); resolve(false); };
    });
  }

  async function requestSubmitConfirmation() {
    if (state.submitInFlight) return;
    state.submitInFlight = true;
    try {
      const client = await window.HMARKET_READY;
      if (!client) throw new Error('Supabase is not connected.');
      const session = await getSessionFromClient(client);
      if (!session) throw new Error('Login required first.');
      assertNotLocked();
      const active = await checkActiveApplication(client, session.user.id);
      if (active) { showBlockedApplication(active); return; }
      validateBaseFields();
      // Payment and dynamic fields intentionally stay local-only until their approved DB schema exists.
      const confirm = await showSubmitConfirm();
      if (!confirm) return;
      throw new Error('Seller application backend is not yet enabled for Payment Account / dynamic Registration storage. The form is ready, but final submission is paused until that schema is approved. Your draft is preserved.');
    } catch (error) {
      showSellerError(error?.message || 'Please review the form.');
    } finally {
      state.submitInFlight = false;
    }
  }

  async function handleSubmit() {
    await requestSubmitConfirmation();
    return { status: 'handled' };
  }

  async function requestClose() {
    stopCameraStream();
    if (!state.dirty) return true;
    await saveDraft();
    let dialog = document.getElementById('sellerCloseConfirm');
    if (dialog) dialog.remove();
    dialog = document.createElement('div');
    dialog.id = 'sellerCloseConfirm';
    dialog.className = 'seller-close-confirm';
    dialog.innerHTML = `<div class="seller-close-backdrop"></div><div class="seller-close-dialog"><div class="seller-confirm-icon">!</div><h4>Exit application?</h4><p>Your entered information is saved as a draft on this device.</p><div class="seller-draft-pill">Draft saved</div><div class="seller-confirm-actions"><button type="button" class="seller-btn seller-btn-ghost" data-close-cancel>Cancel</button><button type="button" class="seller-btn seller-btn-danger" data-close-confirm>Exit</button></div></div>`;
    document.body.appendChild(dialog);
    return new Promise(resolve => {
      dialog.querySelector('[data-close-cancel]').onclick = () => { dialog.remove(); resolve(false); };
      dialog.querySelector('[data-close-confirm]').onclick = () => { dialog.remove(); resolve(true); };
      dialog.querySelector('.seller-close-backdrop').onclick = () => { dialog.remove(); resolve(false); };
    });
  }

  function minimize() {
    stopCameraStream();
    saveDraft();
    const modal = document.getElementById('authModal');
    if (modal) modal.hidden = true;
    let tray = document.getElementById('sellerMinimizedTray');
    if (!tray) {
      tray = document.createElement('div');
      tray.id = 'sellerMinimizedTray';
      tray.className = 'auth-minimized-tray seller-minimized-tray';
      tray.innerHTML = `<button type="button" class="auth-minimized-restore" data-seller-restore><strong>Seller Application</strong><span>Restore</span></button><button type="button" class="auth-minimized-close" data-seller-tray-close aria-label="Close seller application">×</button>`;
      document.body.appendChild(tray);
    }
    tray.hidden = false;
  }

  function restore() {
    const modal = document.getElementById('authModal');
    if (modal) modal.hidden = false;
    const tray = document.getElementById('sellerMinimizedTray');
    if (tray) tray.hidden = true;
    renderAllPreviews();
  }

  function cleanup() {
    stopCameraStream();
    const overlay = document.getElementById('sellerCameraOverlay'); if (overlay) overlay.remove();
    const tray = document.getElementById('sellerMinimizedTray'); if (tray) tray.remove();
    clearSubmitLock();
  }

  async function mount() {
    await ensureStyle();
    if (!root || !root.querySelector('.seller-request-shell')) renderForm();
    await loadDraft();
    try {
      const client = await window.HMARKET_READY;
      if (client) await loadCategories(client);
    } catch (error) { console.warn('[HMarket Seller] category load skipped:', error); }
    return api;
  }

  async function loadCategories(client) {
    const select = root?.querySelector('#sellerCategory');
    if (!select) return;
    const cached = window.HMARKET_SELLER_CATEGORY_CACHE;
    if (Array.isArray(cached) && cached.length) {
      select.innerHTML = '<option value="">Select category</option>' + cached.map(x => `<option value="${escapeHtml(x.id)}">${escapeHtml(x.name_mm)} / ${escapeHtml(x.name_en)}</option>`).join('');
      return;
    }
    const { data, error } = await client.from('categories').select('id,name_mm,name_en').eq('is_active', true).order('sort_order');
    if (error) throw error;
    window.HMARKET_SELLER_CATEGORY_CACHE = data || [];
    select.innerHTML = '<option value="">Select category</option>' + (data || []).map(x => `<option value="${escapeHtml(x.id)}">${escapeHtml(x.name_mm)} / ${escapeHtml(x.name_en)}</option>`).join('');
    const draftCategory = (() => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')?.data?.category_id; } catch { return null; } })();
    if (draftCategory) select.value = draftCategory;
  }

  function openTerms() {
    const terms = getTermsConfig();
    let dialog = document.getElementById('sellerTermsDialog');
    if (dialog) dialog.remove();
    dialog = document.createElement('div');
    dialog.id = 'sellerTermsDialog';
    dialog.className = 'seller-terms-overlay';
    dialog.innerHTML = `<div class="seller-close-backdrop"></div><div class="seller-terms-dialog"><button type="button" class="seller-camera-close" data-terms-dialog-close>×</button><span class="seller-eyebrow">TERMS v${escapeHtml(terms.version)}</span><h4>${escapeHtml(terms.titleMm)}</h4><p class="seller-terms-en">${escapeHtml(terms.titleEn)}</p><div class="seller-terms-scroll">${(terms.sections || []).map((s, i) => `<article><h5>${i + 1}. ${escapeHtml(s.titleMm || s.titleEn)}</h5><p>${escapeHtml(s.bodyMm || '')}</p><small>${escapeHtml(s.titleEn || '')} · ${escapeHtml(s.bodyEn || '')}</small></article>`).join('')}</div><div class="seller-terms-footer"><label><input type="checkbox" data-terms-dialog-agree><span>ဖတ်ရှုပြီး သဘောတူပါသည်။ / I have read and agree.</span></label><button type="button" class="seller-btn seller-btn-primary" data-terms-dialog-continue disabled>Agree & Continue</button></div></div>`;
    document.body.appendChild(dialog);
    const scroll = dialog.querySelector('.seller-terms-scroll');
    const agree = dialog.querySelector('[data-terms-dialog-agree]');
    const cont = dialog.querySelector('[data-terms-dialog-continue]');
    const maybeEnable = () => { if (scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 12) cont.disabled = !agree.checked; };
    scroll.addEventListener('scroll', maybeEnable);
    agree.addEventListener('change', () => { if (scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 12) cont.disabled = !agree.checked; });
    setTimeout(maybeEnable, 0);
    dialog.querySelector('[data-terms-dialog-close]').onclick = () => dialog.remove();
    dialog.querySelector('.seller-close-backdrop').onclick = () => dialog.remove();
    cont.onclick = () => {
      state.termsRead = true; state.termsAccepted = true; setDirty(true); renderTermsState(); debouncedDraft(); dialog.remove(); refreshReviewSummary();
    };
  }

  document.addEventListener('click', async event => {
    const el = event.target.closest('[data-seller-camera]');
    if (el) { event.preventDefault(); await handleMediaCamera(el.dataset.sellerCamera); return; }
    const gallery = event.target.closest('[data-seller-gallery]');
    if (gallery) { event.preventDefault(); await handleMediaGallery(gallery.dataset.sellerGallery); return; }
    const remove = event.target.closest('[data-seller-remove]');
    if (remove) { event.preventDefault(); resetMedia(remove.dataset.sellerRemove); setMediaPreview(remove.dataset.sellerRemove, null); setDirty(true); debouncedDraft(); refreshReviewSummary(); return; }
    const pcam = event.target.closest('[data-photo-camera]'); if (pcam) { event.preventDefault(); await handlePhotoCamera(Number(pcam.dataset.photoCamera)); return; }
    const pgal = event.target.closest('[data-photo-gallery]'); if (pgal) { event.preventDefault(); await handlePhotoGallery(Number(pgal.dataset.photoGallery)); return; }
    const prep = event.target.closest('[data-photo-replace]'); if (prep) { event.preventDefault(); await handlePhotoGallery(Number(prep.dataset.photoReplace)); return; }
    const pret = event.target.closest('[data-photo-retake]'); if (pret) { event.preventDefault(); await handlePhotoCamera(Number(pret.dataset.photoRetake)); return; }
    const prm = event.target.closest('[data-photo-remove]'); if (prm) { event.preventDefault(); const index = Number(prm.dataset.photoRemove); state.photos[index] = null; const remaining = state.photos.map((x,i)=>x?i:-1).filter(i=>i>=0); state.coverIndex = remaining.includes(state.coverIndex) ? state.coverIndex : (remaining[0] ?? 0); rerenderPhotosOnly(); setDirty(true); debouncedDraft(); return; }
    const pcv = event.target.closest('[data-photo-cover]'); if (pcv) { event.preventDefault(); state.coverIndex = Number(pcv.dataset.photoCover); rerenderPhotosOnly(); setDirty(true); debouncedDraft(); return; }
    const dcam = event.target.closest('[data-dynamic-camera]'); if (dcam) { event.preventDefault(); await handleDynamicCamera(dcam.dataset.dynamicCamera); return; }
    const dgal = event.target.closest('[data-dynamic-gallery]'); if (dgal) { event.preventDefault(); const field = getFormSchema().find(x => x.key === dgal.dataset.dynamicGallery) || {}; await handleDynamicGallery(dgal.dataset.dynamicGallery, field); return; }
    const drm = event.target.closest('[data-dynamic-remove]'); if (drm) { event.preventDefault(); delete state.dynamicFiles[drm.dataset.dynamicRemove]; setDynamicPreview(drm.dataset.dynamicRemove, null); drm.hidden = true; setDirty(true); debouncedDraft(); return; }
    const terms = event.target.closest('[data-open-seller-terms]'); if (terms) { event.preventDefault(); openTerms(); return; }
    const topMin = event.target.closest('[data-seller-top-minimize]'); if (topMin) { event.preventDefault(); minimize(); return; }
    const minimizeBtn = event.target.closest('[data-seller-minimize]'); if (minimizeBtn) { event.preventDefault(); minimize(); return; }
    const review = event.target.closest('#sellerReviewSubmit'); if (review) { event.preventDefault(); requestSubmitConfirmation(); return; }
    const restoreBtn = event.target.closest('[data-seller-restore]'); if (restoreBtn) { event.preventDefault(); restore(); return; }
    const trayClose = event.target.closest('[data-seller-tray-close]'); if (trayClose) { event.preventDefault(); const allowed = await requestClose(); if (allowed) { cleanup(); document.getElementById('authModal')?.setAttribute('hidden', ''); } return; }
  });

  const api = {
    MODULE,
    mount,
    handleSubmit,
    requestClose,
    minimize,
    restore,
    cleanup,
    requestSubmitConfirmation,
    getState: () => ({ dirty: state.dirty, submitInFlight: state.submitInFlight, photos: photoCount(), termsAccepted: state.termsAccepted })
  };

  window.HMARKET_SELLER_FORM = api;
})();
