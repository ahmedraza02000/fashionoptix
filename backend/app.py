"""
FashionOptix backend — Phase 1 prototype API.

Pure Python standard library (http.server + sqlite3): no `pip install`
needed. Run with:  python app.py   (serves http://localhost:8000)

This backend provides a real HTTP API and a real SQLite database, but the
"AI" endpoints (search parsing, size prediction, sale authenticity, outfit
generation, visual search) are transparent, rule-based formulas over the
seeded catalog — not trained models. That is the honest state of a Phase 1
FYP prototype. Swap these functions for real scraping/NLP/ML services in
Phase 2 without changing the route contracts below.
"""

import json
import os
import random
import sqlite3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

from seed_data import BRANDS, PRODUCTS, price_history_for
from logic import parse_query, search_words, predict_size, sale_authenticity
from auth import hash_password, verify_password, new_token

GUEST_USER_ID = 0  # unauthenticated requests share this bucket, so the demo
                   # still works without forcing a login

DB_PATH = os.path.join(os.path.dirname(__file__), "fashionoptix.db")


# ---------------------------------------------------------------- database --
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    fresh = not os.path.exists(DB_PATH)
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand TEXT, name TEXT, category TEXT, color TEXT,
        price INTEGER, original_price INTEGER, quality_score INTEGER,
        rating REAL, material TEXT, availability TEXT
    );
    CREATE TABLE IF NOT EXISTS price_history (
        product_id INTEGER, month TEXT, price INTEGER
    );
    CREATE TABLE IF NOT EXISTS wishlist (
        user_id INTEGER, product_id INTEGER, PRIMARY KEY (user_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS compare_list (
        product_id INTEGER PRIMARY KEY
    );
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER,
        product_id INTEGER, kind TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, email TEXT UNIQUE, salt TEXT, password_hash TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY, user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS profiles (
        user_id INTEGER PRIMARY KEY,
        height REAL, weight REAL, chest REAL, waist REAL, hip REAL, shoulder REAL,
        preferred_brands TEXT, priorities TEXT, budget INTEGER
    );
    """)
    if fresh:
        for i, (brand, name, category, color, price, original, quality, rating, material) in enumerate(PRODUCTS):
            availability = "Low Stock" if i % 7 == 6 else "In Stock"
            c.execute(
                "INSERT INTO products (brand,name,category,color,price,original_price,quality_score,rating,material,availability)"
                " VALUES (?,?,?,?,?,?,?,?,?,?)",
                (brand, name, category, color, price, original, quality, rating, material, availability))
            pid = c.lastrowid
            for month, hist_price in price_history_for(price, original):
                c.execute("INSERT INTO price_history (product_id, month, price) VALUES (?,?,?)", (pid, month, hist_price))
        conn.commit()
        print(f"Seeded {len(PRODUCTS)} products into {DB_PATH}")
    conn.close()


def row_to_product(r, breakdown_seed=None):
    discount = round((1 - r["price"] / r["original_price"]) * 100) if r["original_price"] else 0
    q = r["quality_score"]
    return {
        "id": r["id"], "brand": r["brand"], "name": r["name"], "category": r["category"],
        "color": r["color"], "price": r["price"], "originalPrice": r["original_price"],
        "discount": discount, "qualityScore": q, "rating": r["rating"], "material": r["material"],
        "availability": r["availability"], "reviews": 300 + (r["id"] * 37) % 900,
        "sizes": ["S", "M", "L", "XL"],
        "insight": "Strong fabric durability signals" if q > 85 else "Solid value; some shrinkage mentions",
        "breakdown": {
            "Fabric durability": min(q + 3, 99), "Color retention": max(q - 2, 40),
            "Shrinkage resistance": max(q - 5, 40), "Customer sentiment": min(q + 2, 99),
        },
    }


# ------------------------------------------------------------------ routes --
def list_products(qs):
    conn = get_db()
    rows = conn.execute("SELECT * FROM products").fetchall()
    conn.close()
    return [row_to_product(r) for r in rows]


def get_product(pid):
    conn = get_db()
    r = conn.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone()
    conn.close()
    return row_to_product(r) if r else None


def get_price_history(pid):
    conn = get_db()
    rows = conn.execute("SELECT month, price FROM price_history WHERE product_id=?", (pid,)).fetchall()
    conn.close()
    return [{"month": r["month"], "price": r["price"]} for r in rows]


def get_sale_authenticity(pid):
    conn = get_db()
    prod = conn.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone()
    hist = [r["price"] for r in conn.execute("SELECT price FROM price_history WHERE product_id=?", (pid,)).fetchall()]
    conn.close()
    if not prod or not hist:
        return None
    return sale_authenticity(prod["price"], hist)


def do_search(qs):
    q = (qs.get("q", [""])[0])
    filters = parse_query(q)
    words = search_words(q)
    conn = get_db()
    rows = conn.execute("SELECT * FROM products").fetchall()
    conn.close()
    items = []
    for r in rows:
        if filters["color"] and r["color"] != filters["color"]:
            continue
        if filters["category"] and r["category"] != filters["category"]:
            continue
        if filters["maxPrice"] and r["price"] > filters["maxPrice"]:
            continue
        hay = f"{r['brand']} {r['name']} {r['material']}".lower()
        if words and not all(w in hay for w in words):
            continue
        items.append(row_to_product(r))
    return {"items": items, "filters": filters}


def price_intelligence():
    """Aggregate stats + trend data for the Price Intelligence dashboard.
    Computed live from the seeded catalog - a stand-in for real aggregated
    scrape history."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM products").fetchall()
    alerts_count = conn.execute("SELECT COUNT(*) c FROM alerts").fetchone()["c"]
    conn.close()
    discounts = [round((1 - r["price"] / r["original_price"]) * 100) for r in rows if r["original_price"]]
    by_brand = {}
    for r in rows:
        by_brand.setdefault(r["brand"], []).append(r["price"])
    brand_avg = [{"brand": b, "avgPrice": round(sum(v) / len(v))} for b, v in by_brand.items()]
    months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    # average of every product's synthesised history, per month
    conn = get_db()
    hist_rows = conn.execute("SELECT month, AVG(price) avgp FROM price_history GROUP BY month").fetchall()
    conn.close()
    order = {m: i for i, m in enumerate(months)}
    trend = sorted([{"month": r["month"], "avgPrice": round(r["avgp"])} for r in hist_rows], key=lambda x: order[x["month"]])
    return {
        "trackedProducts": len(rows),
        "averagePriceDrop": round(sum(discounts) / len(discounts)) if discounts else 0,
        "bestDealFound": max(discounts) if discounts else 0,
        "alertsTriggered": alerts_count,
        "brandAveragePrice": sorted(brand_avg, key=lambda x: -x["avgPrice"]),
        "priceTrend": trend,
    }


def list_brands():
    conn = get_db()
    rows = conn.execute("SELECT brand, COUNT(*) c, ROUND(AVG(rating),1) r FROM products GROUP BY brand").fetchall()
    conn.close()
    have = {r["brand"]: (r["c"], r["r"]) for r in rows}
    return [{"name": b, "productCount": have.get(b, (0, 0))[0], "rating": have.get(b, (0, 0))[1] or 4.0}
            for b in BRANDS]


def predict_size_endpoint(body):
    chest = float(body.get("chest", 90))
    waist = float(body.get("waist", 80))
    height = float(body.get("height", 170))
    weight = float(body.get("weight", 65))
    brands_req = body.get("brands") or BRANDS[:3]
    results = []
    for b in brands_req:
        size, conf = predict_size(chest, waist, height, weight, b)
        results.append({"brand": b, "size": size, "confidence": conf})
    overall = round(sum(r["confidence"] for r in results) / len(results))
    return {"results": results, "overallConfidence": overall}


def generate_outfit(body):
    occasion = body.get("occasion", "Casual")
    budget = int(body.get("budget", 10000))
    conn = get_db()
    rows = conn.execute("SELECT * FROM products").fetchall()
    conn.close()
    by_cat = {}
    for r in rows:
        by_cat.setdefault(r["category"], []).append(r)
    picks = []
    for cat in ["Shirts", "Polos", "T-Shirts"]:
        if by_cat.get(cat):
            picks.append(("TOP", min(by_cat[cat], key=lambda x: x["price"])))
            break
    for cat in ["Pants"]:
        if by_cat.get(cat):
            picks.append(("BOTTOM", min(by_cat[cat], key=lambda x: x["price"])))
    for cat in ["Shoes"]:
        if by_cat.get(cat):
            picks.append(("SHOES", min(by_cat[cat], key=lambda x: x["price"])))
    items = [{"slot": slot, "product": row_to_product(r)} for slot, r in picks]
    total = sum(i["product"]["price"] for i in items)
    return {
        "occasion": occasion, "items": items, "total": total, "withinBudget": total <= budget,
        "note": "These pieces share a neutral palette and a similar silhouette, chosen by matching category and price — a placeholder for the future styling model."
    }


def visual_search(body):
    """Mock visual similarity: since there is no real image model yet, this
    returns a deterministic-but-varied ranked list over the catalog."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM products ORDER BY quality_score DESC LIMIT 6").fetchall()
    conn.close()
    random.seed(len(body.get("filename", "")) or 7)
    out = []
    base = 94
    for r in rows[:5]:
        out.append({"match": max(70, base - random.randint(0, 6)), "product": row_to_product(r)})
        base -= random.randint(2, 6)
    out.sort(key=lambda x: -x["match"])
    return {"results": out}


def wishlist_get(user_id):
    conn = get_db()
    ids = [r["product_id"] for r in conn.execute("SELECT product_id FROM wishlist WHERE user_id=?", (user_id,)).fetchall()]
    conn.close()
    return {"ids": ids}


def wishlist_toggle(user_id, pid):
    conn = get_db()
    exists = conn.execute("SELECT 1 FROM wishlist WHERE user_id=? AND product_id=?", (user_id, pid)).fetchone()
    if exists:
        conn.execute("DELETE FROM wishlist WHERE user_id=? AND product_id=?", (user_id, pid))
        added = False
    else:
        conn.execute("INSERT INTO wishlist (user_id, product_id) VALUES (?,?)", (user_id, pid))
        added = True
    conn.commit()
    conn.close()
    return {"added": added}


def alerts_get(user_id):
    conn = get_db()
    rows = conn.execute("""SELECT alerts.id, alerts.kind, alerts.created_at, products.* FROM alerts
                            JOIN products ON products.id = alerts.product_id
                            WHERE alerts.user_id=? ORDER BY alerts.id DESC""", (user_id,)).fetchall()
    conn.close()
    return [{"id": r["id"], "kind": r["kind"], "createdAt": r["created_at"], "product": row_to_product(r)} for r in rows]


def alerts_create(user_id, body):
    pid = int(body.get("productId"))
    kind = body.get("kind", "price-drop")
    conn = get_db()
    conn.execute("INSERT INTO alerts (user_id, product_id, kind) VALUES (?,?,?)", (user_id, pid, kind))
    conn.commit()
    conn.close()
    return {"created": True}


# -------------------------------------------------------------------- auth --
def signup(body):
    name, email, password = body.get("name", "").strip(), body.get("email", "").strip().lower(), body.get("password", "")
    if not name or not email or len(password) < 6:
        return 400, {"error": "Name, email and a password of at least 6 characters are required."}
    conn = get_db()
    if conn.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
        conn.close()
        return 409, {"error": "An account with that email already exists."}
    salt, digest = hash_password(password)
    cur = conn.execute("INSERT INTO users (name, email, salt, password_hash) VALUES (?,?,?,?)", (name, email, salt, digest))
    user_id = cur.lastrowid
    token = new_token()
    conn.execute("INSERT INTO sessions (token, user_id) VALUES (?,?)", (token, user_id))
    conn.commit()
    conn.close()
    return 200, {"token": token, "user": {"id": user_id, "name": name, "email": email}}


def login(body):
    email, password = body.get("email", "").strip().lower(), body.get("password", "")
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not row or not verify_password(password, row["salt"], row["password_hash"]):
        conn.close()
        return 401, {"error": "Incorrect email or password."}
    token = new_token()
    conn.execute("INSERT INTO sessions (token, user_id) VALUES (?,?)", (token, row["id"]))
    conn.commit()
    conn.close()
    return 200, {"token": token, "user": {"id": row["id"], "name": row["name"], "email": row["email"]}}


def resolve_user(headers):
    """Returns (user_id, user_dict_or_None). Falls back to the shared guest
    bucket when there's no valid Bearer token, so the app still works
    without forcing a login."""
    auth = headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return GUEST_USER_ID, None
    token = auth[7:]
    conn = get_db()
    row = conn.execute("""SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
                           WHERE sessions.token=?""", (token,)).fetchone()
    conn.close()
    if not row:
        return GUEST_USER_ID, None
    return row["id"], {"id": row["id"], "name": row["name"], "email": row["email"]}


def logout(headers):
    auth = headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        conn = get_db()
        conn.execute("DELETE FROM sessions WHERE token=?", (auth[7:],))
        conn.commit()
        conn.close()
    return {"loggedOut": True}


def profile_get(user_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM profiles WHERE user_id=?", (user_id,)).fetchone()
    conn.close()
    if not row:
        return {}
    return {
        "height": row["height"], "weight": row["weight"], "chest": row["chest"], "waist": row["waist"],
        "hip": row["hip"], "shoulder": row["shoulder"],
        "preferredBrands": json.loads(row["preferred_brands"] or "[]"),
        "priorities": json.loads(row["priorities"] or "[]"), "budget": row["budget"],
    }


def profile_save(user_id, body):
    """Partial update: each page (Size Predictor, Profile, Settings) only
    sends the fields it owns, so we merge onto the existing row instead of
    overwriting the whole thing."""
    conn = get_db()
    existing = conn.execute("SELECT * FROM profiles WHERE user_id=?", (user_id,)).fetchone()
    current = {
        "height": existing["height"] if existing else None, "weight": existing["weight"] if existing else None,
        "chest": existing["chest"] if existing else None, "waist": existing["waist"] if existing else None,
        "hip": existing["hip"] if existing else None, "shoulder": existing["shoulder"] if existing else None,
        "preferredBrands": json.loads(existing["preferred_brands"]) if existing and existing["preferred_brands"] else [],
        "priorities": json.loads(existing["priorities"]) if existing and existing["priorities"] else [],
        "budget": existing["budget"] if existing else None,
    }
    merged = {**current, **{k: v for k, v in body.items() if v is not None}}
    conn.execute("""INSERT INTO profiles (user_id, height, weight, chest, waist, hip, shoulder, preferred_brands, priorities, budget)
                     VALUES (?,?,?,?,?,?,?,?,?,?)
                     ON CONFLICT(user_id) DO UPDATE SET height=excluded.height, weight=excluded.weight,
                       chest=excluded.chest, waist=excluded.waist, hip=excluded.hip, shoulder=excluded.shoulder,
                       preferred_brands=excluded.preferred_brands, priorities=excluded.priorities, budget=excluded.budget""",
                 (user_id, merged["height"], merged["weight"], merged["chest"], merged["waist"],
                  merged["hip"], merged["shoulder"], json.dumps(merged["preferredBrands"]),
                  json.dumps(merged["priorities"]), merged["budget"]))
    conn.commit()
    conn.close()
    return {"saved": True}


# --------------------------------------------------------------- http glue --
ROUTES_GET = {
    "/api/products": lambda qs, uid: list_products(qs),
    "/api/brands": lambda qs, uid: list_brands(),
    "/api/search": lambda qs, uid: do_search(qs),
    "/api/wishlist": lambda qs, uid: wishlist_get(uid),
    "/api/alerts": lambda qs, uid: alerts_get(uid),
    "/api/price-intelligence": lambda qs, uid: price_intelligence(),
    "/api/profile": lambda qs, uid: profile_get(uid),
}


class Handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(200, {})

    def do_GET(self):
        parsed = urlparse(self.path)
        path, qs = parsed.path, parse_qs(parsed.query)
        user_id, user = resolve_user(self.headers)
        try:
            if path == "/api/auth/me":
                return self._send(200, {"user": user})
            if path.startswith("/api/products/") and path.count("/") == 3:
                pid = int(path.rsplit("/", 1)[-1])
                p = get_product(pid)
                return self._send(200, p) if p else self._send(404, {"error": "not found"})
            if path.startswith("/api/price-history/"):
                pid = int(path.rsplit("/", 1)[-1])
                return self._send(200, get_price_history(pid))
            if path.startswith("/api/sale-authenticity/"):
                pid = int(path.rsplit("/", 1)[-1])
                r = get_sale_authenticity(pid)
                return self._send(200, r) if r else self._send(404, {"error": "not found"})
            if path in ROUTES_GET:
                return self._send(200, ROUTES_GET[path](qs, user_id))
            self._send(404, {"error": "unknown route", "path": path})
        except Exception as e:
            self._send(500, {"error": str(e)})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw or b"{}")
        except json.JSONDecodeError:
            body = {}
        path = urlparse(self.path).path
        user_id, user = resolve_user(self.headers)
        try:
            if path == "/api/auth/signup":
                status, payload = signup(body)
                return self._send(status, payload)
            if path == "/api/auth/login":
                status, payload = login(body)
                return self._send(status, payload)
            if path == "/api/auth/logout":
                return self._send(200, logout(self.headers))
            if path == "/api/profile":
                return self._send(200, profile_save(user_id, body))
            if path == "/api/predict-size":
                return self._send(200, predict_size_endpoint(body))
            if path == "/api/generate-outfit":
                return self._send(200, generate_outfit(body))
            if path == "/api/visual-search":
                return self._send(200, visual_search(body))
            if path == "/api/alerts":
                return self._send(200, alerts_create(user_id, body))
            if path.startswith("/api/wishlist/"):
                pid = int(path.rsplit("/", 1)[-1])
                return self._send(200, wishlist_toggle(user_id, pid))
            self._send(404, {"error": "unknown route", "path": path})
        except Exception as e:
            self._send(500, {"error": str(e)})

    def do_DELETE(self):
        path = urlparse(self.path).path
        try:
            if path.startswith("/api/alerts/"):
                aid = int(path.rsplit("/", 1)[-1])
                conn = get_db(); conn.execute("DELETE FROM alerts WHERE id=?", (aid,)); conn.commit(); conn.close()
                return self._send(200, {"deleted": True})
            self._send(404, {"error": "unknown route"})
        except Exception as e:
            self._send(500, {"error": str(e)})

    def log_message(self, fmt, *args):
        print("[api]", self.address_string(), fmt % args)


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 8000))  # most hosts (Render, etc.) assign this dynamically
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"FashionOptix backend running at http://localhost:{port}")
    print("Endpoints: /api/products /api/search /api/products/<id> /api/price-history/<id>")
    print("           /api/sale-authenticity/<id> /api/brands /api/predict-size /api/generate-outfit")
    print("           /api/visual-search /api/wishlist /api/alerts")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping...")
        server.shutdown()
