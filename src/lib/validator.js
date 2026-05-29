import zxcvbn from 'zxcvbn';

// --- Constants (match password_validator.py) ---
export const MIN_LENGTH = 15;
export const MAX_LENGTH = 128;
export const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// Crack-time -> points. Default 50 (100+ years); first band the time falls
// under wins. Mirrors _CRACK_THRESHOLDS.
const CRACK_THRESHOLDS = [
  [1,           0],   // < 1 second
  [60,          5],   // < 1 minute
  [3600,        10],  // < 1 hour
  [86400,       20],  // < 1 day
  [31536000,    30],  // < 1 year
  [3153600000,  40],  // < 100 years
];

const RATING_THRESHOLDS = [
  [100, 'EXCELLENT'],
  [80,  'STRONG'],
  [60,  'GOOD'],
  [40,  'FAIR'],
];

// --- Character analysis ---
export function analyzeChars(password) {
  return {
    hasUpper:   /[A-Z]/.test(password),
    hasLower:   /[a-z]/.test(password),
    hasDigit:   /[0-9]/.test(password),
    hasSpecial: [...password].some(c => SPECIAL_CHARS.includes(c)),
    upperCount: (password.match(/[A-Z]/g) || []).length,
    lowerCount: (password.match(/[a-z]/g) || []).length,
    digitCount: (password.match(/[0-9]/g) || []).length,
    specialCount: [...password].filter(c => SPECIAL_CHARS.includes(c)).length,
  };
}

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

function crackPoints(crackSeconds) {
  for (const [limit, pts] of CRACK_THRESHOLDS) {
    if (crackSeconds < limit) return pts;
  }
  return 50;
}

export function getRating(score) {
  for (const [threshold, label] of RATING_THRESHOLDS) {
    if (score >= threshold) return label;
  }
  return 'WEAK';
}

// --- Attack sequence (mirrors _parse_attack_sequence) ---
const DICT_DESCRIPTIONS = {
  passwords:          'common password',
  english_wikipedia:  'common English word',
  surnames:           'common surname',
  male_names:         'common first name',
  female_names:       'common first name',
  us_tv_and_film:     'word from TV/film',
};

export function buildAttackSequence(sequence) {
  return (sequence || []).map(match => {
    const pattern = match.pattern || 'bruteforce';
    let tag, severity, description;

    if (pattern === 'dictionary') {
      tag = 'DICT';
      severity = 'critical';
      description = DICT_DESCRIPTIONS[match.dictionary_name] || 'common dictionary word';
      if (match.l33t)     description += ' (leetspeak substitution)';
      if (match.reversed) description += ' (reversed)';
    } else if (pattern === 'spatial') {
      tag = 'KEY';
      severity = 'critical';
      description = `keyboard walk (${match.graph || 'keyboard'})`;
    } else if (pattern === 'repeat') {
      tag = 'RPT';
      severity = 'low';
      description = 'repeated character or string';
    } else if (pattern === 'sequence') {
      tag = 'SEQ';
      severity = 'moderate';
      description = 'sequential characters (abc, 123)';
    } else if (pattern === 'regex') {
      tag = 'RPT';
      severity = 'low';
      description = 'single character class';
    } else if (pattern === 'date') {
      tag = 'DATE';
      severity = 'moderate';
      description = 'date or year pattern';
    } else {
      tag = 'BRUTE';
      severity = 'none';
      description = 'no pattern detected';
    }

    return { tag, token: match.token || '', description, severity };
  });
}

// --- Policy compliance (mirrors _compute_policy_compliance) ---
export function computeCompliance(password, breachFound) {
  const c = analyzeChars(password);
  return {
    cs_length:     password.length >= 8,
    cs_complexity: c.hasUpper && c.hasLower && c.hasDigit && c.hasSpecial,
    nist_length:   password.length >= MIN_LENGTH,
    nist_breach:   !breachFound,
  };
}

// --- Per-metric tiers for the score breakdown (mirrors app.py helpers) ---
export function crackTimeTier(seconds) {
  if (seconds < 3600) return 'bad';
  if (seconds < 31536000) return 'mid';
  return 'good';
}

export function breachTier(hibpCount, unavailable) {
  if (unavailable) return 'unknown';
  return hibpCount ? 'bad' : 'good';
}

export function lengthTier(n) {
  if (n < 12) return 'bad';
  if (n < MIN_LENGTH) return 'mid';
  return 'good';
}

export function formatBreachCount(count) {
  if (count === null || count === undefined || count === 0) return 'Clean';
  if (count < 1000) return `Pwned ${count}×`;
  if (count < 1000000) return `Pwned ${(count / 1000).toFixed(1)}K×`;
  return `Pwned ${(count / 1000000).toFixed(1)}M×`;
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

function emptyResult(message) {
  return {
    score: 0,
    maxScore: 100,
    rating: 'WEAK',
    hardFail: true,
    crackTime: '',
    crackSeconds: 0,
    entropyBits: 0,
    guesses: 0,
    passed: [],
    failed: [message],
    warning: '',
    suggestions: [],
    attackSequence: [],
    hibpCount: null,
    hibpPending: false,
    hibpUnavailable: false,
    breachFound: false,
    compliance: computeCompliance('', false),
    chars: analyzeChars(''),
  };
}
