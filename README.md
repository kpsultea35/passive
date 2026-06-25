# 🛒 Pickwise — Free Amazon Affiliate Store

A complete, **$0-to-run** Amazon affiliate storefront. No inventory, no checkout, no
order handling — every product links straight to Amazon with **your** Associates tag, and
Amazon does the rest (price, payment, shipping, returns). You earn a commission on
qualifying purchases, at no extra cost to the buyer.

> **How you make money:** you join the free **Amazon Associates** program, get a tracking
> tag (like `yourname-20`), drop it into one config file, and every "Check price on
> Amazon" button on the site carries that tag. When someone clicks through and buys,
> Amazon pays you a commission.

It's a fast static site (zero dependencies) + a `products.json` you edit + a small Node
script that validates the catalog, generates the sitemap, and can auto-refresh live
Amazon data on a schedule.

---

## ✨ What you get
- A curated storefront with **12 example picks** across Tech, Home, Kitchen, Fitness, Outdoors, Office
- Category filters + live search, responsive design, quick-view "Why we picked it" modal
- Amazon-style **"Check price on Amazon"** CTAs with correct `rel="sponsored nofollow"` affiliate links
- **Full FTC + Amazon Associates disclosures** baked into every page (required — don't remove them)
- About, **How we pick / Disclosure**, Privacy, Terms, Contact pages
- A **build & automation script** (`scripts/build.mjs`) — validates picks, builds the sitemap, optional live PA-API refresh
- **GitHub Actions** that build + deploy on every push *and on a daily schedule*

---

## 🚀 Go live in ~15 minutes (100% free)

### 1. Get your Amazon Associates tag (required to earn)
1. Apply at **[associate-program.amazon.com](https://affiliate-program.amazon.com/)** (free).
2. Once approved, find your **tracking ID / Store ID** — it looks like `yourname-20`.
3. ⚠️ Amazon requires you to make **3 qualifying sales within 180 days** to stay approved, so apply when you're ready to share the site.

### 2. Add your tag + real products
Open [`data/products.json`](data/products.json):
```json
{
  "store": {
    "name": "Pickwise",
    "amazonTag": "yourname-20",        // ← your Associates tag goes here
    "amazonDomain": "www.amazon.com"   // change for .co.uk, .de, .ca, etc.
  }
}
```
Then replace each placeholder **ASIN** (`B0EXAMPL01` …) with the real ASIN of a product
you want to promote. The ASIN is in every Amazon URL: `amazon.com/dp/B0XXXXXXXX` →
`B0XXXXXXXX`. (See "Add / edit picks" below.)

### 3. Preview locally
Browsers block `fetch()` on `file://`, so run a tiny local server:
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

### 4. Deploy free
**GitHub Pages (already wired up):** push this repo → **Settings → Pages → Source:
GitHub Actions**. The included workflow builds and publishes on every push *and daily*.
URL: `https://<username>.github.io/<repo>/`.

**Netlify / Cloudflare Pages / Vercel:** connect the repo, no build command needed
(or run `node scripts/build.mjs`), publish directory = `/`.

---

## 🛍️ Add / edit picks
Everything lives in [`data/products.json`](data/products.json):
```json
{
  "id": "unique-handle",
  "name": "Product name",
  "category": "Tech",
  "asin": "B0XXXXXXXX",      // ← the real Amazon ASIN (preferred)
  "amazonUrl": "",           // optional: a full Amazon URL instead of an ASIN
  "rating": 4.7,             // shown as stars (from the Amazon listing)
  "reviews": 41280,          // review count (from the Amazon listing)
  "image": "https://...jpg", // product photo URL
  "emoji": "🎧",             // shown if the image fails to load
  "blurb": "One-line hook shown on the card.",
  "description": "Your editorial 'why we picked it' paragraph.",
  "pros": ["Bullet 1", "Bullet 2", "Bullet 3"],
  "badge": "Editor's Pick"   // optional ribbon: Editor's Pick / Best Value / Trending
}
```
The affiliate link is built **automatically** as
`https://{amazonDomain}/dp/{asin}?tag={amazonTag}` — you never hand-write links.

> **Finding good products to promote:** browse Amazon Best Sellers / Movers & Shakers in
> your niche, pick highly-rated items with lots of reviews, and grab the ASIN from the URL.

---

## 🤖 Automation (the "set it and forget it" part)
`scripts/build.mjs` runs in CI on every push **and on a daily schedule**:
```bash
node scripts/build.mjs            # validate catalog + (re)generate sitemap.xml
node scripts/build.mjs --refresh  # also pull live data from Amazon PA-API
```
It will:
- ✅ **Validate** every pick (missing ASIN, duplicate id, placeholder tag → loud warnings; hard errors fail the build so you never deploy a broken catalog).
- 🗺️ **Generate `sitemap.xml`** from your live site URL (set by CI automatically).
- 🔄 **Optionally refresh** product title, image, rating, and review count straight from
  Amazon — keeping the store current with zero manual edits.

### Enable daily live refresh (optional)
Live refresh uses the **[Amazon Product Advertising API (PA-API v5)](https://webservices.amazon.com/paapi5/documentation/)**.
You qualify for API keys after making a few Associates sales. Then add these as
**GitHub repo secrets** (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `PAAPI_ACCESS_KEY` | Your PA-API access key |
| `PAAPI_SECRET_KEY` | Your PA-API secret key |
| `PAAPI_PARTNER_TAG` | Your Associates tag (`yourname-20`) |

The daily workflow then refreshes prices/ratings/images on its own. No secrets? The
build simply skips the refresh and deploys your hand-entered data — nothing breaks.

---

## 🎨 Make it your brand
- **Name / tagline / tag / domain / support email** → top of `products.json` (the site reads them live via `data-store-name` / `data-store-tagline`).
- **Colors** → CSS variables at the top of `assets/css/styles.css` (`--brand`, `--accent`, …).
- **Logo** → swap the 🛒 emoji in the HTML files and the favicon lines.
- A few legal placeholders (your name/business) are bracketed in `privacy.html` / `terms.html` — fill those in.

---

## ⚖️ Staying compliant (important — don't skip)
Amazon's Associates Program has strict rules. This template follows them; keep it that way:
- **Keep the disclosures.** "As an Amazon Associate I earn from qualifying purchases" appears on every page. This is required by both the FTC and Amazon. Don't remove it.
- **Don't display Amazon prices as static text.** Prices change constantly and Amazon
  forbids showing stale prices — that's why this template says "Check price on Amazon"
  instead. (If you want live prices, pull them via PA-API only.)
- **Don't use "Amazon", "Prime", etc. in your brand/domain** in a way that implies endorsement.
- **Affiliate links use `rel="sponsored nofollow"`** (handled automatically) and open on Amazon.
- Read the [Associates Program Operating Agreement](https://affiliate-program.amazon.com/help/operating/agreement) and [Program Policies](https://affiliate-program.amazon.com/help/operating/policies) once before launch.

---

## 📂 Structure
```
.
├── index.html                # storefront (picks grid)
├── about.html                # About / why we exist
├── policies.html             # How we pick + full affiliate disclosure
├── contact.html              # Contact form (free Formspree-ready)
├── privacy.html / terms.html # Required legal pages
├── 404.html                  # friendly not-found page
├── robots.txt / sitemap.xml  # SEO (sitemap auto-generated by the build)
├── MARKETING.md              # affiliate content & launch playbook
├── assets/
│   ├── css/styles.css        # responsive theme
│   └── js/store.js           # catalog, filters, affiliate-link builder — zero deps
├── data/products.json        # ← your store config + picks
├── scripts/build.mjs         # validate + sitemap + optional PA-API refresh
└── .github/workflows/        # build + deploy to GitHub Pages (push + daily)
```

---

## ✅ Launch checklist
1. Get approved for **Amazon Associates**, copy your tag.
2. Set `store.amazonTag` and swap in **real ASINs** in `data/products.json`.
3. Fill in business name in `privacy.html` / `terms.html`; set up the Formspree form.
4. Push → enable GitHub Pages → share your link.
5. Drive traffic (see `MARKETING.md`) and land your first 3 qualifying sales within 180 days.

Edit `products.json`, push, share your link, and start earning. 🛒
