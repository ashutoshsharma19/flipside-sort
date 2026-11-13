# Flipside Sort

A mobile-first ball-sort puzzle with two twists:

- **Gravity flip**: every *N* moves, every tube turns upside down and the balls fall to the other end. The ball you can reach becomes the one that was at the bottom.
- **Locked tubes**: some levels start with a padlocked tube. Fill any other tube with a single colour to unlock it.

It has 60 handcrafted-by-solver levels, star ratings against par, undo and hints, colour-blind symbols, sound and haptics, and saved progress. The whole game builds to **one self-contained HTML file (~32 KB)**. It runs offline, has no runtime dependencies, and can be hosted anywhere static.

---

## Table of contents

1. [How the game plays](#1-how-the-game-plays)
2. [Project structure](#2-project-structure)
3. [Setup from scratch](#3-setup-from-scratch)
4. [How to run the game](#4-how-to-run-the-game)
5. [How to test the project](#5-how-to-test-the-project)
6. [Generating and tuning levels](#6-generating-and-tuning-levels)
7. [Hosting and sharing](#7-hosting-and-sharing)
8. [How it works (architecture)](#8-how-it-works-architecture)
9. [Release checklist](#9-release-checklist)
10. [Troubleshooting](#10-troubleshooting)
11. [Roadmap](#11-roadmap)

---

## 1. How the game plays

| Rule | Detail |
|---|---|
| Goal | Every tube holds 4 balls of one colour, or is empty |
| Move | Tap a tube to lift its top ball, then tap another tube to drop it |
| Legal drop | The target is empty, **or** its top ball is the same colour and it has space |
| Flip | The pill at the top-right shows *Flip in N*. When it reaches 0, every tube is reversed |
| Lock | A padlocked tube can't be used until any other tube is completed |
| Stars | ★★★ at or under par, ★★ within 35% of par, ★ otherwise |
| Help | 5 undos and 3 hints per level. Hints come from a live solver |

**Level progression**

| Levels | Colours | Twist |
|---|---|---|
| 1–2 | 3 | None (tutorial) |
| 3–5 | 4 | None |
| 6–10 | 5 | Flip every 6 moves |
| 11–15 | 5 | Flip every 5 + locked tube |
| 16–25 | 6 | Flip every 5, lock on even levels |
| 26–40 | 7 | Flip every 4–5, lock on odd levels |
| 41–60 | 8 | Flip every 4, lock on even levels |

---

## 2. Project structure

```
flipsort/
├── index.src.html   # UI: layout, styles, rendering, input, animation, audio, save data
├── logic.js         # Pure game rules + solver (no DOM), shared by game, generator and tests
├── gen.js           # Level generator: seeded shuffles, keeps only solver-proven levels
├── levels.json      # Generated levels (with par + a known solution for each)
├── build.js         # Inlines logic.js + levels.json into dist/index.html
├── dist/
│   └── index.html   # THE GAME: single self-contained file, this is what you host
├── logic.test.js    # Unit tests (Node's built-in test runner)
├── smoke.e2e.js     # End-to-end test: Playwright plays levels through the real UI
├── package.json     # npm scripts
└── README.md
```

**Rule of thumb:** edit `index.src.html` / `logic.js` / `gen.js`, then rebuild. **Never edit `dist/index.html` by hand**, because the next build overwrites it.

---

## 3. Setup from scratch

### 3.1 Prerequisites

| Tool | Version | Check | Get it |
|---|---|---|---|
| Node.js | 18+ (tested on 24) | `node -v` | https://nodejs.org (LTS) |
| npm | comes with Node | `npm -v` | — |
| Git | any recent | `git --version` | https://git-scm.com |
| Browser | Chrome or Edge | — | Edge is pre-installed on Windows |

No game engine, bundler or framework is needed.

### 3.2 Get the code

**Option A: from the zip**

1. Unzip `flipside-sort-source.zip`, for example to `C:\Ashutosh\Game_Development\flipside-sort-source\`.
2. Open a terminal in the `flipsort` folder:

```powershell
cd C:\Ashutosh\Game_Development\flipside-sort-source\flipsort
```

**Option B: from GitHub** (once pushed)

```powershell
git clone https://github.com/ashutoshsharma19/flipside-sort.git
cd flipside-sort
```

### 3.3 Install dependencies

The game itself has **zero** dependencies. Only the end-to-end test needs Playwright:

```powershell
npm install                       # installs Playwright (dev only)
npx playwright install chromium   # downloads Playwright's test browser (first time only)
```

If the second command is blocked (antivirus or corporate policy), skip it and use Edge for the e2e test. See [Troubleshooting](#10-troubleshooting).

### 3.4 Build

```powershell
npm run build
```

Output: `dist/index.html`. That single file is the whole game.

### 3.5 npm scripts reference

| Command | What it does |
|---|---|
| `npm run gen` | Regenerates `levels.json` (all levels re-verified by the solver) |
| `npm run build` | Builds `dist/index.html` from source + levels |
| `npm test` | Runs the 7 unit tests (about 1 second) |
| `npm run e2e` | Builds, then plays levels 1, 6 and 11 in a real browser |
| `npm run test:all` | Unit tests + e2e. Run this before every release |

---

## 4. How to run the game

### 4.1 On your computer (quickest)

```powershell
npm run build
start dist\index.html        # Windows
# open dist/index.html       # macOS
# xdg-open dist/index.html   # Linux
```

Or just double-click `dist/index.html`.

**Simulate a phone:** in Chrome or Edge press `F12`, then `Ctrl+Shift+M`, and pick a small device (for example 360×740).

### 4.2 On your Android phone over Wi-Fi

This is the best pre-release check, because it runs on real hardware and real touch.

```powershell
npx serve dist -l 3000     # serves the game on port 3000
ipconfig                   # find your IPv4 address, e.g. 192.168.1.5
```

On the phone (same Wi-Fi), open `http://192.168.1.5:3000`.

- If Windows Firewall asks, allow **Private networks**.
- In Chrome, go to **⋮**, then **Add to Home screen**, to launch it full-screen like an app.

### 4.3 Development loop

1. Edit `index.src.html` (UI) or `logic.js` (rules).
2. `npm run build`
3. Refresh the browser tab.
4. `npm test` after any change to `logic.js`.

---

## 5. How to test the project

The test strategy has three layers: **logic → UI automation → manual on device**.

### 5.1 Unit tests: game logic (`logic.test.js`)

```powershell
npm test
```

They use Node's built-in test runner, so there's nothing to install. They cover:

| Test | What it proves |
|---|---|
| Solved detection | Win condition is correct, and split colours don't count |
| Move rules | Same colour / empty target only, capacity respected, no self-moves |
| Flip | Tubes reverse after exactly N moves, and the counter resets |
| Lock | A locked tube rejects moves and unlocks when any tube completes |
| Immutability | `applyMove` never mutates the previous state (undo depends on this) |
| All levels solvable | Every shipped level replays its stored solution to a win |
| Hint budget | The in-game hint solver solves every level start within its node limit |

Expected output ends with `# pass 7` and `# fail 0`.

### 5.2 End-to-end smoke test: real UI (`smoke.e2e.js`)

```powershell
npm run e2e
```

Playwright opens the built game in a 360×740 touch viewport and **plays levels 1, 6 and 11 through the UI**, tapping tubes with each level's stored solution. Level 6 covers the first flip and level 11 the first lock. The test fails on any console error.

Expected output:

```
Level 1: won in 10 moves ✔
Level 6: won in 19 moves ✔
Level 11: won in 17 moves ✔
No console errors ✔
```

It also saves screenshots (`shot-*.png`) for a quick visual check.

**Options** (set as environment variables in PowerShell):

| Want to… | Command |
|---|---|
| Use Microsoft Edge instead of Playwright's browser | `$env:PW_CHANNEL="msedge"; npm run e2e` |
| Use installed Chrome | `$env:PW_CHANNEL="chrome"; npm run e2e` |
| **Watch it play** (visible, slowed down) | `$env:HEADED="1"; npm run e2e` |
| Use a specific browser executable | `$env:CHROME="C:\path\to\chrome.exe"; npm run e2e` |

Clear an option with, for example, `Remove-Item Env:HEADED`.

Tip: a headed run makes a nice screen recording for a LinkedIn post about automated testing for games.

### 5.3 Run everything before a release

```powershell
npm run test:all
```

### 5.4 Manual test checklist (real phone)

| Area | Check |
|---|---|
| Basics | Select, deselect, legal move, illegal move shakes, completed tube glows |
| Flip | Countdown pulses at 1, tubes rotate, balls fall, counter resets |
| Undo | Works normally, **and right after a flip or an unlock** (highest-risk case) |
| Lock | Tapping a locked tube shows a message; it unlocks on the first completed tube |
| Hint | Highlights a valid move; the count decreases and disables at 0 |
| Fast input | Rapid double taps during animation don't break the board |
| Progress | Stars saved; reopening resumes at the right level; level menu unlocks correctly |
| Screens | Smallest phone available, low-end Android, landscape still playable |
| Interruptions | Lock the phone or switch apps mid-move, then return |
| Sound | Mute persists after reload; no sound when muted |
| Accessibility | Symbols (● ▲ ■ ◆ ★ ✚ ♥ ⬢) distinguish every colour |

---

## 6. Generating and tuning levels

```powershell
npm run gen      # rewrites levels.json
npm run build    # bakes them into dist/index.html
npm test         # re-verifies every level is solvable
```

**How generation works**

1. For level *n*, a seeded RNG (`n × 1000 + attempt`) shuffles the balls into tubes, plus 2 empty tubes. The same seed always gives the same level.
2. Boards with an already-completed tube are rejected.
3. The solver (weighted best-first search) must find a solution, otherwise the generator tries the next seed.
4. Boards that are too easy (solution shorter than 2 × colours) are rejected.
5. **Par** = the shortest solution found across two solver settings.

**To tune difficulty,** edit `config(n)` in `gen.js`:

```js
if (n <= 10) return { colors: 5, flip: 6, lock: false };
//                    ^ colours   ^ flip every N moves (0 = off)   ^ locked tube on/off
```

**To change the number of levels,** edit `const TOTAL = 60` in `gen.js`.

Note: par comes from a fast heuristic solver, so it's a good target but not always the true optimum. Skilled players can sometimes beat it.

---

## 7. Hosting and sharing

Everything below is free for a game this size. Upload **`dist/index.html`** or the **`dist` folder**, never the source folder.

### 7.1 Netlify (recommended for sharing a link)

1. Go to https://app.netlify.com/drop and drag the **`dist` folder** in.
2. **Claim the site** (sign up free). Unclaimed anonymous drops are deleted within about an hour.
3. Rename it under Project configuration (for example `flipside-sort.netlify.app`).
4. **Make it public:** if the dashboard says *"visible only to your team"*, open Project configuration → Access & security / Visitor access and set it to public.
5. Share **`https://<name>.netlify.app`**, not the `app.netlify.com/...` dashboard URL.
6. **Updating:** `npm run build`, then drag `dist` onto the project's **Deploys** page. The URL stays the same.

Verify it by opening the link in an incognito tab on your phone, logged out.

### 7.2 itch.io (built-in audience and comments)

Create a project with *Kind of project* set to **HTML**, upload `dist/index.html` directly (no zip needed), tick *played in the browser* and enable the mobile-friendly option.

### 7.3 GitHub Pages (portfolio)

```powershell
git init
git add .
git commit -m "Flipside Sort v0.1"
git branch -M main
git remote add origin https://github.com/ashutoshsharma19/flipside-sort.git
git push -u origin main
```

Copy `dist/index.html` to `docs/index.html`, commit and push. Then go to **Settings → Pages**, set Source to `main` and the folder to `/docs`. The game is served at `https://ashutoshsharma19.github.io/flipside-sort/`. Pages is for non-commercial use, so move the web build elsewhere if you add ads or payments.

### 7.4 Suggested `.gitignore`

```
node_modules/
shot-*.png
test-results/
```

---

## 8. How it works (architecture)

### 8.1 Game state

```js
{
  tubes: [[0,3,1,2], [2,2,0], ...],  // colour indices, bottom → top
  cap: 4,                            // balls per tube
  flipEvery: 5,                      // 0 = no flips
  locked: 3,                         // index of locked tube, -1 = none
  moves: 7,
  upsideDown: false                  // visual only
}
```

### 8.2 `logic.js`: pure functions

| Function | Purpose |
|---|---|
| `canMove(s, a, b)` | Legality check |
| `applyMove(s, a, b)` | Returns `{ state, unlocked, flipped }` as a **new** state. Order: move → unlock check → flip check |
| `isSolved(s)` | Win condition |
| `movesUntilFlip(s)` | Drives the HUD counter |
| `solve(s, opts)` | Weighted best-first search with a node budget. Used by the generator, the tests and the Hint button |

Because states are immutable, **undo** is just a stack of previous states.

The solver's state key sorts unlocked tubes (tube order doesn't matter) and includes the flip phase (`moves % flipEvery`), because the same board at a different point in the flip cycle is a different position.

### 8.3 UI (`index.src.html`)

- **Rendering:** plain DOM. Tubes are `div`s and balls are absolutely positioned. It re-renders from state after every change, which is simple and fast at this size.
- **Move animation:** a floating ball travels from the source tube to the target slot using the Web Animations API, while the real target ball stays hidden.
- **Flip animation:** the tubes rotate 180° with a CSS transition. The reversed state is then rendered with the balls starting at the far end and falling with an accelerating ease.
- **Input lock:** a `busy` flag ignores taps during animations, which prevents double-tap bugs.
- **Scaling:** `fit()` resizes ball and tube CSS variables to the viewport, down to 70% on very small screens.
- **Persistence:** `localStorage` key `flipside-sort-v1` stores `{ unlocked, stars, muted, current }`, wrapped in try/catch so the game still works where storage is blocked.
- **Audio:** tiny synthesised Web Audio tones, so there are no sound files to download.

### 8.4 Build

`build.js` replaces `/*LOGIC*/` and `/*LEVELS*/` in `index.src.html` with the contents of `logic.js` and `levels.json` (stored solutions are stripped). The result is one portable file.

---

## 9. Release checklist

- [ ] `npm run test:all` is green
- [ ] Manual checklist (5.4) done on a real low/mid-range Android phone
- [ ] Works offline after first load
- [ ] Version noted in the commit and tag (for example `v0.1.0`)
- [ ] `dist` deployed; link checked in an incognito tab on mobile data
- [ ] Release notes written (what changed, known issues)

For the Play Store later: wrap with Capacitor, add a privacy policy, complete the data-safety form and run the 14-day closed test with 12+ testers.

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `npm test` fails with `MODULE_NOT_FOUND 'playwright'` | An old copy where the e2e file was named `smoke.test.js` | Use the current files: `npm test` runs only `logic.test.js` |
| e2e: `spawn ... chrome-headless-shell.exe` error, `code: 'UNKNOWN'` | Antivirus blocked Playwright's browser, or the download is incomplete | `$env:PW_CHANNEL="msedge"; npm run e2e`, or `npx playwright install --force chromium` |
| Changes don't show up | Edited `dist/index.html`, or forgot to rebuild | Edit source files, run `npm run build`, then hard-refresh |
| Netlify shows "Page not found" | Dropped the source folder instead of `dist` | Drop only the `dist` folder |
| Friend sees a Netlify login or dashboard | Site is team-only, or you shared the dashboard URL | Make the site public; share `https://<name>.netlify.app` |
| Netlify link dead after an hour | Anonymous drop never claimed | Re-drop and claim with a free account |
| Phone can't reach `http://<ip>:3000` | Different network or firewall | Same Wi-Fi; allow Node on Private networks; check the IP with `ipconfig` |
| Progress lost | Private browsing, or browser storage cleared | Expected; progress is per-browser |
| Hint says "dead end" | The position is genuinely stuck within the solver's budget | Undo a few moves or Restart |

---

## 11. Roadmap

- [ ] Wrap with **Capacitor**, then an Android build, then install on a phone
- [ ] Firebase Analytics + Crashlytics (track where players get stuck)
- [ ] Play Console: closed test with 15–20 testers for 14 days, then production
- [ ] itch.io page for web feedback
- [ ] Daily puzzle mode (date-seeded level)
- [ ] Optional timed challenge mode (kept separate from the main levels)
- [ ] Rewarded ad for extra undos/hints (policy-safe, never forced)
- [ ] iOS via TestFlight once a Mac or cloud build is available

---

Built by Ashutosh Sharma with AI-assisted development (Claude).
