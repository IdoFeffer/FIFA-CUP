# FIFA CUP

A web app for running a one-night FIFA tournament with friends.
Enter the players, pick a format, type in the scores — the app builds the tables, moves players to the next stage and crowns a champion.

Available in **Hebrew (RTL)** and **English (LTR)**, with a language switch at the top of every screen. Built mobile-first, and works on a tablet or a screen lying on the table.

---

## Running it

Plain HTML, CSS and JavaScript (no framework, no build step).
The code uses ES Modules, so it needs a simple static server — double-clicking `index.html` won't load the JS.

From the project folder:

```bash
npx serve .
```

or:

```bash
python3 -m http.server 8000
```

Then open the address it prints (e.g. `http://localhost:8000`).

**Play from your phone:** if your computer and phone are on the same network, open your computer's IP address with the port on the phone (e.g. `http://192.168.1.20:8000`).

---

## How to use it

1. **Setup** – enter the player names (minimum 4, no maximum), pick a format, choose how **knockout ties** are decided (penalties or golden goal), and tap **Draw**.
2. **First stage** – league, group stage or Swiss system. Enter a score in the two boxes of each match and the tables update instantly.
3. **Knockout** – the bracket builds itself. When a stage has an odd number of players, a **draw** screen picks who goes straight through. A tied knockout match opens a tie-break panel on the card: the penalty score, or "who scored the golden goal?".
4. **Champion** – trophy, final score, the champion's stats, the biggest win and the craziest match of the night.

**Tips:**
- Wrong score? Tap the number and fix it (allowed until the stage closes).
- `Enter` in the first box jumps to the second; in the second it saves.
- The tournament is saved in the browser — refreshing the page loses nothing.
- The circular-arrow button at the top starts a new tournament (tap twice to confirm). Player names are kept.
- **עב / EN** at the top switches language at any time, even mid-tournament.

---

## Formats

| Format | Available when | How it works |
|---|---|---|
| **League** | always | Everyone plays everyone. 1st place wins. A decider only if it's close (see below) |
| **Group stage** | 6+ players | Groups of about 4. Qualifiers go on to the semi-finals or quarter-finals |
| **Knockout** | always | Lose and you're out. In a stage with an odd number of players, a draw sends one player straight through |
| **Swiss system** | 6+ players | Several rounds against players on similar points, no rematches. Top 4 reach the semi-finals |

**Recommendation:** up to 5 players – league. 6 or more – group stage.

---

## Rules

- **Points:** win 3, draw 1, loss 0.
- **Tie-breakers:** points → goal difference → goals scored → head-to-head → random draw.
- **Odd number in a league / groups:** one player rests each matchday, and everyone rests exactly once.
- **Odd number in Swiss:** the lowest-ranked player who hasn't rested yet rests, and gets 3 points.
- **League decider:** only if 1st and 2nd finish level on points with a goal difference within one goal of each other. Otherwise 1st place is champion.
- **Knockout ties:** chosen at the start of the tournament; applies to every knockout match and to the league decider:
  - **Penalties** – the score stays (e.g. 2:2) and you also enter the penalties. Penalties don't count as goals or in the stats, and they need a winner too.
  - **Golden goal** – pick who scored first in extra time. The goal is added to the score (2:2 becomes 3:2) and counts in the stats.
- **Ties in the group stage, league and Swiss** stay regular draws.
- **Knockout draw:** a player who already went through by draw sits out the next draw (unless everyone already has).
- **Biggest win:** the largest goal margin in the tournament.
- **Craziest match:** the most goals in a single match.

---

## Project structure

```
FIFA CUP/
├── index.html              ← the only HTML file
├── README.md
├── .gitignore
├── css/
│   ├── variables.css       ← all design tokens: colors, spacing, fonts, sizes, radii, shadows
│   ├── base.css            ← reset, base typography, focus, direction (RTL/LTR)
│   ├── components.css      ← buttons, cards, match row, score box, table, badges, language switch
│   └── screens.css         ← per-screen layout + tablet
├── js/
│   ├── app.js              ← entry point: screen routing, events, draw animation
│   ├── i18n.js             ← every UI string in Hebrew and English, in one place
│   ├── state.js            ← app state and localStorage persistence
│   ├── engine.js           ← create tournament, enter scores, advance stages, champion
│   ├── formats.js          ← formats by player count, match counts, recommendation
│   ├── schedule.js         ← fixtures: league & groups (circle method), Swiss, knockout
│   ├── standings.js        ← tables and tie-breakers
│   ├── draw.js             ← shuffling, group split, "goes straight through" draw
│   ├── stats.js            ← champion screen stats
│   └── ui/
│       ├── setup.js        ← setup screen
│       ├── stage.js        ← league / groups / Swiss screen
│       ├── bracket.js      ← knockout bracket
│       ├── drawScreen.js   ← draw screen
│       ├── champion.js     ← champion screen
│       ├── components.js   ← shared components (match row, card, table, language switch)
│       └── icons.js        ← SVG icons
└── assets/
    └── icons/              ← the same icons as SVG files
```

---

## Languages

- All UI text lives in `js/i18n.js`, with one key per string in both `he` and `en`. UI files contain no hard-coded text — they call `t('key')`.
- Switching language sets `lang` and `dir` on `<html>`, so the whole layout mirrors (RTL ↔ LTR). The CSS uses logical properties (`start`/`end`), never `left`/`right`.
- Stage names ("Semi-final", "Matchday 2"…) are computed at render time, so switching mid-tournament changes everything.
- Player names inside sentences are wrapped in `<bdi>`, so a Hebrew name in an English sentence (or vice versa) never scrambles the text order.
- To add a string: add the same key to both languages. `missingKeys()` in `i18n.js` lists any key missing from one of them.

---

## Design

- **Dark background**, stadium-scoreboard style.
- **Fonts:** Heebo for all text, Orbitron only for digits, scores and the logo.
- **Player colors:** home side blue, away side orange.
- **Status colors:**
  - Green – finished / won / qualifies
  - Gold – next match / points / trophy
  - Purple – decided by draw
  - Gray – draw (tie)
- **No px:** all sizes in `rem` / `em`, and every value comes from `css/variables.css`. Change a color or spacing there and it changes everywhere.

---

## Accessibility

- `lang` and `dir` always match the active language.
- Every clickable thing is a real button, at least 2.75rem tall.
- Clear keyboard focus ring.
- `prefers-reduced-motion` support – no animation, and the draw shows the winner immediately.
