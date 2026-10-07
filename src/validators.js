import { parsePhoneNumberFromString } from 'libphonenumber-js';

/* The loosest checks that still leave the school a way to answer and a seat
   it can hand over on the day. type="email" accepts "pepe@gmail", the single
   most common real typo, so the email rule asks for a top level domain. */

const NAME = /^[\p{L}\p{M}'’. ]+$/u;

export const nombreOk = (v) => {
  const s = String(v).trim().replace(/\s+/g, ' ');
  return s.length >= 2 && NAME.test(s);
};

export const apellidosOk = (v) => {
  const s = String(v).trim().replace(/\s+/g, ' ');
  return s.length >= 2 && NAME.test(s);
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

/* Optional: blank is fine, anything typed has to be a real number somewhere. */
export const telOk = (v) => {
  const s = String(v).trim();
  if (!s || /^\+\d{1,3}$/.test(s)) return true;
  try {
    const p = parsePhoneNumberFromString(s, 'ES');
    return Boolean(p && p.isValid());
  } catch { return false; }
};

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
