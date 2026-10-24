import { questData, questTemplates, badges, collectibles } from "./data.js";
import { getPlayer, savePlayer, resetPlayer } from "./storage.js";
import { completeQuest, claimDaily, XP_PER_LEVEL, DAILY_DROP_XP, todayKey, awardXp, xpRequiredForLevel, totalXpForProgression, levelTheme } from "./player.js";
import { getTypes, filterQuests } from "./quests.js";
import { unlockedBadges, inventoryItems, syncUnlocks } from "./inventory.js";
import { getLeaderboard } from "./leaderboard.js";
import { icon, questIcon } from "./icons.js";

let player = getPlayer();
let loggedIn = readFlag("aionLoggedIn");
let persistOk = true;
let persistWarned = false;
let activeFilter = "All";
let activeDifficulty = "All";
let activePriority = "All";
let activeStatus = "All";
let activeDeadline = "All";
let search = "";
let sortBy = "newest";
let modalReturnFocus = null;
let levelDemoActive = false;
let levelDemoState = null;

const $ = id => document.getElementById(id);
const escapeHtml = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
const allQuests = () => [...questData, ...(player.customQuests || [])];
const isDone = quest => player.completed.some(id => String(id) === String(quest.id));
const isExpired = quest => Boolean(quest.dueDate && quest.dueDate < todayKey());
const questPriority = quest => ["Low", "Normal", "High"].includes(quest.priority) ? quest.priority : "Normal";
const objectiveProgress = quest => {
  const objectives = Array.isArray(quest.objectives) ? quest.objectives : [];
  const done = objectives.filter(objective => objective.done).length;
  return { objectives, done, percent: objectives.length ? Math.round(done / objectives.length * 100) : 0 };
};
const formatDate = key => {
  const d = new Date(`${key}T00:00:00`);
  return Number.isNaN(d.getTime()) ? String(key) : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
// Tick a number up to its new value when it changes (instant for reduced motion / first paint).
function tickNumber(el, to, format = v => String(v)) {
  const from = el.dataset.val === undefined ? to : Number(el.dataset.val);
  el.dataset.val = String(to);
  if (from === to || reduceMotion.matches || !el.isConnected) { el.textContent = format(to); return; }
  const start = performance.now(), dur = 700;
  const step = now => {
    const t = Math.min(1, (now - start) / dur), eased = 1 - Math.pow(1 - t, 3);
    el.textContent = format(Math.round(from + (to - from) * eased));
    if (t < 1 && Number(el.dataset.val) === to) requestAnimationFrame(step); else el.textContent = format(Number(el.dataset.val));
  };
  requestAnimationFrame(step);
}
const diffClass = d => `diff diff-${String(d || "").toLowerCase().replace(/[^a-z]/g, "")}`;
const levelThemeVariables = theme => ({
  "--accent": theme.accent,
  "--accent-hi": theme.hi,
  "--accent-lo": theme.lo,
  "--accent-ink": theme.ink,
  "--accent-soft": theme.soft,
  "--accent-glow": theme.glow,
  "--on-accent": theme.onAccent,
  "--focus": theme.focus
});
const actualLevelPreview = () => ({ level: player.level, xp: player.xp, totalXp: 0 });

function applyLevelTheme(level) {
  const theme = levelTheme(level);
  const root = document.documentElement;
  root.dataset.levelTheme = theme.key;
  Object.entries(levelThemeVariables(theme)).forEach(([property, value]) => root.style.setProperty(property, value));
}

function clearLevelTheme() {
  const root = document.documentElement;
  delete root.dataset.levelTheme;
  Object.keys(levelThemeVariables(levelTheme(1))).forEach(property => root.style.removeProperty(property));
}

function readFlag(key) {
  try { return localStorage.getItem(key) === "true" || sessionStorage.getItem(key) === "true"; } catch { return false; }
}

/* ------------------------------------------------------------------ */
/* Public landing page                                                  */
/* ------------------------------------------------------------------ */
const FEATURED_QUEST_IDS = [2, 1, 4, 5, 7, 8];

function renderLanding() {
  const fills = {
    questCount: questData.length,
    xpPerLevel: XP_PER_LEVEL.toLocaleString(),
    badgeCount: badges.length,
    itemCount: collectibles.length,
    dailyXp: DAILY_DROP_XP
  };
  document.querySelectorAll("[data-fill]").forEach(el => { if (fills[el.dataset.fill] !== undefined) el.textContent = fills[el.dataset.fill]; });

  const featured = FEATURED_QUEST_IDS.map(id => questData.find(q => q.id === id)).filter(Boolean);
  $("questPreview").innerHTML = featured.map((q, i) => `
    <article class="card quest-preview-card reveal-item" style="--i:${i}">
      <div class="quest-card-top"><span class="quest-icon" aria-hidden="true">${questIcon(q.type)}</span><span class="quest-type">${escapeHtml(q.type)}</span></div>
      <h3>${escapeHtml(q.title)}</h3><p>${escapeHtml(q.description)}</p>
      <div class="quest-meta"><span class="${diffClass(q.difficulty)}">${escapeHtml(q.difficulty)}</span><span>${icon("clock", 14)}${num(q.duration)} min</span><b>+${num(q.xp)} XP</b></div>
    </article>`).join("");

  $("itemPreview").innerHTML = collectibles.map(i => `
    <div class="mini-item reveal-item"><img src="assets/images/${escapeHtml(i.image)}" alt="" width="48" height="48" loading="lazy"><div><b>${escapeHtml(i.name)}</b><small>Unlocks at level ${num(i.unlock)}</small></div></div>`).join("");
  $("badgePreview").innerHTML = badges.map(b => `
    <div class="mini-item reveal-item"><img src="assets/images/${escapeHtml(b.image)}" alt="" width="48" height="48" loading="lazy"><div><b>${escapeHtml(b.name)}</b><small>${escapeHtml(b.description)}</small></div></div>`).join("");
}

function initLandingNav() {
  const nav = $("publicNav"), toggle = $("publicNavToggle"), header = $("publicHeader");
  const closeNav = () => { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); };
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  // Close the mobile menu after choosing any public link (header or footer or in-page buttons).
  document.querySelectorAll("#loginScreen a[href^='#']").forEach(a => a.addEventListener("click", closeNav));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("open")) { closeNav(); toggle.focus(); } });
  document.addEventListener("click", e => { if (nav.classList.contains("open") && !header.contains(e.target)) closeNav(); });

  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Highlight the link of the section currently in view.
  const links = [...document.querySelectorAll("#publicNav [data-spy]")];
  const setActive = id => links.forEach(a => {
    const on = a.dataset.spy === id;
    a.classList.toggle("active", on);
    if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
  });
  setActive("home");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: "-35% 0px -60% 0px", threshold: 0 });
    links.forEach(a => { const section = document.getElementById(a.dataset.spy); if (section) observer.observe(section); });
  }
}

