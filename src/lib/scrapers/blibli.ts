import * as cheerio from "cheerio";
import { BaseScraper } from "./base";
import { ScrapedProduct, ScraperConfig } from "@/lib/types";

const BLIBLI_CONFIG: ScraperConfig = {
    baseUrl: "https://www.blibli.com",
    searchPath: "/cari/{keyword}",
    selectors: {
        productContainer: ".product__card, [data-testid='product-card']",
        name: ".product__name, .blu-product__name, [data-testid='product-name']",
        price: ".product__price, .blu-product__price, [data-testid='product-price']",
        rating: ".product__rating, .blu-product__rating",
        soldCount: ".product__sold, .blu-product__sold",
        location: ".product__location, .blu-product__location",
        image: ".product__image img, .blu-product__image img",
        link: ".product__link, a.blu-product__link",
    },
};

export class BlibliScraper extends BaseScraper {
    constructor() {
        super("blibli", BLIBLI_CONFIG);
    }

    protected buildSearchUrl(keyword: string): string {
        // Blibli uses different URL format
        const encodedKeyword = encodeURIComponent(keyword).replace(/%20/g, "-");
        return `${this.config.baseUrl}/cari/${encodedKeyword}`;
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
                source: "blibli",
                productLink,
            };
        } catch (error) {
            console.error("Error parsing Blibli product:", error);
            return null;
        }
    }
}

export default BlibliScraper;
