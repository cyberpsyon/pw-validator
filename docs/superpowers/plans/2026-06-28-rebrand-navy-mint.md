# Navy/Mint Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Japanese washi/sumi visual identity with the navy/mint brand palette from `~/Projects/password_validator`, remove Password DNA, and keep every functional element working.

**Architecture:** Pure presentational change. All color/typography flows through CSS custom properties in `src/App.css`, consumed in CSS and inline in three SVG/JSX spots. The rebrand renames the Japanese-named tokens (`--vermilion*`→`--mint*`, `--washi*`→`--text*`), revalues the kept tokens (`--bg`, `--surface*`, `--border*`, `--green/--red/--orange/--yellow/--teal`), swaps the font import, and updates the few files that hardcode old colors in JS. No validator/generator/HIBP/scoring logic changes.

**Tech Stack:** React 18 + Vite, vanilla CSS (custom properties), Vitest + React Testing Library, Playwright (verification only).

## Global Constraints

- **No logic changes.** `validator.js`, `validator-core.js`, `validator.worker.js`, `generator.js`, `hibp.js`, scoring, and HIBP behavior stay byte-for-byte unchanged.
- **No commits by the agent.** The user makes all commits. Each task ends by reporting what to commit and a suggested message — never run `git commit` or `git add`.
- **Two themes only:** `data-theme` unset/`"dark"` (default) and `data-theme="light"`. The strings `washi` and `sumi` must not survive anywhere in `src/` except as dictionary words in `eff_wordlist.js`.
- **Brand accent:** mint `#3DDC97` (dark) / `#1EB87A` (light). Header reads exactly: `How strong is your password?` with "password" in mint.
- **Verification per task:** `npm run lint` clean, `npm test -- --run` green, `npm run build` succeeds. Presentational tasks add a grep assertion and/or screenshot rather than a unit test (the changes are not unit-testable; see each task).

---

## File Structure

| File | Responsibility | Action |
|------|----------------|--------|
| `src/App.css` | All design tokens + component styling | Modify (core retheme) |
| `src/components/App.jsx` | Page composition + header | Modify (header, remove DNA) |
| `src/components/EnsoCircle.jsx` | Score ring SVG (hardcodes colors/font in JS) | Modify |
| `src/components/EmptyState.jsx` | Ghost ensō + example chips | Modify (one stroke color) |
| `src/components/ThemeToggle.jsx` | Theme persistence + toggle button | Modify (washi/sumi → light/dark) |
| `src/components/ScoringExplainer.jsx` | Scoring docs panel | Modify (stale comment only) |
| `src/components/SafetyTips.jsx` | Safety tips panel | Modify (stale comment only) |
| `src/components/DnaArt.jsx` + `.test.jsx` | Password DNA art | Delete |
| `src/lib/dna.js` + `.test.js` | DNA geometry | Delete |

---

## Task 1: Remove Password DNA

Removes the feature the user disliked. Self-contained: deletes 4 files, removes the import/usage in `App.jsx`, and removes the dead `.dna-*` CSS. Test suite drops from 13 tests / 5 files to 7 tests / 3 files (6 DNA tests removed: 4 in `dna.test.js`, 2 in `DnaArt.test.jsx`).

**Files:**
- Delete: `src/components/DnaArt.jsx`, `src/components/DnaArt.test.jsx`, `src/lib/dna.js`, `src/lib/dna.test.js`
- Modify: `src/components/App.jsx` (remove import line 19, remove usage line 67)
- Modify: `src/App.css` (remove `.dna-*` block, lines 410–415)

**Interfaces:**
- Consumes: nothing.
- Produces: `App.jsx` no longer imports or renders `DnaArt`; no `.dna-*` CSS remains.

- [ ] **Step 1: Delete the four DNA files**

```bash
rm src/components/DnaArt.jsx src/components/DnaArt.test.jsx src/lib/dna.js src/lib/dna.test.js
```

- [ ] **Step 2: Remove the DnaArt import from App.jsx**

In `src/components/App.jsx`, delete this line (line 19):

```jsx
import { DnaArt } from './DnaArt.jsx';
```

- [ ] **Step 3: Remove the DnaArt usage from App.jsx**

In `src/components/App.jsx`, delete the `<DnaArt>` render and the blank line that follows it. Change:

```jsx
          <DnaArt result={result} />

          <ThreatGauge crackSeconds={result.crackSeconds} crackTime={result.crackTime} />
```

