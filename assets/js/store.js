/* =========================================================
   Pawnest — free dropshipping storefront engine
   No build step, no backend. Cart lives in localStorage.
   Features: catalog, cart, coupons, checkout, email capture,
   SEO structured data, and optional analytics.
   ========================================================= */

const State = {
  store: {},
  products: [],
  filtered: [],
  category: "All",
  query: "",
  cart: JSON.parse(localStorage.getItem("novacart") || "{}"),
  coupon: null,
  checkoutEntries: [],
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = (n) => `${State.store.currencySymbol || "$"}${Number(n).toFixed(2)}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Graceful image fallback — if a product photo fails to load, show a branded tile
function imgTag(p, extraClass = "") {
  return `<img class="${extraClass}" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"
    data-emoji="${esc(p.emoji || "🐾")}" data-name="${esc(p.name)}" onerror="imgFallback(this)" />`;
}
window.imgFallback = function (img) {
  const el = document.createElement("div");
  el.className = "img-fallback";
  el.innerHTML = `<div class="emoji">${img.dataset.emoji || "🐾"}</div><div class="lbl">${img.dataset.name || ""}</div>`;
  img.replaceWith(el);
};

/* ---------- Boot ---------- */
async function init() {
  try {
    const res = await fetch("data/products.json");
    const data = await res.json();
    State.store = data.store || {};
    State.products = data.products || [];
  } catch (err) {
    $("#productGrid").innerHTML =
      `<div class="loading">Couldn't load products. If you're opening this file directly, run a local server (see README) — browsers block fetch() on file://.</div>`;
    console.error(err);
    return;
  }

  applyStoreBranding();
  buildFilters();
  filterProducts();
  bindEvents();
  renderCart();
  injectStructuredData();
  loadAnalytics();
  initNewsletter();
  initSocialProof();
  $("#year").textContent = new Date().getFullYear();
}

function applyStoreBranding() {
  const s = State.store;
  document.title = `${s.name} — ${s.tagline || ""}`;
  $$("[data-store-name]").forEach((el) => (el.textContent = s.name || "Pawnest"));
  $$("[data-store-tagline]").forEach((el) => (el.textContent = s.tagline || el.textContent));
  $$("[data-free-ship]").forEach((el) => (el.textContent = money(s.freeShippingOver || 0)));
  $$("[data-promo-code]").forEach((el) => (el.textContent = s.promoCode || ""));
  const mail = $("[data-support-email]");
  if (mail && s.supportEmail) mail.href = `mailto:${s.supportEmail}`;
}

/* ---------- Filters & search ---------- */
function buildFilters() {
  const cats = ["All", ...new Set(State.products.map((p) => p.category))];
  $("#filters").innerHTML = cats
    .map((c) => `<button class="chip ${c === "All" ? "active" : ""}" data-cat="${c}">${c}</button>`)
    .join("");
}

function filterProducts() {
  const q = State.query.toLowerCase();
  State.filtered = State.products.filter((p) => {
    const matchCat = State.category === "All" || p.category === State.category;
    const matchQ =
      !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
    return matchCat && matchQ;
  });
  renderGrid();
}

/* ---------- Product grid ---------- */
function starRow(rating, reviews) {
  const full = Math.round(rating);
  return `<div class="stars">${"★".repeat(full)}${"☆".repeat(5 - full)} <span>${rating} (${reviews.toLocaleString()})</span></div>`;
}

function renderGrid() {
  const grid = $("#productGrid");
  $("#resultCount").textContent = `${State.filtered.length} item${State.filtered.length === 1 ? "" : "s"}`;
  if (!State.filtered.length) {
    grid.innerHTML = `<div class="loading">No products match your search.</div>`;
    return;
  }
  grid.innerHTML = State.filtered
    .map((p) => {
      const save = p.compareAt ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
      const badge = p.tags?.includes("bestseller")
        ? `<span class="badge">Bestseller</span>`
        : p.tags?.includes("trending")
        ? `<span class="badge">Trending</span>`
        : "";
      return `
      <article class="card">
        <div class="card__media" data-view="${p.id}">
          ${imgTag(p)}
          ${badge}
          ${save > 0 ? `<span class="badge badge--save">-${save}%</span>` : ""}
        </div>
        <div class="card__body">
          <span class="card__cat">${p.category}</span>
          <div class="card__name" data-view="${p.id}">${p.name}</div>
          ${starRow(p.rating, p.reviews)}
          <div class="price-row">
            <span class="price">${money(p.price)}</span>
            ${p.compareAt ? `<span class="compare">${money(p.compareAt)}</span>` : ""}
          </div>
          <button class="btn btn--primary btn--full" data-add="${p.id}">Add to cart</button>
        </div>
      </article>`;
    })
    .join("");
}

