var currencyInfo;

// Add commas to long numbers
function addCommas(num) {
  return parseFloat(num, "10").toLocaleString();
}

// Hide loading animation
function hideLoading() {
  var loadingIcon = document.querySelector(".loading_icon");
  loadingIcon.style.display = "none";
}

// Add currency block
function addCurrency(
  rank,
  symbol,
  currencyName,
  price,
  changeInPrice,
  marketCap,
  volume24h,
  circulatingSupply
) {
  // Creating all HTML elements
  var mainContainerDiv = document.querySelector(".main_container");

  var currencyPlaceholderDiv = document.createElement("div");
  var currencyContainerDiv = document.createElement("div");

  var currencyNameDiv = document.createElement("div");
  var priceDiv = document.createElement("div");
  var changeInPriceDiv = document.createElement("div");

  var currencyDetailsListUl = document.createElement("ul");
  var marketCapLi = document.createElement("li");
  var volume24hLi = document.createElement("li");
  var circulatingSupplyLi = document.createElement("li");

  // Setting Attribute Values
  currencyPlaceholderDiv.setAttribute("class", "currency_placeholder");
  currencyContainerDiv.setAttribute("class", "currency_container");
  currencyContainerDiv.setAttribute("data-currency-rank", "#" + rank);
  currencyNameDiv.setAttribute("class", "currency_name");
  currencyNameDiv.setAttribute("data-coin-symbol", symbol);
  priceDiv.setAttribute("class", "currecny_price");
  if (changeInPrice <= 0) {
    changeInPriceDiv.setAttribute(
      "class",
      "currency_change_in_price down_change"
    );
  } else {
    changeInPriceDiv.setAttribute(
      "class",
      "currency_change_in_price up_change"
    );
  }
  currencyDetailsListUl.setAttribute("class", "currency_details_list");
  marketCapLi.setAttribute("data-title", "Market Cap");
  volume24hLi.setAttribute("data-title", "Volume (24h)");
  circulatingSupplyLi.setAttribute("data-title", "Circulating Supply");

  // Adding Values from the API
  currencyNameDiv.innerHTML = currencyName;
  priceDiv.innerHTML = "$" + addCommas(price);
  changeInPriceDiv.innerHTML = parseFloat(changeInPrice).toFixed(2) + "%";
  marketCapLi.innerHTML = addCommas(marketCap);
  volume24hLi.innerHTML = addCommas(volume24h);
  if (circulatingSupply == null) {
    circulatingSupplyLi.innerHTML = "--";
  } else {
    circulatingSupplyLi.innerHTML = addCommas(circulatingSupply);
  }

  // Adding the elements to the DOM
  currencyDetailsListUl.appendChild(marketCapLi);
  currencyDetailsListUl.appendChild(volume24hLi);
  currencyDetailsListUl.appendChild(circulatingSupplyLi);

  currencyContainerDiv.appendChild(currencyNameDiv);
  currencyContainerDiv.appendChild(priceDiv);
  currencyContainerDiv.appendChild(changeInPriceDiv);
  currencyContainerDiv.appendChild(currencyDetailsListUl);
  currencyPlaceholderDiv.appendChild(currencyContainerDiv);
  mainContainerDiv.appendChild(currencyPlaceholderDiv);
}

function loadCoins() {
  for (let i = 0; i < currencyInfo.length; i++) {
    addCurrency(
      currencyInfo[i].rank,
      currencyInfo[i].symbol,
      currencyInfo[i].name,
      currencyInfo[i].priceUsd,
      currencyInfo[i].changePercent24Hr,
      currencyInfo[i].marketCapUsd,
      currencyInfo[i].volumeUsd24Hr,
      currencyInfo[i].maxSupply
    );
  }
}

// Define the API endpoint URL
const apiUrl = "https://api.coincap.io/v2/assets";

// Fetch function to retrieve data
async function fetchData() {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    currencyInfo = data.data;
    loadCoins();
    hideLoading();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

// Usage
fetchData()
  .then((data) => {
    console.log("Fetched data:", data);
    // Process and use the fetched data here
  })
  .catch((error) => {
    console.error("Error:", error);
    // Handle the error here
  });

fetchData();

function fullYear() {
  return new Date().getFullYear();
}
document.querySelector(".footer_year").innerHTML = fullYear();
