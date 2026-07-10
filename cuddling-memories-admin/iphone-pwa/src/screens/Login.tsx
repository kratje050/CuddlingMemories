import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { Button, Card } from "../components/ui";

export default function Login() {
  const { signIn, session, isAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (session && isAdmin) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inloggen is niet gelukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <p className="text-4xl text-cocoa">Cuddling Memories</p>
        <h1 className="mt-2 text-3xl font-semibold text-coffee">Admin</h1>
        <p className="mt-2 text-sm text-coffee/65">Log in met je admin-account.</p>
        <form onSubmit={submit} className="mt-5 grid gap-3">
          <input className="rounded-xl border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none" placeholder="E-mailadres" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="rounded-xl border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none" placeholder="Wachtwoord" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
          <Button disabled={busy}>{busy ? "Inloggen..." : "Inloggen"}</Button>
        </form>
      </Card>
    </main>
  );
}
