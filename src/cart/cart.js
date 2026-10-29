(() => {
  const $ = s => document.querySelector(s);
  const KEY = "hmarket_cart";
  let cart = load();

  function load(){
    try{
      const v = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(v) ? v : [];
    }catch(e){ return []; }
  }
  function save(){ localStorage.setItem(KEY, JSON.stringify(cart)); }
  function money(n){ return Number(n||0).toLocaleString("en-US") + " MMK"; }
  function group(){
    const m = new Map();
    cart.forEach((item,i)=>{
      const shopId = item.shop_id || "unknown";
      if(!m.has(shopId)) m.set(shopId,{shop_id:shopId,shop_name:item.shop_name||"Shop",items:[]});
      m.get(shopId).items.push({...item,_index:i});
    });
    return [...m.values()];
  }

  function render(){
    const groups = group();
    $("#emptyState").classList.toggle("hidden", groups.length>0);
    $("#summary").classList.toggle("hidden", groups.length===0);
    $("#cartList").innerHTML = groups.map(g=>`
      <section class="shop-group">
        <div class="shop-head">🏪 ${escapeHtml(g.shop_name)}</div>
        ${g.items.map(item=>`
          <div class="cart-item">
            <div class="item-img">${item.image_url?`<img src="${escapeAttr(item.image_url)}" alt="">`:"🍽️"}</div>
            <div>
              <div class="item-name">${escapeHtml(item.name||"Product")}</div>
              <div class="item-meta">${item.variant?escapeHtml(item.variant):""}</div>
              <div class="price">${money(item.price)}</div>
              <div class="qty">
                <button data-action="minus" data-index="${item._index}">−</button>
                <span>${Number(item.qty||1)}</span>
                <button data-action="plus" data-index="${item._index}">+</button>
              </div>
            </div>
            <button class="delete" data-action="delete" data-index="${item._index}">×</button>
          </div>
        `).join("")}
      </section>
    `).join("");

    const subtotal = cart.reduce((sum,x)=>sum+Number(x.price||0)*Number(x.qty||1),0);
    const delivery = 0;
    $("#subtotal").textContent = money(subtotal);
    $("#deliveryFee").textContent = money(delivery);
    $("#total").textContent = money(subtotal+delivery);
  }

  function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
  function escapeAttr(v){return escapeHtml(v);}

  $("#cartList").addEventListener("click",e=>{
    const btn=e.target.closest("[data-action]");
    if(!btn)return;
    const i=Number(btn.dataset.index);
    if(!cart[i])return;
    if(btn.dataset.action==="plus") cart[i].qty=Number(cart[i].qty||1)+1;
    if(btn.dataset.action==="minus"){
      cart[i].qty=Number(cart[i].qty||1)-1;
      if(cart[i].qty<=0) cart.splice(i,1);
    }
    if(btn.dataset.action==="delete") cart.splice(i,1);
    save(); render();
  });

  $("#checkoutBtn").addEventListener("click",()=>{
    if(!cart.length)return;
    localStorage.setItem("hmarket_checkout_cart",JSON.stringify(cart));
    window.location.href="../order/order.html";
  });
  $("#shopBtn").addEventListener("click",()=>window.location.href="../shop/shop.html");
  $("#backBtn").addEventListener("click",()=>history.back());

  window.HMARKET_CART = {
    get:()=>[...cart],
    add(item){
      const key = `${item.shop_id||""}|${item.product_id||""}|${item.variant||""}`;
      const found=cart.find(x=>`${x.shop_id||""}|${x.product_id||""}|${x.variant||""}`===key);
      if(found) found.qty=Number(found.qty||1)+Number(item.qty||1);
      else cart.push({...item,qty:Number(item.qty||1)});
      save(); render();
    },
    clear(){cart=[];save();render();}
  };

  render();
})();
