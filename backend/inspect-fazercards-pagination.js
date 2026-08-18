require("dotenv").config();

async function main() {
  const response = await fetch(
    "https://api.fzr.cards/api/v2/giftcards?limit=500",
    {
      headers: {
        "X-API-Key": process.env.FAZER_API_KEY,
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();

  console.log("STATUS:", response.status);
  console.log("\nRESPONSE KEYS:");
  console.log(Object.keys(data));

  console.log("\nFULL RESPONSE METADATA:");
  console.log(
    JSON.stringify(
      {
        ...data,
        items: `[${data.items?.length || 0} items omitted]`,
      },
      null,
      2
    )
  );
}

main();