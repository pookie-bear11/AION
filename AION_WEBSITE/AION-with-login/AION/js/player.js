export function awardXp(player, amount) {
  player.totalXp += amount;
  player.xp += amount;
  while (player.xp >= 1000) {
    player.xp -= 1000;
    player.level += 1;
  }
  return player;
}

export function completeQuest(player, quest) {
  if (player.completed.includes(quest.id)) return { player, leveled: false };
  const before = player.level;
  player.completed.push(quest.id);
  awardXp(player, quest.xp);
  player.streak += 1;
  player.bestStreak = Math.max(player.bestStreak, player.streak);
  player.xpHistory = [...player.xpHistory.slice(-6), quest.xp];
  return { player, leveled: player.level > before };
}

export function claimDaily(player) {
  if (player.dailyClaimed) return false;
  player.dailyClaimed = true;
  awardXp(player, 50);
  return true;
}
