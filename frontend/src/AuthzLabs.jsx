import { useState } from "react";

async function call(url) {
  try { const r = await fetch(url); return { status: r.status, data: await r.json() }; }
  catch { return { status: 0, data: { error: "Can't reach the lab server. Is the backend running on port 5000?" } }; }
}
function Mode({ secure, setSecure }) {
  return <div className="mode" role="group" aria-label="Code version">
    <button className={!secure ? "on" : ""} onClick={() => setSecure(false)}>Vulnerable code</button>
    <button className={secure ? "on" : ""} onClick={() => setSecure(true)}>Secure code</button>
  </div>;
}
function Hints({ items }) { return items.map((h, i) => <details key={i} className="hint"><summary>Hint {i + 1}</summary><p>{h}</p></details>); }

export function AuthzIdor() {
  const [secure, setSecure] = useState(false);
  const [id, setId] = useState("3"); const [res, setRes] = useState(null);
  const url = `/api/labs/authz-profile/${encodeURIComponent(id)}?secure=${secure ? 1 : 0}`;
  async function go(e) { e.preventDefault(); setRes({ url, ...(await call(url)) }); }
  return (
    <div className="lab-box">
      <Mode secure={secure} setSecure={setSecure} />
      <p className="muted">You are <b>Alice</b>, profile ID <b>3</b>, a normal student.</p>
      <form onSubmit={go} className="row">
        <input aria-label="Profile ID" inputMode="numeric" value={id} onChange={e => setId(e.target.value)} />
        <button className="btn small">View profile</button>
      </form>
      {res && <>
        <pre className="code">GET {res.url}   → {res.status}</pre>
        {res.data.profile
          ? <table className="tbl"><tbody>{Object.entries(res.data.profile).map(([k, v]) => <tr key={k}><th>{k}</th><td>{String(v)}</td></tr>)}</tbody></table>
          : <p className="error">{res.data.error}</p>}
      </>}
      <Hints items={["Look at the request line above. The profile is chosen only by the number in the URL.", "Change 3 to another number. Does the server check that profile belongs to you?", "In Secure mode, try the same IDs again."]} />
    </div>
  );
}

export function AuthzAdmin() {
  const [secure, setSecure] = useState(false);
  const [res, setRes] = useState(null);
  const url = `/api/labs/authz-admin-users?secure=${secure ? 1 : 0}`;
  return (
    <div className="lab-box">
      <Mode secure={secure} setSecure={setSecure} />
      <p className="muted">You are <b>Alice</b>, role <b>student</b>. The Admin panel link is <b>hidden</b> from your menu:</p>
      <div className="row"><button className="btn small" disabled>Student home</button><button className="btn small" disabled>My courses</button></div>
      <p className="muted">(no Admin link here, the developer only hid it)</p>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn small" onClick={async () => setRes({ url, ...(await call(url)) })}>Request the admin endpoint anyway</button>
        <a className="btn small" href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>Open URL in new tab</a>
      </div>
      {res && <>
        <pre className="code">GET {res.url}   → {res.status}</pre>
        {res.data.users
          ? <table className="tbl"><thead><tr><th>id</th><th>name</th><th>email</th><th>role</th></tr></thead><tbody>{res.data.users.map(u => <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>)}</tbody></table>
          : <p className="error">{res.data.error}</p>}
      </>}
      <Hints items={["Hiding a link is not access control. The link was hidden, but was the URL protected?", "Try requesting the endpoint directly in Vulnerable mode.", "In Secure mode the server checks your role, not just the UI."]} />
    </div>
  );
}
