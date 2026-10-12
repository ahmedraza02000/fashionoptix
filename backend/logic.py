"""Deterministic, rule-based 'intelligence' functions.
These are NOT trained ML models - they are transparent formulas over the
seeded data, standing in for the NLP/ML pipeline planned for later phases.
Every response is labelled as prototype/demo analysis by the frontend."""

import re

COLORS = ["white", "black", "navy"]
CATEGORY_WORDS = {"polo": "Polos", "polos": "Polos", "shirt": "Shirts", "shirts": "Shirts",
                   "dress": "Dresses", "dresses": "Dresses", "sneaker": "Shoes", "sneakers": "Shoes",
                   "shoe": "Shoes", "shoes": "Shoes", "t-shirt": "T-Shirts", "tshirt": "T-Shirts",
                   "tee": "T-Shirts", "jacket": "Jackets", "jackets": "Jackets", "pant": "Pants",
                   "pants": "Pants", "trouser": "Pants", "kurta": "Ethnic", "kurti": "Ethnic"}
STOPWORDS = {"under", "below", "the", "and", "for", "rs", "a", "an", "in", "of", "with"}


def parse_query(q: str):
    """Very small natural-language-style parser: pulls out color, category and
    a max price from a free-text search string."""
    s = q.lower()
    color = next((c for c in COLORS if c in s), None)
    category = next((v for k, v in CATEGORY_WORDS.items() if k in s), None)
    m = re.search(r"(?:under|below)\s*(?:rs\.?\s*)?([\d,]+)", s)
    max_price = int(m.group(1).replace(",", "")) if m else None
    return {"color": color.capitalize() if color else None, "category": category, "maxPrice": max_price}


def search_words(q: str):
    skip = STOPWORDS | set(COLORS) | set(CATEGORY_WORDS.keys())
    return [w for w in re.split(r"\s+", q.lower()) if len(w) > 2 and w not in skip and not w.isdigit()]


# Rough brand sizing offsets relative to a "standard" chart, purely illustrative.
BRAND_FIT_BIAS = {"Sapphire": 0, "Khaadi": 0, "J.": 1, "Gul Ahmed": 0, "Outfitters": -1,
                   "Limelight": 0, "Nishat Linen": 0, "Generation": -1, "Ethnic": 0,
                   "Bonanza Satrangi": 0, "Servis": 0}
SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"]


def predict_size(chest, waist, height, weight, brand):
    """Simple formula-based size estimate from chest circumference (cm),
    nudged per-brand by a fixed bias. This is a placeholder for the
    'universal size prediction' model, not a trained classifier."""
    base_index = min(max(int((chest - 80) / 8), 0), len(SIZE_ORDER) - 1)
    bias = BRAND_FIT_BIAS.get(brand, 0)
    idx = min(max(base_index + bias, 0), len(SIZE_ORDER) - 1)
    bmi = weight / ((height / 100) ** 2) if height else 22
    confidence = 90 - abs(bmi - 22) * 2
    return SIZE_ORDER[idx], round(max(60, min(97, confidence)))


def sale_authenticity(price, history_prices):
    hi, lo = max(history_prices), min(history_prices)
    genuine = price <= hi * 0.9
    confidence = round(70 + (hi - price) / hi * 100 * 0.3, 0)
    return {
        "verdict": "Likely Genuine" if genuine else "Price recently increased before discount",
        "genuine": genuine,
        "confidence": min(97, max(55, confidence)),
        "currentPrice": price, "historicalHigh": hi, "typicalPrice": round(sum(history_prices) / len(history_prices)),
    }
