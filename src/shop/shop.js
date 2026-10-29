(() => {
  const $ = s => document.querySelector(s);
  const client = window.HMARKET_SUPABASE;
  const categories = [
    ["All","အားလုံး"],["Restaurant","စားသောက်ဆိုင်"],["Food","အစားအသောက်"],
    ["Pharmacy","ဆေးဆိုင်"],["Market","စျေး"],["Fashion","အဝတ်အစား"],
    ["Electronic","အီလက်ထရွန်းနစ်"],["Hotel & Stay","ဟိုတယ် / တည်းခို"],
    ["Building Materials","အိမ်ဆောက်ပစ္စည်း"],["Other","အခြား"]
  ];
  let shops = [];
  let activeCategory = "All";
  let search = "";

  function esc(v){
    return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  }

  function renderChips(){
    $("#categoryChips").innerHTML = categories.map(([en,mm]) =>
      `<button class="chip ${en===activeCategory?"active":""}" data-cat="${esc(en)}">${esc(mm)} · ${esc(en)}</button>`
    ).join("");
  }

  function categoryName(s){
    return s?.categories?.name_en || s?.categories?.name_mm || "Other";
  }

  function render(){
    const q = search.trim().toLowerCase();
    const list = shops.filter(s => {
      const cat = categoryName(s);
      const catOK = activeCategory==="All" || cat===activeCategory;
      const text = `${s.name||""} ${s.description||""} ${cat}`.toLowerCase();
      return catOK && (!q || text.includes(q));
    });

    $("#emptyState").classList.toggle("hidden", list.length !== 0);
    $("#shopList").innerHTML = list.map(s => `
      <article class="shop-card" data-shop-id="${esc(s.id)}">
        <div class="shop-img">${s.logo_url||s.image_url ? `<img src="${esc(s.logo_url||s.image_url)}" alt="">` : "🏪"}</div>
        <div class="shop-body">
          <div class="shop-name">${esc(s.name)}</div>
          <div class="meta">${esc(categoryName(s))}${s.address ? " · "+esc(s.address) : ""}</div>
          <div class="row">
            <span class="rating">⭐ ${Number(s.rating||5).toFixed(1)} (${Number(s.review_count||0)})</span>
            <span class="open">${esc(s.status||"approved")}</span>
          </div>
        </div>
      </article>
    `).join("");
  }

  async function load(){
    if(!client){
      shops = [];
      render();
      return;
    }
    try{
      let q = client
        .from("shops")
        .select("id,name,description,address,logo_url,image_url,rating,review_count,delivery_time,location_id,status,categories(name_en,name_mm)")
        .eq("status","approved")
        .order("created_at",{ascending:false})
        .limit(100);

      const locationId = localStorage.getItem("hmarket_selected_location_id");
      if(locationId) q = q.eq("location_id", locationId);

      const {data,error} = await q;
      if(error) throw error;
      shops = data || [];
    }catch(error){
      console.warn("Shop module load failed:", error);
      shops = [];
    }
    render();
  }

  $("#categoryChips").addEventListener("click", e => {
    const btn = e.target.closest("[data-cat]");
    if(!btn) return;
    activeCategory = btn.dataset.cat;
    renderChips(); render();
  });

  $("#searchInput").addEventListener("input", e => {
    search = e.target.value;
    render();
  });

  $("#refreshBtn").addEventListener("click", load);
  $("#backBtn").addEventListener("click", () => history.back());

  $("#shopList").addEventListener("click", e => {
    const card = e.target.closest("[data-shop-id]");
    if(!card) return;
    const id = card.dataset.shopId;
    window.location.href = `../shop/shop.html?shop_id=${encodeURIComponent(id)}`;
  });

  renderChips();
  load();
})();
