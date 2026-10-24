import { progressionFromTotalXp } from "./player.js";

const KEY = "aion-semester-player";
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const defaults = {
  name: "PLAYER",
  bio: "Complete quests and build your own progression story.",
  xp: 0,
  totalXp: 0,
  level: 1,
  progressionVersion: 2,
  streak: 0,
  bestStreak: 0,
  completed: [],
  rewardedQuestIds: [],
  completionDates: {},
  customQuests: [],
  rewardHistory: [],
  unlockedItems: [],
  dailyClaimed: false,
  dailyClaimDate: "",
  lastQuestDate: "",
  theme: "gold",
  xpHistory: [0, 0, 0, 0, 0, 0, 0]
};

export function getPlayer() {
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch { /* storage blocked: fall back to defaults */ }
  if (!saved) return structuredClone(defaults);
  try {
    const parsed = JSON.parse(saved);
    const progressionMigrationRequired = parsed.progressionVersion !== 2;
    const player = {
      ...structuredClone(defaults),
      ...parsed,
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      rewardedQuestIds: Array.isArray(parsed.rewardedQuestIds)
        ? [...new Set(parsed.rewardedQuestIds.map(String))]
        : [...new Set((Array.isArray(parsed.completed) ? parsed.completed : []).map(String))],
      completionDates: parsed.completionDates && typeof parsed.completionDates === "object" && !Array.isArray(parsed.completionDates)
        ? parsed.completionDates
        : Object.fromEntries((Array.isArray(parsed.rewardHistory) ? parsed.rewardHistory : [])
          .filter(item => typeof item.id === "string" && item.id.startsWith("quest-") && item.date)
          .map(item => {
            const date = new Date(item.date);
            return [`${item.id.slice(6)}`, Number.isNaN(date.getTime()) ? "" : dateKey(date)];
          })
          .filter(([, date]) => date)),
      customQuests: Array.isArray(parsed.customQuests) ? parsed.customQuests : [],
      rewardHistory: Array.isArray(parsed.rewardHistory) ? parsed.rewardHistory : [],
      unlockedItems: Array.isArray(parsed.unlockedItems) ? parsed.unlockedItems : [],
      xpHistory: Array.isArray(parsed.xpHistory) ? parsed.xpHistory.slice(-7) : [...defaults.xpHistory]
    };
    if (progressionMigrationRequired) {
      const legacyLevel = Math.max(1, Math.floor(Number(parsed.level) || 1));
      const legacyXp = Math.max(0, Math.floor(Number(parsed.xp) || 0));
      const savedTotalXp = Number.isSafeInteger(parsed.totalXp) ? Math.max(0, parsed.totalXp) : 0;
      player.totalXp = Math.max(savedTotalXp, (legacyLevel - 1) * 1000 + legacyXp);
      Object.assign(player, progressionFromTotalXp(player.totalXp), { progressionVersion: 2 });
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (player.lastQuestDate && player.lastQuestDate !== dateKey(new Date()) && player.lastQuestDate !== dateKey(yesterday)) player.streak = 0;
    // Light-theme redesign: map the old dark theme names onto the new accent options.
    if (player.theme === "purple") player.theme = "gold";
    else if (player.theme === "violet") player.theme = "sky";
    else if (!["gold", "sky"].includes(player.theme)) player.theme = "gold";
    if (player.dailyClaimed && !player.dailyClaimDate) player.dailyClaimDate = dateKey(new Date());
    if (progressionMigrationRequired) savePlayer(player);
    return player;
  } catch { return structuredClone(defaults) }
}
// Returns true when the save succeeded, false if the browser blocked storage (e.g. private mode / quota).
export function savePlayer(player) {
  try { localStorage.setItem(KEY, JSON.stringify(player)); return true; } catch { return false; }
}
export function resetPlayer() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  return structuredClone(defaults);
}
