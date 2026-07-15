import { ArrowRight, CalendarHeart, Images, MapPin, MessageCircle, Search, Sparkles, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button.jsx";
import FAQItem from "../components/FAQItem.jsx";
import SEO from "../components/SEO.jsx";
import { faqs as fallbackFaqs } from "../data/faq.js";
import { getVisibleFaqs } from "../lib/api.js";
import { mergeFaqs } from "../lib/faqUtils.js";

const topics = [
  { id: "all", label: "Alles", icon: Sparkles },
  { id: "booking", label: "Boeken", icon: CalendarHeart },
  { id: "location", label: "Locatie & kosten", icon: MapPin },
  { id: "gallery", label: "Galerij & foto's", icon: Images },
  { id: "portal", label: "Klantportaal", icon: UserRound },
  { id: "specials", label: "Acties & shoots", icon: MessageCircle },
];

function getFaqTopic(item) {
  const text = `${item.question || ""} ${item.answer || ""}`.toLowerCase();

  if (["klantportaal", "bankoverschrijving", "contant betalen", "digitale overeenkomst", "factuur", "facturen", "betalingskenmerk", "andere datum aanvragen", "aanbetaling", "restbedrag", "betaaltermijn", "betaalherinnering", "herinneringsmail", "voorbereidingsvragen", "annuleringsvoorwaarden"].some((keyword) => text.includes(keyword))) {
    return "portal";
  }

  if (
    ["galerij", "favoriete", "favorieten", "foto's gekozen", "beelden gekozen", "online", "ontvang ik mijn foto's"].some(
      (keyword) => text.includes(keyword),
    )
  ) {
    return "gallery";
  }

  if (
    ["locatie", "zoutkamp", "pakket", "extra beeld", "extra foto's", "kosten", "inbegrepen"].some((keyword) =>
      text.includes(keyword),
    )
  ) {
    return "location";
  }

  if (
    ["korting", "model", "mini-shoot", "mini shoot", "cadeaubon", "wachtlijst", "winactie", "giveaway"].some(
      (keyword) => text.includes(keyword),
    )
  ) {
    return "specials";
  }

  return "booking";
}

export default function Faq() {
  const [faqs, setFaqs] = useState(fallbackFaqs);
  const [activeTopic, setActiveTopic] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;

    getVisibleFaqs()
      .then((rows) => {
        if (active) setFaqs(mergeFaqs(rows || [], fallbackFaqs));
      })
      .catch(() => {
        // De lokale FAQ blijft zichtbaar als Supabase tijdelijk niet bereikbaar is.
      });

    return () => {
      active = false;
    };
  }, []);

  const decoratedFaqs = useMemo(
    () =>
      faqs.map((item) => ({
        ...item,
        topic: getFaqTopic(item),
      })),
    [faqs],
  );

  const topicCounts = useMemo(() => {
    const counts = { all: decoratedFaqs.length };
    topics.forEach((topic) => {
      if (topic.id !== "all") {
        counts[topic.id] = decoratedFaqs.filter((item) => item.topic === topic.id).length;
      }
    });
    return counts;
  }, [decoratedFaqs]);

  const filteredFaqs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return decoratedFaqs.filter((item) => {
      const matchesTopic = activeTopic === "all" || item.topic === activeTopic;
      const matchesQuery =
        !normalizedQuery ||
        item.question.toLowerCase().includes(normalizedQuery) ||
        item.answer.toLowerCase().includes(normalizedQuery);
      return matchesTopic && matchesQuery;
    });
  }, [activeTopic, decoratedFaqs, query]);

  return (
    <>
      <SEO
        title="FAQ"
        description="Veelgestelde vragen over fotoshoots boeken, pakketten, locaties, online galerijen en korting bij Cuddling Memories Fotografie."
      />
      <section className="pt-32 pb-20">
        <div className="container-soft">
          <div className="grid items-stretch gap-8 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="flex flex-col justify-center rounded-lg bg-card/78 p-6 shadow-soft warm-border sm:p-8 lg:p-10">
              <p className="script-line text-4xl text-cocoa sm:text-5xl">Goed om te weten</p>
              <h1 className="display-title mt-2 max-w-3xl text-5xl font-semibold leading-none text-coffee sm:text-6xl lg:text-7xl">
                Alles over jouw fotoshoot
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-coffee/72">
                Van boeken tot locaties, pakketprijzen, kortingen en de online galerij. Hier vind je snel wat je vooraf
                wilt weten, zonder dat je door losse pagina's hoeft te zoeken.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-linen/70 p-4 warm-border">
                  <p className="text-3xl font-semibold display-title text-coffee">{decoratedFaqs.length}</p>
                  <p className="mt-1 text-xs font-semibold fine-label text-cocoa">Antwoorden</p>
                </div>
                <div className="rounded-lg bg-linen/70 p-4 warm-border">
                  <p className="text-3xl font-semibold display-title text-coffee">{topics.length - 1}</p>
                  <p className="mt-1 text-xs font-semibold fine-label text-cocoa">Onderwerpen</p>
                </div>
                <div className="rounded-lg bg-linen/70 p-4 warm-border">
                  <p className="text-3xl font-semibold display-title text-coffee">1</p>
                  <p className="mt-1 text-xs font-semibold fine-label text-cocoa">Plek voor alles</p>
                </div>
              </div>
            </div>

            <div className="relative min-h-[22rem] overflow-hidden rounded-lg shadow-soft warm-border">
              <img
                src="/images/instagram/instagram-04.jpg"
                alt="Warme fotografie van Cuddling Memories"
                className="h-full min-h-[22rem] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-coffee/70 via-coffee/18 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-card sm:p-8">
                <p className="text-xs font-semibold fine-label text-card/80">Vooraf geregeld</p>
                <p className="mt-3 max-w-md text-3xl font-semibold leading-tight display-title">
                  Minder twijfel, meer zin in de shoot.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-card/82 p-4 shadow-soft warm-border sm:p-5">
            <div className="grid gap-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cocoa" size={18} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Zoek bijvoorbeeld locatie, galerij of korting"
                  className="min-h-12 w-full rounded-full border border-cocoa/20 bg-cream/70 px-12 text-sm text-coffee outline-none transition placeholder:text-coffee/38 focus:border-cocoa/50 focus:bg-card"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-cocoa transition hover:bg-linen"
                    aria-label="Zoekopdracht wissen"
                  >
                    <X size={16} />
                  </button>
                )}
              </label>

              <div className="flex max-w-full gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
                {topics.map((topic) => {
                  const Icon = topic.icon;
                  const selected = activeTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setActiveTopic(topic.id)}
                      className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-semibold fine-label transition ${
                        selected
                          ? "border-cocoa bg-cocoa text-card shadow-glow"
                          : "border-cocoa/20 bg-card/60 text-coffee hover:border-cocoa/45 hover:bg-linen/60"
                      }`}
                    >
                      <Icon size={15} />
                      <span>{topic.label}</span>
                      <span className={`font-sans text-[0.68rem] ${selected ? "text-card/80" : "text-cocoa/70"}`}>
                        {topicCounts[topic.id] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.32fr_0.68fr]">
            <aside className="rounded-lg bg-linen/58 p-6 warm-border lg:sticky lg:top-32 lg:self-start">
              <p className="text-xs font-semibold fine-label text-cocoa">Snel overzicht</p>
              <h2 className="display-title mt-3 text-3xl font-semibold leading-tight text-coffee">
                {filteredFaqs.length === 1 ? "1 vraag gevonden" : `${filteredFaqs.length} vragen gevonden`}
              </h2>
              <p className="mt-4 text-sm leading-7 text-coffee/70">
                Gebruik de onderwerpen of zoek op een woord. De antwoorden openen direct op deze pagina.
              </p>
              <Button to="/contact" variant="secondary" className="mt-6 w-full gap-2">
                Stel je vraag
                <ArrowRight size={16} />
              </Button>
            </aside>

            <div className="grid gap-4">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((item, index) => (
                  <FAQItem key={item.id || item.question} item={item} defaultOpen={index === 0} index={index} />
                ))
              ) : (
                <div className="rounded-lg bg-card p-8 text-center shadow-soft warm-border">
                  <p className="script-line text-4xl text-cocoa">Geen match</p>
                  <h2 className="display-title mt-2 text-4xl font-semibold text-coffee">Deze vraag vind ik niet terug</h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-coffee/70">
                    Probeer een ander zoekwoord of stuur je vraag direct mee met je aanvraag.
                  </p>
                  <Button to="/contact" className="mt-6">
                    Neem contact op
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 overflow-hidden rounded-lg bg-coffee shadow-soft warm-border">
            <div className="grid items-center gap-0 lg:grid-cols-[0.7fr_0.3fr]">
              <div className="p-7 text-card sm:p-10">
                <p className="script-line text-4xl text-blush">Toch nog iets onduidelijk?</p>
                <h2 className="display-title mt-2 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
                  Dan kijk ik gewoon even met je mee.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-card/76">
                  Je hoeft niet alles vooraf precies te weten. In je aanvraag kun je extra wensen, een kortingsactie of
                  twijfel over pakket of locatie kwijt.
                </p>
                <Button to="/boek-een-shoot" className="mt-7 bg-card text-coffee hover:bg-linen">
                  Boek een shoot
                </Button>
              </div>
              <img
                src="/images/detail-soft.jpg"
                alt="Zachte detailfoto"
                className="h-64 w-full object-cover opacity-85 lg:h-full"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
