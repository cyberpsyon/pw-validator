# Password Validator

A real-time password strength auditor that scores your password against 850M+ breached passwords and modern cracking benchmarks — entirely in your browser. Type the password you actually use: it never leaves the page. The breach check sends only the first 5 characters of its SHA-1 hash, which match hundreds of unrelated passwords, so nothing identifying is transmitted. No accounts, no logging, no storage.

**Live at [password.cyberpsyon.com](https://password.cyberpsyon.com)**

## Features

- **Live scoring as you type** — a 0–100 score with an ensō ring that completes as strength climbs, rated WEAK → FAIR → GOOD → STRONG → EXCELLENT
- **Breach database check** — queries the [Have I Been Pwned](https://haveibeenpwned.com/Passwords) Pwned Passwords API using k-anonymity: only the first 5 characters of a SHA-1 hash ever leave your browser, so the password itself is never transmitted. The check matches exact strings, so it only tells you about the password you actually type — a lookalike answers a different question
- **Crack-time estimation** — powered by [zxcvbn](https://github.com/dropbox/zxcvbn), modeling an offline attack against bcrypt at 10,000 guesses/second, with entropy (bits) and raw guess counts
- **Attack sequence breakdown** — shows exactly how a cracker would decompose your password (dictionary words, keyboard patterns, dates, sequences, l33t substitutions)
- **Rule analysis & recommendations** — pass/fail on each scoring rule with concrete suggestions for improvement
- **Policy compliance** — compares your password against a typical legacy corporate policy and NIST SP 800-63B, side by side
- **Password & passphrase generator** — CSPRNG-backed (rejection sampling, no modulo bias). Toggle between random passwords (configurable length and character sets) and EFF-wordlist passphrases (configurable word count, separator, and l33t substitutions). Generated passwords are created locally and never transmitted, so they're safe to audit and then adopt for real use
- **Shareable score card** — export a PNG of your results (score only, never the password) to challenge others
- **Scoring explainer & safety tips** — full transparency on how every point is earned
- **Dark/light theme** and `prefers-reduced-motion` support

## How to use

1. Type or paste a password into the input field. Analysis runs locally and updates as you type.
2. Character-level scoring appears instantly; the breach check and crack-time analysis resolve a moment later.
3. Review the deep analysis: how an attacker would break the password down, and which policies it passes.
4. Not strong enough? Use the built-in generator to mint a random password or passphrase, then click **Use** to audit it.
5. Optionally download the share card to compare scores with friends — it contains your score and rating, never the password.

## Scoring model

100 points across 7 categories:

| Category | Points |
|---|---|
| Length (15+ characters) | 10 |
| Contains uppercase letters | 5 |
| Contains lowercase letters | 5 |
| Contains numbers | 5 |
| Contains special characters | 5 |
| Not found in breach databases | 20 |
| Crack-time resistance | 0–50 |

Crack-time resistance is the single largest factor: from 0 points (cracked in under a second) up to 50 points (100+ years).

## Privacy

- All analysis runs client-side (zxcvbn runs in a Web Worker to keep the UI responsive).
- The only network request is the k-anonymized HIBP range query — 5 hash characters, with response padding enabled. Your password never leaves the browser.
- Nothing is stored, logged, or sent anywhere else. If the HIBP API is unreachable, the app says so explicitly rather than silently skipping the check.

## Development

```bash
npm install
npm run dev        # Vite dev server
npm test           # Vitest
npm run lint       # ESLint
npm run build      # production build to dist/
npm run deploy     # build + deploy to Cloudflare Pages
```

## Tech stack

React 19 + Vite, zxcvbn in a Web Worker, [html-to-image](https://github.com/bubkoo/html-to-image) for the share card, deployed on Cloudflare Pages.

---

Built by Ben Mickens · [github.com/cyberpsyon/pw-validator](https://github.com/cyberpsyon/pw-validator)
