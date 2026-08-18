require("dotenv").config();

async function testProduct() {
  try {
    const response = await fetch(
      "https://api.fzr.cards/api/v2/giftcards/cards?category_id=amazon_sa",
      {
        headers: {
          "X-API-Key": process.env.FAZER_API_KEY,
        },
      }
    );

    const data = await response.json();

    console.log("Status:", response.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("FazerCards request failed:");
    console.error(error);
  }
}

testProduct();