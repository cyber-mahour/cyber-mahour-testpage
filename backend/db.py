import sqlite3, os
DB = os.path.join(os.path.dirname(__file__), "lab.db")

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student'
    );
    """)
    # LAB ONLY: dummy data, intentionally weak credentials (plaintext on purpose).
    conn.execute("INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin','admin','admin')")
    conn.commit(); conn.close()
