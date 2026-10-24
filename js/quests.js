import { questData } from "./data.js";

export function getQuest(id) { return questData.find(q => q.id === id) }
export function getTypes(quests = questData) { return ["All", ...new Set(quests.map(q => q.type))] }
export function filterQuests(filter, search, quests = questData) {
  const term = search.trim().toLowerCase();
  return quests.filter(q => (filter === "All" || q.type === filter) && (!term || `${q.title} ${q.description} ${q.type} ${q.priority || "Normal"} ${(q.objectives || []).map(objective => objective.text).join(" ")}`.toLowerCase().includes(term)));
}
