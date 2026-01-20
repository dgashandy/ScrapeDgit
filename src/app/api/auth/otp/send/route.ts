import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { createAndSendOTP } from "@/lib/auth/otp";
import { checkAuthRateLimit } from "@/lib/redis/rateLimit";

const sendOTPSchema = z.object({
    email: z.string().email("Invalid email address"),
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
        const validation = sendOTPSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { email } = validation.data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            // Don't reveal if user exists or not
            return NextResponse.json({
                success: true,
                message: "If an account exists with this email, an OTP has been sent.",
            });
        }

        // Send OTP
        const sent = await createAndSendOTP(user.id, user.email);

        if (!sent) {
            return NextResponse.json(
                { success: false, error: "Failed to send OTP. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "OTP sent to your email address.",
        });
    } catch (error) {
        console.error("Send OTP error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send OTP. Please try again." },
            { status: 500 }
        );
    }
}
