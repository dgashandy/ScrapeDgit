import { ScrapedProduct, ScoredProduct, RecommendationWeights, DEFAULT_WEIGHTS } from "@/lib/types";
import { estimateShippingFee } from "./shipping";

export interface RecommendationOptions {
    userLocation?: string;
    weights?: RecommendationWeights;
}

// Calculate normalized score (0-100) - higher is better
function normalizeScore(value: number, min: number, max: number, invert: boolean = false): number {
    if (max === min) return 50; // Avoid division by zero

    let score = ((value - min) / (max - min)) * 100;

    // Invert for values where lower is better (price, shipping)
    if (invert) {
        score = 100 - score;
    }

    return Math.max(0, Math.min(100, score));
}

// Main recommendation engine
export function calculateProductScores(
    products: ScrapedProduct[],
    options: RecommendationOptions = {}
): ScoredProduct[] {
    if (products.length === 0) return [];

    const weights = options.weights || DEFAULT_WEIGHTS;
    const userLocation = options.userLocation || "Jakarta";

    // Calculate shipping fees
    const productsWithShipping = products.map((product) => ({
        ...product,
        estimatedShipping: estimateShippingFee(product.sellerLocation, userLocation),
    }));

    // Find min/max values for normalization
    const prices = productsWithShipping.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const shippingFees = productsWithShipping.map((p) => p.estimatedShipping);
    const minShipping = Math.min(...shippingFees);
    const maxShipping = Math.max(...shippingFees);

    const soldCounts = productsWithShipping.map((p) => p.soldCount);
    const minSold = Math.min(...soldCounts);
    const maxSold = Math.max(...soldCounts);

    const ratings = productsWithShipping.map((p) => p.rating);
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings.filter((r) => r > 0)) || 5;

    // Calculate scores for each product
    const scoredProducts: ScoredProduct[] = productsWithShipping.map((product) => {
        // Price score - lower price = higher score
        const priceScore = normalizeScore(product.price, minPrice, maxPrice, true);

        // Shipping score - lower shipping = higher score
        const shippingScore = normalizeScore(product.estimatedShipping, minShipping, maxShipping, true);

        // Sold count score - higher sold = higher score
        const soldScore = normalizeScore(product.soldCount, minSold, maxSold, false);

        // Rating score - higher rating = higher score
        const ratingScore = normalizeScore(product.rating, minRating, maxRating, false);

        // Calculate final weighted score
        // Formula: Price (50%) + Shipping (25%) + SoldCount (15%) + Rating (10%)
        const finalScore =
            priceScore * weights.price +
            shippingScore * weights.shipping +
            soldScore * weights.soldCount +
            ratingScore * weights.rating;

        return {
            ...product,
            priceScore: Math.round(priceScore * 100) / 100,
            shippingScore: Math.round(shippingScore * 100) / 100,
            soldScore: Math.round(soldScore * 100) / 100,
            ratingScore: Math.round(ratingScore * 100) / 100,
            finalScore: Math.round(finalScore * 100) / 100,
            estimatedShipping: product.estimatedShipping,
            rank: 0, // Will be assigned after sorting
        };
    });

    // Sort by final score (descending) and assign ranks
    scoredProducts.sort((a, b) => b.finalScore - a.finalScore);
    scoredProducts.forEach((product, index) => {
        product.rank = index + 1;
    });

    return scoredProducts;
}

// Get summary statistics for the results
export function getResultsSummary(products: ScoredProduct[]): {
    totalProducts: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
    averageRating: number;
    sources: Record<string, number>;
} {
    if (products.length === 0) {
        return {
            totalProducts: 0,
            averagePrice: 0,
            priceRange: { min: 0, max: 0 },
            averageRating: 0,
            sources: {},
        };
    }

    const prices = products.map((p) => p.price);
    const ratings = products.filter((p) => p.rating > 0).map((p) => p.rating);

    const sources: Record<string, number> = {};
    products.forEach((p) => {
        sources[p.source] = (sources[p.source] || 0) + 1;
    });

    return {
        totalProducts: products.length,
        averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
        averageRating: ratings.length > 0
            ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
            : 0,
        sources,
    };
}

// Filter products by criteria
export function filterScoredProducts(
    products: ScoredProduct[],
    filters: {
        minFinalScore?: number;
        maxPrice?: number;
        minRating?: number;
        sources?: string[];
    }
): ScoredProduct[] {
    return products.filter((product) => {
        if (filters.minFinalScore && product.finalScore < filters.minFinalScore) {
            return false;
        }
        if (filters.maxPrice && product.price > filters.maxPrice) {
            return false;
        }
        if (filters.minRating && product.rating < filters.minRating) {
            return false;
        }
        if (filters.sources && filters.sources.length > 0 && !filters.sources.includes(product.source)) {
            return false;
        }
        return true;
    });
}
