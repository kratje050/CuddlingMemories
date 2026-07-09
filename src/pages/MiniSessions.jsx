import { useEffect, useState } from "react";
import MiniSessionCard from "../components/MiniSessionCard.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { supabase } from "../lib/supabaseClient.js";

export default function MiniSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("mini_sessions")
      .select("*")
      .eq("is_published", true)
      .order("date", { ascending: true })
      .then(({ data }) => {
        if (active) setSessions(data || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <SEO title="Mini-shoots" description="Bekijk actieve mini-shoot dagen bij Cuddling Memories Fotografie." />
      <section className="pt-36">
        <div className="container-soft pb-16">
          <SectionTitle
            centered={false}
            eyebrow="Mini-shoots"
            title="Korte shoots op bijzondere dagen"
            text="Denk aan kerst mini-shoots, moederdag, lente, herfst, studio of buiten. Kies een beschikbare dag en vraag jouw tijdslot aan."
          />
          {loading ? (
            <p className="mt-10 text-sm text-coffee/60">Even laden...</p>
          ) : sessions.length ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sessions.map((session) => <MiniSessionCard key={session.id} session={session} />)}
            </div>
          ) : (
            <p className="mt-10 rounded-lg bg-card p-6 text-sm text-coffee/70 shadow-soft warm-border">
              Er staan op dit moment geen actieve mini-shoot dagen online.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