/* ------------------------------------------------------------------ */
/* Landing motion (progressive enhancement; skipped for reduced motion) */
/* ------------------------------------------------------------------ */
function initLandingMotion() {
  const hero = document.getElementById("home");
  const steps = $("steps");
  const root = document.documentElement;

  // Reveal items once as they scroll into view. The class is only added when it is safe, so content is never hidden without JS.
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    root.classList.add("reveal-on");
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    document.querySelectorAll(".reveal-item").forEach(el => io.observe(el));
  }

  // Pause the hero's ambient animation while it is off-screen.
  if ("IntersectionObserver" in window && hero) {
    new IntersectionObserver(([e]) => hero.classList.toggle("is-offscreen", !e.isIntersecting), { threshold: 0 }).observe(hero);
  }

  // One rAF-throttled scroll handler: hero parallax + "how it works" progress line.
  let ticking = false;
  const update = () => {
    ticking = false;
    if ($("loginScreen").classList.contains("hidden")) return;
    const y = window.scrollY;
    if (hero && !reduceMotion.matches && y < hero.offsetHeight + 200) hero.style.setProperty("--scroll", String(y));
    if (steps) {
      const r = steps.getBoundingClientRect(), vh = window.innerHeight;
      const p = Math.max(0, Math.min(1, (vh * 0.62 - r.top) / r.height));
      steps.style.setProperty("--p", reduceMotion.matches ? "1" : p.toFixed(3));
      steps.querySelectorAll("li").forEach(li => {
        const lr = li.getBoundingClientRect();
        li.classList.toggle("lit", reduceMotion.matches || lr.top < vh * 0.62);
      });
    }
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();

  // Gentle pointer parallax on the portal (fine pointers only).
  const portal = document.querySelector(".hero-portal");
  if (portal && hero && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let raf = 0;
    hero.addEventListener("pointermove", e => {
      if (reduceMotion.matches || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const b = hero.getBoundingClientRect();
        portal.style.setProperty("--px", `${((e.clientX - b.left) / b.width - 0.5) * -22}px`);
        portal.style.setProperty("--py", `${((e.clientY - b.top) / b.height - 0.5) * -22}px`);
      });
    });
  }
}

/* ------------------------------------------------------------------ */
/* Local demo sign-in (no real accounts exist)                          */
/* ------------------------------------------------------------------ */
function showLogin() {
  $("loginScreen").classList.remove("hidden");
  document.body.classList.add("login-active");
  $("app").setAttribute("aria-hidden", "true");
  $("app").inert = true;
  $("appHeader").setAttribute("aria-hidden", "true");
  $("appHeader").inert = true;
}

function hideLogin() {
  $("loginScreen").classList.add("hidden");
  document.body.classList.remove("login-active");
  $("app").setAttribute("aria-hidden", "false");
  $("app").inert = false;
  $("appHeader").setAttribute("aria-hidden", "false");
  $("appHeader").inert = false;
}

function setFieldError(el, message) {
  el.textContent = message || "";
  el.hidden = !message;
}

function validateName(raw) {
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 2) return { error: "Display name must be at least 2 characters." };
  if (name.length > 18) return { error: "Display name can be at most 18 characters." };
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f<>]/.test(name)) return { error: "Display name cannot contain control characters or < >." };
  return { name };
}

function login(username) {
  syncFromStorage();
  player.name = username;
  loggedIn = true;
  try {
    if ($("rememberMe").checked) {
      localStorage.setItem("aionLoggedIn", "true");
      sessionStorage.removeItem("aionLoggedIn");
    } else {
      sessionStorage.setItem("aionLoggedIn", "true");
      localStorage.removeItem("aionLoggedIn");
    }
  } catch { /* storage blocked: session only */ }
  save();
  hideLogin();
  if (!location.hash.startsWith("#/")) history.replaceState(null, "", `${location.pathname}${location.search}#/dashboard`);
  render();
  route();
  $("app").focus?.();
  toast(`Welcome to AION, ${username}.`);
}

function logout() {
  loggedIn = false;
  levelDemoActive = false;
  levelDemoState = null;
  clearLevelTheme();
  try { localStorage.removeItem("aionLoggedIn"); sessionStorage.removeItem("aionLoggedIn"); } catch { /* ignore */ }
  history.replaceState(null, "", `${location.pathname}${location.search}`);
  showLogin();
  window.scrollTo(0, 0);
  toast("You have signed out.");
}

