export const emailTemplateDefaults = [
  {
    template_key: "booking_received",
    label: "Nieuwe aanvraag ontvangen",
    subject: "We hebben je aanvraag ontvangen",
    body:
      "Hoi {{customer_name}},\n\nWat leuk dat je een aanvraag hebt gedaan voor {{shoot_type}}. Ik heb je gegevens ontvangen en kijk met liefde met je mee naar een passend moment.\n\nVia je beveiligde klantportaal kun je later je voorbereiding aanvullen en alle informatie volgen:\n{{portal_link}}{{giftcard_line}}",
  },
  {
    template_key: "admin_booking_received",
    label: "Nieuwe boekingsaanvraag admin",
    subject: "Nieuwe boekingsaanvraag van {{customer_name}}",
    body: "Er is een nieuwe boekingsaanvraag ontvangen.\n\nKlant: {{customer_name}}\nE-mail: {{customer_email}}\nShoot: {{shoot_type}}\nDatum: {{booking_date}}\nTijd: {{booking_time}}\nLocatie: {{location}}\nPakket: {{package_name}}\n\n{{deposit_line}}\n\nOpen de boeking:\n{{admin_link}}",
  },
  {
    template_key: "booking_confirmed",
    label: "Boeking bevestigd",
    subject: "Je fotoshoot is bevestigd",
    body:
      "Hoi {{customer_name}},\n\nJe {{shoot_type}} staat gepland op {{booking_date}} om {{booking_time}}. Fijn dat de afspraak vaststaat.\n\nIn je klantportaal vind je je afspraak, voorbereiding, overeenkomst, betaling, facturen en later je galerij:\n{{portal_link}}",
  },
  {
    template_key: "booking_cancelled",
    label: "Boeking geannuleerd",
    subject: "Je fotoshoot is geannuleerd",
    body: "Hoi {{customer_name}},\n\nJe {{shoot_type}} op {{booking_date}} is geannuleerd. Heb je hierover vragen of wil je samen naar een andere mogelijkheid kijken? Neem dan gerust contact met mij op.\n\nDe geldende annuleringsvoorwaarden blijven van toepassing.",
  },
  {
    template_key: "client_portal_ready",
    label: "Klantportaal beschikbaar",
    subject: "Je persoonlijke klantportaal staat klaar",
    body: "Hoi {{customer_name}},\n\nVia onderstaande beveiligde link vind je alles rond je {{shoot_type}} bij elkaar:\n{{portal_link}}\n\nBewaar deze link goed en deel hem niet openbaar.",
  },
  {
    template_key: "admin_reschedule_requested",
    label: "Verplaatsingsverzoek ontvangen admin",
    subject: "Verplaatsingsverzoek van {{customer_name}}",
    body: "Er is een verzoek om een fotoshoot te verplaatsen.\n\nKlant: {{customer_name}}\nShoot: {{shoot_type}}\nGewenste datum: {{preferred_date}}\nVoorkeur: {{preferred_period}}\nReden: {{reason}}\n\nOpen de boeking: {{admin_link}}",
  },
  {
    template_key: "reschedule_requested",
    label: "Verplaatsingsverzoek ontvangen klant",
    subject: "Je verzoek voor een andere datum is ontvangen",
    body: "Hoi {{customer_name}},\n\nIk heb je verzoek voor een andere datum voor de {{shoot_type}} ontvangen. Je voorkeur is {{preferred_date}} ({{preferred_period}}).\n\nJe huidige afspraak blijft staan totdat ik de wijziging heb beoordeeld en bevestigd.",
  },
  {
    template_key: "reschedule_status",
    label: "Uitkomst verplaatsingsverzoek",
    subject: "Update over je verzoek voor een andere datum",
    body: "Hoi {{customer_name}},\n\nJe verzoek voor {{preferred_date}} heeft nu de status: {{request_status}}.\n\n{{status_message}}\n\nDe actuele afspraak vind je in je klantportaal:\n{{portal_link}}",
  },
  {
    template_key: "payment_method_selected",
    label: "Betaalwijze gekozen klant",
    subject: "Je betaalwijze is opgeslagen",
    body: "Hoi {{customer_name}},\n\nJe hebt gekozen voor {{payment_method}} voor de aanbetaling van {{deposit_amount}}.{{payment_details}}\n\nIn je klantportaal zie je altijd de actuele betaalstatus:\n{{portal_link}}",
  },
  {
    template_key: "admin_payment_method_selected",
    label: "Betaalwijze gekozen admin",
    subject: "Betaalwijze gekozen door {{customer_name}}",
    body: "{{customer_name}} heeft {{payment_method}} gekozen voor een aanbetaling van {{deposit_amount}}.\n\nBetalingskenmerk: {{payment_reference}}\n\nOpen de boeking:\n{{admin_link}}",
  },
  {
    template_key: "deposit_requested",
    label: "Aanbetaling gevraagd",
    subject: "Aanbetaling voor je fotoshoot",
    body: "Hoi {{customer_name}},\n\nDe aanbetaling van {{deposit_amount}} voor je {{shoot_type}} staat klaar. Betaal deze uiterlijk op {{deposit_due_date}}.\n\nDe betaalwijze en betaalgegevens vind je in je klantportaal:\n{{portal_link}}",
  },
  {
    template_key: "deposit_received",
    label: "Aanbetaling ontvangen",
    subject: "Je aanbetaling is ontvangen",
    body: "Hoi {{customer_name}},\n\nDe aanbetaling van {{deposit_amount}} voor je {{shoot_type}} is ontvangen en verwerkt. Dank je wel. De actuele status staat ook in je klantportaal:\n{{portal_link}}",
  },
  {
    template_key: "deposit_refunded",
    label: "Aanbetaling terugbetaald",
    subject: "Je terugbetaling is geregistreerd",
    body: "Hoi {{customer_name}},\n\nDe terugbetaling van de aanbetaling voor je {{shoot_type}} is geregistreerd. Houd er rekening mee dat de verwerking door de bank nog enige tijd kan duren.",
  },
  {
    template_key: "deposit_expired",
    label: "Aanbetaling verlopen",
    subject: "De betaaltermijn van je aanbetaling is verlopen",
    body: "Hoi {{customer_name}},\n\nDe betaaltermijn voor de aanbetaling van je {{shoot_type}} is verlopen. Neem contact met mij op als je al hebt betaald of als er iets niet klopt.",
  },
  {
    template_key: "deposit_due_reminder",
    label: "Herinnering aanbetaling",
    subject: "Herinnering: aanbetaling uiterlijk {{deposit_due_date}}",
    body: "Hoi {{customer_name}},\n\nDit is een herinnering voor de aanbetaling van {{deposit_amount}} voor je {{shoot_type}}. De uiterste betaaldatum is {{deposit_due_date}}.\n\nJe betaalgegevens vind je in het klantportaal:\n{{portal_link}}",
  },
  {
    template_key: "contract_signed",
    label: "Overeenkomst ondertekend klant",
    subject: "Je overeenkomst is ondertekend",
    body: "Hoi {{customer_name}},\n\nJe overeenkomst voor de {{shoot_type}} is ondertekend door {{signer_name}} op {{signed_at}}. De ondertekening en gebruikte versie zijn veilig bij je boeking opgeslagen.",
  },
  {
    template_key: "admin_contract_signed",
    label: "Overeenkomst ondertekend admin",
    subject: "Overeenkomst ondertekend door {{customer_name}}",
    body: "{{customer_name}} heeft de overeenkomst voor {{shoot_type}} ondertekend.\n\nOndertekenaar: {{signer_name}}\nVersie: {{contract_version}}\nDatum: {{signed_at}}\n\nOpen de boeking:\n{{admin_link}}",
  },
  {
    template_key: "admin_questionnaire_updated",
    label: "Voorbereidingsvragen bijgewerkt admin",
    subject: "Voorbereiding bijgewerkt door {{customer_name}}",
    body: "{{customer_name}} heeft de voorbereidingsvragen voor {{shoot_type}} bijgewerkt.\n\nOpen de boeking om de antwoorden te bekijken:\n{{admin_link}}",
  },
  {
    template_key: "invoice_ready",
    label: "Factuur beschikbaar",
    subject: "Je factuur staat klaar",
    body: "Hoi {{customer_name}},\n\nFactuur {{invoice_number}} voor {{invoice_amount}} staat klaar in je klantportaal. Je kunt de factuur daar bekijken en als PDF downloaden:\n{{portal_link}}",
  },
  {
    template_key: "invoice_due_reminder",
    label: "Herinnering volledige factuur",
    subject: "Herinnering: factuur {{invoice_number}} uiterlijk {{invoice_due_date}}",
    body: "Hoi {{customer_name}},\n\nDit is een herinnering dat het volledige bedrag van {{invoice_amount}} voor je {{shoot_type}} uiterlijk op {{invoice_due_date}} betaald moet zijn.\n\nDe factuur en betaalgegevens vind je in je klantportaal:\n{{portal_link}}",
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
    template_key: "admin_waitlist_received",
    label: "Nieuwe wachtlijstaanmelding admin",
    subject: "Nieuwe wachtlijstaanmelding van {{customer_name}}",
    body: "Er is een nieuwe wachtlijstaanmelding.\n\nKlant: {{customer_name}}\nE-mail: {{customer_email}}\nShoot: {{shoot_type}}\nVoorkeur: {{preferred_period}}\n\nOpen de wachtlijst:\n{{admin_link}}",
  },
  {
    template_key: "waitlist_status",
    label: "Update wachtlijst klant",
    subject: "Update over de wachtlijst voor {{shoot_type}}",
    body: "Hoi {{customer_name}},\n\nEr is een update over je plek op de wachtlijst voor {{shoot_type}}. De nieuwe status is: {{request_status}}.\n\n{{status_message}}",
  },
  {
    template_key: "waitlist_slot_available",
    label: "Plek vrijgekomen voor wachtlijst",
    subject: "Er is een plek vrij voor je {{shoot_type}}",
    body:
      "Hoi {{customer_name}},\n\nEr is een plek vrijgekomen voor je {{shoot_type}} op {{offered_date}} van {{offered_start_time}} tot {{offered_end_time}}.\n\nVia onderstaande persoonlijke link kun je deze plek aanvragen:\n{{booking_link}}\n\nDit aanbod is geldig tot {{offer_expires_at}}. De plek is pas definitief gereserveerd nadat je de boekingsaanvraag hebt verstuurd en deze is bevestigd. Reageer daarom op tijd.",
  },
  {
    template_key: "giftcard_received",
    label: "Cadeaubon aanvraag ontvangen",
    subject: "Je cadeaubon aanvraag is ontvangen",
    body:
      "Hoi {{customer_name}},\n\nDank je wel voor je cadeaubon aanvraag van {{giftcard_amount}}. Ik neem contact met je op om de gegevens, betaling en verzending netjes af te stemmen.\n\nNa bevestiging en betaling is de cadeaubon geldig.",
  },
  {
    template_key: "admin_giftcard_received",
    label: "Nieuwe cadeaubonaanvraag admin",
    subject: "Nieuwe cadeaubonaanvraag van {{customer_name}}",
    body: "Er is een nieuwe cadeaubonaanvraag.\n\nKoper: {{customer_name}}\nE-mail: {{customer_email}}\nOntvanger: {{recipient_name}}\nWaarde: {{giftcard_amount}}\nLevering: {{delivery_method}}\n\nOpen de cadeaubonnen:\n{{admin_link}}",
  },
  {
    template_key: "giftcard_status",
    label: "Update cadeaubon klant",
    subject: "Update over je cadeaubon",
    body: "Hoi {{customer_name}},\n\nDe cadeaubon voor {{recipient_name}} heeft nu de status: {{request_status}}.\n\nCode: {{giftcard_code}}\nWaarde: {{giftcard_amount}}\n\n{{status_message}}",
  },
  {
    template_key: "mini_session_confirmed",
    label: "Mini-shoot bevestiging",
    subject: "Je mini-shoot aanvraag is ontvangen",
    body:
      "Hoi {{customer_name}},\n\nJe aanvraag voor {{mini_session_title}} is ontvangen. Ik neem contact met je op voor de definitieve bevestiging en eventuele praktische informatie.\n\nLeuk dat je erbij wilt zijn.",
  },
  {
    template_key: "admin_mini_session_received",
    label: "Nieuwe mini-shootaanvraag admin",
    subject: "Nieuwe aanvraag voor {{mini_session_title}}",
    body: "Er is een nieuwe mini-shootaanvraag.\n\nKlant: {{customer_name}}\nE-mail: {{customer_email}}\nMini-shoot: {{mini_session_title}}\nDatum: {{booking_date}}\nTijd: {{booking_time}}\n\nOpen de mini-shoots:\n{{admin_link}}",
  },
  {
    template_key: "mini_session_status",
    label: "Update mini-shoot klant",
    subject: "Update over je {{mini_session_title}}",
    body: "Hoi {{customer_name}},\n\nJe aanvraag voor {{mini_session_title}} heeft nu de status: {{request_status}}.\n\nDatum: {{booking_date}}\nTijd: {{booking_time}}\n\n{{status_message}}",
  },
];

export function renderTemplate(template, variables = {}) {
  return String(template || "").replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? "");
}
