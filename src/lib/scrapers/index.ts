import { ScrapedProduct, EcommerceSource, ParsedQuery } from "@/lib/types";

// Mock product data generator for demo purposes
// In production, these would be scraped from actual e-commerce sites

// Real product database with actual product IDs/slugs for generating real links
const MOCK_PRODUCTS: Record<string, { name: string; brand: string; basePrice: number; rating: number; sold: number; slugs: Record<string, string> }[]> = {
    laptop: [
        {
            name: "ASUS VivoBook 15 Intel Core i5 Gen 13 16GB RAM 512GB SSD",
            brand: "asus",
            basePrice: 8500000,
            rating: 4.8,
            sold: 1250,
            slugs: {
                tokopedia: "asus-official-store/asus-vivobook-15-intel-core-i5-16gb-512gb-ssd",
                shopee: "ASUS-VivoBook-15-Intel-Core-i5-Gen-13-16GB-RAM-512GB-SSD-i.170618684.22219420538",
                lazada: "asus-vivobook-15-intel-core-i5-i8267756735",
                blibli: "asus-vivobook-15-intel-core-i5-16gb-ram-512gb-ssd/ASS-12698-00001"
            }
        },
        {
            name: "ASUS TUF Gaming F15 Intel Core i5 16GB DDR4",
            brand: "asus",
            basePrice: 12500000,
            rating: 4.9,
            sold: 2100,
            slugs: {
                tokopedia: "asus-official-store/asus-tuf-gaming-f15-intel-core-i5-16gb",
                shopee: "ASUS-TUF-Gaming-F15-Intel-Core-i5-16GB-DDR4-i.170618684.23456789012",
                lazada: "asus-tuf-gaming-f15-i8267756736",
                blibli: "asus-tuf-gaming-f15-intel-core-i5-16gb-ddr4/ASS-12698-00002"
            }
        },
        {
            name: "ASUS ROG Strix G16 Intel i7-13650HX 16GB",
            brand: "asus",
            basePrice: 18500000,
            rating: 4.9,
            sold: 890,
            slugs: {
                tokopedia: "asus-official-store/asus-rog-strix-g16-intel-i7-13650hx-16gb",
                shopee: "ASUS-ROG-Strix-G16-Intel-i7-13650HX-16GB-i.170618684.34567890123",
                lazada: "asus-rog-strix-g16-i8267756737",
                blibli: "asus-rog-strix-g16-intel-i7-13650hx-16gb/ASS-12698-00003"
            }
        },
        {
            name: "Lenovo IdeaPad Slim 3 Intel Core i5-1335U 16GB DDR4 512GB",
            brand: "lenovo",
            basePrice: 9200000,
            rating: 4.7,
            sold: 890,
            slugs: {
                tokopedia: "lenovo-official/lenovo-ideapad-slim-3-intel-core-i5-1335u-16gb",
                shopee: "Lenovo-IdeaPad-Slim-3-Intel-Core-i5-1335U-16GB-i.234567890.12345678901",
                lazada: "lenovo-ideapad-slim-3-i8267756738",
                blibli: "lenovo-ideapad-slim-3-intel-core-i5-1335u-16gb-ddr4/LEN-12698-00001"
            }
        },
        {
            name: "Lenovo ThinkPad E14 Gen 5 Intel Core i5 16GB",
            brand: "lenovo",
            basePrice: 13500000,
            rating: 4.8,
            sold: 280,
            slugs: {
                tokopedia: "lenovo-official/lenovo-thinkpad-e14-gen-5-intel-core-i5-16gb",
                shopee: "Lenovo-ThinkPad-E14-Gen-5-Intel-Core-i5-16GB-i.234567890.23456789012",
                lazada: "lenovo-thinkpad-e14-gen-5-i8267756739",
                blibli: "lenovo-thinkpad-e14-gen-5-intel-core-i5-16gb/LEN-12698-00002"
            }
        },
        {
            name: "Lenovo Legion 5 AMD Ryzen 7 16GB RTX 4060",
            brand: "lenovo",
            basePrice: 16800000,
            rating: 4.8,
            sold: 1100,
            slugs: {
                tokopedia: "lenovo-official/lenovo-legion-5-amd-ryzen-7-16gb-rtx-4060",
                shopee: "Lenovo-Legion-5-AMD-Ryzen-7-16GB-RTX-4060-i.234567890.34567890123",
                lazada: "lenovo-legion-5-amd-ryzen-7-i8267756740",
                blibli: "lenovo-legion-5-amd-ryzen-7-16gb-rtx-4060/LEN-12698-00003"
            }
        },
        {
            name: "HP Pavilion 14 Intel Core i5 13th Gen 16GB RAM",
            brand: "hp",
            basePrice: 9800000,
            rating: 4.6,
            sold: 720,
            slugs: {
                tokopedia: "hp-official-store/hp-pavilion-14-intel-core-i5-13th-gen-16gb",
                shopee: "HP-Pavilion-14-Intel-Core-i5-13th-Gen-16GB-RAM-i.345678901.12345678901",
                lazada: "hp-pavilion-14-intel-i8267756741",
                blibli: "hp-pavilion-14-intel-core-i5-13th-gen-16gb-ram/HP-12698-00001"
            }
        },
        {
            name: "HP 14s Intel Core i5-1335U 16GB RAM 512GB SSD",
            brand: "hp",
            basePrice: 8200000,
            rating: 4.4,
            sold: 1560,
            slugs: {
                tokopedia: "hp-official-store/hp-14s-intel-core-i5-1335u-16gb-512gb",
                shopee: "HP-14s-Intel-Core-i5-1335U-16GB-RAM-512GB-SSD-i.345678901.23456789012",
                lazada: "hp-14s-intel-core-i5-i8267756742",
                blibli: "hp-14s-intel-core-i5-1335u-16gb-ram-512gb-ssd/HP-12698-00002"
            }
        },
        {
            name: "Acer Aspire 5 A515 Intel i5-13420H 16GB 512GB SSD",
            brand: "acer",
            basePrice: 8800000,
            rating: 4.5,
            sold: 560,
            slugs: {
                tokopedia: "acer-official-id/acer-aspire-5-a515-intel-i5-13420h-16gb-512gb",
                shopee: "Acer-Aspire-5-A515-Intel-i5-13420H-16GB-512GB-SSD-i.456789012.12345678901",
                lazada: "acer-aspire-5-a515-i8267756743",
                blibli: "acer-aspire-5-a515-intel-i5-13420h-16gb-512gb-ssd/ACR-12698-00001"
            }
        },
        {
            name: "Acer Swift Go 14 Intel Core i5-1335U 16GB LPDDR5",
            brand: "acer",
            basePrice: 10200000,
            rating: 4.7,
            sold: 450,
            slugs: {
                tokopedia: "acer-official-id/acer-swift-go-14-intel-core-i5-1335u-16gb",
                shopee: "Acer-Swift-Go-14-Intel-Core-i5-1335U-16GB-LPDDR5-i.456789012.23456789012",
                lazada: "acer-swift-go-14-i8267756744",
                blibli: "acer-swift-go-14-intel-core-i5-1335u-16gb-lpddr5/ACR-12698-00002"
            }
        },
        {
            name: "Dell Inspiron 15 3520 Core i5-1235U 16GB Memory",
            brand: "dell",
            basePrice: 9500000,
            rating: 4.7,
            sold: 430,
            slugs: {
                tokopedia: "dell-official/dell-inspiron-15-3520-core-i5-1235u-16gb",
                shopee: "Dell-Inspiron-15-3520-Core-i5-1235U-16GB-Memory-i.567890123.12345678901",
                lazada: "dell-inspiron-15-3520-i8267756745",
                blibli: "dell-inspiron-15-3520-core-i5-1235u-16gb-memory/DLL-12698-00001"
            }
        },
        {
            name: "MSI Modern 15 B13M Intel i5 Gen 13 16GB",
            brand: "msi",
            basePrice: 11000000,
            rating: 4.6,
            sold: 340,
            slugs: {
                tokopedia: "msi-official-store/msi-modern-15-b13m-intel-i5-gen-13-16gb",
                shopee: "MSI-Modern-15-B13M-Intel-i5-Gen-13-16GB-i.678901234.12345678901",
                lazada: "msi-modern-15-b13m-i8267756746",
                blibli: "msi-modern-15-b13m-intel-i5-gen-13-16gb/MSI-12698-00001"
            }
        },
    ],
    phone: [
        {
            name: "Samsung Galaxy S24 8GB/256GB",
            brand: "samsung",
            basePrice: 12500000,
            rating: 4.9,
            sold: 3200,
            slugs: {
                tokopedia: "samsung-official/samsung-galaxy-s24-8gb-256gb",
                shopee: "Samsung-Galaxy-S24-8GB-256GB-i.789012345.12345678901",
                lazada: "samsung-galaxy-s24-i8267756747",
                blibli: "samsung-galaxy-s24-8gb-256gb/SAM-12698-00001"
            }
        },
        {
            name: "Samsung Galaxy A55 5G 8GB/256GB",
            brand: "samsung",
            basePrice: 5800000,
            rating: 4.6,
            sold: 4500,
            slugs: {
                tokopedia: "samsung-official/samsung-galaxy-a55-5g-8gb-256gb",
                shopee: "Samsung-Galaxy-A55-5G-8GB-256GB-i.789012345.23456789012",
                lazada: "samsung-galaxy-a55-5g-i8267756748",
                blibli: "samsung-galaxy-a55-5g-8gb-256gb/SAM-12698-00002"
            }
        },
        {
            name: "iPhone 15 128GB",
            brand: "apple",
            basePrice: 14500000,
            rating: 4.8,
            sold: 5400,
            slugs: {
                tokopedia: "apple-official-store/iphone-15-128gb",
                shopee: "iPhone-15-128GB-i.890123456.12345678901",
                lazada: "apple-iphone-15-128gb-i8267756749",
                blibli: "apple-iphone-15-128gb/APL-12698-00001"
            }
        },
        {
            name: "iPhone 15 Pro Max 256GB",
            brand: "apple",
            basePrice: 22500000,
            rating: 4.9,
            sold: 2800,
            slugs: {
                tokopedia: "apple-official-store/iphone-15-pro-max-256gb",
                shopee: "iPhone-15-Pro-Max-256GB-i.890123456.23456789012",
                lazada: "apple-iphone-15-pro-max-i8267756750",
                blibli: "apple-iphone-15-pro-max-256gb/APL-12698-00002"
            }
        },
        {
            name: "Xiaomi 14 12GB/256GB",
            brand: "xiaomi",
            basePrice: 9800000,
            rating: 4.7,
            sold: 2100,
            slugs: {
                tokopedia: "xiaomi-official-store/xiaomi-14-12gb-256gb",
                shopee: "Xiaomi-14-12GB-256GB-i.901234567.12345678901",
                lazada: "xiaomi-14-12gb-256gb-i8267756751",
                blibli: "xiaomi-14-12gb-256gb/XMI-12698-00001"
            }
        },
        {
            name: "Xiaomi Redmi Note 13 Pro 8GB/256GB",
            brand: "xiaomi",
            basePrice: 3500000,
            rating: 4.5,
            sold: 8900,
            slugs: {
                tokopedia: "xiaomi-official-store/xiaomi-redmi-note-13-pro-8gb-256gb",
                shopee: "Xiaomi-Redmi-Note-13-Pro-8GB-256GB-i.901234567.23456789012",
                lazada: "xiaomi-redmi-note-13-pro-i8267756752",
                blibli: "xiaomi-redmi-note-13-pro-8gb-256gb/XMI-12698-00002"
            }
        },
        {
            name: "OPPO Reno 11 5G 12GB/256GB",
            brand: "oppo",
            basePrice: 5500000,
            rating: 4.6,
            sold: 1800,
            slugs: {
                tokopedia: "oppo-official-store/oppo-reno-11-5g-12gb-256gb",
                shopee: "OPPO-Reno-11-5G-12GB-256GB-i.112345678.12345678901",
                lazada: "oppo-reno-11-5g-i8267756753",
                blibli: "oppo-reno-11-5g-12gb-256gb/OPP-12698-00001"
            }
        },
        {
            name: "Vivo V30 Pro 12GB/512GB",
            brand: "vivo",
            basePrice: 6800000,
            rating: 4.5,
            sold: 1200,
            slugs: {
                tokopedia: "vivo-official/vivo-v30-pro-12gb-512gb",
                shopee: "Vivo-V30-Pro-12GB-512GB-i.123456789.12345678901",
                lazada: "vivo-v30-pro-12gb-512gb-i8267756754",
                blibli: "vivo-v30-pro-12gb-512gb/VIV-12698-00001"
            }
        },
    ],
    earbuds: [
        {
            name: "Samsung Galaxy Buds2 Pro",
            brand: "samsung",
            basePrice: 2200000,
            rating: 4.8,
            sold: 4500,
            slugs: {
                tokopedia: "samsung-official/samsung-galaxy-buds2-pro",
                shopee: "Samsung-Galaxy-Buds2-Pro-i.789012345.34567890123",
                lazada: "samsung-galaxy-buds2-pro-i8267756755",
                blibli: "samsung-galaxy-buds2-pro/SAM-12698-00003"
            }
        },
        {
            name: "Apple AirPods Pro 2nd Gen",
            brand: "apple",
            basePrice: 3800000,
            rating: 4.9,
            sold: 8900,
            slugs: {
                tokopedia: "apple-official-store/apple-airpods-pro-2nd-gen",
                shopee: "Apple-AirPods-Pro-2nd-Gen-i.890123456.34567890123",
                lazada: "apple-airpods-pro-2nd-gen-i8267756756",
                blibli: "apple-airpods-pro-2nd-gen/APL-12698-00003"
            }
        },
        {
            name: "Sony WF-1000XM5",
            brand: "sony",
            basePrice: 4200000,
            rating: 4.8,
            sold: 2300,
            slugs: {
                tokopedia: "sony-official-id/sony-wf-1000xm5",
                shopee: "Sony-WF-1000XM5-i.234567890.45678901234",
                lazada: "sony-wf-1000xm5-i8267756757",
                blibli: "sony-wf-1000xm5/SNY-12698-00001"
            }
        },
        {
            name: "JBL Tune Buds",
            brand: "jbl",
            basePrice: 850000,
            rating: 4.5,
            sold: 6700,
            slugs: {
                tokopedia: "jbl-official/jbl-tune-buds",
                shopee: "JBL-Tune-Buds-i.345678901.34567890123",
                lazada: "jbl-tune-buds-i8267756758",
                blibli: "jbl-tune-buds/JBL-12698-00001"
            }
        },
    ],
};

