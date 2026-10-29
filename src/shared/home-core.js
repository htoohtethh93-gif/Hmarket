/* H MARKET Shared Home Core
 * Canonical Home contract:
 * Admin -> canonical DB -> shared core -> domain renderer -> UI.
 */
(function(){
  const H={};
  const aliases={
    popular_shops:'popular_shop', popular_foods:'popular_food',
    hotel:'hotel_stay', accommodation:'hotel_stay',
    buyer:'buy_for_me', buy_for_me_service:'buy_for_me',
    featured_shops:'featured'
  };
  H.canonicalKey=function(key){ return aliases[key]||key; };
  H.loadSections=async function(client,locationId){
    if(!client) return {data:[],error:null};
    const result=await client.rpc('get_home_sections',{p_location_id:locationId||null});
    if(result.error) return result;
    return {data:Array.isArray(result.data)?result.data:[],error:null};
  };
  H.toMap=function(rows){
    const map=new Map();
    (rows||[]).forEach(row=>{ if(row?.section_key) map.set(row.section_key,row); });
    return map;
  };
  H.find=function(rows,keys){
    const map=H.toMap(rows);
    for(const key of (keys||[])) { const row=map.get(key); if(row) return row; }
    return null;
  };
  H.isVisible=function(section){ return !!section && section.is_active===true && section.show_on_home===true; };
  H.sort=function(rows){ return [...(rows||[])].sort((a,b)=>Number(a.display_order||0)-Number(b.display_order||0)||String(a.section_key||'').localeCompare(String(b.section_key||''))); };
  H.selectedIds=function(section){
    return Array.isArray(section?.item_ids)?section.item_ids.map(String).filter(Boolean):[];
  };
  H.routeAction=function(route){
    if(!route) return null;
    if(route.startsWith('../')) return {type:'external',value:route};
    if(route.startsWith('customer://')) return {type:'customer',value:route.slice('customer://'.length)};
    return null;
  };
  window.HMARKET_HOME=H;
})();
