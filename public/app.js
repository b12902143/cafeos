const $ = (s) => document.querySelector(s);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const ids = () => crypto.randomUUID();
const query = new URLSearchParams(location.search),
  customerOnly = location.pathname === "/customer";
let lang = localStorage.getItem("cafeos-lang") ?? "en",
  view = customerOnly ? "counter" : "overview",
  customer = query.get("customer") ?? "Aria",
  state = null,
  demo = { index: -1, total: 17, active: false },
  connections = 0,
  connected = false,
  remote = {},
  audioReady = false,
  busy = false,
  speaking = false,
  auto = false,
  muted = false,
  selected = null,
  messages = [],
  seenCue = -1,
  ws,
  reconnectTimer,
  latency = null;
let player = new Audio(),
  audioContext,
  analyser,
  audioNode,
  record = null,
  playbackGeneration = 0;
const words = {
  zh: {
    workspace: "工作空間",
    overview: "店務總覽",
    counter: "語音櫃檯",
    bar: "吧台助手",
    pantry: "原料庫存",
    network: "連線與紀錄",
    location: "日常咖啡",
    locationSub: "台北 · 示範店",
    sidebarLabel: "店務",
    powered: "推論在遠端 GPU",
    remoteNote: "讓畫面保持輕盈。語音與模型交給遠端 GPU。",
    role: "店務工作空間",
    profile: "CafeOS 團隊",
    online: "即時同步中",
    offline: "重新連線中",
    share: "開啟顧客畫面",
    welcome: "讓忙碌，也有餘裕。",
    sub: "一段自然對話，讓整間店步調一致。",
    heroTop: "為每一杯，用心協作",
    heroTitle: "忙碌的早晨，\n從容的咖啡店。",
    heroSub: "顧客、店員與庫存，在同一個節奏裡。",
    heroTag: "每一個變更，都有人接住。",
    metricOrders: "吧台待製作",
    metricChanges: "待接受改單",
    metricOat: "燕麥奶可用份數",
    voice: "一段對話，整間店同步",
    voiceSub: "點餐、改單，或請助手帶你做下一步。",
    curated: "預製台詞",
    live: "遠端推論",
    ready: "準備好聽你說",
    speaking: "CafeOS 正在說話",
    thinking: "正在處理你的需求",
    listening: "正在錄音 · 再按一次停止",
    voiceHint: "先用示範體驗，或直接說出你想點什麼。",
    emptyChat:
      "「兩杯拿鐵，第二杯用燕麥奶。」\n自然說話，CafeOS 會替你整理訂單。",
    placeholder: "點一杯，或改一下你的訂單…",
    send: "傳送",
    mic: "錄音",
    stopMic: "停止錄音",
    hint1: "一杯冰燕麥拿鐵",
    hint2: "第二杯改成熱的",
    hint3: "確認送出訂單",
    queue: "吧台訂單",
    queueSub: "每一張單，都跟得上對話。",
    queueEmpty: "下一杯，就從這裡開始。",
    queueEmptySub: "送出訂單後，吧台與庫存會同步更新。",
    queueFoot: "顧客送單後才預留原料",
    draft: "草稿",
    confirmed: "製作佇列",
    complete: "待取餐",
    collected: "已取餐",
    collect: "確認已交付",
    cancelled: "已取消",
    queued: "待製作",
    making: "製作中",
    readyItem: "可取餐",
    hot: "熱",
    iced: "冰",
    regular: "標準",
    large: "大杯",
    dairy: "鮮奶",
    oat: "燕麥奶",
    none: "無奶",
    total: "合計",
    version: "版本",
    confirm: "送到吧台",
    cancel: "取消",
    start: "開始製作",
    finish: "完成出杯",
    coach: "語音指導",
    pending: "顧客希望改單",
    accept: "接受改單",
    reject: "保留原單",
    inventory: "原料，心裡有數。",
    inventorySub: "可用與預留，各有歸屬。",
    portion: "份",
    reserved: "預留",
    available: "可用",
    restock: "補貨 +5",
    activity: "店裡剛剛發生的事",
    activitySub: "對話背後，每一步都有跡可循。",
    activityEmpty: "下一個動作會出現在這裡。\n訂單、改單和出杯都有同一份紀錄。",
    directorTop: "CAFEOS · 引導示範",
    directorIntro: "三位顧客。一位店員。一份共同的狀態。",
    directorSub: "預製對話 · 真實店務交易 · 遠端 GPU 合成語音",
    demoStart: "開始示範",
    demoNext: "下一幕",
    demoAuto: "自動播放",
    demoPause: "暫停",
    demoReset: "重來",
    demoEnd: "示範完成",
    demoLive: "自由操作",
    mute: "靜音",
    unmute: "開啟聲音",
    menu: "今天喝什麼？",
    menuSub: "簡單選，或直接用語音點餐。",
    add: "加入訂單",
    options: "依你的喜好",
    size: "容量",
    temperature: "溫度",
    milk: "牛奶",
    coachTitle: "一杯一杯，做得更好。",
    coachSub: "選一杯製作中的飲料，助手會依實際訂單帶你往下做。",
    coachCurrent: "目前步驟",
    nextStep: "這步完成",
    readStep: "讀給我聽",
    recipeBasis: "店內配方 + 店員回報進度",
    networkTitle: "同一間店，同一份狀態。",
    networkSub: "看見同步、重試與遠端推論的實際狀況。",
    networkClient: "連線畫面",
    networkStore: "店務交易引擎",
    networkGPU: "遠端 GPU 推論",
    networkClientSub: "每個畫面透過 WebSocket 接收更新。重連後取得最新狀態。",
    networkStoreSub: "庫存預留、版本檢查與請求去重，由店務程式處理。",
    networkGPUSub:
      "即時操作在遠端 GPU 解析需求；示範使用我製作的台詞與預先合成語音。",
    showQR: "同一個工作空間，另一個畫面。",
    shareNote: "同一台電腦直接開啟。手機需先將伺服器綁定區網並填入可連線網址。",
    baseURL: "工作空間網址",
    openCustomer: "開啟顧客櫃檯",
    selected: "已選取",
    listenUnavailable: "尚未備妥語音，先顯示台詞。",
    recordError: "麥克風無法使用，請以文字輸入。",
    customerTitle: "你的咖啡，照你的意思。",
    customerSub: "告訴我們想喝什麼，其餘的交給 CafeOS。",
    pantryTitle: "每份原料，都算得清楚。",
    pantrySub: "送單預留、出杯扣帳。讓忙碌時也不會超賣。",
    barTitle: "專注手中的這一杯。",
    barSub: "訂單、改單與下一步指導，都在手邊。",
    counterTitle: "自然說話，就能好好點餐。",
    counterSub: "先整理草稿，確認後才交給吧台。",
    retry: "重新連線",
    edit: "修改",
    editTitle: "修改這杯飲料",
    saveChange: "儲存變更",
    close: "關閉",
    notReady: "遠端模型尚未就緒，請先使用引導示範或手動點餐。",
  },
  en: {
    workspace: "Workspace",
    overview: "Overview",
    counter: "Voice counter",
    bar: "Barista copilot",
    pantry: "Pantry",
    network: "Connections & log",
    location: "Daylight Coffee",
    locationSub: "Taipei · Demo café",
    sidebarLabel: "Your café",
    powered: "Inference on the remote GPU",
    remoteNote: "A light workspace. A powerful GPU behind the conversation.",
    role: "Café workspace",
    profile: "CafeOS team",
    online: "Live sync connected",
    offline: "Reconnecting",
    share: "Customer screen",
    welcome: "A little less rush. A lot more flow.",
    sub: "One natural conversation. A whole café in sync.",
    heroTop: "MADE FOR THE PEOPLE BEHIND THE CUP",
    heroTitle: "A calmer kind\nof rush hour.",
    heroSub: "Customers, crew, and stock. In the same rhythm.",
    heroTag: "Every change finds its way.",
    metricOrders: "Drinks at the bar",
    metricChanges: "Changes to review",
    metricOat: "Oat portions available",
    voice: "One conversation. Everyone in sync.",
    voiceSub: "Order, change your mind, or ask what comes next.",
    curated: "Curated playback",
    live: "Remote inference",
    ready: "Here, and listening.",
    speaking: "CafeOS is speaking",
    thinking: "Working on your request",
    listening: "Recording · tap again to stop",
    voiceHint: "Try the guided demo, or tell us your usual.",
    emptyChat:
      "“Two lattes. Make the second one oat.”\nSay it your way. We’ll keep the details together.",
    placeholder: "Order a coffee, or change your ticket…",
    send: "Send",
    mic: "Record voice",
    stopMic: "Stop recording",
    hint1: "One iced oat latte",
    hint2: "Make the second one hot",
    hint3: "Confirm my order",
    queue: "At the bar",
    queueSub: "Tickets that keep up with the conversation.",
    queueEmpty: "The next cup starts here.",
    queueEmptySub: "Send an order to see the bar and pantry update together.",
    queueFoot: "Ingredients are reserved when an order is sent",
    draft: "Draft",
    confirmed: "In the queue",
    complete: "Ready for pickup",
    collected: "Collected",
    collect: "Mark collected",
    cancelled: "Cancelled",
    queued: "Queued",
    making: "Making",
    readyItem: "Ready",
    hot: "Hot",
    iced: "Iced",
    regular: "Regular",
    large: "Large",
    dairy: "Dairy",
    oat: "Oat",
    none: "No milk",
    total: "Total",
    version: "version",
    confirm: "Send to bar",
    cancel: "Cancel",
    start: "Start",
    finish: "Ready",
    coach: "Guide me",
    pending: "Customer requested a change",
    accept: "Accept change",
    reject: "Keep original",
    inventory: "A pantry you can count on.",
    inventorySub: "Available, reserved, and accounted for.",
    portion: "portions",
    reserved: "reserved",
    available: "available",
    restock: "+5 portions",
    activity: "Around the café",
    activitySub: "Small moments. A shared story.",
    activityEmpty:
      "Your next action will appear here.\nOrders, changes, and handoffs share one record.",
    directorTop: "CAFEOS · GUIDED DEMO",
    directorIntro: "Three customers. One barista. One shared truth.",
    directorSub:
      "Curated dialogue · real transactions · speech rendered on the remote GPU",
    demoStart: "Start demo",
    demoNext: "Next scene",
    demoAuto: "Play all",
    demoPause: "Pause",
    demoReset: "Reset",
    demoEnd: "Demo complete",
    demoLive: "Free play",
    mute: "Mute",
    unmute: "Sound on",
    menu: "Your next favorite.",
    menuSub: "Choose a drink, or just ask for it.",
    add: "Add to order",
    options: "Make it yours.",
    size: "Size",
    temperature: "Temperature",
    milk: "Milk",
    coachTitle: "One good cup at a time.",
    coachSub:
      "Choose a drink in progress. Your copilot follows the actual ticket.",
    coachCurrent: "NEXT AT YOUR STATION",
    nextStep: "Step complete",
    readStep: "Read this step",
    recipeBasis: "Store recipe + staff-reported progress",
    networkTitle: "One café. One shared state.",
    networkSub: "See the real connections, retries, and remote inference.",
    networkClient: "Connected screens",
    networkStore: "Café transaction engine",
    networkGPU: "Remote GPU inference",
    networkClientSub:
      "Every screen receives updates over WebSocket. Reconnecting retrieves the latest snapshot.",
    networkStoreSub:
      "Reservations, version checks, and idempotent requests are enforced by the café engine.",
    networkGPUSub:
      "Live requests are interpreted on the remote GPU. The guided demo plays authored dialogue and rendered speech.",
    showQR: "Same workspace. Another perspective.",
    shareNote:
      "Open another tab on this computer. Phones require a LAN-bound server and a reachable workspace URL.",
    baseURL: "Workspace URL",
    openCustomer: "Open customer counter",
    selected: "Selected",
    listenUnavailable: "Voice is not ready yet. Showing the dialogue.",
    recordError: "Microphone unavailable. Please use text.",
    customerTitle: "Your coffee. Your way.",
    customerSub: "Tell us what you’d like. We’ll take care of the details.",
    pantryTitle: "Every portion has a place.",
    pantrySub:
      "Reserve when sent. Consume when served. Stay in control of the rush.",
    barTitle: "Stay with the cup in your hands.",
    barSub: "Tickets, late changes, and your next step. Right here.",
    counterTitle: "Good coffee starts with a conversation.",
    counterSub: "A draft first. Your confirmation sends it to the bar.",
    retry: "Reconnect",
    edit: "Edit",
    editTitle: "Change this drink",
    saveChange: "Save change",
    close: "Close",
    notReady:
      "Remote model is not ready. Try the guided demo or manual ordering.",
  },
};
const t = (k) => words[lang]?.[k] ?? words.en[k] ?? k;
const icon = (name, size = 18) => {
  const paths = {
    cup: "M4 5h12v8a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V5Zm12 1h2a3 3 0 0 1 0 6h-2M3 21h15M8 1v2m5-2v2",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    mic: "M12 15a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v7a3 3 0 0 0 3 3ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8",
    bar: "M4 5h16v13H4zM7 2v3m10-3v3M4 10h16M8 14h2m4 0h2M7 21h10",
    box: "m3 7 9-4 9 4v11l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v11M7 5l9 4",
    link: "M8 12h8M9 8H6a4 4 0 0 0 0 8h3m6-8h3a4 4 0 0 1 0 8h-3",
    arrow: "M5 12h14m-5-5 5 5-5 5",
    play: "m8 5 11 7-11 7V5Z",
    pause: "M8 5v14m8-14v14",
    check: "m5 12 4 4L19 6",
    refresh:
      "M20 7v5h-5M4 17v-5h5M19 11a7 7 0 0 0-12-5l-3 3m1 4a7 7 0 0 0 12 5l3-3",
    sound: "m4 9 4 0 5-4v14l-5-4H4V9Zm12-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
    mute: "m4 9 4 0 5-4v14l-5-4H4V9Zm13 0 5 6m0-6-5 6",
    spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
    qr: "M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h-3zM21 15v6h-3M12 3v3m0 6v3m-9-3h3m6 6v3",
    clock: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    close: "m6 6 12 12m0-12L6 18",
    chevron: "m9 6 6 6-6 6",
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] ?? paths.cup}"/></svg>`;
};
function drinkSvg(product, size = 30) {
  const p = state?.menu.find((p) => p.id === product),
    color = p?.color ?? "#b69d76";
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="23" cy="41" rx="17" ry="3" fill="#d4ccb5" opacity=".35"/><path d="M12 15h24l-2 19c-.4 4-3 6-10 6s-10-2-10-6z" fill="${color}"/><path d="M36 19h3a6 6 0 0 1-5 11" fill="none" stroke="${color}" stroke-width="3"/><ellipse cx="24" cy="15" rx="12" ry="3.7" fill="#e6d7bc"/><ellipse cx="24" cy="15" rx="9" ry="2.7" fill="${color}"/>${product === "latte" ? '<path d="m19 15 5 2 5-2m-8-1 3 1 3-1" stroke="#fff5e2" fill="none" stroke-width="1.2"/>' : ""}<path d="M20 5c-3 3 3 4 0 7m9-8c-3 3 3 4 0 7" fill="none" stroke="#9ba992" stroke-linecap="round" stroke-width="1"/></svg>`;
}
const itemName = (i) =>
  lang === "zh"
    ? state.menu.find((p) => p.id === i.product)?.zh
    : state.menu.find((p) => p.id === i.product)?.name;
const itemDetails = (i) =>
  [t(i.temperature), t(i.size), i.milk !== "none" ? t(i.milk) : null]
    .filter(Boolean)
    .join(" · ");
const actor = () => ({
  role: view === "bar" ? "barista" : view === "pantry" ? "manager" : "customer",
  ...(view !== "bar" && view !== "pantry" ? { customer } : {}),
});
const readyRemote = (k) => remote[k]?.ok === true || remote[k]?.status === "ok";
function toast(text, error = false) {
  $("#toast").textContent = text;
  $("#toast").className = `show${error ? " error" : ""}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("#toast").className = ""), 4200);
}
async function api(url, body) {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await response.json();
  if (!response.ok)
    throw Object.assign(
      new Error(json.message ?? json.error ?? "Request failed"),
      json,
    );
  return json;
}
function sidebar() {
  const navigation = [
    ["overview", "grid"],
    ["counter", "mic"],
    ["bar", "bar"],
    ["pantry", "box"],
    ["network", "link"],
  ];
  return `<aside class="sidebar"><a class="brand" href="/"><img src="/favicon.svg" alt=""><span>CafeOS<small>VOICE WORKSPACE</small></span></a><div class="location"><div class="square">${icon("cup", 17)}</div><div><strong>${t("location")}</strong><span>${t("locationSub")}</span></div></div><div class="eyebrow">${t("sidebarLabel")}</div><nav class="nav" aria-label="Workspace navigation">${navigation
    .filter(([v]) => !customerOnly || ["counter", "network"].includes(v))
    .map(
      ([v, i]) =>
        `<button data-view="${v}" class="${view === v ? "active" : ""}" aria-label="${t(v)}">${icon(i, 17)}<span>${t(v)}</span></button>`,
    )
    .join(
      "",
    )}</nav><div class="sidebar-bottom"><div class="remote-note"><strong>${icon("spark", 13)} ${t("powered")}</strong><p>${t("remoteNote")}</p><div class="remote-row"><i class="dot ${readyRemote("tts") ? "on" : "off"}"></i>Qwen3-TTS</div><div class="remote-row"><i class="dot ${readyRemote("llm") ? "on" : "off"}"></i>${esc(remote.llm?.model?.split("/").at(-1) ?? "Language model")}</div></div><div class="profile"><span class="avatar">CO</span><div><strong>${t("profile")}</strong><small>${t("role")}</small></div></div></div></aside>`;
}
function metrics() {
  const orders = state.orders.filter((o) => o.status === "confirmed"),
    drinks = orders
      .flatMap((o) => o.items)
      .filter((i) => ["queued", "making"].includes(i.status)).length,
    pending = orders
      .flatMap((o) => o.items)
      .filter((i) => i.pendingChange).length;
  return `<div class="metrics">${[
    [drinks, "metricOrders", "cup"],
    [pending, "metricChanges", "refresh"],
    [state.inventory.oat.available, "metricOat", "box"],
  ]
    .map(
      ([n, k, i]) =>
        `<div class="metric ${k === "metricOat" && n === 0 ? "warn" : ""}"><div><small>${t(k)}</small><strong>${String(n).padStart(2, "0")}</strong></div><div class="metric-mark">${icon(i, 18)}</div></div>`,
    )
    .join("")}</div>`;
}
function voicePanel() {
  return `<section class="panel voice-panel"><div class="panel-head"><div><h2>${t("voice")}</h2><p>${t("voiceSub")}</p></div><span class="label ${demo.active ? "" : "green"}">${t(demo.active ? "curated" : "live")}</span></div><div class="voice-controls">${(view === "bar" ? ["barista"] : view === "pantry" ? ["manager"] : customerOnly ? [customer] : ["Aria", "Leo", "Mia"]).map((c) => `<button class="person ${c === customer || ["barista", "manager"].includes(c) ? "active" : ""}" data-customer="${esc(c)}">${c === "barista" ? "Barista" : c === "manager" ? "Manager" : esc(c)}</button>`).join("")}</div><div class="voice-stage"><div class="orbit"></div><div class="orb ${speaking ? "speaking" : ""}">${icon("spark", 32)}</div><canvas class="wave" id="wave" width="360" height="84" aria-label="Audio activity"></canvas></div><div class="voice-caption"><strong>${record ? t("listening") : busy ? t("thinking") : speaking ? t("speaking") : t("ready")}</strong><p>${demo.active ? (demo.last?.scene ?? "A café, in conversation.") : t("voiceHint")}</p></div><div class="conversation">${
    messages.length
      ? messages
          .slice(-8)
          .map(
            (m) =>
              `<div class="chat ${m.ai ? "ai" : ""} ${m.error ? "error" : ""}"><span class="avatar">${m.ai ? icon("spark", 12) : esc(m.name.slice(0, 2).toUpperCase())}</span><div class="chat-body"><div class="chat-name">${m.ai ? "CafeOS" : esc(m.name)}</div><p>${esc(m.text)}</p>${m.source ? `<div class="chat-source">${esc(m.source)}</div>` : ""}</div></div>`,
          )
          .join("")
      : `<p class="empty-chat">${t("emptyChat").replace("\n", "<br>")}</p>`
  }</div><form class="composer" id="composer"><button type="button" class="icon-button ${record ? "recording" : ""}" data-action="mic" title="${t(record ? "stopMic" : "mic")}" aria-label="${t(record ? "stopMic" : "mic")}" ${busy ? "disabled" : ""}>${icon("mic", 15)}</button><input id="message-input" name="message" aria-label="Your request" placeholder="${t("placeholder")}" autocomplete="off" maxlength="2000" ${busy ? "disabled" : ""}><button class="icon-button send" type="submit" aria-label="${t("send")}" ${busy ? "disabled" : ""}>${busy ? '<span class="loading-spinner"></span>' : icon("arrow", 15)}</button></form><div class="suggestions">${["hint1", "hint2", "hint3"].map((k) => `<button data-suggestion="${esc(t(k))}">${t(k)}</button>`).join("")}</div></section>`;
}
function displayItems(order) {
  const activeId = demo.active ? demo.last?.actions[0]?.itemId : null;
  return order.items
    .slice()
    .sort((a, b) => Number(b.id === activeId) - Number(a.id === activeId));
}
function tickets(onlyOwn = false) {
  const orders = state.orders
    .filter(
      (o) => !["cancelled", "collected"].includes(o.status) && (!onlyOwn || o.customer === customer),
    )
    .slice()
    .reverse();
  if (demo.active && demo.last) {
    const activeId =
      demo.last.outcome?.results?.at(-1)?.orderId ??
      demo.last.actions[0]?.orderId;
    orders.sort(
      (a, b) => Number(b.id === activeId) - Number(a.id === activeId),
    );
  }
  return `<section class="panel"><div class="panel-head"><div><h2>${t("queue")}</h2><p>${t("queueSub")}</p></div><span class="label">${orders.length} ${lang === "zh" ? "張訂單" : "tickets"}</span></div><div class="queue">${
    orders.length
      ? orders
          .map(
            (order) =>
              `<article class="ticket"><div class="ticket-top"><span class="avatar">${esc(order.customer.slice(0, 1))}</span><div><strong>${esc(order.customer)} <span style="color:var(--muted);font-weight:400">/ ${order.id}</span></strong><small>${t("version")} ${order.version}</small></div><span class="label ${order.status === "complete" ? "green" : order.items.some((i) => i.status === "making") ? "amber" : ""}">${t(order.status)}</span></div>${displayItems(
                order,
              )
                .map(
                  (i) =>
                    `<div class="drink-row"><div class="drink-icon">${drinkSvg(i.product)}</div><div class="drink-info"><strong>${esc(itemName(i))}</strong><small>${esc(itemDetails(i))} <span class="item-id">${i.id.split("-").at(-1)}</span></small><small>${t(i.status === "ready" ? "readyItem" : i.status)}</small></div><span class="price">$${i.price}</span>${!customerOnly && i.status === "queued" ? `<button class="mini" data-item-command="start" data-order="${order.id}" data-item="${i.id}">${t("start")}</button>` : !customerOnly && i.status === "making" ? `<button class="mini" data-coach="${i.id}" data-order="${order.id}">${t("coach")}</button>` : ""}${(customerOnly || view === "counter") && ["draft", "queued", "making"].includes(i.status) ? `<button class="mini" data-edit="${i.id}" data-order="${order.id}">${t("edit")}</button>` : ""}</div>${i.pendingChange ? `<div class="request"><strong>${t("pending")}</strong>${esc(itemDetails(i.pendingChange))} ${esc(itemName(i.pendingChange))}${!customerOnly ? `<div><button class="mini" data-item-command="acceptChange" data-order="${order.id}" data-item="${i.id}">${t("accept")}</button><button class="mini" data-item-command="rejectChange" data-order="${order.id}" data-item="${i.id}">${t("reject")}</button></div>` : ""}</div>` : ""}`,
                )
                .join(
                  "",
                )}<div class="ticket-footer"><span>${t("total")}</span><strong>NT$ ${order.items.reduce((n, i) => n + i.price, 0)}</strong></div>${order.status === "draft" ? `<div class="ticket-actions"><button class="primary" data-order-command="confirm" data-order="${order.id}">${t("confirm")} ${icon("arrow", 12)}</button><button class="outline" data-order-command="cancel" data-order="${order.id}">${t("cancel")}</button></div>` : order.status === "complete" && !customerOnly ? `<div class="ticket-actions"><button class="primary" data-order-command="collect" data-order="${order.id}">${t("collect")} ${icon("check", 12)}</button></div>` : ""}</article>`,
          )
          .join("")
      : `<div class="empty-queue">${icon("cup", 34)}<h3>${t("queueEmpty")}</h3><p>${t("queueEmptySub")}</p></div>`
  }</div><div class="queue-footnote">${icon("check", 12)} ${t("queueFoot")}</div></section>`;
}
function stockPanel(full = false) {
  return `<section class="panel"><div class="panel-head"><div><h2>${t("inventory")}</h2><p>${t("inventorySub")}</p></div><span class="label ${state.inventory.oat.available === 0 ? "amber" : ""}">${lang === "zh" ? "即時庫存" : "LIVE STOCK"}</span></div><div class="stock-list">${Object.entries(
    state.inventory,
  )
    .filter(([k]) => full || ["oat", "dairy", "espresso"].includes(k))
    .map(
      ([k, i]) =>
        `<div class="stock-row"><div class="square">${icon(k === "espresso" ? "cup" : "box", 13)}</div><div class="stock-info"><div class="stock-text"><span>${lang === "zh" ? { oat: "燕麥奶", dairy: "鮮奶", espresso: "濃縮咖啡", matcha: "抹茶", tea: "紅茶" }[k] : i.name}</span><span style="color:${i.available === 0 ? "var(--amber)" : "var(--muted)"}">${i.available} ${t("available")} <small> / ${i.reserved} ${t("reserved")}</small></span></div><div class="meter ${i.available === 0 ? "warn" : ""}"><span class="used" style="width:${i.stock ? (i.reserved / i.stock) * 100 : 0}%"></span><span class="free" style="width:${i.stock ? (i.available / i.stock) * 100 : 0}%"></span></div></div>${full ? `<button class="mini" data-restock="${k}">${t("restock")}</button>` : ""}</div>`,
    )
    .join("")}</div></section>`;
}
function timeline(full = false) {
  return `<section class="panel"><div class="panel-head"><div><h2>${t("activity")}</h2><p>${t("activitySub")}</p></div>${icon("clock", 15)}</div><div class="timeline ${full ? "full-timeline" : ""}">${
    state.events.length
      ? state.events
          .slice(0, full ? 100 : 3)
          .map(
            (e) =>
              `<div class="event"><i class="dot"></i><div class="event-text"><p>${esc(e.message)}</p><small>${esc(e.actor)} · ${esc(e.types.join(", "))} · revision ${e.id}</small></div><time>${new Date(e.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</time></div>`,
          )
          .join("")
      : `<p class="event-empty">${t("activityEmpty").replace("\n", "<br>")}</p>`
  }</div></section>`;
}
function director() {
  return `<div class="director"><div class="director-copy"><div class="eyebrow">${demo.active ? esc(demo.last?.scene ?? t("directorTop")) : t("directorTop")}</div><div class="director-title">${demo.active ? esc(demo.last?.title ?? t("directorIntro")) : t("directorIntro")}</div><div class="director-sub">${t("directorSub")}</div>${demo.active ? `<div class="progress">${Array.from({ length: demo.total }, (_, i) => `<span class="${i <= demo.index ? "done" : ""}"></span>`).join("")}</div>` : ""}</div><div class="director-buttons">${!demo.active ? `<button class="primary lime" data-action="demo-start">${icon("play", 13)} ${t("demoStart")}</button>` : `<button class="primary lime" data-action="demo-next" ${demo.index >= demo.total - 1 || busy ? "disabled" : ""}>${icon("arrow", 13)} ${demo.index >= demo.total - 1 ? t("demoEnd") : t("demoNext")}</button><button class="outline" data-action="demo-auto">${icon(auto ? "pause" : "play", 12)} ${t(auto ? "demoPause" : "demoAuto")}</button><button class="outline quiet" data-action="demo-reset" title="${t("demoReset")}" aria-label="${t("demoReset")}">${icon("refresh", 13)}</button>`}<button class="outline quiet" data-action="mute" aria-label="${t(muted ? "unmute" : "mute")}" title="${t(muted ? "unmute" : "mute")}">${icon(muted ? "mute" : "sound", 13)}</button>${demo.active ? `<button class="outline quiet" data-action="demo-stop">${t("demoLive")}</button>` : ""}</div>${demo.active ? `<span class="step-count">${Math.max(0, demo.index + 1)} / ${demo.total}</span>` : ""}</div>`;
}
function selects(
  prefix = "",
  item = {
    size: "regular",
    temperature: "hot",
    milk: "dairy",
    product: "latte",
  },
) {
  return `<div class="form-row">${[
    ["size", ["regular", "large"]],
    ["temperature", ["hot", "iced"]],
  ]
    .map(
      ([k, options]) =>
        `<div class="field"><label for="${prefix}${k}">${t(k)}</label><select id="${prefix}${k}">${options.map((o) => `<option value="${o}" ${o === item[k] ? "selected" : ""}>${t(o)}</option>`).join("")}</select></div>`,
    )
    .join(
      "",
    )}</div><div class="field"><label for="${prefix}milk">${t("milk")}</label><select id="${prefix}milk">${["dairy", "oat"].map((o) => `<option value="${o}" ${o === item.milk ? "selected" : ""}>${t(o)}${o === "oat" ? " (+$20)" : ""}</option>`).join("")}</select></div>`;
}
let editing = null;
function menuPanel() {
  return `<section class="panel"><div class="panel-head"><div><h2>${t("menu")}</h2><p>${t("menuSub")}</p></div>${icon("cup", 17)}</div><div class="options"><h3 style="font-size:12px">${t("options")}</h3>${selects()}</div><div class="menu">${state.menu.map((p) => `<div class="menu-card"><div class="drink-icon">${drinkSvg(p.id, 65)}</div><strong>${lang === "zh" ? p.zh : p.name}</strong><p>${p.note}</p><button class="outline" data-add="${p.id}">${t("add")} · $${p.price}</button></div>`).join("")}</div></section>`;
}
function coachPanel() {
  const order = state.orders.find((o) =>
      !["collected", "cancelled"].includes(o.status) && o.items.some((i) => i.id === selected),
    ),
    item = order?.items.find((i) => i.id === selected);
  if (!item)
    return `<div class="coach"><div class="eyebrow">BARISTA COPILOT</div><h2>${t("coachTitle")}</h2><p>${t("coachSub")}</p><div class="voice-stage"><div class="orbit"></div><div class="orb">${icon("cup", 32)}</div></div></div>`;
  const r = itemRecipe(item);
  return `<div class="coach"><div class="eyebrow">${t("coachCurrent")} · ${order.id}</div><h2>${esc(itemName(item))}</h2><p>${esc(itemDetails(item))} · ${esc(order.customer)}</p>${item.pendingChange ? `<div class="request"><strong>${t("pending")}</strong>${esc(itemDetails(item.pendingChange))}<div><button class="mini" data-item-command="acceptChange" data-order="${order.id}" data-item="${item.id}">${t("accept")}</button><button class="mini" data-item-command="rejectChange" data-order="${order.id}" data-item="${item.id}">${t("reject")}</button></div></div>` : ""}<div class="coach-step"><span class="step-number">${Math.min(item.step + 1, 4)}</span><h3>${esc(item.status === "ready" ? (lang === "zh" ? "這杯已完成，可以取餐。" : "This cup is ready for pickup.") : r[Math.min(item.step, r.length - 1)])}</h3></div><ul class="recipe-steps">${r.map((s, index) => `<li class="${index < item.step ? "completed" : index === item.step ? "current" : ""}">${index < item.step ? icon("check", 13) : `<span>${index + 1}.</span>`} ${esc(s)}</li>`).join("")}</ul><div class="coach-buttons">${item.status === "making" && item.step < 3 ? `<button class="primary" data-item-command="step" data-order="${order.id}" data-item="${item.id}" ${item.pendingChange ? "disabled" : ""}>${t("nextStep")} ${icon("arrow", 12)}</button>` : ""}${item.status === "making" ? `<button class="outline" data-item-command="ready" data-order="${order.id}" data-item="${item.id}" ${item.pendingChange ? "disabled" : ""}>${t("finish")}</button>` : ""}<button class="outline" data-read-step="${item.id}" data-order="${order.id}">${icon("sound", 12)} ${t("readStep")}</button></div><div class="source">${t("recipeBasis")}</div></div>`;
}
// Recipe display is fetched from the same server function. Cache only by item version.
const recipes = new Map();
function itemRecipe(item) {
  const key = JSON.stringify([
    item.product,
    item.milk,
    item.temperature,
    item.step,
  ]);
  if (!recipes.has(key)) {
    recipes.set(key, ["Checking the ticket…"]);
    api(`/api/recipe?orderId=${item.id.split("-")[0]}&itemId=${item.id}`)
      .then((r) => {
        recipes.set(key, r.steps);
        if (selected === item.id) render();
      })
      .catch(() => recipes.delete(key));
  }
  return recipes.get(key);
}
function editPanel() {
  const order = state.orders.find((o) => o.id === editing.order),
    item = order?.items.find((i) => i.id === editing.item);
  if (!item) {
    editing = null;
    return "";
  }
  return `<section class="panel"><div class="panel-head"><h2>${t("editTitle")} · ${order.id}</h2><button class="icon-button" data-action="edit-close" aria-label="${t("close")}">${icon("close", 15)}</button></div><div class="options"><div class="field"><label for="edit-product">Drink</label><select id="edit-product">${state.menu.map((p) => `<option value="${p.id}" ${p.id === item.product ? "selected" : ""}>${lang === "zh" ? p.zh : p.name}</option>`).join("")}</select></div>${selects("edit-", item)}<button class="primary" data-action="edit-save">${t("saveChange")}</button></div></section>`;
}
function networkPanel() {
  return `<div class="network-cards">${[
    [
      "networkClient",
      "link",
      "networkClientSub",
      `${connections} screens · ${connected ? "connected" : "reconnecting"}`,
    ],
    [
      "networkStore",
      "box",
      "networkStoreSub",
      `revision ${state.revision} · ${latency === null ? "—" : latency + " ms HTTP"}`,
    ],
    ["networkGPU", "spark", "networkGPUSub", esc(remote.llm?.model ?? "the remote GPU")],
  ]
    .map(
      ([title, i, description, foot]) =>
        `<section class="panel network-card"><div class="square">${icon(i, 18)}</div><h3>${t(title)}</h3><p>${t(description)}</p><span class="label" style="margin-top:15px">${foot}</span></section>`,
    )
    .join(
      "",
    )}</div><div class="network-link">${icon("link", 24)}</div><div class="lower-grid"><section class="panel"><div class="panel-head"><h2>Connection details</h2><button class="mini" data-action="reconnect">${t("retry")}</button></div><div class="technical">Transport: WebSocket /ws<br>Snapshot: revision ${state.revision}<br>Screens: ${connections}<br>Transactions: atomic, versioned, idempotent<br>LLM: ${esc(remote.llm?.model ?? "not connected")}<br>TTS: Qwen3-TTS · ${readyRemote("tts") ? "ready" : "not connected"}<br>ASR: ${esc(remote.asr?.model ?? "not connected")}<br>Curated audio: ${audioReady ? "available" : "not ready"}<br>Inference location: the remote GPU<br>Role separation: demo roles; no production authentication</div></section>${timeline(true)}</div>`;
}
let shareOpen = false;
function render() {
  if (!state) return;
  const preserved = [...document.querySelectorAll("input,select")].map((e) => [
    e.id,
    e.value,
  ]);
  const focused = document.activeElement?.id,
    selection = document.activeElement?.selectionStart;
  const scroll = $(".conversation")?.scrollTop;
  const titles = {
    overview: ["welcome", "sub"],
    counter: [
      customerOnly ? "customerTitle" : "counterTitle",
      customerOnly ? "customerSub" : "counterSub",
    ],
    bar: ["barTitle", "barSub"],
    pantry: ["pantryTitle", "pantrySub"],
    network: ["networkTitle", "networkSub"],
  };
  let content = "";
  if (view === "overview")
    content = `<div class="hero"><img src="/assets/cafe-still-life.png" alt="Four café drinks in morning light"><div class="hero-copy"><div class="eyebrow">${t("heroTop")}</div><h2>${t("heroTitle").replace("\n", " <br>")}</h2><p>${t("heroSub")}</p></div><div class="hero-tag">${icon("check", 12)} ${t("heroTag")}</div></div>${metrics()}<div class="workspace">${voicePanel()}${demo.active && demo.index >= 9 ? `<div class="right-stack">${coachPanel()}${tickets()}</div>` : tickets()}</div><div class="lower-grid">${stockPanel()}${timeline()}</div>`;
  if (view === "counter")
    content = `${metrics()}<div class="workspace">${voicePanel()}${tickets(true)}</div><div class="lower-grid">${editing ? editPanel() : menuPanel()}${stockPanel()}</div>`;
  if (view === "bar")
    content = `${metrics()}<div class="workspace">${tickets()}${coachPanel()}</div><div class="lower-grid">${voicePanel()}${timeline()}</div>`;
  if (view === "pantry")
    content = `${metrics()}<div class="section-grid">${stockPanel(true)}${timeline(true)}</div>`;
  if (view === "network") content = networkPanel();
  if (shareOpen)
    content = `<div class="section-grid" style="margin-bottom:20px"><section class="panel qr-panel"><h2 style="font-size:15px">${t("showQR")}</h2><p>${t("shareNote")}</p><img id="qr" src="/api/qr?customer=${encodeURIComponent(customer)}&base=${encodeURIComponent(location.origin)}" alt="Customer screen QR code"><div class="field"><label for="share-base">${t("baseURL")}</label><input id="share-base" value="${esc(location.origin)}"></div><a class="primary" style="margin-top:13px" href="/customer?customer=${encodeURIComponent(customer)}" target="_blank" rel="noopener">${t("openCustomer")} ${icon("arrow", 13)}</a></section>${tickets(true)}</div>${content}`;
  $("#app").innerHTML =
    `<div class="shell">${sidebar()}<main class="main ${demo.active && view === "overview" ? "presenting" : ""}"><div class="topbar"><div class="crumb">${t("workspace")} <span style="padding:0 7px">/</span> <b>${t(view)}</b></div><div class="top-actions"><span class="connection"><i class="dot ${connected ? "on" : "off"}"></i>${t(connected ? "online" : "offline")} · ${connections}</span><button class="lang" data-action="lang">${lang === "zh" ? "EN" : "繁中"}</button></div></div><header class="header"><div><h1>${t(titles[view][0])}</h1><p>${t(titles[view][1])}</p></div>${!customerOnly ? `<button class="outline" data-action="share">${icon("qr", 14)} ${t("share")}</button>` : ""}</header>${content}</main>${!customerOnly ? director() : ""}</div>`;
  for (const [id, value] of preserved) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }
  if (focused) {
    const el = document.getElementById(focused);
    el?.focus({ preventScroll: true });
    if (el?.setSelectionRange && selection !== null)
      el.setSelectionRange(selection, selection);
  }
  if ($(".conversation")) $(".conversation").scrollTop = scroll ?? 0;
}
function scrollChat() {
  const chat = $(".conversation");
  if (chat) chat.scrollTop = chat.scrollHeight;
}
let seenRun = null;
function absorb(snapshot) {
  state = snapshot.state;
  demo = snapshot.demo;
  connections = snapshot.connections;
  if (demo.runId !== seenRun) {
    seenRun = demo.runId;
    seenCue = -1;
    messages = [];
    selected = null;
  }
  if (demo.active && demo.last && demo.last.index !== seenCue) {
    seenCue = demo.last.index;
    if (!customerOnly) customer = demo.last.actor.customer ?? customer;
    messages.push(
      { name: demo.last.actor.customer ?? "Barista", text: demo.last.text },
      {
        ai: true,
        name: "CafeOS",
        text: demo.last.response,
        error: !demo.last.outcome.ok,
        source:
          "Authored dialogue · " +
          (demo.last.outcome.duplicate
            ? "deduplicated retry"
            : demo.last.outcome.ok
              ? "transaction committed"
              : demo.last.outcome.code),
      },
    );
    if (demo.index >= 9)
      selected =
        demo.last.actions[0]?.itemId ??
        selected ??
        state.orders
          .flatMap((o) => o.items)
          .find((i) => ["making", "ready"].includes(i.status))?.id;
  }
  render();
  scrollChat();
}
function connect() {
  clearTimeout(reconnectTimer);
  ws = new WebSocket(
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`,
  );
  ws.onopen = () => {
    connected = true;
    render();
  };
  ws.onmessage = (e) => {
    const snapshot = JSON.parse(e.data);
    if (snapshot.type === "snapshot") absorb(snapshot);
  };
  ws.onclose = () => {
    connected = false;
    render();
    reconnectTimer = setTimeout(connect, 1800);
  };
  ws.onerror = () => ws.close();
}
async function refreshStatus() {
  const start = performance.now();
  try {
    await api("/api/state");
    latency = Math.round(performance.now() - start);
    const status = await api("/api/status");
    remote = status.remote;
    audioReady = status.audio;
    render();
  } catch {}
}
async function command(actorInput, actions) {
  const result = await api("/api/command", {
    requestId: ids(),
    actor: actorInput,
    actions,
  });
  toast(result.message);
  return result;
}
function stopAudio() {
  playbackGeneration++;
  player.pause();
  player.src = "";
  speaking = false;
  render();
}
async function playURL(url, generation = playbackGeneration) {
  if (muted || !url || generation !== playbackGeneration) return;
  player.src = url;
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      audioNode = audioContext.createMediaElementSource(player);
      audioNode.connect(analyser);
      analyser.connect(audioContext.destination);
      drawWave();
    }
    await audioContext.resume();
    speaking = true;
    render();
    await player.play();
    await new Promise((resolve) => {
      player.onended = resolve;
      player.onerror = resolve;
      player.onpause = () => {
        if (player.paused) resolve();
      };
    });
  } catch {
    toast(t("listenUnavailable"));
  } finally {
    speaking = false;
    render();
  }
}
async function say(text) {
  if (muted) return;
  try {
    const output = await api("/api/speak", { text, voice: "assistant" });
    await playURL(output.url);
  } catch (e) {
    toast(e.message, true);
  }
}
function drawWave() {
  const bins = new Uint8Array(64);
  function draw() {
    const canvas = $("#wave");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, 360, 84);
      analyser.getByteFrequencyData(bins);
      ctx.fillStyle = "#95ac75";
      for (let i = 0; i < 28; i++) {
        const h = speaking ? Math.max(2, (bins[i + 3] / 255) * 62) : 2;
        ctx.beginPath();
        ctx.roundRect(i * 12 + 12, (84 - h) / 2, 4, h, 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function demoNext() {
  if (busy || demo.index >= demo.total - 1) return;
  busy = true;
  render();
  const generation = playbackGeneration;
  try {
    const snapshot = await api("/api/demo/next", {});
    absorb(snapshot);
    const cue = demo.last;
    if (cue.userAudio && cue.assistantAudio && !muted) {
      await playURL(cue.userAudio, generation);
      if (generation === playbackGeneration) {
        await pause(250);
        await playURL(cue.assistantAudio, generation);
      }
    } else if (auto)
      await pause(
        Math.min(8500, 1600 + (cue.text.length + cue.response.length) * 23),
      );
  } catch (e) {
    auto = false;
    toast(e.message, true);
  } finally {
    busy = false;
    render();
  }
}
async function runAuto() {
  if (auto) {
    auto = false;
    stopAudio();
    render();
    return;
  }
  auto = true;
  render();
  while (auto && demo.active && demo.index < demo.total - 1) {
    if (busy) {
      await pause(300);
      continue;
    }
    await demoNext();
    await pause(600);
  }
  auto = false;
  render();
}
async function submit(text) {
  if (busy || !text.trim()) return;
  if (demo.active) {
    toast(
      lang === "zh"
        ? "請先切換自由操作。"
        : "Switch to Free play to try your own request.",
    );
    return;
  }
  if (!readyRemote("llm")) {
    toast(t("notReady"), true);
    return;
  }
  busy = true;
  messages.push({ name: actor().customer ?? actor().role, text });
  render();
  scrollChat();
  try {
    const result = await api("/api/intent", {
      requestId: ids(),
      actor: actor(),
      text,
      history: messages
        .slice(-6)
        .map((m) => ({ role: m.ai ? "assistant" : "user", content: m.text })),
    });
    messages.push({
      ai: true,
      name: "CafeOS",
      text: result.message,
      source: `${result.source} · ${(result.elapsedMs / 1000).toFixed(1)}s remote inference`,
    });
    busy = false;
    render();
    scrollChat();
    await say(result.message);
  } catch (e) {
    messages.push({ ai: true, name: "CafeOS", text: e.message, error: true });
    toast(e.message, true);
  } finally {
    busy = false;
    render();
    scrollChat();
  }
}
function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2),
    v = new DataView(buffer),
    str = (offset, s) =>
      [...s].forEach((c, i) => v.setUint8(offset + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, samples.length * 2, true);
  samples.forEach((n, i) =>
    v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, n)) * 32767, true),
  );
  return new Uint8Array(buffer);
}
async function toggleMic() {
  if (record) {
    const rec = record;
    record = null;
    clearTimeout(rec.timer);
    rec.processor.disconnect();
    rec.source.disconnect();
    rec.stream.getTracks().forEach((t) => t.stop());
    await rec.context.close();
    busy = true;
    render();
    try {
      const length = rec.parts.reduce((n, p) => n + p.length, 0),
        samples = new Float32Array(length);
      let offset = 0;
      for (const p of rec.parts) {
        samples.set(p, offset);
        offset += p.length;
      }
      const bytes = encodeWav(samples, rec.rate);
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192)
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      const result = await api("/api/transcribe", { audio: btoa(binary) });
      busy = false;
      if (!result.text?.trim()) throw new Error("No speech detected.");
      await submit(result.text);
    } catch (e) {
      toast(e.message, true);
    } finally {
      busy = false;
      render();
    }
    return;
  }
  if (demo.active) {
    toast(
      lang === "zh"
        ? "請先切換自由操作。"
        : "Switch to Free play to use the microphone.",
    );
    return;
  }
  if (!readyRemote("asr")) {
    toast("Remote speech recognition is not ready.", true);
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = new AudioContext({ sampleRate: 16000 }),
      source = context.createMediaStreamSource(stream),
      processor = context.createScriptProcessor(4096, 1, 1),
      silence = context.createGain();
    silence.gain.value = 0;
    const parts = [];
    processor.onaudioprocess = (e) =>
      parts.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    source.connect(processor);
    processor.connect(silence);
    silence.connect(context.destination);
    record = {
      stream,
      context,
      source,
      processor,
      parts,
      rate: context.sampleRate,
      timer: setTimeout(() => toggleMic(), 30000),
    };
    render();
  } catch {
    toast(t("recordError"), true);
  }
}
document.addEventListener("submit", (e) => {
  if (e.target.id === "composer") {
    e.preventDefault();
    const text = $("#message-input").value;
    $("#message-input").value = "";
    submit(text);
  }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "share-base")
    $("#qr").src =
      `/api/qr?customer=${encodeURIComponent(customer)}&base=${encodeURIComponent(e.target.value)}`;
});
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b || b.disabled) return;
  try {
    if (b.dataset.view) {
      view = b.dataset.view;
      editing = null;
      render();
      return;
    }
    if (b.dataset.customer) {
      if (["barista", "manager"].includes(b.dataset.customer)) return;
      customer = b.dataset.customer;
      editing = null;
      render();
      return;
    }
    if (b.dataset.suggestion) {
      $("#message-input").value = b.dataset.suggestion;
      $("#message-input").focus();
      return;
    }
    if (b.dataset.coach) {
      selected = b.dataset.coach;
      view = "bar";
      render();
      return;
    }
    if (b.dataset.edit) {
      editing = { order: b.dataset.order, item: b.dataset.edit };
      render();
      return;
    }
    if (b.dataset.itemCommand) {
      const order = state.orders.find((o) => o.id === b.dataset.order);
      await command({ role: "barista" }, [
        {
          type: b.dataset.itemCommand,
          orderId: order.id,
          itemId: b.dataset.item,
          expectedVersion: order.version,
        },
      ]);
      if (b.dataset.itemCommand === "start") {
        selected = b.dataset.item;
        if (view === "bar") render();
      }
      return;
    }
    if (b.dataset.orderCommand) {
      const order = state.orders.find((o) => o.id === b.dataset.order);
      await command(b.dataset.orderCommand === "collect" ? {role:"barista"} : { role: "customer", customer: order.customer }, [
        {
          type: b.dataset.orderCommand,
          orderId: order.id,
          expectedVersion: order.version,
        },
      ]);
      return;
    }
    if (b.dataset.restock) {
      await command({ role: "manager" }, [
        { type: "restock", ingredient: b.dataset.restock, amount: 5 },
      ]);
      return;
    }
    if (b.dataset.add) {
      const draft = state.orders.find(
        (o) => o.customer === customer && o.status === "draft",
      );
      await command({ role: "customer", customer }, [
        draft
          ? {
              type: "add",
              orderId: draft.id,
              expectedVersion: draft.version,
              items: [
                {
                  product: b.dataset.add,
                  size: $("#size").value,
                  temperature: $("#temperature").value,
                  milk: $("#milk").value,
                },
              ],
            }
          : {
              type: "create",
              items: [
                {
                  product: b.dataset.add,
                  size: $("#size").value,
                  temperature: $("#temperature").value,
                  milk: $("#milk").value,
                },
              ],
            },
      ]);
      return;
    }
    if (b.dataset.readStep) {
      const r = await api(
        `/api/recipe?orderId=${b.dataset.order}&itemId=${b.dataset.readStep}`,
      );
      await say(r.current);
      return;
    }
    switch (b.dataset.action) {
      case "lang":
        lang = lang === "en" ? "zh" : "en";
        localStorage.setItem("cafeos-lang", lang);
        render();
        break;
      case "share":
        shareOpen = !shareOpen;
        render();
        break;
      case "mute":
        muted = !muted;
        if (muted) stopAudio();
        render();
        break;
      case "mic":
        await toggleMic();
        break;
      case "reconnect":
        ws.close();
        break;
      case "demo-start":
      case "demo-reset":
        auto = false;
        stopAudio();
        seenCue = -1;
        messages = [];
        selected = null;
        view = "overview";
        absorb(await api("/api/demo/reset", {}));
        if (b.dataset.action === "demo-start") await demoNext();
        break;
      case "demo-next":
        await demoNext();
        break;
      case "demo-auto":
        await runAuto();
        break;
      case "demo-stop":
        auto = false;
        stopAudio();
        absorb(await api("/api/demo/stop", {}));
        break;
      case "edit-close":
        editing = null;
        render();
        break;
      case "edit-save": {
        const order = state.orders.find((o) => o.id === editing.order);
        const changes = {
          product: $("#edit-product").value,
          size: $("#edit-size").value,
          temperature: $("#edit-temperature").value,
          milk: $("#edit-milk").value,
        };
        await command(b.dataset.orderCommand === "collect" ? {role:"barista"} : { role: "customer", customer: order.customer }, [
          {
            type: "change",
            orderId: order.id,
            itemId: editing.item,
            changes,
            expectedVersion: order.version,
          },
        ]);
        editing = null;
        render();
        break;
      }
    }
  } catch (e) {
    toast(e.message, true);
  }
});
try {
  absorb(await api("/api/state"));
  connect();
  await refreshStatus();
  setInterval(refreshStatus, 20000);
} catch (e) {
  $("#app").innerHTML =
    `<div class="boot">CafeOS<span>${esc(e.message)}</span></div>`;
}
