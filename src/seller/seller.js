const panels=[...document.querySelectorAll(".panel")];
const navs=[...document.querySelectorAll(".nav")];

function openPanel(id){
  panels.forEach(p=>p.classList.toggle("active",p.id===id));
  navs.forEach(n=>n.classList.toggle("active",n.dataset.panel===id));
  if(id==="logout") return;
  history.replaceState(null,"","#"+id);
}
navs.forEach(n=>n.addEventListener("click",()=>openPanel(n.dataset.panel)));
const initial=location.hash.slice(1);
if(initial && document.getElementById(initial)) openPanel(initial);
