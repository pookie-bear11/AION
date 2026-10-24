export const questData = [
  { id: 1, title: "Study HTML", description: "Complete one focused HTML lesson.", type: "Study", xp: 80, difficulty: "Easy", duration: 25, icon: "▱" },
  { id: 2, title: "Build AION UI", description: "Finish one interface section for the semester project.", type: "Programming", xp: 180, difficulty: "Hard", duration: 60, icon: "⚔" },
  { id: 3, title: "Daily Review", description: "Review today's notes for 20 focused minutes.", type: "Review", xp: 50, difficulty: "Easy", duration: 20, icon: "✦" },
  { id: 4, title: "Cybersecurity Practice", description: "Complete one operating-systems or networking exercise.", type: "Study", xp: 120, difficulty: "Medium", duration: 40, icon: "⚡" },
  { id: 5, title: "Move Your Body", description: "Complete today's movement or exercise goal.", type: "Personal Goals", xp: 100, difficulty: "Medium", duration: 30, icon: "♜" },
  { id: 6, title: "Read & Reflect", description: "Read for 30 minutes and write three takeaways.", type: "Reading", xp: 70, difficulty: "Easy", duration: 30, icon: "◇" },
  { id: 7, title: "Deep Work", description: "Finish a 45-minute distraction-free work block.", type: "Productivity", xp: 150, difficulty: "Medium", duration: 45, icon: "◈" },
  { id: 8, title: "Ship Something", description: "Publish one small improvement to a project.", type: "Programming", xp: 250, difficulty: "Hard", duration: 60, icon: "♛" },
  { id: 9, title: "Summarize a Topic", description: "Write a short summary of one topic you studied.", type: "Review", xp: 90, difficulty: "Easy", duration: 25, icon: "✧" },
  { id: 10, title: "Tackle an Assignment", description: "Make meaningful progress on one assignment.", type: "Assignment", xp: 160, difficulty: "Medium", duration: 50, icon: "▤" },
  { id: 11, title: "Practice Five Problems", description: "Work through five practice or coding problems.", type: "Programming", xp: 180, difficulty: "Hard", duration: 60, icon: "⌘" },
  { id: 12, title: "Plan the Week", description: "Organize your priorities and upcoming deadlines.", type: "Productivity", xp: 70, difficulty: "Easy", duration: 20, icon: "◷" }
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
  { id: "crystal", name: "Violet Crystal", description: "A reward for consistent progress.", image: "crystal.svg", unlock: 3 },
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

export const questTemplates = [
  { title: "Focused Study Sprint", description: "Study one topic without distractions, then write down your key takeaway.", type: "Study", duration: 25, icon: "▱" },
  { title: "Read and Reflect", description: "Read a short section and note one idea worth remembering.", type: "Reading", duration: 25, icon: "◇" },
  { title: "Assignment Checkpoint", description: "Complete one clearly defined part of an assignment.", type: "Assignment", duration: 40, icon: "▤" },
  { title: "Coding Practice", description: "Solve one programming exercise and review your approach.", type: "Programming", duration: 35, icon: "⌘" },
  { title: "Review Your Notes", description: "Review a recent lesson and summarize the main points.", type: "Review", duration: 20, icon: "✧" },
  { title: "Plan the Next Step", description: "Choose your next priority and break it into a manageable action.", type: "Productivity", duration: 15, icon: "◷" },
  { title: "Personal Goal Session", description: "Spend focused time on a personal goal you have been postponing.", type: "Personal Goals", duration: 30, icon: "♜" }
];
