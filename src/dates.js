/* ISO day strings in and out ('2026-10-08'), formatted by hand so the Spanish
   reads "jueves 8 de octubre" and not "jueves, 8 de octubre". Local time
   throughout: the course is in Valencia and so is the visitor. */

export function toIso(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromIso(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayIso() { return toIso(new Date()) }

/* A course runs 9 to 13 h, so the day itself is already gone by the time a
   booking page could matter. Today counts as past. */
export const isPast = (iso) => iso <= todayIso()

export const monthKey = (iso) => iso.slice(0, 7)

const NAMES = {
  es: {
    weekdays: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    short: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
    long: (wd, d, mo, y) => `${wd} ${d} de ${mo}${y ? ` de ${y}` : ''}`,
  },
  en: {
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    short: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    long: (wd, d, mo, y) => `${wd} ${d} ${mo}${y ? ` ${y}` : ''}`,
  },
}

export function longDay(iso, lang = 'es', withYear = false) {
  const n = NAMES[lang] || NAMES.es
  const d = fromIso(iso)
  return n.long(n.weekdays[d.getDay()], d.getDate(), n.months[d.getMonth()], withYear ? d.getFullYear() : '')
}

export function monthName(ym, lang = 'es') {
  const n = NAMES[lang] || NAMES.es
  const [y, m] = ym.split('-').map(Number)
  return `${n.months[m - 1]} ${y}`
}

export const weekdayShort = (lang = 'es') => (NAMES[lang] || NAMES.es).short

/* Monday-first grid for a month: leading blanks, then the days. */
export function monthGrid(ym) {
  const [y, m] = ym.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const lead = (first.getDay() + 6) % 7
  const count = new Date(y, m, 0).getDate()
  const cells = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= count; d += 1) cells.push(toIso(new Date(y, m - 1, d)))
  return cells
}

export function shiftMonth(ym, by) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + by, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
