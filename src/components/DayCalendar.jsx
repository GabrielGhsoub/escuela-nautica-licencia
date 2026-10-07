/* A day calendar, because the thing being chosen is a course day. Opens on the
   current month, arrows reach the next two; past days are visible and inert,
   so the visitor can see that the school runs these regularly, and open days
   carry their seat count so nobody fills a form for a seat that is gone.

   The same component draws the owner's grid in the panel (mode="admin"), where
   a tap opens or closes a day instead of choosing it. One grid, two sides of
   the counter, same data. */
import { isPast, monthGrid, monthName, shiftMonth, todayIso, weekdayShort } from '../dates.js'
import { useLang } from '../i18n.js'

export default function DayCalendar({ month, onMonth, minMonth, maxMonth, days, seatsFor, selected, onPick, mode = 'public' }) {
  const { lang, t } = useLang()
  const cells = monthGrid(month)
  const today = todayIso()
  const canPrev = !minMonth || month > minMonth
  const canNext = !maxMonth || month < maxMonth

  return (
    <div className={`cal cal--${mode}`}>
      <div className="cal__head">
        <button type="button" className="cal__arrow" aria-label={t('cal.prev')} disabled={!canPrev} onClick={() => onMonth(shiftMonth(month, -1))}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <h3 className="cal__month" aria-live="polite">{monthName(month, lang)}</h3>
        <button type="button" className="cal__arrow" aria-label={t('cal.next')} disabled={!canNext} onClick={() => onMonth(shiftMonth(month, 1))}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <div className="cal__wd" aria-hidden="true">
        {weekdayShort(lang).map((w, i) => <span key={i}>{w}</span>)}
      </div>
      <div className="cal__grid" role="group" aria-label={t('cal.gridAria')}>
        {cells.map((iso, i) => {
          if (!iso) return <span key={`b${i}`} className="cal__blank" aria-hidden="true" />
          const d = days[iso]
          const past = isPast(iso)
          const open = Boolean(d?.open)
          const left = open ? seatsFor(iso) : 0
          const num = Number(iso.slice(8))
          const isToday = iso === today
          if (mode === 'admin') {
            const cls = ['cal__day', past ? 'is-past' : '', open ? 'is-open' : '', open && !past && left === 0 ? 'is-full' : '', selected === iso ? 'is-on' : '', isToday ? 'is-today' : ''].filter(Boolean).join(' ')
            return (
              <button
                key={iso} type="button" className={cls}
                disabled={past}
                aria-pressed={selected === iso}
                aria-label={`${num}${open ? `, ${t('admin.open')}, ${left} ${t('admin.of')} ${d.seats}` : `, ${t('admin.closed')}`}${past ? `, ${t('admin.pastDay')}` : ''}`}
                onClick={() => onPick(iso)}
              >
                <span className="cal__num">{num}</span>
                {open && !past && <span className="cal__seats">{left}/{d.seats}</span>}
                {open && past && <span className="cal__seats cal__seats--past">{t('cal.past')}</span>}
              </button>
            )
          }
          const selectable = open && !past && left > 0
          const cls = ['cal__day', past ? 'is-past' : '', open ? 'is-open' : '', open && !past && left === 0 ? 'is-full' : '', selected === iso ? 'is-on' : '', isToday ? 'is-today' : ''].filter(Boolean).join(' ')
          const label = open
            ? past ? `${num}, ${t('cal.past')}` : left === 0 ? `${num}, ${t('cal.full')}` : `${num}, ${left === 1 ? t('cal.seats1') : `${left} ${t('cal.seatsN')}`}`
            : String(num)
          return (
            <button
              key={iso} type="button" className={cls}
              disabled={!selectable}
              aria-pressed={selected === iso}
              aria-label={label}
              onClick={() => onPick(iso)}
            >
              <span className="cal__num">{num}</span>
              {open && !past && left > 0 && <span className="cal__seats">{left}</span>}
              {open && !past && left === 0 && <span className="cal__seats cal__seats--full">{t('cal.full')}</span>}
              {open && past && <span className="cal__seats cal__seats--past">{t('cal.past')}</span>}
            </button>
          )
        })}
      </div>
      {mode === 'public' && (
        <p className="cal__legend" aria-hidden="true">
          <span className="cal__key cal__key--open" /> {t('cal.legendOpen')}
          <span className="cal__key cal__key--full" /> {t('cal.legendFull')}
        </p>
      )}
    </div>
  )
}
