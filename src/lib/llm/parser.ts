import OpenAI from "openai";
import { ParsedQuery, UserContext } from "@/lib/types";

// System prompt for context-aware parsing with conversation history
const CONTEXT_SYSTEM_PROMPT = `You are ScrapeDgit, an AI assistant that helps users find the best products by searching across ALL Indonesian e-commerce platforms simultaneously (Tokopedia, Shopee, Lazada, Blibli).

CRITICAL RULES:
1. ALWAYS respond in ENGLISH
2. NEVER ask user which platform to search - you ALWAYS search ALL platforms automatically
3. When user asks for a product, you search Tokopedia, Shopee, Lazada, and Blibli simultaneously

You will receive:
1. The user's current message
2. Previous conversation context (if any)
3. Currently accumulated search constraints (if any)

YOUR TASK:
Parse the user's message and UPDATE the accumulated constraints. MERGE new information, don't replace.

KEYWORD RULES (CRITICAL - READ CAREFULLY):
1. The FIRST product mentioned becomes the keyword and should NOT be replaced by clarification answers
2. "give me TWS, red color, around 500K" → keyword: "TWS", specConstraints: ["red color"]
3. If user already said "TWS" and then selects "gaming" from options → keyword stays "TWS", add "gaming" to specConstraints
4. ONLY replace keyword if user EXPLICITLY corrects it: "not phone, but headphone"
5. Clarification answers like "gaming", "wireless" are SPECS, not keyword replacements
6. DO NOT truncate keywords - "headphone" must NOT become "phone"

BUDGET PARSING RULES:
1. "200-500K" → minPrice: 200000, maxPrice: 500000
2. "around 500K" or "sekitar 500K" → minPrice: 400000, maxPrice: 600000 (±100K or ±20% range)
3. "about 1 juta" → minPrice: 800000, maxPrice: 1200000 (±20%)
4. "under 500K" → maxPrice: 500000
5. "above 1 million" → minPrice: 1000000
6. "3-5 juta" → minPrice: 3000000, maxPrice: 5000000

GENERAL RULES:
1. GREETINGS: "Hi", "Hello" without product → isSearch=false, ask what they're looking for
2. PRODUCT MENTIONS: Extract product as keyword, set isSearch=true
3. SPECS/COLORS: Add to specConstraints array (gaming, wireless, red, etc.)
4. BRAND: Extract brand preference
5. When ready: Have keyword → go to confirmation, don't over-clarify
6. NO PREFERENCE: "no", "no preference" → ready for confirmation

EXAMPLES:
- "give me TWS, red color, around 500K" → keyword: "TWS", specConstraints: ["red color"], minPrice: 400000, maxPrice: 600000
- User selected "gaming earbuds" from options where keyword was "TWS" → keyword: "TWS", specConstraints: ["red color", "gaming"]
- "robin figure HSR" → keyword: "robin figure HSR", search immediately on all platforms

IMPORTANT:
- PRESERVE existing keyword when user clarifies with type/style preferences
- NEVER ask "which platform?" - always search all 4 platforms

OUTPUT FORMAT (JSON):
{
  "updatedQuery": {
    "isSearch": boolean,
    "keyword": "string or null",
    "category": "string or null", 
    "minPrice": number or null,
    "maxPrice": number or null,
    "minRating": number or null,
    "specConstraints": ["string"] or null,
    "preferredBrand": "string or null",
    "readyForConfirmation": boolean
  },
  "responseMessage": "string (MUST be in English)",
  "responseType": "greeting" | "clarification" | "confirmation" | "search",
  "quickReplies": ["string"] or null
}`;

const QUICK_REPLIES = {
    greeting: ["Help me find something", "Show me popular products"],
    askProduct: ["Laptop", "Phone", "Earbuds", "Tablet", "Other"],
    askBudget: ["Under 500K", "500K-2M", "2-5 million", "5-10 million", "No budget limit"],
    askSpecs: ["Yes, I have additional requirements", "No, please search"],
    confirmation: ["Yes, search now", "I want to modify"],
};


let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
    if (!openaiClient) {
        const apiKey = process.env.OPENAI_API_KEY;
        const baseURL = process.env.OPENAI_BASE_URL;

        if (!apiKey) {
            throw new Error("OPENAI_API_KEY environment variable is not set");
        }

        openaiClient = new OpenAI({
            apiKey,
            baseURL: baseURL || undefined,
        });
    }
    return openaiClient;
}

export interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
}

export interface ParseWithContextResult {
    updatedQuery: ParsedQuery;
    responseMessage: string;
    responseType: "greeting" | "clarification" | "confirmation" | "search";
    quickReplies: string[] | null;
}

