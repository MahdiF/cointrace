// === CONFIGURATION ===
const API_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1";
const REFRESH_INTERVAL = 60000; // 60 seconds

// === STATE ===
var currencyInfo = [];
var favorites = [];
var currentFilter = 'all';
var searchQuery = '';
var isInitialLoad = true;
var refreshTimer = null;
var lastUpdateTime = null;
var updateTextInterval = null;


// === UTILITY FUNCTIONS ===

function addCommas(num) {
    return parseFloat(num).toLocaleString();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


// === DARK MODE ===

function initDarkMode() {
    var savedTheme = localStorage.getItem('cointrace-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(theme);

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('cointrace-theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cointrace-theme', theme);

    // Update meta theme-color for mobile browsers
    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute('content', theme === 'dark' ? '#1a1a2e' : '#ffffff');
    }
}

function toggleDarkMode() {
    var currentTheme = document.documentElement.getAttribute('data-theme');
    var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}


// === FAVORITES ===

function loadFavorites() {
    try {
        var saved = localStorage.getItem('cointrace-favorites');
        favorites = saved ? JSON.parse(saved) : [];
    } catch (e) {
        favorites = [];
    }
    updateFavoritesCount();
}

function saveFavorites() {
    try {
        localStorage.setItem('cointrace-favorites', JSON.stringify(favorites));
    } catch (e) {
        console.error('Could not save favorites:', e);
    }
    updateFavoritesCount();
}

function toggleFavorite(coinId, buttonElement) {
    var index = favorites.indexOf(coinId);

    if (index === -1) {
        favorites.push(coinId);
        buttonElement.classList.add('is_favorite', 'just_favorited');
        setTimeout(function() {
            buttonElement.classList.remove('just_favorited');
        }, 300);
    } else {
        favorites.splice(index, 1);
        buttonElement.classList.remove('is_favorite');
    }

    saveFavorites();

    if (currentFilter === 'favorites') {
        filterCoins();
    }
}

function isFavorite(coinId) {
    return favorites.indexOf(coinId) !== -1;
}

function updateFavoritesCount() {
    var countEl = document.querySelector('.favorites_count');
    if (countEl) {
        countEl.textContent = favorites.length > 0 ? favorites.length : '';
    }
}


// === SEARCH & FILTER ===

function filterCoins() {
    var cards = document.querySelectorAll('.currency_placeholder');
    var visibleCount = 0;

    cards.forEach(function(card) {
        var coinName = (card.getAttribute('data-coin-name') || '').toLowerCase();
        var coinSymbol = (card.getAttribute('data-coin-symbol') || '').toLowerCase();
        var coinId = card.getAttribute('data-coin-id');

        var matchesSearch = searchQuery === '' ||
            coinName.indexOf(searchQuery.toLowerCase()) !== -1 ||
            coinSymbol.indexOf(searchQuery.toLowerCase()) !== -1;

        var matchesFavorites = currentFilter === 'all' || isFavorite(coinId);

        if (matchesSearch && matchesFavorites) {
            card.classList.remove('hidden');
            visibleCount++;
        } else {
            card.classList.add('hidden');
        }
    });

    updateNoResultsMessage(visibleCount);
}

function updateNoResultsMessage(visibleCount) {
    var noResultsEl = document.querySelector('.no_results');
    var mainContainer = document.querySelector('.main_container');

    if (visibleCount === 0) {
        if (!noResultsEl) {
            noResultsEl = document.createElement('div');
            noResultsEl.className = 'no_results';

            var message = currentFilter === 'favorites' && favorites.length === 0
                ? '★ No favorites yet. Click the star on any coin to add it.'
                : '🔍 No coins found';

            noResultsEl.innerHTML = '<p>' + message + '</p>';
            mainContainer.appendChild(noResultsEl);
        } else {
            noResultsEl.style.display = 'block';
        }
    } else if (noResultsEl) {
        noResultsEl.style.display = 'none';
    }
}

var debouncedFilter = debounce(filterCoins, 200);


// === AUTO-REFRESH ===

function startAutoRefresh() {
    lastUpdateTime = Date.now();
    updateLastUpdatedText();

    // Start the countdown indicator
    var indicator = document.getElementById('refresh-indicator');
    if (indicator) {
        indicator.classList.add('counting');
    }

    updateTextInterval = setInterval(updateLastUpdatedText, 1000);
    refreshTimer = setInterval(refreshData, REFRESH_INTERVAL);
}

function resetRefreshIndicator() {
    var indicator = document.getElementById('refresh-indicator');
    if (indicator) {
        indicator.classList.remove('counting', 'refreshing');
        // Force reflow to restart animation
        void indicator.offsetWidth;
        indicator.classList.add('counting');
    }
}

function updateLastUpdatedText() {
    var textEl = document.getElementById('last-updated-text');
    if (!textEl || !lastUpdateTime) return;

    var secondsAgo = Math.floor((Date.now() - lastUpdateTime) / 1000);

    if (secondsAgo < 5) {
        textEl.textContent = 'Updated just now';
    } else if (secondsAgo < 60) {
        textEl.textContent = 'Updated ' + secondsAgo + 's ago';
    } else {
        var minutes = Math.floor(secondsAgo / 60);
        textEl.textContent = 'Updated ' + minutes + 'm ago';
    }
}

async function refreshData() {
    var indicator = document.getElementById('refresh-indicator');

    try {
        if (indicator) {
            indicator.classList.remove('counting');
            indicator.classList.add('refreshing');
        }

        var response = await fetch(API_URL);
        if (!response.ok) throw new Error('HTTP error! Status: ' + response.status);

        var data = await response.json();
        currencyInfo = data;

        updateExistingCards(data);

        lastUpdateTime = Date.now();
        updateLastUpdatedText();
        resetRefreshIndicator();

    } catch (error) {
        console.error('Error refreshing data:', error);
        resetRefreshIndicator();
    }
}

function updateExistingCards(data) {
    data.forEach(function(coin) {
        var card = document.querySelector('[data-coin-id="' + coin.id + '"]');
        if (!card) return;

        var priceEl = card.querySelector('.currecny_price');
        var changeEl = card.querySelector('.currency_change_in_price');
        var marketCapLi = card.querySelector('[data-title="Market Cap"]');
        var volumeLi = card.querySelector('[data-title="Volume (24h)"]');
        var supplyLi = card.querySelector('[data-title="Circulating Supply"]');

        var oldPrice = priceEl.textContent;
        var newPrice = '$' + addCommas(coin.current_price);

        if (oldPrice !== newPrice) {
            priceEl.textContent = newPrice;
            priceEl.classList.add('price_updated');
            setTimeout(function() {
                priceEl.classList.remove('price_updated');
            }, 500);
        }

        var change = coin.price_change_percentage_24h || 0;
        changeEl.textContent = parseFloat(change).toFixed(2) + '%';
        changeEl.className = 'currency_change_in_price ' + (change <= 0 ? 'down_change' : 'up_change');

        if (marketCapLi) marketCapLi.textContent = addCommas(coin.market_cap);
        if (volumeLi) volumeLi.textContent = addCommas(coin.total_volume);
        if (supplyLi) {
            supplyLi.textContent = coin.circulating_supply ? addCommas(coin.circulating_supply) : '--';
        }
    });
}


// === ANIMATED NUMBERS ===

function animateNumber(element, targetValue, duration, isPrice) {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (isPrice) {
            element.textContent = '$' + addCommas(targetValue);
        } else {
            element.textContent = parseFloat(targetValue).toFixed(2) + '%';
        }
        return;
    }

    var startValue = 0;
    var startTime = performance.now();

    element.classList.add('counting');

    function update(currentTime) {
        var elapsed = currentTime - startTime;
        var progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic
        var easeProgress = 1 - Math.pow(1 - progress, 3);

        var currentValue = startValue + (targetValue - startValue) * easeProgress;

        if (isPrice) {
            element.textContent = '$' + addCommas(currentValue.toFixed(2));
        } else {
            element.textContent = parseFloat(currentValue).toFixed(2) + '%';
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            if (isPrice) {
                element.textContent = '$' + addCommas(targetValue);
            } else {
                element.textContent = parseFloat(targetValue).toFixed(2) + '%';
            }
            element.classList.remove('counting');
        }
    }

    requestAnimationFrame(update);
}

