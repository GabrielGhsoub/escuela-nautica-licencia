/* An email, drawn on the page. The done screen shows the two messages the real
   version would send (receipt to the student, notice to the school) so the
   owner sees the whole loop without anything leaving the browser. */
import { useLang } from '../i18n.js'
import { brand, school } from '../data/licencia.js'

export default function MailPreview({ label, from, to, subject, children }) {
  const { t } = useLang()
  return (
    <article className="mail">
      <div className="mail__brand">
        <img src={brand.logo} alt={school.name} width={brand.logoWidth} height={brand.logoHeight} />
      </div>
      <header className="mail__head">
        <span className="mail__label">{label}</span>
        <dl>
          <div><dt>{t('mail.from')}</dt><dd>{from}</dd></div>
          <div><dt>{t('mail.to')}</dt><dd>{to}</dd></div>
          <div><dt>{t('mail.subject')}</dt><dd><strong>{subject}</strong></dd></div>
        </dl>
      </header>
      <div className="mail__body">{children}</div>
    </article>
  )
}
