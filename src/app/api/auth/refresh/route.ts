import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { verifyRefreshToken, generateTokenPair, getRefreshTokenExpiry } from "@/lib/auth/jwt";

const refreshSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = refreshSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { refreshToken } = validation.data;

        // Verify refresh token
        const payload = verifyRefreshToken(refreshToken);

        if (!payload) {
            return NextResponse.json(
                { success: false, error: "Invalid or expired refresh token" },
                { status: 401 }
            );
        }

        // Check if session exists in database
        const session = await prisma.session.findUnique({
            where: { refreshToken },
            include: { user: true },
        });

        if (!session || session.expiresAt < new Date()) {
            // Delete expired session if exists
            if (session) {
                await prisma.session.delete({ where: { id: session.id } });
            }

            return NextResponse.json(
                { success: false, error: "Session expired. Please login again." },
                { status: 401 }
            );
        }

        // Generate new token pair
        const tokens = generateTokenPair({
            userId: session.user.id,
            email: session.user.email,
            role: session.user.role,
        });

        // Update session with new refresh token
        await prisma.session.update({
            where: { id: session.id },
            data: {
                refreshToken: tokens.refreshToken,
                expiresAt: getRefreshTokenExpiry(),
            },
        });

        return NextResponse.json({
            success: true,
            message: "Token refreshed successfully",
            data: { tokens },
        });
    } catch (error) {
        console.error("Token refresh error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to refresh token" },
            { status: 500 }
        );
    }
}