to:

```jsx
          <ThreatGauge crackSeconds={result.crackSeconds} crackTime={result.crackTime} />
```

- [ ] **Step 4: Remove the dead DNA CSS from App.css**

In `src/App.css`, delete the entire Password DNA block (lines 410–415):

```css
/* ====================== Password DNA ====================== */
.dna-art { display: flex; flex-direction: column; gap: 12px; }
.dna-canvas { display: flex; justify-content: center; padding: 8px 0; }
.dna-ring { animation: dnaDraw 1s ease both; }
@keyframes dnaDraw { from { stroke-dashoffset: var(--dna-circ, 600); opacity: 0; } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) { .dna-ring { animation: none; } }
```

- [ ] **Step 5: Verify no DNA references remain**

Run: `grep -rn -i "dnaart\|/dna\|dna\.js\|\.dna-\|dna-circ\|password dna" src/`
Expected: no output (exit code 1).

- [ ] **Step 6: Run lint, tests, and build**

Run: `npm run lint && npm test -- --run && npm run build`
Expected: lint clean; tests show **7 passed (3)** (3 files: `EmptyState.test.jsx`, `useLiveValidation.test.jsx`, `useTween.test.jsx`); build succeeds.

- [ ] **Step 7: Report for commit (do not commit)**

Tell the user: files deleted + `App.jsx`/`App.css` edited. Suggested message:
`refactor: remove Password DNA feature`

---

## Task 2: Apply navy/mint palette, fonts, and shape

The core retheme. Replaces the token definitions, swaps the font import, renames every token reference, fixes hardcoded old colors, adds border-radius, and updates the two inline-color JS components and two stale comments. Verified by a grep sweep (no old token names survive) plus build — the visual confirmation happens in Task 5.

**Files:**
- Modify: `src/App.css`
- Modify: `src/components/EnsoCircle.jsx`
- Modify: `src/components/EmptyState.jsx`
- Modify: `src/components/ScoringExplainer.jsx`
- Modify: `src/components/SafetyTips.jsx`

**Interfaces:**
- Consumes: nothing.
- Produces: tokens `--mint`, `--mint-dim`, `--mint-glow`, `--on-accent`, `--text`, `--text-dim`, `--text-faint` (dark + light); kept tokens revalued. No `--vermilion*` / `--washi*` / `Shippori` references anywhere.

- [ ] **Step 1: Swap the font import**

In `src/App.css`, replace line 7:

```css
@import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;700&family=JetBrains+Mono:ital,wght@0,400;0,700;1,400&display=swap');
```

with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,700;1,400&display=swap');
```

- [ ] **Step 2: Replace the `:root` token block**

In `src/App.css`, replace the entire `:root { ... }` definition block (lines 9–32) with:

```css
:root {
  --bg:             #0A1220;
  --surface:        #141C2E;
  --surface2:       #1A2238;
  --border:         rgba(255,255,255,0.06);
  --border2:        rgba(255,255,255,0.10);

  --mint:           #3DDC97;
  --mint-dim:       rgba(61,220,151,0.10);
  --mint-glow:      rgba(61,220,151,0.25);
  --on-accent:      #0A1220;

  --text:           #E8EDF4;
  --text-dim:       #8A93A6;
  --text-faint:     rgba(255,255,255,0.16);

  --green:   #3DDC97;
  --red:     #FF5577;
  --orange:  #FF6D00;
  --yellow:  #FFB020;
  --teal:    #3E9E94;

  --font-display: 'Inter', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}