/* ---------- Quick view modal ---------- */
function openModal(id) {
  const p = State.products.find((x) => x.id === id);
  if (!p) return;
  const save = p.compareAt ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  $("#productModal").innerHTML = `
    <div class="modal__grid">
      <div class="modal__media">${imgTag(p)}</div>
      <div class="modal__body">
        <button class="icon-btn modal__close" data-close-modal>✕</button>
        <span class="card__cat">${p.category}</span>
        <h2>${p.name}</h2>
        ${starRow(p.rating, p.reviews)}
        <div class="price-row">
          <span class="price">${money(p.price)}</span>
          ${p.compareAt ? `<span class="compare">${money(p.compareAt)}</span>` : ""}
          ${save > 0 ? `<span class="badge badge--save" style="position:static">Save ${save}%</span>` : ""}
        </div>
        <p class="modal__desc">${p.description || ""}</p>
        <button class="btn btn--primary btn--full" data-add="${p.id}">Add to cart</button>
        <p class="muted small center" style="margin-top:10px">🚚 Ships worldwide · ↩️ 30-day returns</p>
      </div>
    </div>`;
  $("#modalOverlay").classList.add("open");
  $("#productModal").classList.add("open");
}
function closeModal() {
  $("#modalOverlay").classList.remove("open");
  $("#productModal").classList.remove("open");
}

/* ---------- Cart ---------- */
function saveCart() {
  localStorage.setItem("novacart", JSON.stringify(State.cart));
}
function addToCart(id) {
  State.cart[id] = (State.cart[id] || 0) + 1;
  saveCart();
  renderCart();
  const p = State.products.find((x) => x.id === id);
  toast(`Added “${p?.name || "item"}” to cart`);
  track("add_to_cart", { id });
}
function setQty(id, qty) {
  if (qty <= 0) delete State.cart[id];
  else State.cart[id] = qty;
  saveCart();
  renderCart();
}
function cartEntries() {
  return Object.entries(State.cart)
    .map(([id, qty]) => ({ product: State.products.find((p) => p.id === id), qty }))
    .filter((e) => e.product);
}
function cartTotal() {
  return cartEntries().reduce((sum, e) => sum + e.product.price * e.qty, 0);
}
function cartCount() {
  return Object.values(State.cart).reduce((a, b) => a + b, 0);
}

function renderCart() {
  const entries = cartEntries();
  $("#cartCount").textContent = cartCount();
  const body = $("#cartItems");

  if (!entries.length) {
    body.innerHTML = `<div class="empty-cart">🛍️<p>Your cart is empty.</p><p class="small">Add some finds to get started.</p></div>`;
  } else {
    body.innerHTML = entries
      .map(
        (e) => `
      <div class="cart-item">
        ${imgTag(e.product)}
        <div>
          <div class="cart-item__name">${e.product.name}</div>
          <div class="cart-item__price">${money(e.product.price)}</div>
          <div class="qty">
            <button data-dec="${e.product.id}">−</button>
            <span>${e.qty}</span>
            <button data-inc="${e.product.id}">+</button>
            <button class="remove" data-rm="${e.product.id}">Remove</button>
          </div>
        </div>
        <strong>${money(e.product.price * e.qty)}</strong>
      </div>`
      )
      .join("");
  }

  const total = cartTotal();
  $("#cartSubtotal").textContent = money(total);
  $("#checkoutBtn").disabled = entries.length === 0;

  // Free shipping progress
  const threshold = State.store.freeShippingOver || 0;
  const note = $("#shipNote");
  if (threshold && total > 0 && total < threshold) {
    const pct = Math.min(100, (total / threshold) * 100);
    note.innerHTML = `Add <strong>${money(threshold - total)}</strong> more for free shipping!<div class="bar"><i style="width:${pct}%"></i></div>`;
  } else if (threshold && total >= threshold) {
    note.innerHTML = `🎉 You've unlocked <strong>free shipping</strong>!`;
  } else {
    note.innerHTML = "";
  }
}

