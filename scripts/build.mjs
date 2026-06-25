#!/usr/bin/env node
/* =========================================================
   Pickwise build & automation script  (zero dependencies)
   ---------------------------------------------------------
   Runs in CI on every push and on a daily schedule. It:
     1. Validates data/products.json (catches broken picks).
     2. Confirms the Amazon Associates tag is set.
     3. Optionally refreshes title / image / rating / reviews
        live from the Amazon Product Advertising API (PA-API v5)
        — only if API credentials are provided as env vars.
     4. Regenerates sitemap.xml from the current pages.

   Usage:
     node scripts/build.mjs            # validate + sitemap
     node scripts/build.mjs --refresh  # also pull live PA-API data

   Env (all optional — refresh is skipped if unset):
     SITE_URL                  e.g. https://username.github.io/passive
     PAAPI_ACCESS_KEY          Amazon PA-API access key
     PAAPI_SECRET_KEY          Amazon PA-API secret key
     PAAPI_PARTNER_TAG         your Associates tag (overrides products.json)
     PAAPI_HOST                default webservices.amazon.com
     PAAPI_REGION              default us-east-1
   ========================================================= */

import { readFile, writeFile } from "node:fs/promises";
import { createHmac, createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data", "products.json");
const SITEMAP = join(ROOT, "sitemap.xml");

const STATIC_PAGES = [
  { loc: "", changefreq: "daily", priority: "1.0" },
  { loc: "about.html", changefreq: "monthly", priority: "0.6" },
  { loc: "policies.html", changefreq: "monthly", priority: "0.6" },
  { loc: "contact.html", changefreq: "monthly", priority: "0.5" },
  { loc: "privacy.html", changefreq: "yearly", priority: "0.3" },
  { loc: "terms.html", changefreq: "yearly", priority: "0.3" },
];

const log = (...a) => console.log("[build]", ...a);
const warn = (...a) => console.warn("[build] ⚠ ", ...a);

/* ---------------- Validation ---------------- */
function validate(data) {
  const errors = [];
  const warnings = [];
  const store = data.store || {};
  const products = data.products || [];

  if (!store.name) errors.push("store.name is missing");
  if (!store.amazonTag) warnings.push("store.amazonTag is empty — you will NOT earn commissions until it is set");
  else if (/example|youraffiliatetag|^your/i.test(store.amazonTag))
    warnings.push(`store.amazonTag "${store.amazonTag}" looks like a placeholder — replace it with your real Associates tag`);

  const ids = new Set();
  products.forEach((p, i) => {
    const where = `products[${i}] (${p.id || "no-id"})`;
    if (!p.id) errors.push(`${where}: missing id`);
    if (p.id && ids.has(p.id)) errors.push(`${where}: duplicate id`);
    ids.add(p.id);
    if (!p.name) errors.push(`${where}: missing name`);
    if (!p.category) errors.push(`${where}: missing category`);
    if (!p.asin && !p.amazonUrl) errors.push(`${where}: needs an "asin" or an "amazonUrl"`);
    if (p.asin && /EXAMPL/i.test(p.asin)) warnings.push(`${where}: ASIN "${p.asin}" is a placeholder — swap in a real ASIN`);
    if (p.asin && !/^[A-Z0-9]{10}$/i.test(p.asin)) warnings.push(`${where}: ASIN "${p.asin}" is not a valid 10-char ASIN`);
  });

  return { errors, warnings, store, products };
}

/* ---------------- Sitemap ---------------- */
async function writeSitemap(siteUrl) {
  const base = (siteUrl || "https://pickwise.example").replace(/\/+$/, "");
  const urls = STATIC_PAGES.map(
    (p) => `  <url><loc>${base}/${p.loc}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  await writeFile(SITEMAP, xml);
  log(`sitemap.xml written for ${base}`);
}

/* ---------------- PA-API v5 (optional live refresh) ---------------- */
// Minimal AWS SigV4 signer for the Product Advertising API.
function sign(key, msg) {
  return createHmac("sha256", key).update(msg, "utf8").digest();
}
function hash(msg) {
  return createHash("sha256").update(msg, "utf8").digest("hex");
}

async function paapiGetItems(asins, cfg) {
  const { accessKey, secretKey, partnerTag, host, region } = cfg;
  const service = "ProductAdvertisingAPI";
  const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems";
  const path = "/paapi5/getitems";
  const endpoint = `https://${host}${path}`;

  const payload = JSON.stringify({
    ItemIds: asins,
    Resources: [
      "ItemInfo.Title",
      "Images.Primary.Large",
      "CustomerReviews.Count",
      "CustomerReviews.StarRating",
    ],
    PartnerTag: partnerTag,
    PartnerType: "Associates",
    Marketplace: `www.${host.replace(/^webservices\./, "")}`,
  });

  // SigV4 requires a real timestamp; CI provides one. (Not used in offline mode.)
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target}\n`;
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const canonicalRequest = `POST\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${hash(payload)}`;

  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${hash(canonicalRequest)}`;

  const kDate = sign(`AWS4${secretKey}`, dateStamp);
  const kRegion = sign(kDate, region);
  const kService = sign(kRegion, service);
  const kSigning = sign(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-encoding": "amz-1.0",
      "content-type": "application/json; charset=utf-8",
      host,
      "x-amz-date": amzDate,
      "x-amz-target": target,
      Authorization: authorization,
    },
    body: payload,
  });
  if (!res.ok) throw new Error(`PA-API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function refresh(data, store) {
  const cfg = {
    accessKey: process.env.PAAPI_ACCESS_KEY,
    secretKey: process.env.PAAPI_SECRET_KEY,
    partnerTag: process.env.PAAPI_PARTNER_TAG || store.amazonTag,
    host: process.env.PAAPI_HOST || "webservices.amazon.com",
    region: process.env.PAAPI_REGION || "us-east-1",
  };
  if (!cfg.accessKey || !cfg.secretKey || !cfg.partnerTag) {
    warn("--refresh requested but PA-API credentials are not set; skipping live refresh.");
    return false;
  }
  const real = data.products.filter((p) => p.asin && !/EXAMPL/i.test(p.asin) && /^[A-Z0-9]{10}$/i.test(p.asin));
  if (!real.length) {
    warn("No real ASINs to refresh (all placeholders). Add real ASINs to enable live updates.");
    return false;
  }

  let updated = 0;
  // PA-API GetItems accepts up to 10 ItemIds per call.
  for (let i = 0; i < real.length; i += 10) {
    const batch = real.slice(i, i + 10);
    try {
      const json = await paapiGetItems(batch.map((p) => p.asin), cfg);
      const items = json?.ItemsResult?.Items || [];
      for (const item of items) {
        const p = data.products.find((x) => x.asin === item.ASIN);
        if (!p) continue;
        const title = item.ItemInfo?.Title?.DisplayValue;
        const img = item.Images?.Primary?.Large?.URL;
        const rating = item.CustomerReviews?.StarRating?.Value;
        const reviews = item.CustomerReviews?.Count;
        if (title) p.name = title;
        if (img) p.image = img;
        if (rating != null) p.rating = Number(rating);
        if (reviews != null) p.reviews = Number(reviews);
        if (item.DetailPageURL) p.amazonUrl = item.DetailPageURL;
        updated++;
      }
    } catch (e) {
      warn(`refresh batch failed: ${e.message}`);
    }
  }
  log(`PA-API refreshed ${updated} product(s).`);
  return updated > 0;
}

/* ---------------- Main ---------------- */
async function main() {
  const doRefresh = process.argv.includes("--refresh");
  const raw = await readFile(DATA, "utf8");
  const data = JSON.parse(raw);

  const { errors, warnings, store } = validate(data);
  warnings.forEach((w) => warn(w));
  if (errors.length) {
    errors.forEach((e) => console.error("[build] ✗ " + e));
    console.error(`[build] FAILED with ${errors.length} error(s).`);
    process.exit(1);
  }
  log(`validated ${data.products.length} picks across ${new Set(data.products.map((p) => p.category)).size} categories.`);

  let changed = false;
  if (doRefresh) changed = await refresh(data, store);
  if (changed) {
    await writeFile(DATA, JSON.stringify(data, null, 2) + "\n");
    log("products.json updated with fresh Amazon data.");
  }

  await writeSitemap(process.env.SITE_URL);
  log("done.");
}

main().catch((e) => {
  console.error("[build] fatal:", e);
  process.exit(1);
});
