import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";

// GET /api/chat/sessions - List user's chat sessions
export async function GET(request: NextRequest) {
    try {
        const accessToken = extractBearerToken(request.headers.get("Authorization"));
        if (!accessToken) {
            return NextResponse.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        const payload = verifyAccessToken(accessToken);
        if (!payload) {
            return NextResponse.json(
                { success: false, error: "Invalid token" },
                { status: 401 }
            );
        }

        const sessions = await prisma.chatSession.findMany({
            where: { userId: payload.userId },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                title: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: { messages: true },
                },
            },
            take: 50,
        });

        const formattedSessions = sessions.map((session) => ({
            id: session.id,
            title: session.title || "New Chat",
            createdAt: session.createdAt.toISOString(),
            updatedAt: session.updatedAt.toISOString(),
            messageCount: session._count.messages,
        }));

        return NextResponse.json({
            success: true,
            data: formattedSessions,
        });
    } catch (error) {
        console.error("Sessions API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch sessions" },
            { status: 500 }
        );
    }
}
