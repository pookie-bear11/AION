import { questData, badges } from "./data.js";
import { getPlayer, savePlayer, resetPlayer } from "./storage.js";
import { awardXp, completeQuest, claimDaily } from "./player.js";
import { getTypes, filterQuests } from "./quests.js";
import { unlockedBadges, inventoryItems, syncUnlocks } from "./inventory.js";
import { getLeaderboard } from "./leaderboard.js";

let player = getPlayer();
let loggedIn = localStorage.getItem("aionLoggedIn") === "true";
let activeFilter = "All";
let search = "";
const $ = id => document.getElementById(id);
const escapeHtml = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

function showLogin() {
  $("loginScreen").classList.remove("hidden");
  document.body.classList.add("login-active");
  setTimeout(() => $("loginUsername")?.focus(), 80);
}

function hideLogin() {
  $("loginScreen").classList.add("hidden");
  document.body.classList.remove("login-active");
}

function login(username) {
  player.name = username;
  loggedIn = true;
  localStorage.setItem("aionLoggedIn", "true");
  localStorage.setItem("aionUsername", username);
  save();
  hideLogin();
  render();
  route();
  toast(`Welcome to AION, ${username}.`);
}

function logout() {
  loggedIn = false;
  localStorage.removeItem("aionLoggedIn");
  hideLogin();
  showLogin();
  toast("You have left the realm.");
}

function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => t.classList.remove("show"), 2300) }
function rank() { return getLeaderboard(player).findIndex(p => p.isPlayer) + 1 }
function refreshHeader() { $("headerName").textContent = player.name; $("headerLevel").textContent = `LV ${player.level}`; }
function save() { syncUnlocks(player); savePlayer(player) }

function renderDashboard() {
  $("dashboardAvatar").textContent = player.name[0]?.toUpperCase() || "P";
  $("dashboardPlayer").textContent = player.name;
  $("dashboardLevel").textContent = player.level;
  $("dashboardLevelBig").textContent = player.level;
  $("dashboardXp").textContent = player.xp;
  $("dashboardXpBar").style.width = `${player.xp / 10}%`;
  $("dashboardStreak").textContent = player.streak;
  $("dashboardQuestsDone").textContent = player.completed.length;
  $("dashboardRank").textContent = `#${rank()}`;
  const active = questData.filter(q => !player.completed.includes(q.id)).slice(0, 4);
  $("dashboardQuestList").innerHTML = active.length ? active.map(q => `
    <div class="dash-quest">
      <span class="dash-icon">${q.icon}</span>
      <div><strong>${escapeHtml(q.title)}</strong><small>${q.type} · ${q.difficulty}</small></div>
      <b class="dash-xp">+${q.xp}</b>
      <button class="dash-complete" data-quick="${q.id}">○</button>
    </div>`).join("") : `<div class="empty-panel">ALL QUESTS COMPLETE.</div>`;
  $("dashboardReward").textContent = `LEVEL ${player.level + 1}`;
  $("dashboardRewardText").textContent = `${1000 - player.xp} XP remaining`;
  $("dashboardRewardBar").style.width = `${player.xp / 10}%`;
  document.querySelectorAll("[data-quick]").forEach(b => b.onclick = () => finishQuest(Number(b.dataset.quick)));
}

