import { useEffect, useState } from "react";

async function call(url, opts) {
  try { const r = await fetch(url, opts); return { ok: r.ok, data: await r.json() }; }
  catch { return { ok: false, data: { error: "Can't reach the lab server. Is the backend running on port 5000?" } }; }
}
function Mode({ secure, setSecure }) {
  return (
    <div className="mode" role="group" aria-label="Code version">
      <button className={!secure ? "on" : ""} onClick={() => setSecure(false)}>Vulnerable code</button>
      <button className={secure ? "on" : ""} onClick={() => setSecure(true)}>Secure code</button>
    </div>
  );
}
function Solution({ options }) {
  return <details className="hint"><summary>Show solution</summary>
    {options.map(([label, fn]) => <button key={label} type="button" className="btn small sol" onClick={fn}>{label}</button>)}
    <p className="muted">This only fills the box. Now submit it yourself.</p>
  </details>;
}
function Hints({ items }) { return items.map((h, i) => <details key={i} className="hint"><summary>Hint {i + 1}</summary><p>{h}</p></details>); }

export function XssReflected() {
  const [secure, setSecure] = useState(false);
  const [q, setQ] = useState(""); const [res, setRes] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { fetch("/api/labs/xss-cookie").catch(() => {}); }, []);
  async function go(e) {
    e.preventDefault(); setErr("");
    const { ok, data } = await call(`/api/labs/xss-reflected?q=${encodeURIComponent(q)}&secure=${secure ? 1 : 0}`);
    if (!ok) { setErr(data.error); setRes(null); } else setRes(data);
  }
  return (
    <div className="lab-box">
      <Mode secure={secure} setSecure={setSecure} />
      <form onSubmit={go} className="row">
        <input aria-label="Search" placeholder="Search this page" value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn small">Search</button>
      </form>
      {err && <p className="error">{err}</p>}
      {res && (
        <div className="echo">
          <p className="muted">Results for:</p>
          {res.secure
            ? <p>{res.query}</p>
            : <p dangerouslySetInnerHTML={{ __html: res.query }} />}
        </div>
      )}
      <Solution options={[["Fill: alert payload", () => setQ("<img src=x onerror=alert('xss')>")], ["Fill: cookie theft (console only)", () => setQ("<img src=x onerror=console.log('stolen cookie:',document.cookie)>")]]} />
      <Hints items={["Your search text is echoed back into the page as raw HTML.", "A <script> tag alone is often blocked by the browser when inserted this way — an onerror handler on a broken <img> runs just as well.", "Open DevTools console (F12) before submitting the cookie-theft payload to see the result."]} />
    </div>
  );
}

export function XssStored() {
  const [secure, setSecure] = useState(false);
  const [text, setText] = useState(""); const [comments, setComments] = useState([]); const [err, setErr] = useState("");
  const load = async () => { const { ok, data } = await call("/api/labs/xss-comments"); if (ok) setComments(data.comments); };
  useEffect(() => { load(); }, []);
  async function post(e) {
    e.preventDefault(); setErr("");
    const { ok, data } = await call("/api/labs/xss-comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    if (!ok) setErr(data.error); else { setComments(data.comments); setText(""); }
  }
  async function reset() { const { ok, data } = await call("/api/labs/xss-comments/reset", { method: "POST" }); if (ok) setComments(data.comments); }
  return (
    <div className="lab-box">
      <Mode secure={secure} setSecure={setSecure} />
      <form onSubmit={post} className="row">
        <input aria-label="Comment" placeholder="Write a comment" value={text} onChange={e => setText(e.target.value)} />
        <button className="btn small">Post</button>
      </form>
      {err && <p className="error">{err}</p>}
      <div className="comments">
        {comments.map(c => (
          <div key={c.id} className="comment">
            <b>{c.author}</b>
            {secure ? <span>{c.text}</span> : <span dangerouslySetInnerHTML={{ __html: c.text }} />}
          </div>
        ))}
      </div>
      <button type="button" className="link" onClick={reset}>Reset comments</button>
      <Solution options={[["Fill: alert payload", () => setText("<img src=x onerror=alert('stored xss')>")]]} />
      <Hints items={["Every visitor to this page runs whatever HTML is stored here — that's what makes stored XSS worse than reflected.", "Post it once in Vulnerable mode. It runs again on every page load until you reset it.", "Now switch to Secure mode. The same stored payload is shown as harmless text, because the page encodes it on output."]} />
    </div>
  );
}
