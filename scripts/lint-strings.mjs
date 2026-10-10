/* Every user facing string: no dash of any kind and no inverted question or
   exclamation mark. Scans the string literals of the i18n table and the
   course data. Exit 1 on the first offence. */
import { readFileSync } from 'node:fs'
const FILES = ['src/i18n.js', 'src/data/licencia.js']
const BAD = /[-‐‑‒–—―−¿¡]/
const KEYS = /^[a-z][\w.-]*$/i
let bad = 0
for (const f of FILES) {
  const lines = readFileSync(f, 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
      const v = m[1]
      if (KEYS.test(v) && !v.includes(' ')) continue
      if (/^(https?:|mailto:|tel:|#|\/)/.test(v)) continue
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) continue
      if (BAD.test(v)) { bad += 1; console.log(`${f}:${i + 1}: ${v}`) }
    }
  })
}
console.log(bad ? `${bad} offending string(s)` : 'strings clean: no dashes, no inverted marks')
process.exit(bad ? 1 : 0)
