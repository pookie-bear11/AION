export const XP_PER_LEVEL = 100;
export const DAILY_DROP_XP = 50;

export function xpRequiredForLevel(level) {
  const currentLevel = Math.max(1, Math.floor(Number(level) || 1));
  return Math.round(100 * currentLevel ** 1.5);
}

export function progressionFromTotalXp(totalXp) {
  let remaining = Math.max(0, Math.floor(Number(totalXp) || 0));
  let level = 1;
  while (remaining >= xpRequiredForLevel(level)) {
    remaining -= xpRequiredForLevel(level);
    level += 1;
  }
  return { level, xp: remaining };
}

export function totalXpForProgression(level, xp) {
  if (!Number.isSafeInteger(level) || level < 1) throw new RangeError("Level must be a positive safe integer.");
  if (!Number.isSafeInteger(xp) || xp < 0 || xp >= xpRequiredForLevel(level)) {
    throw new RangeError("XP must be within the current level's progression range.");
  }
  let totalXp = xp;
  for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
    totalXp += xpRequiredForLevel(currentLevel);
    if (!Number.isSafeInteger(totalXp)) throw new RangeError("Total XP would exceed the safe integer range.");
  }
  return totalXp;
}

export const LEVEL_THEMES = [
  { name: "Cyan", key: "cyan", accent: "#55D8F5", hi: "#A6EEFF", lo: "#1FA6C9", ink: "#8FE6FA", soft: "rgba(85, 216, 245, .1)", glow: "rgba(85, 216, 245, .34)", onAccent: "#04141A", focus: "#B8F2FF" },
  { name: "Teal", key: "teal", accent: "#39D6C1", hi: "#A3F4E7", lo: "#168E82", ink: "#83EAD9", soft: "rgba(57, 214, 193, .12)", glow: "rgba(57, 214, 193, .36)", onAccent: "#041714", focus: "#B9FFF2" },
  { name: "Blue", key: "blue", accent: "#579CFF", hi: "#B3D2FF", lo: "#2864C7", ink: "#91BCFF", soft: "rgba(87, 156, 255, .13)", glow: "rgba(87, 156, 255, .38)", onAccent: "#071326", focus: "#C5DEFF" },
  { name: "Indigo", key: "indigo", accent: "#797CFF", hi: "#C0C1FF", lo: "#4947C9", ink: "#A8A9FF", soft: "rgba(121, 124, 255, .14)", glow: "rgba(121, 124, 255, .4)", onAccent: "#0D0D28", focus: "#D8D8FF" },
  { name: "Violet", key: "violet", accent: "#A575FF", hi: "#D4BCFF", lo: "#7046C5", ink: "#C0A0FF", soft: "rgba(165, 117, 255, .14)", glow: "rgba(165, 117, 255, .4)", onAccent: "#180D2B", focus: "#E3D4FF" },
  { name: "Magenta", key: "magenta", accent: "#DF5CC1", hi: "#F5B4E6", lo: "#A9368D", ink: "#F08AD7", soft: "rgba(223, 92, 193, .14)", glow: "rgba(223, 92, 193, .4)", onAccent: "#260D20", focus: "#FFD4F4" },
  { name: "Pink", key: "pink", accent: "#F064A5", hi: "#FFC0DA", lo: "#BA3D78", ink: "#FF9BC6", soft: "rgba(240, 100, 165, .14)", glow: "rgba(240, 100, 165, .4)", onAccent: "#2A0B19", focus: "#FFD6E8" },
  { name: "Orange", key: "orange", accent: "#F59C4E", hi: "#FFD0A0", lo: "#B96522", ink: "#FFB878", soft: "rgba(245, 156, 78, .14)", glow: "rgba(245, 156, 78, .4)", onAccent: "#291606", focus: "#FFE2C4" },
  { name: "Red", key: "red", accent: "#F06468", hi: "#FFB5B5", lo: "#B93642", ink: "#FF969A", soft: "rgba(240, 100, 104, .14)", glow: "rgba(240, 100, 104, .4)", onAccent: "#29090B", focus: "#FFD1D2" }
];

export function levelTheme(level) {
  return LEVEL_THEMES[Math.min(LEVEL_THEMES.length - 1, Math.max(0, Math.floor(Number(level) || 1) - 1))];
}

// Local calendar date (YYYY-MM-DD). Used everywhere so streaks, daily drops and due dates agree.
export function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const today = todayKey;

function yesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function awardXp(player, amount) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError("XP reward must be a non-negative safe integer.");
  if (!Number.isSafeInteger(player.totalXp + amount)) throw new RangeError("Total XP would exceed the safe integer range.");
  player.totalXp += amount;
  player.xp += amount;
  while (player.xp >= xpRequiredForLevel(player.level)) {
    player.xp -= xpRequiredForLevel(player.level);
    player.level += 1;
  }
  return player;
}

export function completeQuest(player, quest) {
  if (player.completed.some(id => String(id) === String(quest.id))) return { player, leveled: false, xpAwarded: 0 };
  const before = player.level;
  player.completed.push(quest.id);
  player.rewardedQuestIds ||= [];
  const alreadyRewarded = player.rewardedQuestIds.some(id => String(id) === String(quest.id));
  if (!alreadyRewarded) {
    player.rewardedQuestIds.push(String(quest.id));
    awardXp(player, quest.xp);
    player.xpHistory = [...player.xpHistory.slice(-6), quest.xp];
    player.rewardHistory = [...(player.rewardHistory || []), {
      id: `quest-${quest.id}`,
      name: quest.title,
      xp: quest.xp,
      date: new Date().toISOString()
    }];
  }
  const completedOn = today();
  player.completionDates ||= {};
  player.completionDates[String(quest.id)] = completedOn;
  if (player.lastQuestDate !== completedOn) {
    player.streak = player.lastQuestDate === yesterday() ? player.streak + 1 : 1;
    player.lastQuestDate = completedOn;
  }
  player.bestStreak = Math.max(player.bestStreak, player.streak);
  return { player, leveled: player.level > before, xpAwarded: alreadyRewarded ? 0 : quest.xp };
}

export function claimDaily(player) {
  if (player.dailyClaimDate === today() || (player.dailyClaimed && !player.dailyClaimDate)) return false;
  player.dailyClaimed = true;
  player.dailyClaimDate = today();
  awardXp(player, DAILY_DROP_XP);
  player.rewardHistory = [...(player.rewardHistory || []), {
    id: `daily-${today()}`,
    name: "Daily Drop",
    xp: DAILY_DROP_XP,
    date: new Date().toISOString()
  }];
  return true;
}