// Main function: parse with conversation context
export async function parseWithContext(
    message: string,
    existingQuery: ParsedQuery | null,
    conversationHistory: ConversationMessage[],
    userLocation?: string
): Promise<ParseWithContextResult> {
    try {
        const openai = getOpenAI();
        const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

        // Build context string
        const existingConstraints = existingQuery
            ? `\nCURRENT ACCUMULATED CONSTRAINTS:\n${JSON.stringify(existingQuery, null, 2)}`
            : "\nNo constraints accumulated yet (new conversation).";

        const historyText = conversationHistory.length > 0
            ? `\nCONVERSATION HISTORY (last ${Math.min(conversationHistory.length, 6)} messages):\n${conversationHistory.slice(-6).map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}`
            : "";

        const locationInfo = userLocation ? `\nUser's location: ${userLocation}` : "";

        const response = await openai.chat.completions.create({
            model,
            messages: [
                {
                    role: "system",
                    content: CONTEXT_SYSTEM_PROMPT,
                },
                {
                    role: "user",
                    content: `${historyText}${existingConstraints}${locationInfo}\n\nUSER'S NEW MESSAGE: "${message}"\n\nParse this message and update constraints. Respond with JSON only.`,
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 800,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No response from LLM");
        }

        const parsed = JSON.parse(content);

        // Ensure we have proper structure
        const updatedQuery: ParsedQuery = {
            isSearch: parsed.updatedQuery?.isSearch ?? existingQuery?.isSearch ?? false,
            keyword: parsed.updatedQuery?.keyword ?? existingQuery?.keyword ?? null,
            category: parsed.updatedQuery?.category ?? existingQuery?.category,
            minPrice: parsed.updatedQuery?.minPrice ?? existingQuery?.minPrice,
            maxPrice: parsed.updatedQuery?.maxPrice ?? existingQuery?.maxPrice,
            minRating: parsed.updatedQuery?.minRating ?? existingQuery?.minRating,
            specConstraints: parsed.updatedQuery?.specConstraints ?? existingQuery?.specConstraints,
            preferredBrand: parsed.updatedQuery?.preferredBrand ?? existingQuery?.preferredBrand,
            userLocation: userLocation || existingQuery?.userLocation,
            needsClarification: parsed.responseType === "clarification",
            clarificationQuestion: parsed.responseType === "clarification" ? parsed.responseMessage : undefined,
            // Preserve asked tracking fields
            budgetAsked: existingQuery?.budgetAsked,
            specsAsked: existingQuery?.specsAsked,
            brandAsked: existingQuery?.brandAsked,
        };

        // Post-process "around X" budget patterns to ensure ±100K or ±20% range
        const aroundPattern = /(?:around|sekitar|about|approximately|kira-kira)\s*(\d+)\s*(K|k|ribu|rb|jt|juta|million|M)?/i;
        const aroundMatch = message.match(aroundPattern);
        if (aroundMatch) {
            let baseValue = parseInt(aroundMatch[1]);
            const unit = aroundMatch[2]?.toLowerCase() || "";

            // Convert to full number
            if (unit === "k" || unit === "ribu" || unit === "rb") {
                baseValue *= 1000;
            } else if (unit === "jt" || unit === "juta" || unit === "million" || unit === "m") {
                baseValue *= 1000000;
            }

            // Apply ±100K or ±20% range (whichever is larger)
            const variation = Math.max(100000, baseValue * 0.2);
            updatedQuery.minPrice = Math.max(0, baseValue - variation);
            updatedQuery.maxPrice = baseValue + variation;
        }

        // Determine quick replies based on response type and current state
        let quickReplies = parsed.quickReplies;
        let responseType = parsed.responseType;

        if (!quickReplies) {
            if (responseType === "greeting") {
                quickReplies = QUICK_REPLIES.greeting;
            } else if (responseType === "clarification") {
                if (!updatedQuery.keyword) {
                    quickReplies = QUICK_REPLIES.askProduct;
                } else if ((!updatedQuery.minPrice && !updatedQuery.maxPrice) && !updatedQuery.budgetAsked) {
                    // Only ask budget if not already asked
                    quickReplies = QUICK_REPLIES.askBudget;
                    updatedQuery.budgetAsked = true;
                } else if (!updatedQuery.specsAsked) {
                    // Only ask specs if not already asked
                    quickReplies = QUICK_REPLIES.askSpecs;
                    updatedQuery.specsAsked = true;
                } else {
                    // All asked, go to confirmation
                    responseType = "confirmation";
                    quickReplies = QUICK_REPLIES.confirmation;
                }
            } else if (responseType === "confirmation") {
                quickReplies = QUICK_REPLIES.confirmation;
            }
        }

        // Check if user said "no preference" variants and mark as asked
        const noPreferencePatterns = /no budget|no preference|no limit|any budget|doesn't matter|don't care|idk|surprise me/i;
        if (noPreferencePatterns.test(message)) {
            if (!updatedQuery.minPrice && !updatedQuery.maxPrice) {
                updatedQuery.budgetAsked = true;
            }
            if (!updatedQuery.specConstraints?.length) {
                updatedQuery.specsAsked = true;
            }
        }

        return {
            updatedQuery,
            responseMessage: parsed.responseMessage || "How can I help you?",
            responseType: responseType || "clarification",
            quickReplies,
        };
    } catch (error) {
        console.error("LLM context parsing error:", error);

        // Fallback: try to extract basic info
        return fallbackParse(message, existingQuery, userLocation);
    }
}

// Fallback parsing without LLM
function fallbackParse(
    query: string,
    existingQuery: ParsedQuery | null,
    userLocation?: string
): ParseWithContextResult {
    const queryLower = query.toLowerCase();

    // Start with existing or empty
    const updatedQuery: ParsedQuery = {
        isSearch: existingQuery?.isSearch ?? false,
        keyword: existingQuery?.keyword ?? null,
        category: existingQuery?.category,
        minPrice: existingQuery?.minPrice,
        maxPrice: existingQuery?.maxPrice,
        minRating: existingQuery?.minRating,
        specConstraints: existingQuery?.specConstraints,
        preferredBrand: existingQuery?.preferredBrand,
        userLocation: userLocation || existingQuery?.userLocation,
        needsClarification: false,
    };

    // Greetings check
    const greetings = ["hi", "hello", "halo", "hey", "bro", "p"];
    if (greetings.some(g => queryLower.trim() === g)) {
        return {
            updatedQuery: { ...updatedQuery, isSearch: false },
            responseMessage: "Hello! What product are you looking for today?",
            responseType: "greeting",
            quickReplies: QUICK_REPLIES.greeting,
        };
    }

    // Product keywords
    const productTerms = ["laptop", "phone", "handphone", "hp", "earbuds", "earphone", "headphone", "keyboard", "monitor", "tablet"];
    for (const term of productTerms) {
        if (queryLower.includes(term)) {
            updatedQuery.keyword = term === "hp" || term === "handphone" ? "phone" : term;
            updatedQuery.isSearch = true;
            break;
        }
    }

    // Price extraction
    const priceMatch = query.match(/(\d+)\s*[-–]\s*(\d+)\s*(juta|jt|million|mio)/i);
    if (priceMatch) {
        updatedQuery.minPrice = parseInt(priceMatch[1]) * 1000000;
        updatedQuery.maxPrice = parseInt(priceMatch[2]) * 1000000;
    }

    // Brand extraction
    const brands = ["asus", "lenovo", "hp", "acer", "dell", "msi", "samsung", "apple", "xiaomi", "oppo", "vivo", "sony"];
    for (const brand of brands) {
        if (queryLower.includes(brand)) {
            updatedQuery.preferredBrand = brand;
            break;
        }
    }

    // Determine response
    if (!updatedQuery.keyword) {
        return {
            updatedQuery,
            responseMessage: "What type of product are you looking for?",
            responseType: "clarification",
            quickReplies: QUICK_REPLIES.askProduct,
        };
    }

    if (!updatedQuery.minPrice && !updatedQuery.maxPrice) {
        return {
            updatedQuery,
            responseMessage: `What is your budget for the ${updatedQuery.keyword}?`,
            responseType: "clarification",
            quickReplies: QUICK_REPLIES.askBudget,
        };
    }

    // Ready for confirmation
    return {
        updatedQuery,
        responseMessage: buildConfirmationMessage(updatedQuery),
        responseType: "confirmation",
        quickReplies: QUICK_REPLIES.confirmation,
    };
}

// Build confirmation message from query
export function buildConfirmationMessage(query: ParsedQuery): string {
    const parts: string[] = [];

    if (query.keyword) {
        parts.push(query.keyword);
    }

    if (query.preferredBrand) {
        parts.push(`brand: ${query.preferredBrand}`);
    }

    if (query.minPrice || query.maxPrice) {
        const formatPrice = (price: number): string => {
            if (price >= 1000000) {
                return `${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)} million`;
            } else if (price >= 1000) {
                return `${(price / 1000).toFixed(0)}K`;
            }
            return price.toString();
        };
        const min = query.minPrice ? formatPrice(query.minPrice) : "0";
        const max = query.maxPrice ? formatPrice(query.maxPrice) : "no limit";
        parts.push(`budget: ${min}-${max} IDR`);
    }

    if (query.specConstraints && query.specConstraints.length > 0) {
        parts.push(`specs: ${query.specConstraints.join(", ")}`);
    }

    if (query.userLocation) {
        parts.push(`shipping to: ${query.userLocation}`);
    }

    return `Ready to search for ${parts.join(", ")}. Shall I start the search?`;
}

// Legacy function for backwards compatibility
export async function parseUserQuery(
    query: string,
    context?: UserContext
): Promise<ParsedQuery> {
    const result = await parseWithContext(query, null, [], context?.location);
    return result.updatedQuery;
}

// Validate if parsed query has enough info to search
export function validateParsedQuery(query: ParsedQuery): {
    valid: boolean;
    missingFields: string[];
} {
    const missingFields: string[] = [];

    if (!query.keyword || query.keyword.length < 2) {
        missingFields.push("keyword");
    }

    return {
        valid: missingFields.length === 0,
        missingFields,
    };
}

// Generate clarification message (legacy)
export function generateClarificationMessage(missingFields: string[]): string {
    const questions: string[] = [];

    if (missingFields.includes("keyword")) {
        questions.push("What type of product are you looking for?");
    }
    if (missingFields.includes("price")) {
        questions.push("What is your budget range?");
    }

    return questions.join("\n");
}
