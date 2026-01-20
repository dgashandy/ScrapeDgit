import puppeteer, { Browser, Page } from "puppeteer";
import * as cheerio from "cheerio";
import { ScrapedProduct, ScraperConfig, EcommerceSource } from "@/lib/types";
import { getCache, setCache, searchCacheKey } from "@/lib/redis/cache";
import { checkScraperRateLimit } from "@/lib/redis/rateLimit";

const CACHE_TTL = 3600; // 1 hour
const REQUEST_DELAY = 2000; // 2 seconds between requests

export abstract class BaseScraper {
    protected source: EcommerceSource;
    protected config: ScraperConfig;
    protected browser: Browser | null = null;

    constructor(source: EcommerceSource, config: ScraperConfig) {
        this.source = source;
        this.config = config;
    }

    // Abstract method to be implemented by each platform scraper

    abstract parseProductCard(element: any, $: cheerio.CheerioAPI): ScrapedProduct | null;

    async initBrowser(): Promise<Browser> {
        if (this.browser) return this.browser;

        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--disable-gpu",
                "--window-size=1920,1080",
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        });

        return this.browser;
    }

    async closeBrowser(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async search(keyword: string, maxProducts: number = 20): Promise<ScrapedProduct[]> {
        // Check rate limit
        const rateLimit = await checkScraperRateLimit(this.source);
        if (!rateLimit.allowed) {
            console.log(`Rate limited for ${this.source}, waiting ${rateLimit.resetIn}s`);
            await this.delay(rateLimit.resetIn * 1000);
        }

        // Check cache first
        const cacheKey = searchCacheKey(keyword, this.source);
        const cached = await getCache<ScrapedProduct[]>(cacheKey);
        if (cached) {
            console.log(`Cache hit for ${this.source}: ${keyword}`);
            return cached.slice(0, maxProducts);
        }

        try {
            const products = await this.scrape(keyword, maxProducts);

            // Cache results
            if (products.length > 0) {
                await setCache(cacheKey, products, CACHE_TTL);
            }

            return products;
        } catch (error) {
            console.error(`Scraping error for ${this.source}:`, error);
            return [];
        }
    }

    protected async scrape(keyword: string, maxProducts: number): Promise<ScrapedProduct[]> {
        const browser = await this.initBrowser();
        const page = await browser.newPage();

        try {
            // Set user agent
            await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
            );

            // Set viewport
            await page.setViewport({ width: 1920, height: 1080 });

            const searchUrl = this.buildSearchUrl(keyword);
            console.log(`Scraping ${this.source}: ${searchUrl}`);

            await page.goto(searchUrl, {
                waitUntil: "networkidle2",
                timeout: 30000,
            });

            // Wait for products to load
            await this.waitForProducts(page);

            // Get page content
            const html = await page.content();
            const $ = cheerio.load(html);

            // Parse products
            const products: ScrapedProduct[] = [];
            const productElements = $(this.config.selectors.productContainer);

            productElements.each((index, element) => {
                if (products.length >= maxProducts) return false;

                const product = this.parseProductCard(element, $);
                if (product && this.isValidProduct(product)) {
                    products.push(product);
                }
            });

            return products;
        } catch (error) {
            console.error(`Error scraping ${this.source}:`, error);
            return [];
        } finally {
            await page.close();
        }
    }

    protected buildSearchUrl(keyword: string): string {
        const encodedKeyword = encodeURIComponent(keyword);
        return `${this.config.baseUrl}${this.config.searchPath.replace("{keyword}", encodedKeyword)}`;
    }

    protected async waitForProducts(page: Page): Promise<void> {
        try {
            await page.waitForSelector(this.config.selectors.productContainer, {
                timeout: 10000,
            });
        } catch {
            console.log(`No products found for ${this.source}`);
        }
    }

    protected isValidProduct(product: ScrapedProduct): boolean {
        return (
            product.name.length > 0 &&
            product.price > 0 &&
            product.productLink.length > 0
        );
    }

    protected parsePrice(priceText: string): number {
        // Remove "Rp", dots, spaces and convert to number
        const cleaned = priceText
            .replace(/[Rp\s.]/gi, "")
            .replace(/,/g, "")
            .trim();
        return parseInt(cleaned) || 0;
    }

    protected parseRating(ratingText: string): number {
        const match = ratingText.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
    }

    protected parseSoldCount(soldText: string): number {
        // Handle formats like "1rb+ terjual", "500 terjual", "1.2k sold"
        const cleaned = soldText.toLowerCase();
        let multiplier = 1;

        if (cleaned.includes("rb") || cleaned.includes("k")) {
            multiplier = 1000;
        } else if (cleaned.includes("jt") || cleaned.includes("m")) {
            multiplier = 1000000;
        }

        const match = cleaned.match(/[\d.]+/);
        if (match) {
            return Math.floor(parseFloat(match[0]) * multiplier);
        }

        return 0;
    }

    protected delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
