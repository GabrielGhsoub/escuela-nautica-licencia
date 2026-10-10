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
2. Tus datos. Nombre, Apellidos, DNI, NIE o pasaporte, Correo
   electrónico, Teléfono (required since 9 Oct, see below). Nombre and
   Apellidos uppercase as you type. The ID field uppercases as you type,
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
   señal and the balance (the "Precio del curso" box went on 9 Oct at his
   request). One discreet line says the payment is simulated.

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
  required since 9 Oct because, in his words, he sends the exact location
  and the theory material through it.
- The policy checkbox links to his footer page "Política de Reservas, Cambios
  y Cancelaciones":
  https://escuelanauticadevalencia.es/politica-de-reservas-cambios-y-cancelaciones-de-practicas/
  The demo states no policy of its own: no cancellation rule, no refund
  rule, no confirmation time.
- The requirements list, the hours, the place, the "sin examen" and the
  "te llevas la licencia al terminar" wording are from his Licencia page,
  with his 9 Oct correction to the practice line (see below).
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

## Cambios 2026-10-09 (Dani)

Seven changes from his review of the demo, in the order he gave them. His
words are quoted; nothing else was touched (the 19 / 80 / 99 amounts, the
simulated payment note and the panel logic are as they were on 8 Oct).

1. **Teléfono obligatorio.** "El teléfono pone OPCIONAL, necesito que sea
   obligatorio ya que a través del teléfono les puedo mandar la ubicación de
   donde estamos exactamente y también les envío la parte de teoría." The
   phone field is now required in both languages, the "opcional" tag is
   gone, the progress bar counts five fields, and the helper line under it
   says why in his voice: "Por teléfono te mandamos la ubicación exacta de
   donde estamos y la parte de teoría." / "By phone we send you the exact
   location where we are and the theory material." Validation
   (src/validators.js, telOk): an optional + and 9 to 15 digits once spaces,
   dots, brackets and dashes are stripped; where libphonenumber recognises
   the number it must also be a possible length for that country. The
   control still prefixes the dial code, so "+34" alone fails and "+34" plus
   a 9 digit Spanish number passes. Error text: "Escribe un teléfono
   válido: 9 cifras si es español, con el prefijo del país si no lo es."
2. **Letra, tamaño y colores de la web.** "Me gustaría que la letra, tamaño
   y colores sean los de la web, para que no parezca que has entrado en
   otro sitio distinto." Every value now comes from his own stylesheets,
   fetched with curl on 2026-10-09 (the full table is at the top of
   src/theme.css). Sources:
   - Elementor global kit (colours, typography, buttons, inputs):
     https://escuelanauticadevalencia.es/wp-content/uploads/elementor/css/post-33.css?ver=1791335683
   - Home page: .../uploads/elementor/css/post-37.css?ver=1791336296
   - Licencia page: .../uploads/elementor/css/post-1117.css?ver=1791342487
   - Header template: .../uploads/elementor/css/post-408.css?ver=1791335684
   - Theme base: .../themes/hello-elementor/style.min.css?ver=3.3.0
   - Font: the Google Fonts link his pages carry (id google-fonts-1-css):
     https://fonts.googleapis.com/css?family=Montserrat:100,...,900italic&display=swap
     now linked from index.html the same way; the self hosted Inter and
     Space Grotesk files are gone (src/fonts.css deleted).

   Values taken, kit token to demo variable:
   - primary #2FA4FF (buttons, links) -> --blue
   - secondary #0E185F (button hover, dark bands, sticky header in
     post-408.css) -> --navy, the header
   - accent #0E185F (h1 to h6) -> headings
   - text #6E6E6E -> --ink-soft, body text
   - 2d6a869 #DADADA (input borders) -> --line
   - 6b0ce64 #F3F3F3 (grey bands) -> --sand
   - f2e50b6 #EEF7FF73 (light blue tint) -> --foam, used without the alpha
   - #000739 (post-37.css, the darkest navy on the home page) -> --navy-deep
   - #000000 (post-1117.css content text) -> --ink
   - body background #fff (hello-elementor style.min.css) -> --white, body
   - border-radius 7px (post-1117.css, the only rounded corner he uses) ->
     --radius; buttons and inputs are square as in the kit
   - typography: Montserrat throughout; body 18px / 1.5 (html font-size,
     so every rem follows); h1 60px bold (45px at <=1024px, 35px at
     <=767px); the panel headings use the kit's h4 (25/23/20px) and the
     small headings its h5 (20/20/18px), the done title its h3 (35/30/23),
     all bold; buttons use the kit "accent" style: 12px bold uppercase,
     letter-spacing 2px, line-height 1.3, 2px border, padding 17px 37px,
     primary fill turning secondary on hover; inputs 18px with a 2px
     #DADADA border and 20px side padding.
   - Not copied on purpose: the kit capitalises every word of h1 and h2;
     the headings here read as sentences.