function animateCardNumbers(card, price, change) {
    var priceEl = card.querySelector('.currecny_price');
    var changeEl = card.querySelector('.currency_change_in_price');

    var delay = Math.random() * 200;

    setTimeout(function() {
        animateNumber(priceEl, parseFloat(price), 800, true);
    }, delay);

    setTimeout(function() {
        animateNumber(changeEl, parseFloat(change || 0), 600, false);
    }, delay + 100);
}


// === LOADING ===

function hideLoading() {
    var loadingIcon = document.querySelector(".loading_icon");
    if (loadingIcon) {
        loadingIcon.style.display = "none";
    }
}


// === CORE RENDERING ===

function addCurrency(rank, symbol, currencyName, price, changeInPrice, marketCap, volume24h, circulatingSupply, coinId) {
    var mainContainerDiv = document.querySelector(".main_container");

    var currencyPlaceholderDiv = document.createElement("div");
    var currencyContainerDiv = document.createElement("div");

    var favoriteBtn = document.createElement("button");
    var currencyNameDiv = document.createElement("div");
    var priceDiv = document.createElement("div");
    var changeInPriceDiv = document.createElement("div");

    var currencyDetailsListUl = document.createElement("ul");
    var marketCapLi = document.createElement("li");
    var volume24hLi = document.createElement("li");
    var circulatingSupplyLi = document.createElement("li");

    // Setting Attribute Values
    currencyPlaceholderDiv.setAttribute("class", "currency_placeholder");
    currencyPlaceholderDiv.setAttribute("data-coin-id", coinId);
    currencyPlaceholderDiv.setAttribute("data-coin-name", currencyName.toLowerCase());
    currencyPlaceholderDiv.setAttribute("data-coin-symbol", symbol.toLowerCase());

    currencyContainerDiv.setAttribute("class", "currency_container");
    currencyContainerDiv.setAttribute("data-currency-rank", "#" + rank);

    // Favorite button
    favoriteBtn.setAttribute("class", "favorite_btn" + (isFavorite(coinId) ? " is_favorite" : ""));
    favoriteBtn.setAttribute("aria-label", "Toggle favorite");
    favoriteBtn.setAttribute("title", "Add to favorites");
    favoriteBtn.textContent = isFavorite(coinId) ? "★" : "☆";
    favoriteBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        toggleFavorite(coinId, favoriteBtn);
        favoriteBtn.textContent = isFavorite(coinId) ? "★" : "☆";
    });

    currencyNameDiv.setAttribute("class", "currency_name");
    currencyNameDiv.setAttribute("data-coin-symbol", symbol);
    priceDiv.setAttribute("class", "currecny_price");

    if (changeInPrice <= 0) {
        changeInPriceDiv.setAttribute("class", "currency_change_in_price down_change");
    } else {
        changeInPriceDiv.setAttribute("class", "currency_change_in_price up_change");
    }

    currencyDetailsListUl.setAttribute("class", "currency_details_list");
    marketCapLi.setAttribute("data-title", "Market Cap");
    volume24hLi.setAttribute("data-title", "Volume (24h)");
    circulatingSupplyLi.setAttribute("data-title", "Circulating Supply");

    // Adding Values
    currencyNameDiv.innerHTML = currencyName;

    if (isInitialLoad) {
        priceDiv.innerHTML = "$0";
        changeInPriceDiv.innerHTML = "0.00%";
    } else {
        priceDiv.innerHTML = "$" + addCommas(price);
        changeInPriceDiv.innerHTML = parseFloat(changeInPrice || 0).toFixed(2) + "%";
    }

    marketCapLi.innerHTML = addCommas(marketCap);
    volume24hLi.innerHTML = addCommas(volume24h);
    circulatingSupplyLi.innerHTML = circulatingSupply == null ? "--" : addCommas(circulatingSupply);

    // Building the DOM
    currencyDetailsListUl.appendChild(marketCapLi);
    currencyDetailsListUl.appendChild(volume24hLi);
    currencyDetailsListUl.appendChild(circulatingSupplyLi);

    currencyContainerDiv.appendChild(favoriteBtn);
    currencyContainerDiv.appendChild(currencyNameDiv);
    currencyContainerDiv.appendChild(priceDiv);
    currencyContainerDiv.appendChild(changeInPriceDiv);
    currencyContainerDiv.appendChild(currencyDetailsListUl);
    currencyPlaceholderDiv.appendChild(currencyContainerDiv);
    mainContainerDiv.appendChild(currencyPlaceholderDiv);

    return currencyPlaceholderDiv;
}

