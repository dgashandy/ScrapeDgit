import nodemailer from "nodemailer";
import { setCache, getCache, deleteCache, otpCacheKey } from "@/lib/redis/cache";
import prisma from "@/lib/db";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const OTP_CACHE_TTL = OTP_EXPIRY_MINUTES * 60;

// Generate random OTP
export function generateOTP(): string {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < OTP_LENGTH; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
}

// Create email transporter
function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

// Send OTP email
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
    try {
        const transporter = createTransporter();

        await transporter.sendMail({
            from: process.env.SMTP_FROM || "ScrapeDgit <noreply@scrapedgit.com>",
            to: email,
            subject: "Your ScrapeDgit Verification Code",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #d946ef 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">ScrapeDgit</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Verification Code</h2>
            <p style="color: #4b5563;">Use the following code to verify your email address:</p>
            <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0ea5e9;">${otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              This code will expire in ${OTP_EXPIRY_MINUTES} minutes.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} ScrapeDgit. All rights reserved.
          </div>
        </div>
      `,
        });

        return true;
    } catch (error) {
        console.error("Failed to send OTP email:", error);
        return false;
    }
}

// Store OTP in Redis and database
export async function createAndSendOTP(userId: string, email: string): Promise<boolean> {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    try {
        // Store in Redis for quick verification
        await setCache(otpCacheKey(email), { otp, userId }, OTP_CACHE_TTL);

        // Store in database as backup
        await prisma.oTPVerification.create({
            data: {
                userId,
                code: otp,
                expiresAt,
            },
        });

        // Send email
        const sent = await sendOTPEmail(email, otp);
        return sent;
    } catch (error) {
        console.error("Failed to create OTP:", error);
        return false;
    }
}

// Verify OTP
export async function verifyOTP(email: string, code: string): Promise<{ valid: boolean; userId?: string }> {
    try {
        // First check Redis cache
        const cached = await getCache<{ otp: string; userId: string }>(otpCacheKey(email));

        if (cached && cached.otp === code) {
            // Delete from cache after successful verification
            await deleteCache(otpCacheKey(email));

            // Mark as used in database
            await prisma.oTPVerification.updateMany({
                where: {
                    userId: cached.userId,
                    code,
                    isUsed: false,
                },
                data: {
                    isUsed: true,
                },
            });

            return { valid: true, userId: cached.userId };
        }

        // Fallback to database check
        const dbOtp = await prisma.oTPVerification.findFirst({
            where: {
                code,
                isUsed: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                user: true,
            },
        });

        if (dbOtp && dbOtp.user.email.toLowerCase() === email.toLowerCase()) {
            await prisma.oTPVerification.update({
                where: { id: dbOtp.id },
                data: { isUsed: true },
            });

            return { valid: true, userId: dbOtp.userId };
        }

        return { valid: false };
    } catch (error) {
        console.error("OTP verification error:", error);
        return { valid: false };
    }
}