```

- [ ] **Step 3: Replace the light-theme block**

In `src/App.css`, replace the entire `:root[data-theme="washi"] { ... }` block AND its body-grid companion `:root[data-theme="washi"] body { ... }` (near the end of the file — match by content; exact line numbers shifted up by 6 after Task 1 removed the DNA block) with:

```css
:root[data-theme="light"] {
  --bg:          #F0F4F8;
  --surface:     #FFFFFF;
  --surface2:    #E8EDF4;
  --border:      rgba(0,0,0,0.08);
  --border2:     rgba(0,0,0,0.14);

  --mint:        #1EB87A;
  --mint-dim:    rgba(30,184,122,0.12);
  --mint-glow:   rgba(30,184,122,0.22);
  --on-accent:   #FFFFFF;

  --text:        #0A1220;
  --text-dim:    #5B6472;
  --text-faint:  rgba(10,18,32,0.20);

  --green:  #1EB87A;
  --red:    #DC2626;
  --orange: #EA580C;
  --yellow: #D97706;
  --teal:   #2C7A72;
}
:root[data-theme="light"] body {
  background-image:
    linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px);
}
```

- [ ] **Step 4: Update the dark-mode `color-scheme` lines**

In `src/App.css`, the two lines just after the light block (match by content) read:

```css
:root { color-scheme: dark; }
:root[data-theme="washi"] { color-scheme: light; }
```

Change the second to:

```css
:root[data-theme="light"] { color-scheme: light; }
```

- [ ] **Step 5: Rename every `--vermilion` reference**

In `src/App.css`, replace all occurrences of `--vermilion` with `--mint` (this correctly maps `--vermilion-dim`→`--mint-dim` and `--vermilion-glow`→`--mint-glow` because the suffixes are preserved). Use replace-all.

Run to confirm: `grep -c "\-\-vermilion" src/App.css`
Expected: `0`

- [ ] **Step 6: Rename every `--washi` reference**

In `src/App.css`, replace all occurrences of `--washi` with `--text` (maps `--washi-dim`→`--text-dim`, `--washi-faint`→`--text-faint`, bare `--washi`→`--text`). Use replace-all.

Run to confirm: `grep -c "\-\-washi" src/App.css`
Expected: `0`

- [ ] **Step 7: Replace hardcoded `#14110E` with `var(--on-accent)`**

In `src/App.css`, replace all occurrences of `#14110E` with `var(--on-accent)` (3 occurrences: `.validate-btn` color, `.share-bar-title` color, `.share-bar-date` color). Use replace-all.

Run to confirm: `grep -c "#14110E" src/App.css`
Expected: `0`

- [ ] **Step 8: Fix the dark body grid color**

In `src/App.css`, the `body` background-image (lines ~39–40) uses the old vermilion grid. Replace:

```css
    linear-gradient(rgba(210,77,62,0.012) 1px, transparent 1px),
    linear-gradient(90deg, rgba(210,77,62,0.012) 1px, transparent 1px);
```

with:

```css
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
```

- [ ] **Step 9: Fix the validate-btn hover and explainer-code background**

In `src/App.css`, replace the validate-btn hover line:

```css
.validate-btn:hover:not(:disabled) { background: #E05A49; }
```

with:

```css
.validate-btn:hover:not(:disabled) { filter: brightness(1.08); }
```

And replace the explainer-code background (old warm green tint):

```css
.explainer-code { color: var(--green); background: rgba(92,158,110,0.08); padding: 1px 6px; font-family: var(--font-mono); font-size: 0.78rem; }
```

with:

```css
.explainer-code { color: var(--green); background: rgba(61,220,151,0.08); padding: 1px 6px; font-family: var(--font-mono); font-size: 0.78rem; }
```

- [ ] **Step 10: Add border-radius (pills for buttons, 6px for inputs)**

In `src/App.css`, append these overrides to the end of the file (they win over the global `button`/`input` square defaults via class specificity):

```css
/* ====================== Rebrand shape overrides ====================== */
.pw-field      { border-radius: 6px 0 0 6px; }
.reveal-btn    { border-radius: 0 6px 6px 0; }
.gen-sep select{ border-radius: 6px; }
.gen-output    { border-radius: 6px; }
.validate-btn,
.settings-btn,
.copy-btn,
.example-chip  { border-radius: 999px; }
.app-title-accent { color: var(--mint); }
```

- [ ] **Step 11: Update EnsoCircle.jsx (hardcoded colors + font)**

Replace the full contents of `src/components/EnsoCircle.jsx` with:

