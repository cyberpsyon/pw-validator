# UI/UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the migrated React password validator into a live, generative, gallery-grade ensō experience without touching the (frozen) validation logic.

**Architecture:** A live-as-you-type engine runs the existing `fullValidate` in a lazy-loaded Web Worker (debounced), with HIBP deferred and a run-token race guard. The UI is an "empty stage → cinematic reveal → living canvas" flow. A privacy-safe generative "password DNA" SVG is seeded only from the strength profile. Polish layers add washi/sumi themes, PNG export, reduced-motion, accessibility, and optional sound.

**Tech Stack:** React 19 + Vite 8, zxcvbn (in a worker), Vitest + React Testing Library + jsdom (new), html-to-image (new), Web Audio + Web Animations / rAF.

**Spec:** `docs/superpowers/specs/2026-05-28-uiux-overhaul-design.md`

**Frozen (do NOT modify):** `src/lib/validator.js`, `src/lib/hibp.js`, `src/lib/generator.js`, `src/lib/eff_wordlist.js`.

---

## File Structure

**New:**
- `vitest.config.js` — test runner config (jsdom, setup file)
- `src/test/setup.js` — RTL + jest-dom setup
- `src/lib/validator.worker.js` — worker entry; runs `fullValidate`
- `src/lib/validatorClient.js` — lazy worker singleton + `validateAsync()`
- `src/hooks/useLiveValidation.js` — debounced local + deferred HIBP + race guard
- `src/hooks/useTween.js` — rAF numeric tween (reduced-motion aware)
- `src/hooks/useReducedMotion.js` — prefers-reduced-motion + manual override
- `src/hooks/usePref.js` — localStorage-backed boolean/string preference
- `src/lib/dna.js` — strength-profile → seed → geometry (pure)
- `src/components/DnaArt.jsx` — renders/animates the ensō-orbits SVG
- `src/components/EmptyState.jsx` — ghost ensō + example chips
- `src/components/ThemeToggle.jsx` — washi/sumi toggle
- `src/components/SettingsBar.jsx` — theme + sound + motion toggles
- `src/lib/sound.js` — lazy Web Audio cues
- `src/lib/shareImage.js` — node → PNG download
- `src/test/factories.js` — fake `result` objects for tests
- Test files alongside: `src/lib/dna.test.js`, `src/hooks/useLiveValidation.test.jsx`, `src/hooks/useTween.test.jsx`, `src/components/EmptyState.test.jsx`, `src/components/DnaArt.test.jsx`

**Modified:**
- `package.json` — add deps + `test` script
- `src/components/App.jsx` — empty/live switch, reveal orchestration, settings, live hook
- `src/components/PasswordInput.jsx` — remove Analyze button (now live), keep reveal + disclaimer
- `src/components/ScoreDisplay.jsx` — tweened score/entropy, ARIA live region
- `src/components/ThreatGauge.jsx` — cascade fill
- `src/components/ShareCard.jsx` — PNG export button
- `src/App.css` — washi theme tokens, reveal/cascade/draw-on animations, empty-state styles

---

# PHASE 1 — Foundation (live engine, empty state, reveal, motion basics)

## Task 1: Test tooling

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`, `src/test/setup.js`

- [ ] **Step 1: Install dev dependencies**

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```
Expected: packages added to `devDependencies`.

- [ ] **Step 2: Add the `test` script to `package.json`**

In the `"scripts"` block add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
})
```

- [ ] **Step 4: Create `src/test/setup.js`**

```js
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Sanity test that the runner works**

Create `src/test/smoke.test.js`:
```js
import { describe, it, expect } from 'vitest';
describe('runner', () => {
  it('runs', () => { expect(1 + 1).toBe(2); });
});
```
Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 6: Remove the smoke test and commit**

```bash
rm src/test/smoke.test.js
git add package.json package-lock.json vitest.config.js src/test/setup.js
git commit -m "test: add vitest + react testing library"
```

---

## Task 2: Validation Web Worker + client

**Files:**
- Create: `src/lib/validator.worker.js`, `src/lib/validatorClient.js`

The worker runs the frozen `fullValidate` off the main thread; the client lazily creates the worker (first call only) so the empty state never loads zxcvbn.

- [ ] **Step 1: Create `src/lib/validator.worker.js`**

```js
import { fullValidate } from './validator.js';

self.onmessage = (e) => {
  const { id, password, hibpResult } = e.data;
  const result = fullValidate(password, hibpResult);
  self.postMessage({ id, result });
};
```

- [ ] **Step 2: Create `src/lib/validatorClient.js`**

```js
// Lazily-created singleton worker. The worker (and zxcvbn) only loads on the
// first validate call, keeping the empty state light.
let worker = null;
let seq = 0;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./validator.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { id, result } = e.data;
      const resolve = pending.get(id);
      if (resolve) { pending.delete(id); resolve(result); }
    };
  }
  return worker;
}

export function validateAsync(password, hibpResult) {
  return new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, resolve);
    getWorker().postMessage({ id, password, hibpResult });
  });
}
```

- [ ] **Step 3: Verify the production build still compiles the worker**

