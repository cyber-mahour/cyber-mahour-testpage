import { useEffect, useState } from "react";
import { NAV, LABS, TEXT } from "./labs.js";
import { SqliLogin, SqliSearch } from "./SqliLabs.jsx";
import { XssReflected, XssStored } from "./XssLabs.jsx";
import { AuthWeakPassword, AuthRateLimit } from "./AuthLabs.jsx";
import { AuthzIdor, AuthzAdmin } from "./AuthzLabs.jsx";
import { SessionIdLab, PwStorageLab, FileReadLab, HeadersLab, CheckoutLab, ApiUsersLab } from "./MoreLabs.jsx";

function DomXss() {
  const [name, setName] = useState("");
  const go = e => { e.preventDefault(); window.open("/dom-xss.html#" + encodeURIComponent(name), "_blank", "noopener"); };
  const goSecure = e => { e.preventDefault(); window.open("/dom-xss.html?secure=1#" + encodeURIComponent(name), "_blank", "noopener"); };
  return (
    <div className="lab-box">
      <p className="muted">This lab opens a separate, self-contained HTML page — DOM-based XSS never involves the server, so it has no Vulnerable/Secure toggle here.</p>
      <form onSubmit={go} className="row">
        <input aria-label="Name" placeholder="Try: <img src=x onerror=alert(1)>" value={name} onChange={e => setName(e.target.value)} />
        <button className="btn small">Open vulnerable</button>
        <button className="btn small" onClick={goSecure}>Open secure</button>
      </form>
      <details className="hint" open><summary>Hint</summary><p>The page never talks to Flask at all. Check its source — Ctrl+U in the opened tab — to see exactly where innerHTML is used.</p></details>
    </div>
  );
}
import { CHANNEL, SECTIONS } from "./branding.js";
import "./dashboard.css";

const PENDING = "Written when this lab is built.";

function LabCard({ lab, open }) {
  return (
    <button className="lab-card" onClick={() => open(lab)}>
      <span className="chip">{lab.level}</span>
      <strong>{lab.title}</strong>
      <span className="muted">{lab.cat} · {lab.area}</span>
      <span className="status">{lab.status === "ready" ? "Ready" : "Planned"}</span>
    </button>
  );
}

function LabList({ cat, open }) {
  const list = cat ? LABS.filter(l => l.cat === cat) : LABS;
  if (!list.length) return <p className="empty">No labs in this category yet. Categories are built one at a time, after you confirm the previous one works.</p>;
  return <div className="grid">{list.map(l => <LabCard key={l.id} lab={l} open={open} />)}</div>;
}

function LabDetail({ lab, back }) {
  const rows = [["Difficulty", lab.level], ["Category", lab.cat], ["Test area", lab.area]];
  const t = TEXT[lab.id] || {};
  const secs = [["Vulnerability description", lab.desc], ["Target functionality", t.target || PENDING], ["Expected behavior", t.expected || PENDING],
    ["What happened?", t.happened || PENDING], ["Developer explanation", t.dev || PENDING], ["Remediation", t.fix || PENDING]];
  return (
    <article>
      <button className="link" onClick={back}>Back to labs</button>
      <h2>{lab.title}</h2>
      <dl className="meta">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      {lab.status === "ready" ? ({ "sqli-login": <SqliLogin />, "sqli-search": <SqliSearch />, "xss-reflected": <XssReflected />, "xss-stored": <XssStored />, "auth-weak": <AuthWeakPassword />, "auth-rate": <AuthRateLimit />, "authz-idor": <AuthzIdor />, "authz-admin": <AuthzAdmin />, "session-cookie": <SessionIdLab />, "auth-storage": <PwStorageLab />, "file-traversal": <FileReadLab />, "config-headers": <HeadersLab />, "logic-checkout": <CheckoutLab />, "api-exposure": <ApiUsersLab /> }[lab.id] || (lab.id === "xss-dom" ? <DomXss /> : null)) : <p className="notice">Status: planned. The vulnerable endpoint for this lab has not been built yet.</p>}
      {secs.map(([k, v], i) => i < 3
        ? <section key={k}><h3>{k}</h3><p className={v === PENDING ? "muted" : ""}>{v}</p></section>
        : <details key={k} className="reveal"><summary>{k}</summary><p className={v === PENDING ? "muted" : ""}>{v}</p></details>)}
    </article>
  );
}

