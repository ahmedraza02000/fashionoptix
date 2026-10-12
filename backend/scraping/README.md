# Scraping real brand data — read this before running anything

This folder is a **starting template**, not a finished scraper. I could not
write and test a working scraper against Sapphire, Khaadi, J., or Gul Ahmed
myself because my environment has no internet access at all — I can't even
load their pages to see the HTML I'd need to target. You'll need to run
and adapt this yourself, on your own machine, with your own internet
connection.

## Before you scrape anything
1. **Check each site's `robots.txt`** (e.g. `https://www.khaadi.com/robots.txt`)
   and terms of service. Some explicitly disallow automated access to
   certain paths. Respect that — scrape only what's allowed, and avoid
   anything requiring login.
2. **Rate-limit yourself.** The template below sleeps between requests.
   Don't remove that — hammering a retail site can get your IP blocked, or
   worse, cause real load on a production service that has nothing to do
   with your FYP.
3. **Expect to rewrite the parsing code per site.** Every brand's HTML is
   different, and changes without notice. The selectors in
   `scraper_template.py` are illustrative placeholders, not working
   selectors for a real site — open the page in your browser, use "Inspect
   Element" on a product card, and find the actual class names/structure.
4. Many fashion sites render products with JavaScript, which `requests` +
   `BeautifulSoup` cannot execute. If a page's HTML looks empty when you
   `print(response.text)`, you likely need Selenium or Playwright instead
   (both can drive a real browser) — slower, but it sees what you see.

## Setup
```bash
pip install requests beautifulsoup4 --break-system-packages
# if you need JS rendering instead:
pip install selenium webdriver-manager --break-system-packages
```

## Running it
```bash
python scraper_template.py
```
It writes scraped products into the same `fashionoptix.db` the backend
uses, via `import_products()`, so anything you successfully scrape shows
up in the app immediately — no extra wiring needed.
