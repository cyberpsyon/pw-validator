# UI/UX Overhaul — Password Validator (React)

**Date:** 2026-05-28
**Status:** Approved design, pending implementation plan
**Author:** Ben Mickens (with Claude Code)

## Goal

Turn the migrated React password validator into a UI/UX showpiece that is genuinely
enjoyable to use, while staying a static, fully client-side, privacy-first app
(no backend; passwords never leave the device beyond HIBP k-anonymity prefixes).

The existing validation **logic is correct and frozen** — it mirrors the real
Streamlit app (`password_validator.py`). This overhaul changes presentation,
interaction, and motion only. `src/lib/validator.js` and `src/lib/hibp.js` are
not modified.

## Design decisions (locked)

- **Visual identity:** Elevate the existing ensō / washi identity to gallery grade
  (warm near-black `#14110E`, washi off-white, vermilion accent, Shippori Mincho +
  JetBrains Mono, zero border-radius, structural whitespace). No reinvention.
- **Feature pillars:** Real-time & alive · Polish & delight · Generative & shareable.
  (Educational "attack-simulation theatre" and the quantum/hardware sandbox were
  considered and **deselected**.)
- **Motion level:** Cinematic but tasteful — a few deliberate "moments" against an
  otherwise calm canvas. Impact through contrast, not constant animation.
- **Experience structure:** A+B blend — "living canvas" backbone with an
  empty-state "stage" and a one-time cinematic reveal.
- **Generative art:** "Ensō orbits" direction (concentric ink rings + nodes),
  seeded only from the strength profile (privacy-safe by construction).

## Experience structure & flow

### Empty state (the "stage")
On load: centered, slowly breathing **ghost ensō** (faint outline), the password
field beneath it, the alternating privacy disclaimer, and a single invitation line.
"Try an example" chips load demo passwords (e.g. `password123`, a passphrase, a
strong one) so first-time users see the system react without typing a real secret.
Generous negative space; nothing else on screen.

### The reveal (one-time moment)
The first meaningful keystroke (or example chip) triggers a one-time cinematic
reveal: the ensō ink-draws from empty toward the current score, and the analysis
sections fade/slide up with a ~60ms stagger. Happens once per empty→active
transition; subsequent edits update quietly.

### Living canvas (backbone)
No "Analyze" button. One calm vertical rhythm:
1. Ensō hero — animated score + rating
2. Password field + reveal/generate controls + disclaimer
3. Score breakdown — Crack time / Breach check / Length (tier-colored)
4. **Generative "password DNA" art** — the quiet hero moment
5. Threat gauge → Rule analysis → Recommendations
6. "Deep analysis" (collapsed): attack breakdown, policy compliance, share card
7. Generators + Scoring explainer + Safety tips (collapsed)

### Clearing
Emptying the field eases back to the empty state (ensō recedes to ghost) rather
than snapping to blank.

## Real-time engine

- **Instant local analysis:** zxcvbn scoring/entropy/rules recompute on every
  keystroke, **debounced ~120ms** so typing stays smooth.
- **zxcvbn in a Web Worker:** the heavy (~800KB) zxcvbn work moves off the main
  thread and is **lazy-loaded**, so the empty state paints instantly and typing
  never janks. The cheap scoring/rule assembly and HIBP `fetch` stay on the main
  thread.
- **Breach check deferred:** HIBP fires only after typing pauses (**~600ms**),
  never per keystroke. The Breach metric shows a calm "checking…" state, then
  resolves. Same k-anonymity guarantee (only a 5-char SHA-1 prefix is sent).
- **Race safety:** a monotonic run-token guard (already built) ensures a slow HIBP
  response can never overwrite fresher state. Generalized into the live hook.
- The previous two-phase `handleValidate` becomes a continuous live loop; the
  fidelity math in `validator.js` is unchanged.

## Generative "password DNA" art

### Privacy model (critical)
The art seed is derived **only from the strength profile** — entropy bits, length,
character-class flags, crack-time bucket, and the detected attack-pattern tags —
**never from the password content**. Consequences:
- The art visualizes *how strong* a password is; weaknesses appear as flaws.
- Two different passwords with the same strength profile produce the same art,
  which reveals nothing about either secret. This content-independence is asserted
  by a unit test.

### Form: Ensō orbits
- Concentric hand-drawn ensō rings, one per entropy tier; ring break/roughness
  derived from the seed.
