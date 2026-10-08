# Reserva de plaza, Licencia de Navegación: demo handover

Live: https://gabrielghsoub.github.io/escuela-nautica-licencia/
School panel: https://gabrielghsoub.github.io/escuela-nautica-licencia/#admin
Prepared 2026-10-07 for Escuela Náutica de Valencia (Dani), from his WhatsApp
message of the same day and the public content of escuelanauticadevalencia.es.

## What the demo does

Public side, three steps in Spanish (tú form), with an EN toggle:

1. Elige el día. A month calendar (opens on the current month, arrows reach
   November and December 2026). Open days show the seats left; a day with no
   seats reads "Completo" and cannot be chosen; past days are shown as past.
   Each date card carries the hours (de 9 a 13 h), the place (Marina Port
   Valencia) and the seats left. Under the calendar: "Otras fechas: consulta
   por WhatsApp" linking to wa.me/34655487716. Months without dates say so.
2. Tus datos. Nombre, Apellidos, Número de DNI/NIE o pasaporte, Correo
   electrónico, Teléfono (opcional). The ID field uppercases as you type,
   validates the DNI and NIE checksum letter, accepts a passport by shape
   (6 to 12 letters or digits) and tells you which format it recognised. One
   required checkbox linking to the published booking policy. One line: "El
   día del curso trae tu DNI, NIE o pasaporte y el certificado psicotécnico."
   No upload, no photo.
3. Reserva de plaza, 19 €. A simulated checkout: card (number, expiry, CVC,
   name, with masks) or Bizum (phone). The amounts are shown as a
   breakdown: "Señal 19 €, se paga ahora, a cuenta de los 99 €", "Resto en el
   barco 80 €, el día de la práctica, en efectivo o Bizum" and "Total del
   curso 99 €, señal incluida". The intro block above the steps shows the
   same three figures. One discreet line says the payment is simulated.

Done screen: summary (day, hours, place, name, ID masked to the last three
characters plus the letter, email, "Pendiente: 80 € en el barco el día de la
práctica (efectivo o Bizum)", "Total del curso: 99 €"), a "señal de 19 €
pagada (simulado)" chip, and the two emails the real version would send,
rendered inline: the receipt to the student (señal pagada 19 €, resto 80 € a
pagar en el barco el día de la práctica en efectivo o Bizum, total 99 €) and
the notice to info@escuelanauticadevalencia.es (señal cobrada 19 €, pendiente
en el barco 80 €), labelled as "así llegarían en la versión real". Nothing is
sent. A link opens the panel.

Owner side (#admin):

- Reservas: bookings grouped by day with full name, full ID number, email,
  phone, a paid chip ("señal 19 € pagada", card or Bizum), a "80 €
  pendientes en el barco" tag while the booking is confirmada (it goes once
  the booking is marked asistió or cancelada), status chips (confirmada,
  asistió, cancelada) with one tap actions. The visitor's own booking is
  tagged "tuya"; seeded ones are tagged "ejemplo".
- Días disponibles: a month grid where a tap selects a day; from there the
  owner opens or closes it and sets its seats (default 5, range 1 to 12).
  The public calendar reads the same data, so closing a day removes it from
  what the student sees, and a cancelled booking gives its seat back.
- Stats: plazas vendidas este mes, próximos días con plazas, señales
  cobradas este mes (19 € per non cancelled booking), pendiente en el barco
  este mes (80 € per booking still confirmada, that is neither cancelled nor
  marked asistió).

All state lives in the browser tab (sessionStorage) and dies with it. Each
visitor sees their own copy; nobody else sees what anyone types.

## Assumptions and placeholders

- 19 € is Dani's own number for the reservation (WhatsApp, 7 Oct 2026).
- 99 € is the course price on his page (150 € shown struck through, as on his
  page).
- The 80 € balance is Dani's own stated fact (WhatsApp, 8 Oct 2026): "Sí, son
  una señal (a modo de reserva) a cuenta de los 99€, así abonan el resto
  (80€) en el barco el día de la práctica en efectivo o Bizum". So the 19 € is
  a señal paid online and counted toward the 99 €; the remaining 80 € is paid
  on the boat on the practice day, in cash or Bizum. In the code the balance
  is derived (price minus deposit), so 19 + 80 = 99 holds everywhere a figure
  is computed; the prose strings in src/i18n.js state the same numbers.
- 5 seats per day comes from the boat maximum quoted in the brief ("máximo 5
  tripulantes más un Patrón Profesional"). I could not find that sentence on
  the pages I fetched tonight (home, Licencia, nosotros, prácticas, alquiler),
  so treat it as his number to confirm.
- The dates are his published calendar as read on 7 Oct 2026: 28 Sep and
  30 Sep (completo), 5 Oct, 8 Oct, 17 Oct and 31 Oct. Everything up to and
  including today is shown as past, so on 7 Oct the three before are past
  and 8, 17 and 31 October are open. The page keeps using the real date, so
  the picture ages correctly.
- Seat counts per day (8 Oct: 2 left, 17 Oct: 5 left, 31 Oct: 4 left) and
  every booking in the panel are invented, with example emails ending in
  ".ejemplo@". They are labelled "ejemplo" in the panel.
- Email and phone are additions to his three fields (name, surname, ID).
  Email is required because the receipt needs somewhere to go; phone is
  optional, for a same day notice.
- The policy checkbox links to his footer page "Política de Reservas, Cambios
  y Cancelaciones":
  https://escuelanauticadevalencia.es/politica-de-reservas-cambios-y-cancelaciones-de-practicas/
  The demo states no policy of its own: no cancellation rule, no refund
  rule, no confirmation time.
- The requirements list, the hours, the place, the "sin examen" and the
  "te llevas la licencia al terminar" wording are from his Licencia page.
- Payment is simulated. Any well formed card number or phone is accepted,
  nothing is checked against a network, nothing is stored beyond the form
  state in the tab, and no card brand is named (just "Tarjeta").
- Nothing is sent: no email, no WhatsApp, no notification. The two emails on
  the done screen are drawings of what the real version would send.

## What the real version needs from him

- A place to live: a subdomain on his domain (for example
  reservas.escuelanauticadevalencia.es) or a page on his WordPress site.
- His own payment account: a card acquirer (Stripe, Redsys through his bank,
  or similar) and Bizum, which comes through a Spanish bank's TPV. The
  charge then lands directly in the school account; nothing passes through
  us.
- The notifications: the receipt to the student from his own mailbox and the
  notice to info@escuelanauticadevalencia.es, so the sender is the school.
- A decision on the ID numbers: where they live (a small database behind the
  page, not a spreadsheet by email), who can see them (him), and for how long
  (a retention period, for example until the course day plus whatever his
  records need). The panel shows the full number because the school needs it
  to issue the licence; the student's receipt shows it masked.
- What his policy says when someone cancels (the 19 € rule itself is now
  confirmed: a señal counted toward the 99 €). The page will state exactly
  what he publishes and nothing more.
- A list of the days he wants open each month and the seats per day; the
  panel gives him the tool to maintain it himself.

## Running it

    npm install
    npm run dev        # http://localhost:5173/escuela-nautica-licencia/
    npm run build      # dist/
    npm run preview

Deploy: build, copy dist/index.html to dist/404.html, commit, then push the
dist subtree to the gh-pages branch:

    git push origin $(git subtree split --prefix dist master):gh-pages --force
