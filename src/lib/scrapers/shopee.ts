import * as cheerio from "cheerio";
import { BaseScraper } from "./base";
import { ScrapedProduct, ScraperConfig } from "@/lib/types";

const SHOPEE_CONFIG: ScraperConfig = {
    baseUrl: "https://shopee.co.id",
    searchPath: "/search?keyword={keyword}",
    selectors: {
        productContainer: ".shopee-search-item-result__item, .col-xs-2-4",
        name: ".Cve6sh, .ie3A\\+n, [data-sqe='name']",
        price: ".ZEgDH9, .vioxXd, [data-sqe='price']",
        rating: ".shopee-rating-stars__stars, ._1mYa1t",
        soldCount: ".r6HknA, .OwmBnn, [data-sqe='sold']",
        location: ".zGGwiV, .nh2mAW, [data-sqe='location']",
        image: ".vc8g9F img, ._2GwZ_l img, [data-sqe='image'] img",
        link: "a.contents, a[data-sqe='link']",
    },
};

export class ShopeeScraper extends BaseScraper {
    constructor() {
        super("shopee", SHOPEE_CONFIG);
    }


    parseProductCard(element: any, $: cheerio.CheerioAPI): ScrapedProduct | null {
        try {
            const $el = $(element);

            // Get name
            const name = $el.find(this.config.selectors.name).text().trim();

            // Get price - Shopee shows prices in different formats
            const priceText = $el.find(this.config.selectors.price).text().trim();
            const price = this.parsePrice(priceText);

            // Get rating from star elements
            const ratingStars = $el.find(this.config.selectors.rating);
            const rating = ratingStars.length > 0 ? this.calculateShopeeRating(ratingStars, $) : 0;

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
                source: "shopee",
                productLink,
            };
        } catch (error) {
            console.error("Error parsing Shopee product:", error);
            return null;
        }
    }

    private calculateShopeeRating(starsEl: any, $: cheerio.CheerioAPI): number {
        // Shopee uses filled stars to indicate rating
        const filledStars = starsEl.find(".shopee-rating-stars__star--full").length;
        const halfStars = starsEl.find(".shopee-rating-stars__star--half").length;
        return filledStars + halfStars * 0.5;
    }
}

export default ShopeeScraper;
