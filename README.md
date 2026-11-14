# Amazon scraper for Localnet

Reads `www.amazon.` pages for Localnet, a browser extension that is a personal search engine.
Localnet pulls it from here the first time it scrapes such a page, through the
[localnet-scrapers](https://github.com/opowell/localnet-scrapers) scraper source.

- `source.json`: what Localnet reads to know the scraper: its name, the URLs it reads, how the site is searched, and the file to run.
- `amazon.js`: the parser. It is injected into the scraped page after Localnet's DOM helpers (content-scripts/utils/dom.js) and defines `window.__dynamicParser`.
- `amazon.test.ts`: its unit tests, run from a Localnet checkout (`pnpm parsers pull`, then `pnpm test parsers/localnet-scraper-amazon`).
- `saved-pages/` (not in git): real pages saved from the site, which Localnet's `e2e/saved-pages.test.ts` scrapes. See Localnet's README.

## What it reads

The **Amazon** scraper (`content-scripts/parsers/amazon.js`, URL pattern `www.amazon.`, amazon.com or a country's store) reads a product's page (`/dp/B0BS1QCFHX` or `/gp/product/…`, with or without its name before it) as its title (`#productTitle`), its main picture at full size (`#landingImage`'s `data-old-hires`), each point the page lists about it (`#feature-bullets`), its description and each row of its details tables (`"Model Name: WH-CH720N"`). Its details are its brand (its byline, `a#bylineInfo`, else its details' Brand row), price, rating (`4.3` from `"4.3 out of 5 stars"`), how many ratings it has and its category (the last of its breadcrumbs). It links with weight 1 to its brand's page and with weight 0.5 to each product shown beside it, each as `/dp/<ASIN>` without the name and tracking around it. A search (`/s?k=…`, its `searchUrl` on amazon.com) is a listing of the products it finds, as `/dp/<ASIN>`, leaving out sponsored ones; a page that is Amazon's captcha says the scrape was `blocked`.
