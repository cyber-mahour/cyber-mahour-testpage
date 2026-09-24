import { useState } from "react";
async function call(url, opts) {
  try { const r = await fetch(url, opts); return { status: r.status, headers: r.headers, data: await r.json() }; }
  catch { return { status: 0, headers: null, data: { error: "Can't reach the lab server. Is the backend running on port 5000?" } }; }
}
function Mode({ secure, setSecure }) {
  return <div className="mode" role="group" aria-label="Code version">
    <button className={!secure ? "on" : ""} onClick={() => setSecure(false)}>Vulnerable code</button>
    <button className={secure ? "on" : ""} onClick={() => setSecure(true)}>Secure code</button>
  </div>;
}
function Hints({ items }) { return items.map((h, i) => <details key={i} className="hint"><summary>Hint {i + 1}</summary><p>{h}</p></details>); }

export function SessionIdLab() {
  const [secure, setSecure] = useState(false); const [ids, setIds] = useState([]);
  async function get() { const { data } = await call(`/api/labs/session-id?secure=${secure ? 1 : 0}`); setIds(l => [data.session_id, ...l].slice(0, 6)); }
  return <div className="lab-box"><Mode secure={secure} setSecure={setSecure} />
    <button className="btn small" onClick={get}>Issue a new session ID</button>
    <pre className="code">{ids.join("\n") || "(none yet)"}</pre>
    <Hints items={["Click the button a few times in Vulnerable mode. What pattern do you see?", "A sequential ID means session N+1 can be guessed right after seeing session N.", "Compare with Secure mode."]} /></div>;
}

export function PwStorageLab() {
  const [secure, setSecure] = useState(false); const [rows, setRows] = useState([]);
  async function get() { const { data } = await call(`/api/labs/pw-storage?secure=${secure ? 1 : 0}`); setRows(data.rows || []); }
  return <div className="lab-box"><Mode secure={secure} setSecure={setSecure} />
    <button className="btn small" onClick={get}>View "leaked database"</button>
    {rows.length > 0 && <table className="tbl"><thead><tr><th>username</th><th>stored_as</th></tr></thead>
      <tbody>{rows.map(r => <tr key={r.username}><td>{r.username}</td><td style={{ wordBreak: "break-all" }}>{r.stored_as}</td></tr>)}</tbody></table>}
    <Hints items={["Imagine this table leaked. In Vulnerable mode, what can you immediately do with it?", "In Secure mode the value is hashed. Can you turn a hash back into the password directly?", "Real systems also add a unique salt per user, not one shared salt."]} /></div>;
}

export function FileReadLab() {
  const [secure, setSecure] = useState(false); const [name, setName] = useState("welcome.txt"); const [res, setRes] = useState(null);
  async function go(e) { e.preventDefault(); setRes(await call(`/api/labs/file-read?name=${encodeURIComponent(name)}&secure=${secure ? 1 : 0}`)); }
  return <div className="lab-box"><Mode secure={secure} setSecure={setSecure} />
    <form onSubmit={go} className="row"><input aria-label="File name" value={name} onChange={e => setName(e.target.value)} /><button className="btn small">Read file</button></form>
    {res && <><pre className="code">resolved: {res.data.resolved_path}</pre>{res.data.content ? <pre className="code">{res.data.content}</pre> : <p className="error">{res.data.error}</p>}</>}
    <Hints items={['Try "../labs_more.py" or "../app.py" to read files outside the public folder.', "The vulnerable version joins your name into the path with no checks.", "Secure mode strips any folder part before looking up the file."]} /></div>;
}

export function HeadersLab() {
  const [secure, setSecure] = useState(false); const [res, setRes] = useState(null);
  async function go() { setRes(await call(`/api/labs/headers?secure=${secure ? 1 : 0}`)); }
  const watch = ["x-content-type-options", "x-frame-options", "content-security-policy"];
  return <div className="lab-box"><Mode secure={secure} setSecure={setSecure} />
    <button className="btn small" onClick={go}>Fetch response headers</button>
    {res && <pre className="code">{watch.map(h => `${h}: ${res.headers?.get(h) || "(missing)"}`).join("\n")}</pre>}
    <Hints items={["These headers are also visible in your browser's Network tab (F12) for any request.", "Missing X-Frame-Options allows the page to be embedded in another site's <iframe> (clickjacking).", "Compare Vulnerable vs Secure."]} /></div>;
}

export function CheckoutLab() {
  const [secure, setSecure] = useState(false); const [qty, setQty] = useState(1); const [price, setPrice] = useState(5); const [res, setRes] = useState(null);
  async function go(e) { e.preventDefault(); setRes(await call("/api/labs/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item: "mug", qty, price, secure }) })); }
  return <div className="lab-box"><Mode secure={secure} setSecure={setSecure} />
    <p className="muted">Mug, real price ₹5.00. This form also sends a "price" field, which a real checkout should never trust from the browser.</p>
    <form onSubmit={go} className="row">
      <input aria-label="Quantity" type="number" value={qty} onChange={e => setQty(e.target.value)} style={{ width: 90 }} />
      <input aria-label="Price you send" type="number" value={price} onChange={e => setPrice(e.target.value)} style={{ width: 110 }} />
      <button className="btn small">Checkout</button>
    </form>
    {res && (res.data.error ? <p className="error">{res.data.error}</p> : <p className={res.data.total <= 0 ? "error" : "ok"}>Total charged: ₹{res.data.total} — {res.data.note}</p>)}
    <Hints items={['Set "price you send" to 0.01 in Vulnerable mode.', "Try a negative quantity too.", "Secure mode ignores the price you send and re-checks the quantity."]} /></div>;
}

export function ApiUsersLab() {
  const [secure, setSecure] = useState(false); const [res, setRes] = useState(null);
  async function go() { setRes(await call(`/api/labs/api-users?secure=${secure ? 1 : 0}`)); }
  return <div className="lab-box"><Mode secure={secure} setSecure={setSecure} />
    <button className="btn small" onClick={go}>Call the users API</button>
    {res && <pre className="code" style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(res.data.users, null, 2)}</pre>}
    <Hints items={["This is a normal, logged-in API call — not an attack. Look closely at every field returned.", "password_hash and api_key should never be sent to a regular client.", "Secure mode returns only the fields the app actually needs."]} /></div>;
}
