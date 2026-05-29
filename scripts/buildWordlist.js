// One-time build script: node scripts/buildWordlist.js
// Converts the EFF large wordlist (DDDDD\tword per line) into a JS module
// exporting a Map keyed by the 5-digit dice roll string.
import fs from 'fs';

const input = process.argv[2] || 'eff_wordlist.txt';
const output = 'src/lib/eff_wordlist.js';

const lines = fs.readFileSync(input, 'utf8').trim().split('\n');
const entries = lines.map(line => {
  const [num, word] = line.split('\t');
  return `  ['${num.trim()}', '${word.trim()}']`;
});
fs.writeFileSync(output,
  `export const EFF_WORDLIST = new Map([\n${entries.join(',\n')}\n]);\n`);

console.log(`Wrote ${entries.length} entries to ${output}`);
