# Cyber Mahour

**A local-only, intentionally vulnerable web app for cybersecurity training and YouTube tutorials.**
Built alongside [@CyberMahour](https://www.youtube.com/@CyberMahour).

> ## ⚠️ READ BEFORE RUNNING
> This application is **intentionally vulnerable**, on purpose, for education.
> - **Run it only on `127.0.0.1` (localhost), on your own machine.**
> - **Never deploy this to a public server, cloud VM, or shared network.**
> - All accounts, data and "secrets" in this app are dummy/fake.
> - The author is not responsible for misuse of this software. Use only on
>   systems you own, for authorized learning.

## What's inside
15 hands-on labs across 9 categories: **SQL Injection · XSS (Reflected, Stored, DOM-based) ·
Authentication · Authorization · Session Security · File Security · Configuration ·
Business Logic · API Security.**

Every lab has:
- A **Vulnerable / Secure** code toggle, so you can compare both side by side
- A live trace of the exact request/query/response
- Hints and a one-click "Show solution"
- Vulnerability description, target functionality, difficulty, expected behavior,
  "what happened?", developer explanation, and remediation

The platform login itself is also intentionally SQL-injectable (boolean, error and
UNION based), and a separate dummy account (`bruteforce_target`) is provided
specifically for external brute-force tools like **Hydra**.

## Training credentials (intentionally weak — dummy data)
| Purpose | Username | Password |
|---|---|---|
| Platform login | `admin` | `admin` |
| Brute-force lab target | `bruteforce_target` | `letmein123` |

## Requirements
- Python 3.10+
- Node.js 18+

## Run it
```bash
# Terminal 1 — backend
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```
Open **http://127.0.0.1:5173** (use `127.0.0.1`, not `localhost`).

## Design notes
- All lab databases/files are isolated from the platform's own login data.
- Read-only DB connections are used where possible, so injection labs cannot
  write or drop tables.
- Run as a normal user, never as root/Administrator.

## License
MIT — see [LICENSE](LICENSE). For educational use only.
