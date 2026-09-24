"""LAB ONLY: Authorization labs (IDOR + broken access control).
All data is fake and in memory. The lab identity is a dummy 'student' user
(alice, id 3), independent of the platform admin login."""
from flask import Blueprint, request, session, jsonify

bp = Blueprint("authz", __name__)
ME = 3  # the lab identity: alice, a normal student
PROFILES = {
    1: {"id": 1, "name": "Priya (Lab Admin)", "email": "priya@lab.test", "role": "admin", "private_note": "Admin recovery hint: FLAG-IDOR-ADMIN-0001"},
    2: {"id": 2, "name": "Rahul", "email": "rahul@lab.test", "role": "student", "private_note": "Rahul's private note: FLAG-IDOR-0002"},
    3: {"id": 3, "name": "Alice (you)", "email": "alice@lab.test", "role": "student", "private_note": "Your own note. Nothing secret here."},
    4: {"id": 4, "name": "Bob", "email": "bob@lab.test", "role": "student", "private_note": "Bob's private note: FLAG-IDOR-0004"},
    5: {"id": 5, "name": "Charlie", "email": "charlie@lab.test", "role": "student", "private_note": "Charlie's private note: FLAG-IDOR-0005"},
}
ME_ROLE = "student"

@bp.before_request
def need_login():
    if "user" not in session:
        return jsonify(error="Log in first."), 401

@bp.get("/api/labs/authz-profile/<int:pid>")
def profile(pid):
    secure = request.args.get("secure") == "1"
    if secure and pid != ME:  # SECURE: the server checks the object belongs to the caller
        return jsonify(error="Forbidden: you can only view your own profile."), 403
    p = PROFILES.get(pid)  # VULNERABLE: no ownership check
    if not p:
        return jsonify(error="No such profile."), 404
    return jsonify(profile=p)

@bp.get("/api/labs/authz-admin-users")
def admin_users():
    secure = request.args.get("secure") == "1"
    if secure and ME_ROLE != "admin":  # SECURE: the server checks the role
        return jsonify(error="Forbidden: admin role required."), 403
    # VULNERABLE: the admin link is hidden in the UI, but the server never checks the role
    return jsonify(users=[{"id": p["id"], "name": p["name"], "email": p["email"], "role": p["role"]} for p in PROFILES.values()])
