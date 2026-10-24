# UI redesign — "The Chronicle Engine"

UI only. No routes, storage, data model or quest/XP logic changed.

- **Tokens** (`css/style.css`): obsidian surfaces, ultraviolet structure, ion-cyan accent, brass/platinum for rank and rarity, magenta only for danger and hard quests. Type: Syne (display) + Instrument Sans (body), loaded from Google Fonts with system fallbacks. Settings → Accent colour is now Ion cyan (default, value `gold`) / Ultraviolet (value `sky`); saved values still work.
- **Shell**: left orbit rail with icons, player chip and XP sliver; becomes a top bar + drawer under 1000px.
- **Dashboard**: command-deck hero (large name, segmented XP bar, astrolabe level ring, telemetry row), ruled quest queue, activity timeline.
- **Quests** = Mission control: difficulty rails and pips, large XP reward, distinct completed / expired states.
- **Inventory** = Artifact vault. Rarity is derived from existing thresholds in `data.js` (`BADGE_RARITY` / `itemRarity` in `js/app.js`); change the mapping there.
- **Ranking**: tiered top three with insignia, relative XP bars, "XP to pass" line.
- **Profile** = dossier. **Stats** = analytics (axis, average line, empty state; all values from existing data). **Settings** = grouped configuration rows.
- JS touched only for presentation: card templates, header orb/XP sliver, chart markup, rank text.
- Motion: one view fade, bar/ring fills, hover sheen on rare+ artifacts, a very slow background rotation. All off under `prefers-reduced-motion`.
