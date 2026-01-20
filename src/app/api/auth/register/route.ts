import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { generateTokenPair, getRefreshTokenExpiry } from "@/lib/auth/jwt";
import { createAndSendOTP } from "@/lib/auth/otp";
import { AuthProvider } from "@prisma/client";

const registerSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    location: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { email, password, name, location } = validation.data;

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return NextResponse.json(
                { success: false, error: passwordValidation.errors[0] },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: "Email already registered" },
                { status: 409 }
            );
        }

        // Hash password and create user
        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                name,
                passwordHash,
                location,
                authProvider: AuthProvider.EMAIL,
                isVerified: false,
            },
        });

        // Send OTP for email verification
        await createAndSendOTP(user.id, user.email);

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
                ipAddress: request.headers.get("x-forwarded-for") || undefined,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Registration successful. Please verify your email.",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    isVerified: user.isVerified,
                },
                tokens,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { success: false, error: "Registration failed. Please try again." },
            { status: 500 }
        );
    }
}
