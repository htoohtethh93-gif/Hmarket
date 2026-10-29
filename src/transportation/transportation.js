const SERVICES = [
  {id:"t1",type:"bus",icon:"🚌",name:"Ranger Bus",company:"Ranger Transport",location:"NyaungDon",route:"NyaungDon → Yangon",detail:"Gate / Route service",schedule:"08:00 · 12:00 · 16:00",price:12000,image:""},
  {id:"t2",type:"bus",icon:"🚌",name:"Local Line Bus",company:"H MARKET Transport Partner",location:"NyaungDon",route:"NyaungDon → Pathein",detail:"Bus ticket",schedule:"09:30 · 14:30",price:10000,image:""},
  {id:"t3",type:"car",icon:"🚗",name:"Car Order",company:"H MARKET Transport Partner",location:"NyaungDon",route:"Pickup → Destination",detail:"Private car",schedule:"On demand",price:25000,image:""},
  {id:"t4",type:"motorbike",icon:"🏍️",name:"Motorbike Ride",company:"H MARKET Transport Partner",location:"NyaungDon",route:"Pickup → Destination",detail:"Motorbike",schedule:"On demand",price:5000,image:""},
  {id:"t5",type:"motor-taxi",icon:"🚕",name:"Local Car / Carry",company:"H MARKET Transport Partner",location:"NyaungDon",route:"Pickup → Destination",detail:"Local carry",schedule:"On demand",price:8000,image:""},
  {id:"t6",type:"three-wheel",icon:"🛺",name:"Three-wheel / Oway",company:"H MARKET Transport Partner",location:"NyaungDon",route:"Pickup → Destination",detail:"Three-wheel",schedule:"On demand",price:7000,image:""},
  {id:"t7",type:"ferry",icon:"⛴️",name:"Ferry Service",company:"H MARKET Transport Partner",location:"NyaungDon",route:"Gate → Gate",detail:"Ferry / Boat",schedule:"10:00 · 15:00",price:8000,image:""}
];

const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat("en-US").format(Number(n)||0)+" MMK";
let activeType="all";

function esc(v){
  return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
}

function render(){
  const q=$("#search").value.trim().toLowerCase();
  const location=$("#location").value;
  const items=SERVICES.filter(s=>
    (activeType==="all"||s.type===activeType) &&
    (location==="All Active Locations"||s.location===location) &&
    `${s.name} ${s.company} ${s.route} ${s.detail}`.toLowerCase().includes(q)
  );

  $("#count").textContent=items.length;
  $("#empty").classList.toggle("hidden",items.length>0);
  $("#list").innerHTML=items.map(s=>{
    const image=s.image?`<img src="${esc(s.image)}" alt="">`:`<span>${s.icon}</span>`;
    return `<article class="card">
      <div class="cover">${image}</div>
      <div class="body">
        <div class="name">${esc(s.name)}</div>
        <span class="type">${esc(s.company)}</span>
        <div class="meta">📍 ${esc(s.location)}</div>
        <div class="route"><strong>${esc(s.route)}</strong><span>${esc(s.detail)} · ${esc(s.schedule)}</span></div>
        <div class="price">From ${money(s.price)}</div>
        <div class="actions"><button class="btn">View</button><button class="btn primary">Book</button></div>
      </div>
    </article>`;
  }).join("");
}

document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    activeType=btn.dataset.type;
    $("#sectionTitle").textContent=activeType==="all"?"Transportation Services":btn.textContent.trim();
    render();
  });
});
$("#search").addEventListener("input",render);
$("#location").addEventListener("change",render);
render();
