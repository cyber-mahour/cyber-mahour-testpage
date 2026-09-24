"""LAB ONLY: intentionally vulnerable XSS labs. Isolated, in-memory comment
store (resets on server restart). Cookie used for the demo has HttpOnly OFF
on purpose, only for this one lab cookie, so a working payload can read it."""
from flask import Blueprint, request, session, jsonify, make_response

bp = Blueprint("xss", __name__)
COMMENTS = [{"id": 1, "author": "lab-bot", "text": "Welcome! Try posting a comment below."}]

@bp.before_request
def need_login():
    if "user" not in session:
        return jsonify(error="Log in first."), 401

@bp.get("/api/labs/xss-reflected")
def xss_reflected():
    q, secure = request.args.get("q", ""), request.args.get("secure") == "1"
    return jsonify(query=q, secure=secure)

@bp.get("/api/labs/xss-comments")
def list_comments():
    return jsonify(comments=COMMENTS)

@bp.post("/api/labs/xss-comments")
def post_comment():
    d = request.get_json(silent=True) or {}
    text = str(d.get("text", ""))[:500]  # stored raw on purpose; encoding happens on output
    COMMENTS.append({"id": len(COMMENTS) + 1, "author": session["user"]["username"], "text": text})
    return jsonify(comments=COMMENTS)

@bp.post("/api/labs/xss-comments/reset")
def reset_comments():
    COMMENTS[:] = COMMENTS[:1]
    return jsonify(comments=COMMENTS)

@bp.get("/api/labs/xss-cookie")
def xss_cookie():
    # Dummy value only. HttpOnly is off here on purpose so a working XSS
    # payload can demonstrate document.cookie theft in the isolated lab.
    resp = make_response(jsonify(ok=True))
    resp.set_cookie("lab_token", "dummy-lab-token-not-real", httponly=False, samesite="Lax")
    return resp