function loadCoins() {
    var mainContainer = document.querySelector('.main_container');

    for (var i = 0; i < currencyInfo.length; i++) {
        var coin = currencyInfo[i];

        var card = addCurrency(
            coin.market_cap_rank,
            coin.symbol.toUpperCase(),
            coin.name,
            coin.current_price,
            coin.price_change_percentage_24h,
            coin.market_cap,
            coin.total_volume,
            coin.circulating_supply,
            coin.id
        );

        if (isInitialLoad) {
            animateCardNumbers(card, coin.current_price, coin.price_change_percentage_24h);
        }
    }

    isInitialLoad = false;
}


// === DATA FETCHING ===

async function fetchData() {
    try {
        var response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('HTTP error! Status: ' + response.status);
        }

        var data = await response.json();
        currencyInfo = data;

        loadCoins();
        hideLoading();
        startAutoRefresh();

    } catch (error) {
        console.error("Error fetching data:", error);
        hideLoading();

        // Show error message to user
        var mainContainer = document.querySelector('.main_container');
        var errorDiv = document.createElement('div');
        errorDiv.className = 'no_results';
        errorDiv.innerHTML = '<p>⚠️ Could not load cryptocurrency data. Please try refreshing the page.</p>';
        mainContainer.appendChild(errorDiv);
    }
}


