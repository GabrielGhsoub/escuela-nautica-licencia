/* The demo's "backend": sessionStorage. Two tables, both read by the public
   page and by the school panel, so a visitor can book a seat and then watch
   it land on the other side of the counter without a byte leaving their
   browser. Dies with the tab, which is exactly the retention policy a demo
   should have.

   days:     { 'YYYY-MM-DD': { open: true, seats: 5 } }
   bookings: [ { id, day, nombre, apellidos, documento, email, telefono,
                 paid, method, status, ts, mine?, example? } ] */
import { course, publishedDays } from './data/licencia.js'

const DAYS_KEY = 'env-lic-dias'
const BOOK_KEY = 'env-lic-reservas'

export const DEPOSIT = course.deposit

/* Plausible, clearly invented, marked "ejemplo" in the panel. Seat counts per
   day in the brief: 8 Oct 2 left, 17 Oct 5 left, 31 Oct 4 left, out of 5. */
const SEEDS = [
  { id: 'seed-1', day: '2026-09-28', nombre: 'Carles', apellidos: 'Ferrer Blasco', documento: '21456789C', email: 'cferrer.ejemplo@gmail.com', telefono: '612 33 48 90', status: 'asistio', method: 'tarjeta', offsetDays: 14 },
  { id: 'seed-2', day: '2026-09-28', nombre: 'Núria', apellidos: 'Sanchis Roig', documento: '48123456G', email: 'nsanchis.ejemplo@hotmail.com', telefono: '677 90 12 34', status: 'asistio', method: 'bizum', offsetDays: 13 },
  { id: 'seed-3', day: '2026-09-30', nombre: 'Jordi', apellidos: 'Aleixandre Pons', documento: 'Y3456789H', email: 'jaleixandre.ejemplo@gmail.com', telefono: '699 21 87 65', status: 'asistio', method: 'tarjeta', offsetDays: 12 },
  { id: 'seed-4', day: '2026-10-05', nombre: 'Amparo', apellidos: 'Gil Climent', documento: '29876543A', email: 'agil.ejemplo@gmail.com', telefono: '655 12 90 33', status: 'asistio', method: 'bizum', offsetDays: 9 },
  { id: 'seed-5', day: '2026-10-08', nombre: 'Vicent', apellidos: 'Martí Soler', documento: '53210987G', email: 'vmarti.ejemplo@gmail.com', telefono: '611 45 67 89', status: 'confirmada', method: 'tarjeta', offsetDays: 6 },
  { id: 'seed-6', day: '2026-10-08', nombre: 'Paula', apellidos: 'Navarro Esteve', documento: 'X1234567L', email: 'pnavarro.ejemplo@outlook.com', telefono: '', status: 'confirmada', method: 'bizum', offsetDays: 4 },
  { id: 'seed-7', day: '2026-10-08', nombre: 'Rafa', apellidos: 'Bou Peris', documento: 'PAB123456', email: 'rbou.ejemplo@gmail.com', telefono: '622 78 90 11', status: 'confirmada', method: 'tarjeta', offsetDays: 2 },
  { id: 'seed-8', day: '2026-10-31', nombre: 'Marta', apellidos: 'Llopis Tormo', documento: '74561230Z', email: 'mllopis.ejemplo@gmail.com', telefono: '688 33 21 09', status: 'confirmada', method: 'tarjeta', offsetDays: 1 },
]

function seededBookings() {
  const day = 24 * 60 * 60 * 1000
  return SEEDS.map(({ offsetDays, ...s }) => ({ ...s, example: true, paid: DEPOSIT, ts: Date.now() - offsetDays * day }))
}

function seededDays() {
  const out = {}
  for (const d of publishedDays) out[d] = { open: true, seats: course.capacity }
  return out
}

function read(key) {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch { /* private mode: fall through to seeds */ }
  return null
}

function write(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* private mode */ }
}

export function loadDays() {
  const hit = read(DAYS_KEY)
  if (hit) return hit
  const seeds = seededDays()
  write(DAYS_KEY, seeds)
  return seeds
}

export function saveDays(days) { write(DAYS_KEY, days) }

export function setDay(iso, patch) {
  const days = loadDays()
  const prev = days[iso] || { open: false, seats: course.capacity }
  days[iso] = { ...prev, ...patch }
  saveDays(days)
  return days
}

export function loadBookings() {
  const hit = read(BOOK_KEY)
  if (hit) return hit
  const seeds = seededBookings()
  write(BOOK_KEY, seeds)
  return seeds
}

export function saveBookings(list) { write(BOOK_KEY, list) }

/* A cancelled booking gives its seat back. */
export const takesSeat = (b) => b.status !== 'cancelada'

export function seatsLeft(iso, days = loadDays(), bookings = loadBookings()) {
  const d = days[iso]
  if (!d || !d.open) return 0
  const taken = bookings.filter((b) => b.day === iso && takesSeat(b)).length
  return Math.max(0, d.seats - taken)
}

/* Upsert, not append: "Corregir mis datos" and paying again must not file the
   same person twice. */
export function upsertBooking(id, rec) {
  const list = loadBookings()
  const at = id ? list.findIndex((b) => b.id === id) : -1
  if (at >= 0) {
    list[at] = { ...list[at], ...rec }
    saveBookings(list)
    return list[at].id
  }
  const fresh = {
    id: 'r-' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    status: 'confirmada',
    paid: DEPOSIT,
    mine: true,
    ts: Date.now(),
    ...rec,
  }
  list.unshift(fresh)
  saveBookings(list)
  return fresh.id
}

export function setStatus(id, status) {
  const list = loadBookings().map((b) => (b.id === id ? { ...b, status } : b))
  saveBookings(list)
  return list
}
