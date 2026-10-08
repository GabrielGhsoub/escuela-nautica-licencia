/* Licencia de Navegación, seat reservation.
   Dani asked for exactly this on 7 Oct: a form with name, surname and
   DNI/NIE or passport number, a 19 € payment for the seat, and a choice among
   the days he opens each month. His page already publishes the course facts
   (99 €, 9 to 13 h, Marina Port Valencia, psicotécnico on the day, no exam);
   today the booking itself arrives as a WhatsApp message and a photo. This
   page takes the booking and the 19 € in one pass and hands it to his panel.

   Deliberately NOT here:
   - No document upload and no photo of anything. He re-read the rules on
     7 Oct: the number has to be provided, the photo does not.
   - Nothing about the money beyond what Dani said himself. Until 8 Oct the
     page showed 19 € and 99 € as two separate facts, because the 80 € between
     them was unknown. On 8 Oct he stated it on WhatsApp, in his words: "Sí,
     son una señal (a modo de reserva) a cuenta de los 99€, así abonan el
     resto (80€) en el barco el día de la práctica en efectivo o Bizum". So the
     page now shows the breakdown: 19 € señal paid online now, 80 € paid on
     the boat on the practice day in cash or Bizum, 99 € in total.
   - No cancellation rule, refund rule or confirmation time of our own. The
     checkbox links to his published policy and says nothing beyond it.
   - No real charge. The card and Bizum forms are simulated and say so once.

   Email and phone are additions to his three fields, because a receipt and a
   same day notice need somewhere to go. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import * as m from 'motion/react-m'
import { PhoneInput, defaultCountries, parseCountry } from 'react-international-phone'
import 'react-international-phone/style.css'
import { course, school } from './data/licencia.js'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { apellidosOk, cardCvcOk, cardExpiryOk, cardNumberOk, emailOk, idCheck, nombreOk, telOk } from './validators.js'
import { formatCardNumber, formatCvc, formatExpiry, formatId, last4, maskId, prettyTel } from './masks.js'
import { loadBookings, loadDays, seatsLeft, upsertBooking } from './store.js'
import { isPast, longDay, monthKey, monthName, todayIso } from './dates.js'
import Field from './components/Field.jsx'
import DayCalendar from './components/DayCalendar.jsx'
import MailPreview from './components/MailPreview.jsx'
import Admin from './Admin.jsx'
import LangToggle from './components/LangToggle.jsx'
import { useLang } from './i18n.js'
import './app.css'

const STEP_KEYS = ['steps.0', 'steps.1', 'steps.2']
const BLANK = { nombre: '', apellidos: '', documento: '', email: '', telefono: '', telDisplay: '', policy: false }
const BLANK_PAY = { method: 'tarjeta', number: '', expiry: '', cvc: '', name: '', bizumPhone: '' }
const ORDER = ['nombre', 'apellidos', 'documento', 'email', 'telefono', 'policy']
const EASE = [0.22, 1, 0.36, 1]
const MIN_MONTH = '2026-10'
const MAX_MONTH = '2026-12'

const REGION_ES = (() => {
  try { return new Intl.DisplayNames(['es'], { type: 'region' }) } catch { return null }
})()
const COUNTRIES_ES = defaultCountries.map((c) => {
  const p = parseCountry(c)
  const name = REGION_ES?.of(p.iso2.toUpperCase())
  if (!name || name === p.iso2.toUpperCase()) return c
  const next = [...c]
  next[0] = name
  return next
})

/* The library's default flags are 218 PNGs fetched from a public CDN. This page
   tells the visitor their data stays in their browser, so opening a country list
   must not hand their IP to a third party. Each flag becomes an inline SVG data
   URI holding the country's own emoji: no network, no build step. */
