"""Cyber Mahour - LOCAL-ONLY training lab. Milestone 1: login.
The platform login itself is written safely on purpose; vulnerable behavior
lives in separate, isolated lab endpoints added in later milestones."""
import sqlite3
from flask import Flask, request, session, jsonify
from db import get_db, init_db
from labs_sqli import bp as sqli_bp, init_sqli
from labs_xss import bp as xss_bp
from labs_auth import bp as auth_bp
from labs_authz import bp as authz_bp
from labs_more import bp as more_bp

app = Flask(__name__)
app.secret_key = "lab-only-not-a-real-secret"  # LAB ONLY
app.register_blueprint(sqli_bp)
app.register_blueprint(xss_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(authz_bp)
app.register_blueprint(more_bp)

@app.post("/api/login")
def login():
    """LAB ONLY: the platform login itself is intentionally SQL-injectable
    (boolean-based, error-based, UNION-based). Read-only connection: even a
    successful injection cannot write to or drop the database."""
    data = request.get_json(silent=True) or {}
    u, p = str(data.get("username", "")), str(data.get("password", ""))
    sql = f"SELECT id, username, role FROM users WHERE username = '{u}' AND password = '{p}'"  # VULNERABLE
    conn = get_db()
    conn.execute("PRAGMA query_only = ON")
    try:
        user = conn.execute(sql).fetchone()
    except sqlite3.Error as e:
        return jsonify(error=str(e), query=sql), 400  # verbose error, on purpose
    finally:
        conn.close()
    if not user:
        return jsonify(error="Invalid username or password.", query=sql), 401
    session["user"] = dict(user)
    return jsonify(user=dict(user), query=sql)

@app.get("/api/me")
def me():
    return jsonify(user=session.get("user"))

@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify(ok=True)

if __name__ == "__main__":
    init_db()
    init_sqli()
    # 127.0.0.1 = reachable only from this computer. Never change to 0.0.0.0.
    app.run(host="127.0.0.1", port=5000, debug=False)
