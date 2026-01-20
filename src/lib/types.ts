// ==================== AUTH TYPES ====================

export interface JWTPayload {
    userId: string;
    email: string;
    role: "USER" | "ADMIN";
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    role: "USER" | "ADMIN";
    isVerified: boolean;
    avatarUrl: string | null;
    location: string | null;
}

// ==================== LLM TYPES ====================

export interface ParsedQuery {
    isSearch: boolean;
    keyword: string | null;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    userLocation?: string;
    specConstraints?: string[];
    preferredBrand?: string;
    needsClarification: boolean;
    clarificationQuestion?: string;
    // Tracking fields to prevent looping on "no preference" answers
    budgetAsked?: boolean;      // User was asked about budget
    specsAsked?: boolean;       // User was asked about specs
    brandAsked?: boolean;       // User was asked about brand
}

export interface UserContext {
    location?: string;
    priceRange?: {
        min?: number;
        max?: number;
    };
    preferredRating?: number;
}

// ==================== SCRAPER TYPES ====================

export type EcommerceSource = "tokopedia" | "shopee" | "lazada" | "blibli";

export interface ScrapedProduct {
    name: string;
    price: number;
    rating: number;
    soldCount: number;
    sellerLocation: string;
    imageUrl: string | null;
    source: EcommerceSource;
    productLink: string;
}

export interface ScraperConfig {
    baseUrl: string;
    searchPath: string;
    selectors: {
        productContainer: string;
        name: string;
        price: string;
        rating: string;
        soldCount: string;
        location: string;
        image: string;
        link: string;
    };
}

// ==================== RECOMMENDATION TYPES ====================

export interface ScoredProduct extends ScrapedProduct {
    priceScore: number;
    shippingScore: number;
    soldScore: number;
    ratingScore: number;
    finalScore: number;
    estimatedShipping: number;
    rank: number;
}

export interface RecommendationWeights {
    price: number;
    shipping: number;
    soldCount: number;
    rating: number;
}

export const DEFAULT_WEIGHTS: RecommendationWeights = {
    price: 0.5,
    shipping: 0.25,
    soldCount: 0.15,
    rating: 0.1,
};

// ==================== CHAT TYPES ====================

export interface ChatMessageData {
    id: string;
    role: "USER" | "ASSISTANT" | "SYSTEM";
    content: string;
    parsedQuery?: ParsedQuery;
    createdAt: Date;
}

export interface ChatSessionData {
    id: string;
    title: string | null;
    isActive: boolean;
    messages: ChatMessageData[];
    results: ScoredProduct[];
    createdAt: Date;
    updatedAt: Date;
}

// ==================== API TYPES ====================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ==================== EXPORT TYPES ====================

export interface ExportOptions {
    format: "xlsx" | "csv";
    columns: (keyof ScoredProduct)[];
    filename?: string;
}
