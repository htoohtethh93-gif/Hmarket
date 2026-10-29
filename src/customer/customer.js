








    let categories = [];
    let shopCategories = [];
    const categoryFallbackIcon = '▦';
    function refreshShopCategories(){
      const rows = Array.isArray(categories) ? categories.filter(c=>c && c.is_active!==false) : [];
      shopCategories = [{name:'All',label:'All',icon:'▦'}, ...rows.map(c=>({
        name:c.name_en||c.name_mm||String(c.id),
        label:c.name_en||c.name_mm||'Category',
        icon:c.icon||categoryFallbackIcon,
        id:c.id
      }))];
    }
    function shopCategoryKey(name){ return name || 'Other'; }
    function renderShopCategoryChips(active='All'){
      refreshShopCategories();
      $('shopChips').innerHTML=shopCategories.map(c=>`<button type="button" class="chip ${c.name===active?'active':''}" data-shop-category="${escapeHtml(c.name)}">${escapeHtml(c.icon||categoryFallbackIcon)} ${escapeHtml(c.label)}</button>`).join('');
    }
    const state = {screen:'home',category:null,shop:null,productFilter:'All',cart:[],search:''};
    const pageParams=new URLSearchParams(location.search);
    const previewLocationId=pageParams.get('location_id');
    const requestedScreen=pageParams.get('screen');
    if(previewLocationId) { selectedLocationId=previewLocationId; }

    const money = n => new Intl.NumberFormat('en-US').format(Math.round(n)) + ' Ks';
    const $ = id => document.getElementById(id);
    function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.remove('show'),1800)}
    function isSupabaseNetworkError(err){
      const msg=String(err?.message||err||'').toLowerCase();
      return /failed to fetch|networkerror|network error|fetch failed|timeout|timed out|connection|dns|name resolution|err_name_not_resolved|err_connection|connection timed out/.test(msg);
    }
    function setConnectionNotice(show,message){
      const box=$('connectionNotice'); if(!box)return;
      const title=box.querySelector('.connection-notice-copy strong');
      const detail=box.querySelector('.connection-notice-copy span');
      if(title)title.textContent=show?(message||'H MARKET server ကို လောလောဆယ် မဆက်သွယ်နိုင်ပါ'):'H MARKET server connection ပြန်ရပါပြီ';
      if(detail)detail.textContent=show?'Internet / network connection ကို စစ်ပြီး Retry လုပ်ပါ။':'Data ကို ပြန်လည်တင်နေပါတယ်။';
      box.hidden=!show;
    }
    async function retryCustomerConnection(){
      const btn=$('connectionRetry'); if(btn){btn.disabled=true;btn.textContent='Retrying…';}
      try{
        const client=window.HMARKET_SUPABASE;
        if(!client)throw new Error('Supabase client is not ready');
        if(typeof window.HMARKET_API_ONLINE!=='undefined' && window.HMARKET_API_ONLINE===false){
          if(typeof window.HMARKET_API_CHECK==='function') await window.HMARKET_API_CHECK();
        }
        await loadActiveLocations();
        await loadHomeContent();
        if(window.HMARKET_API_ONLINE!==false) setConnectionNotice(false);
      }catch(err){
        console.warn('Customer connection retry failed:',err);
        setConnectionNotice(true,'H MARKET server ကို လောလောဆယ် မဆက်သွယ်နိုင်ပါ');
      }finally{
        if(btn){btn.disabled=false;btn.textContent='Retry';}
      }
    }
    async function show(screen){state.screen=screen;document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===screen));document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===screen || (screen==='shopDetail'&&b.dataset.nav==='shops'))); if(screen==='home'||screen==='account'||screen==='shops'||screen==='cart'||screen==='featured') window.scrollTo({top:0,behavior:'smooth'}); if(screen==='account' && window.renderDynamicPartnerServices) await window.renderDynamicPartnerServices(); if(screen==='featured') renderFeaturedPage(); updateCartBar();}

    const LOCATION_KEY='hmarket_location';
    let locations=[];
    let locationRegions=[];
    let selectedLocationId=localStorage.getItem(LOCATION_KEY)||'';
    let selectedLocationName=localStorage.getItem(LOCATION_KEY+'_name')||'';
    let notifications=[];
    function notificationIcon(type){return ({order:'📦',payment:'💳',booking:'🏨',support:'🎧',system:'🔔',promotion:'🎁',rider:'🛵'})[type]||'🔔';}
    function notificationTime(v){try{return new Date(v).toLocaleString();}catch(_){return '';}}
    async function loadNotifications(){
      const list=$('notificationList'); if(!list)return;
      const client=window.HMARKET_SUPABASE;
      if(!client){list.innerHTML='<div class="notification-empty">Notification မရှိသေးပါ။</div>';return;}
      try{
        const {data:{session}}=await client.auth.getSession();
        if(!session){notifications=[];renderNotifications();return;}
        const {data,error}=await client.from('notifications').select('id,title,body,type,is_read,created_at').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(50);
        if(error)throw error;
        notifications=data||[];renderNotifications();
      }catch(err){console.warn('Notification table is not available yet:',err);notifications=[];renderNotifications();}
    }
    function renderNotifications(){
      const list=$('notificationList'); if(!list)return;
      const unread=notifications.filter(n=>!n.is_read).length; const badge=$('notificationBadge');
      if(badge){badge.textContent=unread;badge.style.display=unread?'grid':'none';}
      if(!notifications.length){list.innerHTML='<div class="notification-empty"><div style="font-size:36px">🔔</div><div style="font-weight:800;color:var(--text);margin-top:8px">Notification မရှိသေးပါ</div><div style="font-size:11px;margin-top:5px">Order၊ Booking၊ Payment နှင့် Support update များ ရလာသောအခါ ဒီနေရာမှာ ပြပါမယ်။</div></div>';return;}
      list.innerHTML=notifications.map(n=>`<button class="notification-item ${n.is_read?'':'unread'}" data-notification-id="${escapeHtml(n.id)}"><div class="notification-icon">${notificationIcon(n.type)}</div><div class="notification-copy"><b>${escapeHtml(n.title||'H MARKET Notification')}</b><p>${escapeHtml(n.body||'')}</p><small>${escapeHtml(notificationTime(n.created_at))}</small></div></button>`).join('');
      list.querySelectorAll('[data-notification-id]').forEach(btn=>btn.onclick=()=>markNotificationRead(btn.dataset.notificationId));
    }
    async function markNotificationRead(id){
      const client=window.HMARKET_SUPABASE; const item=notifications.find(n=>String(n.id)===String(id)); if(!item)return;
      item.is_read=true;renderNotifications();
      if(client){try{await client.from('notifications').update({is_read:true,read_at:new Date().toISOString()}).eq('id',id);}catch(e){console.warn(e);}}
    }
    async function markAllNotifications(){
      const client=window.HMARKET_SUPABASE; notifications=notifications.map(n=>({...n,is_read:true}));renderNotifications();
      if(client){try{const {data:{session}}=await client.auth.getSession();if(session)await client.from('notifications').update({is_read:true,read_at:new Date().toISOString()}).eq('user_id',session.user.id).eq('is_read',false);}catch(e){console.warn(e);}}
    }
    function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
    function updateLocationLabel(){$('locationLabel').textContent=selectedLocationName||'ရွေးပါ';}
    function clearStoredLocation(){selectedLocationId='';selectedLocationName='';localStorage.removeItem(LOCATION_KEY);localStorage.removeItem(LOCATION_KEY+'_name');updateLocationLabel();}

    async function loadActiveLocations(){
      const client=window.HMARKET_SUPABASE;
      if(!client){locations=[];locationRegions=[];clearStoredLocation();return;}
      try{
        const {data,error}=await client.from('hmarket_locations').select('id,name_mm,name_en,region_mm,city_mm,sort_order,is_active').eq('is_active',true).order('sort_order',{ascending:true}).order('name_en',{ascending:true});
        if(error)throw error;
        locations=(data||[]).filter(x=>x.is_active===true);
        const selected=locations.find(x=>String(x.id)===String(selectedLocationId));
        if(selected){
          selectedLocationId=selected.id;
          selectedLocationName=`${selected.region_mm?selected.region_mm+' · ':''}${selected.city_mm||selected.name_mm||selected.name_en||'Location'}`;
          localStorage.setItem(LOCATION_KEY,selectedLocationId);
          localStorage.setItem(LOCATION_KEY+'_name',selectedLocationName);
        }else if(locations.length===1){
          const only=locations[0];
          selectedLocationId=only.id;
          selectedLocationName=`${only.region_mm?only.region_mm+' · ':''}${only.city_mm||only.name_mm||only.name_en||'Location'}`;
          localStorage.setItem(LOCATION_KEY,selectedLocationId);
          localStorage.setItem(LOCATION_KEY+'_name',selectedLocationName);
        }else{
          clearStoredLocation();
        }
        updateLocationLabel();
      }catch(e){
        console.warn('Location database unavailable.',e);
        locations=[];locationRegions=[];clearStoredLocation();
      }
    }

    function closeLocation(){ $('locationModal').hidden=true; }
    function buildLocationPicker(){
      const list=$('locationList');
      if(locations.length<=1){
        list.innerHTML=locations.length===1
          ? `<div class="location-single"><div class="location-single-icon">📍</div><div><strong>${escapeHtml(locations[0].city_mm||locations[0].name_mm||locations[0].name_en||'Location')}</strong><small>ဒီ Location ကို အလိုအလျောက် ရွေးထားပါသည်။</small></div><span class="location-check">✓</span></div>`
          : '<div class="location-coming"><div class="coming-icon">📍</div><h4>လောလောဆယ် Active Location မရှိသေးပါ</h4><p>H MARKET ရရှိလာသော Location များကို Admin မှ ဖွင့်ပေးသည့်အခါ ဒီနေရာမှာ ပြပါမည်။</p></div>';
        return;
      }
      const activeRegions=[...locationRegions].filter(r=>locations.some(l=>l.region_mm===r.name_mm));
      list.innerHTML='<div class="location-picker"><select id="regionSelect"><option value="">တိုင်း / ပြည်နယ် ရွေးပါ</option></select><select id="citySelect" disabled><option value="">မြို့ / မြို့နယ် ရွေးပါ</option></select></div><div class="location-hint">Active ဖြစ်သော Location များထဲမှသာ ရွေးချယ်နိုင်ပါသည်။</div>';
      const regionSelect=$('regionSelect'),citySelect=$('citySelect');
      regionSelect.innerHTML='<option value="">တိုင်း / ပြည်နယ် ရွေးပါ</option>'+activeRegions.map(r=>`<option value="${escapeHtml(r.name_mm)}">${escapeHtml(r.name_mm)}${r.name_en?' · '+escapeHtml(r.name_en):''}</option>`).join('');
      function fillCities(region){
        const cities=[...new Map(locations.filter(x=>x.region_mm===region).map(x=>[x.id,x])).values()];
        if(!cities.length){citySelect.innerHTML='<option value="">Active မြို့ / မြို့နယ် မရှိပါ</option>';citySelect.disabled=true;return;}
        citySelect.innerHTML='<option value="">မြို့ / မြို့နယ် ရွေးပါ</option>'+cities.map(x=>`<option value="${escapeHtml(x.id)}">${escapeHtml(x.city_mm||x.name_mm||x.name_en||'')}</option>`).join('');
        citySelect.disabled=false;
      }
      const current=locations.find(x=>String(x.id)===String(selectedLocationId));
      if(current){regionSelect.value=current.region_mm||'';fillCities(current.region_mm||'');citySelect.value=current.id;}
      regionSelect.addEventListener('change',()=>fillCities(regionSelect.value));
      citySelect.addEventListener('change',()=>{const chosen=locations.find(x=>String(x.id)===String(citySelect.value));if(chosen)setLocation(chosen.id,`${chosen.region_mm?chosen.region_mm+' · ':''}${chosen.city_mm||chosen.name_mm||chosen.name_en}`);});
    }

    async function openLocation(){
      $('locationModal').hidden=false;
      try{
        const client=window.HMARKET_SUPABASE;if(!client){locations=[];locationRegions=[];buildLocationPicker();return;}
        const [rr,lr]=await Promise.all([
          client.from('hmarket_regions').select('id,name_mm,name_en,sort_order').eq('is_active',true).order('sort_order',{ascending:true}),
          client.from('hmarket_locations').select('id,name_mm,name_en,region_mm,city_mm,sort_order,is_active').eq('is_active',true).order('sort_order',{ascending:true}).order('name_en',{ascending:true})
        ]);
        if(rr.error)throw rr.error;if(lr.error)throw lr.error;
        locationRegions=rr.data||[];locations=(lr.data||[]).filter(x=>x.is_active===true);
        const chosen=locations.find(x=>String(x.id)===String(selectedLocationId));
        if(!chosen && locations.length===1){
          selectedLocationId=locations[0].id;
          selectedLocationName=`${locations[0].region_mm?locations[0].region_mm+' · ':''}${locations[0].city_mm||locations[0].name_mm||locations[0].name_en}`;
          localStorage.setItem(LOCATION_KEY,selectedLocationId);localStorage.setItem(LOCATION_KEY+'_name',selectedLocationName);
          updateLocationLabel();await loadHomeContent();
        }
        buildLocationPicker();
      }catch(e){
        console.warn('Location database unavailable.',e);
        locations=[];locationRegions=[];buildLocationPicker();
        if(isSupabaseNetworkError(e)) setConnectionNotice(true,'H MARKET server ကို လောလောဆယ် မဆက်သွယ်နိုင်ပါ');
      }
    }

    async function setLocation(id,name){
      const chosen=locations.find(x=>String(x.id)===String(id));
      if(!chosen)return;
      selectedLocationId=chosen.id;
      selectedLocationName=name||`${chosen.region_mm?chosen.region_mm+' · ':''}${chosen.city_mm||chosen.name_mm||chosen.name_en}`;
      localStorage.setItem(LOCATION_KEY,selectedLocationId);localStorage.setItem(LOCATION_KEY+'_name',selectedLocationName);
      updateLocationLabel();closeLocation();
      await loadHomeContent();
      if(state.screen==='shops')await loadShopsFromSupabase();
      if(state.screen==='featured')renderFeaturedPage();
      toast(`${selectedLocationName} ကို ရွေးထားပါပြီ`);
    }

    function renderCategories(){
      const rows=homeCategoryRows.length?homeCategoryRows:categories.filter(c=>c?.is_active!==false);
      const items=rows.map(r=>({
        id:r.id,
        name:r.name_en||r.name_mm||'Category',
        mm:r.name_mm||r.name_en||'',
        icon:r.icon||categoryFallbackIcon,
        image_url:r.image_url||''
      }));
      const homeCards=items.map(c=>{
        const media=c.image_url
          ? `<img class="cat-image" src="${escapeHtml(c.image_url)}" alt="${escapeHtml(c.name)}" loading="lazy">`
          : `<span class="cat-fallback-icon" aria-hidden="true">${escapeHtml(c.icon)}</span>`;
        return `<button class="cat" type="button" data-category="${escapeHtml(c.name)}"><span class="cat-image-wrap">${media}</span><span class="cat-copy"><strong>${escapeHtml(c.name)}</strong><small>${escapeHtml(c.mm)}</small></span><span class="cat-arrow" aria-hidden="true">→</span></button>`;
      }).join('');
      const categoryGrid = $('categoryGrid');
      if(categoryGrid){
        categoryGrid.innerHTML=homeCards||'<div class="empty compact-empty">No active categories are configured for Home.</div>';
      }
      const categoryList = $('categoryList');
      if(categoryList){
        categoryList.innerHTML=items.map(c=>`<button class="shop-row" type="button" data-category="${escapeHtml(c.name)}"><div class="shop-avatar">${c.image_url?`<img src="${escapeHtml(c.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:14px">`:escapeHtml(c.icon||'📦')}</div><div class="shop-row-main"><b>${escapeHtml(c.name)}</b><p>${escapeHtml(c.mm||'')} · ဆိုင်များကြည့်ရန်</p></div><div class="chev">›</div></button>`).join('');
      }
      refreshShopCategories();
    }

    let homeBanners=[];
    let homeCategoryRows=[];
    let homePopularShops=[];
    let homePopularFood=[];
    let homeFeaturedShops=[];
    let featuredAvailable=false;
    let homeSectionsConfig=[];
    let buyForMeEnabled=true;
    let hotelSectionEnabled=false;
    let homeHotels=[];
    let activePartnerServiceKeys=new Set();

    function toggleHomeSection(id,show){const el=$(id);if(el)el.hidden=!show;}
    function locationInfo(locationId){const x=locations.find(l=>String(l.id)===String(locationId));if(!x)return '';return x.city_mm||x.name_mm||x.name_en||'';}
    function activeByDate(row){const now=new Date();if(row.start_date&&new Date(row.start_date)>now)return false;if(row.end_date&&new Date(row.end_date)<now)return false;return true;}
    function sectionLocationVisible(row){
      if(!row || !selectedLocationId) return !row || !row.location_scope || row.location_scope.mode==='all';
      const scope=row.location_scope||{mode:'all',location_ids:[]};
      if(scope.mode!=='selected') return true;
      return Array.isArray(scope.location_ids) && scope.location_ids.map(String).includes(String(selectedLocationId));
    }
    function sectionAvailable(row){if(!row || row.is_active===false || row.show_on_home===false || !activeByDate(row) || !sectionLocationVisible(row))return false; if(row.service_key && ['seller','rider','delivery','transport','accommodation'].includes(row.service_key) && !activePartnerServiceKeys.has(row.service_key))return false; return true;}
    function homeConfigMap(){return new Map(homeSectionsConfig.map(x=>[x.section_key,x]));}
    function activeConfigFor(keys){const map=homeConfigMap();for(const key of keys){const row=map.get(key);if(row)return row;}return null;}
    function sectionIsActive(keys){const row=activeConfigFor(keys);return !!row && sectionAvailable(row);}
    function sectionOrder(key){const row=activeConfigFor([key]);return Number.isFinite(Number(row?.display_order))?Number(row.display_order):99;}
    function sectionTitle(key,defaults){const row=activeConfigFor([key]);return row?.title_mm||row?.title_en||row?.section_name||defaults;}

    function navSectionAvailable(row){
      if(!row || row.is_active===false || row.show_in_nav!==true || !activeByDate(row)) return false;
      const scope=row.location_scope||{mode:'all',location_ids:[]};
      if(scope.mode==='selected') return !!selectedLocationId && Array.isArray(scope.location_ids) && scope.location_ids.map(String).includes(String(selectedLocationId));
      return true;
    }
    function applyServiceVisibility(){
      const buyerCfg=activeConfigFor(['buy_for_me','buyer','buy_for_me_service']);
      buyForMeEnabled=buyerCfg?sectionAvailable(buyerCfg):false;
      const featuredCfg=activeConfigFor(['featured','featured_shops']);
      const featuredNavEnabled=navSectionAvailable(featuredCfg) && homeFeaturedShops.length>0;
      const featureNav=$('featuredNav'); if(featureNav)featureNav.hidden=!featuredNavEnabled;
      const nav=document.querySelector('.bottom-nav');
      if(nav){
        const visible=Array.from(nav.querySelectorAll('.nav-item')).filter(el=>!el.hidden).length;
        nav.style.setProperty('--nav-count',String(Math.max(1,visible)));
      }
    }

    function bannerAction(b){
      const type=b.link_type||'none';
      if(type==='category')return `data-category="${escapeHtml(b.link_value||'')}"`;
      if(type==='shops')return `data-nav="shops"`;
      if(type==='buyer')return `data-nav="buyer"`;
      if(type==='hotel'){const c=categories.find(x=>x.slug==='hotel-stay'||x.name_en==='Hotel & Stay');return c?`data-category="${escapeHtml(c.name_en||c.name_mm)}"`:'data-external="../accommodation/accommodation.html"';}
      if(type==='custom'&&b.link_value)return `data-external="${escapeHtml(b.link_value)}"`;
      return '';
    }

    function renderHero(){
      const section=$('heroSection'),track=$('heroTrack');
      if(!section||!track)return;
      if(!homeBanners.length){section.hidden=true;track.innerHTML='';clearTimeout(heroTimer);return;}
      section.hidden=false;
      track.innerHTML=homeBanners.map(b=>{
        const image=b.image_url?` style="background-image:url('${escapeHtml(b.image_url)}')"`:'';
        const cls=b.image_url?'hero-slide has-image':'hero-slide';
        const action=b.button_text?bannerAction(b):'';
        const button=b.button_text?`<button class="hero-btn" type="button" ${action}>${escapeHtml(b.button_text)} <span>→</span></button>`:'';
        return `<article class="${cls}"${image}><div class="hero-copy"><span class="hero-label">H MARKET</span><h1>${escapeHtml(b.title||'')}</h1>${b.subtitle?`<p>${escapeHtml(b.subtitle)}</p>`:''}${button}</div></article>`;
      }).join('');
      const multi=homeBanners.length>1;$('heroPrev').hidden=!multi;$('heroNext').hidden=!multi;
      heroIndex=Math.min(heroIndex,homeBanners.length-1);renderHeroDots();goHero(heroIndex);bindHeroControls();restartHero();
    }

    function renderCategorySection(){
      const cfg=activeConfigFor(['categories']);
      if(!cfg || !sectionAvailable(cfg))return '';
      const title=cfg.title_mm||cfg.title_en||cfg.section_name||'Categories';
      const description=cfg.description_mm||cfg.description_en||'';
      const action=cfg.target_route==='customer://categories'?'data-nav=\"categories\"':'';
      return `<section class="home-section categories-section" data-home-rendered="categories"><div class="section-head"><div><h2>${escapeHtml(title)}</h2>${description?`<p class="section-kicker">${escapeHtml(description)}</p>`:''}</div>${action?`<button type="button" ${action}>See All <span>→</span></button>`:''}</div><div class="cat-grid" id="categoryGrid"></div></section>`;
    }
    function renderBannerSection(){
      return `<section class="home-section hero-section" id="heroSection" hidden aria-label="Home campaigns">
        <div class="hero" id="heroCarousel"><div class="hero-track" id="heroTrack"></div><button class="hero-arrow prev" id="heroPrev" type="button" aria-label="Previous banner">‹</button><button class="hero-arrow next" id="heroNext" type="button" aria-label="Next banner">›</button><div class="hero-dots" id="heroDots" aria-label="Banner indicators"></div></div>
      </section>`;
    }
    function renderShopSection(key,title,items,id){
      if(!items.length)return '';
      const cfg=activeConfigFor([key]);
      const route=cfg?.target_route||'customer://shops';
      const action=route==='customer://shops'?'data-nav=\"shops\"':route.startsWith('../')?`data-external=\"${escapeHtml(route)}\"`:'';
      const description=cfg?.description_mm||cfg?.description_en||'';
      return `<section class="home-section" data-home-rendered="${escapeHtml(key)}"><div class="section-head"><div><h2>${escapeHtml(title)}</h2>${description?`<p class="section-kicker">${escapeHtml(description)}</p>`:''}</div>${action?`<button type="button" ${action}>See All <span>→</span></button>`:''}</div><div class="home-carousel" id="${escapeHtml(id)}">${items.join('')}</div></section>`;
    }
    function hotelCard(h){
      const photo=Array.isArray(h.photo_urls)?h.photo_urls[0]:'';
      const image=photo?`<img src="${escapeHtml(photo)}" alt="" loading="lazy">`:`<span class="shop-thumb-fallback">🏨</span>`;
      return `<article class="market-card"><div class="market-card-media shop-thumb">${image}</div><div class="market-card-body"><div class="market-card-title">${escapeHtml(h.business_name)}</div><div class="market-card-sub">${escapeHtml(h.accommodation_type||'Accommodation')} · ${escapeHtml(locationInfo(h.location_id)||selectedLocationName)}</div>${h.room_count?`<div class="market-card-meta">🛏️ ${escapeHtml(h.room_count)} rooms</div>`:''}</div></article>`;
    }
    function renderFeaturedHomeSection(){
      if(!homeFeaturedShops.length)return '';
      const cfg=activeConfigFor(['featured','featured_shops']);
      if(!cfg || !sectionAvailable(cfg))return '';
      const title=cfg.title_mm||cfg.title_en||cfg.section_name||'Featured';
      const description=cfg.description_mm||cfg.description_en||'';
      const icon=cfg.icon_url||'';
      const route=cfg.target_route||'customer://featured';
      const action=route==='customer://featured'?'data-nav=\"featured\"':route.startsWith('../')?`data-external=\"${escapeHtml(route)}\"`:'';
      return `<section class="home-section" data-home-rendered="featured"><div class="section-head"><div><h2>${icon?escapeHtml(icon)+' ':''}${escapeHtml(title)}</h2>${description?`<p class="section-kicker">${escapeHtml(description)}</p>`:''}</div>${action?`<button type="button" ${action}>See All <span>→</span></button>`:''}</div><div class="home-carousel" id="homeFeaturedShops">${homeFeaturedShops.map(shopCard).join('')}</div></section>`;
    }
    function renderHotelSection(){
      if(!hotelSectionEnabled||!homeHotels.length)return '';
      const cfg=activeConfigFor(['hotel_stay','hotel','accommodation']);
      if(!cfg || !sectionAvailable(cfg))return '';
      const title=cfg.title_mm||cfg.title_en||cfg.section_name||'Accommodation';
      const description=cfg.description_mm||cfg.description_en||'';
      const icon=cfg.icon_url||'';
      const route=cfg.target_route||'';
      const action=route.startsWith('../')?`data-external="${escapeHtml(route)}"`:route==='customer://shops'?'data-nav="shops"':'';
      return `<section class="home-section" data-home-rendered="hotel_stay"><div class="section-head"><div><h2>${icon?escapeHtml(icon)+' ':''}${escapeHtml(title)}</h2>${description?`<p class="section-kicker">${escapeHtml(description)}</p>`:''}</div>${action?`<button type="button" ${action}>See All <span>→</span></button>`:''}</div><div class="home-carousel" id="hotelStay">${homeHotels.map(hotelCard).join('')}</div></section>`;
    }
    function renderBuyerSection(){
      const cfg=activeConfigFor(['buy_for_me','buyer','buy_for_me_service']);
      if(!buyForMeEnabled||!cfg||!sectionAvailable(cfg))return '';
      const title=cfg.title_mm||cfg.title_en||cfg.section_name||'Buy-for-Me';
      const description=cfg.description_mm||cfg.description_en||'';
      const icon=cfg.icon_url||'▦';
      return `<section class="home-section" data-home-rendered="buy_for_me"><button class="feature-card buyer buyer-home-card" type="button" data-nav="buyer"><div class="feature-card-icon">${escapeHtml(icon)}</div><div class="feature-card-copy"><span class="feature-eyebrow">${escapeHtml(cfg.title_en||'H MARKET Service')}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div><span class="feature-arrow">→</span></button></section>`;
    }

    
    function renderServiceFeatureRow(){
      const rows=homeSectionsConfig
        .filter(row=>sectionAvailable(row) && ['hotel_stay','hotel','accommodation','bus_ticket','medicine','traditional_medicine','featured','featured_shops'].includes(row.section_key));

      if(!rows.length)return '';

      return `<section class="home-section service-feature-row" data-home-rendered="service_feature_row">
        <div class="home-carousel service-mini-grid">
          ${rows.map(row=>{
            const title=row.title_mm||row.title_en||row.section_name||'H MARKET';
            const icon=row.icon_url||'▦';
            const route=row.target_route||'';
            const action=route.startsWith('customer://')?`data-nav="${escapeHtml(route.slice('customer://'.length))}"`:route.startsWith('../')?`data-external="${escapeHtml(route)}"`:'';
            return `<button class="service-mini-card" type="button" ${action}><span>${escapeHtml(icon)}</span><div><b>${escapeHtml(title)}</b><small>${escapeHtml(row.description_mm||row.description_en||'')}</small></div></button>`;
          }).join('')}
        </div>
      </section>`;
    }
