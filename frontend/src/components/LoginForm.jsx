import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

function LoginForm() {
  const { login, loading, isAuthenticated, user, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return (
      <div className="mt-4 p-4 rounded-xl border border-emerald-500/50 bg-emerald-900/20 text-sm text-emerald-100 max-w-md">
        <div className="font-semibold mb-1">Signed in</div>
        <div>Email: {user?.email}</div>
        {user?.fullName && <div>Name: {user.fullName}</div>}
        <button
          type="button"
          className="mt-3 inline-flex items-center rounded-md border border-emerald-400 px-3 py-1 text-xs font-medium hover:bg-emerald-500/20"
          onClick={logout}
        >
          Log out
        </button>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      await login(email, password);
      setStatus({ type: "success", message: "Login successful" });
    } catch (err) {
      console.error("Login error:", err);
      setStatus({
        type: "error",
        message: err.message || "Login failed",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 max-w-md rounded-xl border border-slate-600/60 bg-slate-900/40 p-4 text-sm text-slate-100"
    >
      <div className="font-semibold mb-2">Sign in to OGC NewFinity</div>

      <label className="block mb-2">
        <span className="block mb-1 text-xs uppercase tracking-wide text-slate-400">
          Email
        </span>
        <input
          type="email"
          className="w-full rounded-md border border-slate-600 bg-slate-950/70 px-2 py-1 text-sm outline-none focus:border-cyan-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className="block mb-3">
        <span className="block mb-1 text-xs uppercase tracking-wide text-slate-400">
          Password
        </span>
        <input
          type="password"
          className="w-full rounded-md border border-slate-600 bg-slate-950/70 px-2 py-1 text-sm outline-none focus:border-cyan-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      <button
        type="submit"
        disabled={submitting || loading}
        className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
      >
        {submitting || loading ? "Signing in..." : "Sign in"}
      </button>

      {status && (
        <div
          className={`mt-2 text-xs ${
            status.type === "success" ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {status.message}
        </div>
      )}
    </form>
  );
}

export default LoginForm;
