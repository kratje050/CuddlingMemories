import { ArrowRight, Facebook, Instagram, Mail, MessageCircle, Send, Sparkles } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import Button from "../components/Button.jsx";
import SEO from "../components/SEO.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import { usePageMeta } from "../lib/usePageMeta.js";

const fallbackEmail = "ddytuber@gmail.com";

export default function Contact() {
  const location = useLocation();
  const settings = useSiteSettings();
  const email = settings.primary_email || fallbackEmail;
  const { title, description } = usePageMeta(
    "contact",
    "Contact",
    "Neem contact op met Cuddling Memories Fotografie via e-mail, Instagram of Facebook. Voor boeken gebruik je de aparte boekingspagina."
  );

  const legacyBookingLink = ["shoot", "maand", "wachtlijst"].some((key) =>
    new URLSearchParams(location.search).has(key)
  );

  if (legacyBookingLink) {
    return <Navigate to={`/boek-een-shoot${location.search}${location.hash}`} replace />;
  }

  return (
    <>
      <SEO title={title} description={description} />
      <section className="pt-32 pb-20">
        <div className="container-soft">
          <div className="grid items-stretch gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative min-h-[26rem] overflow-hidden rounded-lg shadow-soft warm-border">
              <img
                src="/images/instagram/instagram-04.jpg"
                alt="Cuddling Memories Fotografie contact"
                className="h-full min-h-[26rem] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-coffee/90 via-coffee/28 via-45% to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-coffee/88 via-coffee/48 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-card sm:p-8">
                <p className="script-line text-4xl text-card drop-shadow-[0_2px_10px_rgba(57,38,29,0.75)] sm:text-5xl">Neem gerust contact op</p>
                <p className="mt-3 max-w-md text-sm font-medium leading-7 text-card drop-shadow-[0_1px_6px_rgba(57,38,29,0.9)]">
                  Voor vragen over shoots, pakketten, galerijen, cadeaubonnen of iets wat je vooraf wilt bespreken.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-lg bg-card/82 p-6 shadow-soft warm-border sm:p-8 lg:p-10">
              <p className="fine-label text-xs font-semibold text-cocoa">Contact</p>
              <h1 className="display-title mt-3 text-5xl font-semibold leading-none text-coffee sm:text-6xl">
                Een vraag stellen of even overleggen
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-coffee/72">
                Wil je iets vragen voordat je boekt, heb je een vraag over een bestaande aanvraag of wil je iets
                doorgeven? Stuur mij dan gerust een bericht via e-mail of social media.
              </p>

              <div className="mt-8 grid gap-3">
                <a
                  href={`mailto:${email}`}
                  className="group flex items-center justify-between gap-4 rounded-lg bg-linen/58 p-5 transition hover:bg-linen warm-border"
                >
                  <span className="flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-card text-cocoa shadow-glow">
                      <Mail size={20} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-coffee">E-mail</span>
                      <span className="mt-1 block break-all text-sm text-coffee/68">{email}</span>
                    </span>
                  </span>
                  <ArrowRight className="shrink-0 text-cocoa transition group-hover:translate-x-1" size={18} />
                </a>

                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-4 rounded-lg bg-linen/58 p-5 transition hover:bg-linen warm-border"
                >
                  <span className="flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-card text-cocoa shadow-glow">
                      <Instagram size={20} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-coffee">Instagram</span>
                      <span className="mt-1 block text-sm text-coffee/68">@cuddlingmemories</span>
                    </span>
                  </span>
                  <ArrowRight className="shrink-0 text-cocoa transition group-hover:translate-x-1" size={18} />
                </a>

                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-4 rounded-lg bg-linen/58 p-5 transition hover:bg-linen warm-border"
                >
                  <span className="flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-card text-cocoa shadow-glow">
                      <Facebook size={20} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-coffee">Facebook</span>
                      <span className="mt-1 block text-sm text-coffee/68">Cuddling Memories Fotografie</span>
                    </span>
                  </span>
                  <ArrowRight className="shrink-0 text-cocoa transition group-hover:translate-x-1" size={18} />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-lg bg-linen/62 p-6 shadow-soft warm-border sm:p-8">
              <Sparkles className="text-cocoa" size={24} />
              <h2 className="display-title mt-4 text-4xl font-semibold text-coffee">Wil je een shoot boeken?</h2>
              <p className="mt-3 text-sm leading-7 text-coffee/72">
                Gebruik dan de aparte boekingspagina. Daar kies je direct je shoot, pakket, datum, tijd en gegevens.
              </p>
              <Button to="/boek-een-shoot" className="mt-6 gap-2">
                Boek een shoot
                <ArrowRight size={16} />
              </Button>
            </div>

            <div className="rounded-lg bg-card/82 p-6 shadow-soft warm-border sm:p-8">
              <MessageCircle className="text-cocoa" size={24} />
              <h2 className="display-title mt-4 text-4xl font-semibold text-coffee">Handig om mee te sturen</h2>
              <p className="mt-3 text-sm leading-7 text-coffee/72">
                Zet er kort bij over welke shoot, datum of galerij je vraag gaat. Dan kan ik sneller met je meekijken.
              </p>
              <Button href={`mailto:${email}`} variant="secondary" className="mt-6 gap-2">
                Mail sturen
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
