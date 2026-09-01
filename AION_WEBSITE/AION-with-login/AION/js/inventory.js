import { badges, collectibles } from "./data.js";

export function unlockedBadges(player) {
  return badges.filter(b => b.test(player));
}
export function inventoryItems(player) {
  return collectibles.map(item => ({ ...item, unlocked: player.unlockedItems.includes(item.id) || player.level >= item.unlock }));
}
export function syncUnlocks(player) {
  player.unlockedItems = [...new Set([...player.unlockedItems, ...inventoryItems(player).filter(i => i.unlocked).map(i => i.id)])];
  return player;
}