function Channel() {
  return (
    <div className="channel">
      <div><strong>{CHANNEL.name} on YouTube</strong><p className="muted">{CHANNEL.tagline}</p></div>
      <a className="btn" href={CHANNEL.url} target="_blank" rel="noreferrer">Watch and subscribe</a>
    </div>
  );
}

function Home({ go }) {
  const stats = [["Labs planned", LABS.length], ["Labs ready", LABS.filter(l => l.status === "ready").length], ["Categories", NAV.filter(n => n.cat).length]];
  return (
    <>
      <h2>Dashboard</h2>
      <Channel />
      <div className="stats">{stats.map(([k, v]) => <div key={k} className="stat"><b>{v}</b><span>{k}</span></div>)}</div>
      <p className="notice">This platform is intentionally vulnerable and binds to 127.0.0.1 only. All data is dummy data.</p>
      <h3>Start here</h3>
      <LabList open={l => go("lab", l)} />
    </>
  );
}

function About() {
  return (
    <>
      <h2>About the Lab</h2>
      <p>Cyber Mahour is a local-only, intentionally vulnerable training app. Build, test, observe, understand, fix.</p>
      <p className="muted">Channel: <a href="https://www.youtube.com/@CyberMahour" target="_blank" rel="noreferrer">youtube.com/@CyberMahour</a></p>
      <Channel />
      {SECTIONS.map(([t, x]) => <section key={t}><h3>{t}</h3><p>{x}</p></section>)}
    </>
  );
}

export default function Dashboard({ user, onLogout }) {
  const parse = () => {
    const h = window.location.hash.slice(1);
    if (h.startsWith("lab/")) { const l = LABS.find(x => x.id === h.slice(4)); if (l) return ["lab", l]; }
    return [NAV.some(n => n.id === h) ? h : "dashboard", null];
  };
  const [[view, lab], setState] = useState(parse);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const f = () => { setState(parse()); setMenu(false); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  const go = (v, l = null) => { setMenu(false); window.location.hash = v === "lab" ? "lab/" + l.id : v; };
  const item = NAV.find(n => n.id === view);
  const active = view === "lab" ? NAV.find(n => n.cat === lab.cat)?.id : view;
  const open = l => go("lab", l);
  let body;
  if (view === "lab") body = <LabDetail lab={lab} back={() => go("labs")} />;
  else if (view === "dashboard") body = <Home go={go} />;
  else if (view === "about") body = <About />;
  else if (view === "reports") body = <><h2>Reports</h2><p className="empty">No lab runs recorded yet.</p></>;
  else body = <><h2>{item.label}</h2><LabList cat={item.cat} open={open} /></>;

  return (
    <div className="shell">
      <aside className={"side" + (menu ? " open" : "")}>
        <div className="brand">Cyber Mahour</div>
        <nav>{NAV.map(n => <button key={n.id} className={active === n.id ? "on" : ""} onClick={() => go(n.id)}>{n.label}</button>)}</nav>
        <a className="yt" href={CHANNEL.url} target="_blank" rel="noreferrer">Watch on YouTube</a>
      </aside>
      <div className="main">
        <header className="top">
          <button className="menu" onClick={() => setMenu(!menu)} aria-label="Toggle menu">Menu</button>
          <span className="spacer" />
          <span className="muted">{user.username} ({user.role})</span>
          <button className="btn small" onClick={onLogout}>Log out</button>
        </header>
        <div className="content">{body}</div>
      </div>
    </div>
  );
}
