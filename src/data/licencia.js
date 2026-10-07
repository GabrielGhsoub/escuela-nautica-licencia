/* Every word and number here was read off
   escuelanauticadevalencia.es/titulaciones-nauticas-en-valencia/licencia-de-navegacion/
   on 2026-10-07. Nothing invented, nothing rounded. The two numbers that are
   NOT from that page are marked. */

export const school = {
  name: 'Escuela Náutica de Valencia',
  place: 'Marina Port Valencia',
  phone: '655 48 77 16',
  phoneHref: 'tel:+34655487716',
  whatsapp: 'https://wa.me/34655487716',
  email: 'info@escuelanauticadevalencia.es',
  site: 'https://escuelanauticadevalencia.es',
  privacyUrl: 'https://escuelanauticadevalencia.es/politica-de-privacidad/',
  /* Footer link titled "Política de Reservas, Cambios y Cancelaciones",
     resolved and checked live on 2026-10-07 (301 to the trailing slash). */
  policyUrl: 'https://escuelanauticadevalencia.es/politica-de-reservas-cambios-y-cancelaciones-de-practicas/',
}

export const course = {
  name: 'Licencia de Navegación',
  /* "PRECIO 150€ 99€" on his page: 99 is the price, 150 is struck through. */
  price: 99,
  priceBefore: 150,
  /* 19 is the owner's own number, given on WhatsApp on 2026-10-07. The page
     never says what happens with the difference to 99, because he has not
     published that. */
  deposit: 19,
  hours: 'de 9 a 13 h',
  place: 'Marina Port Valencia',
  /* Capacity per day. Five is the boat maximum quoted from his site in the
     brief ("máximo 5 tripulantes más un Patrón Profesional"); the seat counts
     per day in the demo are invented and labelled "ejemplo" in the panel. */
  capacity: 5,
}

/* His own calendar block, as published on 2026-10-07:
   lunes 28 septiembre COMPLETO, miércoles 30 septiembre COMPLETO,
   lunes 5 octubre DISPONIBLE, jueves 8 octubre DISPONIBLE,
   sábado 17 octubre DISPONIBLE, sábado 31 octubre DISPONIBLE.
   The three before today are shown as past; the page is dated. */
export const publishedDays = [
  '2026-09-28',
  '2026-09-30',
  '2026-10-05',
  '2026-10-08',
  '2026-10-17',
  '2026-10-31',
]

/* "Requisitos para la Licencia de Navegación", his list, verbatim. */
export const requirements = [
  'Ser mayor de 16 años (con autorización familiar)',
  'Realizar 2 horas de teoría (sin examen)',
  'Completar 4 horas de prácticas de navegación',
  'Presentar un certificado psicotécnico',
]

export const bring = 'El día del curso trae tu DNI, NIE o pasaporte y el certificado psicotécnico.'
