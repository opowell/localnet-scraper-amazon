import { afterEach, describe, expect, it } from 'vitest'
import { parserLoader, resetPage, visit } from '#scraper-test'

// The parser, evaluated with the helpers it is injected with, as a scrape runs it.
const load = parserLoader(__dirname)

afterEach(resetPage)

describe('amazon', () => {
  const { parseAmazon } = load('amazon.js', ['parseAmazon'])

  it('reads a product as its picture, points, description and details, linking to its brand and the products beside it', () => {
    visit('https://www.amazon.com/Sony-WH-CH720N/dp/B0BS1QCFHX?th=1', `<span id="productTitle"> Sony WH-CH720N </span>
      <img id="landingImage" data-old-hires="https://m.media-amazon.com/images/I/51r.jpg" src="https://m.media-amazon.com/images/I/51r-small.jpg">
      <div id="feature-bullets"><ul><li>LIGHT: 192g.</li></ul></div><div id="productDescription"><p>Turn down the noise.</p></div>
      <table id="productOverview_feature_div"><tr><td>Brand</td><td>Sony</td></tr></table>
      <div id="corePrice_feature_div"><span class="a-price"><span class="a-offscreen">$98.00</span></span></div>
      <span id="acrPopover" title="4.3 out of 5 stars"></span><span id="acrCustomerReviewText">(17,398)</span>
      <div id="wayfinding-breadcrumbs_feature_div"><ul><li><a>Electronics</a></li><li><a>Headphones</a></li></ul></div>
      <div data-a-carousel-options="{}"><a href="/Other/dp/B0C36VZBY5/ref=x">Other</a><a href="/dp/B0BS1QCFHX">Itself</a></div>`)
    expect(parseAmazon()).toEqual({
      title: 'Sony WH-CH720N',
      content: ['![](https://m.media-amazon.com/images/I/51r.jpg)', 'LIGHT: 192g.', 'Turn down the noise.', 'Brand: Sony'],
      links: [{ url: 'https://www.amazon.com/dp/B0C36VZBY5', score: 0.5 }],
      details: [['brand', 'Sony'], ['price', '$98.00'], ['rating', 4.3], ['ratings', 17398], ['category', 'Headphones']],
    })
  })

  it('reads a search as a listing of its products, leaving out sponsored ones', () => {
    visit('https://www.amazon.de/s?k=headphones', `<div data-component-type="s-search-result" data-asin="B0BS1QCFHX"></div>
      <div data-component-type="s-search-result" data-asin="B0AD"><span class="puis-sponsored-label-text">Sponsored</span></div>`)
    expect(parseAmazon()).toEqual({ listing: true, links: [{ url: 'https://www.amazon.de/dp/B0BS1QCFHX', score: 1 }] })
  })

  it('says it was blocked by Amazon\'s captcha', () => {
    visit('https://www.amazon.com/dp/B0BS1QCFHX', '<form action="/errors/validateCaptcha"></form>')
    expect(parseAmazon().blocked).toBe('Amazon\'s captcha')
  })
})
