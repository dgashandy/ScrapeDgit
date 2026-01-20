import * as cheerio from "cheerio";
import { BaseScraper } from "./base";
import { ScrapedProduct, ScraperConfig } from "@/lib/types";

const TOKOPEDIA_CONFIG: ScraperConfig = {
    baseUrl: "https://www.tokopedia.com",
    searchPath: "/search?q={keyword}",
    selectors: {
        productContainer: '[data-testid="master-product-card"]',
        name: '[data-testid="linkProductName"], .css-1bjwylw',
        price: '[data-testid="linkProductPrice"], .css-o5uqvq',
        rating: '[data-testid="imgRating"]',
        soldCount: '.css-1agvdxw, [data-testid="lblProductSold"]',
        location: '.css-1kdc32b, [data-testid="lblProductLocation"]',
        image: 'img[data-testid="imgProduct"], .css-1q90pod img',
        link: 'a[data-testid="lnkProductContainer"], a.css-89jnbj',
    },
};

export class TokopediaScraper extends BaseScraper {
    constructor() {
        super("tokopedia", TOKOPEDIA_CONFIG);
    }


    parseProductCard(element: any, $: cheerio.CheerioAPI): ScrapedProduct | null {
        try {
            const $el = $(element);

            // Get name
            const name = $el.find(this.config.selectors.name).text().trim();

            // Get price
            const priceText = $el.find(this.config.selectors.price).text().trim();
            const price = this.parsePrice(priceText);

            // Get rating
            const ratingEl = $el.find(this.config.selectors.rating);
            const ratingText = ratingEl.attr("alt") || ratingEl.text() || "0";
            const rating = this.parseRating(ratingText);

            // Get sold count
            const soldText = $el.find(this.config.selectors.soldCount).text().trim();
            const soldCount = this.parseSoldCount(soldText);

            // Get location
            const sellerLocation = $el.find(this.config.selectors.location).text().trim() || "Indonesia";

            // Get image
            const imageEl = $el.find(this.config.selectors.image);
            const imageUrl = imageEl.attr("src") || imageEl.attr("data-src") || null;

            // Get product link
            const linkEl = $el.find(this.config.selectors.link);
            let productLink = linkEl.attr("href") || "";
            if (productLink && !productLink.startsWith("http")) {
                productLink = `${this.config.baseUrl}${productLink}`;
            }

            if (!name || !price) {
                return null;
            }

            return {
                name,
                price,
                rating,
                soldCount,
                sellerLocation,
                imageUrl,
                source: "tokopedia",
                productLink,
            };
        } catch (error) {
            console.error("Error parsing Tokopedia product:", error);
            return null;
        }
    }
}

export default TokopediaScraper;
