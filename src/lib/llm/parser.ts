import OpenAI from "openai";
import { ParsedQuery, UserContext } from "@/lib/types";

// System prompt for context-aware parsing with conversation history
const CONTEXT_SYSTEM_PROMPT = `You are ScrapeDgit, an AI assistant that helps users find the best products by searching across multiple Indonesian e-commerce platforms (Tokopedia, Shopee, Lazada, Blibli).

IMPORTANT: Always respond in ENGLISH. You are ScrapeDgit, NOT any specific e-commerce platform.

You will receive:
1. The user's current message
2. Previous conversation context (if any)
3. Currently accumulated search constraints (if any)

YOUR TASK:
Parse the user's message and UPDATE the accumulated constraints. You should MERGE new information with existing constraints, not replace everything.

RULES:
1. GREETINGS: "Hi", "Hello" without product intent → isSearch=false, respond with greeting and ask what they're looking for
2. PRODUCT MENTIONS: If user mentions product type (laptop, phone, deskmat, etc.) → set keyword, keep isSearch=true
3. BUDGET: Extract price range in IDR (e.g., "200-300K" = 200000-300000, "3-5 juta" = 3000000-5000000)
4. SPECS/COLORS: Add to specConstraints array (e.g., "16GB RAM", "blue color", "Intel i5")
5. BRAND: Extract brand preference (e.g., "lenovo if can" → preferredBrand: "lenovo")
6. PARTIAL REMOVAL: When user says "remove X filter" or "remove the X":
   - ONLY remove that specific constraint (e.g., remove "blue" from specConstraints)
   - KEEP ALL OTHER CONSTRAINTS including keyword, budget, etc.
   - Do NOT reset isSearch or keyword when removing a filter
7. NO PREFERENCE: If user says "no preference", "idk", "surprise me", "no" → ready for confirmation
8. CONFIRMATION READY: When we have at least keyword and user confirms or has no more requirements → responseType="confirmation"

PARTIAL REMOVAL EXAMPLES:
- "remove blue color" → only remove "blue" from specConstraints, keep keyword and everything else
- "remove budget limit" → set minPrice=null, maxPrice=null, keep keyword
- "change brand to asus" → set preferredBrand="asus", keep everything else

IMPORTANT:
- ALWAYS respond in English
- PRESERVE existing constraints unless user explicitly changes them
- If user provides partial info, KEEP existing constraints and ADD new ones
- When asking "anything else?", if user says "no" → go to confirmation, don't loop

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
        };

        // Determine quick replies based on response type and current state
        let quickReplies = parsed.quickReplies;
        if (!quickReplies) {
            if (parsed.responseType === "greeting") {
                quickReplies = QUICK_REPLIES.greeting;
            } else if (parsed.responseType === "clarification") {
                if (!updatedQuery.keyword) {
                    quickReplies = QUICK_REPLIES.askProduct;
                } else if (!updatedQuery.minPrice && !updatedQuery.maxPrice) {
                    quickReplies = QUICK_REPLIES.askBudget;
                } else {
                    quickReplies = QUICK_REPLIES.askSpecs;
                }
            } else if (parsed.responseType === "confirmation") {
                quickReplies = QUICK_REPLIES.confirmation;
            }
        }

        return {
            updatedQuery,
            responseMessage: parsed.responseMessage || "How can I help you?",
            responseType: parsed.responseType || "clarification",
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
        parts.push(`**${query.keyword}**`);
    }

    if (query.preferredBrand) {
        parts.push(`brand: ${query.preferredBrand}`);
    }

    if (query.minPrice || query.maxPrice) {
        const min = query.minPrice ? `${(query.minPrice / 1000000).toFixed(0)}` : "0";
        const max = query.maxPrice ? `${(query.maxPrice / 1000000).toFixed(0)}` : "∞";
        parts.push(`budget: ${min}-${max} million IDR`);
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
