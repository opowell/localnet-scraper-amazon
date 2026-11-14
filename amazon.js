// A product's address on this store, as its ASIN names it: /dp/<ASIN>, without the name and tracking around it.
function amazonProduct(asin) {
  return `${location.origin}/dp/${asin}`
}

// A count or rating as the page shows it ("(17,398)", "4.3 out of 5 stars") as a number, null if it shows none.
function amazonNumber(text) {
  const match = /\d[\d,.]*/.exec(text || '')
  return match ? Number(match[0].replace(/,/g, '')) : null
}

// A product's page (/dp/B0BS1QCFHX, /gp/product/…, with or without its name before it, on amazon.com or a country's
// store) reads as its title, its main picture, the points the page lists about it, its description and the rows of its
// details tables ("Model Name: WH-CH720N"). Its details are its brand (its byline, else its details' Brand row),
// price, rating, how many ratings it
// has and its category (the last of its breadcrumbs). It links with weight 1 to its brand's page and with weight 0.5 to
// each product the page shows beside it, each as /dp/<ASIN>. A search (/s?k=…) is a listing of the products it finds,
// leaving out sponsored ones. Amazon's captcha says the scrape was blocked.
function parseAmazon(_profileId) {
  if (!/^www\.amazon\.[a-z.]+$/.test(location.hostname)) {
    return null
  }
  if (document.querySelector('form[action*="validateCaptcha"]')) {
    return { content: [], blocked: 'Amazon\'s captcha' }
  }
  if (location.pathname === '/s') {
    const results = Array.from(document.querySelectorAll('[data-component-type="s-search-result"][data-asin]'))
      .filter(result => result.dataset.asin && !result.querySelector('.puis-sponsored-label-text') && !result.classList.contains('AdHolder'))
    return listingOf(results.map(result => amazonProduct(result.dataset.asin))) ?? { listing: true }
  }
  const asin = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/.exec(location.pathname)?.[1]
  const title = document.querySelector('#productTitle')?.innerText.trim()
  if (!asin || !title) {
    return null
  }
  const text = element => element?.innerText.replace(/\s+/g, ' ').trim() || ''
  const image = document.querySelector('#landingImage, #imgTagWrapperId img')
  const picture = image?.getAttribute('data-old-hires') || image?.getAttribute('src')
  const description = document.querySelector('#productDescription')
  const rows = Array.from(document.querySelectorAll('#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr, #productOverview_feature_div tr'), (row) => {
    const [label, value] = Array.from(row.querySelectorAll('th, td'), text)
    return label && value ? `${label}: ${value}` : ''
  })
  const content = [
    ...(picture ? [`![](${new URL(picture, location.href).href})`] : []),
    ...Array.from(document.querySelectorAll('#feature-bullets li'), text),
    ...(description ? textBlocks(description, { lists: true }) : []),
    ...rows,
  ].filter(Boolean)
  const brand = document.querySelector('a#bylineInfo')
  const crumbs = Array.from(document.querySelectorAll('#wayfinding-breadcrumbs_feature_div li a'), text).filter(Boolean)
  const related = new Set()
  for (const a of document.querySelectorAll('[data-a-carousel-options] a[href*="/dp/"]')) {
    const other = /\/dp\/([A-Z0-9]{10})/.exec(a.getAttribute('href'))?.[1]
    if (other && other !== asin) {
      related.add(amazonProduct(other))
    }
  }
  return {
    title,
    content: [...new Set(content)],
    links: [
      ...(brand?.href ? [{ url: brand.href.split('?')[0], title: text(brand), score: 1 }] : []),
      ...Array.from(related, url => ({ url, score: 0.5 })),
    ],
    details: [
      ['brand', text(brand) || rows.find(row => row.startsWith('Brand: '))?.slice(7)],
      ['price', text(document.querySelector('#corePrice_feature_div .a-price .a-offscreen, #corePriceDisplay_desktop_feature_div .a-price .a-offscreen'))],
      ['rating', amazonNumber(document.querySelector('#acrPopover')?.getAttribute('title'))],
      ['ratings', amazonNumber(text(document.querySelector('#acrCustomerReviewText')))],
      ['category', crumbs.at(-1)],
    ],
  }
}

// The parser a scrape calls.
registerParser(parseAmazon)
