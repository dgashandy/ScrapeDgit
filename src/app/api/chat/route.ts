import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import { parseWithContext, validateParsedQuery, buildConfirmationMessage, ConversationMessage } from "@/lib/llm/parser";
import { scrapeAllSources } from "@/lib/scrapers";
import { calculateProductScores, getResultsSummary } from "@/lib/recommendation/engine";
import { checkApiRateLimit } from "@/lib/redis/rateLimit";
import { MessageRole } from "@prisma/client";
import { ParsedQuery } from "@/lib/types";

// In-memory session store for guest users (in production, use Redis)
const guestSessions = new Map<string, {
    accumulatedQuery: ParsedQuery | null;
    conversationHistory: ConversationMessage[];
    createdAt: number;
}>();

// Clean up old guest sessions every 5 minutes
setInterval(() => {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    for (const [id, session] of guestSessions.entries()) {
        if (now - session.createdAt > maxAge) {
            guestSessions.delete(id);
        }
    }
}, 5 * 60 * 1000);

function generateGuestSessionId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

const chatSchema = z.object({
    message: z.string().min(1, "Message is required"),
    sessionId: z.string().optional().nullable(),
    userLocation: z.string().optional().nullable(),
    confirmSearch: z.boolean().optional(),
    modifySearch: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const rateLimit = await checkApiRateLimit(ip);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { success: false, error: `Rate limited. Try again in ${rateLimit.resetIn} seconds.` },
                { status: 429 }
            );
        }

        // Authenticate user (optional - guests can also use)
        const accessToken = extractBearerToken(request.headers.get("Authorization"));
        const payload = accessToken ? verifyAccessToken(accessToken) : null;
        const userId = payload?.userId;

        const body = await request.json();
        const validation = chatSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { message, sessionId, userLocation, confirmSearch, modifySearch } = validation.data;

        // Get or create chat session
        let chatSession: { id: string } | null = null;
        let accumulatedQuery: ParsedQuery | null = null;
        let conversationHistory: ConversationMessage[] = [];
        let currentSessionId = sessionId;
        let isGuestSession = false;

        // For authenticated users, use database sessions
        if (userId) {
            if (sessionId) {
                const dbSession = await prisma.chatSession.findUnique({
                    where: { id: sessionId, userId },
                    include: {
                        messages: {
                            orderBy: { createdAt: "desc" },
                            take: 10,
                        },
                    },
                });

                if (dbSession) {
                    chatSession = dbSession;
                    accumulatedQuery = dbSession.accumulatedQuery as ParsedQuery | null;
                    conversationHistory = dbSession.messages
                        .reverse()
                        .map((m) => ({
                            role: m.role === MessageRole.USER ? "user" : "assistant",
                            content: m.content,
                        })) as ConversationMessage[];
                }
            }

            if (!chatSession) {
                chatSession = await prisma.chatSession.create({
                    data: {
                        userId,
                        title: message.substring(0, 100),
                    },
                });
                currentSessionId = chatSession.id;
            }
        } else {
            // For guest users, use in-memory sessions
            isGuestSession = true;

            if (sessionId && guestSessions.has(sessionId)) {
                const guestSession = guestSessions.get(sessionId)!;
                accumulatedQuery = guestSession.accumulatedQuery;
                conversationHistory = guestSession.conversationHistory;
                currentSessionId = sessionId;
            } else {
                // Create new guest session
                currentSessionId = generateGuestSessionId();
                guestSessions.set(currentSessionId, {
                    accumulatedQuery: null,
                    conversationHistory: [],
                    createdAt: Date.now(),
                });
            }
        }

        // Store user message in history
        conversationHistory.push({ role: "user", content: message });

        // Store user message in DB for authenticated users
        if (chatSession && !isGuestSession) {
            await prisma.chatMessage.create({
                data: {
                    chatSessionId: chatSession.id,
                    role: MessageRole.USER,
                    content: message,
                },
            });
        }

        // Handle modification request
        if (modifySearch && accumulatedQuery) {
            const modifyMessage = "What would you like to change? You can modify the product type, budget, brand preference, or specifications.";

            conversationHistory.push({ role: "assistant", content: modifyMessage });

            // Update guest session
            if (isGuestSession && currentSessionId) {
                guestSessions.set(currentSessionId, {
                    accumulatedQuery,
                    conversationHistory,
                    createdAt: Date.now(),
                });
            }

            if (chatSession && !isGuestSession) {
                await prisma.chatMessage.create({
                    data: {
                        chatSessionId: chatSession.id,
                        role: MessageRole.ASSISTANT,
                        content: modifyMessage,
                    },
                });
            }

            return NextResponse.json({
                success: true,
                data: {
                    type: "clarification",
                    message: modifyMessage,
                    accumulatedQuery,
                    quickReplies: ["Change product type", "Change budget", "Change brand", "Add specifications"],
                },
                sessionId: currentSessionId,
            });
        }

        // Handle confirmed search
        if (confirmSearch && accumulatedQuery && accumulatedQuery.keyword) {
            return await executeSearch(accumulatedQuery, chatSession, userLocation, isGuestSession, currentSessionId, conversationHistory);
        }

        // Parse with context
        const parseResult = await parseWithContext(
            message,
            accumulatedQuery,
            conversationHistory.slice(0, -1), // Exclude current message (already in conversationHistory)
            userLocation || undefined
        );

        const { updatedQuery, responseMessage, responseType, quickReplies } = parseResult;

        // Update conversation history
        conversationHistory.push({ role: "assistant", content: responseMessage });

        // Save accumulated query
        if (isGuestSession && currentSessionId) {
            guestSessions.set(currentSessionId, {
                accumulatedQuery: updatedQuery,
                conversationHistory,
                createdAt: Date.now(),
            });
        } else if (chatSession) {
            await prisma.chatSession.update({
                where: { id: chatSession.id },
                data: {
                    accumulatedQuery: updatedQuery as object,
                },
            });
        }

        // Store assistant message for authenticated users
        if (chatSession && !isGuestSession) {
            await prisma.chatMessage.create({
                data: {
                    chatSessionId: chatSession.id,
                    role: MessageRole.ASSISTANT,
                    content: responseMessage,
                    parsedQuery: updatedQuery as object,
                },
            });
        }

        // Handle different response types
        if (responseType === "greeting") {
            return NextResponse.json({
                success: true,
                data: {
                    type: "greeting",
                    message: responseMessage,
                    accumulatedQuery: updatedQuery,
                    quickReplies,
                },
                sessionId: currentSessionId,
            });
        }

        if (responseType === "clarification") {
            return NextResponse.json({
                success: true,
                data: {
                    type: "clarification",
                    message: responseMessage,
                    accumulatedQuery: updatedQuery,
                    quickReplies,
                },
                sessionId: currentSessionId,
            });
        }

        if (responseType === "confirmation") {
            const confirmationMessage = buildConfirmationMessage(updatedQuery);

            // Update the stored message
            if (isGuestSession && currentSessionId) {
                const session = guestSessions.get(currentSessionId);
                if (session) {
                    session.conversationHistory[session.conversationHistory.length - 1].content = confirmationMessage;
                }
            }

            return NextResponse.json({
                success: true,
                data: {
                    type: "confirmation",
                    message: confirmationMessage,
                    accumulatedQuery: updatedQuery,
                    quickReplies: ["Yes, search now", "I want to modify"],
                },
                sessionId: currentSessionId,
            });
        }

        // responseType === "search" - execute search directly
        return await executeSearch(updatedQuery, chatSession, userLocation, isGuestSession, currentSessionId, conversationHistory);

    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process your request. Please try again." },
            { status: 500 }
        );
    }
}

