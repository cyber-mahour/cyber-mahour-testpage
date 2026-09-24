"""LAB ONLY: intentionally vulnerable SQL injection labs.
Isolated on purpose: own database file (lab_sqli.db), dummy data, read-only connection.
The platform's real login table lives in lab.db and is never touched here."""
import os, sqlite3
from flask import Blueprint, request, session, jsonify

bp = Blueprint("sqli", __name__)
DB = os.path.join(os.path.dirname(__file__), "lab_sqli.db")

def conn(readonly=True):
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    if readonly:
        c.execute("PRAGMA query_only = ON")  # even a successful injection cannot write
    return c

def init_sqli():
    c = conn(False)
    c.executescript("""
    DROP TABLE IF EXISTS lab_users; DROP TABLE IF EXISTS products;
    CREATE TABLE lab_users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT);
    CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL);
    INSERT INTO lab_users VALUES (1,'admin','Adm1n-lab-pass','admin'),(2,'alice','alice123','student'),(3,'bob','qwerty','student');
    INSERT INTO products VALUES (1,'Notebook A5','Stationery',4.5),(2,'USB Cable','Electronics',3.0),(3,'Keyboard','Electronics',25.0),
      (4,'Headphones','Electronics',18.0),(5,'Webcam','Electronics',22.0),(6,'Desk Mat','Office',9.5);
    """)
    c.commit(); c.close()

@bp.before_request
def need_login():
    if "user" not in session:
        return jsonify(error="Log in first."), 401

def run(sql, params=()):
    try:
        return [dict(r) for r in conn().execute(sql, params).fetchall()], None
    except sqlite3.Error as e:
        return [], str(e)  # verbose error on purpose (information disclosure)

@bp.post("/api/labs/sqli-login")
def sqli_login():
    d = request.get_json(silent=True) or {}
    u, p, secure = str(d.get("username", "")), str(d.get("password", "")), bool(d.get("secure"))
    if secure:
        sql = "SELECT id, username, role FROM lab_users WHERE username = ? AND password = ?"
        rows, err = run(sql, (u, p)); shown = f"{sql}\n-- params: {[u, p]}"
    else:
        sql = f"SELECT id, username, role FROM lab_users WHERE username = '{u}' AND password = '{p}'"  # VULNERABLE
        rows, err = run(sql); shown = sql
    return jsonify(query=shown, error=err, success=bool(rows), user=rows[0] if rows else None)

@bp.get("/api/labs/sqli-search")
def sqli_search():
    q, secure = request.args.get("q", ""), request.args.get("secure") == "1"
    if secure:
        sql = "SELECT id, name, category, price FROM products WHERE name LIKE ?"
        rows, err = run(sql, (f"%{q}%",)); shown = f"{sql}\n-- params: {[f'%{q}%']}"
    else:
        sql = f"SELECT id, name, category, price FROM products WHERE name LIKE '%{q}%'"  # VULNERABLE
        rows, err = run(sql); shown = sql
    return jsonify(query=shown, error=err, rows=rows)