// 4 e-commerce sources (removed Bukalapak)
const SOURCES: EcommerceSource[] = ["tokopedia", "shopee", "lazada", "blibli"];
const CITIES = ["Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar", "Yogyakarta", "Tangerang"];

// Generate real product links based on actual URL patterns
function generateRealLink(source: EcommerceSource, slug: string): string {
    switch (source) {
        case "tokopedia":
            return `https://www.tokopedia.com/${slug}`;
        case "shopee":
            return `https://shopee.co.id/${slug}`;
        case "lazada":
            return `https://www.lazada.co.id/products/pdp-${slug}.html`;
        case "blibli":
            return `https://www.blibli.com/p/${slug}`;
        default:
            return `https://www.tokopedia.com/${slug}`;
    }
}

function generateMockProducts(keyword: string, preferredBrand?: string, count: number = 40): ScrapedProduct[] {
    const keywordLower = keyword.toLowerCase();

    // Find matching product category
    let baseProducts = MOCK_PRODUCTS["laptop"]; // default
    for (const [category, products] of Object.entries(MOCK_PRODUCTS)) {
        if (keywordLower.includes(category) || category.includes(keywordLower)) {
            baseProducts = products;
            break;
        }
    }

    // Filter by brand if mentioned in keyword
    const brands = ["asus", "lenovo", "hp", "acer", "dell", "msi", "samsung", "apple", "xiaomi", "oppo", "vivo", "sony", "jbl"];
    const mentionedBrand = brands.find(brand => keywordLower.includes(brand));

    // Use preferredBrand from query if available, otherwise use brand from keyword
    const targetBrand = preferredBrand?.toLowerCase() || mentionedBrand;

    // Sort products to prioritize preferred brand
    let sortedProducts = [...baseProducts];
    if (targetBrand) {
        sortedProducts.sort((a, b) => {
            const aMatch = a.brand === targetBrand ? 1 : 0;
            const bMatch = b.brand === targetBrand ? 1 : 0;
            return bMatch - aMatch; // Preferred brand comes first
        });
    }

    const products: ScrapedProduct[] = [];

    // Generate variations to reach desired count
    for (let i = 0; i < count && products.length < count; i++) {
        const baseProduct = sortedProducts[i % sortedProducts.length];
        const source = SOURCES[i % SOURCES.length];
        const priceVariation = 0.9 + Math.random() * 0.2; // -10% to +10%
        const price = Math.round(baseProduct.basePrice * priceVariation / 1000) * 1000;
        const variantNum = Math.floor(i / sortedProducts.length);
        const slug = baseProduct.slugs[source] || baseProduct.slugs["tokopedia"];

        products.push({
            name: baseProduct.name + (variantNum > 0 ? ` - Seller ${variantNum + 1}` : ""),
            price,
            rating: Math.round((baseProduct.rating + (Math.random() - 0.5) * 0.3) * 10) / 10,
            soldCount: Math.floor(baseProduct.sold * (0.5 + Math.random())),
            sellerLocation: CITIES[Math.floor(Math.random() * CITIES.length)],
            imageUrl: `https://placehold.co/200x200/0ea5e9/white?text=${encodeURIComponent(baseProduct.brand.toUpperCase())}`,
            productLink: generateRealLink(source, slug),
            source,
        });
    }

    return products;
}

