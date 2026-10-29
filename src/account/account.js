(() => {
  const $ = s => document.querySelector(s);
  let client = null;

  async function getClient(){
    if(client) return client;
    try {
      client = await window.HMARKET_READY;
      return client;
    } catch {
      return null;
    }
  }

  function initials(name){
    const t = String(name || "Guest").trim();
    return t ? t.charAt(0).toUpperCase() : "?";
  }

  function setGuest(){
    $("#profileName").textContent = "Guest";
    $("#profileSub").textContent = "Login to your H MARKET account";
    $("#avatar").textContent = "?";
    $("#guestActions").classList.remove("hidden");
    $("#memberActions").classList.add("hidden");
  }

  function setMember(user){
    const meta = user?.user_metadata || {};
    const name = meta.full_name || meta.name || user?.email || "H MARKET User";
    $("#profileName").textContent = name;
    $("#profileSub").textContent = user?.email || "H MARKET Member";
    const photo = meta.avatar_url || meta.picture;
    $("#avatar").innerHTML = photo
      ? `<img src="${String(photo).replace(/"/g,"&quot;")}" alt="">`
      : initials(name);
    $("#guestActions").classList.add("hidden");
    $("#memberActions").classList.remove("hidden");
  }

  async function refresh(){
    const c = await getClient();
    if(!c){ setGuest(); return; }
    try{
      const {data} = await c.auth.getSession();
      if(data?.session?.user) setMember(data.session.user);
      else setGuest();
    }catch(e){
      console.warn("Account session check failed:",e);
      setGuest();
    }
  }

  async function renderPartners(){
    const box = $("#partnerServices");
    try{
      const services = window.HMARKET_SERVICES?.loadPartnerServices
        ? await window.HMARKET_SERVICES.loadPartnerServices()
        : [];
      const rows = services.length ? services : [
        {icon:"🏪", name:"Become a Seller"},
        {icon:"🏍️", name:"Become a Rider Partner"},
        {icon:"🚚", name:"Become a Delivery Partner"},
        {icon:"🚌", name:"Become a Transport Partner"},
        {icon:"🏨", name:"Become an Accommodation Partner"}
      ];
      box.innerHTML = rows.map(s=>`<button class="account-row partner-btn" data-partner="${String(s.name).replace(/"/g,'&quot;')}"><span>${s.icon || "🤝"} ${s.name}</span><b>›</b></button>`).join("");
    }catch(e){
      box.innerHTML = `<div class="partner-note">Partner services will appear here.</div>`;
    }
  }

  $("#backBtn").addEventListener("click",()=>history.back());
  $("#loginBtn").addEventListener("click",()=>{ window.location.href="../customer/customer.html?auth=login"; });
  $("#registerBtn").addEventListener("click",()=>{ window.location.href="../customer/customer.html?auth=register"; });

  document.addEventListener("click",(e)=>{
    const btn=e.target.closest(".partner-btn");
    if(!btn) return;
    window.location.href="../customer/customer.html?auth=login&partner="+encodeURIComponent(btn.dataset.partner||"");
  });

  $("#logoutBtn").addEventListener("click",async()=>{
    const c = await getClient();
    if(!c) return;
    const {error} = await c.auth.signOut();
    if(error){ console.warn("Logout failed:",error); return; }
    setGuest();
  });

  (async()=>{
    const c = await getClient();
    if(c?.auth?.onAuthStateChange){
      c.auth.onAuthStateChange(()=>setTimeout(refresh,0));
    }
    await refresh();
    renderPartners();
  })();
})();
