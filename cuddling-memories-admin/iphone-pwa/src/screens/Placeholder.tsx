import { Card, PageHeader } from "../components/ui";

export default function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <>
      <PageHeader title={title} subtitle={`${phase}: dit scherm staat klaar voor verdere uitwerking.`} />
      <Card>
        <p className="text-sm leading-6 text-coffee/70">De navigatie en app-basis werken al. De inhoud van dit onderdeel wordt in de geplande fase aangesloten op Supabase.</p>
      </Card>
    </>
  );
}
