# 🐾 Pawnest — Free Pet Dropshipping Store

A complete, **$0-to-run** dropshipping storefront for a pet niche. No backend, no
monthly fees, no Shopify subscription. It's a fast static site you host for free and
a simple `products.json` you edit to list whatever you sell.

> **What "free" means:** free hosting, free store software (this repo), and free
> checkout *links*. You only pay a per-sale processing fee (~2.9% + 30¢) **after** a
> customer actually pays — i.e. out of money you've already earned. Zero upfront cost.

**Why the pet niche?** Pet parents are emotional, loyal, repeat buyers, and there's an
endless supply of viral, high-margin products (calming beds, no-pull harnesses,
self-cleaning brushes). It's one of the most reliable niches for a first store.

---

## ✨ What you get

- 12 curated, trend-tested pet products (edit freely in `data/products.json`)
- Responsive storefront — hero, category filters (Comfort, Grooming, Walks, Feeding, Play, Travel), live search
- Slide-out cart with quantity controls and a **free-shipping progress bar**
- **Full checkout flow** — shipping form + order summary, payment-link ready, with a zero-setup email-order fallback that works *today*
- Graceful image fallback (a branded tile shows if a product photo ever fails)
- **About** and **Shipping & Returns** pages (trust = conversions)
- One-click free deploy to GitHub Pages (workflow included)

---

## 🚀 Go live in ~10 minutes (100% free)

### 1. Preview locally
Browsers block `fetch()` on `file://`, so run a tiny local server:
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

### 2. Deploy free — pick one host
**GitHub Pages (already wired up):** push this repo → **Settings → Pages → Source: GitHub Actions**. The included workflow publishes on every push. URL: `https://<username>.github.io/<repo>/`.

**Netlify / Cloudflare Pages / Vercel:** connect the repo or drag-drop the folder. No build command, publish directory = `/`. All give free HTTPS.

---

## 💳 Connect real payments (free to set up)

The store works **out of the box** with an email-order checkout (Strategy 3 below).
When you're ready to take card payments, add a free payment link — no monthly fee, you
only pay the standard ~2.9% + 30¢ per sale.

The `checkout()` flow tries these in order:

| # | Method | How to enable |
|---|--------|---------------|
| 1 | **Per-product payment link** | Put a link in a product's `"checkoutUrl"` |
| 2 | **Store-wide payment link** | Put a link in the `store.checkoutUrl` field |
| 3 | **Email order (default)** | Nothing to do — already works |

### Option A — Stripe Payment Links (recommended)
1. Create a free [Stripe account](https://dashboard.stripe.com/register).
2. **Products → Add product** → enter name + price → **Save**.
3. On the product, click **Create payment link** → copy the URL (looks like `https://buy.stripe.com/...`).
4. Paste it into that product's `"checkoutUrl"` in `data/products.json`.
5. In the payment link settings, turn on **Collect shipping address** so you get the customer's address automatically.

### Option B — PayPal
1. Create a free [PayPal business account](https://www.paypal.com/business).
2. Use **PayPal.me** (`https://paypal.me/yourname/19.99`) or a **Smart Payment Button** / invoice.
3. Paste the link into `"checkoutUrl"`.

### Option C — Gumroad (easiest, no business account)
Create a product on [Gumroad](https://gumroad.com), copy its share link into `"checkoutUrl"`. Free to start.

> Tip: per-product links give the cleanest experience. For multi-item carts, either set a single `store.checkoutUrl`, or keep the email checkout (Strategy 3) which sends you the full order + shipping details to invoice.

---

## 🛍️ Add / edit products

Everything lives in [`data/products.json`](data/products.json):
```json
{
  "id": "unique-handle",
  "name": "Product name",
  "category": "Grooming",
  "price": 18.99,
  "compareAt": 34.00,        // optional "was" price → shows a discount badge
  "rating": 4.7,
  "reviews": 12940,
  "image": "https://.../photo.jpg",
  "emoji": "🪮",              // shown if the image fails to load
  "description": "Sell the benefit, not the feature.",
  "tags": ["bestseller", "trending"],
  "checkoutUrl": ""          // paste a payment link (see above)
}
```

**Where to source pet products (free to browse):** AliExpress, CJ Dropshipping,
Zendrop, Spocket, AutoDS. Copy the product image, write your own description, and set
your `price` above supplier cost — the gap is your profit. **Dropshipping flow:** customer
pays → you order from the supplier shipping to their address → supplier ships direct → you keep the margin.

---

## 🎨 Make it your brand
- **Name / tagline / currency / free-shipping threshold / support email** → top of `products.json` (the storefront reads them live). Update the hardcoded "Pawnest" in `about.html` / `policies.html` too.
- **Colors** → CSS variables at the top of `assets/css/styles.css` (`--brand`, `--accent`, …).
- **Logo** → swap the 🐾 emoji in the HTML files and favicon lines.

---

## 📂 Structure
```
.
├── index.html               # storefront
├── about.html               # About page
├── policies.html            # Shipping & Returns + FAQ
├── assets/
│   ├── css/styles.css        # warm, responsive theme
│   └── js/store.js           # catalog, cart, checkout — zero dependencies
├── data/products.json        # ← your store config + catalog
└── .github/workflows/        # free auto-deploy to GitHub Pages
```

## ⚖️ Do it right
- Be honest about shipping times (supplier shipping is slower than Amazon — the policies page says so).
- Keep a real support email and a returns policy (both included).
- Check your country's rules on registering as a seller / collecting tax.
- Don't reuse trademarked brands or images you don't have rights to.

Edit `products.json`, deploy free, share your link, and start selling. 🐾
