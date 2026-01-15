# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cointrace is a static cryptocurrency price tracker website. No build system, no frameworks - just vanilla HTML, CSS, and JavaScript.

**Live site:** https://cointrace.co

## Development

Since this is a static site with no build process:
- Open `index.html` directly in a browser, or
- Use any local server (e.g., `python3 -m http.server 8000`)

No npm, no dependencies, no compilation required.

## Architecture

```
js/habibi.js    - All application logic (API calls, DOM manipulation, formatting)
style/main.css  - Styling with responsive grid (5/2/1 columns by viewport)
index.html      - Entry point with Google Analytics integration
```

### Data Flow

1. `fetchData()` calls CoinCap API v2 (`https://api.coincap.io/v2/assets`)
2. `loadCoins()` iterates through response data
3. `addCurrency()` creates a card element for each cryptocurrency
4. Cards display rank, symbol, name, price, and 24h change on hover

### Key Functions in habibi.js

- `fetchData()` - Async API call with error handling
- `addCurrency(name, symbol, price, rank, change)` - Creates DOM card element
- `addCommas(num)` - Formats numbers with thousand separators
- `loadCoins(arr)` - Renders all cryptocurrency cards

## External Services

- **CoinCap API v2** - Cryptocurrency data (no API key required for basic usage)
- **Google Analytics** - Site analytics (configured in index.html)
