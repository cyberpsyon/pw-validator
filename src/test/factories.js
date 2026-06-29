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
