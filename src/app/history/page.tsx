"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { History, MessageSquare, Package, Trash2, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/lib/auth/AuthContext";

interface ChatSession {
    id: string;
    title: string | null;
    messageCount: number;
    resultCount: number;
    lastMessage: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function HistoryPage() {
    const { isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
    const router = useRouter();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/auth/login?callbackUrl=/history");
            return;
        }

        if (!authLoading && isAuthenticated && accessToken) {
            fetchHistory();
        }
    }, [authLoading, isAuthenticated, accessToken, router]);

    const fetchHistory = async () => {
        try {
            const response = await fetch("/api/chat/history", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setSessions(data.data);
            } else {
                setError(data.error || "Failed to load history");
            }
        } catch (err) {
            setError("Failed to load chat history");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (sessionId: string) => {
        if (!confirm("Are you sure you want to delete this chat session?")) return;

        try {
            const response = await fetch(`/api/chat/${sessionId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            }
        } catch (err) {
            console.error("Failed to delete session:", err);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return "Today";
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
            <Navbar />

            <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <History className="w-6 h-6" />
                            Chat History
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            View and continue your previous searches
                        </p>
                    </div>
                    <Link href="/chat">
                        <Button>New Search</Button>
                    </Link>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {sessions.length === 0 ? (
                    <div className="card p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No chat history yet
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Start searching for products to build your history
                        </p>
                        <Link href="/chat">
                            <Button>Start Searching</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((chatSession) => (
                            <div
                                key={chatSession.id}
                                className="card p-4 hover:shadow-lg transition-shadow group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <Link href={`/chat?session=${chatSession.id}`} className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-500 transition-colors">
                                            {chatSession.title || "Untitled Search"}
                                        </h3>
                                        {chatSession.lastMessage && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                                                {chatSession.lastMessage}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                {chatSession.messageCount} messages
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Package className="w-3 h-3" />
                                                {chatSession.resultCount} products
                                            </span>
                                            <span>{formatDate(chatSession.updatedAt)}</span>
                                        </div>
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(chatSession.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                        <Link href={`/chat?session=${chatSession.id}`}>
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
