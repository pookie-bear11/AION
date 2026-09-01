const KEY = "aion-semester-player";

const defaults = {
  name: "PLAYER",
  bio: "Complete quests and build your own progression story.",
  xp: 720,
  totalXp: 720,
  level: 1,
  streak: 2,
  bestStreak: 2,
  completed: [],
  unlockedItems: ["coin"],
  dailyClaimed: false,
  theme: "purple",
  xpHistory: [60, 120, 80, 150, 100, 210, 0]
};

export function getPlayer() {
  const saved = localStorage.getItem(KEY);
  if (!saved) return structuredClone(defaults);
  try { return { ...structuredClone(defaults), ...JSON.parse(saved) } } catch { return structuredClone(defaults) }
}
export function savePlayer(player) { localStorage.setItem(KEY, JSON.stringify(player)) }
export function resetPlayer() { localStorage.removeItem(KEY); return structuredClone(defaults) }
