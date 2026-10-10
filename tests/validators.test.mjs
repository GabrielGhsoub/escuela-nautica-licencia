import { test } from 'node:test'
import assert from 'node:assert/strict'
import { idCheck, telOk, dayCheck, emailOk, nombreOk } from '../src/validators.js'
import { validateDatos, validatePago, validateDay, clampSeats, seatsSchema } from '../src/schema.js'

test('DNI: checksum letter must match the number', () => {
  assert.deepEqual(idCheck('12345678Z'), { kind: 'dni', ok: true, reason: '' })
  assert.deepEqual(idCheck('12345678z'), { kind: 'dni', ok: true, reason: '' })
  assert.deepEqual(idCheck('00000000T'), { kind: 'dni', ok: true, reason: '' })
  assert.deepEqual(idCheck('12345678A'), { kind: 'dni', ok: false, reason: 'letter' })
  assert.deepEqual(idCheck('21456789C'), { kind: 'dni', ok: true, reason: '' })
})

test('NIE: X, Y, Z stand for 0, 1, 2 before the checksum', () => {
  assert.deepEqual(idCheck('X1234567L'), { kind: 'nie', ok: true, reason: '' })
  assert.deepEqual(idCheck('Y3456789H'), { kind: 'nie', ok: true, reason: '' })
  assert.deepEqual(idCheck('Z1234567R'), { kind: 'nie', ok: true, reason: '' })
  assert.deepEqual(idCheck('X1234567A'), { kind: 'nie', ok: false, reason: 'letter' })
  assert.equal(idCheck('X123456L').kind, 'pasaporte')
})

test('passport: 6 to 12 letters or digits, shape only', () => {
  assert.deepEqual(idCheck('PAB123456'), { kind: 'pasaporte', ok: true, reason: '' })
  assert.equal(idCheck('AB12').ok, false)
  assert.equal(idCheck('AB12').reason, 'shape')
  assert.equal(idCheck('ABCDEFGHIJKLM').ok, false)
  assert.deepEqual(idCheck(''), { kind: '', ok: false, reason: 'empty' })
})

test('phone: Spanish numbers are 9 digits starting 6, 7, 8 or 9', () => {
  assert.equal(telOk('+34655487716'), true)
  assert.equal(telOk('655 48 77 16'), true)
  assert.equal(telOk('+34 963 00 00 00'), true)
  assert.equal(telOk('+34555487716'), false)
  assert.equal(telOk('+3465548771'), false)
  assert.equal(telOk('+34'), false)
  assert.equal(telOk(''), false)
})

test('phone: other countries need the prefix and a possible number', () => {
  assert.equal(telOk('+33612345678'), true)
  assert.equal(telOk('+447911123456'), true)
  assert.equal(telOk('+4912345'), false)
  assert.equal(telOk('+1'), false)
})

test('day: must be a published open session, ahead of today, with a seat', () => {
  const days = { '2026-10-17': { open: true, seats: 2 }, '2026-10-20': { open: false, seats: 5 } }
  const bookings = [
    { day: '2026-10-17', status: 'confirmada' },
    { day: '2026-10-17', status: 'cancelada' },
  ]
  const today = '2026-10-10'
  assert.deepEqual(dayCheck('2026-10-17', days, bookings, today), { ok: true, reason: '' })
  assert.equal(dayCheck('2026-10-10', days, bookings, today).reason, 'past')
  assert.equal(dayCheck('2026-10-05', days, bookings, today).reason, 'past')
  assert.equal(dayCheck('2026-10-20', days, bookings, today).reason, 'closed')
  assert.equal(dayCheck('2026-10-25', days, bookings, today).reason, 'closed')
  assert.equal(dayCheck(null, days, bookings, today).reason, 'none')
  const full = [...bookings, { day: '2026-10-17', status: 'confirmada' }]
  assert.equal(dayCheck('2026-10-17', days, full, today).reason, 'full')
  assert.equal(validateDay('2026-10-17', days, full, today).error, 'err.day.full')
})

test('email: trimmed, lowercased, needs a top level domain', () => {
  assert.equal(emailOk('pepe@gmail.com'), true)
  assert.equal(emailOk('pepe@gmail'), false)
  assert.equal(emailOk('pepe gmail.com'), false)
  const r = validateDatos({ nombre: 'Ana', apellidos: 'Gil', documento: '12345678Z', email: '  Pepe@Gmail.COM ', telefono: '+34655487716', policy: true })
  assert.equal(r.ok, true)
  assert.equal(r.data.email, 'pepe@gmail.com')
})

test('names: letters, accents, spaces, apostrophes, 2 to 60 characters', () => {
  assert.equal(nombreOk('NÚRIA'), true)
  assert.equal(nombreOk("O'NEILL"), true)
  assert.equal(nombreOk('A'), false)
  assert.equal(nombreOk('ANA2'), false)
  const r = validateDatos({ nombre: 'A', apellidos: 'x'.repeat(61), documento: '', email: '', telefono: '+34', policy: false })
  assert.deepEqual(r.errors, {
    nombre: 'err.nombre',
    apellidos: 'err.apellidos.long',
    documento: 'err.documento.empty',
    email: 'err.email',
    telefono: 'err.telefono',
    policy: 'err.policy',
  })
  assert.equal(validateDatos({ nombre: 'AN4', apellidos: 'GIL', documento: '12345678Z', email: 'a@b.com', telefono: '+34655487716', policy: true }).errors.nombre, 'err.nombre.chars')
})

test('checkout: card shape and bizum phone', () => {
  assert.equal(validatePago({ method: 'tarjeta', number: '4242 4242 4242 4242', expiry: '12/30', cvc: '123', name: 'ANA GIL' }).ok, true)
  const bad = validatePago({ method: 'tarjeta', number: '4242', expiry: '13/20', cvc: '12', name: 'A' })
  assert.deepEqual(Object.keys(bad.errors).sort(), ['cvc', 'expiry', 'name', 'number'])
  assert.equal(validatePago({ method: 'bizum', bizumPhone: '655487716' }).ok, true)
  assert.equal(validatePago({ method: 'bizum', bizumPhone: '555487716' }).errors.bizumPhone, 'err.bizumPhone')
})

test('panel: seats per day are a whole number from 1 to 12', () => {
  assert.equal(seatsSchema.safeParse(5).success, true)
  assert.equal(seatsSchema.safeParse(0).success, false)
  assert.equal(seatsSchema.safeParse(13).success, false)
  assert.equal(seatsSchema.safeParse(2.5).success, false)
  assert.equal(clampSeats(0), 1)
  assert.equal(clampSeats(40), 12)
  assert.equal(clampSeats('abc'), 1)
})