3. **Nombre y apellidos en mayúsculas.** "Que el apartado de NOMBRE y
   APELLIDOS salga en mayúsculas cuando lo escriban." Both fields uppercase
   as you type (formatName in src/masks.js, the same mechanism as the ID
   field; accents survive, "núria" becomes "NÚRIA"), the stored booking
   keeps them uppercase, and every place a name is shown (recap, summary,
   both emails, the panel, including the example bookings) passes through
   the same function.
4. **Logo de la escuela.** "Tiene que aparecer el logo de la escuela." His
   header logo is the <img> his header template shows on every page:
   https://escuelanauticadevalencia.es/wp-content/uploads/2025/01/ESCUELA-NAU-e1739526451490.png
   (873 x 246 PNG, white wordmark with the coloured paper boat on a
   transparent background). Copied unchanged to
   public/logo-escuela-nautica-valencia.png and shown in the navy header of
   the page and of the panel (alt text: the school name), and on a navy
   band at the top of the two email mockups on the done screen, the way a
   real mail from the school would carry it. His site icon
   (cropped-ESCUELA-NAU-favicon-32x32.png and -192x192.png, same uploads
   folder) replaced the anchor emoji as the tab icon. It is an image mark,
   not a text one. The footer version (LOGO-NEGATIVO.png) returns 404 on
   his site and was not used.
5. **Sin el recuadro del precio.** "En la página de inicio, donde pone los
   precios, el recuadro del PRECIO DEL CURSO lo quitaría." The "Precio del
   curso 99 €" box is gone from the intro; "Señal al reservar 19 €" and
   "Resto en el barco 80 €" stay. The checkout breakdown and both emails
   still state the 99 € total as before.
6. **Nueva descripción.** "Tu licencia en una mañana en Marina Port
   Valencia, de 9 a 13h. Te llevas tu título al terminar." Replaces the lede
   under the h1, verbatim. EN: "Your licence in one morning at Marina Port
   Valencia, 9 to 13h. You take your certificate home when you finish."
7. **Prácticas de seguridad y navegación.** "En requisitos: pone prácticas
   de navegación y debe de poner 'prácticas de seguridad y navegación'."
   The requirements line now reads "Completar 4 horas de prácticas de
   seguridad y navegación" (src/data/licencia.js) and in English "4 hours of
   safety and navigation practice". His own page still says "prácticas de
   navegación"; worth changing there too.

Checked before deploy: no inverted question mark and no dash character of
any kind in the user facing strings (src/i18n.js, src/data/licencia.js);
production build clean; the built page walked through in a browser (intro,
form with the phone error, uppercase names, checkout, done screen with the
logo band on both emails, panel).

## Cambios 2026-10-10

Dos entradas: el aviso de Dani desde el móvil y, después, la revisión
general del formulario (validación completa y animaciones más sobrias).

