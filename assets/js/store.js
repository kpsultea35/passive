/* =========================================================
   Nova Cart — free dropshipping storefront engine
   No build step, no backend. Cart lives in localStorage.
   ========================================================= */

const State = {
  store: {},
  products: [],
  filtered: [],
  category: "All",
  query: "",
  cart: JSON.parse(localStorage.getItem("novacart") || "{}"),
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = (n) => `${State.store.currencySymbol || "$"}${Number(n).toFixed(2)}`;

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
  $("#year").textContent = "2024".replace("2024", new Date().getFullYear());
}

function applyStoreBranding() {
  const s = State.store;
  document.title = `${s.name} — ${s.tagline || ""}`;
  $$("[data-store-name]").forEach((el) => (el.textContent = s.name || "Nova Cart"));
  $$("[data-store-tagline]").forEach((el) => (el.textContent = s.tagline || el.textContent));
  $$("[data-free-ship]").forEach((el) => (el.textContent = money(s.freeShippingOver || 0)));
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
          <img src="${p.image}" alt="${p.name}" loading="lazy" />
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
      <div class="modal__media"><img src="${p.image}" alt="${p.name}" /></div>
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
        <img src="${e.product.image}" alt="${e.product.name}" />
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

/* ---------- Checkout ----------
   Free, no-backend checkout strategies (pick one — see README):
   1. Per-product Payment Link  -> set "checkoutUrl" on each product (Stripe/PayPal/Gumroad)
   2. Single cart Payment Link  -> set store.checkoutUrl
   3. Email order fallback      -> opens a pre-filled email to you (works with zero setup)
*/
function checkout() {
  const entries = cartEntries();
  if (!entries.length) return;

  // Strategy 1: single-item cart with its own payment link
  if (entries.length === 1 && entries[0].product.checkoutUrl) {
    window.open(entries[0].product.checkoutUrl, "_blank");
    return;
  }
  // Strategy 2: store-wide payment link
  if (State.store.checkoutUrl) {
    window.open(State.store.checkoutUrl, "_blank");
    return;
  }
  // Strategy 3: zero-setup email order (works immediately)
  const lines = entries
    .map((e) => `• ${e.qty} × ${e.product.name} — ${money(e.product.price * e.qty)}`)
    .join("%0D%0A");
  const total = money(cartTotal());
  const to = State.store.supportEmail || "your@email.com";
  const subject = encodeURIComponent(`New order from ${State.store.name || "the store"}`);
  const body = `Hi! I'd like to order:%0D%0A%0D%0A${lines}%0D%0A%0D%0ATotal: ${total}%0D%0A%0D%0AShipping name:%0D%0AAddress:%0D%0A`;
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  toast("Opening your email to place the order…");
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
    const t = e.target.closest("[data-add], [data-view], [data-cat], [data-inc], [data-dec], [data-rm], [data-close-modal]");
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
