import { parsePhoneNumberFromString } from 'libphonenumber-js';

/* The loosest checks that still leave the school a way to answer and a seat
   it can hand over on the day. type="email" accepts "pepe@gmail", the single
   most common real typo, so the email rule asks for a top level domain. */

const NAME = /^[\p{L}\p{M}'’ ]+$/u;

export const nombreOk = (v) => {
  const s = String(v).trim().replace(/\s+/g, ' ');
  return s.length >= 2 && s.length <= 60 && NAME.test(s);
};

export const apellidosOk = (v) => {
  const s = String(v).trim().replace(/\s+/g, ' ');
  return s.length >= 2 && s.length <= 60 && NAME.test(s);
};

/* The letter at the end of a Spanish DNI is a checksum: number mod 23 indexes
   this string. A NIE is the same rule with X, Y, Z standing for 0, 1, 2. A
   passport has no public checksum, so it is only checked for shape. */
const LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

export function idKind(v) {
  const s = String(v).toUpperCase().replace(/[\s.-]/g, '');
  if (/^\d{8}[A-Z]$/.test(s)) return 'dni';
  if (/^[XYZ]\d{7}[A-Z]$/.test(s)) return 'nie';
  if (/^[A-Z0-9]{6,12}$/.test(s)) return 'pasaporte';
  return '';
}

export function idCheck(v) {
  const s = String(v).toUpperCase().replace(/[\s.-]/g, '');
  const kind = idKind(s);
  if (!kind) return { kind: '', ok: false, reason: s ? 'shape' : 'empty' };
  if (kind === 'pasaporte') return { kind, ok: true, reason: '' };
  const digits = kind === 'nie' ? s.slice(1, 8).replace(/^/, { X: '0', Y: '1', Z: '2' }[s[0]]) : s.slice(0, 8);
  const expected = LETTERS[Number(digits) % 23];
  const ok = expected === s[s.length - 1];
  return { kind, ok, reason: ok ? '' : 'letter' };
}

export const idOk = (v) => idCheck(v).ok;

/* Required since 2026-10-09: Dani sends the exact meeting point and the
   theory material by phone, so a booking without one is no use to him. A
   Spanish number is 9 digits starting with 6, 7, 8 or 9 (mobile or landline;
   the control prefixes +34, which is stripped here). Any other country needs
   its prefix and must be a possible number for that country according to
   libphonenumber. A bare dial code ("+34") is "no phone". */
const ES_NATIONAL = /^[6789]\d{8}$/;

export const telOk = (v) => {
  const s = String(v).trim().replace(/[\s().-]/g, '');
  if (!/^\+?\d{9,15}$/.test(s)) return false;
  let p;
  try { p = parsePhoneNumberFromString(s, 'ES'); } catch { p = undefined; }
  const country = p?.country || (s.startsWith('+34') || !s.startsWith('+') ? 'ES' : '');
  if (country === 'ES') {
    const national = s.startsWith('+34') ? s.slice(3) : s.startsWith('0034') ? s.slice(4) : s;
    return ES_NATIONAL.test(national);
  }
  return p ? p.isPossible() : false;
};

/* A day can be booked when it is a published session (open in the owner's
   calendar), still ahead of today, and has a seat left. `today` is injected
   so the rule can be tested. */
export function dayCheck(iso, days = {}, bookings = [], today = localToday()) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return { ok: false, reason: 'none' };
  if (iso <= today) return { ok: false, reason: 'past' };
  const d = days[iso];
  if (!d || !d.open) return { ok: false, reason: 'closed' };
  const taken = bookings.filter((b) => b.day === iso && b.status !== 'cancelada').length;
  if (d.seats - taken <= 0) return { ok: false, reason: 'full' };
  return { ok: true, reason: '' };
}

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const HTML5_EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const emailOk = (v) => {
  const s = String(v).trim();
  return HTML5_EMAIL.test(s) && /\.[a-zA-Z]{2,}$/.test(s) && s.length <= 254;
};

/* Simulated checkout: well formed is enough, nothing is charged and nothing
   is checked against a network. 13 to 19 digits is the shape every card
   scheme uses. */
export const cardNumberOk = (v) => {
  const d = String(v).replace(/\D/g, '');
  return d.length >= 13 && d.length <= 19;
};

export const cardExpiryOk = (v) => {
  const m = /^(\d{2})\/(\d{2})$/.exec(String(v).trim());
  if (!m) return false;
  const mes = Number(m[1]);
  const anio = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return false;
  const now = new Date();
  return anio > now.getFullYear() || (anio === now.getFullYear() && mes >= now.getMonth() + 1);
};

export const cardCvcOk = (v) => /^\d{3,4}$/.test(String(v).trim());
