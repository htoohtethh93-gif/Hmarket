const panels=[...document.querySelectorAll(".panel")],navs=[...document.querySelectorAll(".nav")];
function openPanel(id){panels.forEach(p=>p.classList.toggle("active",p.id===id));navs.forEach(n=>n.classList.toggle("active",n.dataset.panel===id));if(history.replaceState)history.replaceState(null,"","#"+id)}
navs.forEach(n=>n.addEventListener("click",()=>openPanel(n.dataset.panel)));
const hash=location.hash.slice(1);if(hash&&document.getElementById(hash))openPanel(hash);