// === EVENT LISTENERS ===

function setupEventListeners() {
    // Dark mode toggle
    var darkModeBtn = document.getElementById('dark-mode-toggle');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', toggleDarkMode);
    }

    // Search input
    var searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchQuery = e.target.value.trim();
            debouncedFilter();
        });

        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                searchInput.value = '';
                searchQuery = '';
                filterCoins();
            }
        });
    }

    // Filter buttons
    var showAllBtn = document.getElementById('show-all-btn');
    var showFavoritesBtn = document.getElementById('show-favorites-btn');

    if (showAllBtn) {
        showAllBtn.addEventListener('click', function() {
            currentFilter = 'all';
            showAllBtn.classList.add('active');
            if (showFavoritesBtn) showFavoritesBtn.classList.remove('active');
            filterCoins();
        });
    }

    if (showFavoritesBtn) {
        showFavoritesBtn.addEventListener('click', function() {
            currentFilter = 'favorites';
            showFavoritesBtn.classList.add('active');
            if (showAllBtn) showAllBtn.classList.remove('active');
            filterCoins();
        });
    }

    // Pause refresh when tab is hidden
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            if (refreshTimer) {
                clearInterval(refreshTimer);
                refreshTimer = null;
            }
            if (updateTextInterval) {
                clearInterval(updateTextInterval);
                updateTextInterval = null;
            }
        } else {
            // Resume when tab becomes visible
            if (!refreshTimer) {
                refreshData(); // Refresh immediately
                startAutoRefresh();
            }
        }
    });

    // Keyboard shortcut: / to focus search
    document.addEventListener('keydown', function(e) {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            var searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.focus();
        }
    });
}


// === INITIALIZATION ===

function init() {
    initDarkMode();
    loadFavorites();
    setupEventListeners();
    fetchData();

    // Update footer year
    var footerYear = document.querySelector(".footer_year");
    if (footerYear) {
        footerYear.innerHTML = new Date().getFullYear();
    }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
