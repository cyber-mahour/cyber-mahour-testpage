import { useState } from "react";

async function call(url, opts) {
  try { const r = await fetch(url, opts); return { status: r.status, data: await r.json() }; }
  catch { return { status: 0, data: { message: "Can't reach the lab server. Is the backend running on port 5000?" } }; }
}
function Mode({ secure, setSecure }) {
  return <div className="mode" role="group" aria-label="Code version">
    <button className={!secure ? "on" : ""} onClick={() => setSecure(false)}>Vulnerable code</button>
    <button className={secure ? "on" : ""} onClick={() => setSecure(true)}>Secure code</button>
  </div>;
}
function Hints({ items }) { return items.map((h, i) => <details key={i} className="hint"><summary>Hint {i + 1}</summary><p>{h}</p></details>); }

export function AuthWeakPassword() {
  const [secure, setSecure] = useState(false);
  const [pw, setPw] = useState(""); const [res, setRes] = useState(null);
  async function go(e) {
    e.preventDefault();
    const { data } = await call("/api/labs/auth-signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw, secure }) });
    setRes(data);
  }
  return (
    <div className="lab-box">
      <Mode secure={secure} setSecure={setSecure} />
      <form onSubmit={go} className="row">
        <input aria-label="New password" placeholder="Choose a password (try: 1)" value={pw} onChange={e => setPw(e.target.value)} />
        <button className="btn small">Check</button>
      </form>
      {res && <p className={res.accepted ? "ok" : "error"}>{res.accepted ? "Accepted. " : "Rejected. "}{res.reason}</p>}
      <Hints items={['Try "1" or "password" in Vulnerable mode — both are accepted.', "Switch to Secure mode and try the same values.", "A real signup should also check the password against a list of breached/common passwords."]} />
    </div>
  );
}

export function AuthRateLimit() {
  const [secure, setSecure] = useState(false);
  const [u, setU] = useState("bruteforce_target"); const [p, setP] = useState("");
  const [res, setRes] = useState(null); const [tries, setTries] = useState(0);
  async function go(e) {
    e.preventDefault();
    const { status, data } = await call("/api/labs/auth-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: p, secure }) });
    setRes({ ...data, status }); setTries(t => t + 1);
  }
  async function reset() { await call("/api/labs/auth-login/reset", { method: "POST" }); setTries(0); setRes(null); }
  return (
    <div className="lab-box">
      <Mode secure={secure} setSecure={setSecure} />
      <p className="muted">Target account for this lab: <code>bruteforce_target</code>. This is never the platform admin account.</p>
      <form onSubmit={go} className="row">
        <input aria-label="Username" value={u} onChange={e => setU(e.target.value)} />
        <input aria-label="Password" placeholder="Password" value={p} onChange={e => setP(e.target.value)} />
        <button className="btn small">Try</button>
      </form>
      {res && <p className={res.ok ? "ok" : "error"}>{res.status === 429 ? res.message : (res.ok ? res.message : `${res.message} (attempt ${tries})`)}</p>}
      <button type="button" className="link" onClick={reset}>Reset lockout</button>

      <details className="hint" open><summary>Attack it from the terminal (Hydra)</summary>
        <p>This endpoint accepts a normal HTML form login, so it can be driven from outside the browser. From Kali, with the backend running:</p>
        <pre className="code">{`echo -e "letmein123\\npassword123\\nadmin123\\nqwerty123" > wordlist.txt

hydra -l bruteforce_target -P wordlist.txt 127.0.0.1 -s 5000 http-post-form \\
  "/api/labs/auth-login:username=^USER^&password=^PASS^&secure=0:F=Invalid credentials"`}</pre>
        <p className="muted">Change <code>secure=0</code> to <code>secure=1</code> to attack the Secure version — Hydra should get locked out around attempt 5.</p>
      </details>
      <Hints items={["The correct password is in the wordlist above — this lab is about seeing the attack work, not guessing.", "In Vulnerable mode there is no limit, so every password in the list gets tried.", "In Secure mode, watch the response after 5 wrong tries."]} />
    </div>
  );
}
