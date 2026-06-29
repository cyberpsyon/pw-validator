import zxcvbn from 'zxcvbn';
import {
  MIN_LENGTH,
  MAX_LENGTH,
  SPECIAL_CHARS,
  analyzeChars,
  crackPoints,
  getRating,
  buildAttackSequence,
  computeCompliance,
  emptyResult,
} from './validator-core.js';

// This module is the ONLY one that imports zxcvbn, so zxcvbn is bundled only
// where this is imported — the worker (src/lib/validator.worker.js). The main
// thread imports the zxcvbn-free helpers from ./validator-core.js instead.

// --- zxcvbn crack analysis (bcrypt truncates at 72 bytes, like the Python) ---
export function getCrackAnalysis(password) {
  const result = zxcvbn(password.slice(0, 72));
  const seconds = result.crack_times_seconds.offline_slow_hashing_1e4_per_second;
  const guesses = Number(result.guesses);
  return {
    crackSeconds: seconds,
    crackTimeDisplay: result.crack_times_display.offline_slow_hashing_1e4_per_second,
    guesses,
    entropyBits: Math.round(Math.log2(Math.max(guesses, 1)) * 10) / 10,
    warning: result.feedback.warning,
    suggestions: result.feedback.suggestions,
    sequence: result.sequence,
  };
}

// --- Master validate function ---
// hibpResult shapes:
//   { pending: true }          -> breach check still in flight
//   { count: null, error: true } -> HIBP unavailable
//   { count: 0 }               -> clean
//   { count: N }               -> found N times
export function fullValidate(password, hibpResult) {
  // Guard rails matching validate_password()
  if (!password) {
    return emptyResult('Password cannot be empty');
  }
  if (password.length > MAX_LENGTH) {
    return emptyResult(`Password too long (max ${MAX_LENGTH} characters)`);
  }

  const chars = analyzeChars(password);
  const crack = getCrackAnalysis(password);

  const pending     = !!hibpResult?.pending;
  const unavailable = !pending && (hibpResult?.error || hibpResult?.count == null);
  const hibpCount   = pending || unavailable ? null : hibpResult.count;
  const breachFound = !pending && !unavailable && hibpCount > 0;

  const passed = [];
  const failed = [];
  let score = 0;

  // Rule 1 — length (binary, 10 pts)
  if (password.length >= MIN_LENGTH) {
    score += 10;
    passed.push(`✓ Length requirement met (${password.length} characters)`);
  } else {
    failed.push(`✗ Too short (needs ${MIN_LENGTH}+ characters, has ${password.length})`);
  }

  // Rules 2-5 — character classes (5 pts each)
  if (chars.hasUpper) { score += 5; passed.push('✓ Contains uppercase letters'); }
  else failed.push('○ No uppercase letters');

  if (chars.hasLower) { score += 5; passed.push('✓ Contains lowercase letters'); }
  else failed.push('○ No lowercase letters');

  if (chars.hasDigit) { score += 5; passed.push('✓ Contains numbers'); }
  else failed.push('○ No numbers');

  if (chars.hasSpecial) { score += 5; passed.push('✓ Contains special characters'); }
  else failed.push(`○ No special characters (${SPECIAL_CHARS})`);

  // Rule 6 — breach databases (20 pts)
  if (pending) {
    // breach check resolves in phase 2; no row, no points yet
  } else if (unavailable) {
    failed.push('⚠ HIBP API unavailable: cannot verify against breach database');
  } else if (breachFound) {
    failed.push(`✗ Found in Have I Been Pwned database (${hibpCount.toLocaleString()} breaches) (CRITICAL)`);
  } else {
    score += 20;
    passed.push('✓ Not found in breach databases');
  }

  // Rule 7 — crack time resistance (0-50 pts)
  const crackPts = crackPoints(crack.crackSeconds);
  score += crackPts;
  if (crackPts > 0) {
    passed.push(`✓ Crack time resistance (${crackPts}/50 points)`);
  } else {
    failed.push('✗ Crack time resistance: cracks in under 1 second (0/50 points)');
  }

  // Auto-WEAK: crackable in under 1 hour OR found in a breach
  const hardFail = crack.crackSeconds < 3600 || breachFound;
  const rating = hardFail ? 'WEAK' : getRating(score);

  const compliance = computeCompliance(password, breachFound);

  return {
    score,
    maxScore: 100,
    rating,
    hardFail,
    length: password.length,
    crackTime: crack.crackTimeDisplay,
    crackSeconds: crack.crackSeconds,
    entropyBits: crack.entropyBits,
    guesses: crack.guesses,
    passed,
    failed,
    warning: crack.warning,
    suggestions: crack.suggestions,
    attackSequence: buildAttackSequence(crack.sequence),
    hibpCount,
    hibpPending: pending,
    hibpUnavailable: unavailable,
    breachFound,
    compliance,
    chars,
  };
}