function renderHomeSections(){
      const host=$('homeSectionsContainer'); if(!host)return;
      const homeLayout=activeConfigFor(['home_layout']);
      if(homeLayout && homeLayout.is_active===false){host.innerHTML='';return;}
      const built={
        banner:sectionIsActive(['banner'])&&homeBanners.length?renderBannerSection():'',
        categories:sectionIsActive(['categories'])?renderCategorySection():'',
        popular_shop:sectionIsActive(['popular_shop','popular_shops'])&&homePopularShops.length?renderShopSection('popular_shop',sectionTitle('popular_shop','Popular Shops'),homePopularShops.map(shopCard),'popularShops'):'',
        popular_food:sectionIsActive(['popular_food','popular_foods'])&&homePopularFood.length?renderShopSection('popular_food',sectionTitle('popular_food','Popular Food'),homePopularFood.map(foodCard),'popularFood'):'',
        service_feature_row:renderServiceFeatureRow(),
        hotel_stay:'',
        buy_for_me:sectionIsActive(['buy_for_me','buyer','buy_for_me_service'])&&buyForMeEnabled?renderBuyerSection():'',
        // Feature Shop is represented by the fixed 4-card service row below.
        // Keep the dedicated Featured screen/page available, but do not render a
        // separate Featured section on the Home UI.
        featured:''
      };
      const aliases=new Map([['popular_shops','popular_shop'],['popular_foods','popular_food'],['hotel','hotel_stay'],['accommodation','hotel_stay'],['buyer','buy_for_me'],['buy_for_me_service','buy_for_me'],['featured_shops','featured']]);
      const entries=[];
      for(const row of homeSectionsConfig){
        if(!sectionAvailable(row))continue;
        const canonical=aliases.get(row.section_key)||row.section_key;
        if(built[canonical]!==undefined){if(built[canonical])entries.push({key:canonical,order:Number(row.display_order||99),html:built[canonical]});continue;}
        if(['location','partner_services','home_layout'].includes(canonical))continue;
        const label=escapeHtml(row.title_mm||row.title_en||row.section_name||row.section_key||'H MARKET');
        const icon=escapeHtml(row.icon_url||'');
        const route=row.target_route||'';
        const action=route.startsWith('../')?`data-external="${escapeHtml(route)}"`:route.startsWith('customer://')?`data-nav="${escapeHtml(route.slice('customer://'.length))}"`:'';
        const description=row.description_mm||row.description_en||'';
        const html=`<section class="home-section dynamic-service-section" data-home-rendered="${escapeHtml(row.section_key)}"><div class="section-head"><div><h2>${icon?icon+' ':''}${label}</h2>${description?`<p class="section-kicker">${escapeHtml(description)}</p>`:''}</div>${action?`<button type="button" ${action}>See All <span>→</span></button>`:''}</div><div class="dynamic-service-card" ${action?`data-click-route="1"`:''}><div class="dynamic-service-icon">${icon||'▦'}</div><div><strong>${label}</strong><p>${escapeHtml(row.data_source||'')}</p></div></div></section>`;
        entries.push({key:row.section_key,order:Number(row.display_order||99),html});
      }
      // Home order is controlled by home_sections.display_order (DB source of truth).
      entries.sort((a,b)=>Number(a.order||99)-Number(b.order||99));
      host.innerHTML=entries.map(x=>x.html).join('');
      renderCategories();
      renderHero();
      bindFeaturedNav();
    }

    async function loadHotelData(client){
      hotelSectionEnabled=false;
      if(!client)return [];
      try{
        let q=client.from('partner_applications').select('id,business_name,description,address,phone,room_count,accommodation_type,photo_urls,location_id,status').eq('application_type','accommodation').eq('status','approved').limit(12);
        if(selectedLocationId) q=q.or(`location_id.eq.${selectedLocationId},location_id.is.null`); else q=q.is('location_id',null);
        const {data,error}=await q;
        if(error)throw error;
        const items=(data||[]).filter(x=>x.business_name);
        hotelSectionEnabled=items.length>0;
        return items;
      }catch(e){console.warn('Accommodation data unavailable:',e);return [];}
    }

    async function loadHomeContent(){
      const client=window.HMARKET_SUPABASE;
      homeBanners=[];homePopularShops=[];homePopularFood=[];homeFeaturedShops=[];homeHotels=[];featuredAvailable=false;homeSectionsConfig=[];activePartnerServiceKeys=new Set();
      if(!client){applyServiceVisibility();renderHomeSections();return;}
      try{
        // Configuration is lightweight; content queries below are enabled only for active/needed sections.
        const [serviceRowsResult,sectionResult,categoryResult]=await Promise.all([
          client.from('partner_services').select('service_key,is_active').eq('is_active',true),
          window.HMARKET_HOME?.loadSections ? window.HMARKET_HOME.loadSections(client,selectedLocationId) : Promise.resolve({data:[],error:new Error('Shared Home Core unavailable')}),
          client.from('categories').select('id,name_en,name_mm,slug,icon,sort_order,is_active,image_url,media_type').eq('is_active',true).order('sort_order',{ascending:true}).limit(50)
        ]);
        const firstNetworkFailure=[serviceRowsResult.error,sectionResult.error,categoryResult.error].find(isSupabaseNetworkError);
        if(firstNetworkFailure){
          setConnectionNotice(true,'H MARKET server ကို လောလောဆယ် မဆက်သွယ်နိုင်ပါ');
        }
        activePartnerServiceKeys=new Set((serviceRowsResult.data||[]).map(x=>String(x.service_key)));
        if(!sectionResult.error)homeSectionsConfig=(window.HMARKET_HOME?.sort ? window.HMARKET_HOME.sort(sectionResult.data||[]) : (sectionResult.data||[])).filter(row=>row.is_active===true && row.show_on_home===true);
        const sectionActive=(keys)=>sectionIsActive(keys);
        const categoryCfg=activeConfigFor(['categories']);
        const categoryIds=Array.isArray(categoryCfg?.item_ids)?categoryCfg.item_ids.map(String):[];
        const allCategoryRows=categoryResult.data||[];
        homeCategoryRows=categoryIds.length
          ? categoryIds.map(id=>allCategoryRows.find(r=>String(r.id)===id)).filter(Boolean)
          : allCategoryRows.slice(0,10);
        categories=allCategoryRows;
        const needBanner=sectionActive(['banner']);
        const needCategories=sectionActive(['categories']);
        const needPopularShop=sectionActive(['popular_shop','popular_shops']);
        const needPopularFood=sectionActive(['popular_food','popular_foods']);
        const needHotel=sectionActive(['hotel_stay','hotel','accommodation'],false);
        const featuredCfg=activeConfigFor(['featured','featured_shops']);
        const needFeatured=!!featuredCfg && sectionAvailable(featuredCfg);
        const popularShopIds=Array.isArray(activeConfigFor(['popular_shop','popular_shops'])?.item_ids)?activeConfigFor(['popular_shop','popular_shops']).item_ids.map(String):[];
        const popularFoodIds=Array.isArray(activeConfigFor(['popular_food','popular_foods'])?.item_ids)?activeConfigFor(['popular_food','popular_foods']).item_ids.map(String):[];

        const bannerQ=needBanner?client.from('home_banners').select('id,title,subtitle,button_text,image_url,link_type,link_value,location_id,sort_order,is_active,auto_seconds,start_date,end_date,display_scope').eq('is_active',true).order('sort_order',{ascending:true}).limit(20):Promise.resolve({data:[],error:null});
        const bannerLocationQ=(needBanner&&selectedLocationId)?client.from('home_banner_locations').select('banner_id,location_id').eq('location_id',selectedLocationId):Promise.resolve({data:[],error:null});
        let popularShopQ=Promise.resolve({data:[],error:null});
        if(needPopularShop){
          let q=client.from('shops').select('id,name,description,logo_url,cover_url,rating,rating_count,is_open,location_id,category_id,categories(name_en,name_mm)').eq('status','approved');
          q=selectedLocationId?q.eq('location_id',selectedLocationId):q.is('location_id',null);
          popularShopQ=q.limit(30);
        }
        let popularFoodQ=Promise.resolve({data:[],error:null});
        if(needPopularFood){
          let q=client.from('products').select('id,name_mm,name_en,price,image_url,shop_id,created_at,shops!inner(id,name,rating,rating_count,location_id,status,logo_url)').eq('is_available',true).eq('shops.status','approved');
          q=selectedLocationId?q.eq('shops.location_id',selectedLocationId):q.is('shops.location_id',null);
          popularFoodQ=q.limit(30);
        }
        const featuredShopQ=needFeatured?client.from('home_featured_shops').select('sort_order,location_id,shops!inner(id,name,logo_url,cover_url,rating,rating_count,is_open,location_id,category_id,status,categories(name_en,name_mm))').eq('is_active',true).order('sort_order',{ascending:true}).limit(30):Promise.resolve({data:[],error:null});
        const hotelPromise=needHotel?loadHotelData(client):Promise.resolve([]);
        const [banners,bannerLinks,popularShops,popularFood,featuredShops,hotels]=await Promise.all([bannerQ,bannerLocationQ,popularShopQ,popularFoodQ,featuredShopQ,hotelPromise]);
        const secondNetworkFailure=[banners?.error,bannerLinks?.error,popularShops?.error,popularFood?.error,featuredShops?.error].find(isSupabaseNetworkError);
        if(secondNetworkFailure) setConnectionNotice(true,'H MARKET server ကို လောလောဆယ် မဆက်သွယ်နိုင်ပါ');
        else if(!firstNetworkFailure) setConnectionNotice(false);
        homeHotels=hotels||[];
        hotelSectionEnabled=homeHotels.length>0;

        if(!banners.error){
          const linked=new Set((bannerLinks.data||[]).map(x=>String(x.banner_id)));
          homeBanners=(banners.data||[]).filter(b=>{
            if(!activeByDate(b))return false;
            const scope=b.display_scope||(!b.location_id?'all':'selected');
            return scope==='all'||linked.has(String(b.id))||(!b.display_scope&&String(b.location_id)===String(selectedLocationId));
          }).slice(0,5);
        }
        if(!popularShops.error){
          const raw=(popularShops.data||[]).filter(s=>selectedLocationId?String(s.location_id)===String(selectedLocationId):!s.location_id);
          const byId=new Map(raw.map(s=>[String(s.id),s]));
          const ordered=popularShopIds.length?popularShopIds.map(id=>byId.get(id)).filter(Boolean):raw.sort((a,b)=>Number(b.rating||0)-Number(a.rating||0)||Number(b.rating_count||0)-Number(a.rating_count||0));
          homePopularShops=ordered.slice(0,12).map(s=>({...s,location_name:locationInfo(s.location_id),cat_name:s.categories?.name_en||s.categories?.name_mm||'Other'}));
        }
        if(!popularFood.error){
          const raw=(popularFood.data||[]).filter(p=>p.shops&&(selectedLocationId?String(p.shops.location_id)===String(selectedLocationId):!p.shops.location_id));
          const byId=new Map(raw.map(p=>[String(p.id),p]));
          const ordered=popularFoodIds.length?popularFoodIds.map(id=>byId.get(id)).filter(Boolean):raw.sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
          homePopularFood=ordered.slice(0,12);
        }
        if(!featuredShops.error){
          featuredAvailable=(featuredShops.data||[]).length>0;
          homeFeaturedShops=(featuredShops.data||[]).filter(x=>selectedLocationId?( !x.location_id || String(x.location_id)===String(selectedLocationId) ):!x.location_id).map(x=>x.shops).filter(s=>s&&s.status==='approved'&&(!selectedLocationId? !s.location_id : locations.some(l=>l.is_active&&String(l.id)===String(s.location_id)))).map(s=>({...s,location_name:locationInfo(s.location_id),cat_name:s.categories?.name_en||s.categories?.name_mm||'Other'})).slice(0,8);
        }
        if(needCategories){ /* Categories are local/static assets and need no remote request. */ }
        const foodShopRecords=homePopularFood.map(p=>p.shops).filter(Boolean).map(s=>({...s,location_name:locationInfo(s.location_id),cat_name:s.categories?.name_en||s.categories?.name_mm||'Other'}));
        shops=[...homePopularShops,...homeFeaturedShops,...foodShopRecords].map(mapShopRecord);
        const seen=new Set();shops=shops.filter(s=>{if(seen.has(String(s.id)))return false;seen.add(String(s.id));return true;});
      }catch(err){
        console.warn('Home content unavailable:',err);
        if(isSupabaseNetworkError(err)) setConnectionNotice(true,'H MARKET server ကို လောလောဆယ် မဆက်သွယ်နိုင်ပါ');
      }
      applyServiceVisibility();renderHomeSections();
    }

    function renderFeaturedPage(){
      const list=$('featuredPageList'),empty=$('featuredEmpty'); if(!list||!empty)return;
      list.innerHTML=homeFeaturedShops.map(shopCard).join('');
      empty.hidden=homeFeaturedShops.length>0;
      $('featuredSub').textContent=selectedLocationName?`${selectedLocationName} · Featured Shops`:'Active Location ရွေးပြီး Featured Shops ကြည့်ပါ';
    }
    function bindFeaturedNav(){
      const nav=$('featuredNav');
      const cfg=activeConfigFor(['featured','featured_shops']);
      if(nav)nav.hidden=!(homeFeaturedShops.length>0 && navSectionAvailable(cfg));
      renderFeaturedPage();
    }

    function mapShopRecord(s){return {id:s.id,name:s.name,desc:s.description||'',icon:'🏪',image_url:s.logo_url||s.cover_url||'',rating:Number(s.rating||0),reviews:Number(s.rating_count||0),time:s.is_open?'Open now':'Closed',location_id:s.location_id||'',location_name:s.location_name||'',cat:s.cat_name||s.categories?.name_en||s.categories?.name_mm||'Other'};}
    function shopCard(s){
      const image=s.logo_url||s.image_url||s.cover_url||s.shop_image_url||'';
      const thumb=image?`<img src="${escapeHtml(image)}" alt="" loading="lazy">`:`<span class="shop-thumb-fallback">🏪</span>`;
      const location=s.location_name||locationInfo(s.location_id)||selectedLocationName.split(' · ').pop()||'';
      const rating=Number(s.rating||0);const reviews=Number(s.rating_count??s.reviews??0);
      return `<button class="market-card shop-market-card" type="button" data-shop="${escapeHtml(s.id)}"><div class="market-card-media shop-thumb">${thumb}<span class="market-card-badge">${s.is_open===false?'Closed':'Open'}</span></div><div class="market-card-body"><div class="market-card-title">${escapeHtml(s.name||'Shop')}</div><div class="market-card-meta"><span class="rating">★ ${rating.toFixed(1)}</span><span>(${reviews})</span></div><div class="market-card-sub">${escapeHtml(location)}${s.cat_name?` · ${escapeHtml(s.cat_name)}`:''}</div></div></button>`;
    }

    function foodCard(p){
      const shop=p.shops||{};
      const name=p.name_mm||p.name_en||'Product';
      const image=p.image_url?`<img src="${escapeHtml(p.image_url)}" alt="" loading="lazy">`:`<span class="shop-thumb-fallback">🍜</span>`;
      const price=money(p.price||0);
      const rating=Number(shop.rating||0);const reviews=Number(shop.rating_count||0);
      return `<button class="market-card food-market-card" type="button" data-shop="${escapeHtml(p.shop_id)}"><div class="market-card-media shop-thumb">${image}</div><div class="market-card-body"><div class="market-card-title">${escapeHtml(name)}</div><div class="market-card-price">${price}</div><div class="market-card-sub">${escapeHtml(shop.name||'')}</div><div class="market-card-meta"><span class="rating">★ ${rating.toFixed(1)}</span><span>(${reviews})</span></div></div></button>`;
    }

    function filteredShops(cat=null){
      let list=cat?shops.filter(s=>shopCategoryKey(s.cat)===cat):shops.slice();
      if(state.search){const q=state.search.toLowerCase(); list=list.filter(s=>(s.name+' '+s.cat+' '+s.desc).toLowerCase().includes(q));}
      return list;
    }

    async function loadShopsFromSupabase(){
      try{
        const client=window.HMARKET_SUPABASE;if(!client){shops=[];renderShopList();return;}
        let query=client.from('shops').select('id,name,description,logo_url,cover_url,rating,rating_count,is_open,location_id,category_id,categories(name_en,name_mm)').eq('status','approved');
        if(selectedLocationId)query=query.eq('location_id',selectedLocationId);
        let {data,error}=await query.order('name').limit(100);if(error)throw error;
        shops=(data||[]).map(s=>({id:s.id,name:s.name,desc:s.description||'',icon:'🏪',image_url:s.logo_url||s.cover_url||'',rating:Number(s.rating||0),reviews:Number(s.rating_count||0),time:s.is_open?'Open now':'Closed',location_id:s.location_id||'',cat:s.categories?.name_en||s.categories?.name_mm||'Other'}));
      }catch(err){console.warn('Shop list unavailable:',err);shops=[];}
      renderShopList();
    }

    function openCategory(cat){
      const active=shopCategoryKey(cat);
      state.category=active==='All'?null:active; state.search=''; $('globalSearch').value='';
      $('shopsTitle').textContent='Shops'; $('shopsSub').textContent=selectedLocationName||'Location မရွေးထားပါ';
      renderShopCategoryChips(active);
      renderShopList(); show('shops');
    }
    function renderShopList(){
      const list=filteredShops(state.category);
      $('shopList').innerHTML=list.length?list.map(s=>`<button class="shop-row" type="button" data-shop="${escapeHtml(s.id)}"><div class="shop-avatar">${s.image_url?`<img src="${escapeHtml(s.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:14px">`:(s.icon||'🏪')}</div><div class="shop-row-main"><b>${escapeHtml(s.name)}</b><p>${escapeHtml(s.desc)}</p></div><div class="shop-row-right"><div class="rating">★ ${Number(s.rating||0).toFixed(1)} (${Number(s.reviews||0)})</div><div class="mini">${escapeHtml(s.time)}</div><div class="chev">›</div></div></button>`).join(''):`<div class="empty compact-empty">ဒီ Category / Location မှာ အခုချိန် ဆိုင်မတွေ့သေးပါ။</div>`;
    }
    let currentProducts=[];
    async function openShop(id){
      const s=shops.find(x=>String(x.id)===String(id)); if(!s)return;
      state.shop=s; state.productFilter='All'; currentProducts=[];
      $('detailTitle').textContent=s.name;
      $('shopHead').innerHTML=`<div class="shop-head-top"><div class="shop-logo">${s.image_url?`<img src="${escapeHtml(s.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:14px">`:(s.icon||'▦')}</div><div><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.desc)}</p></div></div><div class="shop-head-bottom"><span class="mini">★ ${Number(s.rating||0).toFixed(1)} (${Number(s.reviews||0)} reviews)</span><span class="mini">${escapeHtml(s.time||'')}</span><span class="mini">${s.is_open===false?'Closed':'Open now'}</span></div>`;
      $('productChips').innerHTML='<button class="chip active" data-product-filter="All">All</button>';
      $('productList').innerHTML='<div class="empty compact-empty">Loading products…</div>';
      show('shopDetail');
      try{
        const client=window.HMARKET_SUPABASE;
        if(!client)throw new Error('Supabase is not ready.');
        let q=client.from('products').select('id,shop_id,category_id,name_mm,name_en,description_mm,description_en,price,image_url,is_available,sort_order,categories(name_mm,name_en)').eq('shop_id',s.id).eq('is_available',true).order('sort_order',{ascending:true}).order('created_at',{ascending:true}).limit(100);
        const {data,error}=await q;if(error)throw error;
        currentProducts=(data||[]).map(p=>({...p,cat:p.categories?.name_en||p.categories?.name_mm||'Product'}));
        const cats=['All',...new Set(currentProducts.map(p=>p.cat).filter(Boolean))];
        $('productChips').innerHTML=cats.map(c=>`<button class="chip ${c==='All'?'active':''}" data-product-filter="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
        renderProducts();
      }catch(err){currentProducts=[];$('productList').innerHTML=`<div class="empty compact-empty">${escapeHtml(err.message||'Products unavailable.')}</div>`;}
    }
    function renderProducts(){
      const filtered=state.productFilter==='All'?currentProducts:currentProducts.filter(p=>p.cat===state.productFilter);
      $('productList').innerHTML=filtered.length?filtered.map(p=>productRow(p)).join(''):'<div class="empty compact-empty">ဒီဆိုင်မှာ ရရှိနိုင်သော Product မရှိသေးပါ။</div>';
      bindQtyButtons();
    }
    function getQty(productId){const item=state.cart.find(x=>String(x.productId)===String(productId)&&String(x.shopId)===String(state.shop?.id));return item?item.qty:0}
    function productRow(p){const q=getQty(p.id);const image=p.image_url?`<img src="${escapeHtml(p.image_url)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`:escapeHtml(p.category_id?'▦':'•');const name=p.name_mm||p.name_en||'Product';const desc=p.description_mm||p.description_en||'ရရှိနိုင်ပါသည်';return `<div class="product-row"><div class="prod-thumb">${image}</div><div class="product-main"><b>${escapeHtml(name)}</b><div class="price">${money(p.price||0)}</div><div class="desc">${escapeHtml(desc)}</div><div class="qty"><button data-minus="${escapeHtml(p.id)}">−</button><span>${q}</span><button data-plus="${escapeHtml(p.id)}">+</button></div></div></div>`}
    function bindQtyButtons(){document.querySelectorAll('[data-plus],[data-minus]').forEach(btn=>{btn.onclick=()=>changeQty(btn.dataset.plus||btn.dataset.minus,btn.dataset.plus?1:-1)});}
    function changeQty(productId,delta){
      const p=currentProducts.find(x=>String(x.id)===String(productId));if(!p)return;
      let item=state.cart.find(x=>String(x.productId)===String(productId)&&String(x.shopId)===String(state.shop.id));
      if(!item&&delta>0){item={productId:p.id,shopId:state.shop.id,name:p.name_mm||p.name_en||'Product',price:Number(p.price||0),qty:0,shopName:state.shop.name,options:[],instructions:''};state.cart.push(item)}
      if(item){item.qty=Math.max(0,item.qty+delta);if(item.qty===0)state.cart=state.cart.filter(x=>x!==item)}
      renderProducts();renderCart();updateCartBar();if(delta>0)toast(`${p.name_mm||p.name_en||'Product'} ကို Cart ထဲထည့်ပြီးပါပြီ`);
    }

    function renderCart(){
      const wrap=$('cartContent');
      if(!state.cart.length){wrap.innerHTML='<div class="empty"><div style="font-size:42px">🛒</div><div style="font-weight:800;color:var(--text);margin-top:8px">Cart ထဲမှာ ပစ္စည်းမရှိသေးပါ</div><button class="primary" data-nav="shops">ဆိုင်တွေကြည့်မယ်</button></div>';return}
      const subtotal=state.cart.reduce((a,x)=>a+x.price*x.qty,0), delivery=2000, total=subtotal+delivery;
      wrap.innerHTML=`<div class="cart-items">${state.cart.map((x,i)=>`<div class="cart-item"><div class="prod-thumb">${iconFor(x.name)}</div><div class="cart-info"><b>${x.name}</b><div class="desc">${x.shopName}</div><div class="qty"><button data-cart-minus="${i}">−</button><span>${x.qty}</span><button data-cart-plus="${i}">+</button></div><div class="line-total">${money(x.price*x.qty)}</div></div><button class="remove" data-cart-remove="${i}" aria-label="Remove">×</button></div>`).join('')}</div><div class="totals"><div class="total-row"><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div class="total-row"><span>Delivery Fee</span><strong>${money(delivery)}</strong></div><div class="total-row total"><span>Total</span><span>${money(total)}</span></div><button class="primary" id="checkoutBtn">Checkout →</button></div>`;
      wrap.querySelectorAll('[data-cart-plus]').forEach(b=>b.onclick=()=>{const x=state.cart[Number(b.dataset.cartPlus)]; if(x) x.qty++; renderCart();updateCartBar()});
      wrap.querySelectorAll('[data-cart-minus]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.cartMinus); const x=state.cart[i]; if(x){x.qty--; if(x.qty<=0)state.cart.splice(i,1)} renderCart();updateCartBar()});
      wrap.querySelectorAll('[data-cart-remove]').forEach(b=>b.onclick=()=>{state.cart.splice(Number(b.dataset.cartRemove),1);renderCart();updateCartBar();toast('Cart မှ ဖယ်လိုက်ပါပြီ')});
      const checkoutBtn=$('checkoutBtn'); if(checkoutBtn) checkoutBtn.onclick=()=>toast('Checkout UI ကို V1.1 မှာ ဆက်ထည့်မယ်');
    }
    function iconFor(name){const p=currentProducts.find(x=>(x.name_mm||x.name_en)===name);return p?.image_url?`<img src="${escapeHtml(p.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`:'▦'}
    function updateCartBar(){
      const count=state.cart.reduce((a,x)=>a+x.qty,0), total=state.cart.reduce((a,x)=>a+x.qty*x.price,0);
      $('cartCount').textContent=`${count} Items`; $('cartTotal').textContent=money(total);
      $('cartBar').classList.toggle('visible',count>0 && state.screen!=='cart');
      const badge=$('navBadge'); badge.textContent=count; badge.style.display=count>0?'grid':'none';
    }

    // Smooth home banner carousel. Admin controls the banner count and interval (default 5s).
    let heroIndex=0, heroTimer=null;
    function renderHeroDots(){const dots=$('heroDots'); if(!dots)return; const count=homeBanners.length||1; dots.innerHTML=Array.from({length:count},(_,i)=>`<button class="hero-dot ${i===heroIndex?'active':''}" data-hero-dot="${i}" aria-label="Slide ${i+1}"></button>`).join('');}
    function goHero(i){const count=homeBanners.length||1;heroIndex=((i%count)+count)%count;$('heroTrack').style.transform=`translate3d(-${heroIndex*100}%,0,0)`;renderHeroDots();}
    function restartHero(){clearInterval(heroTimer);if((homeBanners.length||1)<=1)return;const ms=Math.max(2000,Number(homeBanners[heroIndex]?.auto_seconds||3.5)*1000);heroTimer=setTimeout(()=>{goHero(heroIndex+1);restartHero()},ms);}
    function bindHeroControls(){
      const prev=$('heroPrev'), next=$('heroNext'), carousel=$('heroCarousel'), dots=$('heroDots');
      if(prev) prev.onclick=()=>{goHero(heroIndex-1);restartHero()};
      if(next) next.onclick=()=>{goHero(heroIndex+1);restartHero()};
      if(carousel){
        carousel.onmouseenter=()=>clearTimeout(heroTimer);
        carousel.onmouseleave=restartHero;
      }
      if(dots){
        dots.onclick=e=>{const b=e.target.closest('[data-hero-dot]');if(!b)return;goHero(Number(b.dataset.heroDot));restartHero();};
      }
    }
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(heroTimer);else restartHero()});

    async function getBuyerLimit(){
      const c=window.HMARKET_SUPABASE;
      let limit=50000, verified=false;
      try{
        const {data:{session}}=await c.auth.getSession();
        if(session){
          const {data:p}=await c.from('profiles').select('customer_verification_status').eq('id',session.user.id).maybeSingle();
          verified=p?.customer_verification_status==='verified';
        }
      }catch(e){console.warn('Buyer verification status unavailable:',e);}
      return {limit:verified?100000:50000,verified};
    }
    async function loadRiderPaymentInfo(requestId){
      const card=$('riderPaymentCard'), info=$('riderPaymentInfo'); if(!card||!info)return;
      const c=window.HMARKET_SUPABASE;if(!c||!requestId){card.hidden=true;return;}
      try{
        const {data,error}=await c.from('purchase_requests').select('rider_id,rider_name,rider_kpay_phone,rider_wave_phone,rider_payment_name,status').eq('id',requestId).maybeSingle();
        if(error||!data||!data.rider_id||!['accepted','shopping','completed'].includes(data.status)){card.hidden=true;return;}
        info.innerHTML=`<div class="payment-line"><strong>${escapeHtml(data.rider_payment_name||data.rider_name||'Rider')}</strong></div>${data.rider_kpay_phone?`<div class="payment-line">🟢 KPay: <strong>${escapeHtml(data.rider_kpay_phone)}</strong></div>`:''}${data.rider_wave_phone?`<div class="payment-line">🔵 Wave: <strong>${escapeHtml(data.rider_wave_phone)}</strong></div>`:''}`;
        card.hidden=false;
      }catch(e){card.hidden=true;}
    }
    $('buyerForm').addEventListener('submit',async e=>{
      e.preventDefault();
      const c=window.HMARKET_SUPABASE; const f=new FormData(e.currentTarget); const amount=Number(String(f.get('amount')||'').replace(/,/g,''));
      if(!Number.isFinite(amount)||amount<=0){toast('ခန့်မှန်းဝယ်ယူတန်ဖိုး မှန်ကန်စွာထည့်ပါ');return;}
      const {limit,verified}=await getBuyerLimit();
      if(amount>limit){toast(`${verified?'Verified Customer':'ပုံမှန် Customer'} အတွက် ${money(limit)} ထက်ပို၍ Request တင်လို့မရပါ`);return;}
      if(!c){toast('Supabase ချိတ်ဆက်ပြီးမှ Request ပို့နိုင်ပါမည်');return;}
      try{
        const {data:{session}}=await c.auth.getSession();
        if(!session){toast('အဝယ်တော် အသုံးပြုရန် Login ဝင်ပါ'); if(window.openAuth)window.openAuth('login'); return;}
        const payload={user_id:session.user.id,location_id:selectedLocationId||null,item_description:String(f.get('item')||'').trim(),shop_name:String(f.get('shop')||'').trim()||null,estimated_amount:amount,payment_method:String(f.get('payment_method')||'KPay'),delivery_address:String(f.get('address')||'').trim(),customer_phone:String(f.get('phone')||'').trim(),note:String(f.get('note')||'').trim()||null,customer_verification_status:verified?'verified':'normal',max_amount:limit,status:'pending'};
        const {data,error}=await c.from('purchase_requests').insert(payload).select('id').single();
        if(error)throw error;
        e.currentTarget.reset(); $('riderPaymentCard').hidden=true; toast(`အဝယ်တော် Request လက်ခံပြီးပါပြီ · ${data?.id||''}`);
      }catch(err){console.error(err);toast('အဝယ်တော် Request မပို့နိုင်သေးပါ။ Supabase table ကို စစ်ပါ။');}
    });
    function openSupport(type){
      const sessionPromise=window.HMARKET_SUPABASE?.auth?.getSession?.();
      Promise.resolve(sessionPromise).then(r=>{
        const session=r?.data?.session;
        if(!session){toast('Support အသုံးပြုရန် Login ဝင်ပါ'); if(window.openAuth)window.openAuth('login'); else document.querySelector('[data-auth-open=login]')?.click(); return;}
        if(type==='feedback')$('feedbackModal').hidden=false; else { $('chatModal').hidden=false; loadChatMessages(); }
      }).catch(()=>{toast('Support အသုံးပြုရန် Login ဝင်ပါ');document.querySelector('[data-auth-open=login]')?.click();});
    }
    document.querySelectorAll('[data-support]').forEach(b=>b.onclick=()=>openSupport(b.dataset.support));
    document.querySelectorAll('[data-support-close]').forEach(b=>b.onclick=()=>{ $('feedbackModal').hidden=true; $('chatModal').hidden=true; });
    async function loadChatMessages(){
      const box=$('chatMessages'); const c=window.HMARKET_SUPABASE; if(!c||!box)return;
      try{const {data:{session}}=await c.auth.getSession(); if(!session)return; const {data,error}=await c.from('support_messages').select('id,sender_role,message,created_at').eq('user_id',session.user.id).order('created_at',{ascending:true}).limit(100); if(error)throw error; box.innerHTML=(data||[]).map(m=>`<div class="chat-msg ${m.sender_role==='customer'?'customer':'support'}">${escapeHtml(m.message)}</div>`).join('')||'<div class="chat-msg support">မင်္ဂလာပါ။ H MARKET Support Team ပါ။ ဘာကူညီပေးရမလဲ?</div>'; box.scrollTop=box.scrollHeight;}catch(e){console.warn('Chat history unavailable:',e);}
    }
    $('feedbackForm').addEventListener('submit',async e=>{
      e.preventDefault(); const c=window.HMARKET_SUPABASE; const f=new FormData(e.currentTarget); const btn=e.currentTarget.querySelector('button[type=submit]'); btn.disabled=true;
      try{const {data:{session}}=await c.auth.getSession(); if(!session)throw new Error('Login required'); const ticketId='HSP-'+Date.now().toString(36).toUpperCase(); const payload={user_id:session.user.id,ticket_id:ticketId,subject:f.get('subject'),category:f.get('category'),order_no:f.get('order_no')||null,message:f.get('message'),status:'Submitted'}; const {error}=await c.from('support_tickets').insert(payload); if(error)throw error; $('feedbackModal').hidden=true; e.currentTarget.reset(); toast(`Feedback လက်ခံပြီးပါပြီ · Ticket ${ticketId}`);}catch(err){console.error(err);toast('Feedback ပို့မရသေးပါ။ Supabase Support table ကို စစ်ပါ။');}finally{btn.disabled=false;}
    });
    $('chatForm').addEventListener('submit',async e=>{
      e.preventDefault(); const c=window.HMARKET_SUPABASE; const input=e.currentTarget.elements.message; const message=input.value.trim(); if(!message)return;
      try{const {data:{session}}=await c.auth.getSession(); if(!session)throw new Error('Login required'); const {error}=await c.from('support_messages').insert({user_id:session.user.id,sender_role:'customer',message}); if(error)throw error; input.value=''; await loadChatMessages();}catch(err){console.error(err);toast('Chat message မပို့နိုင်သေးပါ။');}
    });

    document.addEventListener('click',e=>{
      const external=e.target.closest('[data-external]'); if(external){window.location.href=external.dataset.external;return;}
      const nav=e.target.closest('[data-nav]'); if(nav){const target=nav.dataset.nav; if(target==='search'){ $('globalSearch').focus(); show('home'); return;} if(target==='account'){ window.location.href='../account/account.html'; return; } show(target); if(target==='cart')renderCart(); if(target==='notifications')loadNotifications(); if(target==='shops')loadShopsFromSupabase(); return;}
      const shopCat=e.target.closest('[data-shop-category]'); if(shopCat){openCategory(shopCat.dataset.shopCategory); return;}
      const cat=e.target.closest('[data-category]'); if(cat){openCategory(cat.dataset.category); return;}
      const shop=e.target.closest('[data-shop]'); if(shop){openShop(shop.dataset.shop); return;}
      const pf=e.target.closest('[data-product-filter]'); if(pf){state.productFilter=pf.dataset.productFilter;document.querySelectorAll('[data-product-filter]').forEach(b=>b.classList.toggle('active',b===pf));renderProducts();return;}
    });
    $('globalSearch').addEventListener('input',e=>{state.search=e.target.value.trim(); if(state.screen!=='shops')openCategory('Restaurant'); else renderShopList();});
    $('searchBtn').onclick=()=>{
      const row=$('searchBtn')?.closest('.search-row');
      const input=$('globalSearch');
      const btn=$('searchBtn');
      const open=!row?.classList.contains('is-open');
      row?.classList.toggle('is-open',open);
      btn?.setAttribute('aria-expanded',open?'true':'false');
      if(open){setTimeout(()=>input?.focus(),0);} else if(state.search){show('shops');renderShopList();}
    };
    document.addEventListener('click',(e)=>{
      const row=document.querySelector('.search-row');
      if(!row || !row.classList.contains('is-open')) return;
      if(!row.contains(e.target)){
        row.classList.remove('is-open');
        $('searchBtn')?.setAttribute('aria-expanded','false');
      }
    });
  updateLocationLabel();
  $('notificationBtn').addEventListener('click',()=>{show('notifications');loadNotifications();});
  $('markAllNotifications').addEventListener('click',markAllNotifications);
  $('locationBtn').addEventListener('click',openLocation);
  document.querySelectorAll('[data-location-close]').forEach(el=>el.addEventListener('click',closeLocation));
  $('locationList').addEventListener('click',e=>{const b=e.target.closest('[data-location]');if(!b)return;setLocation(b.dataset.location||'',b.dataset.locationName||'')});

  async function bootstrapCustomerHome(){
    try{
      $('connectionRetry')?.addEventListener('click',retryCustomerConnection);
      // shared/supabase.js resolves the singleton asynchronously. Wait for it
      // before the first Home/configuration render so service navigation state
      if(window.HMARKET_READY && typeof window.HMARKET_READY.then==='function'){
        try{ await window.HMARKET_READY; }catch(_err){}
      }
      renderHomeSections();
      renderCategories();
      renderShopCategoryChips('All');
      await loadActiveLocations();
      await loadHomeContent();
      if(window.HMARKET_API_ONLINE!==false) setupHomeRealtime();
    }catch(e){
      console.warn('Customer Home bootstrap failed:',e);
      applyServiceVisibility();
      renderHomeSections();
    }
  }

  bootstrapCustomerHome();

renderCart();
renderNotifications();

updateCartBar();

// Restore direct URL navigation such as customer.html?screen=cart.
// This is intentionally additive and does not change existing navigation behavior.
if(requestedScreen && document.getElementById(requestedScreen)){
  show(requestedScreen);
  if(requestedScreen==='cart') renderCart();
}
  


window.renderDynamicPartnerServices=async function(){
 const box=document.getElementById('dynamicPartnerServices');
 if(!box || !window.HMARKET_SERVICES) return;
 const services=await window.HMARKET_SERVICES.loadPartnerServices();
 box.innerHTML=services.filter(s=>s.is_active===true).map(s=>`<button class="account-btn" data-partner-action="${s.key}"><span>${s.icon} ${s.name}</span><span>›</span></button>`).join('');
};
window.addEventListener('load',()=>window.renderDynamicPartnerServices());

let homeRealtimeChannel=null;
let homeRealtimeTimer=null;
function refreshHomeRealtime(kind){
  clearTimeout(homeRealtimeTimer);
  homeRealtimeTimer=setTimeout(async()=>{
    try{
      if(kind==='location') await loadActiveLocations();
      await loadHomeContent();
    }catch(e){console.warn('Home realtime refresh failed:',e);}
  },250);
}
function setupHomeRealtime(){
  if(window.HMARKET_API_ONLINE===false){ console.info('H MARKET Home realtime skipped: API offline'); return; }
  const c=window.HMARKET_SUPABASE;
  if(!c) return;
  if(homeRealtimeChannel){try{c.removeChannel(homeRealtimeChannel);}catch(e){}}
  const tables=['home_sections','home_banners','home_banner_locations','home_featured_shops','home_featured_products','categories','shops','products','partner_applications','partner_services','partner_service_locations','hmarket_locations'];
  homeRealtimeChannel=c.channel('hmarket-customer-home-live');
  tables.forEach(table=>{
    homeRealtimeChannel.on('postgres_changes',{event:'*',schema:'public',table},()=>refreshHomeRealtime(table==='hmarket_locations'?'location':'home'));
  });
  homeRealtimeChannel.subscribe(status=>{if(status==='SUBSCRIBED')console.info('H MARKET Home realtime connected');});
}

document.addEventListener('click',function(e){
  const btn=e.target.closest('[data-partner-action]');
  if(!btn) return;
  const key=btn.dataset.partnerAction;
  const map={seller:'seller',rider:'rider',delivery:'delivery',accommodation:'accommodation',transport:'transport'};
  const mode=map[key];
  if(!mode) return;
  if(window.HMARKET_AUTH && window.HMARKET_AUTH.requireLoginForPartner){
    window.HMARKET_AUTH.requireLoginForPartner(mode);
  }
});



(function(){const p=new URLSearchParams(location.search);if(p.get('hm_preview')!=='1')return;const b=document.createElement('div');b.className='admin-preview-bar';b.innerHTML='<strong>H MARKET User Preview</strong><span>Admin session stays signed in</span><button type="button" id="backToAdminPreview">← Back to Admin</button>';document.body.appendChild(b);const st=document.createElement('style');st.textContent='.admin-preview-bar{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:100001;display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:12px;background:#0b2e6f;color:#fff;box-shadow:0 8px 30px rgba(0,0,0,.18);font:600 12px system-ui}.admin-preview-bar span{font-size:10px;opacity:.85}.admin-preview-bar button{border:1px solid rgba(255,255,255,.25);border-radius:9px;background:#fff;color:#0b2e6f;padding:7px 10px;font-weight:900;cursor:pointer}@media(max-width:700px){.admin-preview-bar{width:calc(100% - 20px);justify-content:space-between}.admin-preview-bar span{display:none}}';document.head.appendChild(st);document.getElementById('backToAdminPreview')?.addEventListener('click',()=>location.href='../admin/admin.html')})();
    if('serviceWorker' in navigator){
      window.addEventListener('load',()=>navigator.serviceWorker.register('../sw.js').catch(e=>console.warn('PWA service worker unavailable:',e)));
    }

