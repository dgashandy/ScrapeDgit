import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { verifyOTP } from "@/lib/auth/otp";
import { generateTokenPair, getRefreshTokenExpiry } from "@/lib/auth/jwt";
import { checkAuthRateLimit } from "@/lib/redis/rateLimit";

const verifyOTPSchema = z.object({
    email: z.string().email("Invalid email address"),
    code: z.string().length(6, "OTP must be 6 digits"),
});

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const rateLimit = await checkAuthRateLimit(ip);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { success: false, error: `Too many attempts. Try again in ${rateLimit.resetIn} seconds.` },
                { status: 429 }
            );
        }

        const body = await request.json();
        const validation = verifyOTPSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { email, code } = validation.data;

        // Verify OTP
        const result = await verifyOTP(email.toLowerCase(), code);

        if (!result.valid || !result.userId) {
            return NextResponse.json(
                { success: false, error: "Invalid or expired OTP" },
                { status: 401 }
            );
        }

        // Mark user as verified
        const user = await prisma.user.update({
            where: { id: result.userId },
            data: { isVerified: true },
        });

        // Generate tokens
        const tokens = generateTokenPair({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Store refresh token session
        await prisma.session.create({
            data: {
                userId: user.id,
                refreshToken: tokens.refreshToken,
                expiresAt: getRefreshTokenExpiry(),
                userAgent: request.headers.get("user-agent") || undefined,
                ipAddress: ip,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Email verified successfully",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isVerified: user.isVerified,
                    avatarUrl: user.avatarUrl,
                    location: user.location,
                },
                tokens,
            },
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to verify OTP. Please try again." },
            { status: 500 }
        );
    }
}
