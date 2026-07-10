import { Link } from "react-router-dom";
import { Button, Card, PageHeader } from "../components/ui";
import { useAuth } from "../providers/AuthProvider";

const items = [
  { to: "/availability", title: "Beschikbaarheid", text: "Geblokkeerde periodes en vrije ruimte bekijken." },
  { to: "/month-planning", title: "Maandplanning", text: "Snel zien welke maanden vol raken." },
  { to: "/packages", title: "Pakketten", text: "Shoots, prijzen en inbegrepen beelden bekijken." },
  { to: "/clients", title: "Klanten", text: "Klantgegevens en galerijen bij elkaar." },
  { to: "/waitlist", title: "Wachtlijst", text: "Aanmeldingen volgen en later omzetten naar boekingen." },
  { to: "/mini-sessions", title: "Mini-shoots", text: "Mini-shoot dagen en aanvragen bekijken." },
  { to: "/giftcards", title: "Cadeaubonnen", text: "Aanvragen en status bijhouden." },
  { to: "/galleries", title: "Galerijen", text: "Klantgalerijen en favoriete foto's mobiel bekijken." },
  { to: "/portfolio-photos", title: "Portfolio foto's", text: "Meerdere portfoliofoto's tegelijk uploaden." },
  { to: "/settings", title: "Instellingen", text: "App en website-instellingen bekijken." },
];

export default function More() {
  const { signOut } = useAuth();

  return (
    <>
      <PageHeader title="Meer" subtitle="Modules voor de volgende fases." />
      <div className="grid gap-3">
        {items.map((item) => (
          <Link key={item.to} to={item.to}>
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-coffee">{item.title}</p>
                  <p className="mt-1 text-sm text-coffee/60">{item.text}</p>
                </div>
                <span className="text-xl text-cocoa">›</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <Button onClick={signOut} className="mt-5 w-full">Uitloggen</Button>
    </>
  );
}
