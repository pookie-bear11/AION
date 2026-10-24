// Inline SVG icon set (replaces emoji / font glyphs so icons render identically everywhere).
const paths = {
  study: '<path d="M22 9 12 4 2 9l10 5 10-5Z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 9v6"/>',
  reading: '<path d="M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2z"/><path d="M22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7z"/>',
  programming: '<path d="m8 7-5 5 5 5"/><path d="m16 7 5 5-5 5"/><path d="m14 4-4 16"/>',
  review: '<path d="M20 11a8 8 0 0 0-14.3-4.5L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.5L20 15"/><path d="M20 20v-5h-5"/>',
  productivity: '<path d="M6 3h12M6 21h12"/><path d="M7 3c0 5 3 6 5 9-2 3-5 4-5 9"/><path d="M17 3c0 5-3 6-5 9 2 3 5 4 5 9"/>',
  assignment: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="m9 14 2 2 4-4"/>',
  goals: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  sparkle: '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  seal: '<path d="M12 2l2.4 2.1 3.2-.2 1.1 3 2.7 1.7-.9 3.1.9 3.1-2.7 1.7-1.1 3-3.2-.2L12 22l-2.4-2.1-3.2.2-1.1-3-2.7-1.7.9-3.1-.9-3.1 2.7-1.7 1.1-3 3.2.2z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  medal: '<circle cx="12" cy="15" r="6"/><path d="m8.5 9.5-3-6.5h5l1.5 3M15.5 9.5l3-6.5h-5L12 6"/>',
  gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l-2 6 5 12 5-12-2-6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  quill: '<path d="M20 4c-8 0-13 4-14 12l-2 4 4-2c8-1 12-6 12-14Z"/><path d="M9 15 17 7"/>'
};

const typeToIcon = {
  Study: "study", Reading: "reading", Programming: "programming", Review: "review",
  Productivity: "productivity", Assignment: "assignment", "Personal Goals": "goals"
};

export function icon(name, size = 20) {
  return `<svg class="ico" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.sparkle}</svg>`;
}

// Quest icons are chosen by category, so custom and generated quests get a matching icon too.
export const questIcon = (type, size = 20) => icon(typeToIcon[type] || "sparkle", size);
