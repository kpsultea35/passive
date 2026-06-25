# 📣 Pickwise — Affiliate Marketing Playbook

Your store earns when people **click a pick and buy on Amazon**. So the whole game is
traffic + trust. This is your starter kit: positioning, content angles, and a launch
plan tuned for an Amazon affiliate site (not a dropshipping store).

---

## 🎯 Brand voice
Helpful, sharp, and honest — like a friend who already did the research. Lead with
*"here's the one worth buying and why,"* never hype. Trust is what converts affiliate
clicks.

**One-liner:** *Pickwise — smart finds, honest picks.*

---

## 🧭 The affiliate growth model (read this first)
- **You get paid per qualifying sale**, at no cost to the buyer. Commission rates vary
  by category (roughly 1–4% for electronics, up to ~10% for some categories).
- **Volume beats hype.** Your job is to rank for buyer-intent searches and capture
  people who are *about to buy something anyway*.
- **The fastest path:** target "best ___" and "___ vs ___" keywords where the searcher
  has their wallet out, then send them to Amazon to close.

---

## 🔑 Content that earns clicks (best → good)
1. **"Best of" roundups** — *"Best Air Fryers Under $100 (2026)"*. Highest intent. Each
   product card here is one entry; expand into a blog post per roundup.
2. **Comparisons** — *"Robot Vacuum vs. Stick Vacuum: which should you buy?"*
3. **Problem-first guides** — *"How to set up smart lighting for under $40"* → links to
   the LED strip pick.
4. **Gift guides** — *"15 gifts under $25 that don't feel cheap."* Seasonal goldmine.
5. **Single-product deep reviews** — long-tail, easy to rank, high conversion.

---

## 📱 Social captions (ready to post)
Drive traffic to the site (link in bio), which then routes to Amazon.

- "I tested 6 air fryers so you don't have to. Here's the only one worth buying 👇 #amazonfinds"
- "This $30 gadget replaced my entire dumbbell rack. Home-gym people, you're welcome. 🏋️"
- "Amazon finds that actually slap: the LED strips that make any room look 10x better ✨"
- "POV: you stop overpaying for coffee because this frother turned your kitchen into a café ☕"
- "Top-rated, no sponsored junk. Just the stuff worth your money → link in bio 🛒"

> ⚠️ **Disclosure is required.** On social, add `#ad` / `#affiliate` / "commissions
> earned" wherever you share affiliate links. The site already discloses on every page.

---

## ✍️ SEO blog post template (expand any pick into a ranking post)
> **# Best {Category} in 2026: Top {N} Picks Tested**
> *Intro: the buyer's problem + "we compared X options."*
> **## 1. {Product} — Best Overall** → image, 2–3 sentence verdict, pros/cons,
> "Check price on Amazon" button (your affiliate link).
> Repeat for each pick. Close with a short buyer's guide (what to look for) for SEO depth.

Reuse the blurbs and "Why we picked it" bullets already in `data/products.json` as the
seed for each entry.

---

## 🚀 Free launch checklist
- [ ] Get approved for **Amazon Associates** (associate-program.amazon.com) and copy your tag (`yourname-20`).
- [ ] Put your tag in `data/products.json` → `store.amazonTag`.
- [ ] Replace the placeholder ASINs with **real ASINs** of products you want to promote.
- [ ] Replace the store URL in `sitemap.xml`, `robots.txt`, and `og:` tags (or let CI set it).
- [ ] Set up the free Formspree contact form (see `contact.html`).
- [ ] Fill in your name/business in `privacy.html` & `terms.html`.
- [ ] **Make 3 qualifying sales within 180 days** to keep your Associates account active.
- [ ] Publish 3–5 "best of" posts and pin them; share to Pinterest, Reddit (follow rules), and a niche YouTube/TikTok.

> **Where the first sales come from:** Pinterest pins (huge for product roundups),
> SEO blog posts targeting "best ___" keywords, niche subreddits/Facebook groups, and
> short-form video reviews. All free.

---

## 📈 Once you're earning
- Add **PA-API** keys as repo secrets to auto-refresh prices/ratings daily (see README).
- Double down on whichever roundup converts best — expand it, update it, build internal links to it.
- Apply to other affiliate programs (Walmart, Target, niche brands) for products Amazon
  doesn't carry, using the same card format.
