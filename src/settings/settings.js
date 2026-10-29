(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));

  $$('.nav').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.nav').forEach(x=>x.classList.remove('active'));
    $$('.panel').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.panel)?.classList.add('active');
  }));

  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  async function readExistingPartnerServices(){
    const box=$('#serviceList');
    box.innerHTML='<div class="empty">Checking existing <code>partner_services</code> table…</div>';
    try{
      const client=window.HMARKET_SUPABASE;
      if(!client) throw new Error('Supabase client is not ready');
      const {data,error}=await client.from('partner_services').select('service_key,service_name,icon,is_active').order('service_key',{ascending:true});
      if(error) throw error;
      if(!data?.length){box.innerHTML='<div class="empty">No partner service records found.</div>';return;}
      box.innerHTML=data.map(x=>`<div class="service-item"><div class="meta"><span class="icon">${esc(x.icon||'🤝')}</span><div><b>${esc(x.service_name||x.service_key)}</b><small>${esc(x.service_key)}</small></div></div><span class="badge ${x.is_active?'on':'off'}">${x.is_active?'ON':'OFF'}</span></div>`).join('');
      $('#partnerCount').textContent=`${data.length} services`;
    }catch(err){
      console.warn('Settings V1: partner_services read failed',err);
      box.innerHTML='<div class="empty">Could not read existing partner_services. V1 made no database changes.<br><small>Check Supabase connection / RLS later.</small></div>';
    }
  }

  $('#loadServices')?.addEventListener('click',readExistingPartnerServices);
  window.HMARKET_SETTINGS_V1={readExistingPartnerServices};
})();
