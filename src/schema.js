/* Zod schemas for everything the visitor and the owner can type. Each rule
   fails with an i18n KEY, never a sentence, so the same schema serves both
   languages and the tests read the keys. The masks in masks.js shape the
   value while it is typed; these schemas are the authority at blur and at
   submit. */
/* zod/mini: the functional, tree-shakeable build. Same rules, a fifth of the bytes. */
import * as z from 'zod/mini'
import { emailOk, idCheck, telOk, cardCvcOk, cardExpiryOk, cardNumberOk, dayCheck } from './validators.js'

/* Letters of any alphabet with their accents, spaces and the two apostrophes
   people actually type ("O'Neill", "D’Souza"). 2 to 60 characters once the
   spaces are collapsed. The uppercase transform stays in the mask. */
export const NAME_RE = /^[\p{L}\p{M}'’ ]+$/u

const name = (key) => z.pipe(
  z.pipe(z.string(), z.transform((s) => s.trim().replace(/\s+/g, ' '))),
  z.string().check(z.minLength(2, key), z.maxLength(60, `${key}.long`), z.regex(NAME_RE, `${key}.chars`)),
)

const email = z.pipe(
  z.pipe(z.string(), z.transform((s) => s.trim().toLowerCase())),
  z.string().check(z.refine(emailOk, 'err.email')),
)

const documento = z.string().check(z.superRefine((v, ctx) => {
  const r = idCheck(v)
  if (!r.ok) ctx.addIssue({ code: 'custom', message: `err.documento.${r.reason || 'shape'}`, input: v })
}))

const telefono = z.string().check(z.refine(telOk, 'err.telefono'))

export const datosSchema = z.object({
  nombre: name('err.nombre'),
  apellidos: name('err.apellidos'),
  documento,
  email,
  telefono,
  policy: z.literal(true, 'err.policy'),
})

/* Simulated checkout: shape only, nothing is charged. */
export const tarjetaSchema = z.object({
  number: z.string().check(z.refine(cardNumberOk, 'err.cardNumber')),
  expiry: z.string().check(z.refine(cardExpiryOk, 'err.cardExpiry')),
  cvc: z.string().check(z.refine(cardCvcOk, 'err.cardCvc')),
  name: z.pipe(z.pipe(z.string(), z.transform((s) => s.trim())), z.string().check(z.minLength(3, 'err.cardName'), z.maxLength(60, 'err.cardName'))),
})

export const bizumSchema = z.object({
  bizumPhone: z.string().check(z.refine((v) => telOk(v) && v.replace(/\D/g, '').length > 3, 'err.bizumPhone')),
})

/* The owner's only typed value: seats per day, 1 to 12, whole. */
export const seatsSchema = z.int().check(z.minimum(1), z.maximum(12))
export const clampSeats = (n) => Math.min(12, Math.max(1, Math.round(Number(n) || 1)))

/* { ok, errors: { field: key } }, first issue per field. */
export function validate(schema, data) {
  const r = z.safeParse(schema, data)
  if (r.success) return { ok: true, errors: {}, data: r.data }
  const errors = {}
  for (const i of r.error.issues) {
    const k = String(i.path[0] ?? '')
    if (!(k in errors)) errors[k] = i.message
  }
  return { ok: false, errors, data: null }
}

export const validateDatos = (form) => validate(datosSchema, form)
export const validatePago = (pay) => validate(pay.method === 'bizum' ? bizumSchema : tarjetaSchema, pay)

/* The chosen day has to be a real session that is still bookable. */
export function validateDay(iso, days, bookings, today) {
  const r = dayCheck(iso, days, bookings, today)
  return r.ok ? { ok: true, error: '' } : { ok: false, error: `err.day.${r.reason}` }
}
