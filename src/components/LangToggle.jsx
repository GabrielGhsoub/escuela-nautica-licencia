/* The ES/EN switch in the header. Two labelled, pressable buttons rather than
   one that shows the "other" language: an owner watching the demo should see
   at a glance that the page exists in both, and which one is on. */
import { useLang } from '../i18n.js'

export default function LangToggle() {
  const { lang, setLang, t } = useLang()
  return (
    <div className="top__lang" role="group" aria-label={t('lang.groupAria')}>
      <button
        type="button" lang="es"
        className={lang === 'es' ? 'is-on' : ''}
        aria-pressed={lang === 'es'}
        onClick={() => setLang('es')}
      >
        ES
      </button>
      <button
        type="button" lang="en"
        className={lang === 'en' ? 'is-on' : ''}
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
      >
        EN
      </button>
    </div>
  )
}