- Scattered nodes whose count scales with length.
- Color encodes rating (vermilion → green tiers); detected weaknesses render as
  red/broken nodes.
- Deterministic: seed → `mulberry32` PRNG → geometry parameters (pure function).
- Strokes **draw on** with a short stagger only when a result settles (typing
  pause), so the password "blooms" into its fingerprint.

## Motion & micro-interactions (cinematic but tasteful)

- **Ensō brush-draw:** score ring draws like an ink stroke (existing texture
  filter), ~1.2s eased, faint vermilion "wet ink" glow settling; rating color
  cross-fades.
- **Number tweening:** score counts up; entropy/crack-time roll to new values
  (~400ms) rather than snapping.
- **Threat gauge:** segments fill in a quick cascade; active segment gets a soft glow.
- **Reveal stagger:** sections fade-up ~60ms apart on first reveal only.
- **Quiet live updates:** after reveal, edits tween values and adjust the ensō; the
  page does not re-animate wholesale on each keystroke.
- **Reduced motion:** `prefers-reduced-motion` and a manual toggle collapse all
  motion to instant state changes with full functionality.

## Polish & delight

- **Theme:** dark **sumi** (default) ⇄ light **washi** (warm paper, ink-dark text),
  persisted in `localStorage`, honoring `prefers-color-scheme` on first visit. Both
  drive the same CSS custom properties.
- **Sound (optional, off by default):** one toggle for subtle cues — soft brush on
  reveal, faint tick on rating-tier change. Lazy Web Audio; never autoplay.
- **Onboarding / empty state:** breathing ghost ensō + example chips (above).
- **Shareable image export:** share card and DNA art export to a downloadable
  **PNG** via canvas (rating-only, never the password).
- **Accessibility:** full keyboard path, visible focus rings, an ARIA live region
  announcing rating/score changes, AA contrast in both themes, plus the
  reduced-motion support above.

## Architecture & components

Reuse existing result components; add presentation/interaction layers around the
frozen logic.

New modules:
- `src/hooks/useLiveValidation.js` — debounced local analysis + deferred HIBP +
  run-token guard; returns `{ result, phase, isEmpty }`.
- `src/lib/validator.worker.js` — runs the zxcvbn-dependent crack analysis off the
  main thread; lazy-loaded.
- `src/lib/dna.js` — strength-profile → seed → PRNG → orbit/node geometry (pure).
- `src/components/DnaArt.jsx` — renders and animates the orbit SVG.
- `src/components/EmptyState.jsx` — ghost ensō + example chips.
- `src/lib/theme.js` + `src/components/ThemeToggle.jsx` — washi/sumi; light palette
  added to `App.css` tokens.
- `src/lib/sound.js` + sound toggle — lazy Web Audio, off by default.
- `src/lib/shareImage.js` — SVG/card → canvas → PNG.
- A small number-tween helper (hook or Web Animations).
- Preferences (theme/sound/motion) persisted in `localStorage`.

Changed:
- `src/components/App.jsx` — switches between `EmptyState` and live results, drives
  `useLiveValidation`, orchestrates the one-time reveal, hosts theme/sound/settings.
- `ScoreDisplay` (tweening), `ThreatGauge` (cascade), `ShareCard` (PNG export).

Unchanged:
- `src/lib/validator.js`, `src/lib/hibp.js`, `src/lib/generator.js`,
  `src/lib/eff_wordlist.js` (logic frozen).

## Testing

- Keep existing validator-logic verification (Node smoke checks).
- `dna.js`: determinism (same profile → same geometry) and **content-independence**
  (different secrets, same profile → identical art).
- `useLiveValidation`: debounce/defer timing and race-guard behavior.
- Manual/visual: empty→reveal, live updates, reduced-motion, both themes, PNG
  export, mobile at 390px.

## Phasing

1. **Foundation:** live engine (worker + hook), empty state + reveal, ensō
   brush-draw + number tweening, A+B flow restructure.
2. **Signature:** DNA ensō-orbits art + draw-on, threat-gauge cascade.
3. **Polish & share:** washi/sumi theme, PNG export, accessibility pass,
   reduced-motion, optional sound.

## Out of scope (YAGNI)

- No accounts, cloud, or stored password history.
- No animated attack-simulation theatre; no quantum/hardware crack-time sandbox.
- No second DNA art style for v1 (style toggle deferred).
- No internationalization.
- No Japanese characters in the UI (briefing constraint; orbits art is abstract).