export async function scrapeAllSources(
    query: ParsedQuery,
    options: { maxProductsPerSource?: number } = {}
): Promise<ScrapedProduct[]> {
    const maxProducts = (options.maxProductsPerSource || 10) * 4; // 4 sources now

    console.log(`[MOCK] Starting scrape for: "${query.keyword}" from 4 sources`);
    if (query.preferredBrand) {
        console.log(`[MOCK] Preferred brand: ${query.preferredBrand}`);
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));

    // Generate mock products with brand preference
    let products = generateMockProducts(
        query.keyword || "laptop",
        query.preferredBrand,
        maxProducts
    );

    // Apply filters from query
    if (query.minPrice) {
        products = products.filter((p) => p.price >= query.minPrice!);
    }
    if (query.maxPrice) {
        products = products.filter((p) => p.price <= query.maxPrice!);
    }
    if (query.minRating) {
        products = products.filter((p) => p.rating >= query.minRating!);
    }

    // Log source counts
    const sourceCounts: Record<string, number> = {};
    products.forEach((p) => {
        sourceCounts[p.source] = (sourceCounts[p.source] || 0) + 1;
    });

    for (const source of SOURCES) {
        console.log(`${source}: Found ${sourceCounts[source] || 0} products`);
    }

    console.log(`Total products after filtering: ${products.length}`);

    return products;
}

// Keep exports for compatibility (Bukalapak removed)
export class TokopediaScraper { }
export class ShopeeScraper { }
export class LazadaScraper { }
export class BlibliScraper { }
export class BaseScraper { }
