const PROPERTIES = [
  {
    id:"demo-accom-1",
    name:"H MARKET Stay",
    type:"Guesthouse",
    location:"NyaungDon",
    rating:4.8,
    rooms:[
      {name:"Standard Room",guests:2,price:45000},
      {name:"Family Room",guests:4,price:70000}
    ],
    image:""
  },
  {
    id:"demo-accom-2",
    name:"H MARKET Resort",
    type:"Resort",
    location:"NyaungDon",
    rating:4.6,
    rooms:[
      {name:"Deluxe Room",guests:2,price:90000},
      {name:"Family Villa",guests:5,price:150000}
    ],
    image:""
  }
];

const $ = s => document.querySelector(s);
const money = n => new Intl.NumberFormat("en-US").format(Number(n)||0) + " MMK / night";

function esc(v){
  return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
}

function render(){
  const q=$("#search").value.trim().toLowerCase();
  const type=$("#type").value;
  const items=PROPERTIES.filter(p=>
    (!type||p.type===type) &&
    `${p.name} ${p.type} ${p.location}`.toLowerCase().includes(q)
  );

  $("#count").textContent=items.length;
  $("#empty").classList.toggle("hidden",items.length>0);

  $("#properties").innerHTML=items.map(p=>{
    const image=p.image?`<img src="${esc(p.image)}" alt="">`:"🏨";
    return `<article class="card">
      <div class="cover">${image}</div>
      <div class="body">
        <div class="name">${esc(p.name)}</div>
        <span class="type">${esc(p.type)}</span>
        <div class="meta">📍 ${esc(p.location)}</div>
        <div class="rating">⭐ ${p.rating.toFixed(1)} · Reviews</div>
        <div class="rooms">
          ${p.rooms.map(r=>`<div class="room"><b>${esc(r.name)}</b><span>👤 ${r.guests} guests</span><br><b>${money(r.price)}</b></div>`).join("")}
        </div>
        <div class="actions">
          <button class="btn">View Property</button>
          <button class="btn primary">Book</button>
        </div>
      </div>
    </article>`;
  }).join("");
}
$("#search").addEventListener("input",render);
$("#type").addEventListener("change",render);
render();
