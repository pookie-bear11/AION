import { leaderboardBase } from "./data.js";

export function getLeaderboard(player) {
  return [...leaderboardBase, { name: player.name, xp: player.totalXp, level: player.level, icon: "✦", isPlayer: true }]
    .sort((a, b) => b.xp - a.xp);
}
