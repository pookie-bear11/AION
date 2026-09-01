import { questData } from "./data.js";

export function getQuest(id) { return questData.find(q => q.id === id) }
export function getTypes() { return ["All", ...new Set(questData.map(q => q.type))] }
export function filterQuests(filter, search) {
  const term = search.trim().toLowerCase();
  return questData.filter(q => (filter === "All" || q.type === filter) && (!term || `${q.title} ${q.description} ${q.type}`.toLowerCase().includes(term)));
}
