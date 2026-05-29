import { SPECIAL_CHARS } from './validator.js';
import { EFF_WORDLIST } from './eff_wordlist.js';

const UPPER   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER   = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS  = '0123456789';

export function generatePassword({ length = 20, useUpper = true, useLower = true,
                                   useDigits = true, useSpecial = true } = {}) {
  let charset = '';
  const required = [];

  if (useUpper)   { charset += UPPER;   required.push(randomChar(UPPER)); }
  if (useLower)   { charset += LOWER;   required.push(randomChar(LOWER)); }
  if (useDigits)  { charset += DIGITS;  required.push(randomChar(DIGITS)); }
  if (useSpecial) { charset += SPECIAL_CHARS; required.push(randomChar(SPECIAL_CHARS)); }

  if (!charset) return null;

  const remaining = Array.from({ length: length - required.length },
    () => randomChar(charset));

  return shuffle([...required, ...remaining]).join('');
}

// Uniform random integer in [0, max) from the CSPRNG, using rejection
// sampling to eliminate modulo bias.
function randomInt(max) {
  if (max <= 0) return 0;
  const arr = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  let value;
  do {
    crypto.getRandomValues(arr);
    value = arr[0];
  } while (value >= limit);
  return value % max;
}

function randomChar(str) {
  return str[randomInt(str.length)];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Flat list of the EFF words (the Map is keyed by dice rolls; the real app
// just picks random words, so we draw from the values).
const WORDS = [...EFF_WORDLIST.values()];

// Mirrors _LEET_MAP in password_validator.py.
const LEET_MAP = {
  a: '@', e: '3', i: '1', o: '0', s: '$',
  t: '7', l: '!', g: '9', b: '8',
};

function applyLeet(word) {
  return [...word].map(c => LEET_MAP[c] ?? c).join('');
}

export function generatePassphrase({ wordCount = 4, separator = '-',
                                     useUpper = false, useLeet = false,
                                     useDigits = false, useSpecial = false } = {}) {
  if (WORDS.length === 0) return null;

  let words = Array.from({ length: wordCount }, () => randomChar(WORDS));

  if (useUpper)   words = words.map(w => w.charAt(0).toUpperCase() + w.slice(1));
  if (useLeet)    words = words.map(applyLeet);
  if (useDigits)  words = words.map(w => w + randomInt(10));            // append a digit per word
  if (useSpecial) words = words.map(w => w + randomChar(SPECIAL_CHARS)); // append a symbol per word

  return words.join(separator);
}