function openCart() {
  $("#drawerOverlay").classList.add("open");
  $("#cartDrawer").classList.add("open");
}
function closeCart() {
  $("#drawerOverlay").classList.remove("open");
  $("#cartDrawer").classList.remove("open");
}

/* ---------- Coupons ---------- */
function findCoupon(code) {
  const c = (code || "").trim().toUpperCase();
  if (!c) return null;
  return (State.store.coupons || []).find((x) => x.code.toUpperCase() === c) || null;
}
function couponDiscount(subtotal) {
  if (!State.coupon) return 0;
  return +(subtotal * (State.coupon.percent / 100)).toFixed(2);
}
function applyCoupon() {
  const input = $("#couponCode");
  if (!input) return;
  const found = findCoupon(input.value);
  if (found) {
    State.coupon = found;
    openCheckout(State.checkoutEntries); // re-render with discount applied
    toast(`Coupon ${found.code} applied — ${found.percent}% off! 🎉`);
  } else {
    State.coupon = null;
    const msg = $("#couponMsg");
    if (msg) {
      msg.textContent = "That code isn't valid. Try WELCOME10.";
      msg.className = "coupon-msg err";
    }
  }
}

/* ---------- Checkout ----------
   Free, no-backend checkout strategies (pick one — see README):
   1. Per-product Payment Link  -> set "checkoutUrl" on each product (Stripe/PayPal/Gumroad)
   2. Single cart Payment Link  -> set store.checkoutUrl
   3. Email order fallback      -> opens a pre-filled email to you (works with zero setup)
*/
function checkout() {
  const entries = cartEntries();
  if (!entries.length) return;
  closeCart();
  track("begin_checkout", { value: cartTotal() });

  // Strategy 1: single-item cart with its own payment link → straight to secure payment
  if (entries.length === 1 && entries[0].product.checkoutUrl) {
    window.open(entries[0].product.checkoutUrl, "_blank");
    return;
  }
  // Strategy 2: store-wide payment link
  if (State.store.checkoutUrl) {
    window.open(State.store.checkoutUrl, "_blank");
    return;
  }
  // Strategy 3: zero-setup checkout modal that emails you the order (works immediately)
  openCheckout(entries);
}

function openCheckout(entries) {
  State.checkoutEntries = entries;
  const summary = entries
    .map((e) => `<div class="checkout__line"><span>${e.qty} × ${esc(e.product.name)}</span><span>${money(e.product.price * e.qty)}</span></div>`)
    .join("");
  const subtotal = cartTotal();
  const discount = couponDiscount(subtotal);
  const threshold = State.store.freeShippingOver || 0;
  const shipping = !threshold || subtotal >= threshold ? 0 : 4.99;
  const grand = subtotal - discount + shipping;

  $("#productModal").innerHTML = `
    <div class="checkout">
      <button class="icon-btn modal__close" data-close-modal>✕</button>
      <h2>Checkout</h2>
      <p class="muted small">Secure order — we'll confirm by email and send tracking.</p>
      <div class="checkout__summary">
        ${summary}
        ${discount > 0 ? `<div class="checkout__line discount"><span>Discount (${State.coupon.code})</span><span>−${money(discount)}</span></div>` : ""}
        <div class="checkout__line"><span>Shipping</span><span>${shipping === 0 ? "FREE" : money(shipping)}</span></div>
        <div class="checkout__line total"><span>Total</span><span>${money(grand)}</span></div>
      </div>
      <div class="coupon">
        <input id="couponCode" placeholder="Discount code" value="${State.coupon ? esc(State.coupon.code) : ""}" />
        <button class="btn btn--ghost" type="button" data-apply-coupon>Apply</button>
      </div>
      <p class="coupon-msg" id="couponMsg">${State.coupon ? `✓ ${State.coupon.percent}% off applied` : `Have a code? Try <strong>${esc(State.store.promoCode || "WELCOME10")}</strong>`}</p>
      <form id="checkoutForm">
        <div class="field"><label>Full name</label><input name="name" required placeholder="Jane Doe" /></div>
        <div class="field"><label>Email</label><input name="email" type="email" required placeholder="jane@email.com" /></div>
        <div class="field"><label>Shipping address</label><textarea name="address" required rows="2" placeholder="Street, city, postal code"></textarea></div>
        <div class="field--row">
          <div class="field"><label>Country</label><input name="country" required placeholder="United States" /></div>
          <div class="field"><label>Phone (optional)</label><input name="phone" placeholder="+1 …" /></div>
        </div>
        <button class="btn btn--primary btn--full" type="submit">Place order →</button>
        <p class="pay-note">🔒 You'll be emailed a secure payment link to complete your purchase.</p>
      </form>
    </div>`;

  $("#modalOverlay").classList.add("open");
  $("#productModal").classList.add("open");
  $("#checkoutForm").addEventListener("submit", (ev) => {
    ev.preventDefault();
    submitOrder(new FormData(ev.target), entries, shipping, discount);
  });
}

