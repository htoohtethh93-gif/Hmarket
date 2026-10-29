// H MARKET Partner Services Dynamic Control
// Customer UI reads ONLY services that are currently ON in public.partner_services.
(function(){
  async function loadPartnerServices(){
    try{
      const c=await window.HMARKET_READY;
      if(!c) return [];

      const {data,error}=await c
        .from('partner_services')
        .select('service_key,service_name,icon,is_active')
        .eq('is_active',true)
        .order('service_key',{ascending:true});

      if(error){
        console.warn('Partner services query failed:',error);
        return [];
      }

      const order={seller:1,rider:2,delivery:3,transport:4,accommodation:5};
      return (data||[])
        .map(x=>({
          key:x.service_key,
          name:x.service_name,
          icon:x.icon || '🤝',
          is_active:x.is_active===true,
          active:x.is_active===true,
          sort_order:order[x.service_key]||99
        }))
        .filter(x=>x.key && x.is_active)
        .sort((a,b)=>a.sort_order-b.sort_order);
    }catch(e){
      console.warn('Partner services unavailable:',e);
      return [];
    }
  }

  
  function subscribePartnerServices(callback){
    try{
      const c=window.HMARKET_READY;
      if(!c) return null;
      return c.then(db=>{
        const channel=db.channel('partner-services-live')
          .on('postgres_changes',
            {event:'*',schema:'public',table:'partner_services'},
            ()=>{ if(typeof callback==='function') callback(); }
          )
          .subscribe();
        return channel;
      });
    }catch(e){
      console.warn('Partner realtime unavailable:',e);
      return null;
    }
  }

  window.HMARKET_SERVICES={loadPartnerServices,subscribePartnerServices};
})();
