"""
Scraper TEMPLATE — not a finished, working scraper.

Read scraping/README.md first. The selectors below (`.product-card`, etc.)
are placeholders for illustration — you must replace them with the real
structure of whatever page you're targeting, found via your browser's
"Inspect Element" on an actual product listing page.

This script is intentionally slow (a delay between requests) and scrapes
only a listing page's visible cards — it does not log in, does not bypass
any paywall or bot-protection, and does not scrape anything behind auth.
"""

import time
import sqlite3
import os
import sys
import requests
from bs4 import BeautifulSoup

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))  # so `from seed_data import ...` resolves
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "fashionoptix.db")
HEADERS = {"User-Agent": "Mozilla/5.0 (FYP research project; contact: you@example.com)"}
REQUEST_DELAY_SECONDS = 2  # be polite — don't lower this


def fetch_listing_page(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    time.sleep(REQUEST_DELAY_SECONDS)
    return resp.text


def parse_products(html: str, brand: str):
    """PLACEHOLDER parsing logic. Open the real page, inspect a product
    card, and replace these selectors with the real class names / tags."""
    soup = BeautifulSoup(html, "html.parser")
    products = []
    for card in soup.select(".product-card"):          # <-- replace selector
        name_el = card.select_one(".product-title")     # <-- replace selector
        price_el = card.select_one(".price")             # <-- replace selector
        if not name_el or not price_el:
            continue
        name = name_el.get_text(strip=True)
        price_text = price_el.get_text(strip=True).replace("Rs.", "").replace(",", "").strip()
        try:
            price = int(float(price_text))
        except ValueError:
            continue
        products.append({
            "brand": brand, "name": name, "category": "Uncategorized", "color": "Unknown",
            "price": price, "original_price": price, "quality_score": 75, "rating": 4.0,
            "material": "Not specified", "availability": "In Stock",
        })
    return products


def import_products(products: list[dict]):
    """Writes scraped products into the same database the backend reads
    from. Each gets a synthesised 6-month price history like the seed
    data, since real history only exists once you've scraped repeatedly
    over time."""
    from seed_data import price_history_for  # reuse the existing helper
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    for p in products:
        cur.execute(
            "INSERT INTO products (brand,name,category,color,price,original_price,quality_score,rating,material,availability)"
            " VALUES (?,?,?,?,?,?,?,?,?,?)",
            (p["brand"], p["name"], p["category"], p["color"], p["price"], p["original_price"],
             p["quality_score"], p["rating"], p["material"], p["availability"]))
        pid = cur.lastrowid
        for month, hist_price in price_history_for(p["price"], p["original_price"]):
            cur.execute("INSERT INTO price_history (product_id, month, price) VALUES (?,?,?)", (pid, month, hist_price))
    conn.commit()
    conn.close()
    print(f"Imported {len(products)} products.")


if __name__ == "__main__":
    # Example only — replace with a real, robots.txt-permitted listing URL.
    URL = "https://example.com/replace-with-a-real-category-page"
    BRAND = "ReplaceWithBrandName"
    html = fetch_listing_page(URL)
    products = parse_products(html, BRAND)
    if not products:
        print("No products parsed — your selectors in parse_products() need updating for this site's real HTML.")
    else:
        import_products(products)