function renderQuestBoard() {
  $("questFilters").innerHTML = getTypes().map(t => `<button class="quest-filter ${t === activeFilter ? "active" : ""}" data-filter="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("");
  const list = filterQuests(activeFilter, search);
  $("questGrid").innerHTML = list.map(q => {
    const done = player.completed.includes(q.id);
    return `<article class="quest-card ${done ? "completed" : ""}">
      <div class="quest-card-top"><span class="quest-icon">${q.icon}</span><span class="quest-type">${q.type}</span></div>
      <h3>${escapeHtml(q.title)}</h3><p>${escapeHtml(q.description)}</p>
      <div class="quest-meta"><span>${q.difficulty}</span><b>+${q.xp} XP</b></div>
      <button class="${done ? "done" : ""}" data-quest="${q.id}" ${done ? "disabled" : ""}>${done ? "QUEST COMPLETE ✓" : "COMPLETE QUEST"}</button>
    </article>`;
  }).join("");
  $("questEmpty").classList.toggle("hidden", list.length !== 0);
  document.querySelectorAll("[data-filter]").forEach(b => b.onclick = () => { activeFilter = b.dataset.filter; renderQuestBoard() });
  document.querySelectorAll("[data-quest]").forEach(b => b.onclick = () => finishQuest(Number(b.dataset.quest)));
}

function finishQuest(id) {
  const quest = questData.find(q => q.id === id);
  if (!quest || player.completed.includes(id)) return;
  const result = completeQuest(player, quest);
  player = result.player; save(); render();
  toast(result.leveled ? `LEVEL UP! +${quest.xp} XP` : `Quest complete! +${quest.xp} XP`);
}

function renderInventory() {
  const ub = unlockedBadges(player), items = inventoryItems(player);
  $("inventoryBadges").textContent = ub.length;
  $("inventoryItems").textContent = items.filter(i => i.unlocked).length;
  $("inventoryPercent").textContent = `${Math.round((ub.length + items.filter(i => i.unlocked).length) / 10 * 100)}%`;
  $("badgeGrid").innerHTML = ub.length ? ub.map(b => `<article class="collection-card"><img src="assets/images/${b.image}" alt=""><h4>${escapeHtml(b.name)}</h4><p>${escapeHtml(b.description)}</p><span>UNLOCKED</span></article>`).join("") : `<div class="empty-panel">COMPLETE YOUR FIRST QUEST TO EARN A BADGE.</div>`;
  $("itemGrid").innerHTML = items.map(i => `<article class="collection-card ${i.unlocked ? "" : "locked"}"><img src="assets/images/${i.image}" alt=""><h4>${escapeHtml(i.name)}</h4><p>${i.unlocked ? escapeHtml(i.description) : `Unlock at level ${i.unlock}.`}</p><span>${i.unlocked ? "UNLOCKED" : "LOCKED"}</span></article>`).join("");
}

function renderLeaderboard() {
  const list = getLeaderboard(player), r = list.findIndex(p => p.isPlayer) + 1;
  $("yourRank").textContent = `#${r}`; $("rankXp").textContent = `${player.totalXp} XP`;
  $("rankText").textContent = r === 1 ? "You lead the season." : `${r - 1} adventurer${r === 2 ? "" : "s"} ahead of you. Keep questing!`;
  $("leaderboardList").innerHTML = list.map((p, i) => `<div class="leader-row ${p.isPlayer ? "you" : ""}">
    <span class="leader-rank">${i + 1}</span><span class="leader-icon">${p.icon}</span>
    <div><strong>${escapeHtml(p.name)}</strong><small>LEVEL ${p.level}</small></div><b class="leader-xp">${p.xp.toLocaleString()} XP</b>
  </div>`).join("");
}

function renderProfile() {
  $("profileAvatar").textContent = player.name[0]?.toUpperCase() || "P";
  $("profileName").textContent = player.name; $("profileTitle").textContent = `ADVENTURER · LEVEL ${player.level}`;
  $("profileLevel").textContent = player.level; $("profileXpBar").style.width = `${player.xp / 10}%`; $("profileXpText").textContent = `${player.xp} / 1000 XP`;
  $("profileBio").textContent = player.bio || "No bio yet.";
  $("profileStats").innerHTML = [["TOTAL XP", player.totalXp], ["QUESTS", player.completed.length], ["STREAK", `${player.streak} DAYS`], ["BEST STREAK", `${player.bestStreak} DAYS`]]
    .map(x => `<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join("");
  const ub = unlockedBadges(player);
  $("profileAchievements").innerHTML = ub.length ? ub.slice(0, 4).map(b => `<div><span>✦</span><b>${escapeHtml(b.name)}</b></div>`).join("") : `<p>No achievements yet.</p>`;
}

function renderStats() {
  const values = player.xpHistory.length ? player.xpHistory : [0, 0, 0, 0, 0, 0, 0], max = Math.max(...values, 1);
  $("xpChart").innerHTML = values.map((v, i) => `<div class="chart-col"><i style="height:${Math.max(4, v / max * 100)}%"></i><b>${v}</b><small>${["M", "T", "W", "T", "F", "S", "S"][i]}</small></div>`).join("");
  const percent = Math.round(player.completed.length / (questData.length || 1) * 100);
  $("completionRate").textContent = `${percent}%`; document.querySelector(".stat-circle").style.setProperty("--rate", `${percent * 3.6}deg`);
  $("bestStreak").textContent = player.bestStreak; $("totalXp").textContent = player.totalXp.toLocaleString();
}

function renderSettings() { $("settingsName").value = player.name; $("settingsBio").value = player.bio; $("settingsTheme").value = player.theme; document.documentElement.dataset.theme = player.theme }

function render() { refreshHeader(); renderDashboard(); renderQuestBoard(); renderInventory(); renderLeaderboard(); renderProfile(); renderStats(); renderSettings() }

function route() {
  let v = location.hash.replace("#/", "") || "dashboard";
  const valid = ["dashboard", "quests", "inventory", "leaderboard", "profile", "stats", "settings"]; if (!valid.includes(v)) v = "dashboard";
  document.querySelectorAll(".view").forEach(s => s.classList.toggle("active", s.dataset.view === v));
  document.querySelectorAll("[data-route]").forEach(a => a.classList.toggle("active", a.dataset.route === v));
  $("mainNav").classList.remove("open"); window.scrollTo(0, 0);
}

function openModal(html) { $("modalContent").innerHTML = html; $("modal").classList.remove("hidden"); }
function closeModal() { $("modal").classList.add("hidden") }

$("loginForm").onsubmit = e => {
  e.preventDefault();
  const username = $("loginUsername").value.trim();
  const password = $("loginPassword").value;
  if (username.length < 2) { toast("Username must be at least 2 characters."); return }
  if (password.length < 4) { toast("Password must be at least 4 characters."); return }

  // Frontend-only demo authentication.
  // Password is intentionally not stored.
  const savedUser = localStorage.getItem("aionUsername");
  if (savedUser && savedUser.toLowerCase() !== username.toLowerCase()) {
    // Allow another local user to sign in, but keep the current AION progress
    // tied to the profile name chosen in Settings/login.
  }
  login(username);
};

$("logoutButton").onclick = logout;

$("questSearch").oninput = e => { search = e.target.value; renderQuestBoard() };
$("dailyRewardButton").onclick = () => {
  if (!claimDaily(player)) { toast("Daily Drop already claimed."); return }
  save(); render(); toast("Daily Drop claimed! +50 XP");
};
$("createQuestButton").onclick = () => {
  openModal(`<span class="rune-label">NEW QUEST</span><h3>CREATE A QUEST</h3>
    <form class="modal-form" id="createForm">
      <label>Quest title<input id="newTitle" required minlength="3" maxlength="40"></label>
      <label>Description<textarea id="newDescription" required minlength="5" maxlength="100" rows="3"></textarea></label>
      <label>XP Reward<input id="newXp" type="number" min="10" max="500" value="100" required></label>
      <button class="rpg-button" type="submit">ADD TO QUEST BOARD</button>
    </form>`);
  $("createForm").onsubmit = e => {
    e.preventDefault(); const title = $("newTitle").value.trim(), description = $("newDescription").value.trim(), xp = Number($("newXp").value); if (title.length < 3 || description.length < 5 || xp < 10 || xp > 500) return;
    questData.push({ id: Date.now(), title, description, type: "Custom", xp, difficulty: "Custom", icon: "✦" }); closeModal(); renderQuestBoard(); toast("Quest added to the board.")
  };
};
$("settingsForm").onsubmit = e => { e.preventDefault(); const name = $("settingsName").value.trim(); if (name.length < 2) { toast("Name must be at least 2 characters."); return } player.name = name; player.bio = $("settingsBio").value.trim(); player.theme = $("settingsTheme").value; save(); render(); toast("Settings saved.") };
$("resetButton").onclick = () => { if (confirm("Reset all AION progress saved in this browser?")) { player = resetPlayer(); save(); location.hash = "#/dashboard"; render(); toast("AION reset complete.") } };
document.querySelectorAll("[data-close]").forEach(x => x.onclick = closeModal);
$("menuToggle").onclick = () => $("mainNav").classList.toggle("open");
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal() });
window.addEventListener("hashchange", route);

render(); route();
if (loggedIn) {
  hideLogin();
} else {
  showLogin();
}
setTimeout(() => $("loadingScreen").classList.add("hide"), 500);
