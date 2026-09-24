import { useEffect, useState } from "react";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Always start at the login page: clear any old server session on every fresh page load.
  useEffect(() => {
    fetch("/api/logout", { method: "POST" }).catch(() => {}).finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  if (!user) return <Login onLogin={u => { window.location.hash = ""; setUser(u); }} />;

  const logout = () => fetch("/api/logout", { method: "POST" }).finally(() => setUser(null));
  return <Dashboard user={user} onLogout={logout} />;
}
