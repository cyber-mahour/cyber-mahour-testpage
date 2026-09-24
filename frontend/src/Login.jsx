import { useState, useRef } from "react";

export default function Login({ onLogin }) {
  const pwRef = useRef(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.query) setLastQuery(data.query);
      if (!res.ok) setError(data.error || "Login failed.");
      else onLogin(data.user);
    } catch {
      setError("Can't reach the lab server. Is the backend running on port 5000?");
    } finally { setBusy(false); }
  }

  return (
    <main className="login-wrap">
      <form className="card" onSubmit={submit} noValidate>
        <div className="badge">Local training lab</div>
        <h1>Cyber Mahour</h1>
        <p className="sub">Intentionally vulnerable. Runs on this computer only.</p>
        <input aria-label="Username" placeholder="Username" autoComplete="username"
               value={username} onChange={e => setUsername(e.target.value)} autoFocus
               onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); pwRef.current?.focus(); } }} />
        <input ref={pwRef} aria-label="Password" type="password" placeholder="Password" autoComplete="current-password"
               value={password} onChange={e => setPassword(e.target.value)} />
        <button className="btn" disabled={busy}>{busy ? "Signing in..." : "Log in"}</button>
        <p className="error" role="alert">{error}</p>
        {lastQuery && <pre className="code login-code">{lastQuery}</pre>}
      </form>
    </main>
  );
}
