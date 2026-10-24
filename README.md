# AION

AION is a fantasy-inspired, frontend-only productivity RPG built with HTML, CSS, and vanilla JavaScript. It turns user-recorded study, habit, and personal goals into quests, XP, levels, and cosmetic collectibles.

## Features

- Twilight-themed public landing page (aubergine, amethyst and brass, drawn from the artwork) with a sticky responsive navbar (Home, About, Features, How It Works, Quests, Rewards, FAQ, Sign In), scroll-spy highlighting, hero artwork, quest and reward previews built from the real game data, FAQ, and the local demo sign-in.
- Responsive local dashboard with a level ring and XP summary, quest statistics, active quests, Daily Drop status, next reward, recent activity, profile, stats, inventory, and an illustrative demo leaderboard.
- Predefined quests, category/search/difficulty/status/deadline filters, and sorting.
- Separate active and completed quest sections, with completed counts and reopening.
- Custom quest creation, editing, deletion, priorities, objective checklists, deadlines, progress, and local persistence.
- Rule-based quest generator with a review step; it does not use AI.
- One-time quest completion XP (including after reopening), level progress and level-up notices, daily reward, completion streak, and reward history.
- Progressive level requirements (`round(100 × level^1.5)`) with overflow-safe multi-level rewards and an automatic cyan-to-red dashboard accent progression.
- A Dashboard level preview for testing theme progression and simulated level-ups without changing saved player data. The optional Apply to Dashboard action explicitly confirms before replacing saved progression.
- Centered reward dialogs showing the XP actually earned, level progress and any badge/collectible unlocked; keyboard focus trap, visible focus styles, reduced-motion support, and mobile navigation.
- Browser-local settings and progress storage.

## Important limitations

- There is no backend, database, real registration, or secure authentication. The entry form is only a local demo gate and does not ask for a password.
- Browser storage is not private, server-validated, backed up, or synchronized between devices. Do not use real credentials or sensitive information.
- The leaderboard entries are illustrative demo rivals, not real users.
- AION cannot verify real-world quest completion. XP and collectibles are fictional motivation features, not prizes or official AION game items.

## Run locally

Serve the folder over HTTP so JavaScript modules work:

```powershell
python -m http.server 5501
```

Then open <http://localhost:5501/>. Alternatively, open the folder in VS Code and use the Live Server extension (the workspace port is configured as `5501`).

There is no build step or build command; the site is deployed as static files. No dependencies need to be installed.

## Data

Player progress, quests, objectives, completion dates, reward history, and preferences use `localStorage`; the optional remembered demo gate uses `localStorage`, and an unremembered gate uses `sessionStorage`. Reset progress from Settings or clear the site's browser storage to start over. Existing lifetime XP is preserved; old fixed-curve saves are migrated to the new level and in-level XP for that lifetime total. Completed quests from older saves are migrated as already-rewarded so reopening them cannot grant duplicate XP. Demo levels and simulated XP remain in memory until explicitly applied; applying requires confirmation and replaces saved level, current XP, and lifetime XP without changing quests or other player data.

## Project structure

```text
AION/
├── index.html
├── css/
│   ├── style.css        (design tokens + shared components)
│   ├── landing.css      (public landing page)
│   ├── dashboard.css
│   ├── quests.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── icons.js         (inline SVG icon set; quest icons are chosen by category)
│   ├── data.js
│   ├── player.js
│   ├── quests.js
│   ├── inventory.js
│   ├── leaderboard.js
│   └── storage.js
├── tests/
│   └── e2e_smoke.py     (optional Playwright browser test)
└── assets/
    ├── icons/
    └── images/            (hero-bg/portal/sigil .webp are optimized copies of image1/image6/image4)
```

## Design system

The existing dark design tokens live in `css/style.css`; the background, surfaces, typography, and layout remain fixed while dashboard accent tokens follow the player level from cyan through teal, blue, indigo, violet, magenta, pink, orange, and red. The saved accent preference remains available for the public landing page. The recurring motif is the "aeon ring": the logo, the hero portal and the dashboard level ring (its arc is real XP progress). Focus rings are visible, and all non-essential motion is disabled under `prefers-reduced-motion`.

## Testing

No build or lint step exists. To run the optional browser test: serve the site on port 5501, then `pip install playwright && playwright install chromium && python tests/e2e_smoke.py`.

## Deployment

The site is static and uses relative paths, so it can be published as-is on GitHub Pages (the canonical URL in `index.html` points to `https://pookie-bear11.github.io/AION/`), Netlify, or any static host: just upload the folder contents. Update the `canonical` and `og:image` URLs in `index.html` if the address changes.

## Team Members

- Ethan Gabriel M. Dela Peña
- Gabriel G. Cañezares
- John Ford Cortez
- Brian Loreto Hubahib
