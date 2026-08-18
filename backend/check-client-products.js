require('dotenv').config();

/**
 * FoxReload Catalog Coverage Check (v2 — using real endpoints)
 * ---------------------------------------------------------------
 * Based on the actual "API Tester" panel in the FoxReload dashboard.
 * There's no "list full catalog" endpoint — instead we search per product
 * name using /api/products/search, which is actually more precise.
 *
 * Run: node check-client-products.js
 */

const API_KEY = process.env.FOXRELOAD_API_KEY;
const BASE_URL = "https://public-api.foxreload.com";

if (!API_KEY) {
  throw new Error('FOXRELOAD_API_KEY is required to run this catalog check');
}

const HEADERS = {
  "X-API-Key": API_KEY,
  "X-Language": "en",
  "X-Currency": "usd",
  "Accept": "application/json",
};

// نفس ليستة خالد
const CLIENT_PRODUCTS = [
  "Netflix",
  "Shahid VIP",
  "Disney+",
  "Amazon Prime Video",
  "OSN+",
  "TOD",
  "Apple TV+",
  "Hulu",
  "Snapchat Plus",
  "YouTube Premium",
  "Discord Nitro",
  "Telegram Premium",
  "X Premium",
  "Canva Pro",
  "ChatGPT Plus",
  "Microsoft 365 Personal",
  "Google One",
  "iCloud+",
  "Adobe Creative Cloud",
  "Spotify Premium",
  "Apple Music",
  "Anghami Plus",
  "Audible",
];

async function searchProduct(query) {
  const url = `${BASE_URL}/api/products/search?query=${encodeURIComponent(
    query
  )}&limit=10`;

  const res = await fetch(url, { headers: HEADERS });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for query "${query}"`);
  }

  const data = await res.json();
  // الرد بييجي كمصفوفة JSON مباشرة (مش ملفوف في results/items)
  return Array.isArray(data) ? data : data.results || data.items || data.products || data.data || [];
}

async function main() {
  console.log("=".repeat(30));
  console.log("CLIENT PRODUCTS CHECK (via search)");
  console.log("=".repeat(30));

  for (const clientProduct of CLIENT_PRODUCTS) {
    try {
      // بعض المنتجات فيها رموز زي + ممكن تعطل البحث، فبنبحث بأول كلمتين مفيدتين
      const searchTerm = clientProduct.replace(/\+/g, "").trim();
      const matches = await searchProduct(searchTerm);

      if (matches.length > 0) {
        console.log(`✅ ${clientProduct}`);
        matches.forEach((m) =>
          console.log(
            `   → ${m.name} | id: ${m.id} | qty: ${m.quantity} | price: ${
              m.price ?? "null (check on order)"
            }`
          )
        );
      } else {
        console.log(`❌ ${clientProduct}`);
      }
    } catch (err) {
      console.log(`⚠️  ${clientProduct} — Error: ${err.message}`);
    }

    // استنى شوية بين كل طلب عشان منضربش rate limit
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("=".repeat(30));
  console.log("DONE");
  console.log("=".repeat(30));
}

main().catch((err) => console.error("Fatal error:", err.message));
