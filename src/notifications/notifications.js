/* H MARKET Notifications V1
 * UI/scaffold only.
 * IMPORTANT: This file intentionally does not create, alter, or query a database.
 * Future integration point: connect existing `notifications` table and business events here.
 */
(function () {
  "use strict";

  const demoNotifications = [
    {id:1,type:"Order",title:"New Order #HM-1008",message:"A new order is waiting for seller action.",time:"Just now",unread:true},
    {id:2,type:"Order",title:"Order #HM-1007 is Ready",message:"Order is ready for rider assignment.",time:"8 min ago",unread:true},
    {id:3,type:"Partner",title:"Rider application received",message:"A new rider application is ready for review.",time:"18 min ago",unread:true},
    {id:4,type:"Payment",title:"Payment submitted",message:"A payment slip was submitted for verification.",time:"31 min ago",unread:true},
    {id:5,type:"Order",title:"Order #HM-1006 Delivered",message:"Delivery was completed successfully.",time:"1 hr ago",unread:true},
    {id:6,type:"Partner",title:"Seller approved",message:"Partner application status changed to Approved.",time:"2 hr ago",unread:false},
    {id:7,type:"Payment",title:"Settlement",message:"A settlement record is ready for processing.",time:"3 hr ago",unread:false},
    {id:8,type:"Promotion",title:"Promotion draft",message:"A promotional notification draft is available.",time:"Today",unread:false}
  ];

  const orderEvents = ["New Order","Order Accepted","Preparing","Ready","Rider Accepted","On the Way","Delivered"];
  const partnerEvents = ["Application Received","Under Review","Approved","Rejected","Suspended"];
  const paymentEvents = ["Payment Submitted","Payment Verified","Payment Rejected","Refund","Settlement"];

  const templates = [
    ["New Order","New order received","In-App","Active"],
    ["Order Accepted","Your order was accepted","In-App","Active"],
    ["Ready","Your order is ready","In-App","Active"],
    ["Application Received","Partner application received","In-App","Draft"],
    ["Payment Verified","Payment verified","In-App","Active"],
    ["Settlement","Settlement update","In-App","Draft"]
  ];

  let unreadOnly = false;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
  }

  function showToast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function notificationHtml(n) {
    return `<div class="notification ${n.unread ? "unread" : ""}" data-id="${n.id}" data-type="${escapeHtml(n.type)}">
      <span class="dot"></span>
      <div><b>${escapeHtml(n.title)}</b><p>${escapeHtml(n.message)}</p></div>
      <time>${escapeHtml(n.time)}</time>
    </div>`;
  }

  function renderRecent() {
    $("#recentList").innerHTML = demoNotifications.slice(0,5).map(notificationHtml).join("");
  }

  function renderInbox() {
    const q = ($("#searchInput")?.value || "").toLowerCase();
    const type = $("#typeFilter")?.value || "all";
    const rows = demoNotifications.filter(n => {
      const matchesText = `${n.title} ${n.message}`.toLowerCase().includes(q);
      const matchesType = type === "all" || n.type === type;
      const matchesUnread = !unreadOnly || n.unread;
      return matchesText && matchesType && matchesUnread;
    });
    $("#inboxList").innerHTML = rows.length ? rows.map(notificationHtml).join("") : `<div class="promo-box">No notifications match your filters.</div>`;
  }

  function renderStats() {
    $("#totalCount").textContent = demoNotifications.length;
    $("#unreadCount").textContent = demoNotifications.filter(n => n.unread).length;
  }

  function renderEvents(target, items, prefix) {
    $(target).innerHTML = items.map((name, i) => `<article class="event"><b>${escapeHtml(name)}</b><p>Template/event hook prepared for future business logic.</p><code>${prefix}_${i+1}</code></article>`).join("");
  }

  function renderTemplates() {
    $("#templateTable").innerHTML = templates.map((t,i) => `<tr><td>${escapeHtml(t[0])}</td><td>${escapeHtml(t[1])}</td><td>${escapeHtml(t[2])}</td><td><span class="badge">${escapeHtml(t[3])}</span></td><td><button class="link-btn" data-template="${i}">Edit</button></td></tr>`).join("");
  }

  function openView(view) {
    $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === view));
    $$(".view").forEach(v => v.classList.toggle("active", v.id === `view-${view}`));
    window.scrollTo({top:0, behavior:"smooth"});
  }

  function markRead(id) {
    const n = demoNotifications.find(x => x.id === Number(id));
    if (n) {
      n.unread = false;
      renderRecent(); renderInbox(); renderStats();
    }
  }

  $$(".tab").forEach(tab => tab.addEventListener("click", () => openView(tab.dataset.view)));
  $$("[data-open]").forEach(btn => btn.addEventListener("click", () => openView(btn.dataset.open)));
  $("#recentList").addEventListener("click", e => { const n=e.target.closest(".notification"); if(n) { markRead(n.dataset.id); showToast("Marked as read (UI only)."); }});
  $("#inboxList").addEventListener("click", e => { const n=e.target.closest(".notification"); if(n) { markRead(n.dataset.id); }});
  $("#markAllRead").addEventListener("click", () => {
    demoNotifications.forEach(n => n.unread=false);
    renderRecent(); renderInbox(); renderStats(); showToast("All notifications marked as read (UI only).");
  });
  $("#unreadOnly").addEventListener("click", (e) => {
    unreadOnly = !unreadOnly;
    e.currentTarget.textContent = unreadOnly ? "Showing unread" : "Unread only";
    e.currentTarget.classList.toggle("primary", unreadOnly);
    renderInbox();
  });
  $("#searchInput").addEventListener("input", renderInbox);
  $("#typeFilter").addEventListener("change", renderInbox);
  $("#newNotification").addEventListener("click", () => showToast("New notification composer will be connected later."));
  $$("[data-toast]").forEach(b => b.addEventListener("click", () => showToast(b.dataset.toast)));

  $("#addTemplate").addEventListener("click", () => $("#templateDialog").showModal());
  $("#templateForm").addEventListener("submit", (e) => {
    e.preventDefault();
    templates.push([
      $("#templateEvent").value,
      $("#templateTitle").value,
      $("#templateChannel").value,
      "Draft"
    ]);
    renderTemplates();
    $("#templateDialog").close();
    $("#templateForm").reset();
    showToast("Template added to V1 UI only.");
  });

  renderRecent(); renderInbox(); renderStats(); renderTemplates();
  renderEvents("#orderEvents", orderEvents, "ORDER");
  renderEvents("#partnerEvents", partnerEvents, "PARTNER");
  renderEvents("#paymentEvents", paymentEvents, "PAYMENT");

  // Future integration API — deliberately no DB/network behavior in V1.
  window.HMARKET_NOTIFICATIONS_V1 = {
    version: "1.0",
    emit: function (eventName, payload) {
      console.info("[H MARKET Notifications] future event hook:", eventName, payload || {});
      showToast(`Event hook ready: ${eventName}`);
    },
    supportedChannels: ["In-App","Email","Push","Telegram","Viber","SMS"],
    orderEvents,
    partnerEvents,
    paymentEvents
  };
})();