/* ------------------------------------------------------------------ */
/* Persistence helpers                                                  */
/* ------------------------------------------------------------------ */
function toast(msg, kind = "") {
  const t = $("toast");
  t.textContent = msg;
  t.classList.toggle("toast-error", kind === "error");
  t.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

function save() {
  syncUnlocks(player);
  persistOk = savePlayer(player);
  if (!persistOk && !persistWarned) {
    persistWarned = true;
    toast("Your browser is blocking storage, so progress will not be saved after you close this tab.", "error");
  }
}

// Re-read saved progress before any XP-granting action so a second open tab can never cause a double grant.
function syncFromStorage() {
  if (persistOk) player = getPlayer();
}

function rank() { return getLeaderboard(player).findIndex(p => p.isPlayer) + 1 }
function refreshHeader() {
  $("headerName").textContent = player.name;
  $("headerLevel").textContent = `LV ${player.level}`;
  $("headerOrb").textContent = player.name[0]?.toUpperCase() || "P";
  $("headerXp").style.width = `${xpPercent()}%`;
}
const xpPercent = () => Math.max(0, Math.min(100, (player.xp / xpRequiredForLevel(player.level)) * 100));

/* ------------------------------------------------------------------ */
/* Dashboard                                                            */
/* ------------------------------------------------------------------ */
function renderDashboard() {
  const quests = allQuests();
  const doneCount = quests.filter(isDone).length;
  const expiredCount = quests.filter(q => !isDone(q) && isExpired(q)).length;
  const activeList = quests.filter(q => !isDone(q));
  const todayCompleted = quests.filter(q => isDone(q) && player.completionDates?.[String(q.id)] === todayKey()).length;
  const pct = quests.length ? Math.round((doneCount / quests.length) * 100) : 0;

  $("dashboardAvatar").textContent = player.name[0]?.toUpperCase() || "P";
  $("dashboardPlayer").textContent = player.name;
  $("dashboardLevel").textContent = player.level;
  $("dashboardLevelBig").textContent = player.level;
  $("dashboardRing").style.strokeDasharray = `${xpPercent()} 100`;
  tickNumber($("dashboardXp"), player.xp);
  const xpRequired = xpRequiredForLevel(player.level);
  $("dashboardXpMax").textContent = xpRequired;
  $("dashboardXpBar").style.width = `${xpPercent()}%`;
  $("dashboardXpTrack").setAttribute("aria-valuenow", String(Math.round(xpPercent())));
  tickNumber($("dashboardTotalXp"), player.totalXp, v => v.toLocaleString());
  $("dashboardStreak").textContent = player.streak;
  $("dashboardQuestsDone").textContent = doneCount;
  $("dashboardRank").textContent = `#${rank()}`;

  $("qsActive").textContent = activeList.length;
  $("qsDone").textContent = doneCount;
  $("qsExpired").textContent = expiredCount;
  $("qsTotal").textContent = quests.length;
  $("qsBar").style.width = `${pct}%`;
  $("qsTrack").setAttribute("aria-valuenow", String(pct));
  $("qsText").textContent = `${pct}% of quests completed`;
  $("qsTodayText").textContent = `Today: ${todayCompleted} quest${todayCompleted === 1 ? "" : "s"} completed`;

  $("dashboardQuestList").innerHTML = activeList.length ? activeList.slice(0, 4).map(q => `
    <div class="dash-quest">
      <span class="dash-icon" aria-hidden="true">${questIcon(q.type)}</span>
      <div><strong>${escapeHtml(q.title)}</strong><small>${escapeHtml(q.type)} · <span class="${diffClass(q.difficulty)}">${escapeHtml(q.difficulty)}</span> · ${escapeHtml(questPriority(q))} priority${q.dueDate ? ` · ${isExpired(q) ? '<span class="due-late">Overdue</span>' : "Due"} ${escapeHtml(formatDate(q.dueDate))}` : ""}</small></div>
      <b class="pill pill-gold">+${num(q.xp)} XP</b>
      <button class="btn btn-light btn-sm dash-complete" type="button" data-quick="${escapeHtml(q.id)}" aria-label="Complete ${escapeHtml(q.title)}" ${objectiveProgress(q).done < objectiveProgress(q).objectives.length ? "disabled" : ""}>Complete</button>
    </div>`).join("")
    : `<div class="empty-panel">${icon(expiredCount ? "clock" : "seal", 28)}<strong>${expiredCount ? "No active quests." : "All quests complete."}</strong><span>${expiredCount ? "Review your expired missions or create a new quest." : "Create a custom quest or generate more from the Quest Board."}</span></div>`;

  const claimedToday = player.dailyClaimDate === todayKey();
  const dailyBtn = $("dailyRewardButton");
  dailyBtn.disabled = claimedToday;
  dailyBtn.innerHTML = `${icon(claimedToday ? "check" : "sparkle", 18)}${claimedToday ? "Daily Drop claimed" : "Claim Daily Drop"}`;
  $("dailyStatus").textContent = claimedToday ? "Claimed today. Come back tomorrow." : "Available now";
  $("dailyXpValue").textContent = DAILY_DROP_XP;

  $("dashboardReward").textContent = `Level ${player.level + 1}`;
  $("dashboardRewardText").textContent = `${(xpRequired - player.xp).toLocaleString()} XP remaining`;
  $("dashboardRewardBar").style.width = `${xpPercent()}%`;
  const nextItem = inventoryItems(player).filter(i => !i.unlocked).sort((a, b) => a.unlock - b.unlock)[0];
  $("dashboardNextItem").textContent = nextItem ? `Next collectible: ${nextItem.name} at level ${nextItem.unlock}.` : "All collectibles unlocked.";

  const activity = [...player.rewardHistory].reverse().slice(0, 5);
  $("dashboardActivity").innerHTML = activity.length ? activity.map(a => `
    <div class="activity-row"><span class="activity-dot" aria-hidden="true"></span><div><strong>${escapeHtml(a.name)}</strong><small>${escapeHtml(new Date(a.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }))}</small></div><b class="pill pill-green">+${num(a.xp)} XP</b></div>`).join("")
    : `<div class="empty-panel">${icon("quill", 28)}<strong>No activity yet.</strong><span>Complete a quest or claim your Daily Drop to see it here.</span></div>`;

  document.querySelectorAll("[data-quick]").forEach(b => b.onclick = () => finishQuest(b.dataset.quick));
}

/* ------------------------------------------------------------------ */
/* Quest board                                                          */
/* ------------------------------------------------------------------ */
function renderQuestBoard() {
  const quests = allQuests();
  const doneCount = quests.filter(isDone).length;
  const expiredCount = quests.filter(q => !isDone(q) && isExpired(q)).length;
  const activeCount = quests.length - doneCount;
  const pct = quests.length ? Math.round((doneCount / quests.length) * 100) : 0;
  $("questSummary").innerHTML = `
    <div class="summary-item"><b>${activeCount}</b><span>Active</span></div>
    <div class="summary-item"><b>${doneCount}</b><span>Completed</span></div>
    <div class="summary-item"><b>${expiredCount}</b><span>Expired</span></div>
    <div class="summary-progress"><div class="summary-progress-head"><span>Board progress</span><b>${pct}%</b></div><div class="mini-progress" role="progressbar" aria-label="Board progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div></div>`;

  $("questFilters").innerHTML = getTypes(quests).map(t => `<button type="button" class="quest-filter ${t === activeFilter ? "active" : ""}" data-filter="${escapeHtml(t)}" aria-pressed="${t === activeFilter}">${escapeHtml(t)}</button>`).join("");
  const today = todayKey();
  const list = filterQuests(activeFilter, search, quests)
    .filter(q => activeDifficulty === "All" || q.difficulty === activeDifficulty)
    .filter(q => activePriority === "All" || questPriority(q) === activePriority)
    .filter(q => activeStatus === "All" || (activeStatus === "Completed" ? isDone(q) : activeStatus === "Expired" ? isExpired(q) && !isDone(q) : !isDone(q) && !isExpired(q)))
    .filter(q => activeDeadline === "All" || (activeDeadline === "Has deadline" ? Boolean(q.dueDate) : activeDeadline === "No deadline" ? !q.dueDate : Boolean(q.dueDate && q.dueDate >= today && (new Date(`${q.dueDate}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000 <= 7)))
    .sort((a, b) => sortBy === "oldest" ? Number(a.id) - Number(b.id)
      : sortBy === "due" ? (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31")
      : sortBy === "xp" ? b.xp - a.xp
      : sortBy === "priority" ? ["High", "Normal", "Low"].indexOf(questPriority(a)) - ["High", "Normal", "Low"].indexOf(questPriority(b))
      : sortBy === "title" ? a.title.localeCompare(b.title)
      : Number(b.id) - Number(a.id));

  const renderCard = q => {
    const done = isDone(q);
    const expired = isExpired(q) && !done;
    const status = done ? `<span class="status status-done">Completed</span>` : expired ? `<span class="status status-expired">Expired</span>` : `<span class="status status-active">Active</span>`;
    const level = { Easy: 1, Medium: 2, Hard: 3 }[q.difficulty] || 1;
    const progress = objectiveProgress(q);
    const priority = questPriority(q);
    return `<article class="quest-card diff-${escapeHtml(String(q.difficulty || "easy").toLowerCase().replace(/[^a-z]/g, ""))} ${done ? "completed" : ""} ${expired ? "expired" : ""}">
      <div class="quest-card-top"><span class="quest-icon" aria-hidden="true">${questIcon(q.type)}</span><span class="quest-type">${escapeHtml(q.type)}</span>${status}</div>
      <h3>${escapeHtml(q.title)}</h3><p>${escapeHtml(q.description)}</p>
      <div class="quest-meta">
        <span class="${diffClass(q.difficulty)} has-pips"><span class="pips" data-level="${level}" aria-hidden="true"><i></i><i></i><i></i></span>${escapeHtml(q.difficulty)}</span>
        <span>${escapeHtml(priority)} priority</span>
        ${q.duration ? `<span>${icon("clock", 14)}${num(q.duration)} min</span>` : ""}
        ${q.dueDate ? `<span class="${expired ? "due-late" : ""}">${expired ? "Overdue" : "Due"} ${escapeHtml(formatDate(q.dueDate))}</span>` : ""}
      </div>
      ${progress.objectives.length ? `<div class="quest-objectives">
        <div class="quest-objectives-head"><span>Objectives</span><b>${progress.done}/${progress.objectives.length}</b></div>
        <div class="mini-progress" role="progressbar" aria-label="${escapeHtml(q.title)} objective progress" aria-valuemin="0" aria-valuemax="${progress.objectives.length}" aria-valuenow="${progress.done}"><i style="width:${progress.percent}%"></i></div>
        ${progress.objectives.map((objective, index) => `<label class="quest-objective"><input type="checkbox" data-objective="${escapeHtml(q.id)}" data-objective-index="${index}" ${objective.done ? "checked" : ""} ${done ? "disabled" : ""}><span>${escapeHtml(objective.text)}</span></label>`).join("")}
      </div>` : ""}
      <div class="quest-foot">
        <div class="quest-reward"><b>+${num(q.xp)}</b><span>XP</span></div>
        <button class="btn ${done || progress.done < progress.objectives.length ? "btn-done" : "btn-primary"}" type="button" data-quest="${escapeHtml(q.id)}" ${done || progress.done < progress.objectives.length ? "disabled" : ""}>${done ? "Quest complete" : progress.done < progress.objectives.length ? "Complete objectives first" : "Complete quest"}</button>
      </div>
      ${q.custom ? `<div class="quest-card-actions"><button type="button" data-edit="${escapeHtml(q.id)}">Edit</button><button type="button" data-delete="${escapeHtml(q.id)}">Delete</button></div>` : ""}
      ${done ? `<div class="quest-card-actions"><button type="button" data-reopen="${escapeHtml(q.id)}">Reopen quest</button></div>` : ""}
    </article>`;
  };
  const activeList = list.filter(q => !isDone(q));
  const completedList = list.filter(isDone);
  $("questGrid").innerHTML = activeList.map(renderCard).join("");
  $("completedQuestGrid").innerHTML = completedList.map(renderCard).join("");
  $("completedQuestCount").textContent = String(doneCount);
  $("questEmpty").classList.toggle("hidden", activeList.length !== 0);
  $("completedQuestEmpty").classList.toggle("hidden", completedList.length !== 0);
  document.querySelectorAll("[data-filter]").forEach(b => b.onclick = () => { activeFilter = b.dataset.filter; renderQuestBoard(); $("questFilters").querySelector(".active")?.focus(); });
  document.querySelectorAll("[data-quest]").forEach(b => b.onclick = () => finishQuest(b.dataset.quest));
  document.querySelectorAll("[data-objective]").forEach(input => input.onchange = () => updateObjective(input.dataset.objective, Number(input.dataset.objectiveIndex), input.checked));
  document.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => openQuestEditor(Number(b.dataset.edit)));
  document.querySelectorAll("[data-delete]").forEach(b => b.onclick = () => deleteQuest(Number(b.dataset.delete)));
  document.querySelectorAll("[data-reopen]").forEach(b => b.onclick = () => reopenQuest(b.dataset.reopen));
}

function finishQuest(rawId) {
  syncFromStorage(); // trusted latest state, guards against stale tabs
  const quest = allQuests().find(q => String(q.id) === String(rawId));
  if (!quest) { render(); toast("That quest no longer exists."); return; }
  if (isDone(quest)) { render(); toast("This quest was already completed. XP is only awarded once."); return; }
  const badgesBefore = new Set(unlockedBadges(player).map(b => b.id));
  const itemsBefore = new Set(inventoryItems(player).filter(i => i.unlocked).map(i => i.id));
  const result = completeQuest(player, quest);
  player = result.player;
  save();
  const newBadges = unlockedBadges(player).filter(b => !badgesBefore.has(b.id));
  const newItems = inventoryItems(player).filter(i => i.unlocked && !itemsBefore.has(i.id));
  render();
  showReward({
    heading: "Quest complete!",
    title: quest.title,
    xp: result.xpAwarded,
    leveled: result.leveled,
    unlocks: [...newBadges.map(b => `Badge: ${b.name}`), ...newItems.map(i => `Collectible: ${i.name}`)],
    message: result.xpAwarded === 0
      ? "Quest completed again. Its XP reward has already been claimed."
      : result.leveled ? "A new level is yours. Keep the momentum going!" : "Your dedication is paying off. Keep going!"
  });
}

function updateObjective(rawId, index, checked) {
  syncFromStorage();
  const quest = allQuests().find(q => String(q.id) === String(rawId));
  if (!quest || isDone(quest) || !Number.isInteger(index) || !quest.objectives?.[index]) {
    render();
    toast("That objective is no longer available.", "error");
    return;
  }
  quest.objectives[index].done = checked;
  save();
  render();
}

function reopenQuest(rawId) {
  syncFromStorage();
  const quest = allQuests().find(q => String(q.id) === String(rawId));
  if (!quest || !isDone(quest)) {
    render();
    toast("That completed quest is no longer available.", "error");
    return;
  }
  player.completed = player.completed.filter(id => String(id) !== String(quest.id));
  if (player.completionDates) delete player.completionDates[String(quest.id)];
  save();
  render();
  toast("Quest reopened. Its XP reward cannot be claimed twice.");
}

/* ------------------------------------------------------------------ */
/* Inventory / ranking / profile / stats / settings                     */
/* ------------------------------------------------------------------ */
// Rarity is presentation only: it is derived from the thresholds already in data.js (unlock level / badge goal).
const BADGE_RARITY = { first: "common", streak3: "common", level5: "rare", quest10: "rare", xp1000: "epic", level10: "legendary" };
const RARITY_LABEL = { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary" };
const itemRarity = item => (item.unlock >= 10 ? "legendary" : item.unlock >= 5 ? "epic" : item.unlock >= 3 ? "rare" : "common");
function artifactCard({ image, name, text, unlocked, rarity = "common", progress = null }) {
  return `<article class="artifact rar-${rarity} ${unlocked ? "" : "locked"}">
    <div class="artifact-stage"><img src="assets/images/${escapeHtml(image)}" alt="" width="72" height="72" loading="lazy"></div>
    <div class="artifact-info">
      <span class="rarity">${RARITY_LABEL[rarity]}</span>
      <h4>${escapeHtml(name)}</h4><p>${escapeHtml(text)}</p>
      ${progress === null ? "" : `<div class="mini-progress" aria-hidden="true"><i style="width:${progress}%"></i></div>`}
      <span class="status ${unlocked ? "status-done" : ""}">${unlocked ? "Unlocked" : "Locked"}</span>
    </div>
  </article>`;
}

function renderInventory() {
  const ub = unlockedBadges(player), items = inventoryItems(player);
  const unlockedItems = items.filter(i => i.unlocked).length;
  $("inventoryBadges").textContent = `${ub.length} / ${badges.length}`;
  $("inventoryItems").textContent = `${unlockedItems} / ${items.length}`;
  $("inventoryPercent").textContent = `${Math.round((ub.length + unlockedItems) / (badges.length + items.length) * 100)}%`;
  const lockedBadges = badges.filter(b => !ub.some(u => u.id === b.id));
  $("badgeGrid").innerHTML = [
    ...ub.map(b => artifactCard({ image: b.image, name: b.name, text: b.description, unlocked: true, rarity: BADGE_RARITY[b.id] })),
    ...lockedBadges.map(b => artifactCard({ image: b.image, name: b.name, text: b.description, unlocked: false, rarity: BADGE_RARITY[b.id] }))
  ].join("");
  $("itemGrid").innerHTML = items.map(i => artifactCard({
    image: i.image, name: i.name, unlocked: i.unlocked, rarity: itemRarity(i),
    text: i.unlocked ? i.description : `Unlocks at level ${num(i.unlock)}.`,
    progress: i.unlocked ? null : Math.min(100, Math.round(player.level / num(i.unlock) * 100))
  })).join("");
  $("rewardHistory").innerHTML = player.rewardHistory.length
    ? [...player.rewardHistory].reverse().slice(0, 8).map(r => `<article><b>${escapeHtml(r.name)}</b><span>+${num(r.xp)} XP · ${escapeHtml(new Date(r.date).toLocaleDateString())}</span></article>`).join("")
    : `<div class="empty-panel">${icon("medal", 28)}<strong>No rewards yet.</strong><span>Your claimed quest and Daily Drop rewards will appear here.</span></div>`;
}

const insignia = n => `<svg class="insignia" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${[0, 1, 2].slice(0, 4 - n).map(k => `<path d="m5 ${9 + k * 5} 7-5 7 5" transform="translate(0 ${(n - 1) * 3 - 1})"/>`).join("")}</svg>`;

function renderLeaderboard() {
  const list = getLeaderboard(player), r = list.findIndex(p => p.isPlayer) + 1;
  const top = Math.max(...list.map(p => num(p.xp)), 1);
  $("yourRank").textContent = `#${r}`;
  $("rankXp").textContent = `${player.totalXp.toLocaleString()} XP`;
  const above = r > 1 ? list[r - 2] : null;
  $("rankText").textContent = r === 1 ? "You lead the season." : `${r - 1} adventurer${r === 2 ? "" : "s"} ahead of you. ${(num(above.xp) - player.totalXp + 1).toLocaleString()} XP to pass ${above.name}.`;
  $("leaderboardList").innerHTML = list.length ? list.map((p, i) => `<div class="leader-row ${p.isPlayer ? "you" : ""} ${i < 3 ? `top-${i + 1}` : ""}">
    <span class="leader-rank">${i < 3 ? insignia(i + 1) : ""}<b>${i + 1}</b></span><span class="leader-icon" aria-hidden="true">${escapeHtml(String(p.name)[0]?.toUpperCase() || "?")}</span>
    <div class="leader-id"><strong>${escapeHtml(p.name)}${p.isPlayer ? '<em class="you-tag">you</em>' : ""}</strong><small>Level ${num(p.level)}</small></div>
    <div class="leader-score"><b class="leader-xp">${num(p.xp).toLocaleString()} XP</b><span class="leader-bar" aria-hidden="true"><i style="width:${Math.max(2, num(p.xp) / top * 100)}%"></i></span></div>
  </div>`).join("") : `<div class="empty-panel">${icon("medal", 28)}<strong>No rankings yet.</strong><span>Complete a quest to appear here.</span></div>`;
}

function renderProfile() {
  const completedCount = allQuests().filter(isDone).length;
  $("profileAvatar").textContent = player.name[0]?.toUpperCase() || "P";
  $("profileName").textContent = player.name;
  $("profileTitle").textContent = `Adventurer · Level ${player.level}`;
  $("profileLevel").textContent = player.level;
  $("profileXpBar").style.width = `${xpPercent()}%`;
  $("profileXpText").textContent = `${player.xp} / ${xpRequiredForLevel(player.level)} XP`;
  $("profileBio").textContent = player.bio || "No bio yet.";
  $("profileStats").innerHTML = [["Total XP", player.totalXp.toLocaleString()], ["Quests", completedCount], ["Streak", `${player.streak} days`], ["Best streak", `${player.bestStreak} days`]]
    .map(x => `<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join("");
  const ub = unlockedBadges(player);
  $("profileAchievements").innerHTML = ub.length ? ub.map(b => `<div><img src="assets/images/${escapeHtml(b.image)}" alt="" width="28" height="28"><b>${escapeHtml(b.name)}</b></div>`).join("") : `<p class="muted">No achievements yet. Complete your first quest to earn a badge.</p>`;
}

function renderStats() {
  const values = player.xpHistory.length ? player.xpHistory : [0, 0, 0, 0, 0, 0, 0], max = Math.max(...values, 1);
  const real = values.filter(v => num(v) > 0);
  const avg = real.length ? Math.round(real.reduce((t, v) => t + num(v), 0) / real.length) : 0;
  const scale = v => (num(v) / max) * 88;
  $("xpChart").innerHTML = values.map((v, i) => `<div class="chart-col ${i === values.length - 1 && num(v) > 0 ? "latest" : ""}"><div class="chart-bar">${num(v) > 0 ? `<b style="bottom:calc(${scale(v)}% + 8px)">${num(v)}</b>` : ""}<i style="height:${Math.max(1.5, scale(v))}%"></i></div><small>#${i + 1}</small></div>`).join("")
    + (avg ? `<div class="chart-avg" style="--k:${(avg / max) * 0.88}"><span>Avg ${avg}</span></div>` : "");
  $("chartAxis").innerHTML = (real.length ? [[0.88, max], [0.44, Math.round(max / 2)], [0, 0]] : [[0, 0]]).map(([k, v]) => `<span style="--k:${k}">${num(v)}</span>`).join("");
  $("chartEmpty").classList.toggle("hidden", real.length > 0);
  $("chartNote").textContent = real.length ? `Last ${real.length} quest completion${real.length === 1 ? "" : "s"}` : "No completions yet";
  const total = allQuests().length;
  const completedCount = allQuests().filter(isDone).length;
  const percent = Math.min(100, Math.round(completedCount / (total || 1) * 100));
  $("completionRate").textContent = `${percent}%`;
  $("completionNote").textContent = `${completedCount} of ${total} quests completed`;
  document.querySelector(".stat-circle").style.setProperty("--rate", `${percent * 3.6}deg`);
  $("bestStreak").textContent = player.bestStreak;
  $("totalXp").textContent = player.totalXp.toLocaleString();
  $("statsDone").textContent = completedCount;
  $("statsAvg").textContent = avg ? `avg ${avg} XP per quest` : "\u00a0";
}

function renderSettings() {
  document.documentElement.dataset.theme = player.theme;
  if ($("settingsForm").contains(document.activeElement) && document.activeElement !== $("settingsForm")) return; // don't overwrite while typing
  $("settingsName").value = player.name;
  $("settingsBio").value = player.bio;
  $("settingsTheme").value = player.theme;
}

function renderLevelDemo() {
  const controls = $("demoControls");
  if (!levelDemoActive) {
    levelDemoState = actualLevelPreview();
    controls.classList.add("hidden");
    $("toggleLevelDemo").textContent = "Start demo mode";
  } else if (!levelDemoState) {
    levelDemoState = actualLevelPreview();
  }
  const level = levelDemoState.level;
  const required = xpRequiredForLevel(level);
  const theme = levelTheme(level);
  const percent = Math.max(0, Math.min(100, levelDemoState.xp / required * 100));
  if (levelDemoActive) controls.classList.remove("hidden");
  $("toggleLevelDemo").textContent = levelDemoActive ? "Exit demo mode" : "Start demo mode";
  $("demoIndicator").hidden = !levelDemoActive;
  $("demoLevel").value = String(level);
  $("demoLevelValue").textContent = String(level);
  $("demoXpValue").textContent = levelDemoState.xp.toLocaleString();
  $("demoXpRequired").textContent = required.toLocaleString();
  $("demoXpRemaining").textContent = `${(required - levelDemoState.xp).toLocaleString()} XP to the next level`;
  $("demoThemeName").textContent = theme.name;
  $("demoXpBar").style.width = `${percent}%`;
  $("demoXpTrack").setAttribute("aria-valuenow", String(Math.round(percent)));
  const preview = $("demoPreview");
  Object.entries(levelThemeVariables(theme)).forEach(([property, value]) => preview.style.setProperty(property, value));
}

function setDemoLevel(rawLevel) {
  if (!levelDemoActive || !levelDemoState) return;
  const level = Number(rawLevel);
  if (!Number.isInteger(level) || level < 1 || level > 10000) {
    toast("Preview level must be a whole number from 1 to 10,000.", "error");
    renderLevelDemo();
    return;
  }
  levelDemoState = { level, xp: 0, totalXp: 0 };
  renderLevelDemo();
}

function addDemoXp() {
  if (!levelDemoActive || !levelDemoState) return;
  const amount = Number($("demoXpAmount").value);
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 10000000) {
    toast("Simulated XP must be a whole number from 1 to 10,000,000.", "error");
    return;
  }
  awardXp(levelDemoState, amount);
  renderLevelDemo();
}

function applyDemoToDashboard() {
  if (!levelDemoActive || !levelDemoState) return;
  if (!window.confirm("Apply this demo progression to your dashboard? This replaces your saved level, current XP, and lifetime XP. Your quests and other player data will remain unchanged.")) return;

  syncFromStorage();
  const totalXp = totalXpForProgression(levelDemoState.level, levelDemoState.xp);
  const updatedPlayer = {
    ...player,
    level: levelDemoState.level,
    xp: levelDemoState.xp,
    totalXp,
    progressionVersion: 2
  };
  persistOk = savePlayer(updatedPlayer);
  if (!persistOk) {
    if (!persistWarned) {
      persistWarned = true;
      toast("Your browser is blocking storage, so the demo progression could not be applied.", "error");
    } else {
      toast("The demo progression could not be saved because browser storage is unavailable.", "error");
    }
    return;
  }

  player = updatedPlayer;
  levelDemoActive = false;
  levelDemoState = actualLevelPreview();
  render();
  toast("Demo progression applied and saved.");
}

function render() {
  if (loggedIn) applyLevelTheme(player.level);
  else clearLevelTheme();
  refreshHeader(); renderDashboard(); renderLevelDemo(); renderQuestBoard(); renderInventory(); renderLeaderboard(); renderProfile(); renderStats(); renderSettings();
}

/* ------------------------------------------------------------------ */
/* Routing (application only)                                           */
/* ------------------------------------------------------------------ */
function route() {
  if (!loggedIn) return;
  let v = location.hash.replace("#/", "") || "dashboard";
  const valid = ["dashboard", "quests", "inventory", "leaderboard", "profile", "stats", "settings"];
  if (!valid.includes(v)) v = "dashboard";
  document.querySelectorAll(".view").forEach(s => s.classList.toggle("active", s.dataset.view === v));
  document.querySelectorAll("[data-route]").forEach(a => { const on = a.dataset.route === v; a.classList.toggle("active", on); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  $("mainNav").classList.remove("open");
  $("menuToggle").setAttribute("aria-expanded", "false");
  window.scrollTo(0, 0);
}

/* ------------------------------------------------------------------ */
/* Modal                                                                */
/* ------------------------------------------------------------------ */
function openModal(html) {
  modalReturnFocus = document.activeElement;
  $("modalContent").innerHTML = html;
  $("modal").classList.remove("hidden");
  $("modal").querySelector(".modal-box").focus();
}

function closeModal() {
  if ($("modal").classList.contains("hidden")) return;
  $("modal").classList.add("hidden");
  if (modalReturnFocus?.isConnected) modalReturnFocus.focus?.();
  else {
    const currentView = document.querySelector(".view.active");
    currentView?.setAttribute("tabindex", "-1");
    currentView?.focus();
  }
}

function showReward({ heading = "Reward claimed!", title, message, xp, leveled = false, unlocks = [] }) {
  openModal(`<span class="eyebrow">Progress recorded</span><h3 id="modalTitle">${escapeHtml(heading)}</h3>
    <div class="reward-celebration"><span class="reward-seal" aria-hidden="true">${icon("seal", 54)}</span><strong>${escapeHtml(title)}</strong><b>+${num(xp)} XP</b>
    ${leveled ? `<em>Level ${player.level} reached</em>` : ""}
    <small class="reward-total">Total XP: ${player.totalXp.toLocaleString()} · ${player.xp} / ${xpRequiredForLevel(player.level)} toward level ${player.level + 1}</small>
    ${unlocks.length ? `<ul class="unlock-list">${unlocks.map(u => `<li>${icon("medal", 18)}${escapeHtml(u)}</li>`).join("")}</ul>` : ""}
    <p>${escapeHtml(message)}</p></div>
    <button class="btn btn-primary btn-block reward-continue" type="button">Awesome!</button>`);
  const btn = $("modal").querySelector(".reward-continue");
  btn.addEventListener("click", closeModal);
  btn.focus();
}

/* ------------------------------------------------------------------ */
/* Quest editor / delete / generator                                    */
/* ------------------------------------------------------------------ */
const CATEGORIES = ["Study", "Reading", "Assignment", "Programming", "Review", "Productivity", "Personal Goals"];

function openQuestEditor(id = null) {
  const quest = id === null ? null : (player.customQuests || []).find(q => Number(q.id) === id);
  if (id !== null && !quest) return;
  openModal(`<span class="eyebrow">${quest ? "Your custom quest" : "New quest"}</span><h3 id="modalTitle">${quest ? "Edit quest" : "Create a quest"}</h3>
    <form class="modal-form form" id="createForm" novalidate>
      <div class="field"><label for="newTitle">Quest title</label><input id="newTitle" required minlength="3" maxlength="40" value="${escapeHtml(quest?.title || "")}"></div>
      <div class="field"><label for="newDescription">Description</label><textarea id="newDescription" required minlength="5" maxlength="180" rows="3">${escapeHtml(quest?.description || "")}</textarea></div>
      <div class="field"><label for="newType">Category</label><select id="newType">${CATEGORIES.map(type => `<option ${quest?.type === type ? "selected" : ""}>${type}</option>`).join("")}</select></div>
      <div class="modal-form-row"><div class="field"><label for="newDifficulty">Difficulty</label><select id="newDifficulty">${["Easy", "Medium", "Hard"].map(d => `<option ${quest?.difficulty === d ? "selected" : ""}>${d}</option>`).join("")}</select></div>
      <div class="field"><label for="newPriority">Priority</label><select id="newPriority">${["Low", "Normal", "High"].map(priority => `<option ${questPriority(quest || {}) === priority ? "selected" : ""}>${priority}</option>`).join("")}</select></div></div>
      <div class="modal-form-row"><div class="field"><label for="newDuration">Time (minutes)</label><input id="newDuration" type="number" min="5" max="480" value="${num(quest?.duration) || 25}" required></div>
      <div class="field"><label for="newXp">XP reward</label><input id="newXp" type="number" min="10" max="500" value="${num(quest?.xp) || 80}" required></div></div>
      <div class="field"><label for="newDueDate">Due date (optional)</label><input id="newDueDate" type="date" value="${escapeHtml(quest?.dueDate || "")}"></div>
      <div class="field"><label for="newObjectives">Objectives (optional, one per line)</label><textarea id="newObjectives" maxlength="1100" rows="4">${escapeHtml(quest?.objectives?.map(objective => objective.text).join("\n") || "")}</textarea></div>
      <p id="questFormError" class="field-error" role="alert" hidden></p>
      <button class="btn btn-primary btn-block" type="submit">${quest ? "Save quest" : "Add to quest board"}</button>
    </form>`);
  $("newTitle").focus();
  let submitting = false;
  $("createForm").onsubmit = event => {
    event.preventDefault();
    if (submitting) return;
    const err = $("questFormError");
    const title = $("newTitle").value.trim();
    const description = $("newDescription").value.trim();
    const xp = Number($("newXp").value);
    const duration = Number($("newDuration").value);
    const dueDate = $("newDueDate").value;
    const objectiveTexts = $("newObjectives").value.split(/\r?\n/).map(text => text.trim()).filter(Boolean);
    const dueChanged = dueDate !== (quest?.dueDate || "");
    let problem = "";
    if (title.length < 3 || title.length > 40) problem = "Title must be 3–40 characters.";
    else if (description.length < 5 || description.length > 180) problem = "Description must be 5–180 characters.";
    else if (!Number.isInteger(duration) || duration < 5 || duration > 480) problem = "Time must be a whole number from 5 to 480 minutes.";
    else if (!Number.isInteger(xp) || xp < 10 || xp > 500) problem = "XP reward must be a whole number from 10 to 500.";
    else if (dueDate && dueChanged && dueDate < todayKey()) problem = "The due date cannot be in the past.";
    else if (objectiveTexts.length > 10) problem = "A quest can have at most 10 objectives.";
    else if (objectiveTexts.some(text => text.length > 100)) problem = "Each objective must be 100 characters or fewer.";
    if (problem) { setFieldError(err, problem); return; }
    submitting = true;
    syncFromStorage();
    const values = {
      title, description, type: $("newType").value, difficulty: $("newDifficulty").value,
      priority: $("newPriority").value, duration, xp, dueDate, icon: "✦", custom: true,
      objectives: objectiveTexts.map((text, index) => {
        const existing = quest?.objectives?.find(objective => objective.text === text);
        return { id: existing?.id || `${quest?.id || Date.now()}-${index}`, text, done: existing?.done || false };
      })
    };
    player.customQuests ||= [];
    const target = quest ? player.customQuests.find(q => Number(q.id) === Number(quest.id)) : null;
    if (quest && !target) { closeModal(); render(); toast("That quest no longer exists."); return; }
    if (target) Object.assign(target, values);
    else player.customQuests.push({ ...values, id: Date.now(), createdAt: new Date().toISOString() });
    save(); closeModal(); render(); toast(quest ? "Quest updated." : "Quest added to your board.");
  };
}

function deleteQuest(id) {
  syncFromStorage();
  const quest = (player.customQuests || []).find(q => Number(q.id) === id);
  if (!quest || !window.confirm(`Delete "${quest.title}"? This cannot be undone.`)) return;
  player.customQuests = (player.customQuests || []).filter(q => Number(q.id) !== id);
  player.completed = player.completed.filter(completedId => Number(completedId) !== id);
  if (player.completionDates) delete player.completionDates[String(id)];
  save(); render(); toast("Quest deleted.");
}

function openQuestGenerator() {
  openModal(`<span class="eyebrow">Rule-based quest generator</span><h3 id="modalTitle">Shape your next quests</h3>
    <form class="modal-form form" id="generateForm" novalidate>
      <div class="field"><label for="generateType">Category</label><select id="generateType"><option value="All">Any category</option>${CATEGORIES.map(t => `<option>${t}</option>`).join("")}</select></div>
      <div class="modal-form-row"><div class="field"><label for="generateDifficulty">Difficulty</label><select id="generateDifficulty"><option>Easy</option><option selected>Medium</option><option>Hard</option></select></div><div class="field"><label for="generateCount">Number of quests</label><select id="generateCount"><option>1</option><option selected>3</option><option>5</option></select></div></div>
      <div class="field"><label for="generateTime">Available time (minutes)</label><input id="generateTime" type="number" min="5" max="480" value="60" required></div>
      <p id="generateError" class="field-error" role="alert" hidden></p>
      <button class="btn btn-primary btn-block" type="submit">Preview quests</button>
    </form>
    <p class="generator-note">Generated from built-in templates. No AI service is used. Review and add only the quests you want.</p>`);
  $("generateForm").onsubmit = event => {
    event.preventDefault();
    const category = $("generateType").value;
    const difficulty = $("generateDifficulty").value;
    const count = Number($("generateCount").value);
    const availableTime = Number($("generateTime").value);
    if (!Number.isFinite(availableTime) || availableTime < 5 || availableTime > 480) { setFieldError($("generateError"), "Available time must be between 5 and 480 minutes."); return; }
    const durationLimit = Math.max(5, Math.floor(availableTime / count));
    const xpByDifficulty = { Easy: 60, Medium: 110, Hard: 170 };
    const pool = questTemplates.filter(t => (category === "All" || t.type === category) && t.duration <= durationLimit);
    if (!pool.length) { setFieldError($("generateError"), "No template fits that time. Increase your available time or choose another category."); return; }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const previews = Array.from({ length: count }, (_, index) => shuffled[index % shuffled.length]);
    $("modalContent").innerHTML = `<span class="eyebrow">Review before adding</span><h3 id="modalTitle">Your quest preview</h3>
      <form id="previewForm" class="preview-form">${previews.map((q, i) => `<label class="preview-quest"><input type="checkbox" name="previewQuest" value="${i}" checked><span><b>${escapeHtml(q.title)}</b><small>${escapeHtml(q.description)} · ${num(q.duration)} min</small></span><strong>+${xpByDifficulty[difficulty]} XP</strong></label>`).join("")}<p id="previewError" class="field-error" role="alert" hidden></p><button class="btn btn-primary btn-block" type="submit">Add selected quests</button></form>`;
    $("modal").querySelector(".modal-box").focus();
    $("previewForm").onsubmit = previewEvent => {
      previewEvent.preventDefault();
      const selected = [...$("previewForm").querySelectorAll('input[name="previewQuest"]:checked')].map(input => previews[Number(input.value)]);
      if (!selected.length) { setFieldError($("previewError"), "Select at least one quest to add."); return; }
      syncFromStorage();
      const now = Date.now();
      player.customQuests ||= [];
      selected.forEach((q, index) => player.customQuests.push({
        ...q, difficulty, xp: xpByDifficulty[difficulty], custom: true,
        id: now + index, createdAt: new Date().toISOString(), generated: true
      }));
      save(); closeModal(); render(); toast(`${selected.length} generated quest${selected.length === 1 ? "" : "s"} added.`);
    };
  };
}

/* ------------------------------------------------------------------ */
/* Event wiring                                                         */
/* ------------------------------------------------------------------ */
let loginBusy = false;
$("loginForm").onsubmit = e => {
  e.preventDefault();
  if (loginBusy) return;
  const check = validateName($("loginUsername").value);
  const err = $("loginError");
  if (check.error) { setFieldError(err, check.error); $("loginUsername").setAttribute("aria-invalid", "true"); $("loginUsername").focus(); return; }
  setFieldError(err, "");
  $("loginUsername").removeAttribute("aria-invalid");
  loginBusy = true;
  const button = $("loginSubmit");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.querySelector(".btn-label").textContent = "Opening your realm…";
  // Let the browser paint the loading state before the (synchronous) local sign-in runs.
  requestAnimationFrame(() => setTimeout(() => {
    try { login(check.name); }
    finally {
      loginBusy = false;
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.querySelector(".btn-label").textContent = "Enter the Realm";
    }
  }, 60));
};
$("loginUsername").addEventListener("input", () => { setFieldError($("loginError"), ""); $("loginUsername").removeAttribute("aria-invalid"); });

$("logoutButton").onclick = logout;
$("questSearch").oninput = e => { search = e.target.value; renderQuestBoard() };
$("questDifficulty").onchange = e => { activeDifficulty = e.target.value; renderQuestBoard() };
$("questPriority").onchange = e => { activePriority = e.target.value; renderQuestBoard() };
$("questStatus").onchange = e => { activeStatus = e.target.value; renderQuestBoard() };
$("questDeadline").onchange = e => { activeDeadline = e.target.value; renderQuestBoard() };
$("questSort").onchange = e => { sortBy = e.target.value; renderQuestBoard() };

$("dailyRewardButton").onclick = () => {
  syncFromStorage();
  const before = player.totalXp;
  const levelBefore = player.level;
  if (!claimDaily(player)) { render(); toast("Daily Drop already claimed today."); return; }
  save(); render();
  showReward({ heading: "Daily Drop claimed!", title: "Daily Drop", message: "A small daily boost for showing up.", xp: player.totalXp - before, leveled: player.level > levelBefore });
};

$("createQuestButton").onclick = () => openQuestEditor();
$("generateQuestButton").onclick = openQuestGenerator;

$("settingsForm").onsubmit = e => {
  e.preventDefault();
  const check = validateName($("settingsName").value);
  const err = $("settingsError");
  if (check.error) { setFieldError(err, check.error.replace("Display name", "Name")); return; }
  const theme = $("settingsTheme").value;
  if (!["gold", "sky"].includes(theme)) { setFieldError(err, "Choose one of the available accent colours."); return; }
  setFieldError(err, "");
  syncFromStorage();
  player.name = check.name;
  player.bio = $("settingsBio").value.trim().slice(0, 120);
  player.theme = theme;
  save(); render(); toast("Settings saved.");
};

$("toggleLevelDemo").onclick = () => {
  if (levelDemoActive) {
    levelDemoActive = false;
    levelDemoState = actualLevelPreview();
    renderLevelDemo();
    toast("Demo ended. Preview reset to your actual level.");
    return;
  }
  levelDemoState = actualLevelPreview();
  levelDemoActive = true;
  renderLevelDemo();
};
$("demoLevel").onchange = e => setDemoLevel(e.target.value);
$("demoLevelDown").onclick = () => setDemoLevel(levelDemoState.level - 1);
$("demoLevelUp").onclick = () => setDemoLevel(levelDemoState.level + 1);
$("addDemoXp").onclick = addDemoXp;
$("applyDemoToDashboard").onclick = applyDemoToDashboard;

$("resetButton").onclick = () => {
  if (!confirm("Reset all AION progress saved in this browser? This cannot be undone.")) return;
  const keepName = player.name;
  player = resetPlayer();
  player.name = keepName; // you stay signed in under the same display name
  save();
  location.hash = "#/dashboard";
  render();
  toast("AION reset complete.");
};

document.querySelectorAll("[data-close]").forEach(x => x.onclick = closeModal);
$("menuToggle").onclick = () => {
  const open = $("mainNav").classList.toggle("open");
  $("menuToggle").setAttribute("aria-expanded", String(open));
};
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
  if (e.key === "Tab" && !$("modal").classList.contains("hidden")) {
    const focusable = [...$("modal").querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]')];
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
});

// Only react to application routes (#/…); landing-page anchors (#about, #faq …) are left to the browser.
window.addEventListener("hashchange", () => { if (loggedIn && location.hash.startsWith("#/")) route(); });

// Keep several open tabs consistent, and refresh "today" state (Daily Drop, expiry) when returning to the tab.
window.addEventListener("storage", e => { if (loggedIn && e.key === "aion-semester-player") { player = getPlayer(); render(); } });
document.addEventListener("visibilitychange", () => { if (!document.hidden && loggedIn) { syncFromStorage(); render(); } });

/* ------------------------------------------------------------------ */
/* Start                                                                */
/* ------------------------------------------------------------------ */
renderLanding();
initLandingNav();
initLandingMotion();
render();
if (loggedIn) {
  hideLogin();
  if (!location.hash.startsWith("#/")) history.replaceState(null, "", `${location.pathname}${location.search}#/dashboard`);
  route();
} else {
  showLogin();
}
setTimeout(() => $("loadingScreen").classList.add("hide"), 400);
