import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Authenticate user
        const accessToken = extractBearerToken(request.headers.get("Authorization"));
        const payload = accessToken ? verifyAccessToken(accessToken) : null;

        if (!payload) {
            return NextResponse.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        const sessionId = params.id;

        // Get chat session with messages and results
        const session = await prisma.chatSession.findUnique({
            where: {
                id: sessionId,
                userId: payload.userId,
            },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
                results: {
                    orderBy: { rank: "asc" },
                },
            },
        });

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Chat session not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: session.id,
                title: session.title,
                accumulatedQuery: session.accumulatedQuery,
                messages: session.messages.map((msg) => ({
                    id: msg.id,
                    role: msg.role.toLowerCase(),
                    content: msg.content,
                    parsedQuery: msg.parsedQuery,
                    createdAt: msg.createdAt,
                })),
                results: session.results.map((result) => ({
                    id: result.id,
                    rank: result.rank,
                    name: result.productName,
                    price: result.price,
                    rating: result.rating,
                    soldCount: result.soldCount,
                    sellerLocation: result.sellerLocation,
                    imageUrl: result.imageUrl,
                    productLink: result.productLink,
                    source: result.source.toLowerCase(),
                    finalScore: result.finalScore,
                    estimatedShipping: result.estimatedShipping,
                })),
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
            },
        });
    } catch (error) {
        console.error("Get chat session error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch chat session" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Authenticate user
        const accessToken = extractBearerToken(request.headers.get("Authorization"));
        const payload = accessToken ? verifyAccessToken(accessToken) : null;

        if (!payload) {
            return NextResponse.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        const sessionId = params.id;

        // Delete chat session (cascade deletes messages and results)
        await prisma.chatSession.delete({
            where: {
                id: sessionId,
                userId: payload.userId,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Chat session deleted",
        });
    } catch (error) {
        console.error("Delete chat session error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete chat session" },
            { status: 500 }
        );
    }
}
