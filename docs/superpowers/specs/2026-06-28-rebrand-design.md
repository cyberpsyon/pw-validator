# Rebrand: Navy/Mint Design System

**Date:** 2026-06-28
**Status:** Approved

## Goal

Replace the Japanese washi/sumi aesthetic with the navy/mint brand palette from `~/Projects/password_validator`. Keep all functional elements (live validation, theme/motion/sound toggles, generator, scoring, safety tips, share card). Remove Password DNA. **No logic changes** — validator, generator, HIBP, scoring untouched.

## Variable Strategy

The codebase already drives all color/typography through CSS custom properties in `App.css`, consumed both in CSS and inline in a few SVG components. The rebrand **renames the Japanese-named tokens and revalues the rest** — it does not invent new semantic names (the existing `--green/--red/--orange/--yellow/--teal` tier tokens are kept and revalued, because `ThreatGauge.jsx` and the `.tier-*` classes reference them by name).

Renames:
- `--vermilion` / `--vermilion-dim` / `--vermilion-glow` → `--mint` / `--mint-dim` / `--mint-glow`
- `--washi` / `--washi-dim` / `--washi-faint` → `--text` / `--text-dim` / `--text-faint`

New token:
- `--on-accent` — text color that sits on a mint fill (buttons, share-bar). Replaces the hardcoded `#14110E`. Dark-on-mint in dark mode, white-on-mint in light mode.

Kept (revalued): `--bg`, `--surface`, `--surface2`, `--border`, `--border2`, `--green`, `--red`, `--orange`, `--yellow`, `--teal`, `--font-display`, `--font-mono`.

## Color Palette

### Dark mode (default, `data-theme` unset / `"dark"`)

```css
--bg:          #0A1220;
--surface:     #141C2E;
--surface2:    #1A2238;
--border:      rgba(255,255,255,0.06);
--border2:     rgba(255,255,255,0.10);

--mint:        #3DDC97;
--mint-dim:    rgba(61,220,151,0.10);
--mint-glow:   rgba(61,220,151,0.25);
--on-accent:   #0A1220;

--text:        #E8EDF4;
--text-dim:    #8A93A6;
--text-faint:  rgba(255,255,255,0.16);

--green:  #3DDC97;   /* tier-good, gauge Decades */
--yellow: #FFB020;   /* tier-mid, gauge Months/Years */
--orange: #FF6D00;   /* gauge Hours/Days */
--red:    #FF5577;   /* tier-bad, gauge Instant/Minutes */
--teal:   #3E9E94;   /* gauge Centuries, tier-unknown */
```

### Light mode (`data-theme="light"`)

Overrides only the tokens that differ; tier colors are deepened for text contrast on white.

```css
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
--yellow: #D97706;
--orange: #EA580C;
--red:    #DC2626;
--teal:   #2C7A72;
```

## Typography

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,700;1,400&display=swap');

--font-display: 'Inter', sans-serif;
--font-mono:    'JetBrains Mono', monospace;
```

Shippori Mincho is removed everywhere — including the hardcoded `fontFamily="'Shippori Mincho', serif"` inside `EnsoCircle.jsx`. Inter takes over every `var(--font-display)` use (app title, panel/section headings, disclosure toggles, score numeral). JetBrains Mono stays for code, badges, labels, inputs.

## Shape

- **Inputs** (`.pw-field`, generator select): `border-radius: 6px`
- **Buttons** (`.validate-btn`, `.settings-btn`, `.copy-btn`, `.example-chip`, `.reveal-btn`): `border-radius: 999px` (pill)
- `.share-report` keeps square corners (report aesthetic); everything else unchanged.

## Header

```
How strong is your password?
An audit against 850M breached passwords and modern cracking benchmarks. No accounts, no logging, no storage.
```

"password" wrapped in `<span className="app-title-accent">` → `color: var(--mint)`. Tagline uses `--text-dim`.

## Ensō (EnsoCircle.jsx)

The ring is the visual centerpiece and currently hardcodes the warm palette + Japanese font in JS. Updates:
- Rating color map → new palette: `EXCELLENT`/`STRONG` → `#3DDC97`, `GOOD`/`FAIR` → `#FFB020`, `WEAK` → `#FF5577` (theme-independent — matches `password_validator` RATING_COLORS; reads well on both navy and white as a thick graphic stroke).
- `AWAITING` fallback color → `var(--text-faint)` (theme-aware).
- Ghost ring stroke `rgba(210,77,62,0.06)` → `var(--surface2)` (subtle track, theme-aware).
- Score label: `fontFamily="'Inter', sans-serif"`, `fill="var(--text)"`.

## Files Changed

| File | Change |
|------|--------|
| `src/App.css` | Rename + revalue all tokens per tables above; replace `[data-theme="washi"]` block with `[data-theme="light"]`; replace every `--vermilion*` → `--mint*` and `--washi*` → `--text*` reference; replace hardcoded `#14110E` (3×) with `var(--on-accent)`; add `--on-accent`; add `.app-title-accent`; add border-radius to inputs/buttons; swap `@import` font |
| `src/components/App.jsx` | Header title + tagline; remove `DnaArt` import (line 19) and `<DnaArt>` usage (line 67) |
| `src/components/ThemeToggle.jsx` | Replace `'washi'`/`'sumi'` with `'light'`/`'dark'`; button label shows "dark" / "light" |
| `src/components/EnsoCircle.jsx` | Rating color map, fallback, ghost ring, score-label font + fill (see Ensō section) |
| `src/components/EmptyState.jsx` | Ghost ensō stroke `var(--washi-faint)` → `var(--text-faint)` |
| `src/components/ScoringExplainer.jsx` | Update stale palette comment (line 4) |
| `src/components/SafetyTips.jsx` | Update stale palette comment (line 4) |

## Files Deleted

- `src/components/DnaArt.jsx`
- `src/components/DnaArt.test.jsx`
- `src/lib/dna.js`
- `src/lib/dna.test.js`

## Notes

- **localStorage migration:** `ThemeToggle` persists `pv-theme`. A stale `'washi'`/`'sumi'` value will fall to the dark branch once (toggle re-selects on next click). Not deployed yet → negligible; no migration code.
- **Share card bar** becomes mint (`var(--mint)` + `--on-accent` text), consistent with the brand. The PNG export (`shareImage.js`) rasterizes the live DOM, so it inherits the new colors with no change.

## Out of Scope

- No logic changes (validator, generator, HIBP, scoring)
- No structural/layout changes, no new components
- `motionPref.js`, `sound.js`, `shareImage.js`, all result-panel components — untouched except the token references that resolve automatically
