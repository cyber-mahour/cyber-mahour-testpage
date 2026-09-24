"""LAB ONLY: Session Security, File Security, Configuration, Business Logic,
API Security and password-storage labs. All fake data, in memory."""
import os, itertools
from flask import Blueprint, request, session, jsonify, make_response

bp = Blueprint("more", __name__)
_seq = itertools.count(1001)

# ---- sandbox for the path-traversal lab: real files, but confined to this folder ----
SANDBOX = os.path.join(os.path.dirname(__file__), "lab_files")
os.makedirs(SANDBOX, exist_ok=True)
with open(os.path.join(SANDBOX, "welcome.txt"), "w") as f:
    f.write("Welcome! This folder only has public files.\n")
SECRET_OUTSIDE = os.path.join(os.path.dirname(__file__), "lab_secret.txt")
with open(SECRET_OUTSIDE, "w") as f:
    f.write("FLAG-PATH-TRAVERSAL: this file lives OUTSIDE the public folder.\n")

@bp.before_request
def need_login():
    if "user" not in session:
        return jsonify(error="Log in first."), 401

# ---------- Session Security ----------
@bp.get("/api/labs/session-id")
def session_id():
    secure = request.args.get("secure") == "1"
    sid = os.urandom(16).hex() if secure else str(next(_seq))  # VULNERABLE: sequential, guessable
    resp = make_response(jsonify(session_id=sid, secure=secure))
    return resp

# ---------- Weak password storage ----------
LAB_USERS_STORE = [{"username": "alice", "password": "alice123"}, {"username": "bob", "password": "qwerty"}]
@bp.get("/api/labs/pw-storage")
def pw_storage():
    secure = request.args.get("secure") == "1"
    import hashlib
    out = []
    for u in LAB_USERS_STORE:
        stored = hashlib.sha256((u["password"] + "lab-salt-only-for-demo").encode()).hexdigest() if secure else u["password"]
        out.append({"username": u["username"], "stored_as": stored})
    return jsonify(rows=out, secure=secure)

# ---------- File Security: path traversal ----------
@bp.get("/api/labs/file-read")
def file_read():
    name, secure = request.args.get("name", "welcome.txt"), request.args.get("secure") == "1"
    if secure:
        safe = os.path.basename(name)  # SECURE: strips any ../ path components
        path = os.path.join(SANDBOX, safe)
    else:
        path = os.path.normpath(os.path.join(SANDBOX, name))  # VULNERABLE: ../ escapes the folder
    if not os.path.isfile(path):
        return jsonify(error="File not found.", resolved_path=path), 404
    with open(path, "r", errors="replace") as f:
        return jsonify(content=f.read(2000), resolved_path=path)

# ---------- Configuration: missing security headers ----------
@bp.get("/api/labs/headers")
def headers_lab():
    secure = request.args.get("secure") == "1"
    resp = make_response(jsonify(ok=True))
    if secure:
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["Content-Security-Policy"] = "default-src 'self'"
    # VULNERABLE mode: server info exposed, no protective headers.
    return resp

# ---------- Business logic: price manipulation ----------
CATALOG = {"mug": 5.0, "tshirt": 12.0, "hoodie": 25.0}
@bp.post("/api/labs/checkout")
def checkout():
    d = request.get_json(silent=True) or {}
    item, qty, secure = str(d.get("item", "mug")), d.get("qty", 1), bool(d.get("secure"))
    try:
        qty = int(qty)
    except (TypeError, ValueError):
        return jsonify(error="Invalid quantity."), 400
    server_price = CATALOG.get(item)
    if server_price is None:
        return jsonify(error="Unknown item."), 400
    if secure:
        if qty < 1:
            return jsonify(error="Quantity must be at least 1."), 400
        total = round(server_price * qty, 2)
        return jsonify(total=total, note="Price and quantity are validated on the server.")
    # VULNERABLE: trusts a client-supplied price, and never checks quantity is positive.
    client_price = d.get("price", server_price)
    try:
        client_price = float(client_price)
    except (TypeError, ValueError):
        client_price = server_price
    total = round(client_price * qty, 2)
    return jsonify(total=total, note="Price and quantity came straight from the request.")

# ---------- API Security: excessive data exposure ----------
API_USERS = [
    {"id": 1, "username": "admin", "email": "admin@lab.test", "role": "admin", "password_hash": "sha256:8f14e45f...", "api_key": "sk_live_FAKE_ADMIN_KEY"},
    {"id": 2, "username": "alice", "email": "alice@lab.test", "role": "student", "password_hash": "sha256:5e884898...", "api_key": "sk_live_FAKE_ALICE_KEY"},
]
@bp.get("/api/labs/api-users")
def api_users():
    secure = request.args.get("secure") == "1"
    if secure:
        return jsonify(users=[{"id": u["id"], "username": u["username"], "role": u["role"]} for u in API_USERS])
    return jsonify(users=API_USERS)  # VULNERABLE: leaks password_hash and api_key to any logged-in caller
