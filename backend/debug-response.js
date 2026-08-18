require("dotenv").config();
const API_KEY = process.env.FOXRELOAD_API_KEY;
const BASE_URL = "https://public-api.foxreload.com";

if (!API_KEY) {
  throw new Error("FOXRELOAD_API_KEY is required to run this debug script");
}

const HEADERS = {
  "X-API-Key": API_KEY,
  "X-Language": "en",
  "X-Currency": "usd",
  "Accept": "application/json",
};

async function debug() {
  const url = `${BASE_URL}/api/products/search?query=netflix&limit=10`;
  const res = await fetch(url, { headers: HEADERS });

  console.log("Status:", res.status, res.statusText);

  const text = await res.text();
  console.log("Raw response body:");
  console.log(text);
}

debug().catch((err) => console.error("Error:", err.message));