function submitOrder(form, entries, shipping, discount) {
  const lines = entries
    .map((e) => `- ${e.qty} x ${e.product.name} (${e.product.id}) = ${money(e.product.price * e.qty)}`)
    .join("%0D%0A");
  const subtotal = cartTotal();
  const grand = money(subtotal - discount + shipping);
  const to = State.store.supportEmail || "your@email.com";
  const get = (k) => encodeURIComponent(form.get(k) || "");
  const subject = encodeURIComponent(`New order — ${State.store.name || "store"}`);
  const couponLine = State.coupon ? `Coupon: ${State.coupon.code} (−${money(discount)})%0D%0A` : "";
  const body =
    `New order:%0D%0A%0D%0A${lines}%0D%0A` +
    couponLine +
    `Shipping: ${shipping === 0 ? "FREE" : money(shipping)}%0D%0ATotal: ${grand}%0D%0A%0D%0A` +
    `Name: ${get("name")}%0D%0AEmail: ${get("email")}%0D%0AAddress: ${get("address")}%0D%0A` +
    `Country: ${get("country")}%0D%0APhone: ${get("phone")}%0D%0A`;
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  track("purchase", { value: subtotal - discount + shipping, coupon: State.coupon?.code });
  closeModal();
  State.cart = {};
  State.coupon = null;
  saveCart();
  renderCart();
  toast("Order sent! Check your email to confirm. 🎉");
}

/* ---------- Email capture / newsletter ---------- */
function initNewsletter() {
  const popup = $("#promoPopup");
  // Footer signup
  const footerForm = $("#newsletterForm");
  if (footerForm) footerForm.addEventListener("submit", (e) => handleSignup(e, footerForm, $("#newsletterMsg")));

  if (!popup) return;
  const seen = localStorage.getItem("pawnest_promo_seen");
  if (seen) return;

  const show = () => {
    if (localStorage.getItem("pawnest_promo_seen")) return;
    $("#promoOverlay").classList.add("open");
    popup.classList.add("open");
  };
  const dismiss = () => {
    localStorage.setItem("pawnest_promo_seen", "1");
    $("#promoOverlay").classList.remove("open");
    popup.classList.remove("open");
  };

  // Show after 12s, or on exit-intent (mouse leaves toward the top)
  const timer = setTimeout(show, 12000);
  document.addEventListener("mouseout", function onLeave(e) {
    if (e.clientY <= 0 && !e.relatedTarget) {
      clearTimeout(timer);
      show();
      document.removeEventListener("mouseout", onLeave);
    }
  });

  $("#promoClose").addEventListener("click", dismiss);
  $("#promoOverlay").addEventListener("click", dismiss);
  const form = $("#promoForm");
  form.addEventListener("submit", (e) => handleSignup(e, form, $("#promoFormMsg"), true));
}

