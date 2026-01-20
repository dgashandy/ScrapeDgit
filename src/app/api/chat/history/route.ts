import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
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

        // Get pagination params
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // Get chat sessions with message count
        const [sessions, total] = await Promise.all([
            prisma.chatSession.findMany({
                where: { userId: payload.userId },
                orderBy: { updatedAt: "desc" },
                skip,
                take: limit,
                include: {
                    _count: {
                        select: { messages: true, results: true },
                    },
                    messages: {
                        take: 1,
                        orderBy: { createdAt: "desc" },
                    },
                },
            }),
            prisma.chatSession.count({
                where: { userId: payload.userId },
            }),
        ]);

        const formattedSessions = sessions.map((session) => ({
            id: session.id,
            title: session.title,
            messageCount: session._count.messages,
            resultCount: session._count.results,
            lastMessage: session.messages[0]?.content.substring(0, 100) || null,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        }));

        return NextResponse.json({
            success: true,
            data: formattedSessions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Chat history error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch chat history" },
            { status: 500 }
        );
    }
}
