require("dotenv").config();

async function testGiftCards() {
  try {
    const response = await fetch(
      "https://api.fzr.cards/api/v2/giftcards?limit=50",
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

testGiftCards();