async function handleSignup(e, form, msgEl, isPopup) {
  e.preventDefault();
  const email = form.querySelector("input[type=email]").value;
  const action = State.store.newsletterAction;
  const reveal = () => {
    if (msgEl) msgEl.innerHTML = `🎉 You're in! Use code <strong>${esc(State.store.promoCode || "WELCOME10")}</strong> at checkout.`;
    form.reset();
    track("newsletter_signup", {});
    if (isPopup) localStorage.setItem("pawnest_promo_seen", "1");
  };
  if (!action) {
    // No Formspree configured yet — still works: store locally + reveal code
    reveal();
    return;
  }
  try {
    const res = await fetch(action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
    if (res.ok) reveal();
    else throw new Error("failed");
  } catch {
    if (msgEl) msgEl.textContent = "Hmm, that didn't send. Email " + (State.store.supportEmail || "us") + " to join.";
  }
}

/* ---------- Honest social proof (real data, no fake purchases) ---------- */
function initSocialProof() {
  const el = $("#proof");
  if (!el) return;
  const top = [...State.products].sort((a, b) => b.reviews - a.reviews).slice(0, 5);
  const msgs = top.map((p) => `⭐ <strong>${esc(p.name)}</strong> — ${p.rating}★ from ${p.reviews.toLocaleString()} reviews`);
  msgs.push(`🚚 Free shipping on orders over ${money(State.store.freeShippingOver || 0)}`);
  let i = 0,
    shown = 0;
  const cycle = () => {
    if (shown >= 6) return; // don't nag forever
    el.innerHTML = msgs[i % msgs.length];
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 5000);
    i++;
    shown++;
    setTimeout(cycle, 11000);
  };
  setTimeout(cycle, 6000);
}

/* ---------- SEO: structured data (JSON-LD) ---------- */
function injectStructuredData() {
  if (!$("#productGrid")) return; // only on the storefront
  const s = State.store;
  const graph = [
    { "@type": "Organization", name: s.name, description: s.tagline, email: s.supportEmail },
    {
      "@type": "ItemList",
      itemListElement: State.products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.name,
          description: p.description,
          category: p.category,
          image: p.image,
          aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews },
          offers: { "@type": "Offer", price: p.price, priceCurrency: s.currency || "USD", availability: "https://schema.org/InStock" },
        },
      })),
    },
  ];
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  document.head.appendChild(script);
}

/* ---------- Optional analytics (off until configured in products.json) ---------- */
function loadAnalytics() {
  const a = State.store.analytics;
  if (!a || !a.id) return;
  if (a.provider === "plausible") {
    const s = document.createElement("script");
    s.defer = true;
    s.setAttribute("data-domain", a.id);
    s.src = "https://plausible.io/js/script.js";
    document.head.appendChild(s);
  } else if (a.provider === "ga4") {
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + a.id;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", a.id);
  }
}
function track(event, params) {
  if (window.gtag) window.gtag("event", event, params || {});
  if (window.plausible) window.plausible(event);
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Events ---------- */
function bindEvents() {
  // Delegated clicks
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-add], [data-view], [data-cat], [data-inc], [data-dec], [data-rm], [data-close-modal], [data-apply-coupon]");
    if (!t) return;
    if (t.dataset.add) addToCart(t.dataset.add);
    else if (t.dataset.view) openModal(t.dataset.view);
    else if (t.dataset.cat) {
      State.category = t.dataset.cat;
      $$(".chip").forEach((c) => c.classList.toggle("active", c.dataset.cat === t.dataset.cat));
      filterProducts();
    } else if (t.dataset.inc) setQty(t.dataset.inc, (State.cart[t.dataset.inc] || 0) + 1);
    else if (t.dataset.dec) setQty(t.dataset.dec, (State.cart[t.dataset.dec] || 0) - 1);
    else if (t.dataset.rm) setQty(t.dataset.rm, 0);
    else if (t.dataset.applyCoupon !== undefined) applyCoupon();
    else if (t.dataset.closeModal !== undefined) closeModal();
  });

  $("#cartBtn").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#drawerOverlay").addEventListener("click", closeCart);
  $("#modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });
  $("#checkoutBtn").addEventListener("click", checkout);

  let searchTimer;
  $("#search").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      State.query = e.target.value.trim();
      filterProducts();
    }, 180);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeCart();
    }
  });
}

init();
