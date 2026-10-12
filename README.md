# FashionOptix — Phase 1 Prototype (Frontend + Backend)

A real React frontend talking over HTTP to a real Python backend (standard
library only, no `pip install`) backed by a real SQLite database.

**What's real:** the HTTP API, the database, wishlist persistence, and the
search/size/sale-authenticity/outfit logic (deterministic formulas over the
seeded catalog). **What's not real yet:** live scraping of brand websites
and trained ML/NLP models — those are Phase 2. Nothing here claims
otherwise; screens are labelled "Prototype" or "Demo Data" where relevant.

## Run it — two terminals, in this order

**Terminal 1 — backend** (needs Python 3, no installs required):
```bash
cd backend
python app.py
```
Leave this running. It seeds `backend/fashionoptix.db` on first run and
serves the API at `http://localhost:8000`.

**Terminal 2 — frontend** (needs Node.js):
```bash
npm install
npm run dev
```
Open the printed link, usually `http://localhost:5173`.

If you open the frontend before starting the backend, you'll see an
orange "Backend not reachable" banner — start `python app.py` and reload.

## Structure
```
backend/
  app.py          the HTTP server + all routes (stdlib http.server)
  seed_data.py    the 24-product / 10-brand seed catalog
  logic.py        search parsing, size prediction, sale-authenticity formulas
  fashionoptix.db created automatically on first run (gitignore this)
src/
  services/mockApi.js   the only file that calls fetch() — every page goes through it
  pages/, components/   UI
```

## Real authentication (new)
Signup and Login now call a real backend: passwords are salted and hashed
with PBKDF2 (`backend/auth.py`, stdlib `hashlib`/`secrets`, no bcrypt
install needed), sessions are random tokens stored in a `sessions` table,
and the frontend sends `Authorization: Bearer <token>` on every request.
Wishlist, Alerts, and Profile (measurements, preferred brands, budget) are
all scoped to the logged-in account in SQLite. If no one is logged in,
those features fall back to a shared "guest" bucket so the demo still
works without forcing a login — useful for a quick viva walkthrough.

This is a real, working auth system for a student project, not
production-grade: there's no email verification, password reset, rate
limiting, or token expiry. Good enough to demonstrate real account-scoped
data persistence; not what you'd ship with real users' data.

## Pages implemented
Home · Search (with AI-style query parsing, filters, sorting) · Product
Intelligence page (quality score, 6-month price chart, sale authenticity) ·
Size Predictor (measurement wizard) · Visual Search (upload + mock ranked
matches) · Outfit Studio · Compare (up to 4 products, difference
highlighting, AI summary) · Price Intelligence (aggregate charts) ·
Dashboard · Wishlist (persisted) · Alerts (create/remove, price-drop and
restock) · Login / Signup (local mock auth — no real backend auth is
implemented, by design: this prototype has no payment or account security
scope) · Profile · Settings (theme, notifications, shopping preferences).

Account state (name, preferences, saved measurements, settings) is kept in
the browser's `localStorage`, since there is no user table in the database
yet — wishlist and alerts are the two features backed by real SQLite
storage.

## API reference
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/products` | full catalog |
| GET | `/api/products/{id}` | one product |
| GET | `/api/search?q=...` | parsed NL search |
| GET | `/api/price-history/{id}` | 6-month history |
| GET | `/api/sale-authenticity/{id}` | genuine/inflated verdict |
| GET | `/api/brands` | brand list + counts |
| POST | `/api/predict-size` | `{chest, waist, height, weight, brands}` |
| POST | `/api/generate-outfit` | `{occasion, budget}` |
| POST | `/api/visual-search` | mock similarity ranking |
| GET/POST | `/api/wishlist`, `/api/wishlist/{id}` | persisted wishlist (per account) |
| GET/POST/DELETE | `/api/alerts`, `/api/alerts/{id}` | price/restock alerts (per account) |
| POST | `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout` | real auth, see above |
| GET | `/api/auth/me` | current user from the `Authorization` header |
| GET/POST | `/api/profile` | measurements, preferred brands, budget (per account) |

## Connecting the real Phase-2 backend later
Nothing in the frontend needs to change — `src/services/mockApi.js` is the
only file that knows the API's base URL and route shapes. To move to the
full system, replace the *implementations* inside `backend/app.py` (swap
`seed_data.py` for a live scraper + real DB, swap `logic.py`'s formulas for
trained NLP/ML models) while keeping the same route paths and JSON shapes.
Flow: React → REST API (this backend) → scraping/DB → NLP/ML.
