import * as cheerio from "cheerio";
import { BaseScraper } from "./base";
import { ScrapedProduct, ScraperConfig } from "@/lib/types";

const LAZADA_CONFIG: ScraperConfig = {
    baseUrl: "https://www.lazada.co.id",
    searchPath: "/catalog/?q={keyword}",
    selectors: {
        productContainer: "[data-qa-locator='product-item'], .Bm3ON, .c2prKC",
        name: ".RfADt a, .c16H9d, [data-qa-locator='product-title']",
        price: ".ooOxS, .c13VH6, [data-qa-locator='product-price']",
        rating: ".Dy1nx, .c16H9d .rating",
        soldCount: ".ooOxS span:last-child, .c16H9d .sold",
        location: ".oa6ri, .c16H9d .location",
        image: ".jBwCF img, .c13VH6 img, [data-qa-locator='product-image'] img",
        link: ".RfADt a, a[data-qa-locator='product-item']",
    },
};

export class LazadaScraper extends BaseScraper {
    constructor() {
        super("lazada", LAZADA_CONFIG);
    }


    parseProductCard(element: any, $: cheerio.CheerioAPI): ScrapedProduct | null {
        try {
            const $el = $(element);

            // Get name
            const nameEl = $el.find(this.config.selectors.name);
            const name = nameEl.text().trim() || nameEl.attr("title") || "";

            // Get price
            const priceText = $el.find(this.config.selectors.price).first().text().trim();
            const price = this.parsePrice(priceText);

            // Get rating
            const ratingText = $el.find(this.config.selectors.rating).text().trim();
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
            let productLink = nameEl.attr("href") || $el.find(this.config.selectors.link).attr("href") || "";
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
                source: "lazada",
                productLink,
            };
        } catch (error) {
            console.error("Error parsing Lazada product:", error);
            return null;
        }
    }
}

export default LazadaScraper;
