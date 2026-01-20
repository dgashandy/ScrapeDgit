import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { generateTokenPair, getRefreshTokenExpiry } from "@/lib/auth/jwt";
import { checkAuthRateLimit } from "@/lib/redis/rateLimit";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
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
        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { email, password } = validation.data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
            return NextResponse.json(
                { success: false, error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json(
                { success: false, error: "Invalid email or password" },
                { status: 401 }
            );
        }

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
            message: "Login successful",
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
        console.error("Login error:", error);
        return NextResponse.json(
            { success: false, error: "Login failed. Please try again." },
            { status: 500 }
        );
    }
}
