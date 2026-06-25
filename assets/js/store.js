/* =========================================================
   Pickwise — Amazon affiliate storefront engine
   No build step, no backend. Every "Buy" is an Amazon
   affiliate link built from the store's Associates tag.
   ========================================================= */

const State = {
  store: {},
  products: [],
  filtered: [],
  category: "All",
  query: "",
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- Affiliate link builder ----------
   Priority:
     1. explicit product.amazonUrl
     2. /dp/<ASIN> when a real ASIN is set
     3. an Amazon search for the product name (graceful fallback so a
        pick still lands somewhere real & tagged before you add an ASIN)
   The store's Associates tag is always appended as ?tag=...  */
function isRealAsin(asin) {
  return !!asin && /^[A-Z0-9]{10}$/i.test(asin) && !/EXAMPL/i.test(asin);
}
function amazonLink(p) {
  const tag = State.store.amazonTag || "";
  const domain = State.store.amazonDomain || "www.amazon.com";
  let url;
  try {
    if (p.amazonUrl) url = new URL(p.amazonUrl);
    else if (isRealAsin(p.asin)) url = new URL(`https://${domain}/dp/${encodeURIComponent(p.asin)}`);
    else url = new URL(`https://${domain}/s?k=${encodeURIComponent(p.name || "")}`);
  } catch {
    url = new URL(`https://${domain}/`);
  }
  if (tag) url.searchParams.set("tag", tag);
  return url.toString();
}

// Affiliate links MUST be rel="sponsored nofollow" and open in a new tab.
function buyAttrs(p) {
  return `href="${esc(amazonLink(p))}" target="_blank" rel="sponsored nofollow noopener" data-buy="${esc(p.id)}"`;
}

/* Wire up any hand-written affiliate links on the page (e.g. in blog posts).
   Mark an <a> with data-aff and a data-asin, data-id, data-name, or data-url:
     <a data-aff data-id="air-fryer">Check price on Amazon →</a>
   The correct tagged link is built from the store config so there's one
   source of truth for your Associates tag. */
function enhanceAffiliateLinks() {
  $$("a[data-aff]").forEach((a) => {
    const byId = a.dataset.id && State.products.find((p) => p.id === a.dataset.id);
    const p = byId || { asin: a.dataset.asin, name: a.dataset.name, amazonUrl: a.dataset.url };
    a.href = amazonLink(p);
    a.target = "_blank";
    a.rel = "sponsored nofollow noopener";
  });
}

// Graceful image fallback — if a product photo fails to load, show a branded tile
function imgTag(p, extraClass = "") {
  return `<img class="${extraClass}" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"
    data-emoji="${esc(p.emoji || "🛒")}" data-name="${esc(p.name)}" onerror="imgFallback(this)" />`;
}
window.imgFallback = function (img) {
  const el = document.createElement("div");
  el.className = "img-fallback";
  el.innerHTML = `<div class="emoji">${img.dataset.emoji || "🛒"}</div><div class="lbl">${img.dataset.name || ""}</div>`;
  img.replaceWith(el);
};

/* ---------- Boot ---------- */
// Works from the site root and from /blog/ subpages alike.
async function loadData() {
  for (const path of ["data/products.json", "../data/products.json"]) {
    try {
      const res = await fetch(path);
      if (res.ok) return await res.json();
    } catch {
      /* try next path */
    }
  }
  throw new Error("products.json not found");
}

async function init() {
  try {
    const data = await loadData();
    State.store = data.store || {};
    State.products = data.products || [];
  } catch (err) {
    const grid = $("#productGrid");
    if (grid)
      grid.innerHTML =
        `<div class="loading">Couldn't load products. If you're opening this file directly, run a local server (see README) — browsers block fetch() on file://.</div>`;
    console.error(err);
    return;
  }

  applyStoreBranding();
  enhanceAffiliateLinks();
  if ($("#filters")) buildFilters();
  if ($("#productGrid")) filterProducts();
  bindEvents();
  const yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  // Friendly heads-up for the owner if the affiliate tag hasn't been set yet.
  if (!State.store.amazonTag || /example|youraffiliatetag/i.test(State.store.amazonTag)) {
    console.warn(
      "[Pickwise] Your Amazon Associates tag is a placeholder. Set store.amazonTag in data/products.json so you earn commissions."
    );
  }
}

function applyStoreBranding() {
  const s = State.store;
  if (s.name) document.title = document.title.replace(/Pickwise/g, s.name);
  $$("[data-store-name]").forEach((el) => (el.textContent = s.name || "Pickwise"));
  $$("[data-store-tagline]").forEach((el) => (el.textContent = s.tagline || el.textContent));
  const mail = $("[data-support-email]");
  if (mail && s.supportEmail) mail.href = `mailto:${s.supportEmail}`;
}

/* ---------- Filters & search ---------- */
function buildFilters() {
  const cats = ["All", ...new Set(State.products.map((p) => p.category))];
  $("#filters").innerHTML = cats
    .map((c) => `<button class="chip ${c === "All" ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`)
    .join("");
}

function filterProducts() {
  const q = State.query.toLowerCase();
  State.filtered = State.products.filter((p) => {
    const matchCat = State.category === "All" || p.category === State.category;
    const hay = `${p.name} ${p.category} ${p.blurb || ""} ${p.description || ""}`.toLowerCase();
    return matchCat && (!q || hay.includes(q));
  });
  renderGrid();
}

/* ---------- Product grid ---------- */
function starRow(rating, reviews) {
  const full = Math.round(rating);
  const count = reviews ? ` <span>${rating} · ${Number(reviews).toLocaleString()} ratings</span>` : ` <span>${rating}</span>`;
  return `<div class="stars" title="Average customer rating on Amazon">${"★".repeat(full)}${"☆".repeat(5 - full)}${count}</div>`;
}

function renderGrid() {
  const grid = $("#productGrid");
  if (!grid) return;
  const rc = $("#resultCount");
  if (rc) rc.textContent = `${State.filtered.length} pick${State.filtered.length === 1 ? "" : "s"}`;
  if (!State.filtered.length) {
    grid.innerHTML = `<div class="loading">No picks match your search.</div>`;
    return;
  }
  grid.innerHTML = State.filtered
    .map((p) => {
      const badge = p.badge ? `<span class="badge">${esc(p.badge)}</span>` : "";
      return `
      <article class="card">
        <div class="card__media" data-view="${esc(p.id)}">
          ${imgTag(p)}
          ${badge}
        </div>
        <div class="card__body">
          <span class="card__cat">${esc(p.category)}</span>
          <div class="card__name" data-view="${esc(p.id)}">${esc(p.name)}</div>
          ${starRow(p.rating, p.reviews)}
          <p class="card__blurb">${esc(p.blurb || "")}</p>
          <a class="btn btn--primary btn--full btn--amazon" ${buyAttrs(p)}>Check price on Amazon →</a>
          <button class="link-more" data-view="${esc(p.id)}">Why we picked it</button>
        </div>
      </article>`;
    })
    .join("");
}

/* ---------- Quick view modal ---------- */
function openModal(id) {
  const p = State.products.find((x) => x.id === id);
  if (!p) return;
  const pros = (p.pros || []).map((x) => `<li>${esc(x)}</li>`).join("");
  $("#productModal").innerHTML = `
    <div class="modal__grid">
      <div class="modal__media">${imgTag(p)}</div>
      <div class="modal__body">
        <button class="icon-btn modal__close" data-close-modal>✕</button>
        <span class="card__cat">${esc(p.category)}</span>
        <h2>${esc(p.name)}</h2>
        ${starRow(p.rating, p.reviews)}
        <p class="modal__desc">${esc(p.description || "")}</p>
        ${pros ? `<h3 class="modal__h3">Why we picked it</h3><ul class="pros">${pros}</ul>` : ""}
        <a class="btn btn--primary btn--full btn--amazon" ${buyAttrs(p)}>Check price on Amazon →</a>
        <p class="muted small center disclosure-mini">As an Amazon Associate we earn from qualifying purchases. Price &amp; availability shown on Amazon.</p>
      </div>
    </div>`;
  $("#modalOverlay").classList.add("open");
  $("#productModal").classList.add("open");
}
function closeModal() {
  $("#modalOverlay").classList.remove("open");
  $("#productModal").classList.remove("open");
}

/* ---------- Events ---------- */
function bindEvents() {
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-view], [data-cat], [data-close-modal]");
    if (!t) return;
    if (t.dataset.view) openModal(t.dataset.view);
    else if (t.dataset.cat) {
      State.category = t.dataset.cat;
      $$(".chip").forEach((c) => c.classList.toggle("active", c.dataset.cat === t.dataset.cat));
      filterProducts();
    } else if (t.dataset.closeModal !== undefined) closeModal();
  });

  const overlay = $("#modalOverlay");
  if (overlay)
    overlay.addEventListener("click", (e) => {
      if (e.target.id === "modalOverlay") closeModal();
    });

  const search = $("#search");
  if (search) {
    let searchTimer;
    search.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        State.query = e.target.value.trim();
        filterProducts();
      }, 180);
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

init();
