import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Heart, LogIn } from "lucide-react";
import { useAdminAuth } from "../hooks/useAdminAuth.js";

export default function AdminLogin() {
  const { user, isAdmin, loading, signIn } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user && isAdmin) {
    const redirectTo = location.state?.from?.pathname || "/admin/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate("/admin/dashboard");
    } catch {
      setError("Inloggen mislukt. Controleer je e-mailadres en wachtwoord.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4 text-coffee">
      <div className="w-full max-w-sm rounded-lg bg-card p-8 shadow-soft warm-border">
        <div className="text-center">
          <Heart className="mx-auto text-cocoa" size={26} />
          <p className="script-line mt-2 text-2xl text-coffee">Cuddling Memories</p>
          <p className="fine-label mt-1 text-[0.62rem] text-cocoa">Admin</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-coffee">
            E-mailadres
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-coffee">
            Wachtwoord
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa"
            />
          </label>
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cocoa px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-card shadow-glow transition hover:-translate-y-0.5 hover:bg-coffee disabled:opacity-60"
          >
            {submitting ? "Bezig met inloggen" : "Inloggen"} <LogIn size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
