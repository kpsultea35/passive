# 🛒 Nova Cart — Free Dropshipping Store Starter

A complete, **$0-to-run** dropshipping storefront. No backend, no monthly fees, no
Shopify subscription. It's a fast static site you can host for free and a simple
`products.json` you edit to list whatever you want to sell.

> **What "free" means here:** free hosting, free store software (this repo), and
> free checkout *links*. You only ever pay a per-sale processing fee (~2.9% + 30¢)
> **after** a customer actually pays — i.e. out of money you've already earned.
> There is no upfront cost.

---

## ✨ What you get

- Responsive storefront with hero, category filters, and live search
- Product grid + quick-view modal with ratings, discounts, "bestseller" badges
- Slide-out cart with quantity controls and a **free-shipping progress bar**
- Cart saved in the browser (`localStorage`) — survives refreshes
- Three checkout options, including a **zero-setup email order** that works today
- One-click deploy to GitHub Pages (workflow included)

---

## 🚀 Get it live in 10 minutes (100% free)

### 1. See it locally
Browsers block `fetch()` on `file://`, so run a tiny local server:

```bash
# Python (already installed on most machines)
python3 -m http.server 8000
# then open http://localhost:8000
```

### 2. Deploy for free — pick one host

**Option A — GitHub Pages (already wired up)**
1. Push this repo to GitHub.
2. Go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The included `.github/workflows/deploy.yml` publishes your store on every push.
   Your URL: `https://<your-username>.github.io/<repo>/`.

**Option B — Netlify / Cloudflare Pages / Vercel (free tier)**
- Drag-and-drop this folder, or connect the repo. No build command, publish
  directory = `/` (root). Done.

All four give you free HTTPS and a free `*.app`/`*.dev` domain.

---

## 🛍️ Add your own products

Everything lives in [`data/products.json`](data/products.json). Edit the `store`
block and the `products` array:

```json
{
  "id": "unique-handle",
  "name": "Product name",
  "category": "Home",
  "price": 18.99,
  "compareAt": 32.00,          // optional "was" price → shows a discount badge
  "rating": 4.7,
  "reviews": 1284,
  "image": "https://.../photo.jpg",
  "description": "Sales copy that sells the benefit, not the feature.",
  "tags": ["bestseller", "trending"],
  "checkoutUrl": ""            // paste a payment link here (see below)
}
```

**Where to find products to sell (free to browse):** AliExpress, CJ Dropshipping,
Zendrop, Spocket, AutoDS. Copy the product image + write your own description, and
set your `price` above your supplier cost — the gap is your profit.

---

## 💳 Getting paid (three free options)

The store tries these in order — you don't have to configure anything to start.

| # | Method | Setup | When to use |
|---|--------|-------|-------------|
| 1 | **Per-product payment link** — set `checkoutUrl` on a product | Create a free [Stripe Payment Link](https://stripe.com/payments/payment-links), [PayPal.me](https://paypal.me), or [Gumroad](https://gumroad.com) link and paste it in | Best for real card payments |
| 2 | **Store-wide payment link** — add `"checkoutUrl"` to the `store` block | Same as above, one link for the whole cart | Simple single-link checkout |
| 3 | **Email order (default, zero setup)** | Just set `store.supportEmail` | Validate demand *today* before signing up for anything |

> Stripe/PayPal Payment Links cost **nothing** to create. You're only charged the
> standard processing fee when a customer pays — so checkout is genuinely free
> until you make money.

### Fulfilling an order (dropshipping flow)
1. Customer pays (or emails you the order).
2. You place the same order with your supplier, shipping to the customer's address.
3. Supplier ships directly. You keep the margin. No inventory, no upfront stock.

---

## 🎨 Make it yours

- **Brand name / tagline / currency / free-shipping threshold** → top of `products.json`.
- **Colors** → CSS variables at the top of `assets/css/styles.css` (`--brand`, `--accent`, …).
- **Logo** → swap the 🛒 emoji in `index.html` and the favicon line.

---

## 📂 Project structure

```
.
├── index.html               # the storefront
├── assets/
│   ├── css/styles.css        # all styling (dark, modern, responsive)
│   └── js/store.js           # catalog, cart, checkout — no dependencies
├── data/products.json        # ← your store config + product catalog
└── .github/workflows/        # free auto-deploy to GitHub Pages
```

## ⚖️ A note on doing this legally & well
- Be honest about shipping times (supplier shipping can be slow — say so).
- Have a returns/contact policy and a real support email.
- Check your country's rules on registering as a seller / collecting tax.
- Don't reuse trademarked brands or copyrighted images you don't have rights to.

That's it — edit `products.json`, deploy free, share your link, and start selling. 🎉
