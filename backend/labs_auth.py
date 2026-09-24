"""LAB ONLY: Authentication labs.
- Weak password policy: a signup check, in-memory, no real accounts created.
- No rate limiting: a SEPARATE dummy account (bruteforce_target), never the
  platform admin account, so brute-forcing it can never lock you out of the
  app itself. Designed to be attacked from outside with a tool like Hydra,
  not just from the browser."""
import time
from flask import Blueprint, request, session, jsonify

bp = Blueprint("auth_labs", __name__)

TARGET_USER, TARGET_PASS = "bruteforce_target", "letmein123"
FAILS = {}          # username -> [timestamps of recent failures], secure mode only
LOCK_SECONDS, MAX_FAILS = 20, 5

@bp.before_request
def need_login_except_bruteforce():
    # The brute-force endpoint must be reachable WITHOUT a platform login,
    # exactly like a real external login page Hydra would attack.
    if request.path == "/api/labs/auth-login":
        return
    if "user" not in session:
        return jsonify(error="Log in first."), 401

@bp.post("/api/labs/auth-signup")
def auth_signup():
    d = request.get_json(silent=True) or {}
    pw, secure = str(d.get("password", "")), bool(d.get("secure"))
    if not secure:
        return jsonify(accepted=True, reason="No policy is enforced (lab only; nothing is actually stored).")
    import re
    ok = len(pw) >= 8 and re.search(r"[A-Z]", pw) and re.search(r"[0-9]", pw)
    return jsonify(accepted=bool(ok),
                    reason="Needs 8+ characters, one uppercase letter and one digit." if not ok else "Meets the policy.")

@bp.post("/api/labs/auth-login")
def auth_login():
    """Accepts JSON OR classic HTML form encoding, so it can be driven from
    the browser or from an external tool such as Hydra's http-post-form."""
    if request.is_json:
        d = request.get_json(silent=True) or {}
    else:
        d = request.form
    u, p = str(d.get("username", "")), str(d.get("password", ""))
    secure = str(d.get("secure", "")).lower() in ("1", "true", "on")

    if secure:
        now = time.time()
        FAILS[u] = [t for t in FAILS.get(u, []) if now - t < LOCK_SECONDS]
        if len(FAILS[u]) >= MAX_FAILS:
            wait = int(LOCK_SECONDS - (now - FAILS[u][0]))
            return jsonify(ok=False, message=f"Account locked. Try again in {max(wait,1)}s."), 429

    ok = (u == TARGET_USER and p == TARGET_PASS)
    if not ok and secure:
        FAILS.setdefault(u, []).append(time.time())
    return jsonify(ok=ok, message="Welcome back." if ok else "Invalid credentials."), (200 if ok else 401)

@bp.post("/api/labs/auth-login/reset")
def auth_login_reset():
    FAILS.clear()
    return jsonify(ok=True)
