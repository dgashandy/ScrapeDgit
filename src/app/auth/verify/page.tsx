"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }

        // Auto-submit when complete
        if (newOtp.every((digit) => digit) && newOtp.join("").length === 6) {
            handleVerify(newOtp.join(""));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleVerify = async (code: string) => {
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });

            const data = await response.json();

            if (data.success) {
                // Store tokens
                localStorage.setItem("accessToken", data.data.tokens.accessToken);
                localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
                router.push("/chat");
            } else {
                setError(data.error || "Verification failed");
                setOtp(["", "", "", "", "", ""]);
                document.getElementById("otp-0")?.focus();
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setIsResending(true);

        try {
            const response = await fetch("/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setResendCooldown(60);
            } else {
                setError(data.error || "Failed to resend OTP");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-950 dark:to-dark-900">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold gradient-text">ScrapeDgit</span>
                    </Link>
                    <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
                        Verify your email
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        We sent a 6-digit code to
                    </p>
                    <p className="text-primary-500 font-medium">{email}</p>
                </div>

                {/* Card */}
                <div className="card p-8">
                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-center gap-3 mb-8">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-14 text-center text-2xl font-bold rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                disabled={isLoading}
                            />
                        ))}
                    </div>

                    <Button
                        onClick={() => handleVerify(otp.join(""))}
                        className="w-full"
                        size="lg"
                        isLoading={isLoading}
                        disabled={otp.some((d) => !d)}
                    >
                        Verify Email
                    </Button>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Didn&apos;t receive the code?{" "}
                            {resendCooldown > 0 ? (
                                <span className="text-gray-400">Resend in {resendCooldown}s</span>
                            ) : (
                                <button
                                    onClick={handleResend}
                                    disabled={isResending}
                                    className="text-primary-500 hover:text-primary-600 font-medium inline-flex items-center gap-1"
                                >
                                    {isResending ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : null}
                                    Resend
                                </button>
                            )}
                        </p>
                    </div>

                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        <Link href="/auth/login" className="text-primary-500 hover:text-primary-600 font-medium">
                            ← Back to login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
