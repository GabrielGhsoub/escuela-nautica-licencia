/* The other side of the counter. Today a booking is a WhatsApp message, a
   photo and a seat count kept in Dani's head; this shows the bookings grouped
   by day, each with its payment and document number, and the month's days
   where he opens a date and sets its seats. The calendar the visitor sees is
   read from the same place, so a change here is a change there. Everything is
   simulated in the visitor's own browser and says so. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { course, school } from './data/licencia.js'
import { loadBookings, loadDays, seatsLeft, setDay, setStatus, takesSeat } from './store.js'
import { isPast, longDay, monthKey, monthName, todayIso } from './dates.js'
import DayCalendar from './components/DayCalendar.jsx'
import { useLang } from './i18n.js'
import LangToggle from './components/LangToggle.jsx'

const MIN_MONTH = '2026-09'
const MAX_MONTH = '2026-12'

export default function Admin() {
  const { lang, t } = useLang()
  const [tab, setTab] = useState('bookings')
  const [rows, setRows] = useState(loadBookings)
  const [days, setDays] = useState(loadDays)
  const [month, setMonth] = useState(() => {
    const now = monthKey(todayIso())
    return now < MIN_MONTH ? MIN_MONTH : now > MAX_MONTH ? MAX_MONTH : now
  })
  const [picked, setPicked] = useState(null)
  const fmtTime = useMemo(
    () => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    [lang],
  )
  const heading = useRef(null)
  useEffect(() => { heading.current?.focus() }, [tab])

  const seatsFor = (iso) => seatsLeft(iso, days, rows)
  const thisMonth = monthKey(todayIso())
  const sold = rows.filter((b) => monthKey(b.day) === thisMonth && takesSeat(b)).length
  const upcoming = Object.keys(days).filter((iso) => days[iso].open && !isPast(iso) && seatsFor(iso) > 0).length
  const income = sold * course.deposit

  const grouped = useMemo(() => {
    const by = {}
    for (const b of rows) (by[b.day] ||= []).push(b)
    return Object.keys(by).sort().map((iso) => ({ iso, list: by[iso].sort((a, b) => a.ts - b.ts) }))
  }, [rows])

  function toggleDay(iso) {
    const d = days[iso]
    setPicked(iso)
    setDays(setDay(iso, { open: !(d?.open), seats: d?.seats ?? course.capacity }))
  }
  function bump(iso, by) {
    const d = days[iso]
    const seats = Math.min(12, Math.max(1, (d?.seats ?? course.capacity) + by))
    setDays(setDay(iso, { seats }))
  }

  const openThisMonth = Object.keys(days).filter((iso) => monthKey(iso) === month && days[iso].open).sort()
  const pickedDay = picked && monthKey(picked) === month ? days[picked] : null

  return (
    <div className="page adm">
      <p className="banner">{t('banner')}</p>
      <header className="top">
        <div className="shell top__in">
          <div className="top__brand">
            <span className="top__mark" aria-hidden="true">⚓</span>
            <span>
              <strong>{school.name}</strong>
              <em>{t('admin.tagline')}</em>
            </span>
          </div>
          <div className="top__side">
            <a className="top__phone" href="#">{t('admin.back')}</a>
            <LangToggle />
          </div>
        </div>
      </header>

      <main className="shell main">
        <section className="intro">
          <h1>{t('admin.h1')}</h1>
          <p className="intro__lede">{t('admin.lede')}</p>
        </section>

        <div className="adm__stats" role="status">
          <div className="adm__stat">
            <strong>{sold}</strong>
            <span>{t('admin.statSold')}</span>
          </div>
          <div className="adm__stat">
            <strong>{upcoming}</strong>
            <span>{t('admin.statDays')}</span>
          </div>
          <div className="adm__stat">
            <strong>{income} €</strong>
            <span>{t('admin.statIncome')}</span>
          </div>
        </div>

        <div className="tabs tabs--adm" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'bookings'} className={tab === 'bookings' ? 'is-on' : ''} onClick={() => setTab('bookings')}>{t('admin.tabBookings')}</button>
          <button type="button" role="tab" aria-selected={tab === 'days'} className={tab === 'days' ? 'is-on' : ''} onClick={() => setTab('days')}>{t('admin.tabDays')}</button>
        </div>

        {tab === 'bookings' ? (
          <section className="panel adm__panel" role="tabpanel">
            <h2 className="ask" tabIndex={-1} ref={heading}>{t('admin.h2Bookings')}</h2>
            {rows.length === 0 && <p className="adm__empty">{t('admin.empty')}</p>}
            {grouped.map(({ iso, list }) => {
              const d = days[iso]
              const past = isPast(iso)
              const taken = list.filter(takesSeat).length
              return (
                <div key={iso} className={`adm__day${past ? ' is-past' : ''}`}>
                  <h3 className="adm__dayh">
                    <span>{longDay(iso, lang)}</span>
                    <small>
                      {t('course.hours')}{d ? ` · ${taken} ${t('admin.of')} ${d.seats} ${t('admin.seatsUnit')}` : ''}{!d?.open ? ` · ${t('admin.closed')}` : ''}{past ? ` · ${t('admin.pastDay')}` : ''}
                    </small>
                  </h3>
                  <ul className="adm__list">
                    {list.map((r, i) => (
                      <li key={r.id} className={`adm__row${r.mine ? ' is-mine' : ''}${r.status === 'cancelada' ? ' is-off' : ''}`} style={{ '--i': i }}>
                        <div className="adm__who">
                          <strong>{r.nombre} {r.apellidos}</strong>
                          <span className="adm__doc">{r.documento}</span>
                          <span className="adm__contact">
                            <a href={`mailto:${r.email}`}>{r.email}</a>
                            {r.telefono && <>{' · '}<a href={`tel:${r.telefono.replace(/\s/g, '')}`}>{r.telefono}</a></>}
                          </span>
                        </div>
                        <div className="adm__meta">
                          <time dateTime={new Date(r.ts).toISOString()}>{fmtTime.format(r.ts)}</time>
                          <span className="chip chip--paid">{t('admin.paid')} · {t(`done.method.${r.method}`)}</span>
                          {r.mine && <span className="adm__tag adm__tag--mine">{t('admin.tagMine')}</span>}
                          {r.example && <span className="adm__tag">{t('admin.tagExample')}</span>}
                          <span className={`adm__chip adm__chip--${r.status}`}>{t(`status.${r.status}`)}</span>
                          {r.status === 'confirmada' && (
                            <button type="button" className="btn btn--ghost adm__act" onClick={() => setRows(setStatus(r.id, 'asistio'))}>{t('admin.markAttended')}</button>
                          )}
                          {r.status !== 'cancelada' ? (
                            <button type="button" className="btn btn--ghost adm__act" onClick={() => setRows(setStatus(r.id, 'cancelada'))}>{t('admin.cancel')}</button>
                          ) : (
                            <button type="button" className="btn btn--ghost adm__act" onClick={() => setRows(setStatus(r.id, 'confirmada'))}>{t('admin.reopen')}</button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
            <p className="adm__note">
              {t('admin.notePre')}{' '}
              <strong>{school.email}</strong>{t('admin.notePost')}
            </p>
          </section>
        ) : (
          <section className="panel adm__panel" role="tabpanel">
            <h2 className="ask" tabIndex={-1} ref={heading}>{t('admin.h2Days')}</h2>
            <p className="adm__lede">{t('admin.daysLede')}</p>
            <div className="pick">
              <DayCalendar
                mode="admin"
                month={month} onMonth={(ym) => { setMonth(ym); setPicked(null) }} minMonth={MIN_MONTH} maxMonth={MAX_MONTH}
                days={days} seatsFor={seatsFor} selected={picked} onPick={setPicked}
              />
              <div className="pick__list">
                {pickedDay?.open && !isPast(picked) && (
                  <div className="seats">
                    <strong>{t('admin.seatsFor')} {longDay(picked, lang)}</strong>
                    <div className="seats__ctl">
                      <button type="button" className="seats__btn" aria-label={t('admin.fewer')} onClick={() => bump(picked, -1)}><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg></button>
                      <output aria-live="polite">{pickedDay.seats}</output>
                      <button type="button" className="seats__btn" aria-label={t('admin.more')} onClick={() => bump(picked, 1)}><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M12 5v14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg></button>
                    </div>
                    <button type="button" className="btn btn--ghost adm__act" onClick={() => toggleDay(picked)}>{t('admin.toggleClose')}</button>
                  </div>
                )}
                {picked && !pickedDay?.open && !isPast(picked) && (
                  <div className="seats">
                    <strong>{longDay(picked, lang)}: {t('admin.closed')}</strong>
                    <button type="button" className="btn btn--primary adm__act" onClick={() => toggleDay(picked)}>{t('admin.toggleOpen')}</button>
                  </div>
                )}
                <h3>{t('admin.h2Days')} · {monthName(month, lang).split(' ')[0]}</h3>
                {openThisMonth.length === 0 ? (
                  <p className="pick__none">{t('admin.noDays')} {monthName(month, lang).split(' ')[0]}.</p>
                ) : (
                  <ul className="adm__days">
                    {openThisMonth.map((iso) => (
                      <li key={iso} className={isPast(iso) ? 'is-past' : ''}>
                        <button type="button" className={`adm__dayrow${picked === iso ? ' is-on' : ''}`} onClick={() => setPicked(iso)} disabled={isPast(iso)}>
                          <span>{longDay(iso, lang)}</span>
                          <span>{isPast(iso) ? t('admin.pastDay') : `${seatsFor(iso)} ${t('admin.of')} ${days[iso].seats} ${t('admin.seatsUnit')}`}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <p className="adm__note">{t('admin.daysNote')}</p>
          </section>
        )}
      </main>

      <footer className="foot">
        <div className="shell">
          <p className="foot__demo">{t('admin.foot')}</p>
        </div>
      </footer>
    </div>
  )
}
