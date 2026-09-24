import { useState } from "react";

async function call(url, opts) {
  try {
    const r = await fetch(url, opts); const d = await r.json();
    return r.ok ? d : { fail: d.error || "Request failed." };
  } catch { return { fail: "Can't reach the lab server. Is the backend running on port 5000?" }; }
}

function Mode({ secure, setSecure }) {
  return (
    <div className="mode" role="group" aria-label="Code version">
      <button className={!secure ? "on" : ""} onClick={() => setSecure(false)}>Vulnerable code</button>
      <button className={secure ? "on" : ""} onClick={() => setSecure(true)}>Secure code</button>
    </div>
  );
}
function Trace({ query, error }) {
  return <>{query && <pre className="code">{query}</pre>}{error && <p className="error">SQL error: {error}</p>}</>;
}
function Solution({ options }) {
  return (
    <details className="hint"><summary>Show solution</summary>
      {options.map(([label, fn]) => <button key={label} type="button" className="btn small sol" onClick={fn}>{label}</button>)}
      <p className="muted">This only fills the box. Now press the test button yourself.</p>
    </details>
  );
}
function Hints({ items }) {
  return items.map((h, i) => <details key={i} className="hint"><summary>Hint {i + 1}</summary><p>{h}</p></details>);
}

export function SqliLogin() {
  const [secure, setSecure] = useState(false);
  const [u, setU] = useState(""); const [p, setP] = useState("");
  const [res, setRes] = useState(null);
  async function go(e) {
    e.preventDefault();
    setRes(await call("/api/labs/sqli-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: p, secure }) }));
  }
  return (
    <div className="lab-box">
      <Mode secure={secure} setSecure={setSecure} />
      <form onSubmit={go} className="row">
        <input aria-label="Lab username" placeholder="Username" value={u} onChange={e => setU(e.target.value)} />
        <input aria-label="Lab password" placeholder="Password" value={p} onChange={e => setP(e.target.value)} />
        <button className="btn small">Test login</button>
      </form>
      {res && <><Trace query={res.query} error={res.error} />{res.fail && <p className="error">{res.fail}</p>}
        {!res.error && !res.fail && <p className={res.success ? "ok" : "muted"}>{res.success ? `Logged in as ${res.user.username} (${res.user.role})` : "Login failed."}</p>}</>}
      <Solution options={[["Fill login bypass", () => { setU("admin' --"); setP("x"); }]]} />
      <Hints items={["Type a single quote (') in the username and read the SQL error.", "Your text sits inside quotes in the query. Make the condition always true and comment out the rest with --.", "Compare the query shown in Secure mode."]} />
    </div>
  );
}

export function SqliSearch() {
  const [secure, setSecure] = useState(false);
  const [q, setQ] = useState(""); const [res, setRes] = useState(null);
  async function go(e) {
    e.preventDefault();
    setRes(await call(`/api/labs/sqli-search?q=${encodeURIComponent(q)}&secure=${secure ? 1 : 0}`));
  }
  return (
    <div className="lab-box">
      <Mode secure={secure} setSecure={setSecure} />
      <form onSubmit={go} className="row">
        <input aria-label="Search products" placeholder="Search products" value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn small">Search</button>
      </form>
      {res && <><Trace query={res.query} error={res.error} />{res.fail && <p className="error">{res.fail}</p>}
        {res.rows && res.rows.length > 0 && <table className="tbl"><thead><tr>{Object.keys(res.rows[0]).map(k => <th key={k}>{k}</th>)}</tr></thead>
          <tbody>{res.rows.map((r, i) => <tr key={i}>{Object.values(r).map((v, j) => <td key={j}>{String(v)}</td>)}</tr>)}</tbody></table>}
        {res.rows && !res.rows.length && !res.error && !res.fail && <p className="muted">No products found.</p>}</>}
      <Solution options={[["Fill: list all rows", () => setQ("zzz' OR 1=1 --")], ["Fill: UNION on lab_users", () => setQ("zzz' UNION SELECT id, username, password, 0 FROM lab_users --")]]} />
      <Hints items={["The search returns 4 columns: id, name, category, price.", "UNION SELECT adds rows from another table, if you match the column count and close the quote first.", "The lab has a second table named lab_users."]} />
    </div>
  );
}