```jsx
// The ensō completes as score climbs from 0 to 100.
// CIRCUMFERENCE = 2 * π * r = 2 * π * 90 ≈ 565.5
const CIRCUMFERENCE = 565.5;

export function EnsoCircle({ score, rating }) {
  const ratingColor = {
    EXCELLENT: '#3DDC97',
    STRONG:    '#3DDC97',
    GOOD:      '#FFB020',
    FAIR:      '#FFB020',
    WEAK:      '#FF5577',
  }[rating] ?? 'var(--text-faint)';

  const dashOffset = CIRCUMFERENCE * (1 - (score ?? 0) / 100);

  return (
    <svg viewBox="0 0 260 260" width="260" height="260">
      <defs>
        <filter id="enso-texture">
          <feTurbulence type="fractalNoise" baseFrequency="0.04"
            numOctaves="4" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise"
            scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      {/* Ghost ring */}
      <circle cx="130" cy="130" r="90" fill="none"
        stroke="var(--surface2)" strokeWidth="32"/>
      {/* Ensō stroke */}
      <circle cx="130" cy="130" r="90" fill="none"
        stroke={ratingColor}
        strokeWidth="28"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        filter="url(#enso-texture)"
        transform="rotate(-90 130 130)"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.25,0.1,0.25,1), stroke 0.6s ease' }}
      />
      {/* Score label */}
      <text x="130" y="122" textAnchor="middle"
        fontFamily="'Inter', sans-serif"
        fontSize="44" fill="var(--text)" fontWeight="700">
        {score ?? '—'}
      </text>
      <text x="130" y="148" textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="10" fill={ratingColor} letterSpacing="4">
        {rating ?? 'AWAITING'}
      </text>
    </svg>
  );
}
```

- [ ] **Step 12: Update EmptyState.jsx ghost stroke**

In `src/components/EmptyState.jsx`, change the ghost ensō stroke (line 12):

```jsx
          stroke="var(--washi-faint)" strokeWidth="26" strokeLinecap="round"
```

to:

```jsx
          stroke="var(--text-faint)" strokeWidth="26" strokeLinecap="round"
```

- [ ] **Step 13: Update the stale palette comment in ScoringExplainer.jsx**

In `src/components/ScoringExplainer.jsx`, change the comment (lines 3–4):

```jsx
// Content ported from render_scoring_panel() in app.py. Emphasis colors
// adapted to the ensō palette (#F5A623 -> --vermilion, #00E676 -> --green).
```

to:

```jsx
// Content ported from render_scoring_panel() in app.py. Emphasis colors
// adapted to the navy/mint palette (#F5A623 -> --mint, #00E676 -> --green).
```

- [ ] **Step 14: Update the stale palette comment in SafetyTips.jsx**

In `src/components/SafetyTips.jsx`, change the comment (lines 3–4):

```jsx
// Verbatim from _SAFETY_TIPS in app.py. Emphasis colors adapted to the ensō
// palette: #FF1744 -> --red, #00E676 -> --green, #F5A623 -> --vermilion.
```

to:

```jsx
// Verbatim from _SAFETY_TIPS in app.py. Emphasis colors adapted to the navy/mint
// palette: #FF1744 -> --red, #00E676 -> --green, #F5A623 -> --mint.
```

- [ ] **Step 15: Verify all old palette references are gone**

Run:
```bash
grep -rn "vermilion\|washi\|sumi\|Shippori" src/ | grep -v "eff_wordlist.js"
```
Expected: no output (exit code 1). (`eff_wordlist.js` legitimately contains words like "washing"/"consuming" and is excluded.)

- [ ] **Step 16: Run lint, tests, and build**

Run: `npm run lint && npm test -- --run && npm run build`
Expected: lint clean; **7 passed (3)**; build succeeds.

- [ ] **Step 17: Report for commit (do not commit)**

Suggested message: `feat: apply navy/mint palette, Inter font, and pill shapes`

---

## Task 3: Update the header

Independent copy change. A reviewer could approve the palette but want different header wording, so it gets its own gate.

**Files:**
- Modify: `src/components/App.jsx` (header block)

**Interfaces:**
- Consumes: `.app-title-accent` class (added in Task 2, Step 10).
- Produces: header renders `How strong is your password?` with mint accent.

- [ ] **Step 1: Replace the header block**

In `src/components/App.jsx`, change:

```jsx
      <header className="app-header">
        <h1 className="app-title">Password Validator</h1>
        <p className="app-tagline">Strength analysis that never leaves your device.</p>
      </header>
```

to:

```jsx
      <header className="app-header">
        <h1 className="app-title">How strong is your <span className="app-title-accent">password</span>?</h1>
        <p className="app-tagline">An audit against 850M breached passwords and modern cracking benchmarks. No accounts, no logging, no storage.</p>
      </header>
```

- [ ] **Step 2: Run lint and build**

Run: `npm run lint && npm run build`
Expected: lint clean; build succeeds.

- [ ] **Step 3: Report for commit (do not commit)**

