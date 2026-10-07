import { parsePhoneNumberFromString } from 'libphonenumber-js';

/* Live input masks. The validators in validators.js stay the authority. */

/* Uppercase, no spaces or dots: 12345678z becomes 12345678Z as it is typed. */
export function formatId(v) {
  return String(v).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

/* Groups of four, up to 19 digits. */
export function formatCardNumber(v) {
  const d = String(v).replace(/\D/g, '').slice(0, 19);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/* mm/aa as you type. "1" waits, "12" becomes 12/, "5" becomes 05/ because no
   month starts with a digit above 1. */
export function formatExpiry(v) {
  const d = String(v).replace(/\D/g, '').slice(0, 4);
  if (!d) return '';
  let mm;
  let rest;
  if (d[0] > '1') { mm = '0' + d[0]; rest = d.slice(1); }
  else if (d.length >= 2 && Number(d.slice(0, 2)) > 12) { mm = '0' + d[0]; rest = d.slice(1); }
  else { mm = d.slice(0, 2); rest = d.slice(2); }
  rest = rest.slice(0, 2);
  return rest ? `${mm}/${rest}` : mm;
}

export function formatCvc(v) {
  return String(v).replace(/\D/g, '').slice(0, 4);
}

/* react-international-phone stores E.164 (+34655487716), which is right for a
   tel: link and wrong for a human. Format only where it is shown. */
export function prettyTel(v) {
  const s = String(v || '').trim();
  if (!s || /^\+\d{1,3}$/.test(s)) return '';
  try {
    const p = parsePhoneNumberFromString(s, 'ES');
    return p ? p.formatInternational() : s;
  } catch { return s; }
}

/* The done screen shows the ID the way a receipt would: last three characters
   and the letter. 12345678Z reads as •••••678Z, a passport keeps its last three. */
export function maskId(v) {
  const s = String(v || '');
  if (!s) return '';
  const keep = /[A-Z]$/.test(s) ? 4 : 3;
  if (s.length <= keep) return s;
  return '•'.repeat(s.length - keep) + s.slice(-keep);
}

/* Last four of a card number, for the receipt. */
export function last4(v) {
  return String(v).replace(/\D/g, '').slice(-4);
}
