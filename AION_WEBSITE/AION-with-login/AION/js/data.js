export const questData = [
  { id: 1, title: "Study HTML", description: "Complete one focused HTML lesson.", type: "Daily", xp: 80, difficulty: "Easy", icon: "▱" },
  { id: 2, title: "Build AION UI", description: "Finish one interface section for the semester project.", type: "Epic", xp: 180, difficulty: "Hard", icon: "⚔" },
  { id: 3, title: "Daily Review", description: "Review today's notes for 20 focused minutes.", type: "Daily", xp: 50, difficulty: "Easy", icon: "✦" },
  { id: 4, title: "Cybersecurity Practice", description: "Complete one operating-systems or networking exercise.", type: "Skill", xp: 120, difficulty: "Medium", icon: "⚡" },
  { id: 5, title: "Workout", description: "Complete today's movement or exercise goal.", type: "Habit", xp: 100, difficulty: "Medium", icon: "♜" },
  { id: 6, title: "Read & Reflect", description: "Read for 30 minutes and write three takeaways.", type: "Habit", xp: 70, difficulty: "Easy", icon: "◇" },
  { id: 7, title: "Deep Work", description: "Finish a 45-minute distraction-free work block.", type: "Focus", xp: 150, difficulty: "Medium", icon: "◈" },
  { id: 8, title: "Ship Something", description: "Publish one small improvement to a project.", type: "Epic", xp: 250, difficulty: "Hard", icon: "♛" }
];

export const badges = [
  { id: "first", name: "First Blood", description: "Complete your first quest.", image: "image36.png", test: p => p.completed.length >= 1 },
  { id: "streak3", name: "On A Roll", description: "Reach a 3-day streak.", image: "image37.png", test: p => p.streak >= 3 },
  { id: "level5", name: "Rising Hero", description: "Reach level 5.", image: "image38.png", test: p => p.level >= 5 },
  { id: "quest10", name: "Quest Hunter", description: "Complete 10 quests.", image: "image36.png", test: p => p.completed.length >= 10 },
  { id: "xp1000", name: "XP Hoarder", description: "Earn 1,000 total XP.", image: "image37.png", test: p => p.totalXp >= 1000 },
  { id: "level10", name: "Veteran", description: "Reach level 10.", image: "image38.png", test: p => p.level >= 10 }
];

export const collectibles = [
  { id: "coin", name: "AION Coin", description: "A token from the AION realm.", image: "image37.png", unlock: 1 },
  { id: "crystal", name: "Violet Crystal", description: "A reward for consistent progress.", image: "image6.png", unlock: 3 },
  { id: "crown", name: "Golden Crown", description: "Awarded at level 5.", image: "image36.png", unlock: 5 },
  { id: "blade", name: "Neon Blade", description: "A legendary collectible.", image: "image38.png", unlock: 10 }
];

export const leaderboardBase = [
  { name: "Nyx", xp: 2840, level: 28, icon: "♛" },
  { name: "Astra", xp: 2310, level: 23, icon: "✦" },
  { name: "Riven", xp: 1940, level: 19, icon: "⚔" },
  { name: "Kairo", xp: 1710, level: 17, icon: "◇" },
  { name: "Mira", xp: 1430, level: 14, icon: "🏆" },
  { name: "Zane", xp: 1180, level: 11, icon: "⚡" }
];