1. **Etiqueta del documento más corta.** Dani, 10 Oct 15:51 desde el móvil:
   la etiqueta "Número de DNI/NIE o pasaporte" no cabía en el campo y se
   montaba sobre la línea de ayuda. Ahora dice "DNI, NIE o pasaporte" (EN:
   "ID, NIE or passport"). Además la etiqueta flotante de todos los campos
   queda acotada dentro de su caja (src/app.css, .fld__label): nunca salta a
   una segunda línea; si algún día un texto no cupiera, se recorta con puntos
   suspensivos dentro del campo. Comprobado con Playwright a 360 y 390 px en
   los cinco campos y en los dos idiomas.
2. **Validación con esquemas (zod).** Cada campo se valida al salir de él y
   al enviar, con un mensaje claro debajo (src/schema.js, mensajes en
   src/i18n.js):
   - Nombre y apellidos: letras con acentos, espacios y apóstrofos, de 2 a 60
     caracteres; siguen saliendo en mayúsculas al escribir.
   - DNI, NIE o pasaporte: letra de control real del DNI (número módulo 23),
     NIE X/Y/Z + 7 cifras + letra con la misma comprobación, pasaporte de 6 a
     12 letras o cifras. La línea de ayuda dice qué formato ha reconocido.
   - Correo: se recorta y pasa a minúsculas al salir del campo; pide un
     dominio completo (pepe@gmail no vale).
   - Teléfono (obligatorio, como pidió el 9 Oct): español de 9 cifras que
     empiece por 6, 7, 8 o 9; de otro país, con su prefijo y una longitud
     posible para ese país (libphonenumber).
   - Día: al continuar y al pagar se vuelve a comprobar contra el calendario
     vivo que el día sigue abierto, no ha pasado y le queda plaza; si no, el
     alumno vuelve al calendario con el motivo ("Ese día se ha completado
     mientras rellenabas el formulario. Elige otro.").
   - Casilla de la política de reservas: obligatoria.
   - Panel: las plazas por día quedan entre 1 y 12, número entero.
   El botón Continuar (y Pagar en el paso 3) está desactivado hasta que todo
   es válido, con una línea discreta que lo explica. Los errores llevan
   aria-invalid y aria-describedby para lectores de pantalla.
3. **Animaciones más sobrias (motion, la librería de Framer Motion).** Sin
   rebotes ni muelles en ningún sitio: entrada de la página y del panel con
   un fundido y 12 px de subida; transición entre pasos de 18 px; botones y
   días del calendario con hover al 101 % y pulsación al 98 % en 180 ms
   (ease-out); errores que aparecen con un fundido; en la pantalla final la
   marca de verificación se dibuja en 450 ms, sin confeti. Si el sistema
   tiene activado "reducir movimiento", no hay entrada animada.
4. **Tests y comprobaciones.** `npm test` (tests/validators.test.mjs, 10
   casos: letras de control de DNI y NIE, pasaportes, teléfonos españoles y
   extranjeros, días pasados/cerrados/completos, correo, nombres, tarjeta,
   Bizum, plazas) y `npm run lint:strings` (ningún guion ni signo de
   interrogación invertido en los textos). `npm run check` lanza los dos.
5. **Tamaño del bundle.** Antes: 476,7 kB (143,8 kB gzip). Después: 496,5
   kB (149,9 kB gzip); la validación usa zod/mini para que el coste sea de
   6 kB comprimidos.

Sin tocar: marca (Montserrat, colores, logo), señal de 19 € y 80 € en el
barco, teléfono obligatorio y su línea de ayuda, nombres en mayúsculas, sin
recuadro de "Precio del curso", y el resto de los siete cambios del 9 Oct.

## Running it

    npm install
    npm run dev        # http://localhost:5173/escuela-nautica-licencia/
    npm run check      # string linter + validator tests
    npm run build      # dist/
    npm run preview

Deploy: build, copy dist/index.html to dist/404.html, commit, then push the
dist subtree to the gh-pages branch:

    git push origin $(git subtree split --prefix dist master):gh-pages --force