Run: `npm run build`
Expected: build succeeds; output lists a worker chunk (a separate `assets/*.js`). No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/validator.worker.js src/lib/validatorClient.js
git commit -m "feat: run validation in a lazy web worker"
```

---

## Task 3: `useLiveValidation` hook

**Files:**
- Create: `src/hooks/useLiveValidation.js`, `src/hooks/useLiveValidation.test.jsx`

- [ ] **Step 1: Write the failing test**

`src/hooks/useLiveValidation.test.jsx`:
```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock the worker client and HIBP so the hook is testable without a real worker.
vi.mock('../lib/validatorClient.js', () => ({
  validateAsync: vi.fn(async (pw, hibp) => ({
    pw, score: hibp?.pending ? 80 : 100, hibpPending: !!hibp?.pending,
  })),
}));
vi.mock('../lib/hibp.js', () => ({
  checkHIBP: vi.fn(async () => ({ count: 0 })),
}));

import { useLiveValidation } from './useLiveValidation.js';
import { validateAsync } from '../lib/validatorClient.js';
import { checkHIBP } from '../lib/hibp.js';

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('useLiveValidation', () => {
  it('is empty with no password', () => {
    const { result } = renderHook(() => useLiveValidation(''));
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.result).toBeNull();
  });

  it('runs local validation after the local debounce, then HIBP', async () => {
    const { result, rerender } = renderHook(({ pw }) => useLiveValidation(pw, { localDelay: 120, hibpDelay: 600 }), {
      initialProps: { pw: 'abc' },
    });
    // before debounce fires, nothing yet
    expect(result.current.result).toBeNull();
    await act(async () => { await vi.advanceTimersByTimeAsync(120); });
    expect(validateAsync).toHaveBeenCalledWith('abc', { pending: true });
    expect(result.current.phase).toBe('checking');
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    expect(checkHIBP).toHaveBeenCalledWith('abc');
    expect(result.current.phase).toBe('done');
    rerender({ pw: 'abc' });
  });

  it('ignores a stale run when the password changes mid-flight', async () => {
    let resolveHibp;
    checkHIBP.mockImplementationOnce(() => new Promise((r) => { resolveHibp = () => r({ count: 5 }); }));
    const { result, rerender } = renderHook(({ pw }) => useLiveValidation(pw, { localDelay: 0, hibpDelay: 0 }), {
      initialProps: { pw: 'old' },
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    rerender({ pw: 'new' });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    await act(async () => { resolveHibp?.(); await Promise.resolve(); });
    // stale 'old' HIBP must not set phase to done for the 'new' run incorrectly
    expect(result.current.result?.pw).toBe('new');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- useLiveValidation`
Expected: FAIL ("Failed to resolve import './useLiveValidation.js'" or similar).

- [ ] **Step 3: Implement the hook**

`src/hooks/useLiveValidation.js`:
```js
import { useEffect, useRef, useState } from 'react';
import { validateAsync } from '../lib/validatorClient.js';
import { checkHIBP } from '../lib/hibp.js';

// Live validation: instant-ish local analysis (debounced) plus a deferred HIBP
// breach check. A monotonic run token guards against stale async resolutions.
export function useLiveValidation(password, { localDelay = 120, hibpDelay = 600 } = {}) {
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | checking | done
  const runRef = useRef(0);

  useEffect(() => {
    if (!password) {
      runRef.current++;
      setResult(null);
      setPhase('idle');
      return;
    }
    const runId = ++runRef.current;

    const localTimer = setTimeout(async () => {
      const partial = await validateAsync(password, { pending: true });
      if (runId !== runRef.current) return;
      setResult(partial);
      setPhase('checking');
    }, localDelay);

    const hibpTimer = setTimeout(async () => {
      const hibp = await checkHIBP(password);
      if (runId !== runRef.current) return;
      const full = await validateAsync(password, hibp);
      if (runId !== runRef.current) return;
      setResult(full);
      setPhase('done');
    }, hibpDelay);

    return () => { clearTimeout(localTimer); clearTimeout(hibpTimer); };
  }, [password, localDelay, hibpDelay]);

  return { result, phase, isEmpty: !password };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- useLiveValidation`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useLiveValidation.js src/hooks/useLiveValidation.test.jsx
git commit -m "feat: add useLiveValidation hook"
```

---

## Task 4: EmptyState component

**Files:**
- Create: `src/components/EmptyState.jsx`, `src/components/EmptyState.test.jsx`
- Modify: `src/App.css` (empty-state styles)

- [ ] **Step 1: Write the failing test**

`src/components/EmptyState.test.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from './EmptyState.jsx';

describe('EmptyState', () => {
  it('renders the invitation and example chips', () => {
    render(<EmptyState onPick={() => {}} />);
    expect(screen.getByText(/try an example/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(3);
  });

  it('calls onPick with the example password when a chip is clicked', async () => {
    const onPick = vi.fn();
    render(<EmptyState onPick={onPick} />);
    await userEvent.click(screen.getByRole('button', { name: /password123/ }));
    expect(onPick).toHaveBeenCalledWith('password123');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- EmptyState`
Expected: FAIL (cannot resolve `./EmptyState.jsx`).

- [ ] **Step 3: Implement `EmptyState.jsx`**

```jsx
const EXAMPLES = [
  { label: 'password123', value: 'password123' },
  { label: 'a passphrase', value: 'correct-horse-battery-staple' },
  { label: 'a strong one', value: 'Xy7!Qw9@Lm3#Zt5%Vb' },
];

export function EmptyState({ onPick }) {
  return (
    <div className="empty-state">
      <svg className="ghost-enso" viewBox="0 0 260 260" width="220" height="220" aria-hidden="true">
        <circle cx="130" cy="130" r="90" fill="none"
          stroke="var(--washi-faint)" strokeWidth="26" strokeLinecap="round"
          strokeDasharray="540 25" transform="rotate(-90 130 130)" />
      </svg>
      <p className="empty-invite">Type a password to see it come alive.</p>
      <div className="empty-examples">
        <span className="empty-examples-label">Try an example:</span>
        {EXAMPLES.map(ex => (
          <button key={ex.value} type="button" className="example-chip" onClick={() => onPick(ex.value)}>
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- EmptyState`
Expected: PASS (2 tests).

- [ ] **Step 5: Add empty-state styles to `src/App.css`**

Append:
```css
/* ====================== Empty state ====================== */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 24px 0 8px; text-align: center; }
.ghost-enso { animation: ghostBreath 6s ease-in-out infinite; }
@keyframes ghostBreath { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.9; } }
.empty-invite { font-family: var(--font-display); font-size: 1.05rem; color: var(--washi-dim); }
.empty-examples { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; }
.empty-examples-label { font-size: 0.72rem; color: var(--washi-dim); }
.example-chip {
  background: transparent; border: 1px solid var(--border2); color: var(--washi);
  font-size: 0.74rem; letter-spacing: 0.04em; padding: 6px 12px;
  transition: border-color 0.2s ease, color 0.2s ease;
}
.example-chip:hover { border-color: var(--vermilion); color: var(--vermilion); }
@media (prefers-reduced-motion: reduce) { .ghost-enso { animation: none; opacity: 0.7; } }
```

- [ ] **Step 6: Commit**

```bash
git add src/components/EmptyState.jsx src/components/EmptyState.test.jsx src/App.css
git commit -m "feat: add empty-state stage with example chips"
```

---

## Task 5: Make the input live + restructure App

**Files:**
- Modify: `src/components/PasswordInput.jsx`, `src/components/App.jsx`, `src/App.css`

- [ ] **Step 1: Remove the Analyze button from `PasswordInput.jsx`**

Replace the whole component body's return with (drop `onValidate`, `disabled`, the Enter handler, and the Analyze button — it's live now):
```jsx
import { useState } from 'react';

export function PasswordInput({ value, onChange }) {
  const [reveal, setReveal] = useState(false);

  return (
    <div className="password-input">
      <label className="field-label" htmlFor="pw">Password</label>

      <div className="input-row">
        <input
          id="pw"
          type={reveal ? 'text' : 'password'}
          className="pw-field"
          value={value}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          placeholder="Enter a password to analyze"
          onChange={e => onChange(e.target.value)}
        />
        <button
          type="button"
          className="reveal-btn"
          aria-pressed={reveal}
          onClick={() => setReveal(r => !r)}
        >
          {reveal ? 'hide' : 'show'}
        </button>
      </div>

      <div className="disclaimer-wrap">
        <span className="pv-left">YOUR PASSWORD IS NEVER SENT TO ANY SERVER OR STORED.</span>
        <span className="pv-right">CHECK YOUR SURROUNDINGS BEFORE REVEALING YOUR PASSWORD.</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `App.jsx` to drive the live hook + empty/reveal flow**

```jsx
import { useEffect, useRef, useState } from 'react';
import '../App.css';

import { useLiveValidation } from '../hooks/useLiveValidation.js';
import { PasswordInput } from './PasswordInput.jsx';
import { EmptyState } from './EmptyState.jsx';
import { ScoreDisplay } from './ScoreDisplay.jsx';
import { ThreatGauge } from './ThreatGauge.jsx';
import { RuleAnalysis } from './RuleAnalysis.jsx';
import { Recommendations } from './Recommendations.jsx';
import { AttackBreakdown } from './AttackBreakdown.jsx';
import { PolicyCompliance } from './PolicyCompliance.jsx';
import { ShareCard } from './ShareCard.jsx';
import { GeneratorPanel } from './GeneratorPanel.jsx';
import { PassphrasePanel } from './PassphrasePanel.jsx';
import { SafetyTips } from './SafetyTips.jsx';
import { ScoringExplainer } from './ScoringExplainer.jsx';

export default function App() {
  const [password, setPassword] = useState('');
  const { result, phase, isEmpty } = useLiveValidation(password);

  // One-time reveal when transitioning empty -> active.
  const [revealed, setRevealed] = useState(false);
  const wasEmpty = useRef(true);
  useEffect(() => {
    if (wasEmpty.current && !isEmpty) setRevealed(true);
    if (isEmpty) setRevealed(false);
    wasEmpty.current = isEmpty;
  }, [isEmpty]);

  return (
    <div className="container">
      <header className="app-header">
        <h1 className="app-title">Password Validator</h1>
        <p className="app-tagline">Strength analysis that never leaves your device.</p>
      </header>

      <PasswordInput value={password} onChange={setPassword} />

      {isEmpty && <EmptyState onPick={setPassword} />}

      {result && (
        <div className={revealed ? 'results results-reveal' : 'results'}>
          <ScoreDisplay result={result} phase={phase} />

          {result.hibpUnavailable && (
            <div className="hibp-warning">
              The breach database check could not be completed. This password has NOT been
              verified against known breaches. Retry when you have network connectivity.
            </div>
          )}

          <ThreatGauge crackSeconds={result.crackSeconds} crackTime={result.crackTime} />
          <RuleAnalysis result={result} phase={phase} />
          <Recommendations result={result} />

          <div className="deep-divider"><span>Deep analysis</span></div>

          <AttackBreakdown sequence={result.attackSequence} />
          <PolicyCompliance result={result} />
          <ShareCard result={result} />
        </div>
      )}

      <GeneratorPanel onUse={setPassword} />
      <PassphrasePanel onUse={setPassword} />

      <ScoringExplainer />
      <SafetyTips />

      <footer className="app-footer">
        BUILT BY BEN MICKENS ·{' '}
        <a href="https://github.com/cyberpsyon/password-validator" target="_blank" rel="noreferrer">
          [ SOURCE: GITHUB ]
        </a>
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Add reveal/stagger styles to `src/App.css`**

Append:
```css
/* ====================== Results reveal ====================== */
.results { display: flex; flex-direction: column; gap: 48px; }
.results-reveal > * { animation: revealUp 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) both; }
.results-reveal > *:nth-child(1) { animation-delay: 0ms; }
.results-reveal > *:nth-child(2) { animation-delay: 60ms; }
.results-reveal > *:nth-child(3) { animation-delay: 120ms; }
.results-reveal > *:nth-child(4) { animation-delay: 180ms; }
.results-reveal > *:nth-child(5) { animation-delay: 240ms; }
.results-reveal > *:nth-child(6) { animation-delay: 300ms; }
.results-reveal > *:nth-child(n+7) { animation-delay: 360ms; }
@keyframes revealUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .results-reveal > * { animation: none; } }
```

- [ ] **Step 4: Verify build + existing tests**

Run: `npm run build && npm run lint && npm test`
Expected: build OK, lint clean, tests pass.

- [ ] **Step 5: Manual check**

Run: `npm run dev`, open the URL. Confirm: empty state shows ghost ensō + chips; typing reveals results live; clearing returns to empty state; no Analyze button.

- [ ] **Step 6: Commit**

```bash
git add src/components/PasswordInput.jsx src/components/App.jsx src/App.css
git commit -m "feat: live-as-you-type flow with empty stage and reveal"
```

---

## Task 6: Number tweening on the score

**Files:**
- Create: `src/hooks/useTween.js`, `src/hooks/useReducedMotion.js`, `src/hooks/useTween.test.jsx`
- Modify: `src/components/ScoreDisplay.jsx`

- [ ] **Step 1: Implement `useReducedMotion.js`**

```js
import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const get = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [reduced, setReduced] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}
```

- [ ] **Step 2: Write the failing test for `useTween`**

`src/hooks/useTween.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTween } from './useTween.js';

describe('useTween', () => {
  it('returns the target immediately when disabled', () => {
    const { result } = renderHook(() => useTween(42, 400, false));
    expect(result.current).toBe(42);
  });

  it('starts from the target on first render when enabled', () => {
    const { result } = renderHook(() => useTween(10, 400, true));
    expect(typeof result.current).toBe('number');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- useTween`
Expected: FAIL (cannot resolve `./useTween.js`).

- [ ] **Step 4: Implement `useTween.js`**

```js
import { useEffect, useRef, useState } from 'react';

// Eased rAF tween toward `target`. When `enabled` is false (reduced motion),
// it snaps instantly.
export function useTween(target, duration = 400, enabled = true) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => { valueRef.current = value; });

  useEffect(() => {
    if (!enabled) { setValue(target); return; }
    const from = valueRef.current;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, enabled]);

  return value;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- useTween`
Expected: PASS (2 tests).

- [ ] **Step 6: Use the tween in `ScoreDisplay.jsx`**

At the top of `ScoreDisplay`, after `if (!result) return null;`, add:
```jsx
import { useTween } from '../hooks/useTween.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
```
Inside the component (after the early return):
```jsx
const reduced = useReducedMotion();
const animatedScore = Math.round(useTween(result.score, 700, !reduced));
const animatedEntropy = useTween(result.entropyBits, 500, !reduced);
```
Pass `animatedScore` to `<EnsoCircle score={animatedScore} ... />` and, if an entropy value is displayed anywhere in this component, render `animatedEntropy.toFixed(1)`. (The 3-metric breakdown text values stay as-is.) Add an ARIA live region at the end of the returned section:
```jsx
<span className="sr-only" aria-live="polite">
  Score {result.score} of {result.maxScore}, rating {result.rating}
</span>
```

- [ ] **Step 7: Add the `.sr-only` utility to `src/App.css`**

```css
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
```

- [ ] **Step 8: Verify and commit**

Run: `npm test && npm run build && npm run lint`
Expected: all green.
```bash
git add src/hooks/useTween.js src/hooks/useTween.test.jsx src/hooks/useReducedMotion.js src/components/ScoreDisplay.jsx src/App.css
git commit -m "feat: tween the score numeral and entropy"
```

---

## Task 7: Threat gauge cascade

**Files:**
- Modify: `src/components/ThreatGauge.jsx`, `src/App.css`

- [ ] **Step 1: Add a keyed cascade to `ThreatGauge.jsx`**

Give the filled segments a staggered transition by setting a CSS custom property for index and remounting on crack change. Change the segment `<div>` to:
```jsx
<div
  key={seg.label}
  className="gauge-seg"
  title={seg.label}
  style={{ background: seg.color, opacity: i <= active ? 1 : 0.11, '--seg-i': i }}
/>
```
Add a `key` to the `.gauge-track` so it re-runs the cascade when the active index changes:
```jsx
<div className="gauge-track" key={active}>
```

- [ ] **Step 2: Add cascade CSS to `src/App.css`**

```css
.gauge-track .gauge-seg { animation: segIn 0.45s ease both; animation-delay: calc(var(--seg-i) * 55ms); }
@keyframes segIn { from { opacity: 0; transform: scaleY(0.4); } }
@media (prefers-reduced-motion: reduce) { .gauge-track .gauge-seg { animation: none; } }
```
Note: `segIn` sets the starting state; the inline `opacity` provides the final value.

- [ ] **Step 3: Verify and commit**

Run: `npm run build && npm test`
Expected: green. Manually confirm the gauge cascades when a result settles.
```bash
git add src/components/ThreatGauge.jsx src/App.css
git commit -m "feat: cascade the threat gauge segments"
```

---

# PHASE 2 — Signature (generative password DNA)

## Task 8: `dna.js` — seed + geometry

**Files:**
- Create: `src/lib/dna.js`, `src/lib/dna.test.js`, `src/test/factories.js`

- [ ] **Step 1: Create the test factory**

`src/test/factories.js`:
```js
// Minimal fake `result` objects shaped like fullValidate output.
export function makeResult(overrides = {}) {
  return {
    score: 100, maxScore: 100, rating: 'EXCELLENT', length: 18,
    crackSeconds: 5e10, entropyBits: 60,
    chars: { hasUpper: true, hasLower: true, hasDigit: true, hasSpecial: true },
    attackSequence: [{ tag: 'BRUTE', token: 'x', description: '', severity: 'none' }],
    ...overrides,
  };
}
```

- [ ] **Step 2: Write the failing test**

`src/lib/dna.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { dnaSeed, dnaGeometry } from './dna.js';
import { makeResult } from '../test/factories.js';

describe('dna', () => {
  it('is deterministic: same profile -> same geometry', () => {
    const a = dnaGeometry(makeResult());
    const b = dnaGeometry(makeResult());
    expect(a).toEqual(b);
  });

  it('is content-independent: different secrets, same profile -> same seed', () => {
    // The factory carries no password field; seed must derive only from profile.
    const s1 = dnaSeed(makeResult({ score: 100 }));
    const s2 = dnaSeed(makeResult({ score: 100 }));
    expect(s1).toBe(s2);
  });

  it('different strength profiles -> different seeds', () => {
    const weak = dnaSeed(makeResult({ entropyBits: 4, length: 6, rating: 'WEAK', crackSeconds: 1 }));
    const strong = dnaSeed(makeResult({ entropyBits: 60, length: 18, rating: 'EXCELLENT', crackSeconds: 5e10 }));
    expect(weak).not.toBe(strong);
  });

  it('produces rings and nodes', () => {
    const g = dnaGeometry(makeResult());
    expect(g.rings.length).toBeGreaterThan(0);
    expect(Array.isArray(g.nodes)).toBe(true);
    expect(typeof g.color).toBe('string');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- dna`
Expected: FAIL (cannot resolve `./dna.js`).

- [ ] **Step 4: Implement `dna.js`**

```js
// Generative "password DNA". Seeded ONLY from the strength profile (entropy,
// length, character classes, crack-time bucket, rating, attack-pattern tags) —
// never the password content. Identical profiles therefore yield identical art,
// which reveals nothing about the secret.

const RATING_COLOR = {
  EXCELLENT: '#5C9E6E', STRONG: '#5C9E6E', GOOD: '#A89050',
  FAIR: '#B86B3A', WEAK: '#C44040',
};

function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function crackBucket(seconds) {
  const limits = [60, 3600, 86400, 2592000, 31536000, 315360000, 3153600000];
  for (let i = 0; i < limits.length; i++) if (seconds < limits[i]) return i;
  return limits.length;
}

export function dnaSeed(result) {
  const c = result.chars;
  const classes = `${+c.hasUpper}${+c.hasLower}${+c.hasDigit}${+c.hasSpecial}`;
  const tags = [...new Set(result.attackSequence.map(s => s.tag))].sort().join(',');
  const profile = [
    Math.round(result.entropyBits),
    result.length,
    classes,
    crackBucket(result.crackSeconds),
    result.rating,
    tags,
  ].join('|');
  return cyrb53(profile);
}

function entropyTier(bits) {
  if (bits < 28) return 1;
  if (bits < 36) return 2;
  if (bits < 50) return 3;
  if (bits < 70) return 4;
  return 5;
}

export function dnaGeometry(result) {
  const rand = mulberry32(dnaSeed(result) >>> 0);
  const color = RATING_COLOR[result.rating] ?? '#C44040';
  const ringCount = entropyTier(result.entropyBits);
  const baseR = 30;
  const step = 18;

  const rings = Array.from({ length: ringCount }, (_, i) => {
    const r = baseR + i * step;
    const circumference = 2 * Math.PI * r;
    const gap = circumference * (0.05 + rand() * 0.12); // ensō opening
    return {
      r,
      strokeWidth: 2 + rand() * 3,
      rotation: Math.floor(rand() * 360),
      dash: `${(circumference - gap).toFixed(1)} ${gap.toFixed(1)}`,
      circumference: circumference.toFixed(1),
      opacity: 0.55 + rand() * 0.45,
    };
  });

  const nodeCount = Math.min(Math.max(result.length, 3), 24);
  const outer = baseR + (ringCount - 1) * step + step * 0.6;
  const nodes = Array.from({ length: nodeCount }, () => {
    const angle = rand() * Math.PI * 2;
    const radius = baseR + rand() * (outer - baseR);
    return {
      x: 130 + Math.cos(angle) * radius,
      y: 130 + Math.sin(angle) * radius,
      r: 1.5 + rand() * 1.8,
    };
  });

  // Weakness flaws: one red marker per critical/moderate attack tag.
  const flawCount = result.attackSequence.filter(s => s.severity === 'critical' || s.severity === 'moderate').length;
  const flaws = Array.from({ length: Math.min(flawCount, 6) }, () => {
    const angle = rand() * Math.PI * 2;
    return { x: 130 + Math.cos(angle) * outer, y: 130 + Math.sin(angle) * outer, r: 3 };
  });

  return { rings, nodes, flaws, color, viewBox: '0 0 260 260' };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- dna`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/dna.js src/lib/dna.test.js src/test/factories.js
git commit -m "feat: privacy-safe generative password DNA geometry"
```

---

## Task 9: `DnaArt` component + wire into App

**Files:**
- Create: `src/components/DnaArt.jsx`, `src/components/DnaArt.test.jsx`
- Modify: `src/components/App.jsx`, `src/App.css`

- [ ] **Step 1: Write the failing test**

`src/components/DnaArt.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DnaArt } from './DnaArt.jsx';
import { makeResult } from '../test/factories.js';

describe('DnaArt', () => {
  it('renders an svg with ring paths', () => {
    const { container } = render(<DnaArt result={makeResult()} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelectorAll('circle').length).toBeGreaterThan(0);
  });

  it('renders nothing without a result', () => {
    const { container } = render(<DnaArt result={null} />);
    expect(container.querySelector('svg')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- DnaArt`
Expected: FAIL (cannot resolve `./DnaArt.jsx`).

- [ ] **Step 3: Implement `DnaArt.jsx`**

```jsx
import { useMemo } from 'react';
import { dnaGeometry } from '../lib/dna.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

export function DnaArt({ result }) {
  const reduced = useReducedMotion();
  const geo = useMemo(() => (result ? dnaGeometry(result) : null), [result]);
  if (!geo) return null;

  return (
    <section className="dna-art">
      <div className="panel-head"><span className="panel-title">Password DNA</span></div>
      <p className="section-note">A fingerprint of this password's strength — derived from its profile, never its contents.</p>
      <div className="dna-canvas">
        <svg viewBox={geo.viewBox} width="220" height="220" role="img" aria-label="Generative strength fingerprint">
          <g fill="none" stroke={geo.color} strokeLinecap="round">
            {geo.rings.map((ring, i) => (
              <circle
                key={i}
                cx="130" cy="130" r={ring.r}
                strokeWidth={ring.strokeWidth}
                strokeDasharray={ring.dash}
                opacity={ring.opacity}
                transform={`rotate(${ring.rotation} 130 130)`}
                className={reduced ? undefined : 'dna-ring'}
                style={reduced ? undefined : { strokeDasharray: ring.circumference, animationDelay: `${i * 120}ms`, ['--dna-circ']: ring.circumference }}
              />
            ))}
          </g>
          <g fill="var(--washi)">
            {geo.nodes.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={n.r} />)}
          </g>
          <g fill="var(--red)">
            {geo.flaws.map((f, i) => <circle key={i} cx={f.x} cy={f.y} r={f.r} />)}
          </g>
        </svg>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- DnaArt`
Expected: PASS (2 tests).

- [ ] **Step 5: Add DNA styles + draw-on animation to `src/App.css`**

```css
/* ====================== Password DNA ====================== */
.dna-art { display: flex; flex-direction: column; gap: 12px; }
.dna-canvas { display: flex; justify-content: center; padding: 8px 0; }
.dna-ring { animation: dnaDraw 1s ease both; }
@keyframes dnaDraw { from { stroke-dashoffset: var(--dna-circ, 600); opacity: 0; } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) { .dna-ring { animation: none; } }
```
Note: animated rings override `strokeDasharray` to the full circumference and animate `stroke-dashoffset` from `--dna-circ` to 0, so the ring inks on as a closed circle. The reduced-motion path keeps the `strokeDasharray={ring.dash}` attribute, showing the static ensō opening. Acceptable, documented tradeoff (motion = closed ink-on; still = ensō gap).

- [ ] **Step 6: Wire `DnaArt` into `App.jsx`**

Add the import:
```jsx
import { DnaArt } from './DnaArt.jsx';
```
Place it right after `<ScoreDisplay .../>` and its HIBP warning, before `<ThreatGauge .../>`:
```jsx
<DnaArt result={result} />
```

- [ ] **Step 7: Verify and commit**

Run: `npm test && npm run build && npm run lint`
Expected: green. Manually confirm the art renders and inks on when a result settles.
```bash
git add src/components/DnaArt.jsx src/components/DnaArt.test.jsx src/components/App.jsx src/App.css
git commit -m "feat: render the password DNA art"
```

---

# PHASE 3 — Polish & share

## Task 10: Washi/Sumi theme

**Files:**
- Create: `src/hooks/usePref.js`, `src/components/ThemeToggle.jsx`
- Modify: `src/App.css`, `src/components/App.jsx`

- [ ] **Step 1: Implement `usePref.js`**

```js
import { useEffect, useState } from 'react';

// localStorage-backed preference with a default fallback.
export function usePref(key, fallback) {
  const [value, setValue] = useState(() => {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }, [key, value]);
  return [value, setValue];
}
```

- [ ] **Step 2: Add the washi (light) theme tokens to `src/App.css`**

After the existing `:root { ... }` block, append an override:
```css
:root[data-theme="washi"] {
  --bg:          #EDE4D3;
  --surface:     #E4D9C4;
  --surface2:    #DBCFB6;
  --border:      #CFC1A6;
  --border2:     #BFAE8E;
  --washi:       #2A2018;
  --washi-dim:   rgba(42, 32, 24, 0.55);
  --washi-faint: rgba(42, 32, 24, 0.18);
  --vermilion:   #C0392B;
}
:root[data-theme="washi"] body {
  background-image:
    linear-gradient(rgba(42,32,24,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(42,32,24,0.02) 1px, transparent 1px);
}
:root { color-scheme: dark; }
:root[data-theme="washi"] { color-scheme: light; }
```

- [ ] **Step 3: Implement `ThemeToggle.jsx`**

```jsx
import { useEffect } from 'react';
import { usePref } from '../hooks/usePref.js';

export function ThemeToggle() {
  const initial = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'washi' : 'sumi';
  const [theme, setTheme] = usePref('pv-theme', initial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'washi' ? 'washi' : 'sumi';
  }, [theme]);

  return (
    <button type="button" className="settings-btn" aria-pressed={theme === 'washi'}
      onClick={() => setTheme(t => (t === 'washi' ? 'sumi' : 'washi'))}>
      {theme === 'washi' ? 'sumi' : 'washi'} theme
    </button>
  );
}
```

- [ ] **Step 4: Add a settings row to `App.jsx`**

Add the import `import { ThemeToggle } from './ThemeToggle.jsx';` and place a settings bar just inside `.container`, before `<header>`:
```jsx
<div className="settings-bar"><ThemeToggle /></div>
```

- [ ] **Step 5: Add settings styles to `src/App.css`**

```css
.settings-bar { display: flex; justify-content: flex-end; gap: 10px; }
.settings-btn {
  background: transparent; border: 1px solid var(--border2); color: var(--washi-dim);
  font-size: 0.66rem; letter-spacing: 0.08em; padding: 6px 12px;
  transition: color 0.2s ease, border-color 0.2s ease;
}
.settings-btn:hover, .settings-btn[aria-pressed="true"] { color: var(--vermilion); border-color: var(--vermilion); }
```

- [ ] **Step 6: Verify and commit**

Run: `npm run build && npm test`
Expected: green. Manually toggle theme; confirm it persists across reload.
```bash
git add src/hooks/usePref.js src/components/ThemeToggle.jsx src/components/App.jsx src/App.css
git commit -m "feat: washi/sumi theme toggle"
```

---

## Task 11: Reduced-motion toggle + accessibility pass

**Files:**
- Modify: `src/components/SettingsBar.jsx` (new), `src/components/App.jsx`, `src/App.css`

- [ ] **Step 1: Create `SettingsBar.jsx` bundling the toggles**

```jsx
import { useEffect } from 'react';
import { usePref } from '../hooks/usePref.js';
import { ThemeToggle } from './ThemeToggle.jsx';

export function SettingsBar() {
  const [noMotion, setNoMotion] = usePref('pv-reduce-motion', false);

  useEffect(() => {
    document.documentElement.classList.toggle('force-reduce-motion', noMotion);
  }, [noMotion]);

  return (
    <div className="settings-bar">
      <ThemeToggle />
      <button type="button" className="settings-btn" aria-pressed={noMotion}
        onClick={() => setNoMotion(v => !v)}>
        {noMotion ? 'motion off' : 'motion on'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Honor the manual override in CSS**

Append to `src/App.css` (mirrors the `prefers-reduced-motion` rules for the manual class):
```css
.force-reduce-motion *, .force-reduce-motion *::before, .force-reduce-motion *::after {
  animation: none !important;
  transition: none !important;
}
```

- [ ] **Step 3: Swap `ThemeToggle` for `SettingsBar` in `App.jsx`**

Replace the import and the `<div className="settings-bar"><ThemeToggle /></div>` line with:
```jsx
import { SettingsBar } from './SettingsBar.jsx';
// ...
<SettingsBar />
```

- [ ] **Step 4: Accessibility sweep**

Confirm in `App.jsx` and components: the `.sr-only` live region (Task 6) announces score/rating; all interactive elements are `<button>`/`<input>` with labels; the DNA `<svg>` has `role="img"` + `aria-label`. Add `aria-busy={phase === 'checking'}` to the `.results` wrapper in `App.jsx`.

- [ ] **Step 5: Verify and commit**

Run: `npm run build && npm test && npm run lint`
Expected: green. Manually: enable "motion off", confirm animations stop; tab through the UI and confirm focus rings.
```bash
git add src/components/SettingsBar.jsx src/components/App.jsx src/App.css
git commit -m "feat: reduced-motion toggle and a11y pass"
```

---

## Task 12: PNG export of the share card

**Files:**
- Modify: `package.json`, `src/lib/shareImage.js` (new), `src/components/ShareCard.jsx`

- [ ] **Step 1: Install `html-to-image`**

Run: `npm install html-to-image`
Expected: added to `dependencies`.

- [ ] **Step 2: Create `src/lib/shareImage.js`**

```js
import { toPng } from 'html-to-image';

// Rasterize a DOM node to a PNG and trigger a download.
export async function downloadNodeAsPng(node, filename = 'password-report.png') {
  if (!node) return;
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
```

- [ ] **Step 3: Wire export into `ShareCard.jsx`**

Add at top: `import { useRef } from 'react';` (merge with existing `useState` import) and `import { downloadNodeAsPng } from '../lib/shareImage.js';`. Add a ref on the `.share-report` div: `const cardRef = useRef(null);` → `<div className="share-report" ref={cardRef}>`. Add a button next to the existing copy button:
```jsx
<button type="button" className="copy-btn" onClick={() => downloadNodeAsPng(cardRef.current)}>
  download png
</button>
```

- [ ] **Step 4: Verify and commit**

Run: `npm run build && npm test`
Expected: green. Manually click "download png"; confirm a PNG of the report downloads.
```bash
git add package.json package-lock.json src/lib/shareImage.js src/components/ShareCard.jsx
git commit -m "feat: export the share card as a PNG"
```

---

## Task 13: Optional sound cues

**Files:**
- Create: `src/lib/sound.js`
- Modify: `src/components/SettingsBar.jsx`, `src/components/App.jsx`

- [ ] **Step 1: Create `src/lib/sound.js`**

```js
// Lazy, subtle Web Audio cues. No-ops until enabled and after a user gesture.
let ctx = null;
let enabled = false;

export function setSoundEnabled(on) { enabled = on; }

function audio() {
  if (!enabled) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function playTick() {
  const ac = audio(); if (!ac) return;
  const o = ac.createOscillator(); const g = ac.createGain();
  o.type = 'sine'; o.frequency.value = 660;
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.05, ac.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.18);
  o.connect(g).connect(ac.destination);
  o.start(); o.stop(ac.currentTime + 0.2);
}

export function playReveal() {
  const ac = audio(); if (!ac) return;
  const o = ac.createOscillator(); const g = ac.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(220, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.25);
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.04, ac.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.4);
  o.connect(g).connect(ac.destination);
  o.start(); o.stop(ac.currentTime + 0.42);
}
```

- [ ] **Step 2: Add the sound toggle to `SettingsBar.jsx`**

Add `import { setSoundEnabled } from '../lib/sound.js';` and:
```jsx
const [sound, setSound] = usePref('pv-sound', false);
useEffect(() => { setSoundEnabled(sound); }, [sound]);
```
Add a button:
```jsx
<button type="button" className="settings-btn" aria-pressed={sound}
  onClick={() => setSound(v => !v)}>
  {sound ? 'sound on' : 'sound off'}
</button>
```

- [ ] **Step 3: Trigger cues from `App.jsx`**

Add `import { playReveal, playTick } from '../lib/sound.js';`. In the reveal effect, after `setRevealed(true)`, call `playReveal();`. Add an effect that plays a tick when the rating tier changes:
```jsx
const prevRating = useRef(null);
useEffect(() => {
  if (result && result.rating !== prevRating.current) {
    if (prevRating.current !== null) playTick();
    prevRating.current = result.rating;
  }
}, [result]);
```

- [ ] **Step 4: Verify and commit**

Run: `npm run build && npm test && npm run lint`
Expected: green. Manually enable sound; confirm a soft cue on reveal and on tier change; confirm silence when off.
```bash
git add src/lib/sound.js src/components/SettingsBar.jsx src/components/App.jsx
git commit -m "feat: optional subtle sound cues"
```

---

## Final verification

- [ ] **Step 1: Full suite**

Run: `npm test && npm run lint && npm run build`
Expected: all tests pass, lint clean, build succeeds.

- [ ] **Step 2: Manual checklist (dev server)**

Run `npm run dev` and confirm: empty stage → reveal on first type; live updates while typing; HIBP "checking…" then resolves; ensō + score tween; DNA art inks on; threat gauge cascades; theme toggle persists; motion-off stops animation; PNG downloads; sound cues when enabled; mobile at 390px is intact; no Inter/Roboto/amber, no rounded corners.

- [ ] **Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "polish: final UI/UX overhaul fixes"
```