Suggested message: `feat: update header to "How strong is your password?"`

---

## Task 4: Rename theme strings (washi/sumi → light/dark)

The theme toggle still stores and switches on `'washi'`/`'sumi'`. Update to `'light'`/`'dark'`.

**Files:**
- Modify: `src/components/ThemeToggle.jsx`

**Interfaces:**
- Consumes: `usePref('pv-theme', ...)` (unchanged hook).
- Produces: `document.documentElement.dataset.theme` is `'light'` or `'dark'`; button label reads "light" or "dark".

- [ ] **Step 1: Replace the full contents of ThemeToggle.jsx**

Replace `src/components/ThemeToggle.jsx` with:

```jsx
import { useEffect } from 'react';
import { usePref } from '../hooks/usePref.js';

export function ThemeToggle() {
  const initial = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const [theme, setTheme] = usePref('pv-theme', initial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
  }, [theme]);

  return (
    <button type="button" className="settings-btn" aria-pressed={theme === 'light'}
      onClick={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}>
      {theme === 'light' ? 'dark' : 'light'} theme
    </button>
  );
}
```

- [ ] **Step 2: Verify no washi/sumi remain in components**

Run: `grep -rn "washi\|sumi" src/components/`
Expected: no output (exit code 1).

- [ ] **Step 3: Run lint, tests, and build**

Run: `npm run lint && npm test -- --run && npm run build`
Expected: lint clean; **7 passed (3)**; build succeeds.

- [ ] **Step 4: Report for commit (do not commit)**

Suggested message: `feat: rename theme modes to light/dark`

---

## Task 5: Visual verification (both themes)

Final gate. Confirms the rebrand renders correctly in dark and light — the part the test suite cannot check. No code changes; produces screenshots for the user to approve.

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server in the background**

Run: `npm run dev -- --port 5173`
Wait ~3s, then confirm: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/`
Expected: `200`

- [ ] **Step 2: Capture dark + light screenshots, empty and filled**

Run this script (Playwright is already a dev dependency; chromium is installed):

```bash
node -e "
const { chromium } = require('playwright');
const SP = process.env.SP;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1280, height: 1000 });
  await p.goto('http://localhost:5173/');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: SP + '/rebrand-dark-empty.png' });
  await p.fill('input[type=\"password\"]', 'Xy7!Qw9@Lm3#Zt5%Vb');
  await p.waitForTimeout(3500);
  await p.screenshot({ path: SP + '/rebrand-dark-filled.png', fullPage: true });
  // Switch to light theme via the toggle button (first settings-btn)
  await p.click('.settings-btn');
  await p.waitForTimeout(800);
  await p.screenshot({ path: SP + '/rebrand-light-filled.png', fullPage: true });
  await b.close();
  console.log('screenshots written');
})();
"
```
(Set `SP` to the scratchpad dir before running.)
Expected: `screenshots written`.

- [ ] **Step 3: Inspect the screenshots**

Open all three PNGs. Confirm:
- Dark mode: deep navy background, mint ensō ring + accents, Inter headings, pill buttons, **no** Password DNA section, **no** brown/vermilion anywhere.
- Header reads "How strong is your password?" with "password" in mint.
- Light mode: white/cool-gray background, dark navy text, deeper mint accent, readable button labels (white on mint).

- [ ] **Step 4: Stop the dev server**

Stop the background `npm run dev` process.

- [ ] **Step 5: Report completion**

Report all green (lint/test/build) plus the screenshot paths. Remind the user this rebrand is uncommitted and list the suggested commits from Tasks 1–4.

---

## Self-Review Notes

- **Spec coverage:** palette (T2 S2–S3), fonts (T2 S1, S11), shape/radius (T2 S10), header (T3), ensō (T2 S11), EmptyState (T2 S12), ThemeToggle (T4), stale comments (T2 S13–S14), `--on-accent` (T2 S2/S7), DNA removal (T1), light-mode tiers (T2 S3) — all mapped.
- **Type consistency:** token names (`--mint`, `--text`, `--on-accent`, `--text-faint`) are used identically across App.css, EnsoCircle.jsx, and EmptyState.jsx. `.app-title-accent` defined in T2 S10, consumed in T3 S1.
- **No new unit tests:** changes are presentational; verification is the existing suite staying green plus grep assertions (old tokens gone) and visual screenshots. This is intentional, not a placeholder.