// Execute the actual search
async function executeSearch(
    query: ParsedQuery,
    chatSession: { id: string } | null,
    userLocation: string | null | undefined,
    isGuestSession: boolean,
    sessionId: string | null | undefined,
    conversationHistory: ConversationMessage[]
) {
    // Validate query
    const queryValidation = validateParsedQuery(query);
    if (!queryValidation.valid) {
        return NextResponse.json({
            success: true,
            data: {
                type: "clarification",
                message: `Please provide: ${queryValidation.missingFields.join(", ")}`,
                accumulatedQuery: query,
                quickReplies: ["Laptop", "Phone", "Earbuds", "Other"],
            },
            sessionId,
        });
    }

    // Scrape products from all sources
    const scrapedProducts = await scrapeAllSources(query);

    if (scrapedProducts.length === 0) {
        const noResultsMessage = `Sorry, I couldn't find any products matching "${query.keyword}". Try a different search term or adjust your filters.`;

        if (chatSession && !isGuestSession) {
            await prisma.chatMessage.create({
                data: {
                    chatSessionId: chatSession.id,
                    role: MessageRole.ASSISTANT,
                    content: noResultsMessage,
                    parsedQuery: query as object,
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                type: "no_results",
                message: noResultsMessage,
                accumulatedQuery: query,
            },
            sessionId,
        });
    }

    // Calculate scores using recommendation engine
    const scoredProducts = calculateProductScores(scrapedProducts, {
        userLocation: query.userLocation || userLocation || "Jakarta",
    });

    // Get summary statistics
    const summary = getResultsSummary(scoredProducts);

    // Store results in database for authenticated users
    if (chatSession && !isGuestSession) {
        await prisma.chatMessage.create({
            data: {
                chatSessionId: chatSession.id,
                role: MessageRole.ASSISTANT,
                content: `Found ${scoredProducts.length} products for "${query.keyword}"`,
                parsedQuery: query as object,
            },
        });

        // Store search results (limit to 50)
        for (const product of scoredProducts.slice(0, 50)) {
            await prisma.searchResult.create({
                data: {
                    chatSessionId: chatSession.id,
                    productName: product.name,
                    price: product.price,
                    rating: product.rating,
                    soldCount: product.soldCount,
                    sellerLocation: product.sellerLocation,
                    imageUrl: product.imageUrl,
                    productLink: product.productLink,
                    source: product.source.toUpperCase() as any,
                    priceScore: product.priceScore,
                    shippingScore: product.shippingScore,
                    soldScore: product.soldScore,
                    ratingScore: product.ratingScore,
                    finalScore: product.finalScore,
                    estimatedShipping: product.estimatedShipping,
                    rank: product.rank,
                },
            });
        }
    }

    return NextResponse.json({
        success: true,
        data: {
            type: "results",
            products: scoredProducts,
            summary,
            accumulatedQuery: query,
        },
        sessionId,
    });
}
