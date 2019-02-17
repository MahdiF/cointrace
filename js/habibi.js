var currencyInfo;

// Add commas to long numbers
function addCommas(num) {
    return parseFloat(num, "10").toLocaleString();
}


// Hide loading animation
function hideLoading() {
    var loadingIcon = document.querySelector('.loading_icon');
    loadingIcon.style.display = "none";
}



// Add currency block
function addCurrency(rank, symbol, currencyName, price, changeInPrice, marketCap, volume24h, circulatingSupply) {
    // Creating all HTML elements
    var mainContainerDiv = document.querySelector('.main_container');

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
    currencyPlaceholderDiv.setAttribute('class', 'currency_placeholder');
    currencyContainerDiv.setAttribute('class', 'currency_container');
    currencyContainerDiv.setAttribute('data-currency-rank', '#' + rank);
    currencyNameDiv.setAttribute('class', 'currency_name');
    currencyNameDiv.setAttribute('data-coin-symbol', symbol);
    priceDiv.setAttribute('class', 'currecny_price');
    if (changeInPrice <= 0) {
        changeInPriceDiv.setAttribute('class', 'currency_change_in_price down_change');
    } else {
        changeInPriceDiv.setAttribute('class', 'currency_change_in_price up_change');
    }
    currencyDetailsListUl.setAttribute('class', 'currency_details_list');
    marketCapLi.setAttribute('data-title', 'Market Cap');
    volume24hLi.setAttribute('data-title', 'Volume (24h)');
    circulatingSupplyLi.setAttribute('data-title', 'Circulating Supply');


    // Adding Values from the API
    currencyNameDiv.innerHTML = currencyName;
    priceDiv.innerHTML = "$" + addCommas(price);
    changeInPriceDiv.innerHTML = changeInPrice + "%";
    marketCapLi.innerHTML = addCommas(marketCap);
    volume24hLi.innerHTML = addCommas(volume24h);
    circulatingSupplyLi.innerHTML = addCommas(circulatingSupply);



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
            currencyInfo[i].cmc_rank,
            currencyInfo[i].symbol,
            currencyInfo[i].name,
            currencyInfo[i].quote['USD'].price,
            currencyInfo[i].quote['USD'].percent_change_24h,
            currencyInfo[i].quote['USD'].market_cap,
            currencyInfo[i].quote['USD'].volume_24h,
            currencyInfo[i].circulating_supply
        );
    }
}

fetch('https://wt-a8bd1eeac04b708701f10580366ae4ac-0.sandbox.auth0-extend.com/coinmarketcap-api')
  .then(response = (res) => {
    return res.json()
  })
  .then(data = (response) => {
    currencyInfo = response.data;
    console.log(response.data);
    loadCoins();
    hideLoading();
  })
  .catch(error = () => {
    console.log("The server doesn't love us! 💔");
  });