(function(){
  const $=id=>document.getElementById(id);
  let mode='login';
  let resetRecovery=false;
  const modal=$('authModal');
  const title=$('authTitle'), message=$('authMessage'), fields=$('authFields'), submit=$('authSubmit'), form=$('authForm');
  let termsAccepted=false;
  let termsMode='seller';
  const TERMS_VERSION='2026-09-27-v1';
  const termsModal=$('termsModal'), termsTitle=$('termsTitle'), termsBody=$('termsBody'), termsAgree=$('termsAgreeBtn');
  let sellerModule=null;
  let sellerModulePromise=null;
  const AUTH_SCRIPT_BASE = (()=>{ try { return document.currentScript?.src ? new URL(document.currentScript.src, document.baseURI) : new URL('../shared/auth.js', document.baseURI); } catch { return new URL(location.href); } })();
  async function loadSellerModule(){
    if(window.HMARKET_SELLER_FORM) return window.HMARKET_SELLER_FORM;
    if(sellerModulePromise) return sellerModulePromise;
    const moduleUrl=new URL('../seller/seller-request/seller-request-form.js', AUTH_SCRIPT_BASE).href;
    sellerModulePromise=import(moduleUrl).then(()=>{ sellerModule=window.HMARKET_SELLER_FORM; if(!sellerModule) throw new Error('Seller Request module failed to initialize.'); return sellerModule; }).catch(err=>{ sellerModulePromise=null; throw err; });
    return sellerModulePromise;
  }
  const termsContent={
    customer:{title:'Customer Terms & Regulations',body:`<h4>1. Account</h4><p>Account အချက်အလက်များကို မှန်ကန်စွာ ပေးရပါမည်။ Password နှင့် account security ကို ကိုယ်တိုင်ထိန်းသိမ်းရပါမည်။</p><h4>2. Orders & Payments</h4><p>Order အချက်အလက်၊ delivery address နှင့် payment information များကို မှန်ကန်စွာ ပေးရပါမည်။</p><h4>3. Platform Use</h4><p>လိမ်လည်မှု၊ မမှန်ကန်သောအသုံးပြုမှုနှင့် အခြားသူ၏ account ကို မသင့်လျော်စွာ အသုံးပြုခြင်း မပြုရပါ။</p><h4>4. Privacy</h4><p>H MARKET မှ ဝန်ဆောင်မှုပေးရန် လိုအပ်သော account/order information ကို သက်ဆိုင်ရာ privacy rules အတိုင်း ကိုင်တွယ်ပါမည်။</p>`},
    seller:{title:'Seller Terms & Regulations',body:`<h4>1. Business Information</h4><p>ဆိုင်အမည်၊ လိပ်စာ၊ ဖုန်းနံပါတ်၊ ပိုင်ရှင်/တာဝန်ရှိသူ အချက်အလက်များကို မှန်ကန်စွာ ပေးရပါမည်။</p><h4>2. Products & Service</h4><p>ကုန်ပစ္စည်းအမည်၊ ဈေးနှုန်း၊ ပုံ၊ stock နှင့် ဖော်ပြချက်များ မှန်ကန်ရပါမည်။ သက်ဆိုင်ရာဥပဒေအရ လိုင်စင်လိုအပ်သော လုပ်ငန်းများသည် သက်ဆိုင်ရာအထောက်အထားကို တင်ပြရပါမည်။</p><h4>3. Orders</h4><p>လက်ခံထားသော order များကို သတ်မှတ်ထားသော အချိန်အတွင်း စီမံပေးရပါမည်။</p><h4>4. Customer Safety</h4><p>ဖောက်သည်၏ ကိုယ်ရေးအချက်အလက်များကို လုံခြုံစွာ ကိုင်တွယ်ရပါမည်။</p><h4>5. Verification</h4><p>H MARKET မှ စစ်ဆေးရန် တောင်းဆိုသော အချက်အလက်များကို မှန်ကန်စွာ တင်ပြရပါမည်။</p><h4>6. Suspension</h4><p>မမှန်ကန်သောအချက်အလက်၊ လိမ်လည်မှု သို့မဟုတ် စည်းမျဉ်းဖောက်ဖျက်မှုရှိပါက account/business access ကို စစ်ဆေးခြင်း သို့မဟုတ် ရပ်ဆိုင်းခြင်း ပြုလုပ်နိုင်ပါသည်။</p>`},
    accommodation:{title:'Accommodation Partner Terms & Regulations',body:`<h4>1. Property Information</h4><p>Property Name၊ Location၊ ဖုန်းနံပါတ်နှင့် Accommodation Type ကို မှန်ကန်စွာ ထည့်သွင်းရပါမည်။</p><h4>2. Accommodation Type</h4><p>Hotel, Resort, Guesthouse, Hostel, Homestay, Serviced Apartment, Villa, Lodge သို့မဟုတ် Other ကို သက်ဆိုင်ရာအတိုင်း ရွေးချယ်ရပါမည်။</p><h4>3. Licence & Verification</h4><p>သက်ဆိုင်ရာ lodging/registration/licence နှင့် ပိုင်ရှင်/တာဝန်ရှိသူ အထောက်အထားများကို လိုအပ်သလို တင်ပြရပါမည်။</p><h4>4. Booking & Guest Service</h4><p>Availability၊ ဈေးနှုန်းနှင့် booking အချက်အလက်များကို မှန်ကန်စွာ စီမံရပါမည်။</p><h4>5. Guest Safety & Privacy</h4><p>ဧည့်သည်လုံခြုံရေးနှင့် privacy ကို ကာကွယ်ရပါမည်။</p>`},
    delivery:{title:'Delivery Partner Terms & Regulations',body:`<h4>1. Partner Information</h4><p>Delivery Partner / Team Name၊ တာဝန်ရှိသူနှင့် ဆက်သွယ်ရန်အချက်အလက်များကို မှန်ကန်စွာ ပေးရပါမည်။</p><h4>2. Service Area</h4><p>H MARKET မှ ဖွင့်ထားသော Location နှင့် Service Area များအတွင်းသာ ဝန်ဆောင်မှုပေးရပါမည်။</p><h4>3. Riders & Vehicles</h4><p>တင်ပြထားသော rider နှင့် vehicle အချက်အလက်များကို မှန်ကန်စွာ ထိန်းသိမ်းရပါမည်။</p><h4>4. Customer & Order Safety</h4><p>Customer၊ order နှင့် address အချက်အလက်များကို လုံခြုံစွာ ကိုင်တွယ်ရပါမည်။</p><h4>5. Pricing</h4><p>Delivery fee နှင့် partner rate များကို H MARKET Admin က သတ်မှတ်မည်ဖြစ်ပြီး Partner ကိုယ်တိုင် customer pricing မသတ်မှတ်ရပါ။</p><h4>6. Verification & Suspension</h4><p>H MARKET မှ စစ်ဆေးရန် တောင်းဆိုသော စာရွက်စာတမ်းများကို မှန်ကန်စွာ တင်ပြရပါမည်။</p>`},
    rider:{title:'Rider Terms & Regulations',body:`<h4>1. Identity</h4><p>အမည်၊ ဖုန်း၊ NRC နှင့် ဆိုင်ကယ်/ယာဉ်အချက်အလက်များ မှန်ကန်ရပါမည်။</p><h4>2. Road Safety</h4><p>လမ်းစည်းကမ်းနှင့် လုံခြုံရေးစည်းမျဉ်းများကို လိုက်နာရပါမည်။</p><h4>3. Delivery Handling</h4><p>Order ပစ္စည်းများကို သတ်မှတ်ထားသော customer ထံ လုံခြုံစွာ ပို့ဆောင်ရပါမည်။</p><h4>4. Customer Privacy</h4><p>Customer ၏ လိပ်စာ၊ ဖုန်းနှင့် order information များကို မသင့်လျော်စွာ အသုံးမပြုရပါ။</p><h4>5. Suspension</h4><p>လိမ်လည်မှု၊ order အလွဲသုံးစားမှု သို့မဟုတ် safety rule ချိုးဖောက်မှုများရှိပါက rider access ကို စစ်ဆေး/ရပ်ဆိုင်းနိုင်ပါသည်။</p>`}
  };
  const PENDING_PARTNER_KEY='hmarket_pending_partner_mode';
  let pendingPartnerMode=sessionStorage.getItem(PENDING_PARTNER_KEY)||null;
  function open(m){ mode=m; if(['register','accommodation','rider','delivery'].includes(m))termsAccepted=false; if(!modal)return; modal.hidden=false; render(); }
  function close(){if(modal)modal.hidden=true;}
  async function isLoggedIn(){try{const c=await client(); if(!c)return false; const {data:{session}}=await c.auth.getSession(); return !!session;}catch{return false;}}
  async function requireLoginForPartner(nextMode){
    if(await isLoggedIn()){ open(nextMode); return true; }
    pendingPartnerMode=nextMode;
    sessionStorage.setItem(PENDING_PARTNER_KEY,nextMode);
    const gate=$('authChoiceModal'); if(gate)gate.hidden=false;
    return false;
  }
  function closeAuthChoice(){const gate=$('authChoiceModal'); if(gate)gate.hidden=true;}
  function partnerAfterLogin(){
    const next=pendingPartnerMode||sessionStorage.getItem(PENDING_PARTNER_KEY);
    if(!next)return;
    pendingPartnerMode=null;
    sessionStorage.removeItem(PENDING_PARTNER_KEY);
    open(next);
  }
  function input(name,label,type='text',extra=''){
    const pass = type==='password';
    return `<label>${label}<span class="${pass?'password-wrap':''}" style="position:relative;display:block;"><input style="padding-right:45px;" name="${name}" type="${type}" ${extra} required>${pass?'<button type="button" class="password-toggle" aria-label="Show password" data-password-toggle style="position:absolute;right:12px;top:50%;transform:translateY(-50%);border:0;background:none;cursor:pointer;font-size:18px;">👁️</button>':''}</span></label>`;
  }
  function setupPasswordToggles(){
    document.querySelectorAll('[data-password-toggle]').forEach(btn=>{
      if(btn.dataset.ready)return;
      btn.dataset.ready='1';
      btn.addEventListener('click',()=>{
        const input=btn.parentElement.querySelector('input');
        if(!input)return;
        const show=input.type==='password';
        input.type=show?'text':'password';
        btn.textContent=show?'🙈':'👁️';
        btn.setAttribute('aria-label',show?'Hide password':'Show password');
      });
    });
  }
  async function client(){return await window.HMARKET_READY}
  // Always redirect back to the page the user is currently on.
  // Works for /src/customer/... (localhost), /customer/... and production domains.
  function authRedirectUrl(){
    return location.origin + location.pathname;
  }
  function setMessage(text,type='info'){
    if(!message)return;
    message.textContent=text||'';
    message.className=`auth-message ${type}`;
  }
  function isRecoverySession(){
    const hash=new URLSearchParams(location.hash.replace(/^#/,'')).get('type');
    const query=new URLSearchParams(location.search).get('type');
    return hash==='recovery' || query==='recovery' || resetRecovery;
  }
  function openTerms(type){
    termsMode=type; const t=termsContent[type]||termsContent.seller;
    if(termsTitle)termsTitle.textContent=t.title;
    if(termsBody)termsBody.innerHTML=t.body+'<hr><p><b>H MARKET</b> Terms & Regulations are subject to applicable law and may be updated with notice.</p>';
    if(termsAgree){termsAgree.disabled=true;termsAgree.dataset.ready='0';}
    if(termsBody){termsBody.onscroll=()=>{if(termsBody.scrollTop+termsBody.clientHeight>=termsBody.scrollHeight-8){termsAgree.disabled=false;termsAgree.dataset.ready='1';}};}
    setTimeout(()=>{if(termsBody && termsBody.scrollHeight<=termsBody.clientHeight){termsAgree.disabled=false;termsAgree.dataset.ready='1';}},0);
    if(termsModal)termsModal.hidden=false;
  }
  function closeTerms(){if(termsModal)termsModal.hidden=true;}
  function applicationFooter(type){
    return `<div class="auth-hint">Form ၏အောက်ဆုံးမှာ စည်းမျဉ်းစည်းကမ်းကို ဖတ်ပြီးမှ သဘောတူနိုင်ပါသည်။</div><button type="button" class="terms-read" data-terms-open="${type}">📄 Read & Agree — ${termsContent[type].title}</button><label class="terms-check"><input type="checkbox" name="terms_accepted" id="termsAccepted" ${termsAccepted?'checked':''} disabled><span>H MARKET ၏ စည်းမျဉ်းစည်းကမ်းများကို ဖတ်ရှုပြီး သဘောတူပါသည်။</span></label>`;
  }
  function render(){
    const map={login:['Login','H MARKET account ဝင်ရန်'],register:['Create Account','Customer account အသစ်ဖန်တီးရန်'],seller:['Become a Seller','Seller အဖြစ် လျှောက်ထားရန်'],accommodation:['Become an Accommodation Partner','Accommodation Partner အဖြစ် လျှောက်ထားရန်'],rider:['Become a Rider Partner','Rider အဖြစ် လျှောက်ထားရန်'],delivery:['Become a Delivery Partner','Partner with H MARKET to deliver orders in your city.']};
    if(mode==='reset'){
      title.textContent='Set New Password'; setMessage('Enter your new password.','info');
      fields.innerHTML=input('password','New Password','password','autocomplete="new-password" minlength="6"')+input('confirm_password','Confirm Password','password','autocomplete="new-password" minlength="6"'); submit.textContent='Update Password'; return;
    }
    if(mode==='forgot'){
      title.textContent='Forgot Password'; setMessage('Enter your email and we will send you a password reset link.','info'); fields.innerHTML=input('email','Email','email','autocomplete="email"'); submit.textContent='Send Reset Link'; return;
    }
    title.textContent=map[mode][0]; setMessage(map[mode][1],'info');
    if(submit) submit.hidden = mode==='delivery' || mode==='seller';
    if(mode==='login') fields.innerHTML=input('email','Email','email','autocomplete="email"')+input('password','Password','password','autocomplete="current-password"')+`<button type="button" class="auth-link" id="forgotPasswordBtn">Forgot Password?</button><div class="auth-divider">or</div><div class="oauth-row"><button type="button" class="auth-secondary" data-oauth="google">Continue with Google</button><button type="button" class="auth-secondary" data-oauth="facebook">Continue with Facebook</button></div><button type="button" class="auth-secondary" id="createAccountBtn" style="margin-top:8px">Create Account</button>`;
    if(mode==='register') fields.innerHTML=input('name','Full Name')+input('phone','Phone')+input('email','Email','email')+input('password','Password','password','minlength="6"')+input('confirm_password','Confirm Password','password','minlength="6"')+applicationFooter('customer');
    if(mode==='seller'){ fields.innerHTML='<div class="seller-module-loading">Loading Seller Request…</div>'; loadSellerModule().then(mod=>mod.mount()).catch(err=>{setMessage(err.message||'Seller Request module failed to load','error');}); }
    if(mode==='accommodation'){
      const accommodationTypes=[['hotel','🏨 Hotel'],['resort','🌴 Resort'],['guesthouse','🏠 Guesthouse'],['hostel','🛏️ Hostel'],['homestay','🏡 Homestay'],['serviced_apartment','🏢 Serviced Apartment'],['villa','🏘️ Villa'],['lodge','🌿 Lodge'],['other','🏕️ Other']];
      fields.innerHTML=input('business_name','Property Name')+`<label>Accommodation Type<select name="accommodation_type" required><option value="">ရွေးပါ</option>${accommodationTypes.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>`+`<label>Property Location<select name="location_id" id="accommodationLocation" required><option value="">Loading locations…</option></select></label>`+input('phone','Phone')+input('address','Address')+input('room_count','Room / Bed Count','number','min="1"')+`<label>Description<textarea name="description"></textarea></label><label>Property Photos (3–5 photos)<input type="file" name="property_photos" accept="image/*" multiple required></label><label>Owner Selfie<input type="file" name="owner_selfie" accept="image/*" capture="user" required></label><label>NRC / မှတ်ပုံတင် အရှေ့ဘက်<input type="file" name="nrc_front" accept="image/*" required></label><label>NRC / မှတ်ပုံတင် အနောက်ဘက်<input type="file" name="nrc_back" accept="image/*" required></label><label>Licence / Registration Status<select name="license_status" required><option value="">ရွေးပါ</option><option value="required">ရှိ</option><option value="not_applicable">မရှိ / မလိုအပ်</option></select></label><label>Licence မရှိ / မလိုအပ်ပါက အကြောင်းပြချက်<textarea name="license_reason" placeholder="အကြောင်းပြချက်ရေးပါ"></textarea></label><label>Licence / Registration Document<input type="file" name="license_file" accept="image/*,.pdf"></label>`+applicationFooter('accommodation');
    }
    if(mode==='rider') fields.innerHTML=input('vehicle_type','Vehicle Type')+input('vehicle_number','Vehicle Number')+input('phone','Phone')+input('address','Address')+`<label>Rider Selfie<input type="file" name="owner_selfie" accept="image/*" capture="user" required></label><label>NRC / မှတ်ပုံတင် အရှေ့ဘက်<input type="file" name="nrc_front" accept="image/*" required></label><label>NRC / မှတ်ပုံတင် အနောက်ဘက်<input type="file" name="nrc_back" accept="image/*" required></label><label>Driving Licence<input type="file" name="license_file" accept="image/*,.pdf" required></label>`+applicationFooter('rider');
    if(mode==='delivery') renderDeliveryForm();
    submit.textContent=mode==='login'?'Login':mode==='register'?'Create Account':mode==='forgot'?'Send Reset Link':mode==='reset'?'Update Password':mode==='seller'?'Submit Seller Application':mode==='accommodation'?'Submit Accommodation Application':mode==='rider'?'Submit Rider Application':'🚚 Submit Delivery Partner Request';
    if(mode==='accommodation') loadAccommodationLocations();
    if(mode==='delivery') loadDeliveryLocations();
    setupPasswordToggles();
  }
  function renderDeliveryForm(){
    fields.innerHTML=`
      <div class="delivery-form-section"><h4>1. DELIVERY PARTNER INFORMATION</h4><p>Partner with H MARKET to deliver orders in your city.</p>
        ${input('partner_name','Delivery Partner / Team Name','text','placeholder="e.g. ABC Delivery Team"')}
        <label>Partner Type *<select name="partner_type" required><option value="">ရွေးပါ</option><option>Delivery Company</option><option>Local Delivery Team</option><option>Shop-owned Delivery Team</option><option>Independent Delivery Group</option><option>Other</option></select></label>
        ${input('contact_person','Contact Person Name','text','placeholder="Person in charge"')}
        <div class="delivery-grid">${input('phone','Phone Number','tel','placeholder="09xxxxxxxxx"')}${input('email','Email Address','email','placeholder="Email (optional)"').replace(' required','')}</div>
      </div>
      <div class="delivery-form-section"><h4>2. SERVICE LOCATION</h4><p>Only Admin-activated H MARKET locations are available.</p>
        <label>Main Service City *<select name="location_id" id="deliveryLocation" required><option value="">Loading locations…</option></select></label>
        <label>Service Areas / Townships *<textarea name="service_areas" required placeholder="မြို့နယ် / ဧရိယာများကို comma နဲ့ ခွဲရေးပါ"></textarea></label>
        ${input('base_location','Base / Pickup Location','text','placeholder="Main operating location"')}
      </div>
      <div class="delivery-form-section"><h4>3. DELIVERY CAPABILITY</h4>
        ${input('rider_count','Number of Riders','number','min="1" inputmode="numeric"')}
        <label>Vehicle Types *<div class="delivery-checks">${['🛵 Motorbike','🛺 Three-wheeler','🚗 Car','🚐 Van','Other'].map(x=>`<label class="delivery-check"><input type="checkbox" name="vehicle_types" value="${x}">${x}</label>`).join('')}</div></label>
        <label>Delivery Services *<div class="delivery-checks">${['Food Delivery','Shop Orders','Grocery','Buy-for-Me / အဝယ်တော်','Hotel & Stay','Other'].map(x=>`<label class="delivery-check"><input type="checkbox" name="delivery_services" value="${x}">${x}</label>`).join('')}</div></label>
      </div>
      <div class="delivery-form-section"><h4>4. OPERATING HOURS</h4>
        <div class="delivery-grid"><label>Start Time *<input type="time" name="start_time" id="deliveryStart" required></label><label>End Time *<input type="time" name="end_time" id="deliveryEnd" required></label></div>
        <label>Working Days *<div class="delivery-checks">${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(x=>`<label class="delivery-check"><input type="checkbox" name="working_days" value="${x}">${x}</label>`).join('')}</div></label>
        <label class="delivery-check"><input type="checkbox" name="is_24_7" id="delivery247" value="true"> 24/7 Service</label>
      </div>
      <div class="delivery-form-section"><h4>5. DELIVERY SERVICE DETAILS</h4>
        <div class="delivery-grid">${input('delivery_radius_km','Delivery Radius (KM)','number','min="0" step="0.1" placeholder="e.g. 10"')}${input('estimated_delivery_time','Estimated Delivery Time','text','placeholder="30–60 minutes"')}</div>
        <p>Delivery fees and partner rates will be controlled by H MARKET Admin.</p>
      </div>
      <div class="delivery-form-section"><h4>6. DOCUMENTS / VERIFICATION</h4>
        <label>Team / Company Logo<input type="file" name="team_logo" accept="image/*" data-preview="teamLogoPreview"></label><div class="upload-preview-grid"><div class="upload-preview" id="teamLogoPreview">Logo preview</div></div>
        <label>Team / Company Photo<input type="file" name="team_photo" accept="image/*" data-preview="teamPhotoPreview"></label><div class="upload-preview-grid"><div class="upload-preview" id="teamPhotoPreview">Photo preview</div></div>
        <label>Business Registration (optional)<input type="file" name="business_registration" accept="image/*,.pdf"></label>
        <label>Company / Team Address Proof (optional)<input type="file" name="address_proof" accept="image/*,.pdf"></label>
        <label>Team Leader / Owner ID or NRC Front<input type="file" name="leader_nrc_front" accept="image/*" capture="environment" required></label>
        <label>Team Leader / Owner ID or NRC Back<input type="file" name="leader_nrc_back" accept="image/*" capture="environment" required></label>
      </div>
      <div class="delivery-form-section"><h4>7. RIDER TEAM</h4><p>Riders do not need separate H MARKET accounts during the initial application.</p><div class="rider-team" id="deliveryRiderTeam"></div><button type="button" class="auth-secondary" id="addDeliveryRider">+ Add Rider</button></div>
      <div class="delivery-form-section"><h4>8. PAYMENT / SETTLEMENT INFORMATION</h4>
        <label>Settlement Method *<select name="settlement_method" required><option value="">ရွေးပါ</option><option>KPay</option><option>Wave Money</option><option>Bank Account</option></select></label>
        ${input('settlement_account_name','Account Name')}${input('settlement_account_number','Account Number / Phone Number','text')}
        <p>H MARKET will never request passwords, PINs, OTPs, secret keys, or banking login credentials.</p>
      </div>
      <div class="delivery-form-section"><h4>9. AGREEMENT</h4><div class="delivery-terms-row"><label><input type="checkbox" id="deliveryTerms1"> I agree to the H MARKET Delivery Partner Terms & Conditions.</label><button type="button" class="terms-read" data-terms-open="delivery">📄 Read & Agree</button><label><input type="checkbox" name="info_confirmed" id="deliveryTerms2"> I confirm that the information provided is correct.</label></div></div>
      <div class="delivery-submit"><button class="btn primary auth-submit" id="deliverySubmit" type="submit" disabled>🚚 Submit Delivery Partner Request</button></div>`;
    setTimeout(()=>setupDeliveryForm(),0);
  }
  function setupDeliveryForm(){
    const formEl=form, add=$('addDeliveryRider'), team=$('deliveryRiderTeam');
    const addRider=()=>{const i=team.children.length+1,row=document.createElement('div'); row.className='rider-row'; row.innerHTML=`<label>Rider Name *<input data-rider-field="name" required placeholder="Rider ${i}"></label><label>Phone Number *<input data-rider-field="phone" required placeholder="09xxxxxxxxx"></label><label>Vehicle Type *<select data-rider-field="vehicle" required><option value="">ရွေးပါ</option><option>Motorbike</option><option>Three-wheeler</option><option>Car</option><option>Van</option><option>Other</option></select></label><label>Vehicle Number *<input data-rider-field="vehicle_number" required></label><button type="button" class="remove-rider" title="Remove">×</button>`; row.querySelector('.remove-rider').onclick=()=>{row.remove();sync();}; team.appendChild(row);sync();};
    if(add)add.onclick=addRider; addRider();
    ['team_logo','team_photo'].forEach(n=>{const el=formEl.querySelector(`[name="${n}"]`); if(el)el.onchange=()=>{const file=el.files?.[0],target=$(el.dataset.preview);if(!file||!target)return;const reader=new FileReader();reader.onload=()=>target.innerHTML=`<img src="${reader.result}" alt="preview">`;reader.readAsDataURL(file);};});
    const toggle=()=>{const on=$('delivery247')?.checked;['deliveryStart','deliveryEnd'].forEach(id=>{const el=$(id);if(el){el.disabled=!!on;if(on)el.value='';}});sync();};
    if($('delivery247'))$('delivery247').onchange=toggle;
    function sync(){const a=$('deliveryTerms1')?.checked,b=$('deliveryTerms2')?.checked;const button=$('deliverySubmit');if(button)button.disabled=!(a&&b&&formEl.checkValidity());}
    formEl.addEventListener('input',sync);formEl.addEventListener('change',sync);toggle();
  }
  async function loadDeliveryLocations(){try{const c=await client();if(!c)return;const {data,error}=await c.from('hmarket_locations').select('id,name_mm,name_en,slug').eq('is_active',true).order('sort_order').order('name_en');if(error)throw error;const el=$('deliveryLocation');if(el)el.innerHTML='<option value="">ရွေးပါ</option>'+(data||[]).map(x=>`<option value="${x.id}">${x.name_mm||x.name_en}</option>`).join('');}catch(e){console.warn('Delivery locations unavailable',e);const el=$('deliveryLocation');if(el)el.innerHTML='<option value="">Location data မရသေးပါ</option>';}}
  async function loadCategories(){try{const c=await client(); if(!c)return; const {data,error}=await c.from('categories').select('id,name_mm,name_en').eq('is_active',true).order('sort_order'); if(error)throw error; const el=$('sellerCategory'); if(el)el.innerHTML='<option value="">Select category</option>'+data.map(x=>`<option value="${x.id}">${x.name_mm} / ${x.name_en}</option>`).join('');}catch(e){console.error(e);}}
  async function loadAccommodationLocations(){
    try{
      const c=await client(); if(!c)return;
      const {data,error}=await c.from('hmarket_locations').select('id,name_mm,name_en,region_mm,city_mm').order('region_mm').order('name_en');
      if(error)throw error;
      const el=$('accommodationLocation'); if(!el)return;
      el.innerHTML='<option value="">ရွေးပါ</option>'+(data||[]).map(x=>`<option value="${x.id}">${x.region_mm||''} · ${x.city_mm||x.name_mm||x.name_en||''}</option>`).join('');
    }catch(e){console.warn('Could not load accommodation locations',e);const el=$('accommodationLocation');if(el)el.innerHTML='<option value="">Location data မရသေးပါ</option>';}
  }
  async function refresh(){
    const c=await client(); if(!c)return;
    const {data:{session}}=await c.auth.getSession();
    const guest=$('guestAccountActions'), signed=$('signedInAccountActions');
    if(!$('accountName')) return;
    if(!session){if(guest)guest.style.display='flex'; if(signed)signed.style.display='none'; $('accountName').textContent='Guest'; $('accountRole').textContent='Login to your H MARKET account'; $('accountAvatar').textContent='?'; return;}
    const {data:p,error:profileError}=await c.from('profiles').select('full_name,role,phone,is_active').eq('id',session.user.id).maybeSingle();
    if(profileError) throw profileError;
    if(guest)guest.style.display='none'; if(signed)signed.style.display='flex';
    $('accountName').textContent=p?.full_name||session.user.email||'User'; $('accountRole').textContent=`${p?.role||'customer'} account · ${session.user.email||''}`; $('accountAvatar').textContent=(p?.full_name||'U').trim().charAt(0).toUpperCase();
    if(p?.role==='admin' && p?.is_active!==false && new URLSearchParams(location.search).get('hm_preview')!=='1'){ location.replace('../admin/admin.html'); return; }
    if(p?.role==='seller' && p?.is_active!==false){ location.replace('../seller/seller.html'); return; }
    if(p?.role==='rider' && p?.is_active!==false){ toast('Rider dashboard will be connected in the next phase.'); }
  }
  function showDeliverySuccess(requestId){const id=(requestId||'').toString().slice(0,8).toUpperCase();const wrap=document.createElement('div');wrap.className='auth-choice-modal';wrap.style.zIndex='100002';wrap.innerHTML=`<div class="auth-choice-backdrop"></div><div class="auth-choice-dialog"><div class="auth-choice-icon">🚚</div><h3>Delivery Partner Request Submitted</h3><p>Your application has been received.<br>H MARKET Admin will review your information.</p><span class="delivery-status">Pending Review</span>${id?`<div style="margin-top:8px;font-size:10px;color:#6f7c91">Request ID: ${id}</div>`:''}<div class="auth-choice-actions" style="margin-top:18px"><button class="primary" type="button">Close</button></div></div>`;document.body.appendChild(wrap);wrap.querySelector('button').onclick=()=>wrap.remove();}
  async function submitForm(e){
  e.preventDefault();
  if(mode==='seller'){
    try{
      const mod=await loadSellerModule();
      await mod.handleSubmit(e);
    }catch(err){
      console.error(err);
      setMessage(err.message||'Something went wrong','error');
    }
    return;
  }
  submit.disabled=true;
  submit.textContent='Please wait…';

  try{
    const c=await client();
    if(!c) throw new Error('Supabase is not connected');

    const f=new FormData(form);

    if(['register','seller','accommodation','rider','delivery'].includes(mode) && !termsAccepted){
      throw new Error('Please read the Terms & Regulations and agree before submitting.');
    }

    if(mode==='forgot'){
      const email=(f.get('email')||'').trim();
      if(!email) throw new Error('Please enter your email address.');
      const {error}=await c.auth.resetPasswordForEmail(email,{redirectTo:authRedirectUrl()});
      if(error) throw error;
      setMessage('Password reset link has been sent. Please check your email.','success');
      return;

    } else if(mode==='reset'){
      const password=f.get('password')||'';
      const confirmPassword=f.get('confirm_password')||'';
      if(password.length<6) throw new Error('Password must be at least 6 characters.');
      if(password!==confirmPassword) throw new Error('Passwords do not match.');
      const {error}=await c.auth.updateUser({password});
      if(error) throw error;
      resetRecovery=false;
      setMessage('Password updated successfully. You can now sign in.','success');
      setTimeout(()=>{location.hash=''; mode='login'; render();},900);
      return;

    } else if(mode==='login'){

      const {error:loginError}=await c.auth.signInWithPassword({
        email:f.get('email'),
        password:f.get('password')
      });

      if(loginError) throw loginError;

      const {data:{session:loggedSession}}=await c.auth.getSession();
      if(!loggedSession) throw new Error('Login succeeded but session was not found.');
      const {data:profile,error:profileError}=await c.from('profiles').select('full_name,role,is_active').eq('id',loggedSession.user.id).maybeSingle();
      if(profileError) throw profileError;
      if(profile?.role==='admin' && profile?.is_active!==false){
        location.replace('../admin/admin.html');
        return;
      }
      if(profile?.role==='seller' && profile?.is_active!==false){
        location.replace('../seller/seller.html');
        return;
      }
      close();
      await refresh();
      toast('Login successful');
      partnerAfterLogin();

    } else if(mode==='register'){

      const {data,error:registerError}=await c.auth.signUp({
        email:f.get('email'),
        password:f.get('password'),
        options:{
          emailRedirectTo:authRedirectUrl(),
          data:{
            full_name:f.get('name'),
            phone:f.get('phone'),
            terms_version:TERMS_VERSION,
            terms_accepted_at:new Date().toISOString()
          }
        }
      });

      if(registerError) throw registerError;

      close();
      toast(
        data.session
          ? 'Account created'
          : 'Account created. Check your email to confirm.'
      );

      await refresh();
      if(data.session) partnerAfterLogin();

    } else if(mode==='seller'){
      const mod=await loadSellerModule();
      await mod.handleSubmit(e);

    } else if(mode==='delivery'){
      const {data:{session}}=await c.auth.getSession();
      if(!session) throw new Error('Login required first');
      const vehicleTypes=[...f.getAll('vehicle_types')], deliveryServices=[...f.getAll('delivery_services')], workingDays=[...f.getAll('working_days')];
      if(!vehicleTypes.length) throw new Error('Please select at least one vehicle type.');
      if(!deliveryServices.length) throw new Error('Please select at least one delivery service.');
      if(!workingDays.length && !$('delivery247')?.checked) throw new Error('Please select working days.');
      const riders=[]; document.querySelectorAll('#deliveryRiderTeam .rider-row').forEach(row=>riders.push({name:row.querySelector('[data-rider-field="name"]')?.value?.trim()||'',phone:row.querySelector('[data-rider-field="phone"]')?.value?.trim()||'',vehicle_type:row.querySelector('[data-rider-field="vehicle"]')?.value||'',vehicle_number:row.querySelector('[data-rider-field="vehicle_number"]')?.value?.trim()||''}));
      if(!riders.length) throw new Error('Please add at least one rider.');
      if(riders.some(r=>!r.name||!r.phone||!r.vehicle_type||!r.vehicle_number)) throw new Error('Please complete all rider fields.');
      const document_paths={};
      const uploadOne=async(file,key,optional=true)=>{if(!file||!file.size){if(optional)return null;throw new Error(`${key} is required.`);}const safe=(file.name||'file').replace(/[^a-zA-Z0-9._-]/g,'_');const path=`${session.user.id}/delivery-partner/${Date.now()}-${crypto.randomUUID()}-${key}-${safe}`;const {error}=await c.storage.from('shop-photos').upload(path,file,{upsert:false});if(error)throw error;document_paths[key]=path;return path;};
      await uploadOne(f.get('team_logo'),'team_logo');await uploadOne(f.get('team_photo'),'team_photo');await uploadOne(f.get('business_registration'),'business_registration');await uploadOne(f.get('address_proof'),'address_proof');await uploadOne(f.get('leader_nrc_front'),'leader_nrc_front',false);await uploadOne(f.get('leader_nrc_back'),'leader_nrc_back',false);
      const is247=!!document.getElementById('delivery247')?.checked;
      const payload={user_id:session.user.id,partner_name:f.get('partner_name'),partner_type:f.get('partner_type'),contact_person:f.get('contact_person'),phone:f.get('phone'),email:f.get('email')||null,location_id:f.get('location_id'),service_areas:f.get('service_areas'),base_location:f.get('base_location'),rider_count:Number(f.get('rider_count')||riders.length),vehicle_types:vehicleTypes,delivery_services:deliveryServices,start_time:is247?null:f.get('start_time'),end_time:is247?null:f.get('end_time'),working_days:workingDays,is_24_7:is247,delivery_radius_km:Number(f.get('delivery_radius_km')||0),estimated_delivery_time:f.get('estimated_delivery_time'),document_paths,settlement_method:f.get('settlement_method'),settlement_account_name:f.get('settlement_account_name'),settlement_account_number:f.get('settlement_account_number'),terms_version:TERMS_VERSION,terms_accepted_at:new Date().toISOString(),status:'pending'};
      const {data:req,error:reqErr}=await c.from('delivery_partner_requests').insert(payload).select('id').single();
      if(reqErr) throw reqErr;
      const {error:riderErr}=await c.from('delivery_partner_request_riders').insert(riders.map(r=>({request_id:req.id,...r}))); if(riderErr) throw riderErr;
      close(); showDeliverySuccess(req?.id);

    } else if(mode==='accommodation'){
      const {data:{session}}=await c.auth.getSession();
      if(!session){open('login');throw new Error('Login required first');}
      const files=f.getAll('property_photos').filter(x=>x&&x.size>0);
      if(files.length<3||files.length>5)throw new Error('Please select 3 to 5 property photos');
      const urls=[];
      for(const file of files){const path=`${session.user.id}/partner/accommodation/${Date.now()}-${crypto.randomUUID()}-${file.name}`;const {data,error}=await c.storage.from('shop-photos').upload(path,file);if(error)throw error;urls.push(c.storage.from('shop-photos').getPublicUrl(data.path).data.publicUrl);}
      const selfie=f.get('owner_selfie'), nrcFront=f.get('nrc_front'), nrcBack=f.get('nrc_back'), license=f.get('license_file');
      const uploadOne=async(file,folder)=>{if(!file||!file.size)return null;const path=`${session.user.id}/partner/accommodation/${folder}-${Date.now()}-${crypto.randomUUID()}-${file.name}`;const {data,error}=await c.storage.from('shop-photos').upload(path,file);if(error)throw error;return c.storage.from('shop-photos').getPublicUrl(data.path).data.publicUrl;};
      const selfieUrl=await uploadOne(selfie,'selfie'), frontUrl=await uploadOne(nrcFront,'nrc-front'), backUrl=await uploadOne(nrcBack,'nrc-back'), licenseUrl=await uploadOne(license,'license');
      const {error}=await c.from('partner_applications').insert({user_id:session.user.id,application_type:'accommodation_partner',business_name:f.get('business_name'),accommodation_type:f.get('accommodation_type'),description:f.get('description'),address:f.get('address'),phone:f.get('phone'),room_count:Number(f.get('room_count')||0),photo_urls:urls,owner_selfie_url:selfieUrl,nrc_front_url:frontUrl,nrc_back_url:backUrl,license_status:f.get('license_status'),license_reason:f.get('license_reason'),license_url:licenseUrl,location_id:f.get('location_id')||null,terms_version:TERMS_VERSION,terms_accepted_at:new Date().toISOString(),status:'pending'});
      if(error)throw error;
      close();toast('Accommodation Partner application submitted');

    } else {

      const {data:{session}}=await c.auth.getSession();

      if(!session){
        open('login');
        throw new Error('Login required first');
      }

      const uploadOne=async(file,folder,required=false)=>{
        if(!file || !file.size){
          if(required) throw new Error(`${folder} document is required.`);
          return null;
        }
        const safe=(file.name||'file').replace(/[^a-zA-Z0-9._-]/g,'_');
        const path=`${session.user.id}/rider/${folder}-${Date.now()}-${crypto.randomUUID()}-${safe}`;
        const {data,error}=await c.storage.from('shop-photos').upload(path,file);
        if(error) throw error;
        return c.storage.from('shop-photos').getPublicUrl(data.path).data.publicUrl;
      };

      // Upload Rider identity documents first; these URLs belong to the canonical rider request.
      const selfieUrl=await uploadOne(f.get('owner_selfie'),'selfie',true);
      const frontUrl=await uploadOne(f.get('nrc_front'),'nrc-front',true);
      const backUrl=await uploadOne(f.get('nrc_back'),'nrc-back',true);
      const licenseUrl=await uploadOne(f.get('license_file'),'license',true);
      const termsAcceptedAt=new Date().toISOString();

      const {error:riderError}=await c.rpc(
        'submit_rider_application_v1',
        {
          p_vehicle_type:f.get('vehicle_type'),
          p_vehicle_number:f.get('vehicle_number'),
          p_phone:f.get('phone'),
          p_address:f.get('address'),
          p_owner_selfie_url:selfieUrl,
          p_nrc_front_url:frontUrl,
          p_nrc_back_url:backUrl,
          p_license_url:licenseUrl,
          p_terms_version:TERMS_VERSION,
          p_terms_accepted_at:termsAcceptedAt
        }
      );

      if(riderError) throw riderError;

      close();
      toast('Rider request submitted');
    }

  }catch(err){
    console.error(err);
    setMessage(err.message||'Something went wrong','error');
  }finally{
    submit.disabled=false;
    if(mode==='forgot') submit.textContent='Send Reset Link';
    else if(mode==='reset') submit.textContent='Update Password';
    else render();
  }
}
  document.addEventListener('click', async (e) => {

  const partner=e.target.closest('[data-partner-action]');
  if(partner){e.preventDefault();await requireLoginForPartner(partner.dataset.partnerAction);return;}
  const b = e.target.closest('[data-auth-open]');
  if (b) {
    e.preventDefault();
    open(b.dataset.authOpen);
    return;
  }
  if(e.target.closest('[data-auth-choice-close]')){closeAuthChoice();return;}
  if(e.target.closest('#authChoiceLogin')){closeAuthChoice();open('login');return;}
  if(e.target.closest('#authChoiceRegister')){closeAuthChoice();mode='register';termsAccepted=false;if(modal)modal.hidden=false;render();return;}

  if (e.target.closest('[data-auth-close]')) {
    if(mode==='seller'){
      try{ const mod=await loadSellerModule(); const allowed=await mod.requestClose(); if(allowed){mod.cleanup(); close();} }catch(err){ setMessage(err.message||'Could not close Seller Request','error'); }
    } else { close(); }
    return;
  }

  if(e.target.closest('#forgotPasswordBtn')){
    e.preventDefault();
    mode='forgot';
    if(modal)modal.hidden=false;
    render();
    return;
  }

  if(e.target.closest('[data-terms-open]')){e.preventDefault();openTerms(e.target.closest('[data-terms-open]').dataset.termsOpen);return;}
  if(e.target.closest('[data-terms-close]')){closeTerms();return;}
  if(e.target.closest('#termsAgreeBtn')){termsAccepted=true;const cb=$('termsAccepted');if(cb){cb.disabled=false;cb.checked=true;}if(termsMode==='delivery'){const d=$('deliveryTerms1');if(d){d.checked=true;d.dispatchEvent(new Event('change',{bubbles:true}));}}closeTerms();return;}
  if(e.target.closest('#createAccountBtn')){mode='register';termsAccepted=false;render();return;}
  if(e.target.closest('[data-oauth]')){
  e.preventDefault();

  const provider = e.target.closest('[data-oauth]').dataset.oauth;

  (async()=>{
    try{
      const c = await client();

      if(!c){
        throw new Error('Supabase is not connected');
      }

      const { error } = await c.auth.signInWithOAuth({
        provider: provider,
        options:{
          redirectTo:authRedirectUrl()
        }
      });

      if(error) throw error;

    }catch(err){
      setMessage(
        err.message || `${provider} login is unavailable. Please enable the provider in Supabase Auth settings.`,
        'error'
      );
    }
  })();

  return;
}

  const logout = e.target.closest('#logoutBtn');

  if (logout) {
    e.preventDefault();

    if (logout.disabled) return;

    logout.disabled = true;

    try {
      const c = await client();

      if (c) {
        await c.auth.signOut();
      }

      await refresh();

    } catch (err) {
      console.error('Logout error:', err);
      setMessage(err.message || 'Logout failed','error');

    } finally {
      logout.disabled = false;
    }
  }
});
  form?.addEventListener('submit',submitForm);
  window.HMARKET_AUTH={refresh,open,close};
  (async()=>{
    try{
      const c=await client();
      if(!c)return;
      c.auth.onAuthStateChange((event)=>{
        if(event==='PASSWORD_RECOVERY'){
          resetRecovery=true;
          mode='reset';
          if(modal)modal.hidden=false;
          render();
          return;
        }
        setTimeout(refresh,0);
      });
      if(isRecoverySession()){
        resetRecovery=true;
        mode='reset';
        if(modal)modal.hidden=false;
        render();
      }
      await refresh();
      const params = new URLSearchParams(location.search);
      const authMode = params.get('auth');
      const partner = params.get('partner');

      if(authMode==='login' || authMode==='register') open(authMode);

      // Account page -> Customer page partner flow
      if(authMode==='login' && partner){
        const map = {
          'Become a Seller':'seller',
          'Become a Rider Partner':'rider',
          'Become a Delivery Partner':'delivery',
          'Become a Transport Partner':'transport',
          'Become an Accommodation Partner':'accommodation'
        };
        const nextMode = map[partner];
        if(nextMode){
          pendingPartnerMode = nextMode;
          sessionStorage.setItem(PENDING_PARTNER_KEY,nextMode);
        }
      }

      if(await isLoggedIn()) partnerAfterLogin();
    }catch(e){console.warn(e)}
  })();
})();