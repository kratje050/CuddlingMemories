import { useEffect, useMemo, useState } from "react";
import { Button, Card, PageHeader } from "../components/ui";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function Install() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const isAndroid = useMemo(() => /Android/i.test(navigator.userAgent), []);
  const isIos = useMemo(() => /iPad|iPhone|iPod/i.test(navigator.userAgent), []);
  const isStandalone = useMemo(
    () => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
    []
  );

  useEffect(() => {
    function handlePrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function installAndroid() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <PageHeader
        title="Admin-app installeren"
        subtitle="Gebruik deze versie op Android of iPhone zonder Expo. Updates komen via de website binnen."
      />

      {isStandalone || installed ? (
        <Card className="mb-4">
          <p className="font-semibold text-coffee">De app is geinstalleerd.</p>
          <p className="mt-2 text-sm leading-6 text-coffee/70">Open Cuddling Memories Admin vanaf je beginscherm en log in als admin.</p>
        </Card>
      ) : null}

      <Card className="mb-4">
        <p className="text-sm leading-6 text-coffee/70">
          Dit is de stabiele Android-route zonder Expo: de app draait als PWA vanaf je beginscherm. Na een Netlify deploy gebruikt de app automatisch de nieuwste websiteversie.
        </p>
      </Card>

      <Card className="mb-4">
        <p className="font-semibold text-coffee">Android</p>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-6 text-coffee/75">
          <li>Open deze pagina in Chrome op je Android telefoon.</li>
          <li>Tik op de knop hieronder als die zichtbaar is.</li>
          <li>Als de knop niet zichtbaar is: tik rechtsboven op de drie puntjes.</li>
          <li>Kies "App installeren" of "Toevoegen aan startscherm".</li>
          <li>Open daarna Cuddling Memories Admin vanaf je beginscherm.</li>
        </ol>
        {installPrompt ? (
          <Button onClick={installAndroid} className="mt-5 w-full">Installeer app</Button>
        ) : (
          <p className="mt-4 rounded-2xl bg-linen px-4 py-3 text-xs leading-5 text-coffee/70">
            {isAndroid
              ? "Zie je geen installknop? Gebruik dan het Chrome-menu met de drie puntjes."
              : "Open deze pagina op Android in Chrome om de installknop te zien."}
          </p>
        )}
      </Card>

      <Card>
        <p className="font-semibold text-coffee">iPhone</p>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-6 text-coffee/75">
          <li>Open deze pagina in Safari op je iPhone.</li>
          <li>Tik op de deelknop.</li>
          <li>Kies "Zet op beginscherm".</li>
          <li>Open daarna Cuddling Memories Admin vanaf je beginscherm.</li>
        </ol>
        {!isIos ? (
          <p className="mt-4 rounded-2xl bg-linen px-4 py-3 text-xs leading-5 text-coffee/70">
            Deze stappen zijn alleen nodig op iPhone of iPad.
          </p>
        ) : null}
      </Card>
    </main>
  );
}
