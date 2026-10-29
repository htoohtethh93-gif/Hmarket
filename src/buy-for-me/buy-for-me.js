const KEY = "hmarket_buy_for_me_draft";

const $ = (s) => document.querySelector(s);

function saveDraft(){
  const payment = document.querySelector('input[name="payment"]:checked')?.value || "KPay";
  const draft = {
    item_name: $("#itemName").value.trim(),
    details: $("#details").value.trim(),
    pickup_place: $("#pickupPlace").value.trim(),
    pickup_address: $("#pickupAddress").value.trim(),
    estimated_budget: Number($("#budget").value || 0),
    delivery_address: $("#deliveryAddress").value.trim(),
    phone: $("#phone").value.trim(),
    special_instructions: $("#instructions").value.trim(),
    payment_method: payment,
    transaction_last6: $("#last6").value.trim(),
    created_at: new Date().toISOString()
  };
  localStorage.setItem(KEY, JSON.stringify(draft));
  return draft;
}

function loadDraft(){
  try{
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    if(!d) return;
    $("#itemName").value = d.item_name || "";
    $("#details").value = d.details || "";
    $("#pickupPlace").value = d.pickup_place || "";
    $("#pickupAddress").value = d.pickup_address || "";
    $("#budget").value = d.estimated_budget || "";
    $("#deliveryAddress").value = d.delivery_address || "";
    $("#phone").value = d.phone || "";
    $("#instructions").value = d.special_instructions || "";
    $("#last6").value = d.transaction_last6 || "";
    if(d.payment_method){
      const radio = document.querySelector(`input[name="payment"][value="${d.payment_method}"]`);
      if(radio){ radio.checked = true; radio.dispatchEvent(new Event("change")); }
    }
  }catch(e){}
}

$("#photos").addEventListener("change",()=>{
  const files = Array.from($("#photos").files || []);
  $("#photoCount").textContent = `${files.length} / 3 photos`;
  if(files.length > 3){
    $("#message").textContent = "အများဆုံး 3 ပုံသာ ထည့်နိုင်ပါတယ်။";
    $("#photos").value = "";
    $("#photoCount").textContent = "အများဆုံး 3 ပုံ";
    $("#preview").innerHTML = "";
    return;
  }
  $("#preview").innerHTML = "";
  files.forEach(file=>{
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = "Buy-for-me item";
    $("#preview").appendChild(img);
  });
});

document.querySelectorAll('input[name="payment"]').forEach(r=>{
  r.addEventListener("change",()=>{
    document.querySelectorAll(".payment").forEach(x=>x.classList.remove("active"));
    r.closest(".payment").classList.add("active");
  });
});

$("#slip").addEventListener("change",()=>{
  const file = $("#slip").files?.[0];
  if(!file){ $("#slipPreview").classList.add("hidden"); return; }
  $("#slipPreview").src = URL.createObjectURL(file);
  $("#slipPreview").classList.remove("hidden");
});

$("#buyForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const msg = $("#message");
  const photos = Array.from($("#photos").files || []);
  const budget = Number($("#budget").value || 0);
  const payment = document.querySelector('input[name="payment"]:checked')?.value;

  if(photos.length < 1 || photos.length > 3){
    msg.textContent = "ပစ္စည်းဓာတ်ပုံ 1–3 ပုံ ထည့်ပါ။";
    return;
  }
  if(budget <= 0){
    msg.textContent = "ခန့်မှန်းပစ္စည်းဖိုး ထည့်ပါ။";
    return;
  }
  if(!$("#slip").files?.[0]){
    msg.textContent = "အဝယ်တော်အတွက် Payment Slip ထည့်ပါ။";
    return;
  }
  if(!/^\d{6}$/.test($("#last6").value.trim())){
    msg.textContent = "Transaction ID နောက်ဆုံး 6 လုံး ထည့်ပါ။";
    return;
  }

  const draft = saveDraft();
  const request = {
    ...draft,
    photo_count: photos.length,
    status: "PENDING_PAYMENT_REVIEW",
    rider_job_status: "WAITING",
    purchase_amount_status: "PREPAID_OR_AUTHORIZED",
    note: "Database request creation and rider assignment will be connected in integration phase."
  };
  localStorage.setItem("hmarket_buy_for_me_request", JSON.stringify(request));
  msg.textContent = "အဝယ်တော် Request အချက်အလက်ကို သိမ်းထားပါပြီ။ Database/Rider ချိတ်ဆက်မှုကို integration အဆင့်မှာ ဆက်လုပ်မယ်။";
});

loadDraft();