const FLAGS_INLINE = defaultCountries.map((c) => {
  const iso2 = parseCountry(c).iso2
  const emoji = iso2.toUpperCase().replace(/./g, (ch) =>
    String.fromCodePoint(127397 + ch.charCodeAt(0)))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text x="12" y="18" font-size="18" text-anchor="middle">${emoji}</text></svg>`
  return { iso2, src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }
})

const eur = (n) => `${n} €`

export default function App() {
  const { lang, t } = useLang()
  const [view, setView] = useState(() => (window.location.hash === '#admin' ? 'admin' : 'site'))
  useEffect(() => {
    const onHash = () => setView(window.location.hash === '#admin' ? 'admin' : 'site')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const [step, setStep] = useState(0)
  const [dir, setDir] = useState('fwd')
  const [day, setDay] = useState(null)
  const [month, setMonth] = useState(() => {
    const now = monthKey(todayIso())
    return now < MIN_MONTH ? MIN_MONTH : now > MAX_MONTH ? MAX_MONTH : now
  })
  const [form, setForm] = useState(BLANK)
  const [pay, setPay] = useState(BLANK_PAY)
  const [touched, setTouched] = useState({})
  const [showErrors, setShowErrors] = useState(false)
  const [showPayErrors, setShowPayErrors] = useState(false)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const telRef = useRef(null)

  /* The calendar reads the same sessionStorage the panel writes, so a day the
     owner closes in #admin disappears here the moment the visitor comes back. */
  const [days, setDays] = useState(loadDays)
  const [bookings, setBookings] = useState(loadBookings)
  useEffect(() => {
    if (view === 'site') { setDays(loadDays()); setBookings(loadBookings()) }
  }, [view, step, sent])
  const seatsFor = (iso) => seatsLeft(iso, days, bookings)

  const phoneBox = useRef(null)
  useEffect(() => {
    if (step !== 1) return
    const btn = phoneBox.current?.querySelector('.pi__flag')
    if (btn) btn.setAttribute('aria-label', t('phone.chooseCountry'))
  }, [step, t])

  const countries = lang === 'en' ? defaultCountries : COUNTRIES_ES

  const idInfo = useMemo(() => idCheck(form.documento), [form.documento])
  const checks = useMemo(() => ({
    nombre: nombreOk(form.nombre),
    apellidos: apellidosOk(form.apellidos),
    documento: idInfo.ok,
    email: emailOk(form.email),
    telefono: telOk(form.telefono),
    policy: form.policy,
  }), [form, idInfo])

  const errors = {
    nombre: checks.nombre ? '' : t('err.nombre'),
    apellidos: checks.apellidos ? '' : t('err.apellidos'),
    documento: checks.documento ? '' : t(`err.documento.${idInfo.reason || 'shape'}`),
    email: checks.email ? '' : t('err.email'),
    telefono: checks.telefono ? '' : t('err.telefono'),
    policy: checks.policy ? '' : t('err.policy'),
  }
  const REQUIRED = ['nombre', 'apellidos', 'documento', 'email']
  const filled = REQUIRED.filter((k) => checks[k]).length
  const progress = Math.round((filled / REQUIRED.length) * 100)

  const payChecks = {
    number: cardNumberOk(pay.number),
    expiry: cardExpiryOk(pay.expiry),
    cvc: cardCvcOk(pay.cvc),
    name: pay.name.trim().length >= 3,
    bizumPhone: telOk(pay.bizumPhone) && pay.bizumPhone.replace(/\D/g, '').length > 3,
  }
  const payErrors = {
    number: payChecks.number ? '' : t('err.cardNumber'),
    expiry: payChecks.expiry ? '' : t('err.cardExpiry'),
    cvc: payChecks.cvc ? '' : t('err.cardCvc'),
    name: payChecks.name ? '' : t('err.cardName'),
    bizumPhone: payChecks.bizumPhone ? '' : t('err.bizumPhone'),
  }

  const ask = useRef(null)
  const inputs = useRef({})
  const painted = useRef(false)
  useEffect(() => {
    if (!painted.current) { painted.current = true; return }
    ask.current?.focus()
  }, [step, sent])

  useEffect(() => {
    if (step > 0 && !day) { setStep(0); setSent(false) }
  }, [step, day])

  /* Some password managers assign .value without firing an input event. */
  useEffect(() => {
    if (step !== 1) return undefined
    const id = setTimeout(() => setForm((f) => {
      let changed = false
      const next = { ...f }
      for (const k of ['nombre', 'apellidos', 'email']) {
        const el = inputs.current[k]
        if (el?.value && el.value !== f[k]) { next[k] = el.value; changed = true }
      }
      return changed ? next : f
    }), 400)
    return () => clearTimeout(id)
  }, [step])

  function go(n) {
    setDir(n < step ? 'back' : 'fwd')
    setStep(n)
    setBusy(true)
    setTimeout(() => setBusy(false), 280)
  }

  function pickDay(iso) {
    setDay(iso)
    go(1)
  }

  function submitDatos(e) {
    e.preventDefault()
    const bad = ORDER.find((k) => errors[k])
    if (bad) {
      setShowErrors(true)
      const el = bad === 'telefono' ? telRef.current : inputs.current[bad]
      el?.focus()
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    go(2)
  }

  const filedRef = useRef(false)
  const filedIdRef = useRef(null)
  function submitPago(e) {
    e.preventDefault()
    const need = pay.method === 'bizum' ? ['bizumPhone'] : ['number', 'expiry', 'cvc', 'name']
    const bad = need.find((k) => payErrors[k])
    if (bad) {
      setShowPayErrors(true)
      inputs.current[bad]?.focus()
      return
    }
    if (filedRef.current) return
    /* The seat could have gone while the form was open (the owner closing the
       day in the other view). Send the visitor back to the calendar. */
    if (seatsLeft(day) === 0 && !filedIdRef.current) { setDay(null); go(0); return }
    filedRef.current = true
    filedIdRef.current = upsertBooking(filedIdRef.current, {
      day,
      nombre: form.nombre.trim(),
      apellidos: form.apellidos.trim(),
      documento: form.documento,
      email: form.email.trim(),
      telefono: prettyTel(form.telefono) ? (form.telDisplay || prettyTel(form.telefono)) : '',
      method: pay.method,
      cardLast4: pay.method === 'tarjeta' ? last4(pay.number) : '',
    })
    setSent(true)
  }

  function restart() {
    filedRef.current = false
    filedIdRef.current = null
    setSent(false)
    setDir('back')
    setStep(0)
    setDay(null)
    setForm(BLANK)
    setPay(BLANK_PAY)
    setTouched({})
    setShowErrors(false)
    setShowPayErrors(false)
  }

  const blur = (k) => () => setTouched((x) => ({ ...x, [k]: true }))
  const showErr = (k) => showErrors || Boolean(touched[k])
  const showPayErr = (k) => showPayErrors || Boolean(touched[`pay.${k}`])

  if (view === 'admin') return <Admin />

  const monthDays = Object.keys(days)
    .filter((iso) => monthKey(iso) === month && days[iso].open && !isPast(iso))
    .sort()
  const fullName = `${form.nombre.trim()} ${form.apellidos.trim()}`.trim()
  /* The phone control always shows a dial code, so "+34" alone is "no phone". */
  const telShown = prettyTel(form.telefono) ? (form.telDisplay || prettyTel(form.telefono)) : ''
  const seatsAfter = day ? seatsFor(day) : 0

  return (
    <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user">
      <div className="page">
        <p className="banner">{t('banner')}</p>
        <header className="top">
          <div className="shell top__in">
            <div className="top__brand">
              <span className="top__mark" aria-hidden="true">⚓</span>
              <span>
                <strong>{school.name}</strong>
                <em>{t('top.tagline')}</em>
              </span>
            </div>
            <div className="top__side">
              <a className="top__phone" href={school.phoneHref} aria-label={`${t('top.callAria')} ${school.phone}`}>
                {school.phone}
              </a>
              <LangToggle />
            </div>
          </div>
        </header>

        <main className="shell main">
          <section className="intro">
            <h1>{t('intro.h1')}</h1>
            <p className="intro__lede">{t('intro.lede')}</p>
            <div className="intro__facts">
              <div className="fact">
                <span>{t('intro.deposit')}</span>
                <strong>{eur(course.deposit)}</strong>
                <small>{t('intro.depositNote')}</small>
              </div>
              <div className="fact">
                <span>{t('intro.balance')}</span>
                <strong>{eur(course.balance)}</strong>
                <small>{t('intro.balanceNote')}</small>
              </div>
              <div className="fact">
                <span>{t('intro.price')}</span>
                <strong>{eur(course.price)} <s>{eur(course.priceBefore)}</s></strong>
                <small>{t('intro.priceNote')}</small>
              </div>
              <div className="fact fact--list">
                <span>{t('intro.reqs')}</span>
                <ul>{t('intro.reqList').map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            </div>
          </section>

          <div className="swap">
          <AnimatePresence initial={false}>
            {sent ? (
              <m.section
                key="done" className="panel done"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <p className="demo demo--lead">{t('done.demo')}</p>
                <m.div
                  className="done__tick" aria-hidden="true"
                  initial={{ scale: 0.3, rotate: -14, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.1 }}
                >
                  ✓
                </m.div>
                <h2 tabIndex={-1} ref={ask}>{t('done.h2')}</h2>
                <p className="done__chip"><span className="chip chip--paid">{t('done.chip')}</span></p>
                <dl className="review review--done">
                  {[
                    [t('done.day'), <span className="cap">{longDay(day, lang, true)}</span>],
                    [t('done.hours'), t('course.hours')],
                    [t('done.place'), course.place],
                    [t('done.name'), fullName],
                    [t('done.id'), maskId(form.documento)],
                    [t('done.email'), form.email],
                    [t('done.pending'), t('done.pendingValue')],
                    [t('done.total'), eur(course.price)],
                  ].map(([k, v]) => (
                    <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
                <p className="done__admin">
                  {t('done.adminPre')}<a href="#admin">{t('done.adminLink')}</a>{t('done.adminPost')}
                </p>

                <div className="mails">
                  <h3>{t('done.emailsH3')}</h3>
                  <p className="mails__note">{t('done.emailsNote')}</p>
                  <MailPreview
                    label={t('done.toStudent')}
                    from={school.email} to={form.email}
                    subject={`${t('mail.s.subject')}${longDay(day, lang)}`}
                  >
                    <p>{t('mail.s.hi')}{form.nombre.trim()},</p>
                    <p>{t('mail.s.body1')}</p>
                    <ul>
                      <li><strong>{t('done.day')}:</strong> <span className="cap">{longDay(day, lang, true)}</span></li>
                      <li><strong>{t('done.hours')}:</strong> {t('course.hours')}</li>
                      <li><strong>{t('done.place')}:</strong> {course.place}</li>
                      <li><strong>{t('done.name')}:</strong> {fullName}</li>
                      <li><strong>{t('done.id')}:</strong> {maskId(form.documento)}</li>
                    </ul>
                    <ul>
                      <li><strong>{t('mail.s.paid')}:</strong> {eur(course.deposit)}</li>
                      <li><strong>{t('mail.s.balance')}:</strong> {eur(course.balance)}, {t('mail.s.balanceValue')}</li>
                      <li><strong>{t('mail.s.total')}:</strong> {eur(course.price)}</li>
                    </ul>
                    <p>{t('mail.s.bring')}</p>
                    <p>{t('mail.s.contact')}{school.phone}.</p>
                    <p>{t('mail.s.sign')}</p>
                  </MailPreview>
                  <MailPreview
                    label={t('done.toSchool')}
                    from={school.email} to={school.email}
                    subject={`${t('mail.k.subject')}${longDay(day, lang)} · ${fullName}`}
                  >
                    <p>{t('mail.k.body1')}</p>
                    <ul>
                      <li><strong>{t('done.day')}:</strong> <span className="cap">{longDay(day, lang, true)}</span>, {t('course.hours')}</li>
                      <li><strong>{t('done.name')}:</strong> {fullName}</li>
                      <li><strong>{t('done.id')}:</strong> {form.documento}</li>
                      <li><strong>{t('done.email')}:</strong> {form.email}</li>
                      <li><strong>{t('mail.k.phone')}:</strong> {telShown || t('mail.k.noPhone')}</li>
                      <li><strong>{t('mail.k.method')}:</strong> {t(`done.method.${pay.method}`)}{pay.method === 'tarjeta' && pay.number ? ` ···· ${last4(pay.number)}` : ''}, {eur(course.deposit)}</li>
                      <li><strong>{t('mail.k.pending')}:</strong> {eur(course.balance)}, {t('mail.k.pendingValue')}</li>
                      <li><strong>{t('mail.k.seats')}:</strong> {seatsAfter} {t('admin.of')} {days[day]?.seats ?? course.capacity}</li>
                    </ul>
                  </MailPreview>
                </div>

                <div className="nav nav--done">
                  <button type="button" className="btn btn--ghost" onClick={() => { filedRef.current = false; setSent(false); setDir('back'); setStep(1) }}>
                    {t('done.fix')}
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={restart}>
                    {t('done.again')}
                  </button>
                </div>
              </m.section>
            ) : (
              <m.section
                key="flow" className="panel"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <ol className="steps" aria-label={t('steps.aria')}>
                  {STEP_KEYS.map((s, i) => (
                    <li
                      key={s}
                      className={i === step ? 'is-now' : i < step ? 'is-done' : ''}
                      aria-current={i === step ? 'step' : undefined}
                    >
                      <m.span
                        aria-hidden="true"
                        animate={{ scale: i === step ? [0.6, 1] : 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                      >
                        {i < step ? '✓' : i + 1}
                      </m.span>
                      {t(s)}
                      {i < step && <span className="visually-hidden">{t('steps.done')}</span>}
                    </li>
                  ))}
                </ol>

                <div className="flow">
                    <div key={step} className={`stp stp--${dir}`} style={busy ? { pointerEvents: 'none' } : undefined}>
                    {step === 0 && (
                      <div>
                        <h2 className="ask" tabIndex={-1} ref={ask}>{t('step0.h2')}</h2>
                        <div className="pick">
                          <DayCalendar
                            month={month} onMonth={setMonth} minMonth={MIN_MONTH} maxMonth={MAX_MONTH}
                            days={days} seatsFor={seatsFor} selected={day} onPick={pickDay}
                          />
                          <div className="pick__list">
                            {monthDays.length > 0 ? (
                              <>
                                <h3>{t('cal.listH3')} {monthName(month, lang).split(' ')[0]}</h3>
                                <div className="dates">
                                  {monthDays.map((iso, i) => {
                                    const left = seatsFor(iso)
                                    return (
                                      <m.button
                                        key={iso} type="button"
                                        className={`date${left === 0 ? ' is-full' : ''}${day === iso ? ' is-on' : ''}`}
                                        disabled={left === 0}
                                        onClick={() => pickDay(iso)}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.045, duration: 0.34, ease: EASE }}
                                        whileHover={left > 0 ? { y: -3 } : undefined}
                                        whileTap={left > 0 ? { scale: 0.98 } : undefined}
                                      >
                                        <strong>{longDay(iso, lang)}</strong>
                                        <em>{t('cal.hours')}: {t('course.hours')} · {t('cal.place')}: {course.place}</em>
                                        <span className={left === 0 ? 'is-full' : ''}>
                                          {left === 0 ? t('cal.full') : left === 1 ? t('cal.left1') : t('cal.leftN').replace('{n}', left)}
                                        </span>
                                      </m.button>
                                    )
                                  })}
                                </div>
                              </>
                            ) : (
                              <p className="pick__none">{t('cal.none')} {monthName(month, lang).split(' ')[0]}.</p>
                            )}
                            <p className="pick__other">
                              {t('cal.otherPre')}
                              <a href={school.whatsapp} target="_blank" rel="noopener noreferrer">{t('cal.otherLink')}</a>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 1 && (
                      <form noValidate onSubmit={submitDatos}>
                        <h2 className="ask" tabIndex={-1} ref={ask}>{t('step1.h2')}</h2>
                        <div className="recap">
                          {t('recap.pre')}{longDay(day, lang)} · {t('course.hours')} · {course.place}
                        </div>

                        <div className="prog" aria-hidden="true">
                          <m.div
                            className="prog__bar"
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.4, ease: EASE }}
                          />
                        </div>

                        <Field
                          id="nombre" label={t('fld.nombre.label')}
                          ref={(el) => { inputs.current.nombre = el }}
                          value={form.nombre}
                          valid={checks.nombre}
                          error={errors.nombre} showError={showErr('nombre')}
                          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                          onBlur={blur('nombre')}
                          name="nombre" autoComplete="given-name" autoCapitalize="words" enterKeyHint="next"
                        />
                        <Field
                          id="apellidos" label={t('fld.apellidos.label')}
                          ref={(el) => { inputs.current.apellidos = el }}
                          value={form.apellidos}
                          valid={checks.apellidos}
                          error={errors.apellidos} showError={showErr('apellidos')}
                          onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                          onBlur={blur('apellidos')}
                          name="apellidos" autoComplete="family-name" autoCapitalize="words" enterKeyHint="next"
                        />
                        <Field
                          id="documento" label={t('fld.documento.label')}
                          hint={idInfo.kind ? t(`fld.documento.${idInfo.kind}`) : t('fld.documento.hint')}
                          ref={(el) => { inputs.current.documento = el }}
                          value={form.documento}
                          valid={checks.documento}
                          error={errors.documento} showError={showErr('documento')}
                          onChange={(e) => setForm({ ...form, documento: formatId(e.target.value) })}
                          onBlur={blur('documento')}
                          name="documento" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={12} enterKeyHint="next"
                        />
                        <Field
                          id="email" label={t('fld.email.label')} hint={t('fld.email.hint')}
                          ref={(el) => { inputs.current.email = el }}
                          value={form.email}
                          valid={checks.email}
                          error={errors.email} showError={showErr('email')}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          onBlur={blur('email')}
                          name="email" type="email" inputMode="email" autoComplete="email" enterKeyHint="next"
                        />

                        <Field
                          id="telefono" label={t('fld.telefono.label')} hint={t('fld.telefono.hint')} alwaysFloat optional
                          value={form.telefono}
                          valid={checks.telefono && Boolean(prettyTel(form.telefono))}
                          error={errors.telefono} showError={showErr('telefono')}
                        >
                          {(aria) => (
                            <div ref={phoneBox} className="pi__host">
                            <PhoneInput
                              defaultCountry="es"
                              countries={countries}
                              flags={FLAGS_INLINE}
                              forceDialCode
                              inputRef={telRef}
                              value={form.telefono}
                              onChange={(v, meta) => setForm((f) => {
                                const bare = v.replace(/\D/g, '')
                                if (meta?.country && bare === meta.country.dialCode && f.telefono) {
                                  const prev = parsePhoneNumberFromString(f.telefono, 'ES')
                                  if (prev?.nationalNumber) {
                                    return { ...f, telefono: `+${meta.country.dialCode}${prev.nationalNumber}`, telDisplay: '' }
                                  }
                                }
                                return { ...f, telefono: v, telDisplay: meta?.inputValue || '' }
                              })}
                              onBlur={blur('telefono')}
                              inputProps={{
                                id: 'telefono', name: 'telefono', autoComplete: 'tel',
                                enterKeyHint: 'go', ...aria,
                                onPaste: (e) => {
                                  const raw = e.clipboardData.getData('text')
                                  const parsed = parsePhoneNumberFromString(raw, 'ES')
                                  if (parsed) {
                                    e.preventDefault()
                                    setForm((f) => ({ ...f, telefono: parsed.number, telDisplay: parsed.formatInternational() }))
                                  }
                                },
                              }}
                              countrySelectorStyleProps={{
                                buttonClassName: 'pi__flag',
                                buttonContentWrapperClassName: 'pi__flagwrap',
                              }}
                              inputClassName="fld__input pi__input"
                              className="pi"
                            />
                            </div>
                          )}
                        </Field>

                        <div className={`check${showErr('policy') && errors.policy ? ' is-bad' : ''}`}>
                          <input
                            id="policy" type="checkbox" checked={form.policy}
                            aria-label={`${t('policy.pre')}${t('policy.link')}${t('policy.post')}`}
                            ref={(el) => { inputs.current.policy = el }}
                            aria-invalid={showErr('policy') && errors.policy ? true : undefined}
                            aria-describedby={showErr('policy') && errors.policy ? 'err-policy' : undefined}
                            onChange={(e) => { setForm({ ...form, policy: e.target.checked }); setTouched((x) => ({ ...x, policy: true })) }}
                          />
                          <label htmlFor="policy">
                            {t('policy.pre')}
                            <a href={school.policyUrl} target="_blank" rel="noopener noreferrer">{t('policy.link')}</a>
                            {t('policy.post')}
                          </label>
                          {showErr('policy') && errors.policy && <p id="err-policy" className="fld__err check__err">{errors.policy}</p>}
                        </div>

                        <p className="bring">{t('bring')}</p>

                        <p className="privacidad">
                          {t('privacy.pre')}{school.name}{t('privacy.mid')}
                          <a href={school.privacyUrl} target="_blank" rel="noopener noreferrer">{t('privacy.link')}</a>{t('privacy.post')}
                        </p>
                        <div className="nav">
                          <button type="button" className="btn btn--ghost" onClick={() => go(0)}>{t('nav.back')}</button>
                          <button type="submit" className="btn btn--primary">{t('nav.continue')}</button>
                        </div>
                      </form>
                    )}

                    {step === 2 && (
                      <form noValidate onSubmit={submitPago}>
                        <h2 className="ask" tabIndex={-1} ref={ask}>{t('step2.h2')}</h2>
                        <div className="recap">
                          {fullName} · {longDay(day, lang)} · {t('course.hours')}
                        </div>

                        <dl className="amounts">
                          <div className="amounts__now">
                            <dt>{t('pay.deposit')} <small>{t('pay.depositNote')}</small></dt>
                            <dd>{eur(course.deposit)}</dd>
                          </div>
                          <div>
                            <dt>{t('pay.balance')} <small>{t('pay.balanceNote')}</small></dt>
                            <dd>{eur(course.balance)}</dd>
                          </div>
                          <div>
                            <dt>{t('pay.course')} <small>{t('pay.courseNote')}</small></dt>
                            <dd>{eur(course.price)}</dd>
                          </div>
                        </dl>

                        <div className="tabs" role="tablist" aria-label={t('step2.h2')}>
                          {['tarjeta', 'bizum'].map((k) => (
                            <button
                              key={k} type="button" role="tab" id={`tab-${k}`}
                              aria-selected={pay.method === k} aria-controls={`pane-${k}`}
                              className={pay.method === k ? 'is-on' : ''}
                              onClick={() => { setPay({ ...pay, method: k }); setShowPayErrors(false) }}
                            >
                              {k === 'tarjeta' ? (
                                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M2.5 9.5h19M6 15h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M10 18h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
                              )}
                              {k === 'tarjeta' ? t('pay.tabCard') : t('pay.tabBizum')}
                            </button>
                          ))}
                        </div>

                        {pay.method === 'tarjeta' ? (
                          <div id="pane-tarjeta" role="tabpanel" aria-labelledby="tab-tarjeta" className="pane">
                            <Field
                              id="cardName" label={t('pay.cardName')}
                              ref={(el) => { inputs.current.name = el }}
                              value={pay.name} valid={payChecks.name}
                              error={payErrors.name} showError={showPayErr('name')}
                              onChange={(e) => setPay({ ...pay, name: e.target.value })}
                              onBlur={blur('pay.name')}
                              name="ccname" autoComplete="cc-name" autoCapitalize="words" enterKeyHint="next"
                            />
                            <Field
                              id="cardNumber" label={t('pay.cardNumber')}
                              ref={(el) => { inputs.current.number = el }}
                              value={pay.number} valid={payChecks.number}
                              error={payErrors.number} showError={showPayErr('number')}
                              onChange={(e) => setPay({ ...pay, number: formatCardNumber(e.target.value) })}
                              onBlur={blur('pay.number')}
                              name="cardnumber" inputMode="numeric" autoComplete="cc-number" maxLength={23} enterKeyHint="next"
                            />
                            <div className="row2">
                              <Field
                                id="cardExpiry" label={t('pay.cardExpiry')} hint={t('pay.cardExpiryHint')}
                                ref={(el) => { inputs.current.expiry = el }}
                                value={pay.expiry} valid={payChecks.expiry}
                                error={payErrors.expiry} showError={showPayErr('expiry')}
                                onChange={(e) => setPay({ ...pay, expiry: formatExpiry(e.target.value) })}
                                onBlur={blur('pay.expiry')}
                                name="cc-exp" inputMode="numeric" autoComplete="cc-exp" maxLength={5} enterKeyHint="next"
                              />
                              <Field
                                id="cardCvc" label={t('pay.cardCvc')} hint={t('pay.cardCvcHint')}
                                ref={(el) => { inputs.current.cvc = el }}
                                value={pay.cvc} valid={payChecks.cvc}
                                error={payErrors.cvc} showError={showPayErr('cvc')}
                                onChange={(e) => setPay({ ...pay, cvc: formatCvc(e.target.value) })}
                                onBlur={blur('pay.cvc')}
                                name="cvc" inputMode="numeric" autoComplete="cc-csc" maxLength={4} enterKeyHint="go"
                              />
                            </div>
                          </div>
                        ) : (
                          <div id="pane-bizum" role="tabpanel" aria-labelledby="tab-bizum" className="pane">
                            <Field
                              id="bizumPhone" label={t('pay.bizumPhone')} hint={t('pay.bizumHint')}
                              ref={(el) => { inputs.current.bizumPhone = el }}
                              value={pay.bizumPhone} valid={payChecks.bizumPhone}
                              error={payErrors.bizumPhone} showError={showPayErr('bizumPhone')}
                              onChange={(e) => setPay({ ...pay, bizumPhone: e.target.value })}
                              onFocus={() => { if (!pay.bizumPhone && form.telDisplay) setPay((p) => ({ ...p, bizumPhone: form.telDisplay })) }}
                              onBlur={blur('pay.bizumPhone')}
                              name="bizum" type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="go"
                            />
                          </div>
                        )}

                        <p className="simulated">{t('pay.simulated')}</p>

                        <div className="nav">
                          <button type="button" className="btn btn--ghost" onClick={() => go(1)}>{t('nav.back')}</button>
                          <button type="submit" className="btn btn--primary">
                            {pay.method === 'bizum' ? t('nav.payBizum') : t('nav.pay')}
                          </button>
                        </div>
                      </form>
                    )}
                    </div>
                </div>
              </m.section>
            )}
          </AnimatePresence>
          </div>
        </main>

        <footer className="foot">
          <div className="shell">
            <p>
              <a href={school.site} target="_blank" rel="noopener noreferrer">{school.name}</a> · {school.place} · <a href={school.phoneHref}>{school.phone}</a> ·{' '}
              <a href={`mailto:${school.email}`}>{school.email}</a>
            </p>
            <p className="foot__demo">
              {t('foot.demo')}{' '}
              <a href="#admin">{t('foot.demoLink')}</a>
            </p>
          </div>
        </footer>
      </div>
    </MotionConfig>
    </LazyMotion>
  )
}
