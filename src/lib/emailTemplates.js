export const emailTemplateDefaults = [
  {
    template_key: "booking_received",
    label: "Nieuwe aanvraag ontvangen",
    subject: "We hebben je aanvraag ontvangen",
    body:
      "Hoi {{customer_name}},\n\nWat leuk dat je een aanvraag hebt gedaan voor {{shoot_type}}. Ik heb je gegevens ontvangen en kijk met liefde met je mee naar een passend moment.\n\nJe hoeft nu niets extra's te doen. Ik neem snel contact met je op om de datum, locatie en eventuele wensen samen af te stemmen.",
  },
  {
    template_key: "booking_confirmed",
    label: "Boeking bevestigd",
    subject: "Je fotoshoot is bevestigd",
    body:
      "Hoi {{customer_name}},\n\nJe {{shoot_type}} staat gepland op {{booking_date}} om {{booking_time}}. Fijn dat de afspraak vaststaat.\n\nAls er vooraf nog iets handig is om te weten, laat ik dat op tijd aan je weten. Ik kijk ernaar uit om jullie vast te leggen.",
  },
  {
    template_key: "shoot_reminder",
    label: "Reminder voor de shoot",
    subject: "Reminder voor je fotoshoot",
    body:
      "Hoi {{customer_name}},\n\nNog even en dan is je {{shoot_type}}. Denk alvast aan kleding waarin jullie je fijn voelen en neem vooral genoeg tijd om ontspannen te starten.\n\nHeb je nog vragen of wil je iets doorgeven? Stuur gerust een berichtje.",
  },
  {
    template_key: "preparation_tips",
    label: "Voorbereidingstips per shoot type",
    subject: "Tips voor je {{shoot_type}}",
    body:
      "Hoi {{customer_name}},\n\nVoor je {{shoot_type}} zijn zachte tinten, fijne stoffen en kleding zonder drukke prints vaak het mooist. Kies vooral iets waarin jullie jezelf herkennen.\n\nVoor kinderen helpt het om iets te drinken, een klein tussendoortje en eventueel een vertrouwd knuffeltje mee te nemen.",
  },
  {
    template_key: "gallery_ready",
    label: "Galerij is klaar",
    subject: "Je galerij staat klaar",
    body:
      "Hoi {{customer_name}},\n\nJe galerij staat klaar. Via deze link kun je de beelden bekijken en je favorieten kiezen:\n{{gallery_link}}\n\nJe pakket bevat {{included_images}} beelden. Extra beelden kun je later los bijbestellen als je meer favorieten hebt.",
  },
  {
    template_key: "gallery_selection_received",
    label: "Galerijkeuze ontvangen klant",
    subject: "Je fotokeuze is ontvangen",
    body:
      "Hoi {{customer_name}},\n\nDank je wel, je keuze uit de galerij is ontvangen.\n\nJe hebt {{selected_count}} beeld(en) gekozen. Je pakket bevat {{included_images}} beeld(en).{{extra_line}}\n\nIk ga met je selectie aan de slag. Als er extra beelden zijn gekozen, stem ik de betaling eerst nog met je af.",
  },
  {
    template_key: "admin_gallery_selection_received",
    label: "Galerijkeuze ontvangen admin",
    subject: "Nieuwe fotokeuze ontvangen: {{gallery_title}}",
    body:
      "Er is een nieuwe fotokeuze ingestuurd.\n\nKlant: {{customer_name}}\nGalerij: {{gallery_title}}\nGekozen beelden: {{selected_count}}\nExtra beelden: {{extra_count}}\n\nGekozen foto's:\n{{selected_photos}}\n\nOpen admin om de keuze te verwerken: {{admin_link}}",
  },
  {
    template_key: "extra_images_selected",
    label: "Extra beelden gekozen",
    subject: "Extra beelden gekozen",
    body:
      "{{customer_name}} heeft {{extra_images}} extra beelden gekozen in de galerij:\n{{gallery_link}}",
  },
  {
    template_key: "waitlist_confirmed",
    label: "Wachtlijst bevestiging",
    subject: "Je staat op de wachtlijst",
    body:
      "Hoi {{customer_name}},\n\nJe staat op de wachtlijst voor {{shoot_type}}. Als er een passende plek vrijkomt, neem ik contact met je op.\n\nDank je wel voor je geduld.",
  },
  {
    template_key: "giftcard_received",
    label: "Cadeaubon aanvraag ontvangen",
    subject: "Je cadeaubon aanvraag is ontvangen",
    body:
      "Hoi {{customer_name}},\n\nDank je wel voor je cadeaubon aanvraag van {{giftcard_amount}}. Ik neem contact met je op om de gegevens, betaling en verzending netjes af te stemmen.\n\nNa bevestiging en betaling is de cadeaubon geldig.",
  },
  {
    template_key: "mini_session_confirmed",
    label: "Mini-shoot bevestiging",
    subject: "Je mini-shoot aanvraag is ontvangen",
    body:
      "Hoi {{customer_name}},\n\nJe aanvraag voor {{mini_session_title}} is ontvangen. Ik neem contact met je op voor de definitieve bevestiging en eventuele praktische informatie.\n\nLeuk dat je erbij wilt zijn.",
  },
];

export function renderTemplate(template, variables = {}) {
  return String(template || "").replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? "");
}
